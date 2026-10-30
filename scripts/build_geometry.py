"""Rebuild committed map geometry from audited public street snapshots.

Install scripts/geometry-requirements.txt first. No network access is used.
The website serves the generated geometry.js directly, without a build step.
"""
import heapq
import json
import math
from pathlib import Path

from shapely import orient_polygons, transform
from shapely.geometry import LineString, mapping
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parents[1]
EARTH_RADIUS = 6371008.8


def meters(a, b):
    lat = math.radians((a[1] + b[1]) / 2)
    return EARTH_RADIUS * math.hypot(math.radians(a[0] - b[0]) * math.cos(lat), math.radians(a[1] - b[1]))


def graph_for(rows, street, way_ids=None):
    selected = [r for r in rows if r['name'] == street and (not way_ids or r['id'] in way_ids)]
    if not selected:
        raise ValueError(f'No source geometry for {street}')
    graph, points = {}, {}
    for row in selected:
        if row.get('access') in ['private', 'no']:
            raise ValueError(f'Private road selected: {row["id"]}')
        coords = row['coords']
        if 'nodes' in row:
            edges = [(a, b, [coords[i], coords[i + 1]]) for i, (a, b) in enumerate(zip(row['nodes'], row['nodes'][1:]))]
        else:
            # A centerline can be digitized backwards relative to its CNN nodes.
            # Align it with the independently published canonical junction points.
            if meters(coords[0], row['fromPoint']) > 0.2:
                if meters(coords[-1], row['fromPoint']) > 0.2:
                    raise ValueError(f'Centerline does not reach its from-node: {row["id"]}')
                coords = list(reversed(coords))
            if meters(coords[-1], row['toPoint']) > 0.2:
                raise ValueError(f'Centerline does not reach its to-node: {row["id"]}')
            edges = [(row['fromNode'], row['toNode'], coords)]
        for a, b, line in edges:
            points[a], points[b] = line[0], line[-1]
            length = sum(meters(x, y) for x, y in zip(line, line[1:]))
            graph.setdefault(a, []).append((b, length, line, row['id']))
            graph.setdefault(b, []).append((a, length, list(reversed(line)), row['id']))
    return selected, graph, points


def intersection(rows, selected, cross):
    if 'nodes' in selected[0]:
        street_nodes = {n for row in selected for n in row['nodes']}
        cross_nodes = {n for row in rows if row['name'] == cross for n in row['nodes']}
        candidates = street_nodes & cross_nodes
    else:
        candidates = set()
        for row in selected:
            if row['from'] == cross:
                candidates.add(row['fromNode'])
            if row['to'] == cross:
                candidates.add(row['toNode'])
    if len(candidates) != 1:
        raise ValueError(f'Expected one junction of {selected[0]["name"]} and {cross}, got {candidates}')
    return candidates.pop()


def trace_route(rows, spec):
    selected, graph, points = graph_for(rows, spec['street'], spec.get('wayIds'))
    start = intersection(rows, selected, spec['from'])
    end = intersection(rows, selected, spec['to'])
    queue, seen = [(0.0, start, [], [])], set()
    while queue:
        distance, node, coords, source_ids = heapq.heappop(queue)
        if node in seen:
            continue
        seen.add(node)
        if node == end:
            return coords, list(dict.fromkeys(source_ids))
        for neighbor, length, line, source_id in graph[node]:
            heapq.heappush(queue, (distance + length, neighbor, coords + (line if not coords else line[1:]), source_ids + [source_id]))
    raise ValueError(f'Disconnected street: {spec["street"]} from {spec["from"]} to {spec["to"]}')


def round_geometry(value):
    if isinstance(value, (list, tuple)):
        return [round_geometry(item) for item in value]
    if isinstance(value, dict):
        return {key: round_geometry(item) for key, item in value.items()}
    return round(value, 7) if isinstance(value, float) else value


def build():
    reference = json.loads((ROOT / 'data/street-reference.json').read_text())
    for row in reference['networks']['sf']:
        row['fromPoint'] = reference['sfNodes'][row['fromNode']]
        row['toPoint'] = reference['sfNodes'][row['toNode']]
    plans = json.loads((ROOT / 'data/geometry-plan.json').read_text())
    result = {}
    for spot_id, plan in plans.items():
        rows = reference['networks'][plan['network']]
        pin = plan['pin']
        selected, _, points = graph_for(rows, pin['street'])
        pin_node = intersection(rows, selected, pin['cross'])
        lon, lat = points[pin_node]
        # Local metric projection: less than a few km across each guide area.
        x_scale = EARTH_RADIUS * math.pi / 180 * math.cos(math.radians(lat))
        y_scale = EARTH_RADIUS * math.pi / 180
        project = lambda x, y: ((x - lon) * x_scale, (y - lat) * y_scale)
        unproject = lambda x, y: (x / x_scale + lon, y / y_scale + lat)
        corridors, lines = [], []
        for spec in plan['corridors']:
            coords, source_ids = trace_route(rows, spec)
            lines.append(LineString([project(*p) for p in coords]))
            corridors.append({
                'name': spec['name'], 'street': spec['street'],
                'from': spec['from'], 'to': spec['to'], 'sourceIds': source_ids,
                'coords': [[round(p[1], 7), round(p[0], 7)] for p in coords]
            })
        area = unary_union(lines).buffer(plan['bufferMeters'], quad_segs=8).simplify(0.2, preserve_topology=True)
        if not area.is_valid or area.is_empty:
            raise ValueError(f'Invalid frontage area for {spot_id}')
        area = orient_polygons(area)
        result[spot_id] = {
            'center': [round(lat, 7), round(lon, 7)],
            'bufferMeters': plan['bufferMeters'],
            'area': round_geometry(mapping(transform(area, unproject, interleaved=False))),
            'corridors': corridors
        }
        print(f'{spot_id}: {sum(line.length for line in lines):.0f} m of streets; {area.area:.0f} m² of adjacent frontage')
    lines = ['// Generated by scripts/build_geometry.py from audited street snapshots.',
             '// Coordinates: corridor/marker [lat, lng]; GeoJSON area [lng, lat].',
             'const HALLOWEEN_GEOMETRY = {']
    lines.extend('  ' + json.dumps(key) + ': ' + json.dumps(value, ensure_ascii=False, separators=(',', ':')) + ',' for key, value in result.items())
    lines.append('};')
    (ROOT / 'geometry.js').write_text('\n'.join(lines) + '\n')


if __name__ == '__main__':
    build()
