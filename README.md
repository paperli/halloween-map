# SF + LA Halloween map

An interactive guide to four San Francisco and five Greater Los Angeles Halloween neighborhoods. The map fills the screen; **Explore** opens a neighborhood guide with directions and a driving tour for the current area. On phones, the guide is a large, independently scrollable bottom sheet. Close it, press Escape, tap outside it, or choose **Show on map** to return to the map.

## A guide that follows the map

Panning, zooming, or using **My location** updates the guide when the map center enters the SF or LA coverage area. The title, neighborhood cards, pins, shaded areas, street highlights, count, directions, and driving tour change together. The switch never pans or zooms the map on its own, and movement within the same city preserves guide scroll and open popups.

Use **San Francisco** or **Los Angeles** in the guide to jump between cities. **All** fits the neighborhoods in the current city. When both cities are visible at a wide zoom, or the center is outside coverage, the guide offers both city choices and hides the city-specific tour. **All** then fits both cities.

On arrival, an existing browser location permission lets the map automatically center near the visitor and select the matching guide. Without that permission, returning visitors start in their last viewed city; new visitors see both cities and can choose **Use my location**, **San Francisco**, or **Los Angeles**. The app never opens a browser permission prompt until the visitor presses a location button. If a visitor starts navigating while an automatic location check is pending, that navigation takes priority over a late result.

LA stops: Toluca Lake, Burbank / Magnolia Park, Angelino Heights, Venice Canals, and Sierra Madre / Alegria Avenue. Each links to a local guide. The optional five-stop driving tour spans Greater LA; allow time for traffic and parking. Sources and map-coordinate provenance are recorded in [DATA_SOURCES.md](DATA_SOURCES.md).

## Run locally

No build step, account, or API key is required.

```sh
python3 -m http.server 8000
```

Open http://localhost:8000. Leaflet 1.9.4 and all styling are included in the repository. Only the map tiles require an external service; directions open Google Maps.

## GitHub Pages

In **Settings → Pages**, choose **Deploy from a branch**, then **main** and **/ (root)**. The site will be available at:

https://paperli.github.io/halloween-map/

All local asset paths are relative, so the site works at this project subpath or a custom domain. There are no deployment secrets or environment variables to configure. The included `.nojekyll` file lets Pages serve the files directly.

## Map tiles

The basemap uses **https://tile.openstreetmap.org/{z}/{x}/{y}.png** with linked OpenStreetMap attribution. The previous default used CARTO, a separate tile service, even though its map data came from OpenStreetMap. The CARTO styles and selector have been removed.

The standard OSM tile service requires no API key. Respect its [tile usage policy](https://operations.osmfoundation.org/policies/tiles/): preserve attribution, normal browser caching and referrers; do not bulk download or prefetch tiles. Public tiles are best-effort and can block clients or become unavailable. If traffic grows beyond a small community map, review hosting options. The app shows a retry action when tile requests fail. Regions, pins, and the guide remain available without basemap tiles.

## Your location

With location permission already granted, the site requests one position at startup and opens a neighborhood-scale view near the visitor. Otherwise, tap **Use my location** or the crosshair **My location** button to grant access. The blue dot shows the reported position and the circle shows its accuracy. Tap the crosshair again for a fresh, closer view. The app does not continuously track, save precise coordinates, or send them to an application backend. As with any map movement, the basemap service receives requests for the tiles around the displayed area.

Only the last viewed city ID (`sf` or `la`) is remembered in browser storage under `halloween-map:city`. If storage or permission queries are unavailable, city selection and manual location access still work. No IP-geolocation service or extra API key is used.

This uses the browser’s built-in geolocation service, with no API key. It requires location permission and HTTPS (GitHub Pages provides this), or localhost for development. Denied permissions, unavailable location services, and timeouts show instructions for trying again. If a refresh fails, the previous dot remains and the message explains that it is the last found position.

## Edit the guide

Neighborhood descriptions, coordinates, street corridors, source links, and viewing advice are in `guides.js`. Each city has its own `spots`, `tourOrder`, and `coverageBounds`; the latter are approximate areas for switching guides, not administrative boundaries. Tour URLs are generated from that city's stops. LA data describes recurring neighborhood traditions and does not promise current-year participation or fixed display hours. Confirm local event times and closures before relying on them.

## Checks

```sh
npm ci
npx playwright install chromium
npm run check
npm test
```

The browser checks cover desktop, tablet, small phones, landscape, drawer scrolling and dismissal, keyboard access, neighborhood selection, directions, map controls, viewport resizing, tile failure/retry, and location success, refresh, denied access, unavailable services, timeouts, and unsupported or insecure browsers. Startup checks cover automatic SF/LA positioning with existing consent, first-visit city/location choices, remembered cities, blocked storage, missing permission APIs, and delayed results after navigation. They also exercise SF/LA switching through map movement, city jumps, geolocation, wide views, and areas outside coverage, including route isolation and scroll preservation. They serve the app under `/halloween-map/` to catch project-path issues and stub tile images for reproducible checks without relying on the public tile service.

To use an installed Chromium instead of Playwright's download:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm test
```

Leaflet's license is included in `assets/leaflet/LICENSE`.
