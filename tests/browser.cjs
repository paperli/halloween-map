const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const http = require('node:http');
const vm = require('node:vm');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const prefix = '/halloween-map/';
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' };

const server = http.createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    if (!pathname.startsWith(prefix)) throw new Error('Outside project path');
    const file = path.resolve(root, pathname.slice(prefix.length) || 'index.html');
    if (!file.startsWith(root + path.sep)) throw new Error('Outside root');
    const body = await fs.readFile(file);
    response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'text/plain' });
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end('Not found');
  }
});

(async () => {
  let browser;
  try {
    const guidesCode = await fs.readFile(path.join(root, 'guides.js'), 'utf8');
    const geometryCode = await fs.readFile(path.join(root, 'geometry.js'), 'utf8');
    const guides = vm.runInNewContext(geometryCode + guidesCode + '; HALLOWEEN_GUIDES');
    const ids = new Set();
    for (const region of guides) {
      assert.equal(region.tourOrder.length, region.spots.length);
      assert.equal(new Set(region.tourOrder).size, region.spots.length, 'Each tour visits every stop once');
      for (const id of region.tourOrder) assert.ok(region.spots.some(spot => spot.id === id), 'Tour stays within its city');
      const [[south, west], [north, east]] = region.coverageBounds;
      for (const spot of region.spots) {
        assert.ok(!ids.has(spot.id), 'Unique neighborhood IDs');
        ids.add(spot.id);
        assert.ok(spot.center[0] >= south && spot.center[0] <= north && spot.center[1] >= west && spot.center[1] <= east, 'Spot is in its switching area');
        if (region.id === 'la') assert.ok(new URL(spot.source.url).protocol === 'https:', 'LA sources use HTTPS');
        for (const line of spot.corridors) assert.ok(line.coords.length >= 2, 'A corridor has at least two points');
      }
    }
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const url = 'http://127.0.0.1:' + server.address().port + prefix;
    browser = await chromium.launch({
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
      args: ['--no-sandbox', '--disable-dev-shm-usage']
    });
    const profiles = [
      { name: 'phone', width: 390, height: 844, touch: true },
      { name: 'small phone', width: 320, height: 568, touch: true },
      { name: 'landscape', width: 844, height: 390, touch: true },
      { name: 'tablet', width: 768, height: 1024, touch: true },
      { name: 'desktop', width: 1440, height: 900, touch: false }
    ];

    for (const profile of profiles) {
      const context = await browser.newContext({
        viewport: { width: profile.width, height: profile.height },
        hasTouch: profile.touch,
        reducedMotion: 'reduce',
        permissions: ['geolocation'],
        geolocation: { latitude: 37.758, longitude: -122.442, accuracy: 25 }
      });
      await context.addInitScript(() => {
        // Treat the main interaction suite as a first visit without location consent.
        Object.defineProperty(navigator, 'permissions', { value: { query: async () => ({ state: 'prompt' }) } });
        window.locationRequests = 0;
        const getPosition = navigator.geolocation.getCurrentPosition.bind(navigator.geolocation);
        navigator.geolocation.getCurrentPosition = (...args) => {
          window.locationRequests++;
          return getPosition(...args);
        };
      });
      const page = await context.newPage();
      const errors = [];
      const externalRequests = [];
      const failedAssets = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('response', response => {
        if (response.url().startsWith(url) && response.status() >= 400) failedAssets.push(response.url());
      });
      let failTiles = false;
      await page.route('**/*', async route => {
        const requestUrl = route.request().url();
        if (requestUrl === url + 'assets/leaflet/leaflet.js') {
          // Capture the map only in tests to exercise real Leaflet pan/zoom events.
          const leaflet = await fs.readFile(path.join(root, 'assets/leaflet/leaflet.js'), 'utf8');
          return route.fulfill({ contentType: 'text/javascript', body: leaflet + '\nL.Map.addInitHook(function () { window.testMap = this; });' });
        }
        if (requestUrl.startsWith(url)) return route.continue();
        externalRequests.push(requestUrl);
        if (/^https:\/\/tile\.openstreetmap\.org\/\d+\/\d+\/\d+\.png$/.test(requestUrl)) {
          return failTiles ? route.abort() : route.fulfill({ contentType: 'image/png', body: png });
        }
        return route.abort();
      });
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.locator('#locationChoices').waitFor();
      assert.equal(await page.locator('#mapTitle').textContent(), 'Halloween Map', 'Unknown visitors start with both cities');
      assert.equal(await page.locator('.halloween-marker').count(), 9);
      assert.equal(await page.evaluate(() => window.locationRequests), 0, 'First visit does not trigger a browser prompt');
      for (const choice of await page.locator('#locationChoices button').all()) {
        const box = await choice.boundingBox();
        assert.ok(box.width >= 44 && box.height >= 44, 'Startup choices have 44px targets');
      }
      const chooserBox = await page.locator('#locationNotice').boundingBox();
      assert.ok(chooserBox.x >= 0 && chooserBox.x + chooserBox.width <= profile.width && chooserBox.y + chooserBox.height <= profile.height, 'Startup chooser fits the viewport');
      await page.getByRole('button', { name: 'San Francisco', exact: true }).click();
      const dimensions = await page.locator('#map').boundingBox();
      assert.equal(dimensions.width, profile.width, profile.name + ': full-width map');
      assert.equal(dimensions.height, profile.height, profile.name + ': full-height map');
      assert.equal(await page.locator('dialog').evaluate(element => element.open), false);
      assert.equal(await page.locator('.halloween-marker').count(), 4);
      assert.equal(await page.locator('#tileNotice').isVisible(), false);
      assert.ok(externalRequests.length > 0, 'Tile requests were made');
      assert.ok(externalRequests.every(item => item.startsWith('https://tile.openstreetmap.org/')), 'Only standard OSM is requested');
      for (const control of await page.locator('.leaflet-bar a, .location-button, #openGuide').all()) {
        const box = await control.boundingBox();
        assert.ok(box.width >= 44 && box.height >= 44, profile.name + ': 44px controls');
      }
      const overflowing = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight);
      assert.equal(overflowing, false, 'No document overflow');

      // A keyboard user can open each map pin and read directions.
      const firstMarker = page.locator('.halloween-marker').first();
      await firstMarker.focus();
      await page.keyboard.press('Enter');
      await page.locator('.leaflet-popup').waitFor();
      assert.match(await page.locator('.leaflet-popup').innerText(), /Glen Park/);
      await page.getByRole('button', { name: 'Close popup' }).click();

      const toggle = page.getByRole('button', { name: /^Explore/ });
      await toggle.click();
      assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
      assert.equal(await page.locator('#closeGuide').evaluate(element => element === document.activeElement), true);
      const drawerBox = await page.locator('dialog').boundingBox();
      assert.ok(drawerBox.y >= 0 && drawerBox.y + drawerBox.height <= profile.height + 1, 'Drawer stays in viewport');
      const content = page.locator('.drawer-content');
      const scrollSize = await content.evaluate(element => ({ height: element.clientHeight, scroll: element.scrollHeight }));
      assert.ok(scrollSize.height > profile.height * 0.45, 'Guide has space to read');
      assert.ok(scrollSize.scroll > scrollSize.height, 'Guide is independently scrollable');

      const tour = new URL(await page.locator('.tour-link').getAttribute('href'));
      assert.equal(tour.searchParams.get('travelmode'), 'driving');
      assert.equal(tour.searchParams.get('waypoints').split('|').length, 2);
      assert.equal(await page.locator('.spot-card .card-actions a').count(), 4);
      assert.equal(await page.locator('.spot-card .spot-source').count(), 4, 'SF cards link to local sources');
      const directions = new URL(await page.locator('.spot-card .card-actions a').last().getAttribute('href'));
      assert.equal(directions.searchParams.get('destination'), 'Belvedere St & 17th St,San Francisco,CA');

      // Scroll the last neighborhood fully into view and open its map popup.
      const showCole = page.getByRole('button', { name: 'Show Cole Valley on map' });
      await showCole.scrollIntoViewIfNeeded();
      assert.ok(await content.evaluate(element => element.scrollTop) > 0);
      assert.equal(await page.locator('#closeGuide').isVisible(), true);
      await showCole.click();
      assert.equal(await page.locator('dialog').evaluate(element => element.open), false);
      await page.locator('.leaflet-popup').waitFor();
      assert.match(await page.locator('.leaflet-popup').innerText(), /Cole Valley/);
      const popupBox = await page.locator('.leaflet-popup').boundingBox();
      assert.ok(popupBox.x >= -1 && popupBox.x + popupBox.width <= profile.width + 1, 'Popup fits screen width');
      await page.getByRole('button', { name: 'Show all neighborhoods' }).click();
      assert.equal(await page.locator('.leaflet-popup').count(), 0);

      await toggle.click();
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => document.getElementById('openGuide').getAttribute('aria-expanded') === 'false');
      assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
      assert.equal(await toggle.evaluate(element => element === document.activeElement), true);
      await toggle.click();
      await page.getByRole('button', { name: 'Close neighborhood guide' }).click();
      await toggle.click();
      await page.mouse.click(2, 2);
      assert.equal(await page.locator('dialog').evaluate(element => element.open), false, 'Backdrop dismisses guide');

      // A city jump changes both the map overlays and the guide data.
      await toggle.click();
      await page.getByRole('button', { name: 'Los Angeles', exact: true }).click();
      assert.equal(await page.locator('dialog').evaluate(element => element.open), false);
      assert.equal(await page.locator('#mapTitle').textContent(), 'LA Halloween');
      assert.equal(await page.locator('.halloween-marker').count(), 5);
      assert.equal(await page.locator('#hintCount').textContent(), '5 neighborhoods');
      await toggle.click();
      assert.equal(await page.locator('#guideTitle').textContent(), 'Los Angeles haunts');
      assert.deepEqual(await page.locator('.spot-card h3').allTextContents(), ['Toluca Lake', 'Burbank', 'Angelino Heights', 'Venice Canals', 'Sierra Madre']);
      assert.equal(await page.getByRole('button', { name: 'Los Angeles', exact: true }).getAttribute('aria-current'), 'location');
      assert.equal(await page.locator('.spot-card .spot-source').count(), 5, 'LA neighborhoods have source links');
      const laTour = new URL(await page.locator('.tour-link').getAttribute('href'));
      assert.equal(laTour.searchParams.get('waypoints').split('|').length, 3);
      assert.match(laTour.searchParams.get('origin'), /Dell Ave/);
      assert.match(laTour.searchParams.get('destination'), /Sierra Madre/);
      assert.doesNotMatch(laTour.href, /San.Francisco|Chenery|Shotwell/);
      const showSierra = page.getByRole('button', { name: 'Show Sierra Madre on map' });
      await showSierra.scrollIntoViewIfNeeded();
      await showSierra.click();
      assert.match(await page.locator('.leaflet-popup').innerText(), /Sierra Madre[\s\S]*Alegria/);
      await page.getByRole('button', { name: 'Show all neighborhoods' }).click();
      assert.equal(await page.locator('#mapTitle').textContent(), 'LA Halloween', 'All fits the current city');

      // Panning and zooming alone select the guide without snapping the map away.
      await page.evaluate(() => window.testMap.setView([37.758, -122.442], 13, { animate: false }));
      assert.equal(await page.locator('#mapTitle').textContent(), 'SF Halloween');
      assert.equal(await page.locator('.halloween-marker').count(), 4);
      await page.evaluate(() => window.testMap.setView([34.15, -118.36], 13, { animate: false }));
      assert.equal(await page.locator('#mapTitle').textContent(), 'LA Halloween');
      const panView = await page.evaluate(() => ({ lat: window.testMap.getCenter().lat, lng: window.testMap.getCenter().lng, zoom: window.testMap.getZoom() }));
      assert.ok(Math.abs(panView.lat - 34.15) < 0.000001 && Math.abs(panView.lng + 118.36) < 0.000001);
      assert.equal(panView.zoom, 13, 'Guide switch keeps the chosen zoom');
      await toggle.click();
      await page.getByRole('button', { name: 'Show Sierra Madre on map' }).scrollIntoViewIfNeeded();
      const lastCard = await page.locator('.spot-card').last().elementHandle();
      const previousScroll = await content.evaluate(element => element.scrollTop);
      await page.evaluate(() => window.testMap.panBy([30, 0], { animate: false }));
      assert.equal(await lastCard.evaluate(element => element.isConnected), true, 'Same-city movement preserves cards');
      assert.equal(await content.evaluate(element => element.scrollTop), previousScroll, 'Same-city movement preserves guide scroll');

      await page.evaluate(() => window.testMap.setView([35.2, -120], 10, { animate: false }));
      assert.equal(await page.locator('#mapTitle').textContent(), 'Halloween Map');
      assert.equal(await page.locator('.spot-card').count(), 0, 'Outside coverage does not show a stale city guide');
      assert.equal(await page.locator('.tour-link').isVisible(), false);
      assert.equal(await page.locator('[data-city][aria-current]').count(), 0);
      assert.equal(await content.evaluate(element => element.scrollTop), 0, 'New area resets guide scroll');
      await page.evaluate(() => window.testMap.fitBounds([[33.98, -122.46], [37.78, -118.04]], { animate: false }));
      assert.equal(await page.locator('#mapTitle').textContent(), 'Halloween Map');
      assert.equal(await page.locator('.halloween-marker').count(), 9, 'Wide overview shows both cities');
      await page.getByRole('button', { name: 'San Francisco', exact: true }).click();
      assert.equal(await page.locator('.halloween-marker').count(), 4);
      assert.equal(await page.locator('#mapTitle').textContent(), 'SF Halloween');

      // Location is opt-in, updates without duplicate markers, and works outside SF.
      assert.equal(await page.evaluate(() => window.locationRequests), 0, 'No automatic location request');
      const locate = page.getByRole('button', { name: 'My location', exact: true });
      await locate.focus();
      await page.keyboard.press('Enter');
      await page.locator('.user-location-marker').waitFor();
      await page.waitForFunction(() => document.querySelector('.location-button').getAttribute('aria-busy') === 'false');
      assert.equal(await page.evaluate(() => window.locationRequests), 1);
      assert.match(await page.locator('#locationStatus').textContent(), /accuracy: 25 m/);
      assert.equal(await page.locator('.location-accuracy').count(), 1);
      const locationBox = await page.locator('.user-location-marker').boundingBox();
      assert.ok(locationBox.x >= 0 && locationBox.y >= 0 && locationBox.x + locationBox.width <= profile.width && locationBox.y + locationBox.height <= profile.height, 'Location is in view');
      await page.getByRole('button', { name: 'Dismiss location message' }).click();
      assert.equal(await page.locator('#locationNotice').isVisible(), false);

      await context.setGeolocation({ latitude: 34.0522, longitude: -118.2437, accuracy: 100 });
      await locate.click();
      await page.waitForFunction(() => document.getElementById('locationStatus').textContent.includes('accuracy: 100 m'));
      assert.equal(await page.locator('.user-location-marker').count(), 1);
      assert.equal(await page.locator('.location-accuracy').count(), 1);
      assert.equal(await page.evaluate(() => window.locationRequests), 2);
      assert.equal(await page.locator('#mapTitle').textContent(), 'LA Halloween', 'My location also selects the LA guide');
      assert.equal(await page.locator('.halloween-marker').count(), 5);
      assert.equal(await page.locator('.halloween-marker[aria-label="Glen Park"]').count(), 0, 'SF overlays are removed in LA');
      await page.locator('.user-location-marker').focus();
      await page.keyboard.press('Enter');
      assert.match(await page.locator('.leaflet-popup').innerText(), /Your location[\s\S]*100 m/);
      assert.equal(await page.locator('#locationNotice').isVisible(), false, 'Notice does not cover popup');
      await page.getByRole('button', { name: 'Show all neighborhoods' }).click();

      await toggle.click();
      await page.getByRole('button', { name: 'San Francisco', exact: true }).click();

      // Abort real tile requests, then retry successfully.
      failTiles = true;
      await page.reload({ waitUntil: 'networkidle' });
      assert.equal(await page.locator('#tileNotice').isVisible(), true);
      await page.getByRole('button', { name: /^Explore/ }).click();
      assert.equal(await page.locator('.spot-card').count(), 4, 'Guide works without basemap');
      await page.keyboard.press('Escape');
      failTiles = false;
      await page.getByRole('button', { name: 'Retry map' }).click();
      await page.waitForLoadState('networkidle');
      assert.equal(await page.locator('#tileNotice').isVisible(), false);

      await page.setViewportSize({ width: profile.height, height: profile.width });
      await page.waitForTimeout(250);
      assert.equal((await page.locator('#map').boundingBox()).height, profile.width, 'Map resizes after orientation change');
      assert.deepEqual(errors, [], 'No browser errors');
      assert.deepEqual(failedAssets, [], 'All project-path assets resolve');
      console.log('PASS ' + profile.name);
      await context.close();
    }

    // Exercise every audited area in the actual map, including disjoint footprints.
    {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.route('https://tile.openstreetmap.org/**', route => route.fulfill({ contentType: 'image/png', body: png }));
      await page.goto(url, { waitUntil: 'networkidle' });
      for (const region of guides) {
        await page.getByRole('button', { name: /^Explore/ }).click();
        await page.getByRole('button', { name: region.name, exact: true }).click();
        assert.equal(await page.locator('.neighborhood-area').count(), region.spots.length);
        assert.equal(await page.locator('.neighborhood-corridor').count(), region.spots.reduce((n, spot) => n + spot.corridors.length, 0));
        for (const spot of region.spots) {
          await page.getByRole('button', { name: /^Explore/ }).click();
          const show = page.getByRole('button', { name: 'Show ' + spot.name + ' on map', exact: true });
          await show.scrollIntoViewIfNeeded();
          await show.click();
          const popup = page.locator('.leaflet-popup');
          assert.ok((await popup.innerText()).includes(spot.name));
          const box = await popup.boundingBox();
          assert.ok(box.x >= -1 && box.x + box.width <= 391, spot.id + ': popup is readable on a phone');
          const directions = new URL(await popup.locator('.button').getAttribute('href'));
          assert.equal(directions.searchParams.get('destination'), spot.location);
          await page.getByRole('button', { name: 'Close popup' }).click();
          console.log('PASS map area ' + spot.id);
        }
      }
      assert.deepEqual(errors, []);
      await context.close();
    }

    // Previously granted permission centers the first view near the actual visitor.
    for (const city of [
      { name: 'LA', latitude: 34.0522, longitude: -118.2437, title: 'LA Halloween', count: 5 },
      { name: 'SF', latitude: 37.758, longitude: -122.442, title: 'SF Halloween', count: 4 }
    ]) {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 }, reducedMotion: 'reduce',
        permissions: ['geolocation'], geolocation: { latitude: city.latitude, longitude: city.longitude, accuracy: 50 }
      });
      await context.addInitScript(() => {
        window.locationRequests = 0;
        const getPosition = navigator.geolocation.getCurrentPosition.bind(navigator.geolocation);
        navigator.geolocation.getCurrentPosition = (...args) => { window.locationRequests++; return getPosition(...args); };
      });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.route('https://tile.openstreetmap.org/**', route => route.fulfill({ contentType: 'image/png', body: png }));
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.locator('.user-location-marker').waitFor();
      assert.equal(await page.locator('#mapTitle').textContent(), city.title);
      assert.equal(await page.locator('.halloween-marker').count(), city.count);
      assert.equal(await page.evaluate(() => window.locationRequests), 1, 'One automatic location fix');
      assert.equal(await page.locator('#locationChoices').isVisible(), false);
      const userBox = await page.locator('.user-location-marker').boundingBox();
      assert.ok(userBox.x >= 0 && userBox.x + userBox.width <= 390 && userBox.y >= 0 && userBox.y + userBox.height <= 844);
      assert.deepEqual(errors, []);
      console.log('PASS automatic startup ' + city.name);
      await context.close();
    }

    // Consent is requested by a click, and city-only preferences survive a reload.
    for (const mode of ['prompt', 'denied', 'missing-permissions', 'query-rejected', 'blocked-storage']) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
      await context.addInitScript(mode => {
        window.locationRequests = 0;
        Object.defineProperty(navigator, 'permissions', { value: mode === 'missing-permissions' ? undefined : {
          query: async () => {
            if (mode === 'query-rejected') throw new Error('Unsupported permission query');
            return { state: mode === 'denied' ? 'denied' : 'prompt' };
          }
        } });
        Object.defineProperty(navigator, 'geolocation', { value: {
          getCurrentPosition(success) {
            window.locationRequests++;
            success({ coords: { latitude: 34.0522, longitude: -118.2437, accuracy: 20 } });
          }
        } });
        if (mode === 'blocked-storage') Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage blocked'); } });
      }, mode);
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.route('https://tile.openstreetmap.org/**', route => route.fulfill({ contentType: 'image/png', body: png }));
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.locator('#locationChoices').waitFor();
      assert.equal(await page.evaluate(() => window.locationRequests), 0);
      assert.equal(await page.getByRole('button', { name: 'Use my location', exact: true }).isVisible(), mode !== 'denied');
      if (mode === 'prompt') {
        await page.getByRole('button', { name: 'Use my location', exact: true }).click();
        assert.equal(await page.evaluate(() => window.locationRequests), 1);
        assert.equal(await page.locator('#mapTitle').textContent(), 'LA Halloween');
        assert.equal(await page.locator('.user-location-marker').count(), 1);
      } else {
        await page.getByRole('button', { name: 'Los Angeles', exact: true }).click();
      }
      if (mode !== 'blocked-storage') {
        assert.equal(await page.evaluate(() => localStorage.getItem('halloween-map:city')), 'la');
        const keys = await page.evaluate(() => Object.keys(localStorage));
        assert.deepEqual(keys, ['halloween-map:city'], 'Only the city is saved');
      }
      await page.reload({ waitUntil: 'networkidle' });
      assert.equal(await page.evaluate(() => window.locationRequests), 0, 'No implicit geolocation after reload without consent');
      assert.equal(await page.locator('#mapTitle').textContent(), mode === 'blocked-storage' ? 'Halloween Map' : 'LA Halloween');
      assert.equal(await page.locator('#locationNotice').isVisible(), mode === 'blocked-storage');
      assert.deepEqual(errors, []);
      console.log('PASS startup fallback ' + mode);
      await context.close();
    }

    // An automatic fix that arrives after navigation must not pull the map back.
    for (const delayed of ['permission', 'position']) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
      await context.addInitScript(delayed => {
        window.locationRequests = 0;
        Object.defineProperty(navigator, 'permissions', { value: {
          query: () => delayed === 'permission'
            ? new Promise(resolve => { window.resolveLocationPermission = resolve; })
            : Promise.resolve({ state: 'granted' })
        } });
        Object.defineProperty(navigator, 'geolocation', { value: {
          getCurrentPosition(success) { window.locationRequests++; window.resolvePosition = success; }
        } });
      }, delayed);
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.route('https://tile.openstreetmap.org/**', route => route.fulfill({ contentType: 'image/png', body: png }));
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.getByRole('button', { name: /^Explore/ }).click();
      await page.getByRole('button', { name: 'San Francisco', exact: true }).click();
      if (delayed === 'permission') await page.evaluate(() => window.resolveLocationPermission({ state: 'granted' }));
      else await page.evaluate(() => window.resolvePosition({ coords: { latitude: 34.0522, longitude: -118.2437, accuracy: 20 } }));
      assert.equal(await page.locator('#mapTitle').textContent(), 'SF Halloween');
      assert.equal(await page.locator('.user-location-marker').count(), 0);
      assert.equal(await page.evaluate(() => window.locationRequests), delayed === 'permission' ? 0 : 1);
      assert.equal(await page.getByRole('button', { name: 'My location', exact: true }).isDisabled(), false);
      assert.deepEqual(errors, []);
      console.log('PASS navigation beats delayed ' + delayed);
      await context.close();
    }

    for (const scenario of ['denied', 'unavailable', 'timeout', 'unsupported', 'insecure', 'loading']) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
      await context.addInitScript(scenario => {
        window.locationRequests = 0;
        if (scenario === 'unsupported') {
          Object.defineProperty(navigator, 'geolocation', { value: undefined });
        } else if (scenario === 'insecure') {
          Object.defineProperty(window, 'isSecureContext', { value: false });
        } else {
          Object.defineProperty(navigator, 'geolocation', { value: {
            getCurrentPosition(success, error, options) {
              window.locationRequests++;
              window.locationOptions = options;
              window.completeLocation = success;
              if (scenario !== 'loading') error({ code: { denied: 1, unavailable: 2, timeout: 3 }[scenario] });
            }
          } });
        }
      }, scenario);
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.route('https://tile.openstreetmap.org/**', route => route.fulfill({ contentType: 'image/png', body: png }));
      await page.goto(url, { waitUntil: 'networkidle' });
      const locate = page.getByRole('button', { name: 'My location', exact: true });
      await locate.click();
      const messages = {
        denied: /access was denied/,
        unavailable: /location is unavailable/,
        timeout: /took too long/,
        unsupported: /not supported/,
        insecure: /HTTPS/,
        loading: /Finding your location/
      };
      assert.match(await page.locator('#locationStatus').textContent(), messages[scenario]);
      assert.equal(await page.locator('#locationNotice').isVisible(), true);
      assert.equal(await locate.isDisabled(), scenario === 'loading');
      assert.equal(await locate.getAttribute('aria-busy'), String(scenario === 'loading'));
      if (scenario === 'loading') {
        assert.deepEqual(await page.evaluate(() => window.locationOptions), { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
        // Repeated taps while locating must not start multiple permission requests.
        await locate.evaluate(element => element.click());
        assert.equal(await page.evaluate(() => window.locationRequests), 1);
        await page.evaluate(() => window.completeLocation({ coords: { latitude: 37.758, longitude: -122.442, accuracy: 15 } }));
        assert.equal(await locate.isDisabled(), false);
        assert.equal(await page.locator('.user-location-marker').count(), 1);
      } else if (scenario === 'denied') {
        // After an error, a new click can succeed without a reload.
        await page.evaluate(() => {
          navigator.geolocation.getCurrentPosition = success => success({ coords: { latitude: 37.758, longitude: -122.442, accuracy: 20 } });
        });
        await locate.click();
        assert.equal(await page.locator('.user-location-marker').count(), 1);
        await page.evaluate(() => { navigator.geolocation.getCurrentPosition = (success, error) => error({ code: 1 }); });
        await locate.click();
        assert.match(await page.locator('#locationStatus').textContent(), /last found position/);
        assert.equal(await page.locator('.user-location-marker').count(), 1, 'Last known position remains after failed refresh');
      }
      assert.deepEqual(errors, [], 'No browser errors in ' + scenario);
      console.log('PASS location ' + scenario);
      await context.close();
    }
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
