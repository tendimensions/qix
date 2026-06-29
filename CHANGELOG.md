# Changelog

## [1.0.0]

- Display version number on the title screen to help track deployed copies.
- Death transition now pauses the game with a cause-specific overlay (CAUGHT BY SPARX / TOUCHED THE QIX / BURNED BY THE FUSE); only Space resumes.
- Starting a draw requires holding Space when stepping off the border, preventing accidental draws.
- Level clear screen requires Space and enforces a 1.5s pause before it can be dismissed.
- Sparx count caps at level+1 until it reaches the max of 6, keeping early levels easier.
- Fixed immediate re-death after respawn by spawning the marker away from all Sparx.
