# Neighborhood data and geometry

Street-level audit completed October 30, 2026 for all nine neighborhoods. Findings and corrections are recorded in [NEIGHBORHOOD_AUDIT.md](NEIGHBORHOOD_AUDIT.md).

## Neighborhood and event sources

| Neighborhood | Audited walking extent | Local guide / event evidence |
| --- | --- | --- |
| Glen Park | Chenery: Diamond–Elk; western Sussex: Swiss–Diamond Heights Blvd | [Glen Park Association’s 2026 Halloween guide](https://www.glenparkassociation.org/halloween-2026/) and [SFMTA Halloween advisory](https://www.sfmta.com/press-releases/sfmta-transit-and-traffic-advisory-week-thursday-october-29-through-wednesday-november-4-2026) |
| NoPa | Grove: Baker–Central; Lyon: Fulton–Hayes | [SFMTA 2026 closures](https://www.sfmta.com/trick-or-treat-street-closures), NOPNA permit |
| Mission / Fair Oaks | Shotwell: 18th–24th; Fair Oaks: 22nd–26th | [SFMTA closure data](https://data.sf.gov/d/8x25-yybr), permitted 2026 block extents |
| Cole Valley | Belvedere: 17th–Parnassus; Shrader: Frederick–Beulah | [SFMTA destination guidance](https://www.sfmta.com/ru/node/45973), [Time Out SF guide](https://www.timeout.com/san-francisco/things-to-do/where-to-trick-or-treat-in-san-francisco), and Shrader’s 2026 SFMTA permit |
| Toluca Lake | Ledge: Moorpark–Valley Spring | [LAist neighborhood guide](https://laist.com/news/los-angeles-activities/best-la-neighborhoods-trick-or-treating-halloween) |
| Burbank / Magnolia Park | N California: Magnolia–Chandler’s south roadway | [Los Angeles magazine guide](https://lamag.com/halloween/10-l-a-neighborhoods-that-go-all-out-for-halloween/) |
| Angelino Heights | Carroll: Douglas–E Edgeware | [LAist neighborhood guide](https://laist.com/news/los-angeles-activities/best-la-neighborhoods-trick-or-treating-halloween) |
| Venice Canals | Dell: S Venice–28th; north-bank Carroll and Linnie canal walks | [Time Out LA guide](https://www.timeout.com/los-angeles/things-to-do/best-places-to-go-trick-or-treating-in-los-angeles) |
| Sierra Madre | E Alegria: Baldwin–Mountain Trail | [Time Out LA guide](https://www.timeout.com/los-angeles/things-to-do/best-places-to-go-trick-or-treating-in-los-angeles) |

The guide links each neighborhood to a local source. LA entries describe neighborhood traditions and proposed public walks; they do not confirm which homes participate this year or a shared opening time. Descriptions are original summaries.

The Glen Park organizer distinguishes event hours from the street-closure window. The card directs visitors to that organizer rather than treating the broader SFMTA permit window as event hours. No 2026 Belvedere closure window was present in the retrieved SFMTA records, so the guide does not assign one. NoPa, Shotwell, Fair Oaks, and Shrader permit windows are explicitly labeled and dated 2026.

## Geometry provenance

- SF street shapes: [SF Public Works Streets — Active and Retired](https://data.sf.gov/d/3psu-pn9h), active segments only. The source street and junction CNN identifiers are retained.
- SF junction positions: [Street Nodes](https://data.sf.gov/d/vd6w-dq8r). These orient centerlines independently of their digitization direction; Chenery segment 3933000 needs reversal to match its from/to junctions.
- SF permitted extents and times: [Temporary Street Closures](https://data.sf.gov/d/8x25-yybr), retrieved October 30, 2026. Relevant street-level permit records are retained in `data/sf-closure-reference.json`.
- LA street and footway shapes: OpenStreetMap public highway ways read through the [OSM API](https://wiki.openstreetmap.org/wiki/API_v0.6), including all segments needed to reach the named intersections. Venice canal highlights use mapped footways, not canal water geometry. Private-access ways are excluded.

Only street geometry and junction identifiers are retained in `data/street-reference.json`. Individual building/address records are not used in the audit. Source snapshots, planned extents, and generated output are separate:

- `data/street-reference.json`: published street lines, public way/node IDs, and SF junction points.
- `data/geometry-plan.json`: named starting/ending intersections, directions-pin junctions, and frontage widths.
- `geometry.js`: generated, committed geometry consumed by the website.
- `guides.js`: editable descriptions, directions queries, source links, and tour order.

Every line follows its source street geometry from its stated start to its stated end. Every marker is placed at the public intersection named by its directions query. Shading is a 40 m band around the walks (15 m for the narrower Venice canal setting). Disconnected walks remain separate areas. These are street-frontage guides, not official neighborhood boundaries or a promise that every address participates.

Coordinate data from OpenStreetMap © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), under the [Open Database License](https://opendatacommons.org/licenses/odbl/1-0/). Linked attribution remains visible on the map.

## Rebuilding and checking

The published website needs no build step or geocoding requests. Deliberate data regeneration requires Python 3.11 or later for the pinned `shapely==2.2.0` dependency. Make sure `python3` meets that requirement before creating the virtual environment:

```sh
python3 -m venv .venv-geometry
.venv-geometry/bin/pip install -r scripts/geometry-requirements.txt
.venv-geometry/bin/python scripts/build_geometry.py
npm run check
npm test
```

The generator uses the committed snapshots and no network. Tests independently check road adherence, named endpoints, canonical pin junctions, permitted SF extents, frontage distance/containment, public canal footways, and all nine areas in the browser.
