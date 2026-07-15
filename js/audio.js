"use strict";

// ── Background music ──────────────────────────────────────────────────────────
const bgm = document.getElementById("bgm");

function bgmPlay() {
  actx(); // ensure context + resume listeners are initialised on this user gesture
  bgm.play().catch(() => {});
}

// M key toggles mute from anywhere (works on overlays too)
addEventListener("keydown", (e) => {
  if (e.code === "KeyM") bgm.muted = !bgm.muted;
});

// ── Web Audio context ─────────────────────────────────────────────────────────
let _actx = null;
function actx() {
  if (!_actx) {
    _actx = new AudioContext();
    // Resume eagerly on every user gesture so the context is always running
    // by the time the game loop schedules a sound on the next rAF frame.
    const resume = () => { if (_actx.state !== "running") _actx.resume(); };
    document.addEventListener("keydown",    resume);
    document.addEventListener("pointerdown", resume);
  }
  return _actx;
}

// ── BGM helpers ──────────────────────────────────────────────────────────────
function bgmPause()  { bgm.pause(); }
function bgmResume() { bgm.play().catch(() => {}); }

// ── Primitive helpers ─────────────────────────────────────────────────────────
// All sounds are scheduled OFFSET seconds ahead so a resuming AudioContext
// never misses a note that was placed exactly at currentTime.
const OFFSET = 0.02;

function _tone(freq, type, peak, t, dur) {
  const c = actx();
  // Clamp to at least OFFSET ahead in case the context was just resumed.
  const s = Math.max(t, c.currentTime + OFFSET);
  const osc = c.createOscillator();
  const g   = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, s);
  g.gain.setValueAtTime(0, s);
  g.gain.linearRampToValueAtTime(peak, s + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, s + dur);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(s);
  osc.stop(s + dur + 0.02);
}

function _sweep(f0, f1, type, peak, t, dur) {
  const c = actx();
  const s = Math.max(t, c.currentTime + OFFSET);
  const osc = c.createOscillator();
  const g   = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(f0, s);
  osc.frequency.exponentialRampToValueAtTime(f1, s + dur);
  g.gain.setValueAtTime(peak, s);
  g.gain.exponentialRampToValueAtTime(0.0001, s + dur);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(s);
  osc.stop(s + dur + 0.02);
}

// ── Sound effects ─────────────────────────────────────────────────────────────

// Short square tick while drawing — rapid calls blend into a buzzy trail sound.
function sfxDraw() {
  const t = actx().currentTime + OFFSET;
  _tone(320, "square", 0.045, t, 0.028);
}

// Ascending sweep on territory claim.
function sfxClaim() {
  const t = actx().currentTime + OFFSET;
  _sweep(200, 900, "sine", 0.25, t, 0.22);
}

// Two-note jingle for extra life.
function sfxExtraLife() {
  const t = actx().currentTime + OFFSET;
  _tone(523, "triangle", 0.22, t,        0.12);
  _tone(784, "triangle", 0.22, t + 0.11, 0.15);
}

// Descending sweep on death.
function sfxDie() {
  const t = actx().currentTime + OFFSET;
  _sweep(440, 40, "sawtooth", 0.22, t, 0.5);
}

// Ascending four-note arpeggio fanfare on level clear.
function sfxLevelClear() {
  const t = actx().currentTime + OFFSET;
  [523, 659, 784, 1047].forEach((f, i) => _tone(f, "sine", 0.22, t + i * 0.1, 0.18));
}
