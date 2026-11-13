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
- frayed/torn/tattered add edge nicks and rips; sag5 adds small drips; `penis.png` is the same
  garment (it is drawn over the penis layer, as in base).

Larger capacities are slimmer but saggier. Each diaper's capacity (0 for small sizes, up to 1
for hyper) blends its dry shape toward the regular size of its kind, so big ones stay slim when
dry. As they fill they droop lower in stages that follow the Plus sag tiers (sag1 25%, sag2 50%,
sag3 75%, sag4 100%, sag5 overflow). Hyper reaches the doll's feet at sag3 (75%), hangs past them
at sag4 (100%) and sags further at overflow; the other large sizes scale down in proportion (max,
ultra, xl, large, cloth xl/large, pull-up large). Small and regular sizes are unchanged. Frames
are 256px tall and the feet sit around y191, so there is room to draw past the feet with no
clipping.

Run `python3 devTools/generate-pack-diapers.py` (needs Pillow + numpy) after changing a base
diaper sprite, then rebuild (`compile.sh` regenerates `imagepacks-manifest.js`).
`tests/imagepack-diapers.test.mjs` checks that every base sprite has a 2× pack counterpart in the
manifest and that each diaper's waistband and centre line up with the pack's briefs.

Not covered: Mysterious only replaces `sex/` art, and diapers have no combat sprites (combat uses
the `plainpanties` reference), so neither needed pack diapers.
