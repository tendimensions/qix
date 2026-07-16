"use strict";

function render() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  if (!grid) return;
  ctx.drawImage(land, 0, 0);

  if (running || trail.length) {
    ctx.fillStyle = COLOR_TRAIL;
    for (const i of trail) {
      const x = i % COLS, y = (i / COLS) | 0;
      ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
    }
  }

  if (fuseIdx >= 0 && drawing) {
    const tip = Math.min(fuseIdx, trail.length - 1);
    ctx.fillStyle = "#6e2400";
    for (let k = 0; k < tip; k++) {
      const i = trail[k];
      ctx.fillRect((i % COLS) * CELL, ((i / COLS) | 0) * CELL, CELL, CELL);
    }
    const ti = trail[tip];
    ctx.fillStyle = COLOR_FUSE;
    ctx.fillRect((ti % COLS) * CELL - 1, ((ti / COLS) | 0) * CELL - 1, CELL + 2, CELL + 2);
  }

  drawQix();

  for (const s of sparx) {
    ctx.fillStyle = COLOR_SPARX;
    ctx.beginPath();
    ctx.arc(s.x * CELL + CELL / 2, s.y * CELL + CELL / 2, CELL * 0.9, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = COLOR_PLAYER;
  ctx.fillRect(player.x * CELL - 1, player.y * CELL - 1, CELL + 2, CELL + 2);

  drawParticles(ctx);

  if (flashText && performance.now() < flashUntil) {
    ctx.fillStyle = flashColor;
    ctx.font = "bold 26px 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.fillText(flashText, W / 2, H / 2);
    ctx.textAlign = "left";
  }
}
