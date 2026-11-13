# Image-pack diaper sprites

The Plus diapers/pull-ups (`img/clothes/under-lower/plus*/`, 20 folders × 30 sprites: `full`,
`torn`, `tattered`, `frayed`, `penis` at the root and in `sag1`–`sag5`) were drawn for the base
paper doll (128px frames). The Aoki Utage packs (`au`, `aumasc`) use a 256px paper doll with a
higher waist and longer legs, so with a pack on the base sprites were drawn 2× and landed ~27px
too low and ~14px to the right of the pack body.

`devTools/generate-pack-diapers.py` builds pack versions at
`imagepacks/<pack>/clothes/under-lower/<diaper>/...`:

- The base→pack mapping is measured from garments both sets have (briefs, boxers, boyshorts,
  long johns): x is a linear fit of their left/right edges, y a smooth quadratic fit through their
  waistbands and leg openings.
- Every sprite (both animation frames, all states and sag tiers) is resampled through that map
  with 4×4 supersampling, alpha is hardened, and a 1px dark outline is re-drawn so the result
  stays crisp pixel art. Sprites stay greyscale; the game tints them as before.

Run `python3 devTools/generate-pack-diapers.py` (needs Pillow + numpy) after changing a base
diaper sprite, then rebuild (`compile.sh` regenerates `imagepacks-manifest.js`).
`tests/imagepack-diapers.test.mjs` checks that every base sprite has a 2× pack counterpart in the
manifest and that each diaper's waistband and centre line up with the pack's briefs.

Not covered: Mysterious only replaces `sex/` art, and diapers have no combat sprites (combat uses
the `plainpanties` reference), so neither needed pack diapers.
