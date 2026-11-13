# Image-pack diaper sprites

The Plus diapers/pull-ups (`img/clothes/under-lower/plus*/`, 20 folders × 30 sprites: `full`,
`torn`, `tattered`, `frayed`, `penis` at the root and in `sag1`–`sag5`) were drawn for the base
paper doll (128px frames). The Aoki Utage packs (`au`, `aumasc`) use a 256px paper doll with a
higher waist and longer legs, so with a pack on the base sprites were drawn 2× and landed ~27px
too low and ~14px to the right of the pack body.

`devTools/generate-pack-diapers.py` draws pack versions natively at the pack resolution
(v2; v1 resampled the base art, which looked blocky next to the pack's clean style) at
`imagepacks/<pack>/clothes/under-lower/<diaper>/...`:

- Silhouettes are smooth curves (8x8 supersampled, snapped to hard edges like the pack's
  garments) with a 1px dark outline, a few flat grey tones with soft rounded shading, a light
  waistband band and gathered leg cuffs. Greyscale, so the game's clothing tint still applies.
- The waist hugs the pack body's hips; placement comes from the regular base diaper mapped to the
  pack body (x linear, waist/crotch through a fit from briefs, boxers, boyshorts and long johns).
- Plastic diapers: side tapes, landing strip, faint hourglass core. Cloth: rounder cut, side pins,
  fold lines. Pull-ups: ribbed waistband, dashed side tear seams, slimmer cut.
- frayed/torn/tattered add edge nicks and rips; `leak<N>` (overflowing) adds small drips; `penis.png` is the same
  garment (it is drawn over the penis layer, as in base).

## One picture per concealment size

Pack diapers are drawn per concealment size, not per fill level. Concealment uses the effective
diaper size (`plusDiaperSize`, 1-15: the same scale as each garment's "Can hide" value; a garment
hides the diaper while size <= its value). `plusSagSizeKey(item)` in
`game/ModLI/plus-needs/needs.js` picks `<diaper>/size<N>/<state>.png` for the current size, so the
picture changes exactly when concealment does, and a size-N diaper has the same length and width
whichever model it is (within a category the pictures are identical; plastic, cloth and pull-up
keep their own cut and details: tapes and landing strip, pins and folds, ribbed waistband).

- Sizes 1-8 grow gently (a dry Hyper is size 8, so big diapers start slim). From size 9 they get
  longer and droopier rather than wider: size 13 (a Hyper at 75%) reaches the doll's feet and 15
  (a full Hyper) hangs past them. Frames are 256px tall and the feet sit around y191, so there is
  room below the feet and nothing is clipped.
- Overflowing (leaking) diapers use `leak<N>/`: the size-N shape with drips. Overflow adds one size
  to most models, but a full Hyper is already 15, so the separate leak picture keeps overflow
  visible there too.
- Each diaper folder only has the sizes its model can reach (plus its leak size): 100 pictures x
  5 states per pack. The root and `sag1`-`sag5` (the paths the base game uses) hold the matching
  size picture too, so even the base-tier fallback fits the pack doll.
- `node devTools/diaper-sag-sizes.mjs` prints each model's sizes and the fill where each starts;
  `plusSagSizeTable()` returns it in game and the sprite generator reads it.

| Model               | sizes by fill                                                | overflow |
| ------------------- | ------------------------------------------------------------ | -------- |
| Hyper               | 0% 8, 15% 9, 30% 10, 45% 11, 60% 12, 75% 13, 90% 14, 100% 15 | leak15   |
| Max                 | 0% 7, 20% 8, 33% 9, 53% 10, 67% 11, 87% 12, 100% 13          | leak14   |
| Ultra               | 0% 6, 20% 7, 40% 8, 60% 9, 80% 10, 100% 11                   | leak12   |
| Extra Large         | 0% 5, 25% 6, 50% 7, 75% 8, 100% 9                            | leak10   |
| Large               | 0% 4, 40% 5, 80% 6, 100% 7                                   | leak8    |
| Medium              | 0% 3, 50% 4, 75% 5, 100% 6                                   | leak7    |
| Small               | 0% 2, 67% 3, 100% 4                                          | leak5    |
| Cloth XL            | 0% 5, 40% 6, 60% 7, 80% 8, 100% 9                            | leak10   |
| Cloth Large         | 0% 4, 50% 5, 75% 6, 100% 7                                   | leak8    |
| Cloth Medium        | 0% 3, 67% 4, 100% 5                                          | leak6    |
| Cloth Small         | 0% 2, 100% 3                                                 | leak4    |
| Pull-up Large       | 0% 4, 50% 5, 75% 6, 100% 7                                   | leak8    |
| Pull-up Medium      | 0% 3, 67% 4, 100% 5                                          | leak6    |
| Pull-up Small       | 0% 2, 67% 3, 100% 4                                          | leak5    |
| Pull-up Extra Small | 0% 1, 100% 2                                                 | leak3    |

Base (non-pack) sprites keep their 5 tiers. `plusSagSrc` uses `size<N>`/`leak<N>` only when the
active image pack has that file (`ImagePacks.resolve`); otherwise it uses the base tier for the
fill (`plusSagTier`: sag1 25%, sag2 50%, sag3 75%, sag4 full, sag5 overflowing), so no missing
path is ever requested. The base tiers still drive the sag messages. The base game's wet-clothing
transparency still applies to diapers (kept on purpose).

Legacy sprite folders without a shop model use a current model's sizes (`plusdiaper`,
`plusdiapersmall`, `plusdiaperlarge` -> plastic Medium/Small/Large, `plusclothdiaper` -> cloth
Medium, `pluspullup` -> pull-up Medium).

Run `python3 devTools/generate-pack-diapers.py` (needs Pillow + numpy) after changing a base
diaper sprite, then rebuild (`compile.sh` regenerates `imagepacks-manifest.js`).
`tests/imagepack-diapers.test.mjs` checks that every base sprite has a 2× pack counterpart in the
manifest and that each diaper's waistband and centre line up with the pack's briefs.

Not covered: Mysterious only replaces `sex/` art, and diapers have no combat sprites (combat uses
the `plainpanties` reference), so neither needed pack diapers.
