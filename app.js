(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const map = L.map('map', {
    zoomControl: false,
    scrollWheelZoom: true,
    fadeAnimation: !reduceMotion,
    zoomAnimation: !reduceMotion,
    markerZoomAnimation: !reduceMotion
  }).setView([37.758, -122.442], 13);
  L.control.zoom({ position: 'bottomright' }).addTo(map);

  // Keep normal browser caching, referrers, and attribution for OSM's tile policy.
  const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
    maxZoom: 19
  });
  const tileNotice = document.getElementById('tileNotice');
  const failedTiles = new Set();
  tiles.on('tileerror', event => {
    failedTiles.add(event.tile.src);
    tileNotice.hidden = false;
  });
  tiles.on('tileload tileunload', event => {
    failedTiles.delete(event.tile.src);
    tileNotice.hidden = failedTiles.size === 0;
  });
  document.getElementById('retryTiles').addEventListener('click', () => {
    failedTiles.clear();
    tileNotice.hidden = true;
    tiles.redraw();
  });

  const neighborhoodBounds = new Map(HALLOWEEN_GUIDES.flatMap(region => region.spots.map(spot => [
    spot.id, L.geoJSON(spot.area).getBounds()
  ])));
  const regions = HALLOWEEN_GUIDES.map(region => ({
    ...region,
    coverage: L.latLngBounds(region.coverageBounds),
    bounds: L.latLngBounds(region.spots.flatMap(spot => {
      const bounds = neighborhoodBounds.get(spot.id);
      return [bounds.getSouthWest(), bounds.getNorthEast()];
    })),
    layer: L.layerGroup()
  }));
  const cityStorageKey = 'halloween-map:city';
  let rememberedRegion;
  try {
    const city = localStorage.getItem(cityStorageKey);
    rememberedRegion = regions.find(region => region.id === city);
  } catch {
    // Browsers that block storage can still use the map and location controls.
  }
  const allBounds = L.latLngBounds(regions.flatMap(region => [region.bounds.getSouthWest(), region.bounds.getNorthEast()]));
  const guide = document.getElementById('guidePanel');
  const openGuide = document.getElementById('openGuide');
  const mapStatus = document.getElementById('mapStatus');
  const mapHint = document.querySelector('.map-hint');
  const cardsContainer = document.getElementById('cardsContainer');
  const drawerContent = document.querySelector('.drawer-content');
  const tourLink = document.querySelector('.tour-link');
  const markers = new Map();
  const externalIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10"/></svg>';
  let activeRegion;
  let activePopup = null;

  function directionsUrl(location) {
    return 'https://www.google.com/maps/dir/?' + new URLSearchParams({ api: '1', destination: location });
  }

  function tourUrl(region) {
    const stops = region.tourOrder.map(id => region.spots.find(spot => spot.id === id).location);
    return 'https://www.google.com/maps/dir/?' + new URLSearchParams({
      api: '1',
      origin: stops[0],
      destination: stops.at(-1),
      waypoints: stops.slice(1, -1).join('|'),
      travelmode: 'driving'
    });
  }

  function sourceLink(spot) {
    return spot.source
      ? `<a class="spot-source" href="${spot.source.url}" target="_blank" rel="noopener noreferrer" aria-label="Read local guide for ${spot.name}">${spot.source.label} ${externalIcon}</a>`
      : '';
  }

  function fitRegion(region) {
    map.closePopup();
    map.fitBounds(region ? region.bounds : allBounds, {
      paddingTopLeft: [32, 115],
      paddingBottomRight: [70, 110],
      maxZoom: 14,
      animate: false
    });
  }

  function fitAll() {
    fitRegion(activeRegion);
    const label = activeRegion ? activeRegion.name : 'San Francisco and Los Angeles';
    mapStatus.textContent = 'Showing all mapped neighborhoods in ' + label + '.';
  }

  openGuide.addEventListener('click', () => {
    cancelStartupLocation();
    guide.showModal();
    openGuide.setAttribute('aria-expanded', 'true');
  });
  document.getElementById('closeGuide').addEventListener('click', () => guide.close());
  // Native dialog supplies focus trapping, Escape dismissal, and focus restoration.
  guide.addEventListener('close', () => openGuide.setAttribute('aria-expanded', 'false'));
  const isOutsideGuide = event => {
    const rect = guide.getBoundingClientRect();
    return event.clientX < rect.left || event.clientX > rect.right ||
      event.clientY < rect.top || event.clientY > rect.bottom;
  };
  let pointerStartedOutside = false;
  guide.addEventListener('pointerdown', event => {
    pointerStartedOutside = event.target === guide && isOutsideGuide(event);
  });
  guide.addEventListener('click', event => {
    if (pointerStartedOutside && event.target === guide && isOutsideGuide(event)) guide.close();
    pointerStartedOutside = false;
  });

  document.querySelectorAll('[data-city]').forEach(button => {
    button.addEventListener('click', () => {
      cancelStartupLocation();
      guide.close();
      fitRegion(regions.find(region => region.id === button.dataset.city));
    });
  });

  const resetControl = L.control({ position: 'bottomright' });
  resetControl.onAdd = () => {
    const container = L.DomUtil.create('div', 'leaflet-bar');
    const button = L.DomUtil.create('a', 'fit-all', container);
    button.href = '#map';
    button.setAttribute('role', 'button');
    button.setAttribute('aria-label', 'Show all neighborhoods');
    button.title = 'Show all neighborhoods in this guide';
    button.textContent = 'All';
    L.DomEvent.disableClickPropagation(container);
    L.DomEvent.on(button, 'click', event => {
      L.DomEvent.preventDefault(event);
      cancelStartupLocation();
      fitAll();
    });
    L.DomEvent.on(button, 'keydown', event => {
      if (event.key === ' ') {
        L.DomEvent.preventDefault(event);
        cancelStartupLocation();
        fitAll();
      }
    });
    return container;
  };
  resetControl.addTo(map);

  const locationNotice = document.getElementById('locationNotice');
  const locationStatus = document.getElementById('locationStatus');
  const locationChoices = document.getElementById('locationChoices');
  const useLocation = document.getElementById('useLocation');
  let locationMarker;
  let accuracyCircle;
  let locationButton;
  let startupAllowed = true;
  let requestVersion = 0;
  let automaticRequest = null;

  function showLocationMessage(message) {
    locationChoices.hidden = true;
    locationStatus.textContent = message;
    locationNotice.hidden = false;
  }

  document.getElementById('dismissLocationNotice').addEventListener('click', () => {
    cancelStartupLocation();
    locationNotice.hidden = true;
    locationButton.focus({ preventScroll: true });
  });

  function finishLocating() {
    locationButton.disabled = false;
    locationButton.setAttribute('aria-busy', 'false');
  }

  function showLocationChoices(canLocate = true) {
    showLocationMessage(canLocate
      ? 'Find Halloween near you. Use your location or choose a city.'
      : 'Choose a city to explore Halloween neighborhoods.');
    useLocation.hidden = !canLocate;
    locationChoices.hidden = false;
  }

  function cancelStartupLocation() {
    startupAllowed = false;
    if (automaticRequest !== null) {
      requestVersion++;
      automaticRequest = null;
      finishLocating();
      locationNotice.hidden = true;
    }
    if (!locationChoices.hidden) locationNotice.hidden = true;
  }

  function showLocationError(error) {
    finishLocating();
    const messages = {
      1: 'Location access was denied. Allow location for this site in your browser settings, then try again.',
      2: 'Your location is unavailable. Check that location services are enabled, then try again.',
      3: 'Finding your location took too long. Try again where you have a clearer GPS signal.'
    };
    const message = messages[error.code] || 'Your location couldn’t be found. Please try again.';
    showLocationMessage(message + (locationMarker ? ' The dot still shows your last found position.' : ''));
  }

  function showLocation(position, automatic) {
    finishLocating();
    const { latitude, longitude, accuracy } = position.coords;
    const latlng = L.latLng(latitude, longitude);
    const accuracyText = Math.round(accuracy).toLocaleString();
    if (!accuracyCircle) {
      accuracyCircle = L.circle(latlng, {
        radius: accuracy,
        color: '#2563eb',
        weight: 1,
        opacity: 0.5,
        fillColor: '#3b82f6',
        fillOpacity: 0.12,
        interactive: false,
        className: 'location-accuracy'
      }).addTo(map);
      locationMarker = L.marker(latlng, {
        icon: L.divIcon({
          className: 'user-location-marker',
          html: '<span class="user-location-dot" aria-hidden="true"></span>',
          iconSize: [44, 44],
          iconAnchor: [22, 22],
          popupAnchor: [0, -10]
        }),
        title: 'Your location',
        alt: 'Your location',
        zIndexOffset: 1000
      }).addTo(map);
      locationMarker.getElement().setAttribute('aria-label', 'Your location');
    } else {
      accuracyCircle.setLatLng(latlng).setRadius(accuracy);
      locationMarker.setLatLng(latlng);
    }
    locationMarker.bindPopup('<strong>Your location</strong><br>Approximate accuracy: ' + accuracyText + ' m.<br>Tap My location again to refresh.', { autoPan: !reduceMotion });
    map.closePopup();
    map.fitBounds(accuracyCircle.getBounds(), {
      paddingTopLeft: [32, 115],
      paddingBottomRight: [70, 110],
      maxZoom: automatic ? 13 : 16,
      animate: false
    });
    showLocationMessage('Location found. Approximate accuracy: ' + accuracyText + ' m.');
    if (automatic && !activeRegion) showLocationChoices(false);
  }

  function locateUser({ automatic = false } = {}) {
    if (!automatic) cancelStartupLocation();
    if (locationButton.disabled) return;
    if (!window.isSecureContext) {
      showLocationMessage('Location needs a secure connection. Open this page over HTTPS, then try again.');
      return;
    }
    if (!navigator.geolocation) {
      showLocationMessage('Location is not supported by this browser. Try another browser to show your position.');
      return;
    }
    locationButton.disabled = true;
    locationButton.setAttribute('aria-busy', 'true');
    showLocationMessage('Finding your location…');
    const version = ++requestVersion;
    if (automatic) automaticRequest = version;
    const onSuccess = position => {
      if (version !== requestVersion) return;
      automaticRequest = null;
      showLocation(position, automatic);
    };
    const onError = error => {
      if (version !== requestVersion) return;
      automaticRequest = null;
      showLocationError(error);
    };
    try {
      navigator.geolocation.getCurrentPosition(onSuccess, onError, {
        enableHighAccuracy: !automatic,
        timeout: automatic ? 10000 : 15000,
        maximumAge: automatic ? 60000 : 0
      });
    } catch {
      onError({ code: 1 });
    }
  }

  const locationControl = L.control({ position: 'bottomright' });
  locationControl.onAdd = () => {
    const container = L.DomUtil.create('div', 'leaflet-bar');
    locationButton = L.DomUtil.create('button', 'location-button', container);
    locationButton.type = 'button';
    locationButton.title = 'My location';
    locationButton.setAttribute('aria-label', 'My location');
    locationButton.setAttribute('aria-busy', 'false');
    locationButton.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/></svg>';
    L.DomEvent.disableClickPropagation(container);
    locationButton.addEventListener('click', () => locateUser());
    return container;
  };
  locationControl.addTo(map);
  useLocation.addEventListener('click', () => locateUser());

  async function startNearVisitor() {
    if (!window.isSecureContext || !navigator.geolocation) {
      if (!rememberedRegion) showLocationChoices(false);
      return;
    }
    let permission;
    try {
      permission = await navigator.permissions?.query({ name: 'geolocation' });
    } catch {
      // Permission queries are optional; the explicit location button still works.
    }
    if (!startupAllowed) return;
    if (permission?.state === 'granted') locateUser({ automatic: true });
    else if (!rememberedRegion) showLocationChoices(permission?.state !== 'denied');
  }


  // City layers can be exchanged without changing the user's map position.
  regions.forEach(region => region.spots.forEach(spot => {
    L.geoJSON(spot.area, {
      interactive: false,
      style: {
        className: 'neighborhood-area',
        color: spot.color,
        weight: 1,
        opacity: 0.35,
        fillColor: spot.color,
        fillOpacity: 0.12
      }
    }).addTo(region.layer);

    spot.corridors.forEach(corridor => {
      L.polyline(corridor.coords, {
        className: 'neighborhood-corridor',
        color: spot.color,
        weight: 6,
        opacity: 0.9
      }).addTo(region.layer).bindPopup('<strong>' + corridor.name + '</strong><br>' + spot.name, { autoPan: !reduceMotion });
    });

    const icon = L.divIcon({
      className: 'halloween-marker',
      html: '<div class="custom-pin" style="--spot-color:' + spot.color + '"><span aria-hidden="true">' + spot.emoji + '</span></div>',
      iconSize: [44, 44],
      iconAnchor: [22, 22],
      popupAnchor: [0, -18]
    });
    const popup = `
      <h2>${spot.emoji} ${spot.name}</h2>
      <p>${spot.stretch}</p>
      <p class="spot-hours">${spot.hours}</p>
      <p class="popup-description">${spot.description}</p>
      <a class="button button-primary" href="${directionsUrl(spot.location)}" target="_blank" rel="noopener noreferrer">Get directions ${externalIcon}</a>
      ${sourceLink(spot)}
    `;
    const marker = L.marker(spot.center, { icon, title: spot.name, alt: spot.name })
      .bindPopup(popup, {
        autoPan: !reduceMotion,
        maxWidth: 300,
        maxHeight: Math.max(100, window.innerHeight - 220),
        autoPanPaddingTopLeft: L.point(24, 110),
        autoPanPaddingBottomRight: L.point(24, 80)
      });
    marker.on('add', () => marker.getElement().setAttribute('aria-label', spot.name));
    marker.addTo(region.layer);
    markers.set(spot.id, marker);
  }));

  function renderCard(spot) {
    const card = document.createElement('article');
    card.className = 'spot-card';
    card.style.setProperty('--spot-color', spot.color);
    card.innerHTML = `
      <div class="spot-heading">
        <span class="spot-emoji" aria-hidden="true">${spot.emoji}</span>
        <div><h3>${spot.name}</h3><p class="spot-subtitle">${spot.detail}</p></div>
      </div>
      <p class="spot-stretch">${spot.stretch}</p>
      <p class="spot-hours">${spot.hours}</p>
      <p class="spot-description">${spot.description}</p>
      <div class="card-actions">
        <button class="button spot-show" type="button" aria-label="Show ${spot.name} on map">Show on map</button>
        <a class="button button-secondary" href="${directionsUrl(spot.location)}" target="_blank" rel="noopener noreferrer" aria-label="Get directions to ${spot.name}">Directions ${externalIcon}</a>
      </div>
      ${sourceLink(spot)}
    `;
    card.querySelector('button').addEventListener('click', () => {
      guide.close();
      map.fitBounds(neighborhoodBounds.get(spot.id), {
        paddingTopLeft: [32, 115],
        paddingBottomRight: [70, 110],
        maxZoom: spot.zoom,
        animate: false
      });
      const marker = markers.get(spot.id);
      marker.openPopup();
      marker.getPopup().getElement().querySelector('.button').focus({ preventScroll: true });
      mapStatus.textContent = 'Showing ' + spot.name + '. Highlighted lines mark the suggested streets.';
    });
    return card;
  }

  function regionForMap() {
    const viewport = map.getBounds();
    // A wide view containing both cities offers an overview rather than picking one.
    if (regions.every(region => viewport.contains(region.bounds.getCenter()))) return null;
    return regions.find(region => region.coverage.contains(map.getCenter())) || null;
  }

  function syncGuideToMap() {
    const region = regionForMap();
    // Preserve scroll, focus, and the current popup while exploring the same area.
    if (region === activeRegion) return;
    activeRegion = region;
    if (region) {
      try { localStorage.setItem(cityStorageKey, region.id); } catch { /* Storage is optional. */ }
    }
    regions.forEach(item => {
      const shouldShow = !region || item === region;
      if (shouldShow && !map.hasLayer(item.layer)) item.layer.addTo(map);
      if (!shouldShow && map.hasLayer(item.layer)) map.removeLayer(item.layer);
    });

    const brand = region ? region.brand : 'Halloween Map';
    document.getElementById('mapTitle').textContent = brand;
    document.getElementById('areaLabel').textContent = (region ? region.label : 'SF + LOS ANGELES') + ' · OCT 31';
    document.title = brand + ' · Neighborhood Haunt Guide';
    document.getElementById('map').setAttribute('aria-label', (region ? region.name : 'SF and LA') + ' Halloween neighborhood map');
    document.getElementById('guideTitle').textContent = region ? region.name + ' haunts' : 'Find your next haunt';
    document.getElementById('guideIntro').textContent = region ? region.intro : 'We currently cover San Francisco and Greater Los Angeles. Move the map to either area or choose a city above to explore its neighborhoods.';
    document.getElementById('visitNote').textContent = region ? region.visitNote : 'Choose a city to see neighborhood details and local guides.';
    tourLink.hidden = !region;
    document.getElementById('tourNote').hidden = !region;
    if (region) {
      tourLink.href = tourUrl(region);
      document.getElementById('tourLabel').textContent = 'Open the ' + region.spots.length + '-stop driving tour';
      document.getElementById('tourNote').textContent = region.tourNote;
    } else {
      tourLink.removeAttribute('href');
      document.getElementById('tourLabel').textContent = '';
      document.getElementById('tourNote').textContent = '';
    }
    document.querySelectorAll('[data-city]').forEach(button => {
      if (button.dataset.city === region?.id) button.setAttribute('aria-current', 'location');
      else button.removeAttribute('aria-current');
    });

    const restoreFocus = cardsContainer.contains(document.activeElement);
    cardsContainer.replaceChildren(...(region ? region.spots.map(renderCard) : []));
    drawerContent.scrollTop = 0;
    if (restoreFocus) drawerContent.focus({ preventScroll: true });

    const visibleSpots = region ? region.spots : regions.flatMap(item => item.spots);
    document.getElementById('hintCount').textContent = visibleSpots.length + ' neighborhoods';
    document.getElementById('hintText').textContent = region ? 'Tap a pin to find your haunt' : 'Explore San Francisco or Los Angeles';
    document.getElementById('hintDots').replaceChildren(...visibleSpots.map(spot => {
      const dot = document.createElement('i');
      dot.style.setProperty('--spot-color', spot.color);
      return dot;
    }));
    mapStatus.textContent = region
      ? 'Showing ' + region.spots.length + ' neighborhoods in ' + region.name + '.'
      : 'Showing available guides for San Francisco and Los Angeles.';
  }

  function fitPopupWithoutMotion(popup) {
    if (!reduceMotion) return;
    const rect = popup.getElement().getBoundingClientRect();
    const viewport = document.getElementById('map').getBoundingClientRect();
    let dx = 0, dy = 0;
    if (rect.right > viewport.right - 24) dx = rect.right - viewport.right + 24;
    if (rect.left - dx < viewport.left + 24) dx = rect.left - viewport.left - 24;
    if (rect.bottom > viewport.bottom - 80) dy = rect.bottom - viewport.bottom + 80;
    if (rect.top - dy < viewport.top + 110) dy = rect.top - viewport.top - 110;
    if (dx || dy) map.panBy([dx, dy], { animate: false });
  }

  map.on('popupopen', event => {
    activePopup = event.popup;
    mapHint.hidden = true;
    locationNotice.hidden = true;
    fitPopupWithoutMotion(event.popup);
  });
  map.on('popupclose', event => {
    activePopup = null;
    mapHint.hidden = false;
    if (event.popup.getElement()?.contains(document.activeElement)) {
      const source = [...markers.values(), locationMarker].find(marker => marker?.getPopup() === event.popup);
      source?.getElement()?.focus({ preventScroll: true });
    }
  });
  map.on('resize', () => {
    markers.forEach(marker => {
      marker.getPopup().options.maxHeight = Math.max(100, window.innerHeight - 220);
    });
    activePopup?.update();
    if (activePopup) fitPopupWithoutMotion(activePopup);
  });
  map.on('moveend', syncGuideToMap);

  tiles.addTo(map);
  fitRegion(rememberedRegion);
  syncGuideToMap();
  // A late automatic fix must not undo a visitor's navigation or city choice.
  map.on('dragstart zoomstart click', cancelStartupLocation);
  startNearVisitor();
})();
