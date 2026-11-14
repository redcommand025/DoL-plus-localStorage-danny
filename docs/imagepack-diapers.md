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
- The waistband sits on the pack waist (the pack briefs, with a small diaper rise) and matches the
  pack briefs / body outline (about 0-1px of padding). The upper part follows the hip curve tightly.
  Through the hands the sides stay inside the hip line so they never cover the idle hands (the game
  draws under_lower above the arms). Sag still fills out toward the bottom below the hands. Length
  still comes from the regular base diaper mapped through a fit from briefs, boxers, boyshorts and
  long johns: bigger sizes hang lower rather than growing wider.
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

Base (non-pack) sprites keep their 5 tiers. Their waistbands were tightened to the base body
outline (about 0-1px of padding) where they were wider than the waist; sag below the waistband
is unchanged. `plusSagSrc` uses `size<N>`/`leak<N>` only when the
active image pack has that file (`ImagePacks.resolve`); otherwise it uses the base tier for the
fill (`plusSagTier`: sag1 25%, sag2 50%, sag3 75%, sag4 full, sag5 overflowing), so no missing
path is ever requested. The base tiers still drive the sag messages. The base game's wet-clothing
transparency still applies to diapers (kept on purpose).

## Can hide (derived from the pack sprites)

Each lower / over_lower garment has a "Can hide" value on the same 0-15 scale. A diaper is
visible when `size > Can hide` (or when nothing is worn there). Noticing is still 3% per size
point over, capped at 25%: the measurements did not suggest changing that.

The size-by-fill mapping above is unchanged. After the fit fix the pack pictures still grow in
length, not width: size 1 sits at the crotch (bottom y103, width 31), a dry Hyper (size 8) is
above the knees (y137, width 35), size 13 reaches the feet (y190 vs feet y191), and size 15 hangs
past them (y213). Base (no-pack) sag pictures are shorter and wider than the pack set (a dry
Hyper is bottom 147 / width 44 at 2×); they keep their 5 fill tiers and are not used for Can hide.

`devTools/diaper-concealment-table.py` measures every pack `size<N>` (the union of every model's
cut at that size, plus leak15 for extents) against each garment's pack `full.png` on both `au` and
`aumasc`. A size is hidden when it stays inside the garment's **outer silhouette**:

- it does not hang more than 10px below the hem, and
- at rows above the hem, its left and right edges stay within 2px of the garment's outer
  left/right (with a 24px budget for leftover outline slivers).

The gap between trouser legs is treated as inside the garment, so a crotch curve sitting in the
inseam is not "sticking out." Open-front clothes (a monk's habit, gift wrap, a patient gown whose
skirt starts at the hips) can score 0 even when they are long. Cloth cuts are slightly wider than
plastic ones, so the union can make a garment lose a size that a plastic diaper alone would still
hide (jeans hide 6 because cloth size 7 is a little wider). A pack file that is actually 128px
tall, or a 2× base sprite, is not measured on the pack doll (it would sit too low and to the
right); those items get a first-match keyword median from the pack-measured clothes. Empty or stub
pack files (an aumasc sprite with a handful of pixels) are ignored in favour of the real one.

Effective conceal is still the max of worn `lower` and `over_lower`. Re-run
`python3 devTools/diaper-concealment-table.py --write` after changing diaper or clothing art;
`--preview` writes cropped threshold pictures to `/workspace/diaper-pack-previews/concealment/`.

| Garment                                 |       old Can hide | new Can hide | notes                                           |
| --------------------------------------- | -----------------: | -----------: | ----------------------------------------------- |
| gym bloomers                            |                  0 |            0 | hem at the crotch; even size 1 peeks out        |
| leather miniskirt                       |                  3 |            2 | hem y108, covers size 2                         |
| shorts                                  |                  1 |            3 | hem y113, covers size 3                         |
| school shorts                           |                  1 |            3 | hem y115                                        |
| cycle shorts                            |                  0 |            3 | hem y112                                        |
| witch skirt                             | 15 (robe fallback) |            3 | hem y116; the item is a short skirt, not a robe |
| school skirt                            |                  7 |            5 | hem y123                                        |
| shortalls                               |                  5 |            5 | hem y124                                        |
| jeans                                   |                  4 |            6 | long, but cloth size 7 is slightly wider        |
| trousers / school trousers / yoga pants |          4 / 4 / 0 |            6 | same slim-leg envelope as jeans                 |
| cargo pants                             |                 11 |            8 | baggy enough for a dry Hyper                    |
| long skirt                              |                 10 |            9 | hem y150; size 10 peeks under the hem           |
| kimono skirt                            |                 10 |            9 | hem y184, slightly open at the front            |
| overall bottoms                         |                 12 |           12 | hem y178, wide                                  |
| wide leg trousers                       |                  6 |           12 | wide enough to hide until size 13 hangs out     |
| pyjama bottoms                          |                  6 |           12 | same                                            |
| maid skirt                              |                  8 |           12 | hem y178, wide                                  |
| evening gown skirt                      |                 15 |           12 | hem y186; size 13 reaches the feet              |
| bathrobe bottom                         |                 15 |           12 | hem y189                                        |
| hanfu skirt                             |                 10 |           13 | covers up to the feet                           |
| patient gown skirt                      |                  8 |            0 | pack skirt starts at the hips, waistband shows  |

There is no "baggy jeans" or "mini skirt" item. Close real items: low-rise jeans 6, micro pleated
skirt 4. Names without a pack-native sprite use the fallback medians (tight 3, mini 3, shorts 3,
skirt 4, dress 5, baggy 6, trousers 6, overall 7, sweat 8, long_over 10, long 11; slot defaults
lower 5, over_lower 13).

Legacy sprite folders without a shop model use a current model's sizes (`plusdiaper`,
`plusdiapersmall`, `plusdiaperlarge` -> plastic Medium/Small/Large, `plusclothdiaper` -> cloth
Medium, `pluspullup` -> pull-up Medium).

Run `python3 devTools/generate-pack-diapers.py` (needs Pillow + numpy) after changing a base
diaper sprite, then rebuild (`compile.sh` regenerates `imagepacks-manifest.js`).
`tests/imagepack-diapers.test.mjs` checks that every base sprite has a 2× pack counterpart in the
manifest and that each diaper's waistband and centre line up with the pack's briefs.
`tests/diaper-pack-fit.test.mjs` also checks the waistband row and width against the pack body, and
that no diaper pixels cover the idle hands, at every size and leak picture.

Not covered: Mysterious only replaces `sex/` art, and diapers have no combat sprites (combat uses
the `plainpanties` reference), so neither needed pack diapers.

## Diaper prints (native pattern layer)

Fifteen original prints are native `pattern_options` on every Plus diaper, plus "plain". When you buy a
diaper in the clothing shop or adult shop catalogue, or a pack at a continence-supplies counter
(`<<plusDiaperShop>>` in the clothing shop, the pharmacy and the adult shop), you pick a colour and a
pattern the same way as other patterned clothes: the shop's colour buttons, pattern list (a listbox,
because there are 16 options) and mannequin preview. Packs use the same widgets on
`Plus Needs Diaper Customise` and stamp the chosen colour and pattern on every item in the pack
(`plusDiaperBuyPack`). Patterns do not cost extra (vanilla does not charge for patterns). The pharmacy
sells the same packs as the clothing shop (Large and below). There is no separate "Diaper prints"
purchase, no one-time print unlock, and no "print worn / print all clean" action.

Existing saves keep each diaper's print as its native `pattern`. Leftover print-ownership state
(`$plusDiaperPatterns`, `$plusDiaperPatternNext`) is cleared once (`plusDiaperPatternMigrate`, on
passage start). This also works in no-storage mode.

Colours use the same list as briefs (`black`, `blue`, `brown`, `green`, `pink`, `purple`, `red`,
`pale tangerine`, `teal`, `pale white`, `pale yellow`, `custom`), with `colour_sidebar: 1` and a default
of pale white. The greyscale diaper sprite takes the clothing tint; print overlays stay untinted
(their colours are baked in). `pattern_caption: true` shows the pattern in the wardrobe label.

The 15 prints (the last five are unique to this game): Starry Dreams, Dino Stomp, Paw Parade,
Bunny Meadow, Little Crowns, Croc Smiles, Puppy Pals, Candy Hearts, Rainbow Clouds, Pastel Plaid,
Photo Reel, Autumn Leaves, Ocean Waves, Galaxy Swirl, Polka Pop.

All prints are original artwork (common baby-print themes plus five unique designs); no third-party
artwork, logos or product names.

**Rendering.** The print is the base game's clothing pattern: `item.pattern` holds the print id ("plain" =
none), the item setup has `pattern_layer: "secondary"` and `accessory_integrity_img: 1`, so the native
accessory layer draws `acc-<integrity>-<pattern>.png` on top of the diaper (untinted, and see-through when
wet like the diaper itself). `plusSagSrc` routes that path to the overlay matching the diaper picture.
The shop mannequin uses a dry item with the selected colour and pattern (`plusDiaperCanvasItem`); the
in-game doll uses the worn diaper so sag and soil follow fill.

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
and drop with the sag): pee is a muted, pale straw-yellow tint, slightly deeper in the wettest area and
on the tide-mark rings. Light is a patch on the **crotch** only. Medium spreads from the crotch down into
the **seat** (the low, sagging bottom, in front view) and out toward the side walls of the padding, fading
at the edges. Heavy fills the seat and the side walls fully, with the crotch still included, covering most
of the padding. Poo is a muddy brown discolouration on the **seat**, rising from the bottom edge, darker
toward the centre and the bottom bulge. Both = both areas; from medium up they overlap in the seat and
blend naturally (a muddier mix at heavy). Higher intensity covers more area and is stronger: heavy poo
covers most of the seat, and heavy both most of the diaper. Edges are uneven and blotchy (noise plus
irregular tide-mark rings where the stain dries), not smooth ovals. Medium and heavy also add a faint
dingy greying across the padding. The blotch pattern is sampled in garment (u, v) with a seed that is
stable across size/sag pictures of the same garment, so it stretches with the sag instead of flickering.
Only padding tones are tinted: outlines, seams, rips, the waistband and the tapes stay clean. A short
clean band is left under the waistband.

Files: `imagepacks/<pack>/clothes/under-lower/plussoil/<dp|cd|pu>/<size<N>|leak<N>>/<integrity>-<level>-<type>.png`
(1,584 per pack) and `img/clothes/under-lower/<diaper>/[sag<N>/]soil-<integrity>-<level>-<type>.png` (3,240).
The penis layer uses the `full` overlay. About 15 MB in total.
