# India overview boundaries

`indiaStates.json` is derived from geoBoundaries gbOpen IND ADM1, boundary ID
`IND-ADM1-1811400`, pinned repository revision `9469f09` (retrieved 2026-09-08).

- Data credit: DataMeet India community, Election Commission of India; distributed by geoBoundaries.
- Original data licence: [Creative Commons Attribution 2.5 India](https://creativecommons.org/licenses/by/2.5/in/).
- [Source and licence metadata](https://www.geoboundaries.org/api/current/gbOpen/IND/ADM1/).
- [Pinned input GeoJSON](https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/IND/ADM1/geoBoundaries-IND-ADM1_simplified.geojson).
- [Original source project](https://github.com/datameet/maps).

The input contains 36 features, including Ladakh, Telangana, and the merged
Dadra and Nagar Haveli and Daman and Diu territory. The metadata lists a 2011
represented year and a January 2023 source update; this is a versioned overview
dataset, not a claim of newly surveyed boundaries.

Changes: simplified rings at 0.01-degree tolerance for zooms below 6, retained
small rings, rounded coordinates to five decimals, normalized display-name
accents, retained ISO codes and original bounding boxes. Boundaries are an
approximate visualization and may differ slightly from the base map.

Rebuild using `node scripts/prepareIndiaBoundaries.mjs <downloaded-input.geojson>`.
Attribution is also included on the map while the state layer is visible.
