// Neighborhood descriptions. Audited geometry is generated separately; see DATA_SOURCES.md.
const HALLOWEEN_GUIDES = [
  {
    "id": "sf",
    "name": "San Francisco",
    "brand": "SF Halloween",
    "label": "SAN FRANCISCO",
    "coverageBounds": [
      [
        37.6,
        -122.6
      ],
      [
        37.95,
        -122.3
      ]
    ],
    "intro": "Four neighborhoods. Plenty of Halloween spirit. Pick a stop to see the decorated streets, or make a night of it.",
    "tourNote": "Opens Google Maps · Choose your travel mode there",
    "visitNote": "Viewing times and street closures may change. Check locally before heading out.",
    "tourOrder": [
      "glen-park",
      "mission",
      "cole-valley",
      "nopa"
    ],
    "spots": [
      {
        "id": "glen-park",
        "name": "Glen Park",
        "emoji": "🎃",
        "color": "#f97316",
        "zoom": 16,
        "stretch": "Chenery St (Diamond–Elk) and western Sussex St (Swiss Ave–Diamond Heights Blvd)",
        "hours": "Oct 31 · Haunted Chenery from 5 PM; check organizer for closure timing",
        "description": "Neighborhood trick-or-treating on Chenery, plus the Vella family pumpkin tradition on Sussex. The highlighted streets are starting walks through the area.",
        "detail": "Haunted Chenery",
        "location": "Chenery St & Diamond St,San Francisco,CA",
        "source": {
          "label": "Glen Park Association Halloween guide",
          "url": "https://www.glenparkassociation.org/halloween-2026/"
        }
      },
      {
        "id": "nopa",
        "name": "NoPa",
        "emoji": "👻",
        "color": "#a855f7",
        "zoom": 16,
        "stretch": "Grove St (Baker–Central) and Lyon St (Fulton–Hayes)",
        "hours": "Oct 31, 2026 · Grove/Lyon closure: 3–10 PM (SFMTA permit)",
        "description": "Start at Grove and Lyon for neighborhood Halloween gatherings among Victorian homes. Explore both arms of the highlighted streets around their shared intersection.",
        "detail": "Grove & Lyon Streets",
        "location": "Grove St & Lyon St,San Francisco,CA",
        "source": {
          "label": "SFMTA Halloween street guide",
          "url": "https://www.sfmta.com/trick-or-treat-street-closures"
        }
      },
      {
        "id": "mission",
        "name": "Mission District",
        "emoji": "💀",
        "color": "#10b981",
        "zoom": 15,
        "stretch": "Shotwell St (18th–24th) and Fair Oaks St (22nd–26th)",
        "hours": "Oct 31, 2026 · Permit windows: Shotwell 3–10 PM; Fair Oaks 5–8:30 PM",
        "description": "Two separate residential walking stops: Shotwell in the Mission and Fair Oaks at the Noe Valley edge. Each has its own Halloween activities and schedule.",
        "detail": "Shotwell & Fair Oaks",
        "location": "Shotwell St & 22nd St,San Francisco,CA",
        "source": {
          "label": "SFMTA Halloween street guide",
          "url": "https://www.sfmta.com/trick-or-treat-street-closures"
        }
      },
      {
        "id": "cole-valley",
        "name": "Cole Valley",
        "emoji": "🕸️",
        "color": "#06b6d4",
        "zoom": 16,
        "stretch": "Belvedere St (17th–Parnassus) and Shrader St (Frederick–Beulah)",
        "hours": "Oct 31, 2026 · Shrader permit: 4–10 PM; check Belvedere locally",
        "description": "Explore the hilly Belvedere blocks south of Parnassus and the separate Shrader block between Frederick and Beulah. These are two distinct Halloween walks.",
        "detail": "Belvedere & Shrader",
        "location": "Belvedere St & 17th St,San Francisco,CA",
        "source": {
          "label": "SFMTA Halloween street guide",
          "url": "https://www.sfmta.com/trick-or-treat-street-closures"
        }
      }
    ]
  },
  {
    "id": "la",
    "name": "Los Angeles",
    "brand": "LA Halloween",
    "label": "LOS ANGELES METRO",
    "coverageBounds": [
      [
        33.4,
        -118.95
      ],
      [
        34.65,
        -117.6
      ]
    ],
    "intro": "Five neighborhood traditions across Greater Los Angeles, from the Venice Canals to the San Gabriel foothills. Pick a stop and explore the nearby decorated streets.",
    "tourNote": "Spans Greater LA · Allow time for traffic and parking",
    "visitNote": "Displays vary by household and year. These are neighborhood traditions, not confirmed event schedules. Check the linked local guides before visiting.",
    "tourOrder": [
      "venice-canals",
      "angelino-heights",
      "toluca-lake",
      "magnolia-park",
      "sierra-madre"
    ],
    "spots": [
      {
        "id": "toluca-lake",
        "name": "Toluca Lake",
        "detail": "Ledge & Moorpark",
        "emoji": "🎃",
        "color": "#f97316",
        "zoom": 16,
        "stretch": "Ledge Ave between Moorpark St and Valley Spring Lane",
        "hours": "Halloween evenings · Hours vary by household",
        "description": "Residents turn the neighborhood’s ranch-house yards into seasonal scenes with props and theatrical displays. Ledge and Moorpark make a useful starting point for a walk around the flats.",
        "location": "Ledge Ave & Moorpark St, Los Angeles, CA",
        "source": {
          "label": "LAist neighborhood guide",
          "url": "https://laist.com/news/los-angeles-activities/best-la-neighborhoods-trick-or-treating-halloween"
        }
      },
      {
        "id": "magnolia-park",
        "name": "Burbank",
        "detail": "Magnolia Park",
        "emoji": "👻",
        "color": "#a855f7",
        "zoom": 16,
        "stretch": "N California St between Magnolia Blvd and the south side of Chandler Blvd",
        "hours": "October evenings · Check individual display schedules",
        "description": "This Burbank neighborhood is a good base for elaborate home displays and handmade Halloween scenes. Explore the residential streets around California Street; individual home haunts can change from year to year.",
        "location": "N California St & W Magnolia Blvd, Burbank, CA",
        "source": {
          "label": "Los Angeles magazine guide",
          "url": "https://lamag.com/halloween/10-l-a-neighborhoods-that-go-all-out-for-halloween/"
        }
      },
      {
        "id": "angelino-heights",
        "name": "Angelino Heights",
        "detail": "Carroll Avenue",
        "emoji": "💀",
        "color": "#10b981",
        "zoom": 17,
        "stretch": "Carroll Ave between Douglas St and E Edgeware Rd",
        "hours": "Halloween evening · Residential displays have individual hours",
        "description": "Victorian houses provide the backdrop for this longtime Halloween destination. Start along Carroll Avenue and explore the nearby decorated blocks on foot.",
        "location": "Carroll Ave & Douglas St, Los Angeles, CA",
        "source": {
          "label": "LAist neighborhood guide",
          "url": "https://laist.com/news/los-angeles-activities/best-la-neighborhoods-trick-or-treating-halloween"
        }
      },
      {
        "id": "venice-canals",
        "name": "Venice Canals",
        "detail": "Dell Avenue & canal walkways",
        "emoji": "🕸️",
        "color": "#06b6d4",
        "zoom": 16,
        "stretch": "Dell Ave (S Venice Blvd–28th Ave), plus Carroll and Linnie canal walks",
        "hours": "Halloween evening · Narrow walkways can be busy",
        "description": "Canal-side homes, bridges, and even boats join the Halloween scene. Walk the public paths around Dell Avenue to take in the decorations and lights.",
        "location": "Dell Ave & S Venice Blvd, Los Angeles, CA",
        "source": {
          "label": "Time Out neighborhood guide",
          "url": "https://www.timeout.com/los-angeles/things-to-do/best-places-to-go-trick-or-treating-in-los-angeles"
        }
      },
      {
        "id": "sierra-madre",
        "name": "Sierra Madre",
        "detail": "Alegria Avenue",
        "emoji": "🦇",
        "color": "#eab308",
        "zoom": 16,
        "stretch": "East Alegria Avenue between Baldwin Avenue and Mountain Trail Avenue",
        "hours": "Halloween evening · Check local access and closures",
        "description": "This foothill neighborhood is known for decorated Craftsman homes and carved pumpkins along Alegria Avenue. The Baldwin-to-Mountain Trail stretch is the suggested starting area.",
        "location": "E Alegria Ave & N Baldwin Ave, Sierra Madre, CA",
        "source": {
          "label": "Time Out neighborhood guide",
          "url": "https://www.timeout.com/los-angeles/things-to-do/best-places-to-go-trick-or-treating-in-los-angeles"
        }
      }
    ]
  }
];

HALLOWEEN_GUIDES.forEach(region => {
  region.spots.forEach(spot => Object.assign(spot, HALLOWEEN_GEOMETRY[spot.id]));
});
