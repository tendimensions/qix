"use strict";

const VERSION = "0.0.9";

// Grid + canvas geometry
const CELL = 5;
const COLS = 128;
const ROWS = 96;
const W = COLS * CELL;
const H = ROWS * CELL;

const EMPTY = 0, FILLED = 1, TRAIL = 2;

const COLOR_FILLED = "#1b2c66";
const COLOR_BORDER = "#3550b8";
const COLOR_TRAIL  = "#ffe66d";
const COLOR_PLAYER = "#ffffff";
const COLOR_SPARX  = "#ff3b5c";
const COLOR_FUSE   = "#ff8a1e";

const WIN_PERCENT = 75;
const EXTRA_LIFE_STEP = 25; // grant a life each time the player crosses another 25%

const STEP_MS = 26;
const FUSE_MS = 90;
const FUSE_GRACE_MS = 70;
const SPARX_MS = 55;
const FIRST_SPARX_MS = 4000;
const SPARX_INTERVAL_MS = 16000;
const MAX_SPARX = 6;
const RELOCATE_MIN_DIST = 14;

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

// Offscreen layer for claimed territory; only re-rendered when a claim happens.
const land = document.createElement("canvas");
land.width = W;
land.height = H;
const lctx = land.getContext("2d");

const ui = {
  score: document.getElementById("score"),
  area: document.getElementById("area"),
  lives: document.getElementById("lives"),
  level: document.getElementById("level"),
};
const overlay = document.getElementById("overlay");

// Mutable game state, populated by newLevel() / startGame()
let grid, initialFilled, claimableTotal, filledCount;
let player, drawing, trail;
let qix;
let sparx, levelClock, nextSparxAt;
let fuseIdx, fuseAcc, idleMs;
let score, lives, level, nextLifeAt;
let running = false;

let flashText = "", flashColor = "#fff", flashUntil = 0;

const idx = (x, y) => y * COLS + x;
const inBounds = (x, y) => x >= 0 && x < COLS && y >= 0 && y < ROWS;
