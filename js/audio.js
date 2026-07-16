"use strict";

// ── Background music ──────────────────────────────────────────────────────────
const bgm = document.getElementById("bgm");

function bgmPlay()   { bgm.play().catch(() => {}); }
function bgmPause()  { bgm.pause(); }
function bgmResume() { bgm.play().catch(() => {}); }
function bgmStop()   { bgm.pause(); bgm.currentTime = 0; }
function bgmDuck()   { bgm.volume = 0.5; }
function bgmUnduck() { bgm.volume = 1.0; }

// M key toggles mute for all audio from anywhere (works on overlays too)
addEventListener("keydown", (e) => {
  if (e.code !== "KeyM") return;
  const muted = !bgm.muted;
  bgm.muted = muted;
  for (const s of Object.values(_sfx)) s.muted = muted;
});

// ── Sound effects ─────────────────────────────────────────────────────────────
const _sfx = {
  draw:       new Audio("audio/sfx-draw.mp3"),
  claim:      new Audio("audio/sfx-claim.mp3"),
  die:        new Audio("audio/sfx-die.mp3"),
  extralife:  new Audio("audio/sfx-extralife.mp3"),
  levelclear: new Audio("audio/sfx-levelclear.mp3"),
  gameover:   new Audio("audio/sfx-gameover.mp3"),
  highscore:  new Audio("audio/sfx-highscore.mp3"),
};
_sfx.draw.loop = true;

function _play(sfx) {
  sfx.currentTime = 0;
  sfx.play().catch(() => {});
}

// Drawing buzz — loops while the player is drawing; stopped when drawing ends.
function sfxDraw()     { if (_sfx.draw.paused) _sfx.draw.play().catch(() => {}); }
function sfxDrawStop() { _sfx.draw.pause(); _sfx.draw.currentTime = 0; }

// One-shot effects.
function sfxClaim()      { _play(_sfx.claim); }
function sfxDie()        { _play(_sfx.die); }
function sfxExtraLife()  { _play(_sfx.extralife); }
function sfxLevelClear() { _play(_sfx.levelclear); }
function sfxGameOver()   { _play(_sfx.gameover); }
function sfxHighScore()  { _play(_sfx.highscore); }

// Stop and reset every SFX element (used on game over).
function sfxStopAll() {
  for (const s of Object.values(_sfx)) { s.pause(); s.currentTime = 0; }
}
