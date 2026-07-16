# Changelog

## [0.0.11]

- Integrated the particle engine prototype into gameplay: gold sparkle on territory claim, warm debris on death, green sparkle on extra life, multi-hue confetti on level clear, and a gold burst on new high score.
- Removed the standalone particle demo (`particles.html`, `css/particles.css`) now that the engine drives real gameplay effects.

## [0.0.10]

- Replaced procedurally generated sound effects with file-based mp3 playback (`audio/sfx-*.mp3`).
- Drawing sound now loops for the duration of a draw stroke and stops cleanly on claim or death.
- Added game-over sound effect (`audio/sfx-gameover.mp3`); all other audio stops before it plays.
- `M` key now mutes/unmutes both music and sound effects together.
- Music stops completely on game over and restarts from the beginning on the next game.
- Added `BGM_PAUSE_BEHAVIOUR` setting in `config.js`: `"duck"` (default) lowers music to half volume while paused; `"pause"` stops it entirely.
- Pause overlay now uses `setKeyOverlay` consistently with all other overlays.
- `P` key is explicitly gated on `running === true`, removing reliance on listener-registration order.
- Added high score sound effect (`audio/sfx-highscore.mp3`) that plays when a new high score is achieved. This sound effect and the game-over sound effect are mutually exclusive, so the game over sound effect will not play if a high score is achieved.
- Background music (`audio/music.mp3`) replaced with a different track with known license provenance and to avoid any potential copyright issues.
- All sound effects were generated dynamically using AssetGenerator to ensure known license provenance and to avoid any potential copyright issues.
- Added a prototype for a simple particle engine (`particles.js`) that can be used for future visual effects. The engine is not yet integrated into the game.

## [0.0.9]

- Added background music (`audio/music.mp3`) that starts on the first keypress and loops for the duration of the session.
- Added `M` key to mute/unmute music from anywhere, including overlays.
- Added procedurally generated sound effects via Web Audio API: drawing buzz, territory-claim sweep, death descent, level-clear arpeggio, and extra-life jingle.
- Improved SFX reliability: sounds are scheduled ahead of the current audio clock and the AudioContext is resumed eagerly on every keydown/pointerdown, preventing missed sounds after browser auto-suspension.
- Added `P` key to pause and unpause the game; pausing also pauses the background music.
- Created `audio/` folder for music and future sound-effect files.

## [0.0.8]

- Display version number on the title screen to help track deployed copies.
- Death transition now pauses the game with a cause-specific overlay (CAUGHT BY SPARX / TOUCHED THE QIX / BURNED BY THE FUSE); only Space resumes.
- Starting a draw requires holding Space when stepping off the border, preventing accidental draws.
- Level clear screen requires Space and enforces a 1.5s pause before it can be dismissed.
- Sparx count caps at level+1 until it reaches the max of 6, keeping early levels easier.
- Fixed immediate re-death after respawn by spawning the marker away from all Sparx.
