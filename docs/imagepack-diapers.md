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
- The waist hugs the pack body's hips; size and sag progression come from each base sprite's
  bounding box mapped to the pack body (x linear, waist/crotch through a fit from briefs,
  boxers, boyshorts and long johns; sag drop scaled 2x like the frame).
- Plastic diapers: side tapes, landing strip, faint hourglass core. Cloth: rounder cut, side pins,
  fold lines. Pull-ups: ribbed waistband, dashed side tear seams, slimmer cut.
- frayed/torn/tattered add edge nicks and rips; sag15 (overflowing) adds small drips; `penis.png` is the same
  garment (it is drawn over the penis layer, as in base).

Larger capacities are slimmer but saggier. Each diaper's capacity (0 for small sizes, up to 1
for hyper) blends its dry shape toward the regular size of its kind, so big ones stay slim when
dry. As they fill they droop lower and lower over the 15 sag stages (below). Hyper reaches the
doll's feet at 75% fill, hangs past them when full and sags further when overflowing; the other
large sizes scale down in proportion (max, ultra, xl, large, cloth xl/large, pull-up large).
Small and regular sizes get the same 15 stages with a gentle sag. Frames
are 256px tall and the feet sit around y191, so there is room to draw past the feet with no
clipping.

## 15 sag stages (aligned with concealment)

Pack diapers have 15 sag stages, `sag1` to `sag15`, instead of the base game's 5 tiers. The stage
comes from `plusSagStage(item)` in `game/ModLI/plus-needs/needs.js`:

- 0 = empty (the unsagged sprite), 1-13 = partly filled, 14 = full, 15 = overflowing.
- Concealment uses the effective diaper size (`plusDiaperSize`, the same 0-15 scale as each
  garment's "Can hide" value). For every model, each fill at which that size steps up starts a new
  sag stage, so a stage never spans two concealment sizes and the picture changes exactly when
  clothes stop (or start) hiding the diaper. Between those points the stages are spread evenly.
- `node devTools/diaper-sag-stages.mjs` prints the table (stage: start fill / concealment size);
  `plusSagStageTable()` returns it in game, and the sprite generator reads it, so sprites and
  in-game selection cannot drift.

Concealment size steps (fill -> size) and the stage that starts there:

| Model               | dry size | steps: fill% = size (stage)                                       | full    | overflow |
| ------------------- | -------- | ----------------------------------------------------------------- | ------- | -------- |
| Hyper               | 8        | 15=9 (3), 30=10 (5), 45=11 (7), 60=12 (9), 75=13 (11), 90=14 (13) | 15 (14) | 15 (15)  |
| Max                 | 7        | 20=8 (4), 33=9 (5), 53=10 (8), 67=11 (10), 87=12 (12)             | 13      | 14       |
| Ultra               | 6        | 20=7 (4), 40=8 (6), 60=9 (9), 80=10 (11)                          | 11      | 12       |
| Extra Large         | 5        | 25=6 (4), 50=7 (8), 75=8 (11)                                     | 9       | 10       |
| Large               | 4        | 40=5 (6), 80=6 (11)                                               | 7       | 8        |
| Medium              | 3        | 50=4 (8), 75=5 (11)                                               | 6       | 7        |
| Small               | 2        | 67=3 (10)                                                         | 4       | 5        |
| Cloth XL            | 5        | 40=6 (6), 60=7 (9), 80=8 (11)                                     | 9       | 10       |
| Cloth Large         | 4        | 50=5 (8), 75=6 (11)                                               | 7       | 8        |
| Cloth Medium        | 3        | 67=4 (10)                                                         | 5       | 6        |
| Cloth Small         | 2        | none                                                              | 3       | 4        |
| Pull-up Large       | 4        | 50=5 (8), 75=6 (11)                                               | 7       | 8        |
| Pull-up Medium      | 3        | 67=4 (10)                                                         | 5       | 6        |
| Pull-up Small       | 2        | 67=3 (10)                                                         | 4       | 5        |
| Pull-up Extra Small | 1        | none                                                              | 2       | 3        |

Full is always stage 14 and overflowing stage 15. Hyper's stage 11 starts at 75% fill: that is where
it reaches the doll's feet; at 14 (full) it hangs past them and at 15 lower still.

Base (non-pack) sprites keep their 5 tiers. `plusSagSrc` uses `sag<stage>` only when the active
image pack has that file (`ImagePacks.resolve`); otherwise it uses the base tier for the fill
(`plusSagTier`: sag1 25%, sag2 50%, sag3 75%, sag4 full, sag5 overflowing), so no base path to a
missing `sag6`-`sag15` is ever requested. The base tiers still drive the sag messages.

Legacy sprite folders without a shop model use a current model's table (`plusdiaper` and
`plusdiapersmall`/`plusdiaperlarge` -> plastic Medium/Small/Large, `plusclothdiaper` -> cloth
Medium, `pluspullup` -> pull-up Medium).

Run `python3 devTools/generate-pack-diapers.py` (needs Pillow + numpy) after changing a base
diaper sprite, then rebuild (`compile.sh` regenerates `imagepacks-manifest.js`).
`tests/imagepack-diapers.test.mjs` checks that every base sprite has a 2× pack counterpart in the
manifest and that each diaper's waistband and centre line up with the pack's briefs.

Not covered: Mysterious only replaces `sex/` art, and diapers have no combat sprites (combat uses
the `plainpanties` reference), so neither needed pack diapers.
