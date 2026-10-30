# Neighborhood geometry audit — October 30, 2026

All nine neighborhoods were checked. The original four SF highlights used sparse, estimated coordinates; LA used street data but sometimes only one returned segment. Every original shaded area was a rectangular estimate. The corrected map uses complete named street extents, public starting intersections, and narrow frontage areas generated from the street lines.

| Area | Finding and correction | Pin adjustment |
| --- | --- | --- |
| Glen Park | Old highlights were up to 167 m off their named streets. Trace Chenery all the way from Diamond to Elk, and move the Sussex walk to Swiss–Diamond Heights. Preserve Chenery’s bend. | 33 m to Chenery/Diamond |
| NoPa | Grove was offset by up to 54 m and extended beyond Central. Add the missing Lyon section and use Grove Baker–Central / Lyon Fulton–Hayes. | 139 m to Grove/Lyon |
| Mission / Fair Oaks | Lines were up to 24 m off the street centerlines. Use the permitted Shotwell 18th–24th and Fair Oaks 22nd–26th extents. Keep these two areas separate. | 56 m to Shotwell/22nd |
| Cole Valley | Highlights were up to 271 m off the named roads and included the wrong blocks. Use Belvedere 17th–Parnassus and the separate Shrader Frederick–Beulah block. | 581 m to Belvedere/17th |
| Toluca Lake | Existing line was on Ledge. Trim the small overshoot at Moorpark, end at Valley Spring, and replace the oversized rectangle. | Less than 1 m; junction confirmed |
| Burbank / Magnolia Park | The line covered California between Chandler and Burbank, north of the intended start. Move the walk to Magnolia–Chandler’s south roadway. | 619 m to California/Magnolia |
| Angelino Heights | Existing line stopped a few meters short of Douglas and the marker was in the middle of Carroll. Complete Douglas–E Edgeware and align the marker. | 100 m to Carroll/Douglas |
| Venice Canals | The map highlighted only about 65 m of one Dell crossing. Show Dell from S Venice to 28th plus the public north-bank Carroll and Linnie canal walks (about 1.1 km total). | 209 m to Dell/S Venice |
| Sierra Madre | The full returned Alegria way continued about 269 m beyond Mountain Trail toward Cañon. Stop at Mountain Trail and place the start at Baldwin. | 326 m to Alegria/Baldwin |

Distances are rounded comparisons with published street geometry, not field-survey or GPS measurements. A pin adjustment measures alignment with the intersection already named by its Google Maps directions link.

## Area treatment and presentation

- Replace all nine rectangles with frontage bands around the audited walks: 40 m either side, 15 m around the Venice routes.
- Preserve disconnected areas, including Shotwell/Fair Oaks and the two Cole Valley walks; do not shade the intervening blocks.
- Fit neighborhood selection to the whole audited area, rather than a fixed view centered only on an entrance pin.
- Keep phone popups in view and honor reduced-motion preferences during popup repositioning.
- Add local source links for the four SF entries and update their descriptions/extent labels. Correct NoPa’s closure window and distinguish event guidance from permit windows.

## Source handling and checks

SF street centerlines and independently published junction points come from SF Public Works. One Chenery segment (CNN 3933000) is digitized in the reverse order to its from/to-node metadata. The generator orients it using the canonical junction positions, avoiding a missing or doubled-back final leg. SFMTA’s permit snapshot independently checks the complete six applicable SF corridor extents.

LA geometry is assembled from complete OSM public street segments and clipped at named shared nodes. The generator does not assume that one geocoder result covers the whole intended street. Venice canal paths are public highway/footway geometries; no waterway or private-access segment is used.

The automated geometry checks cover all nine neighborhoods: source-road adherence along every line, named start/end intersections, pin/directions junction alignment, source permit coverage, valid frontage coordinates, street containment, bounded shading, and the gap between Mission’s two walks. Browser checks open each neighborhood on a phone and verify its overlays, readable popup, and directions.

The audit covers public streets and intersections. It does not verify individual houses, live display operation, or parcel/neighborhood administrative boundaries. Sources, snapshots, and rebuild instructions are in [DATA_SOURCES.md](DATA_SOURCES.md).
