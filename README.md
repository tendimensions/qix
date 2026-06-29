# Qix

A browser-based remake of the 1981 Taito arcade game, inspired by the Commodore 64 port.

Pure client-side HTML/CSS/JS - no build step, no dependencies. Open `index.html` and play.

## How to play

Claim 75% of the board to advance to the next level.

- Move along the border with the **arrow keys**
- Push into open space to draw a line (a **Stix**)
- Return to the border to close the loop and claim territory
- The side that does **not** contain the Qix gets claimed

Earn an extra life at 25% and 50% claimed.

## Hazards

| Hazard | Description |
|--------|-------------|
| **Qix** | A bouncing rainbow line in open space. Touching your active Stix costs a life. |
| **Sparx** | Red dots that patrol the border. Spawn over time and speed up each level. |
| **Fuse** | Stop moving mid-draw and an ember lights at the base of your Stix, burning toward you. |

## Running it

**Quickest:** double-click `index.html`.

**Recommended** (reliable leaderboard saves): serve over HTTP so `localStorage` works in all browsers:

```bash
python -m http.server 8137
```

Then open `http://localhost:8137`.

## File structure

```
index.html          markup + ordered script tags
css/styles.css      all styling (HUD, overlays, leaderboard)
js/config.js        constants, canvas setup, shared state
js/leaderboard.js   top-10 high-score table (localStorage)
js/grid.js          geometry helpers, flood-fill, land render
js/qix.js           Qix entity (motion, collision, draw)
js/sparx.js         Sparx patrol/spawn + Fuse
js/player.js        input, Marker movement, territory claiming
js/render.js        per-frame canvas drawing
js/game.js          level flow, lives, overlays, main loop
```

Scripts load as classic globals (not ES modules) so the game works from a `file://` path with no bundler. Load order in `index.html` matters.

## License

MIT
