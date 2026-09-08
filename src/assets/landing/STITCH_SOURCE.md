# Home page design assets

Source: Stitch project **Road India Emergency Support** (`6865128074707119817`), screen **Road India - Mobile Landing Page** (`3a225ae978684bde96ca1fe3a6962905`). Retrieved September 8, 2026 with the Stitch screen API and `curl -L`.

The original HTML, full-size screenshot and sample repair photograph are saved locally in the ignored `.stitch-reference` directory as `home.html`, `home-full.png` and `proof-reference.png`.

- `hazard-map.svg` is the original decorative map artwork extracted from the screen HTML, retained for reference. The home page now uses the live state-resolution map in `HomeIndiaMap.jsx`, with zoom disabled and dragging limited around India's outer bounds.
- `home-inter.woff2` and `home-montserrat.woff2` are the Latin variable web fonts from Google Fonts. See the accompanying SIL Open Font License files. Other writing systems use the browser's sans-serif fallback.
- `home-font-6.ttf` is a 20-icon subset of Material Symbols Outlined from Google Fonts. See `SYMBOLS-LICENSE.txt`.
- The reference logo URL returned HTTP 403. The existing Road India SVG logo is used instead.

Report counts, resolution times, feedback and repair photos come from app data. The sample photograph is not used as repair evidence. Missing photos and ratings have explicit empty states. Government endorsement, proximity, automatic dispatch and verification claims from the design were replaced with descriptions supported by the app.

Emergency links use the official [NHAI 1033 helpline](https://ihmcl.co.in/24x7-national-highways-helpline-1033-page/) and [India's 112 emergency service](https://112.gov.in/).
