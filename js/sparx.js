"use strict";

function spawnSparx() {
  if (sparx.length === 0) { addSpark(1); addSpark(-1); }
  else if (sparx.length < MAX_SPARX) { addSpark(Math.random() < 0.5 ? 1 : -1); }
  nextSparxAt += SPARX_INTERVAL_MS;
}

function addSpark(dir) {
  sparx.push({ x: COLS >> 1, y: 0, hx: dir, hy: 0 });
}

const SPARX_NB = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
function moveSpark(s) {
  let best = null, bestScore = -Infinity;
  for (const [dx, dy] of SPARX_NB) {
    const nx = s.x + dx, ny = s.y + dy;
    if (!inBounds(nx, ny) || !isPerimeter(nx, ny)) continue;
    if (dx === -s.hx && dy === -s.hy) continue; // don't reverse
    const score = dx * s.hx + dy * s.hy + Math.random() * 0.3;
    if (score > bestScore) { bestScore = score; best = [dx, dy, nx, ny]; }
  }
  if (!best) {
    for (const [dx, dy] of SPARX_NB) {
      const nx = s.x + dx, ny = s.y + dy;
      if (inBounds(nx, ny) && isPerimeter(nx, ny)) { best = [dx, dy, nx, ny]; break; }
    }
  }
  if (!best) return;
  s.hx = best[0]; s.hy = best[1];
  s.x = best[2]; s.y = best[3];
}

let sparxAcc = 0;
function stepSparx(dtMs) {
  if (levelClock >= nextSparxAt) spawnSparx();
  sparxAcc += dtMs;
  const interval = Math.max(20, SPARX_MS - (level - 1) * 6);
  while (sparxAcc >= interval) {
    sparxAcc -= interval;
    for (const s of sparx) moveSpark(s);
  }
  if (!drawing) {
    for (const s of sparx) {
      if (s.x === player.x && s.y === player.y) { loseLife(); break; }
    }
  }
}

// The Fuse burns along the line you're drawing whenever you stop; moving outruns
// it. idleMs tracks how long since the marker last moved, so behaviour is the
// same regardless of frame rate.
function stepFuse(dt) {
  if (!drawing || trail.length === 0) { fuseIdx = -1; fuseAcc = 0; return; }
  if (idleMs < FUSE_GRACE_MS) return; // still moving: hold the fuse where it is
  if (fuseIdx < 0) { fuseIdx = 0; fuseAcc = 0; } // light it at the base of the stix
  fuseAcc += dt;
  while (fuseAcc >= FUSE_MS) {
    fuseAcc -= FUSE_MS;
    fuseIdx++;
    if (fuseIdx >= trail.length - 1) { loseLife(); return; }
  }
}
