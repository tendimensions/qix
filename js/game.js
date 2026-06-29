"use strict";

function newLevel() {
  grid = new Uint8Array(COLS * ROWS);
  for (let x = 0; x < COLS; x++) { grid[idx(x, 0)] = FILLED; grid[idx(x, ROWS - 1)] = FILLED; }
  for (let y = 0; y < ROWS; y++) { grid[idx(0, y)] = FILLED; grid[idx(COLS - 1, y)] = FILLED; }

  initialFilled = 2 * COLS + 2 * ROWS - 4;
  claimableTotal = COLS * ROWS - initialFilled;
  filledCount = initialFilled;

  player = safeSpawn();
  drawing = false;
  trail = [];
  nextLifeAt = EXTRA_LIFE_STEP;

  const speed = 0.45 + (level - 1) * 0.13;
  qix = { a: spawnPoint(speed), b: spawnPoint(speed), ahist: [], bhist: [] };

  sparx = [];
  levelClock = 0;
  nextSparxAt = FIRST_SPARX_MS;
  fuseIdx = -1;
  fuseAcc = 0;
  idleMs = 0;

  renderLand();
  updateHud();
}

// Grant an extra life each time the claimed area crosses another 25% (at 25% and
// 50%); 75% clears the level before the next threshold.
function awardExtraLives() {
  while (nextLifeAt < WIN_PERCENT && percent() >= nextLifeAt) {
    lives++;
    nextLifeAt += EXTRA_LIFE_STEP;
    flash("EXTRA LIFE", "#7cfc6a");
  }
}

function loseLife(cause) {
  running = false;
  for (const i of trail) grid[i] = EMPTY;
  trail = [];
  drawing = false;
  fuseIdx = -1;
  lives--;
  updateHud();

  if (lives <= 0) {
    gameOver();
    return;
  }

  const msg = cause === "sparx" ? "CAUGHT BY SPARX"
            : cause === "qix"   ? "TOUCHED THE QIX"
            :                     "BURNED BY THE FUSE";

  overlay.innerHTML =
    `<h1>${msg}</h1>` +
    `<p>Lives remaining: <span class="key">${lives}</span></p>` +
    `<p class="key">Press Space to continue</p>`;
  overlay.classList.remove("hidden");
  setKeyOverlay((e) => {
    if (e.code !== "Space") return;
    e.preventDefault();
    setKeyOverlay(null);
    hideOverlay();
    player = safeSpawn();
    running = true;
  });
}

function flash(text, color) {
  flashText = text;
  flashColor = color;
  flashUntil = performance.now() + 1100;
}

function updateHud() {
  ui.score.textContent = score;
  ui.area.textContent = Math.max(0, Math.floor(percent())) + "%";
  ui.lives.textContent = lives;
  ui.level.textContent = level;
}

// ---- overlays ----
let pendingKeyHandler = null;
function setKeyOverlay(handler) {
  if (pendingKeyHandler) removeEventListener("keydown", pendingKeyHandler);
  pendingKeyHandler = handler;
  if (handler) addEventListener("keydown", handler);
}

function showMessage(html, onKey) {
  overlay.innerHTML = html;
  overlay.classList.remove("hidden");
  setKeyOverlay(() => { setKeyOverlay(null); onKey(); });
}

function hideOverlay() {
  overlay.classList.add("hidden");
  setKeyOverlay(null);
}

function showNameEntry(finalScore, finalLevel, onDone) {
  overlay.innerHTML =
    `<h1>NEW HIGH SCORE</h1>` +
    `<p>Score <span class="key">${finalScore}</span> — enter your initials</p>` +
    `<div class="entry"><input id="nameInput" maxlength="10" autocomplete="off" spellcheck="false" placeholder="AAA"><button id="nameSubmit">OK</button></div>` +
    Leaderboard.toHTML(-1);
  overlay.classList.remove("hidden");
  setKeyOverlay(null); // the input handles its own keys

  const input = document.getElementById("nameInput");
  const submit = () => {
    const name = (input.value.trim() || "AAA").toUpperCase().slice(0, 10);
    onDone(name);
  };
  input.focus();
  input.addEventListener("keydown", (e) => {
    e.stopPropagation();
    if (e.key === "Enter") submit();
  });
  document.getElementById("nameSubmit").addEventListener("click", submit);
}

// ---- flow ----
const INSTRUCTIONS =
  `<p>Arrow keys / WASD to move along the border.<br>` +
  `Hold <span class="key">Space</span> + an arrow key to draw into open space.<br>` +
  `Release Space once drawing — keep moving to finish the line.<br>` +
  `Close a loop to claim the side <span class="key">without</span> the Qix.<br>` +
  `Claim <span class="key">75%</span> to clear the level.<br>` +
  `Earn an <span class="key">extra life</span> every 25% you claim.<br>` +
  `Beware the <span class="key">Sparx</span> on the border, and keep moving —<br>` +
  `stop mid-draw and the <span class="key">Fuse</span> burns up your line.</p>`;

function showStart() {
  showMessage(
    `<h1>QIX</h1>${INSTRUCTIONS}${Leaderboard.toHTML(-1)}<p class="key">Press any key to start</p><p class="version">v${VERSION}</p>`,
    startGame
  );
}

function startGame() {
  hideOverlay();
  score = 0; lives = 3; level = 1;
  newLevel();
  running = true;
}

function winLevel() {
  running = false;
  level++;
  score += 1000;
  overlay.innerHTML =
    `<h1>LEVEL CLEAR</h1>` +
    `<p>Score <span class="key">${score}</span></p>` +
    `<p class="key" id="levelPrompt" style="visibility:hidden">Press Space for level ${level}</p>`;
  overlay.classList.remove("hidden");
  setTimeout(() => {
    const prompt = document.getElementById("levelPrompt");
    if (prompt) prompt.style.visibility = "visible";
    setKeyOverlay((e) => {
      if (e.code !== "Space") return;
      e.preventDefault();
      setKeyOverlay(null);
      hideOverlay();
      newLevel();
      running = true;
    });
  }, 1500);
}

function gameOver() {
  running = false;
  const finalScore = score, finalLevel = level;
  if (Leaderboard.qualifies(finalScore)) {
    showNameEntry(finalScore, finalLevel, (name) => {
      const rank = Leaderboard.submit(name, finalScore, finalLevel);
      showMessage(
        `<h1>GAME OVER</h1><p>Score <span class="key">${finalScore}</span></p>` +
        `${Leaderboard.toHTML(rank)}<p class="key">Press any key to play again</p>`,
        restart
      );
    });
  } else {
    showMessage(
      `<h1>GAME OVER</h1><p>Final score <span class="key">${finalScore}</span></p>` +
      `${Leaderboard.toHTML(-1)}<p class="key">Press any key to play again</p>`,
      restart
    );
  }
}

function restart() {
  hideOverlay();
  showStart();
}

// ---- main loop ----
let last = performance.now();
function frame(now) {
  const dtMs = Math.min(48, now - last);
  last = now;

  if (running) {
    levelClock += dtMs;
    stepAcc += dtMs;
    let movedThisFrame = false;
    while (stepAcc >= STEP_MS) {
      if (stepPlayer()) movedThisFrame = true;
      stepAcc -= STEP_MS;
    }
    idleMs = movedThisFrame ? 0 : idleMs + dtMs;
    stepFuse(dtMs);
    stepQix(dtMs / 16);
    stepSparx(dtMs);
  }
  render();
  requestAnimationFrame(frame);
}

showStart();
requestAnimationFrame(frame);
