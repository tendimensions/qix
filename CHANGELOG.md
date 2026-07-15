# Changelog

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
