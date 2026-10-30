const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const reference = JSON.parse(fs.readFileSync(path.join(root, 'data/street-reference.json')));
const plans = JSON.parse(fs.readFileSync(path.join(root, 'data/geometry-plan.json')));
const closures = JSON.parse(fs.readFileSync(path.join(root, 'data/sf-closure-reference.json'))).rows;
const guides = vm.runInNewContext(
  fs.readFileSync(path.join(root, 'geometry.js'), 'utf8') +
  fs.readFileSync(path.join(root, 'guides.js'), 'utf8') + '; HALLOWEEN_GUIDES'
);
const scale = Math.PI * 6371008.8 / 180;

function distance(a, b) {
  return Math.hypot((a[0] - b[0]) * Math.cos((a[1] + b[1]) * Math.PI / 360), a[1] - b[1]) * scale;
}

function distanceToSegment(point, a, b) {
  const cos = Math.cos(point[1] * Math.PI / 180);
  const ax = (a[0] - point[0]) * cos * scale, ay = (a[1] - point[1]) * scale;
  const bx = (b[0] - point[0]) * cos * scale, by = (b[1] - point[1]) * scale;
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, -(ax * dx + ay * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(ax + t * dx, ay + t * dy);
}

function distanceToLines(point, lines) {
  let best = Infinity;
  for (const line of lines) for (let i = 1; i < line.length; i++) best = Math.min(best, distanceToSegment(point, line[i - 1], line[i]));
  return best;
}

function samples(line) {
  const result = [line[0]];
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1], b = line[i];
    const steps = Math.max(1, Math.ceil(distance(a, b) / 15));
    for (let j = 1; j <= steps; j++) result.push([a[0] + (b[0] - a[0]) * j / steps, a[1] + (b[1] - a[1]) * j / steps]);
  }
  return result;
}

function junction(rows, spec, cross) {
  const selected = rows.filter(row => row.name === spec.street && (!spec.wayIds || spec.wayIds.includes(row.id)));
  assert.ok(selected.length, 'Reference street exists: ' + spec.street);
  if (selected[0].nodes) {
    const target = new Map(selected.flatMap(row => row.nodes.map((id, i) => [id, row.coords[i]])));
    const crossNodes = new Set(rows.filter(row => row.name === cross).flatMap(row => row.nodes));
    const found = [...target.keys()].filter(id => crossNodes.has(id));
    assert.equal(found.length, 1, 'Unambiguous road junction: ' + cross);
    return target.get(found[0]);
  }
  const found = new Set();
  for (const row of selected) {
    if (row.from === cross) found.add(row.fromNode);
    if (row.to === cross) found.add(row.toNode);
  }
  assert.equal(found.size, 1, 'Unambiguous CNN junction: ' + cross);
  return reference.sfNodes[[...found][0]];
}

function insideRing(point, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i], b = ring[j];
    if ((a[1] > point[1]) !== (b[1] > point[1]) && point[0] < (b[0] - a[0]) * (point[1] - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
}

function contains(area, point) {
  const polygons = area.type === 'Polygon' ? [area.coordinates] : area.coordinates;
  return polygons.some(rings => insideRing(point, rings[0]) && !rings.slice(1).some(ring => insideRing(point, ring)));
}

for (const region of guides) for (const spot of region.spots) {
  const plan = plans[spot.id];
  assert.ok(plan, 'Every neighborhood has an audited plan');
  const rows = reference.networks[plan.network];
  assert.equal(spot.corridors.length, plan.corridors.length, spot.id + ': all planned streets are shown');
  const pin = [spot.center[1], spot.center[0]];
  assert.ok(distance(pin, junction(rows, plan.pin, plan.pin.cross)) < 0.2, spot.id + ': pin matches its directions intersection');
  const lines = spot.corridors.map(c => c.coords.map(([lat, lon]) => [lon, lat]));
  for (let i = 0; i < spot.corridors.length; i++) {
    const corridor = spot.corridors[i], spec = plan.corridors[i], line = lines[i];
    assert.equal(corridor.street, spec.street);
    const sourceRows = corridor.sourceIds.map(id => rows.find(row => row.id === id));
    if (spec.permitCase) {
      const permitted = closures.filter(row => row.case_name === spec.permitCase && row.street === spec.street && row.status === 'Permitted').map(row => row.cnn).sort();
      assert.ok(permitted.length, 'Closure evidence exists');
      assert.deepEqual([...corridor.sourceIds].sort(), permitted, spot.id + ': full permitted block extent');
    }
    assert.ok(sourceRows.every(row => row && row.name === spec.street), spot.id + ': segments belong to the named street');
    assert.ok(sourceRows.every(row => !['private', 'no'].includes(row.access)), 'No private ways');
    if (/Canal Walk/.test(spec.street)) assert.ok(sourceRows.every(row => ['footway', 'path', 'pedestrian'].includes(row.highway)), 'Canal highlights follow walkways rather than water');
    assert.ok(distance(line[0], junction(rows, spec, spec.from)) < 0.2, spot.id + ': correct start junction');
    assert.ok(distance(line.at(-1), junction(rows, spec, spec.to)) < 0.2, spot.id + ': correct end junction');
    for (const point of samples(line)) {
      assert.ok(distanceToLines(point, sourceRows.map(row => row.coords)) < 0.25, spot.id + ': line stays on source street geometry');
      assert.ok(contains(spot.area, point), spot.id + ': frontage contains its street');
    }
  }
  assert.ok(['Polygon', 'MultiPolygon'].includes(spot.area.type));
  assert.ok(contains(spot.area, pin), spot.id + ': pin is within the guide area');
  const polygons = spot.area.type === 'Polygon' ? [spot.area.coordinates] : spot.area.coordinates;
  for (const rings of polygons) for (const [ringIndex, ring] of rings.entries()) {
    assert.ok(ring.length >= 4);
    assert.equal(distance(ring[0], ring.at(-1)), 0, 'Closed polygon rings');
    const origin = ring[0];
    const signedArea = ring.slice(1).reduce((sum, point, index) => {
      const previous = ring[index];
      return sum + (previous[0] - origin[0]) * (point[1] - origin[1]) - (point[0] - origin[0]) * (previous[1] - origin[1]);
    }, 0);
    assert.ok(ringIndex === 0 ? signedArea > 0 : signedArea < 0, 'GeoJSON exterior/hole winding follows the right-hand rule');
    for (const point of ring) {
      assert.ok(point.length === 2 && point.every(Number.isFinite), 'Finite longitude/latitude');
      assert.ok(distanceToLines(point, lines) <= plan.bufferMeters + 0.25, spot.id + ': shading stays near the audited streets');
    }
  }
  if (spot.id === 'mission') assert.equal(contains(spot.area, [-122.4203, 37.753]), false, 'Unrelated blocks between Shotwell and Fair Oaks are not shaded');
  console.log('PASS geometry ' + spot.id);
}
