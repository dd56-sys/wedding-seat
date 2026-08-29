const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

function loadRouteFunctions(){
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const start = html.indexOf('function buildRouteObstacles(');
  const end = html.indexOf('\nfunction ensureRouteSvg', start);
  const source = html.slice(start, end);
  return new Function('tables', 'landmarks', source + '; return { buildRouteObstacles, findRoute, routeTargetForSeat, arrowAngleForSeat };');
}

function segmentIntersectsRect(a, b, rect){
  const steps = 1000;
  for(let i=0; i<=steps; i++){
    const t = i / steps;
    const x = a.x + (b.x-a.x)*t;
    const y = a.y + (b.y-a.y)*t;
    if(x > rect.x0 && x < rect.x1 && y > rect.y0 && y < rect.y1) return true;
  }
  return false;
}

function routeIntersects(route, rect){
  return route.some((point, index) => index > 0 && segmentIntersectsRect(route[index-1], point, rect));
}

test('routes around a flower walkway before reaching an upper table', () => {
  const { findRoute } = loadRouteFunctions()([], []);
  const flowerWalkway = {x0:80, y0:280, x1:520, y1:320};
  const route = findRoute({x:300, y:600}, {x:300, y:56}, [flowerWalkway]);

  assert.ok(route);
  assert.equal(routeIntersects(route, flowerWalkway), false);
  assert.ok(route.some(point => point.x <= flowerWalkway.x0 || point.x >= flowerWalkway.x1));
});

test('does not draw a route when obstacles fully enclose the destination', () => {
  const { findRoute } = loadRouteFunctions()([], []);
  const walls = [
    {x0:260, y0:100, x1:340, y1:110},
    {x0:260, y0:190, x1:340, y1:200},
    {x0:260, y0:100, x1:270, y1:200},
    {x0:330, y0:100, x1:340, y1:200},
  ];
  const route = findRoute({x:300, y:600}, {x:300, y:150}, walls);

  assert.equal(route, null);
});

test('targets the correct side of a table for each seat row', () => {
  const { findRoute, routeTargetForSeat, arrowAngleForSeat } = loadRouteFunctions()([], []);
  const table = {id:'table-1', x:200, y:180};
  const tableW = 250;
  const tableH = 260;
  const tableBlock = {x0:table.x, y0:table.y, x1:table.x+tableW, y1:table.y+tableH};
  const entrance = {x:325, y:600};

  const topTarget = routeTargetForSeat(table, 0, tableW, tableH);
  const bottomTarget = routeTargetForSeat(table, 3, tableW, tableH);
  const topRoute = findRoute(entrance, topTarget, [tableBlock]);
  const bottomRoute = findRoute(entrance, bottomTarget, [tableBlock]);

  assert.ok(topRoute);
  assert.ok(bottomRoute);
  assert.deepEqual(topRoute.at(-1), topTarget);
  assert.deepEqual(bottomRoute.at(-1), bottomTarget);
  assert.ok(topTarget.y < table.y);
  assert.ok(bottomTarget.y > table.y + tableH);
  assert.equal(arrowAngleForSeat(0), 90);
  assert.equal(arrowAngleForSeat(3), null);
  assert.equal(routeIntersects(topRoute, tableBlock), false);
  assert.equal(routeIntersects(bottomRoute, tableBlock), false);
});
