"use strict";

const dirs = {
  ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 },
  KeyW: { x: 0, y: -1 }, KeyS: { x: 0, y: 1 },
  KeyA: { x: -1, y: 0 }, KeyD: { x: 1, y: 0 },
};
const heldStack = [];
let spaceHeld = false;

addEventListener("keydown", (e) => {
  if (!running) return; // overlays manage their own input
  if (e.code === "Space") { e.preventDefault(); spaceHeld = true; return; }
  const d = dirs[e.code];
  if (!d) return;
  e.preventDefault();
  if (!heldStack.some(h => h.code === e.code)) heldStack.push({ code: e.code, d });
});
addEventListener("keyup", (e) => {
  if (e.code === "Space") { spaceHeld = false; return; }
  const i = heldStack.findIndex(h => h.code === e.code);
  if (i !== -1) heldStack.splice(i, 1);
});

function desiredDir() {
  return heldStack.length ? heldStack[heldStack.length - 1].d : null;
}

let stepAcc = 0;

function stepPlayer() {
  const d = desiredDir();
  if (!d) return false;
  const nx = player.x + d.x, ny = player.y + d.y;
  if (!inBounds(nx, ny)) return false;
  const v = grid[idx(nx, ny)];

  if (drawing) {
    if (v === EMPTY) {
      grid[idx(nx, ny)] = TRAIL;
      trail.push(idx(nx, ny));
      player.x = nx; player.y = ny;
      sfxDraw();
      return true;
    } else if (v === FILLED) {
      player.x = nx; player.y = ny;
      commitTrail();
      return true;
    }
    return false; // v === TRAIL: refuse to cross our own line
  } else {
    if (v === FILLED) {
      if (!isEdge(nx, ny)) return false; // stay on the border, never inside
      player.x = nx; player.y = ny;
      return true;
    } else if (v === EMPTY && spaceHeld) {
      drawing = true;
      grid[idx(nx, ny)] = TRAIL;
      trail = [idx(nx, ny)];
      player.x = nx; player.y = ny;
      sfxDraw();
      return true;
    }
    return false;
  }
}

function commitTrail() {
  sfxClaim();
  for (const i of trail) grid[i] = FILLED;
  trail = [];
  drawing = false;
  fuseIdx = -1;

  // Keep the side that holds the Qix open; claim everything it can't reach.
  const reachable = new Uint8Array(COLS * ROWS);
  const qx = Math.max(0, Math.min(COLS - 1, Math.round(qix.a.x)));
  const qy = Math.max(0, Math.min(ROWS - 1, Math.round(qix.a.y)));
  const stack = [];
  if (grid[idx(qx, qy)] === EMPTY) { reachable[idx(qx, qy)] = 1; stack.push(idx(qx, qy)); }
  while (stack.length) {
    const c = stack.pop();
    const cx = c % COLS, cy = (c / COLS) | 0;
    const nb = [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]];
    for (const [ax, ay] of nb) {
      if (!inBounds(ax, ay)) continue;
      const ai = idx(ax, ay);
      if (grid[ai] === EMPTY && !reachable[ai]) { reachable[ai] = 1; stack.push(ai); }
    }
  }

  let claimed = 0;
  for (let i = 0; i < grid.length; i++) {
    if (grid[i] === EMPTY && !reachable[i]) { grid[i] = FILLED; claimed++; }
  }
  score += claimed + 5;

  recountFilled();
  relocateSparx();
  renderLand();
  awardExtraLives();
  updateHud();

  if (percent() >= WIN_PERCENT) winLevel();
}
