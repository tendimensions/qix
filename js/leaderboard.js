"use strict";

// Top-10 high score table, persisted in localStorage. Falls back gracefully to
// an in-memory list if storage is unavailable (e.g. some file:// contexts).
const Leaderboard = (() => {
  const KEY = "qix.scores.v1";
  const MAX = 10;
  let memory = [];

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return memory;
    }
  }

  function save(list) {
    memory = list;
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { /* ignore */ }
  }

  function top() {
    return load().sort((a, b) => b.score - a.score).slice(0, MAX);
  }

  function qualifies(score) {
    if (score <= 0) return false;
    const list = top();
    return list.length < MAX || score > list[list.length - 1].score;
  }

  // Returns the rank (0-based) of the inserted entry, or -1 if it didn't make it.
  function submit(name, score, level) {
    const list = load();
    const entry = { name, score, level, date: Date.now() };
    list.push(entry);
    list.sort((a, b) => b.score - a.score);
    const trimmed = list.slice(0, MAX);
    save(trimmed);
    return trimmed.indexOf(entry);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function toHTML(highlight = -1) {
    const list = top();
    if (!list.length) {
      return `<div class="lb"><div class="lb-title">HIGH SCORES</div>` +
             `<div class="lb-empty">No scores yet — be the first.</div></div>`;
    }
    const rows = list.map((e, i) =>
      `<div class="lb-row${i === highlight ? " lb-hi" : ""}">` +
      `<span class="lb-rank">${i + 1}</span>` +
      `<span class="lb-name">${escapeHtml(e.name)}</span>` +
      `<span class="lb-score">${e.score}</span>` +
      `<span class="lb-lvl">L${e.level}</span></div>`
    ).join("");
    return `<div class="lb"><div class="lb-title">HIGH SCORES</div>${rows}</div>`;
  }

  return { top, qualifies, submit, toHTML };
})();
