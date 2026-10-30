const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const prefix = '/sf-halloween-map/';
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
        if (requestUrl.startsWith(url)) return route.continue();
        externalRequests.push(requestUrl);
        if (/^https:\/\/tile\.openstreetmap\.org\/\d+\/\d+\/\d+\.png$/.test(requestUrl)) {
          return failTiles ? route.abort() : route.fulfill({ contentType: 'image/png', body: png });
        }
        return route.abort();
      });
      await page.goto(url, { waitUntil: 'networkidle' });
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
      assert.equal(await page.locator('.spot-card a').count(), 4);
      const directions = new URL(await page.locator('.spot-card a').last().getAttribute('href'));
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
      const sfMarkerBox = await firstMarker.boundingBox();
      assert.ok(sfMarkerBox.x < 0 || sfMarkerBox.x > profile.width || sfMarkerBox.y < 0 || sfMarkerBox.y > profile.height, 'Map centers on the actual location outside SF');
      await page.locator('.user-location-marker').focus();
      await page.keyboard.press('Enter');
      assert.match(await page.locator('.leaflet-popup').innerText(), /Your location[\s\S]*100 m/);
      assert.equal(await page.locator('#locationNotice').isVisible(), false, 'Notice does not cover popup');
      await page.getByRole('button', { name: 'Show all neighborhoods' }).click();

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
