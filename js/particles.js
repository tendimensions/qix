"use strict";

// ── Gameplay particle effects ─────────────────────────────────────────────────
// Small bursts triggered by game events (claim, death, extra life, level
// clear, high score). Drawn directly onto the game canvas in grid-pixel
// space, on top of everything except the flash-text overlay.

const MAX_PARTICLES = 400;

class GParticle {
  constructor(x, y, vx, vy, size, color, life, gravity = 0) {
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.size = size;
    this.color = color;
    this.life = life;
    this.maxLife = life;
    this.gravity = gravity;
  }
  update(dt) {
    this.vy += this.gravity * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
  }
  draw(ctx) {
    ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
    ctx.globalAlpha = 1;
  }
  isAlive() { return this.life > 0; }
}

let gparticles = [];

function prand(min, max) { return Math.random() * (max - min) + min; }

function spawnBurst(px, py, colors, count, opts = {}) {
  const speed = opts.speed || [0.03, 0.10];
  const size = opts.size || [2, 4];
  const life = opts.life || [350, 650];
  const gravity = opts.gravity || 0;
  const colorList = Array.isArray(colors) ? colors : [colors];
  for (let i = 0; i < count; i++) {
    const angle = prand(0, Math.PI * 2);
    const spd = prand(speed[0], speed[1]);
    gparticles.push(new GParticle(
      px, py,
      Math.cos(angle) * spd, Math.sin(angle) * spd,
      prand(size[0], size[1]),
      colorList[(Math.random() * colorList.length) | 0],
      prand(life[0], life[1]),
      gravity
    ));
  }
  if (gparticles.length > MAX_PARTICLES) gparticles.splice(0, gparticles.length - MAX_PARTICLES);
}

function stepParticles(dtMs) {
  if (!gparticles.length) return;
  for (const p of gparticles) p.update(dtMs);
  gparticles = gparticles.filter(p => p.isAlive());
}

function drawParticles(ctx) {
  for (const p of gparticles) p.draw(ctx);
}

function clearParticles() {
  gparticles = [];
}

// ── Event emitters ────────────────────────────────────────────────────────────

// Gold sparkle pop where the trail closes and territory locks in.
function burstClaim(gx, gy) {
  spawnBurst(gx * CELL, gy * CELL, COLOR_TRAIL, 14, {
    speed: [0.02, 0.08], size: [2, 3], life: [250, 450],
  });
}

// Warm debris scatters and falls where the player was caught.
function burstDeath(gx, gy) {
  spawnBurst(gx * CELL, gy * CELL, ["#ff3b5c", "#ff8a1e"], 22, {
    speed: [0.04, 0.14], size: [2, 4], life: [500, 900], gravity: 0.00045,
  });
}

// Green sparkle floats upward, mirroring the "EXTRA LIFE" flash color.
function burstExtraLife(gx, gy) {
  spawnBurst(gx * CELL, gy * CELL, "#7cfc6a", 18, {
    speed: [0.02, 0.07], size: [2, 3], life: [500, 800], gravity: -0.00025,
  });
}

// Multi-hue confetti scattered across the playfield on level clear.
function burstLevelClear() {
  const hues = [];
  for (let i = 0; i < 6; i++) hues.push(`hsl(${(i * 60) % 360}, 90%, 65%)`);
  for (let i = 0; i < 5; i++) {
    spawnBurst(prand(W * 0.15, W * 0.85), prand(H * 0.2, H * 0.7), hues, 20, {
      speed: [0.03, 0.12], size: [2, 4], life: [700, 1200], gravity: 0.0003,
    });
  }
}

// Gold sparkle when a new high score is achieved.
function burstHighScore() {
  spawnBurst(W / 2, H / 2, ["#ffd700", "#fff2a8"], 30, {
    speed: [0.03, 0.11], size: [2, 4], life: [600, 1000], gravity: 0.0002,
  });
}

// Dim red fizzle falling from where the player died into game over.
function burstGameOver(gx, gy) {
  spawnBurst(gx * CELL, gy * CELL, "#8a2030", 16, {
    speed: [0.01, 0.05], size: [2, 3], life: [600, 1000], gravity: 0.0004,
  });
}
