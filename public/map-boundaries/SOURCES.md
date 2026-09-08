# Administrative map boundaries

Retrieved 8 September 2026. These are versioned reference snapshots, not a claim
that every boundary reflects current administrative arrangements. Geometry is
used for visual analytics, not surveying. Report coordinates determine district,
municipal and ward membership. A report exactly on a shared edge is assigned to
the first feature in the dataset, once per level.

## Districts

- Publisher: geoBoundaries gbOpen; source: Pathways Data Pvt. Ltd., lgdirectory.gov.in.
- Version: IND-ADM2-76128533, represents 2021, source update 19 January 2023.
- Metadata: https://www.geoboundaries.org/api/current/gbOpen/IND/ADM2/
- Pinned geometry: https://media.githubusercontent.com/media/wmgeolab/geoBoundaries/9469f09/releaseData/gbOpen/IND/ADM2/geoBoundaries-IND-ADM2_simplified.geojson
- License: Open Data Commons Open Database License 1.0, https://opendatacommons.org/licenses/odbl/1-0/
- The downloaded geometry contains **735 features** (the metadata advertises 736).
  Missing geometry is not fabricated; unmatched report locations remain pins.
- `districts.json` is a derived database offered under ODbL 1.0. Changes: valid
  polygon extraction, up to 0.0001-degree simplification, coordinate precision,
  deterministic removal of overlapping interiors, compact names/IDs and bounds.

## Municipalities and wards

Pinned DataMeet repository: https://github.com/datameet/Municipal_Spatial_Data/tree/9b4d1c2ece54cdeb6f5e8bad9ccad7844f783b17

| File | Source path | Coverage / date |
| --- | --- | --- |
| bengaluru.json | Bangalore/BBMP.geojson | 243 wards, 2022 delimitation, from KSRSAC |
| kolkata.json | Kolkata/kolkata.geojson | 141 source wards; date unspecified |
| chennai.json | Chennai/Wards.geojson | 201 source wards; date unspecified; Transparent Chennai |
| delhi.json | Delhi/Delhi_Wards.geojson | 290 source wards/charges, including cantonment; date unspecified |
| mumbai.json | Mumbai/BMC_Wards.geojson | 24 administrative wards; date unspecified |
| hyderabad.json | Hyderabad/ghmc-wards.geojson and ghmc-area.geojson | 145 available wards; OSM objects with 2017–2018 edit timestamps, not a survey date |
| jaipur.json | Jaipur/Jaipur_Wards.geojson and Jaipur_Boundary.geojson | 77 source wards; date unspecified |

The city source readmes are included alongside these assets as `*.SOURCE.md`.
All listed DataMeet city folders except Hyderabad explicitly license their data
under **Creative Commons Attribution-ShareAlike 2.5 India**:
https://creativecommons.org/licenses/by-sa/2.5/in/ . Their derived ward assets and
municipal geometries retain that license. Credit DataMeet and the original
contributors identified in the readmes. Kolkata and Mumbai credit the Pune
chapter of DataMeet Trust, Bangalore, India.

Hyderabad geometry consists of OpenStreetMap relations: © OpenStreetMap
contributors, https://www.openstreetmap.org/copyright ; **ODbL 1.0** applies to
that source and derived geometry. The DataMeet repository's general license does
not replace the upstream OpenStreetMap database license.

Changes: polygon repair, ward ID grouping, shared-edge simplification up to
0.00001 degrees only for valid polygon coverages (otherwise detail is retained),
coordinate precision and removal of overlapping interiors. Municipal outlines
are dissolved from the available wards, except Hyderabad and Jaipur, which also
include their supplied municipal outlines. No convex hull or invented district,
neighbourhood or municipal coverage is generated. Older ward footprints may omit
subsequent city extensions; they are explicitly described as snapshot extents.

`municipalities.json` collects the municipal outlines (each retains its source
license) and rendering masks for districts. Masks remove municipal coverage from
district fills to avoid stacked opacity. They do not alter the complete district
geometry used for counting. These masks derive from the district and municipal
sources above; retain all corresponding attribution and license notices when
redistributing. The `remainder` in ward files similarly preserves municipal
coverage where ward geometry is missing.

## Reproduction and validation

Use Python with Shapely 2.1.2 installed. Download the pinned district geometry and
the ZIP of the pinned municipal repository, then run:

    python scripts/prepareAdministrativeBoundaries.py DISTRICTS.geojson MUNICIPAL.zip

The script validates polygon validity and pairwise non-overlapping interiors for
districts, each city's wards, and the combined municipality/district fallback
layer. Dataset assets are served locally; the app never queries third-party
boundary services or sends report coordinates to them.

State sources and their separate license are documented in
`src/data/indiaStates.SOURCE.md` in the project repository.
