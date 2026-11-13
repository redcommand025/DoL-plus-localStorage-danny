# Audio

Ported from DoL X-Change's audio system (Akoz/dol-xchange @ddb1cf03).

- `game/03-JavaScript/game-audio.js` (`window.GameAudio`): background music by location, time of day and school
  hours; encounter and named-NPC themes that pause and later resume the location theme; weather ambience (rain,
  snow, thunder, lightning strikes) muffled indoors; one-shot effects for spending money and taking pills.
- `<<update-audio>>` (`game/base-system/audio/audio.twee`) runs from `PassageFooter` on every passage.
- Options > Performance > Audio: Enable audio, Mute on hide, Master volume, Music, Ambience. Stored in `$options`
  (`audio`, `muteonhide`, `mastervolume`, `bgm_volume`, `ambience_volume`), so they are saved with the game and
  work when the browser has no storage. Browsers start sound after the first click or key press.
- Files: `audio/bgm/**` and `audio/sfx/ambience/**`, committed as plain files (not Git LFS: GitHub Pages serves LFS
  files as pointers). `devTools/audio-files.sha256` lists their SHA-256 and size; `python3 devTools/check-audio.py
[dir]` fails on missing files, LFS pointers or hash mismatches. `devTools/prepare-pages.sh <dir>` assembles the
  Pages copy (index.html, img/, imagepacks/{au,aumasc,mysterious}, audio/) and runs the check.
- Not ported: X-Change's sex sounds, moans and voiceovers (bgs/bgv/ve, ejaculation sfx), its pocket music player,
  console minigame music, Arcology island music and the Luchifen theme (X-Change-only content).

Tests: `tests/game-audio.test.mjs` (node --test) and `node tests/game-audio.mjs <http://served-copy/>` (headless).
