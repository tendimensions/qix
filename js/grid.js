"use strict";

// A claimed cell is "on the edge" if any of its 8 neighbours is open space.
// The marker may only travel on edge cells, so it can never wander into the
// interior of territory it has already filled.
function isEdge(x, y) {
  if (grid[idx(x, y)] !== FILLED) return false;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const ax = x + dx, ay = y + dy;
      if (inBounds(ax, ay) && grid[idx(ax, ay)] === EMPTY) return true;
    }
  }
  return false;
}

// A perimeter cell has open space 4-adjacent: the marker can always dive from it
// and Sparx travel along these cells.
function isPerimeter(x, y) {
  if (grid[idx(x, y)] !== FILLED) return false;
  return (y > 0 && grid[idx(x, y - 1)] === EMPTY) ||
         (y < ROWS - 1 && grid[idx(x, y + 1)] === EMPTY) ||
         (x > 0 && grid[idx(x - 1, y)] === EMPTY) ||
         (x < COLS - 1 && grid[idx(x + 1, y)] === EMPTY);
}

// Nearest border cell from which the marker can actually act, preferring one
// well away from all Sparx so the player never respawns on top of one.
function safeSpawn() {
  const cx = COLS >> 1;
  const seen = new Uint8Array(COLS * ROWS);
  const start = idx(cx, 0);
  const q = [start];
  seen[start] = 1;
  let nearest = null;
  for (let qi = 0; qi < q.length; qi++) {
    const c = q[qi], x = c % COLS, y = (c / COLS) | 0;
    if (isPerimeter(x, y)) {
      if (!nearest) nearest = { x, y };
      const minDist = (sparx && sparx.length)
        ? Math.min(...sparx.map(s => Math.max(Math.abs(x - s.x), Math.abs(y - s.y))))
        : Infinity;
      if (minDist >= RELOCATE_MIN_DIST) return { x, y };
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const ax = x + dx, ay = y + dy;
      if (!inBounds(ax, ay)) continue;
      const ai = idx(ax, ay);
      if (!seen[ai]) { seen[ai] = 1; q.push(ai); }
    }
  }
  return nearest || { x: cx, y: 0 };
}

// After a claim the border moves; any Spark now stranded inside filled territory
// is pulled out to a border cell, preferring one well away from the marker so it
// can't materialise on top of the player.
function relocateSparx() {
  for (const s of sparx) {
    if (isPerimeter(s.x, s.y)) continue;
    const seen = new Uint8Array(COLS * ROWS);
    const start = idx(s.x, s.y);
    const q = [start];
    seen[start] = 1;
    let nearest = null, away = null;
    for (let qi = 0; qi < q.length && !away; qi++) {
      const c = q[qi], cx = c % COLS, cy = (c / COLS) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ax = cx + dx, ay = cy + dy;
        if (!inBounds(ax, ay)) continue;
        const ai = idx(ax, ay);
        if (seen[ai]) continue;
        seen[ai] = 1;
        if (isPerimeter(ax, ay)) {
          if (!nearest) nearest = [ax, ay];
          const d = Math.max(Math.abs(ax - player.x), Math.abs(ay - player.y));
          if (d >= RELOCATE_MIN_DIST) { away = [ax, ay]; break; }
        } else {
          q.push(ai);
        }
      }
    }
    const target = away || nearest;
    if (target) { s.x = target[0]; s.y = target[1]; s.hx = 0; s.hy = 0; }
  }
}

function recountFilled() {
  let n = 0;
  for (let i = 0; i < grid.length; i++) if (grid[i] === FILLED) n++;
  filledCount = n;
}

function percent() {
  return ((filledCount - initialFilled) / claimableTotal) * 100;
}

function renderLand() {
  lctx.clearRect(0, 0, W, H);
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (grid[idx(x, y)] !== FILLED) continue;
      const onEdge = x === 0 || y === 0 || x === COLS - 1 || y === ROWS - 1;
      lctx.fillStyle = onEdge ? COLOR_BORDER : COLOR_FILLED;
      lctx.fillRect(x * CELL, y * CELL, CELL, CELL);
    }
  }
}
