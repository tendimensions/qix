"use strict";

function spawnPoint(speed) {
  const ang = Math.random() * Math.PI * 2;
  return {
    x: COLS / 2 + (Math.random() - 0.5) * 20,
    y: ROWS / 2 + (Math.random() - 0.5) * 16,
    vx: Math.cos(ang) * speed,
    vy: Math.sin(ang) * speed,
  };
}

function stepQix(dt) {
  movePoint(qix.a, dt);
  movePoint(qix.b, dt);

  qix.ahist.push({ x: qix.a.x, y: qix.a.y });
  qix.bhist.push({ x: qix.b.x, y: qix.b.y });
  if (qix.ahist.length > 14) { qix.ahist.shift(); qix.bhist.shift(); }

  if (drawing && segmentHitsTrail(qix.a, qix.b)) loseLife("qix");
}

function movePoint(p, dt) {
  const steps = 2;
  for (let s = 0; s < steps; s++) {
    let nx = p.x + p.vx * dt / steps;
    let ny = p.y + p.vy * dt / steps;
    if (cellBlocked(nx, p.y)) { p.vx = -p.vx + (Math.random() - 0.5) * 0.05; nx = p.x; }
    if (cellBlocked(p.x, ny)) { p.vy = -p.vy + (Math.random() - 0.5) * 0.05; ny = p.y; }
    p.x = nx; p.y = ny;
  }
}

function cellBlocked(x, y) {
  const cx = Math.round(x), cy = Math.round(y);
  if (!inBounds(cx, cy)) return true;
  return grid[idx(cx, cy)] === FILLED;
}

function segmentHitsTrail(a, b) {
  const n = 16;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = Math.round(a.x + (b.x - a.x) * t);
    const y = Math.round(a.y + (b.y - a.y) * t);
    if (inBounds(x, y) && grid[idx(x, y)] === TRAIL) return true;
  }
  return false;
}

function drawQix() {
  const h = qix.ahist;
  if (h.length < 2) return;
  ctx.lineWidth = 2;
  for (let i = 0; i < h.length; i++) {
    const hue = (performance.now() / 6 + i * 18) % 360;
    ctx.strokeStyle = `hsl(${hue}, 90%, 60%)`;
    ctx.beginPath();
    ctx.moveTo(qix.ahist[i].x * CELL + CELL / 2, qix.ahist[i].y * CELL + CELL / 2);
    ctx.lineTo(qix.bhist[i].x * CELL + CELL / 2, qix.bhist[i].y * CELL + CELL / 2);
    ctx.stroke();
  }
}
