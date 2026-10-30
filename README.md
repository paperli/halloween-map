# SF Halloween map

An interactive guide to four San Francisco Halloween neighborhoods. The map fills the screen; **Explore** opens a neighborhood guide with directions and a four-stop Google Maps driving tour. On phones, the guide is a large, independently scrollable bottom sheet. Close it, press Escape, tap outside it, or choose **Show on map** to return to the map.

## Run locally

No build step, account, or API key is required.

```sh
python3 -m http.server 8000
```

Open http://localhost:8000. Leaflet 1.9.4 and all styling are included in the repository. Only the map tiles require an external service; directions open Google Maps.

## GitHub Pages

In **Settings → Pages**, choose **Deploy from a branch**, then **main** and **/ (root)**. The site will be available at:

https://paperli.github.io/sf-halloween-map/

All local asset paths are relative, so the site works at this project subpath or a custom domain. There are no deployment secrets or environment variables to configure. The included `.nojekyll` file lets Pages serve the files directly.

## Map tiles

The basemap uses **https://tile.openstreetmap.org/{z}/{x}/{y}.png** with linked OpenStreetMap attribution. The previous default used CARTO, a separate tile service, even though its map data came from OpenStreetMap. The CARTO styles and selector have been removed.

The standard OSM tile service requires no API key. Respect its [tile usage policy](https://operations.osmfoundation.org/policies/tiles/): preserve attribution, normal browser caching and referrers; do not bulk download or prefetch tiles. Public tiles are best-effort and can block clients or become unavailable. If traffic grows beyond a small community map, review hosting options. The app shows a retry action when tile requests fail. Regions, pins, and the guide remain available without basemap tiles.

## Edit the guide

Neighborhood descriptions, coordinates, street corridors, and viewing times are in the `spots` array in `app.js`. These are approximate guide areas, not surveyed boundaries. Confirm local event times and closures before relying on them. The four-stop tour link is in `index.html`.

## Checks

```sh
npm ci
npx playwright install chromium
npm run check
npm test
```

The browser checks cover desktop, tablet, small phones, landscape, drawer scrolling and dismissal, keyboard access, neighborhood selection, directions, map controls, viewport resizing, and tile failure/retry. They serve the app under `/sf-halloween-map/` to catch project-path issues and stub tile images for reproducible checks without relying on the public tile service.

To use an installed Chromium instead of Playwright's download:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm test
```

Leaflet's license is included in `assets/leaflet/LICENSE`.
