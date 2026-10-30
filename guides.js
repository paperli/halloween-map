// Static neighborhood guides. Sources and coordinate provenance: DATA_SOURCES.md.
const HALLOWEEN_GUIDES = [
  {
    "id": "sf",
    "name": "San Francisco",
    "brand": "SF Halloween",
    "label": "SAN FRANCISCO",
    "coverageBounds": [
      [37.6, -122.6],
      [37.95, -122.3]
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
        "center": [37.7345, -122.4335],
        "zoom": 16,
        "stretch": "Chenery St (between Diamond St & Elk St) + Sussex St",
        "hours": "Oct 31 Street Closure: 5:00 PM – 8:30 PM",
        "description": "Features the famous car-free Haunted Chenery block party and the Vella family’s 175 hand-carved pumpkins on nearby Sussex Street.",
        "polygon": [
          [37.7362, -122.4375],
          [37.7362, -122.4305],
          [37.7322, -122.4305],
          [37.7322, -122.4375]
        ],
        "corridors": [
          {
            "name": "Haunted Chenery Corridor",
            "coords": [
              [37.7347, -122.4316],
              [37.7341, -122.4342],
              [37.7335, -122.4366]
            ]
          },
          {
            "name": "Sussex St Pumpkin Display",
            "coords": [
              [37.7355, -122.4322],
              [37.7353, -122.4355]
            ]
          }
        ],
        "detail": "Haunted Chenery",
        "location": "Chenery St & Diamond St,San Francisco,CA"
      },
      {
        "id": "nopa",
        "name": "NoPa",
        "emoji": "👻",
        "color": "#a855f7",
        "center": [37.7755, -122.4445],
        "zoom": 16,
        "stretch": "Grove St (between Baker St, Lyon St & Central Ave)",
        "hours": "Oct 31 Street Closure: 5:00 PM – 9:00 PM",
        "description": "Towering Victorian and Edwardian homes transformed into theatrical haunted houses with massive neighborhood turnout.",
        "polygon": [
          [37.7772, -122.448],
          [37.7772, -122.441],
          [37.7738, -122.441],
          [37.7738, -122.448]
        ],
        "corridors": [
          {
            "name": "Grove Street Haunted Corridor",
            "coords": [
              [37.7758, -122.4418],
              [37.7753, -122.4468]
            ]
          }
        ],
        "detail": "Grove & Lyon Streets",
        "location": "Grove St & Lyon St,San Francisco,CA"
      },
      {
        "id": "mission",
        "name": "Mission District",
        "emoji": "💀",
        "color": "#10b981",
        "center": [37.7552, -122.4158],
        "zoom": 15,
        "stretch": "Shotwell St (20th–24th St) & Fair Oaks St (21st–26th St)",
        "hours": "Best viewing: Dusk – 9:30 PM",
        "description": "Flat, warm, and walkable blocks lined with decorated historic Victorians, creative stoop art, and lively crowds.",
        "polygon": [
          [37.7595, -122.4265],
          [37.7595, -122.4135],
          [37.7485, -122.4135],
          [37.7485, -122.4265]
        ],
        "corridors": [
          {
            "name": "Shotwell St (20th to 24th St)",
            "coords": [
              [37.7588, -122.4159],
              [37.7523, -122.4153]
            ]
          },
          {
            "name": "Fair Oaks St (21st to 26th St)",
            "coords": [
              [37.7568, -122.4242],
              [37.749, -122.4235]
            ]
          }
        ],
        "detail": "Shotwell & Fair Oaks",
        "location": "Shotwell St & 22nd St,San Francisco,CA"
      },
      {
        "id": "cole-valley",
        "name": "Cole Valley",
        "emoji": "🕸️",
        "color": "#06b6d4",
        "center": [37.7662, -122.4512],
        "zoom": 16,
        "stretch": "Belvedere St & Shrader St (between Haight St & Parnassus Ave)",
        "hours": "Best viewing: 5:00 PM – 9:00 PM",
        "description": "Multi-story storybook homes on twin tree-lined streets featuring coordinated neighborhood-wide spooky themes.",
        "polygon": [
          [37.7695, -122.454],
          [37.7695, -122.4485],
          [37.7625, -122.4485],
          [37.7625, -122.454]
        ],
        "corridors": [
          {
            "name": "Belvedere Street Corridor",
            "coords": [
              [37.769, -122.4519],
              [37.7632, -122.4512]
            ]
          },
          {
            "name": "Shrader Street Corridor",
            "coords": [
              [37.7691, -122.4503],
              [37.7634, -122.4497]
            ]
          }
        ],
        "detail": "Belvedere & Shrader",
        "location": "Belvedere St & 17th St,San Francisco,CA"
      }
    ]
  },
  {
    "id": "la",
    "name": "Los Angeles",
    "brand": "LA Halloween",
    "label": "LOS ANGELES METRO",
    "coverageBounds": [
      [33.4, -118.95],
      [34.65, -117.6]
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
        "center": [34.15039, -118.35711],
        "zoom": 16,
        "stretch": "Ledge Avenue near Moorpark Street and the surrounding residential blocks",
        "hours": "Halloween evenings · Hours vary by household",
        "description": "Residents turn the neighborhood’s ranch-house yards into seasonal scenes with props and theatrical displays. Ledge and Moorpark make a useful starting point for a walk around the flats.",
        "location": "Ledge Ave & Moorpark St, Los Angeles, CA",
        "polygon": [
          [34.152, -118.36],
          [34.152, -118.353],
          [34.1458, -118.353],
          [34.1458, -118.36]
        ],
        "corridors": [
          {
            "name": "Ledge Avenue near Moorpark",
            "coords": [
              [34.1467719, -118.3570874],
              [34.1478136, -118.3570889],
              [34.147909, -118.357089],
              [34.1479791, -118.3570903],
              [34.1485183, -118.3571002],
              [34.1494052, -118.3571238],
              [34.1494637, -118.3571254],
              [34.1503056, -118.3571327],
              [34.1503892, -118.357111],
              [34.1504781, -118.3571103]
            ]
          }
        ],
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
        "center": [34.1744, -118.34545],
        "zoom": 16,
        "stretch": "North California Street and nearby Magnolia Park residential blocks",
        "hours": "October evenings · Check individual display schedules",
        "description": "This Burbank neighborhood is a good base for elaborate home displays and handmade Halloween scenes. Explore the residential streets around California Street; individual home haunts can change from year to year.",
        "location": "N California St & W Magnolia Blvd, Burbank, CA",
        "polygon": [
          [34.178, -118.35],
          [34.178, -118.339],
          [34.1695, -118.339],
          [34.1695, -118.35]
        ],
        "corridors": [
          {
            "name": "North California Street",
            "coords": [
              [34.1727731, -118.3446505],
              [34.1728281, -118.3446774],
              [34.1728732, -118.3447001],
              [34.1731616, -118.3448454],
              [34.1734897, -118.3450032],
              [34.1742311, -118.3453671],
              [34.1749028, -118.3456967],
              [34.1756042, -118.3460416],
              [34.1759165, -118.3461795],
              [34.175933, -118.3461868],
              [34.1760393, -118.3462343]
            ]
          }
        ],
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
        "center": [34.06928, -118.25409],
        "zoom": 17,
        "stretch": "Carroll Avenue near Douglas Street",
        "hours": "Halloween evening · Residential displays have individual hours",
        "description": "Victorian houses provide the backdrop for this longtime Halloween destination. Start along Carroll Avenue and explore the nearby decorated blocks on foot.",
        "location": "Carroll Ave & Douglas St, Los Angeles, CA",
        "polygon": [
          [34.071, -118.2565],
          [34.071, -118.2515],
          [34.0675, -118.2515],
          [34.0675, -118.2565]
        ],
        "corridors": [
          {
            "name": "Carroll Avenue Victorian block",
            "coords": [
              [34.0688872, -118.2531978],
              [34.0689194, -118.2532701],
              [34.0691423, -118.2537703],
              [34.0696592, -118.2549787]
            ]
          }
        ],
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
        "center": [33.98425, -118.46631],
        "zoom": 16,
        "stretch": "Dell Avenue bridges and canal walkways south of Venice Boulevard",
        "hours": "Halloween evening · Narrow walkways can be busy",
        "description": "Canal-side homes, bridges, and even boats join the Halloween scene. Walk the public paths around Dell Avenue to take in the decorations and lights.",
        "location": "Dell Ave & S Venice Blvd, Los Angeles, CA",
        "polygon": [
          [33.9876, -118.47],
          [33.9876, -118.4615],
          [33.982, -118.4615],
          [33.982, -118.47]
        ],
        "corridors": [
          {
            "name": "Dell Avenue canal crossing",
            "coords": [
              [33.9840171, -118.466104],
              [33.9840479, -118.466129],
              [33.9842562, -118.4663136],
              [33.9844724, -118.4664973],
              [33.9844912, -118.4665146]
            ]
          }
        ],
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
        "center": [34.16813, -118.04877],
        "zoom": 16,
        "stretch": "East Alegria Avenue between Baldwin Avenue and Mountain Trail Avenue",
        "hours": "Halloween evening · Check local access and closures",
        "description": "This foothill neighborhood is known for decorated Craftsman homes and carved pumpkins along Alegria Avenue. The Baldwin-to-Mountain Trail stretch is the suggested starting area.",
        "location": "E Alegria Ave & N Baldwin Ave, Sierra Madre, CA",
        "polygon": [
          [34.17, -118.0533],
          [34.17, -118.0445],
          [34.1665, -118.0445],
          [34.1665, -118.0533]
        ],
        "corridors": [
          {
            "name": "East Alegria Avenue",
            "coords": [
              [34.1680995, -118.0523179],
              [34.1681009, -118.0522151],
              [34.1681015, -118.0521648],
              [34.1681107, -118.0514514],
              [34.1681281, -118.0500805],
              [34.1681282, -118.0483054],
              [34.1681295, -118.048267],
              [34.16813, -118.0481918],
              [34.1681298, -118.0481159],
              [34.16813, -118.0480825],
              [34.1681409, -118.0474496],
              [34.1681407, -118.0464014],
              [34.1681232, -118.0462296],
              [34.1680794, -118.046063],
              [34.1677227, -118.0453149]
            ]
          }
        ],
        "source": {
          "label": "Time Out neighborhood guide",
          "url": "https://www.timeout.com/los-angeles/things-to-do/best-places-to-go-trick-or-treating-in-los-angeles"
        }
      }
    ]
  }
];
