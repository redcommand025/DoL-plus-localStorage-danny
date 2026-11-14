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

## Diaper prints (native pattern layer)

Fifteen original prints can be bought at every counter that sells Plus diapers (`<<plusDiaperShop>>`: the
clothing shop, the pharmacy and the adult shop), in a "Diaper prints" section under the packs. A print is
bought once (`$plusDiaperPatterns`), then:

- chosen as the "print for new packs" (`$plusDiaperPatternNext`); packs bought afterwards come printed;
- printed on the diaper you're wearing or on every clean diaper in your wardrobe (clean diapers only);
- offered by the native clothing shop's pattern picker and shown in the wardrobe's "(colour pattern)" label,
  because every Plus diaper's `pattern_options` is kept at `["plain", ...owned prints]`
  (`plusDiaperPatternSync`, on passage start and after a purchase).

| Print         | Price  |     | Print                  | Price  |
| ------------- | ------ | --- | ---------------------- | ------ |
| Starry Dreams | £9.00  |     | Rainbow Clouds         | £11.00 |
| Dino Stomp    | £10.00 |     | Pastel Plaid           | £12.00 |
| Paw Parade    | £8.00  |     | Photo Reel (unique)    | £15.00 |
| Bunny Meadow  | £9.00  |     | Autumn Leaves (unique) | £13.00 |
| Little Crowns | £12.00 |     | Ocean Waves (unique)   | £13.00 |
| Croc Smiles   | £10.00 |     | Galaxy Swirl (unique)  | £16.00 |
| Puppy Pals    | £10.00 |     | Polka Pop (unique)     | £7.00  |
| Candy Hearts  | £8.00  |     |                        |        |

All prints are original artwork (common baby-print themes plus five unique designs); no third-party
artwork, logos or product names.

**Rendering.** The print is the base game's clothing pattern: `item.pattern` holds the print id ("plain" =
none), the item setup has `pattern_layer: "secondary"` and `accessory_integrity_img: 1`, so the native
accessory layer draws `acc-<integrity>-<pattern>.png` on top of the diaper (untinted, and see-through when
wet like the diaper itself). `plusSagSrc` routes that path to the overlay matching the diaper picture:

- image packs: `pluspatterns/<dp|cd|pu>/<size<N>|leak<N>>/<integrity>-<print>.png` (one per category and
  size picture, as those pictures are identical within a category);
- base sprites: `<diaper>/[sag<N>/]acc-<integrity>-<print>.png`;
- the penis layer uses the `full` overlay.

**Stretching.** `devTools/generate-diaper-prints.py` maps each picture's garment to (u, v): u across each
row between the garment's left and right edge, v from waistband to bottom. Prints are sampled at
`(u·width/2, v·length)` where width and length grow with the garment to the power 0.4, so motifs get taller
and follow the bulge as the diaper sags. Only padding tones are printed (outlines, seams, rips, waistband and
tapes stay), and the print colour is multiplied by the diaper's shading. Overlays: 2,640 per pack
(au, aumasc) and 5,400 base, about 11 MB in total.

## Soiled overlays

A used Plus diaper shows one of 9 soiled overlays above the diaper and its print (`under_lower_soil`, and
`under_lower_penis_soil` over the bulge layer). They are untinted and use the diaper's own alpha, so they
go see-through when wet together with the diaper. `plusDiaperSoil(it)` picks the overlay from the diaper's
own state:

- **type**: `pee` if only liquid is held (`plusMl > 0`), `poo` if only solids (`plusLb > 0`), `both` if both;
- **intensity**: from `plusDiaperFillFrac` (the fuller of ml/capacity and lb/capacity, the same fill that
  picks the sag/size picture): above 0 and under 1/3 = light, 1/3 to under 2/3 = medium, 2/3 or more (or
  overflowing) = heavy. Empty = no overlay.

So a dry Hyper (size 8) has no overlay, and Hyper goes light at sizes 9–10, medium at 11–12 and heavy at
13–15. A full Hyper (size 15) with both shows heavy both.

**Placement** (`devTools/generate-diaper-soil.py`, the same garment u/v mapping as prints, so stains stretch
and drop with the sag): pee is a dingy amber to yellow-brown tint on the **crotch**, centred across the
padding in its middle-lower part, darker toward the centre. Poo is a muddy brown discolouration on the
**seat**. The sprites are front views, so the seat is drawn as the low, sagging bottom of the padding,
rising from the bottom edge, darker toward the centre and the bottom bulge. Both = both areas; at heavy,
the meeting zone is a muddy blend. Higher intensity covers more area and is stronger: light is already a
clear patch, heavy pee covers most of the crotch, heavy poo most of the seat, and heavy both most of the
diaper. Edges are uneven and blotchy (noise plus irregular tide-mark rings where the stain dries), not
smooth ovals. Medium and heavy also add a faint dingy greying across the padding. The blotch pattern is
sampled in garment (u, v) with a seed that is stable across size/sag pictures of the same garment, so it
stretches with the sag instead of flickering. Only padding tones are tinted: outlines, seams, rips, the
waistband and the tapes stay clean. A short clean band is left under the waistband.

Files: `imagepacks/<pack>/clothes/under-lower/plussoil/<dp|cd|pu>/<size<N>|leak<N>>/<integrity>-<level>-<type>.png`
(1,584 per pack) and `img/clothes/under-lower/<diaper>/[sag<N>/]soil-<integrity>-<level>-<type>.png` (3,240).
The penis layer uses the `full` overlay. About 15 MB in total.
