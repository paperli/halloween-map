(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const map = L.map('map', {
    zoomControl: false,
    scrollWheelZoom: true,
    fadeAnimation: !reduceMotion,
    zoomAnimation: !reduceMotion,
    markerZoomAnimation: !reduceMotion
  });
  L.control.zoom({ position: 'bottomright' }).addTo(map);

  // Standard OpenStreetMap tiles: no account, API key, or third-party style service.
  // Keep browser caching and the default referrer policy for OSM's tile usage policy.
  const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
    maxZoom: 19
  });
  const tileNotice = document.getElementById('tileNotice');
  let failedTiles = new Set();
  tiles.on('tileerror', (event) => {
    failedTiles.add(event.tile.src);
    tileNotice.hidden = false;
  });
  tiles.on('tileload', (event) => {
    failedTiles.delete(event.tile.src);
    if (failedTiles.size === 0) tileNotice.hidden = true;
  });
  document.getElementById('retryTiles').addEventListener('click', () => {
    failedTiles.clear();
    tileNotice.hidden = true;
    tiles.redraw();
  });

    const spots = [
      {
        id: 'glen-park',
        name: 'Glen Park ("Haunted Chenery")',
        emoji: '🎃',
        color: '#f97316',
        center: [37.7345, -122.4335],
        zoom: 16,
        stretch: 'Chenery St (between Diamond St & Elk St) + Sussex St',
        hours: 'Oct 31 Street Closure: 5:00 PM – 8:30 PM',
        description: 'Features the famous car-free Haunted Chenery block party and the Vella family’s 175 hand-carved pumpkins on nearby Sussex Street.',
        gmapsQuery: 'Chenery+St+%26+Diamond+St,San+Francisco,CA',
        polygon: [
          [37.7362, -122.4375], [37.7362, -122.4305],
          [37.7322, -122.4305], [37.7322, -122.4375]
        ],
        corridors: [
          {
            name: 'Haunted Chenery Corridor',
            coords: [[37.7347, -122.4316], [37.7341, -122.4342], [37.7335, -122.4366]]
          },
          {
            name: 'Sussex St Pumpkin Display',
            coords: [[37.7355, -122.4322], [37.7353, -122.4355]]
          }
        ]
      },
      {
        id: 'nopa',
        name: 'NoPa (Grove & Lyon Streets)',
        emoji: '👻',
        color: '#a855f7',
        center: [37.7755, -122.4445],
        zoom: 16,
        stretch: 'Grove St (between Baker St, Lyon St & Central Ave)',
        hours: 'Oct 31 Street Closure: 5:00 PM – 9:00 PM',
        description: 'Towering Victorian and Edwardian homes transformed into theatrical haunted houses with massive neighborhood turnout.',
        gmapsQuery: 'Grove+St+%26+Lyon+St,San+Francisco,CA',
        polygon: [
          [37.7772, -122.4480], [37.7772, -122.4410],
          [37.7738, -122.4410], [37.7738, -122.4480]
        ],
        corridors: [
          {
            name: 'Grove Street Haunted Corridor',
            coords: [[37.7758, -122.4418], [37.7753, -122.4468]]
          }
        ]
      },
      {
        id: 'mission',
        name: 'Mission District (Shotwell & Fair Oaks)',
        emoji: '💀',
        color: '#10b981',
        center: [37.7552, -122.4158],
        zoom: 15,
        stretch: 'Shotwell St (20th–24th St) & Fair Oaks St (21st–26th St)',
        hours: 'Best viewing: Dusk – 9:30 PM',
        description: 'Flat, warm, and walkable blocks lined with decorated historic Victorians, creative stoop art, and lively crowds.',
        gmapsQuery: 'Shotwell+St+%26+22nd+St,San+Francisco,CA',
        polygon: [
          [37.7595, -122.4265], [37.7595, -122.4135],
          [37.7485, -122.4135], [37.7485, -122.4265]
        ],
        corridors: [
          {
            name: 'Shotwell St (20th to 24th St)',
            coords: [[37.7588, -122.4159], [37.7523, -122.4153]]
          },
          {
            name: 'Fair Oaks St (21st to 26th St)',
            coords: [[37.7568, -122.4242], [37.7490, -122.4235]]
          }
        ]
      },
      {
        id: 'cole-valley',
        name: 'Cole Valley (Belvedere & Shrader)',
        emoji: '🕸️',
        color: '#06b6d4',
        center: [37.7662, -122.4512],
        zoom: 16,
        stretch: 'Belvedere St & Shrader St (between Haight St & Parnassus Ave)',
        hours: 'Best viewing: 5:00 PM – 9:00 PM',
        description: 'Multi-story storybook homes on twin tree-lined streets featuring coordinated neighborhood-wide spooky themes.',
        gmapsQuery: 'Belvedere+St+%26+17th+St,San+Francisco,CA',
        polygon: [
          [37.7695, -122.4540], [37.7695, -122.4485],
          [37.7625, -122.4485], [37.7625, -122.4540]
        ],
        corridors: [
          {
            name: 'Belvedere Street Corridor',
            coords: [[37.7690, -122.4519], [37.7632, -122.4512]]
          },
          {
            name: 'Shrader Street Corridor',
            coords: [[37.7691, -122.4503], [37.7634, -122.4497]]
          }
        ]
      }
    ];


  const guide = document.getElementById('guidePanel');
  const openGuide = document.getElementById('openGuide');
  const mapStatus = document.getElementById('mapStatus');
  const mapHint = document.querySelector('.map-hint');
  const cardsContainer = document.getElementById('cardsContainer');
  const bounds = L.latLngBounds(spots.flatMap(spot => spot.polygon));
  const markers = new Map();

  function fitAll() {
    map.closePopup();
    map.fitBounds(bounds, {
      paddingTopLeft: [32, 115],
      paddingBottomRight: [70, 110],
      maxZoom: 14,
      animate: false
    });
    mapStatus.textContent = 'Showing all four Halloween neighborhoods.';
  }

  openGuide.addEventListener('click', () => {
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

  const resetControl = L.control({ position: 'bottomright' });
  resetControl.onAdd = () => {
    const container = L.DomUtil.create('div', 'leaflet-bar');
    const button = L.DomUtil.create('a', 'fit-all', container);
    button.href = '#map';
    button.setAttribute('role', 'button');
    button.setAttribute('aria-label', 'Show all neighborhoods');
    button.title = 'Show all neighborhoods';
    button.textContent = 'All';
    L.DomEvent.disableClickPropagation(container);
    L.DomEvent.on(button, 'click', event => {
      L.DomEvent.preventDefault(event);
      fitAll();
    });
    L.DomEvent.on(button, 'keydown', event => {
      if (event.key === ' ') {
        L.DomEvent.preventDefault(event);
        fitAll();
      }
    });
    return container;
  };
  resetControl.addTo(map);

  const locationNotice = document.getElementById('locationNotice');
  const locationStatus = document.getElementById('locationStatus');
  let locationMarker;
  let accuracyCircle;
  let locationButton;

  function showLocationMessage(message) {
    locationStatus.textContent = message;
    locationNotice.hidden = false;
  }

  document.getElementById('dismissLocationNotice').addEventListener('click', () => {
    locationNotice.hidden = true;
    locationButton.focus({ preventScroll: true });
  });

  function finishLocating() {
    locationButton.disabled = false;
    locationButton.setAttribute('aria-busy', 'false');
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

  function showLocation(position) {
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
    locationMarker.bindPopup('<strong>Your location</strong><br>Approximate accuracy: ' + accuracyText + ' m.<br>Tap My location again to refresh.');
    map.closePopup();
    map.fitBounds(accuracyCircle.getBounds(), {
      paddingTopLeft: [32, 115],
      paddingBottomRight: [70, 110],
      maxZoom: 16,
      animate: false
    });
    showLocationMessage('Location found. Approximate accuracy: ' + accuracyText + ' m.');
  }

  function locateUser() {
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
    try {
      navigator.geolocation.getCurrentPosition(showLocation, showLocationError, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      });
    } catch {
      showLocationError({ code: 1 });
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
    locationButton.addEventListener('click', locateUser);
    return container;
  };
  locationControl.addTo(map);

  tiles.addTo(map);
  fitAll();

  spots.forEach(spot => {
    const [shortName, detail] = spot.name.split(' (');
    const subtitle = detail ? detail.replace(/\)$/, '').replaceAll('"', '') : '';
    const directions = 'https://www.google.com/maps/dir/?api=1&destination=' + spot.gmapsQuery;

    L.polygon(spot.polygon, {
      color: spot.color,
      weight: 2,
      dashArray: '5, 5',
      fillColor: spot.color,
      fillOpacity: 0.12,
      interactive: false
    }).addTo(map);

    spot.corridors.forEach(corridor => {
      L.polyline(corridor.coords, {
        color: spot.color,
        weight: 6,
        opacity: 0.9
      }).addTo(map).bindPopup('<strong>' + corridor.name + '</strong><br>' + shortName);
    });

    const icon = L.divIcon({
      className: 'halloween-marker',
      html: '<div class="custom-pin" style="--spot-color:' + spot.color + '"><span aria-hidden="true">' + spot.emoji + '</span></div>',
      iconSize: [44, 44],
      iconAnchor: [22, 22],
      popupAnchor: [0, -18]
    });

    const popup = `
      <h2>${spot.emoji} ${shortName}</h2>
      <p>${spot.stretch}</p>
      <p class="spot-hours">${spot.hours}</p>
      <p class="popup-description">${spot.description}</p>
      <a class="button button-primary" href="${directions}" target="_blank" rel="noopener noreferrer">Get directions <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10"/></svg></a>
    `;
    const marker = L.marker(spot.center, { icon, title: spot.name, alt: spot.name })
      .addTo(map).bindPopup(popup, {
        maxWidth: 300,
        maxHeight: Math.max(100, window.innerHeight - 220),
        autoPanPaddingTopLeft: L.point(24, 110),
        autoPanPaddingBottomRight: L.point(24, 80)
      });
    // Leaflet's default generic marker label is replaced with a useful destination.
    marker.getElement().setAttribute('aria-label', spot.name);
    markers.set(spot.id, marker);

    const card = document.createElement('article');
    card.className = 'spot-card';
    card.style.setProperty('--spot-color', spot.color);
    card.innerHTML = `
      <div class="spot-heading">
        <span class="spot-emoji" aria-hidden="true">${spot.emoji}</span>
        <div><h3>${shortName}</h3><p class="spot-subtitle">${subtitle}</p></div>
      </div>
      <p class="spot-stretch">${spot.stretch}</p>
      <p class="spot-hours">${spot.hours}</p>
      <p class="spot-description">${spot.description}</p>
      <div class="card-actions">
        <button class="button spot-show" type="button" aria-label="Show ${shortName} on map">Show on map</button>
        <a class="button button-secondary" href="${directions}" target="_blank" rel="noopener noreferrer" aria-label="Get directions to ${shortName}">Directions <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10"/></svg></a>
      </div>
    `;
    card.querySelector('button').addEventListener('click', () => {
      guide.close();
      map.setView(spot.center, spot.zoom, { animate: false });
      marker.openPopup();
      marker.getPopup().getElement().querySelector('.button').focus({ preventScroll: true });
      mapStatus.textContent = 'Showing ' + spot.name + '. Highlighted lines mark the suggested streets.';
    });
    cardsContainer.appendChild(card);
  });

  let activePopup = null;
  map.on('popupopen', event => {
    activePopup = event.popup;
    mapHint.hidden = true;
    locationNotice.hidden = true;
  });
  map.on('popupclose', event => {
    activePopup = null;
    mapHint.hidden = false;
    // Avoid losing keyboard focus when a popup's focused link is removed.
    if (event.popup.getElement()?.contains(document.activeElement)) {
      const source = [...markers.values()].find(marker => marker.getPopup() === event.popup);
      source?.getElement()?.focus({ preventScroll: true });
    }
  });
  map.on('resize', () => {
    markers.forEach(marker => {
      marker.getPopup().options.maxHeight = Math.max(100, window.innerHeight - 220);
    });
    activePopup?.update();
  });

})();
