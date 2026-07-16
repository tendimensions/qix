// ===============================
// Simple JS Particle Engine
// ===============================

// ── Effect toggles ──────────────────────────────────────────────────────────────
const ENABLE_FIREWORKS   = true;    // auto-spawn + click-to-launch
const ENABLE_MOUSE_TRAIL = true;   // colourful particles that follow the cursor
const ENABLE_DUST_MOTES  = false;   // dim ambient motes with occasional flare
const ENABLE_STARFIELD   = false;   // three-layer horizontal parallax starfield

// ── Dust mote settings ─────────────────────────────────────────────────────────────
const DUST_COUNT = 45;

// ── Parallax starfield layers ─────────────────────────────────────────────────────────
// Deep/slow = small + dark; near/fast = large + bright.
const STAR_LAYERS = [
    { layerName: "back", speedMin: 0.20, speedMax: 0.40, size: 0.7, lightnessMin: 22, lightnessMax: 36, alphaMin: 0.15, alphaMax: 0.30, count: 180 },
    { layerName: "middle", speedMin: 0.65, speedMax: 1.05, size: 1.2, lightnessMin: 48, lightnessMax: 63, alphaMin: 0.35, alphaMax: 0.55, count: 110 },
    { layerName: "front", speedMin: 1.55, speedMax: 2.25, size: 2.0, lightnessMin: 72, lightnessMax: 88, alphaMin: 0.60, alphaMax: 0.85, count: 60 },
];

// Get canvas and context
const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');

// Resize canvas to fill window
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Particle class
class Particle {
    constructor(x, y, vx, vy, size, color, life, gravity = 0) {
        this.x = x;
        this.y = y;
        this.vx = vx; // velocity X
        this.vy = vy; // velocity Y
        this.size = size;
        this.color = color;
        this.life = life; // frames until death
        this.maxLife = life;
        this.gravity = gravity;
    }

    update() {
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
    }

    draw(ctx) {
        ctx.globalAlpha = this.life / this.maxLife;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    isAlive() {
        return this.life > 0;
    }
}

// Dust motes — ambient, dim, occasionally catching light
class DustMote extends Particle {
    constructor() {
        const angle = Math.random() * Math.PI * 2;
        const speed = rand(0.08, 0.28);
        super(
            rand(0, canvas.width), rand(0, canvas.height),
            Math.cos(angle) * speed, Math.sin(angle) * speed,
            rand(1, 2.5), 'hsl(38, 18%, 82%)', Infinity, 0
        );
        this.angle      = angle;
        this.speed      = speed;
        this.steerTimer = Math.floor(rand(40, 100));
        this.flareTimer = 0;
        this.flareDur   = 0;
        this.nextFlare  = Math.floor(rand(200, 600));
    }

    update() {
        // Bounded angular steering: nudge direction at random intervals
        if (--this.steerTimer <= 0) {
            this.angle += rand(-Math.PI / 12, Math.PI / 12); // ±15°
            this.speed  = Math.min(0.32, Math.max(0.05, this.speed + rand(-0.05, 0.05)));
            this.vx     = Math.cos(this.angle) * this.speed;
            this.vy     = Math.sin(this.angle) * this.speed;
            this.steerTimer = Math.floor(rand(40, 100));
        }

        // Flare: count down active flare; schedule next when idle
        if (this.flareTimer > 0) {
            this.flareTimer--;
        } else if (--this.nextFlare <= 0) {
            this.flareDur   = Math.floor(rand(50, 90));
            this.flareTimer = this.flareDur;
            this.nextFlare  = Math.floor(rand(200, 600));
        }

        this.x += this.vx;
        this.y += this.vy;

        // Expire when off-screen; the mote pool will spawn a replacement
        if (this.x < -6 || this.x > canvas.width  + 6 ||
            this.y < -6 || this.y > canvas.height + 6) {
            this.life = 0;
        }
    }

    draw(ctx) {
        // Bell-curve alpha: dim at rest, smooth peak at midpoint of flare
        let alpha = 0.07;
        if (this.flareTimer > 0) {
            alpha = 0.07 + 0.55 * Math.sin(Math.PI * (1 - this.flareTimer / this.flareDur));
        }
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

// Parallax star — scrolls horizontally, wraps at left edge
class Star extends Particle {
    constructor(layer) {
        const cfg       = STAR_LAYERS[layer];
        const lightness = Math.floor(rand(cfg.lightnessMin, cfg.lightnessMax));
        const hue       = Math.floor(rand(195, 245)); // cool blue → warm white range
        const sat       = Math.floor(rand(5, 20));
        const speed     = rand(cfg.speedMin, cfg.speedMax);
        super(
            rand(0, canvas.width), rand(0, canvas.height),
            -speed, 0,
            cfg.size, `hsl(${hue}, ${sat}%, ${lightness}%)`, Infinity, 0
        );
        this.alpha = rand(cfg.alphaMin, cfg.alphaMax);
    }

    update() {
        this.x += this.vx;
        if (this.x < -this.size) {
            this.x = canvas.width + this.size;
            this.y = rand(0, canvas.height);
        }
    }

    draw(ctx) {
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

let particles = [];

// Fireworks
let fireworks = [];
let nextFireworkAt = Date.now() + rand(800, 2500);

function rand(min, max) { return Math.random() * (max - min) + min; }

function spawnFirework() {
    // Pick a random apex in the upper 25%–75% of the screen, then derive vy.
    const apexY = rand(canvas.height * 0.25, canvas.height * 0.75);
    const dy    = canvas.height - apexY;
    fireworks.push({
        x:   rand(canvas.width * 0.2, canvas.width * 0.8),
        y:   canvas.height,
        vx:  rand(-1.2, 1.2),
        vy:  -Math.sqrt(2 * 0.25 * dy),
        hue: Math.floor(Math.random() * 360),
    });
}

function explode(fw) {
    const count = 80 + Math.floor(Math.random() * 40);
    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const speed = rand(1, 7);
        particles.push(new Particle(
            fw.x, fw.y,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            rand(1.5, 3.5),
            `hsl(${fw.hue + rand(-25, 25)}, 100%, 65%)`,
            rand(70, 130),
            0.12
        ));
    }
}

// Click to launch a firework from bottom-centre angled toward the click position
canvas.addEventListener('click', e => {
    if (!ENABLE_FIREWORKS) return;
    const dy = canvas.height - e.clientY;
    const vy = -Math.sqrt(2 * 0.25 * Math.max(dy, 1)); // velocity to reach click Y
    const t  = Math.abs(vy) / 0.25;                    // frames to apex
    const vx = (e.clientX - canvas.width / 2) / t;     // drift to reach click X
    fireworks.push({
        x:   canvas.width / 2,
        y:   canvas.height,
        vx,
        vy,
        hue: Math.floor(Math.random() * 360),
    });
});

// Spawn particles at mouse position
let mouse = { x: canvas.width / 2, y: canvas.height / 2 };

// Parallax starfield
let stars = [];
if (ENABLE_STARFIELD) {
    STAR_LAYERS.forEach((cfg, i) => {
        for (let j = 0; j < cfg.count; j++) stars.push(new Star(i));
    });
}

// Dust motes — pool maintained at DUST_COUNT
let motes = [];
if (ENABLE_DUST_MOTES) {
    for (let i = 0; i < DUST_COUNT; i++) motes.push(new DustMote());
}
canvas.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

// Create new particles
function spawnParticles() {
    for (let i = 0; i < 5; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2;
        particles.push(new Particle(
            mouse.x,
            mouse.y,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            Math.random() * 3 + 2,
            `hsl(${Math.random() * 360}, 100%, 50%)`,
            60 + Math.random() * 40
        ));
    }
}

// Main animation loop
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Starfield (deepest layer, drawn first)
    if (ENABLE_STARFIELD) {
        stars.forEach(s => { s.update(); s.draw(ctx); });
    }

    // Dust motes (ambient mid-background)
    if (ENABLE_DUST_MOTES) {
        motes = motes.filter(m => m.isAlive());
        while (motes.length < DUST_COUNT) motes.push(new DustMote());
        motes.forEach(m => { m.update(); m.draw(ctx); });
    }

    // Mouse trail (adds to shared particles[])
    if (ENABLE_MOUSE_TRAIL) spawnParticles();

    // Fireworks: auto-spawn + rocket physics (also populates particles[])
    if (ENABLE_FIREWORKS) {
        const now = Date.now();
        if (now >= nextFireworkAt) {
            spawnFirework();
            nextFireworkAt = now + rand(800, 2500);
        }

        fireworks = fireworks.filter(fw => {
            fw.vy += 0.25;
            fw.x  += fw.vx;
            fw.y  += fw.vy;
            particles.push(new Particle(fw.x, fw.y, rand(-0.3, 0.3), rand(-0.3, 0.3), 2, `hsl(${fw.hue}, 100%, 85%)`, 18));
            const atApex = fw.vy >= 0;
            if (atApex) { explode(fw); return false; }
            return true;
        });
    }

    // Mouse trail + explosion particles (always processed so in-flight bursts finish)
    particles = particles.filter(p => p.isAlive());
    particles.forEach(p => {
        p.update();
        p.draw(ctx);
    });

    // Rocket heads drawn on top of everything
    if (ENABLE_FIREWORKS) {
        fireworks.forEach(fw => {
            ctx.beginPath();
            ctx.arc(fw.x, fw.y, 3, 0, Math.PI * 2);
            ctx.fillStyle = `hsl(${fw.hue}, 100%, 95%)`;
            ctx.fill();
        });
    }

    requestAnimationFrame(animate);
}

// Start animation
animate();
