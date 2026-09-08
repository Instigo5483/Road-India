"""Build local map assets from pinned sources; requires Shapely 2.1.2.

python scripts/prepareAdministrativeBoundaries.py DISTRICTS.geojson MUNICIPAL.zip
See public/map-boundaries/SOURCES.md for source versions and licenses.
"""
import argparse
import json
from pathlib import Path
import sys
import zipfile

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('districts')
parser.add_argument('municipal_zip')
parser.add_argument('--gis-path')
args = parser.parse_args()
if args.gis_path:
    sys.path.insert(0, args.gis_path)

from shapely import make_valid, set_precision, STRtree, union_all, coverage_is_valid, coverage_simplify
from shapely.geometry import shape, mapping, MultiPolygon, Polygon

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/map-boundaries'
OUT.mkdir(parents=True, exist_ok=True)
archive = zipfile.ZipFile(args.municipal_zip)


def read_city(path):
    entry = next(n for n in archive.namelist() if n.endswith('/' + path))
    return json.loads(archive.read(entry))['features']


def polygonal(geom):
    geom = make_valid(geom)
    if isinstance(geom, (Polygon, MultiPolygon)):
        return geom
    return union_all([part for part in geom.geoms if isinstance(part, (Polygon, MultiPolygon))])


def clean(geom, tolerance=0):
    return set_precision(polygonal(set_precision(polygonal(geom).simplify(tolerance, preserve_topology=True), 0.000001)), 0)


def disjoint(geometries):
    """Resolve source slivers deterministically; never stack adjacent fills."""
    tree = STRtree(geometries)
    result = []
    for i, geom in enumerate(geometries):
        previous = [result[j] for j in tree.query(geom) if j < i]
        result.append(polygonal(geom.difference(union_all(previous))) if previous else geom)
    return result


def feature(code, name, geom, **properties):
    if geom.is_empty:
        raise ValueError('Empty boundary: ' + code)
    return dict(type='Feature', properties=dict(code=code, name=name, **properties),
                bbox=list(geom.bounds), geometry=mapping(geom))


def write(name, value):
    # Round serialized coordinates too (GEOS stores binary floating-point values).
    def rounded(item):
        if isinstance(item, float):
            return round(item, 8)
        if isinstance(item, (list, tuple)):
            return [rounded(x) for x in item]
        if isinstance(item, dict):
            return {k: rounded(v) for k, v in item.items()}
        return item
    (OUT / name).write_text(json.dumps(rounded(value), ensure_ascii=False, separators=(',', ':')), encoding='utf-8')


configs = [
    ('bengaluru', 'Bengaluru', 'Bangalore/BBMP.geojson', 'KGISWardNo', 'KGISWardName', '2022', None),
    ('kolkata', 'Kolkata', 'Kolkata/kolkata.geojson', 'WARD', None, 'undated', None),
    ('chennai', 'Chennai', 'Chennai/Wards.geojson', 'Ward_No', None, 'undated', None),
    ('delhi', 'Delhi', 'Delhi/Delhi_Wards.geojson', 'Ward_No', 'Ward_Name', 'undated', None),
    ('mumbai', 'Mumbai', 'Mumbai/BMC_Wards.geojson', 'name', None, 'undated', None),
    ('hyderabad', 'Hyderabad', 'Hyderabad/ghmc-wards.geojson', '@id', 'name', '2017–2018', 'Hyderabad/ghmc-area.geojson'),
    ('jaipur', 'Jaipur', 'Jaipur/Jaipur_Wards.geojson', 'WARD_NO', None, 'undated', 'Jaipur/Jaipur_Boundary.geojson'),
]
cities, city_shapes, wards_by_city = [], [], {}
for code, name, path, id_key, name_key, vintage, boundary in configs:
    grouped = {}
    for row in read_city(path):
        p = row['properties']
        number = str(p[id_key]).strip()
        title = str(p.get(name_key) or '').strip() if name_key else ''
        if not title.lower().startswith('ward '):
            title = f'Ward {number}' + (f' · {title}' if title else '')
        group = grouped.setdefault(number, dict(name=title, geometries=[]))
        group['geometries'].append(shape(row['geometry']))
    ward_geoms = disjoint([clean(union_all(g['geometries'])) for g in grouped.values()])
    # Simplify shared edges together. Independent simplification opens seams
    # between adjacent wards and leaves hundreds of holes in a city outline.
    if coverage_is_valid(ward_geoms):
        ward_geoms = list(coverage_simplify(ward_geoms, .00001))
    ward_union = union_all(ward_geoms)
    municipal = clean(union_all([shape(r['geometry']) for r in read_city(boundary)])) if boundary else ward_union
    # Separate city outlines supplied by a source can have small gaps against wards.
    # Retain ward coverage in the municipal envelope, without inventing a hull.
    municipal = polygonal(union_all([municipal, ward_union]))
    city_shapes.append(municipal)
    props = dict(kind='city', vintage=vintage, source='osm' if code == 'hyderabad' else 'datameet',
                 extent='boundary' if boundary else 'wards')
    cities.append(feature(code, name, municipal, **props))
    wards = [feature(f'{code}:{number}', group['name'], geom, kind='ward', city=code, vintage=vintage, source=props['source'])
             for (number, group), geom in zip(grouped.items(), ward_geoms)]
    remainder = polygonal(municipal.difference(ward_union))
    write(f'{code}.json', dict(type='FeatureCollection', features=wards,
          remainder=mapping(remainder) if not remainder.is_empty else None))
    wards_by_city[code] = ward_geoms
    print(name, len(wards), 'wards')
    source_readme = next(n for n in archive.namelist() if n.endswith('/' + path.split('/')[0] + '/Readme.md'))
    (OUT / f'{code}.SOURCE.md').write_bytes(archive.read(source_readme))

raw = json.loads(Path(args.districts).read_text(encoding='utf-8'))['features']
district_shapes = disjoint([clean(shape(row['geometry']), .0001) for row in raw])
districts = [feature(row['properties']['shapeID'], row['properties']['shapeName'], geom,
                    kind='district', vintage='2021', source='geoboundaries')
             for row, geom in zip(raw, district_shapes)]
write('districts.json', dict(type='FeatureCollection', features=districts))

city_union = union_all(city_shapes)
masks = {}
for row, geom in zip(districts, district_shapes):
    if geom.intersects(city_union):
        remainder = polygonal(geom.difference(city_union))
        masks[row['properties']['code']] = mapping(remainder) if not remainder.is_empty else None
write('municipalities.json', dict(type='FeatureCollection', features=cities, districtMasks=masks))

# Check geometry and shared area, including the mixed fallback layer.
def validate(geoms):
    tree = STRtree(geoms)
    for i, geom in enumerate(geoms):
        assert geom.is_valid and not geom.is_empty
        for j in tree.query(geom):
            if j > i:
                assert geom.intersection(geoms[j]).area < 1e-10, (i, j, 'overlapping interiors')

validate(district_shapes)
for geoms in wards_by_city.values():
    validate(geoms)
fallback = [shape(masks[f['properties']['code']]) if masks.get(f['properties']['code']) else g
            for f, g in zip(districts, district_shapes)
            if f['properties']['code'] not in masks or masks[f['properties']['code']] is not None]
validate(fallback + city_shapes)
print(len(districts), 'districts; all boundary interiors and city fallback masks verified')
