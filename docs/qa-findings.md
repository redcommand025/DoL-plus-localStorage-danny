# Plus-needs QA findings

Status: automated source/runtime suite **149/149** (105 behavioral, 27 integration, 17 static), last recorded run Sunday 8 Nov 2026, 2:57:25–2:58:02 PM PT. A separate live Incognito browser route on the deployed compiled `test` site reached a final safe wake at **Sun 11th Sep 07:57**, which is seven full elapsed in-game days plus 57 minutes from the initial Sunday 07:00. Those two streams are not the same evidence. Do not treat Wednesday–Sunday home-focused play as full-route world coverage. No product code was changed after that automated run.

## Build

- Source branch: `test`
- Source commit: `7dccddef31ada38935fe490df8ca145997954518`
- git describe: `7dccddef3-dirty`
- Compiled symlink target: `Degrees of Lewdity 7dccddef3-dirty.html`
- Command: `node --test --test-reporter tap tests/storage-fallback.test.mjs tests/prepend-storage-fallback.test.mjs tests/npc-count-invariant.test.mjs tests/plus-needs-native.test.mjs tests/plus-needs-behavior.test.mjs tests/plus-paperdoll-src.test.mjs tests/plus-old-save-migration.test.mjs tests/qa-plus-smoke.test.mjs tests/qa-compiled-runtime.test.mjs && node tests/tutorial-npc-count.mjs && node tests/no-storage-startup.mjs Degrees of Lewdity.html`
- Started (UTC): 2026-11-08T22:57:25.002Z
- Finished (UTC): 2026-11-08T22:58:02.136Z

## Counts

- Total named cases executed: **149**
- Passed: **149**
- Failed: **0**
- Behavioral: 105/105
- Integration: 27/27
- Static: 17/17

## Bugs found in this automated pass

- **plusDiaperMigrateAll sealed `plusDiaperV2` even when old item names could not be rewritten** because `setup.clothes.under_lower` did not yet contain the v2 templates (`migrate` returned false). A too-early call would skip later retries. Fixed in `game/ModLI/plus-needs/needs.js` by counting pending old names and only setting `plusDiaperV2` when none remain. Regression: `QA-B081`. Initial failure: `QA-B072` returned `n === 0` before catalog registration; after the catalog-ready setup plus the retry fix both `QA-B072` and `QA-B081` pass.
- `QA-C010` first assumed IndexedDB was null in a normal compiled Chromium sandbox. That contradicted the existing fallback rule (IDB is only disabled when Web Storage is unusable). The case was corrected to assert working `localStorage` while leaving IDB alone; no product change. The no-storage IDB denial remains covered by `tests/no-storage-startup.mjs` and `tests/storage-fallback.test.mjs`.

## Initial failures

None in this automated run.

## Case register

| ID      | Kind        | Status | Name                                                                                                                  |
| ------- | ----------- | ------ | --------------------------------------------------------------------------------------------------------------------- |
| QA-L001 | integration | pass   | generateNPC sets enemyno from the filled slot index, not a call counter                                               |
| QA-L002 | integration | pass   | combatinit does not mark ungenerated stubs active                                                                     |
| QA-L003 | integration | pass   | does not add dummy combat fields to setup.baseNPC                                                                     |
| QA-L004 | behavioral  | pass   | combines bladder and bowel accidents into one pending notice                                                          |
| QA-L005 | behavioral  | pass   | trains continence up at 600 XP and down on enough negative XP                                                         |
| QA-L006 | behavioral  | pass   | bedwets on a long rest at low continence without a diaper, but a diaper absorbs instead                               |
| QA-L007 | behavioral  | pass   | dirties individual worn items and laundromat/wash resets them; cloth diapers reset fill                               |
| QA-L008 | behavioral  | pass   | raises continence reputation only when an accident is seen, and fades across clean days                               |
| QA-L009 | behavioral  | pass   | scales outdoor spotting down with forest depth and at night                                                           |
| QA-L010 | behavioral  | pass   | leaks when over capacity, washes cloth, disposes used disposables, and sells bulk packs cheaper                       |
| QA-L011 | behavioral  | pass   | maps official clothing srcfn output into sag folders and does not wrap layer objects                                  |
| QA-L012 | behavioral  | pass   | uses native plusneeds iconFile paths and concealment properties                                                       |
| QA-L013 | behavioral  | pass   | ticks needs from minutePassed and records long passes via passTime                                                    |
| QA-L014 | static      | pass   | registers wearProp and official under_lower catalog hooks once                                                        |
| QA-L015 | static      | pass   | removes undefined widgets and keeps shop widgets on real shop passages only                                           |
| QA-L016 | static      | pass   | wires location, overlay, caption, and creation hooks without doubling class-ask                                       |
| QA-L017 | static      | pass   | keeps a single compile-flow password gate in head.html and does not log secrets                                       |
| QA-L018 | behavioral  | pass   | preserves NPC-count and storage fallback safeguards                                                                   |
| QA-L019 | static      | pass   | includes copied diaper sprites and action icons                                                                       |
| QA-L020 | behavioral  | pass   | drifts needs once over an hour and does not apply a second hidden tick                                                |
| QA-L021 | behavioral  | pass   | applies consumable ratios and school lunch only once per day                                                          |
| QA-L022 | behavioral  | pass   | exposes 15 diaper models with clothing/adult shop split, volumes, and leak overflow                                   |
| QA-L023 | behavioral  | pass   | starts the Incontinent background in a pull-up with five wardrobe spares                                              |
| QA-L024 | behavioral  | pass   | migrates old diaper names and charges/evicts the Barb Street flat with a 3-day grace                                  |
| QA-L025 | integration | pass   | migrates a synthesized old-test-compile state, not a user save                                                        |
| QA-L026 | behavioral  | pass   | resolves distinct loadable PNGs for empty, half-full, and overflowing plusdpm                                         |
| QA-L027 | static      | pass   | keeps official genlayer clothing src construction and native sag rewrite                                              |
| QA-L028 | integration | pass   | compiled paperdoll layer srcfn rewrites sag without monkeypatching the layer                                          |
| QA-L029 | behavioral  | pass   | inserts the fallback immediately after <head> and is idempotent                                                       |
| QA-C001 | integration | pass   | QA-C001 [integration] compiled page loads SugarCube with the password gate up                                         |
| QA-C002 | integration | pass   | QA-C002 [integration] evaluated page text does not include a leaked password field                                    |
| QA-C003 | integration | pass   | QA-C003 [integration] plusNeedsTick and plusDiaperItems are present on the compiled page                              |
| QA-C004 | integration | pass   | QA-C004 [integration] compiled tick with Math.random stubbed drains hunger at the awake rate                          |
| QA-C005 | integration | pass   | QA-C005 [integration] widget macros needed for UI captions exist                                                      |
| QA-C006 | integration | pass   | QA-C006 [integration] caption extras and statistics widgets wikify without throwing                                   |
| QA-C007 | integration | pass   | QA-C007 [integration] class-ask and knock widgets wikify without throwing                                             |
| QA-C008 | integration | pass   | QA-C008 [integration] compiled clothing srcfn rewrites a half-full plusdpm path                                       |
| QA-C009 | integration | pass   | QA-C009 [integration] compiled module namespace deepMerge is a function                                               |
| QA-C010 | integration | pass   | QA-C010 [integration] compiled page can write and read localStorage when Web Storage exists                           |
| QA-C011 | integration | pass   | QA-C011 [integration] generateNPC still sets enemyno from the filled slot, not a call counter                         |
| QA-C012 | integration | pass   | QA-C012 [integration] compiled HTML contains one plusNeedsTick call site and no plusCanteenLunch                      |
| QA-C013 | integration | pass   | QA-C013 [integration] compiled npcincr Talk and Help with control training raise Danny love without a whitelist error |
| QA-C014 | integration | pass   | QA-C014 [integration] updateNewNamedNpcs migrates a save missing Danny                                                |
| QA-C015 | integration | pass   | QA-C015 [integration] Danny portrait srcfn uses the generic blank fallback                                            |
| QA-B001 | behavioral  | pass   | QA-B001 [behavioral] controlled 60-minute awake drain matches base rates                                              |
| QA-B002 | behavioral  | pass   | QA-B002 [behavioral] 180-minute long rest uses sleep rates                                                            |
| QA-B003 | behavioral  | pass   | QA-B003 [behavioral] long rest floors bladder at 400                                                                  |
| QA-B004 | behavioral  | pass   | QA-B004 [behavioral] zero hunger for an hour adds 80 stress                                                           |
| QA-B005 | behavioral  | pass   | QA-B005 [behavioral] zero thirst for an hour adds 120 stress                                                          |
| QA-B006 | behavioral  | pass   | QA-B006 [behavioral] crossing zero hunger increments zeroHunger stat once                                             |
| QA-B007 | behavioral  | pass   | QA-B007 [behavioral] coffee diuretic doubles bladder loss while active                                                |
| QA-B008 | behavioral  | pass   | QA-B008 [behavioral] water does not apply a diuretic                                                                  |
| QA-B009 | behavioral  | pass   | QA-B009 [behavioral] intro flag skips needs drain                                                                     |
| QA-B010 | behavioral  | pass   | QA-B010 [behavioral] non-positive minutes do not drain                                                                |
| QA-B011 | behavioral  | pass   | QA-B011 [behavioral] consume meal raises hunger and fills bowels                                                      |
| QA-B012 | behavioral  | pass   | QA-B012 [behavioral] consume drink raises thirst and fills bladder                                                    |
| QA-B013 | behavioral  | pass   | QA-B013 [behavioral] school lunch applies meal plus water once                                                        |
| QA-B014 | behavioral  | pass   | QA-B014 [behavioral] second school lunch the same day is a no-op                                                      |
| QA-B015 | behavioral  | pass   | QA-B015 [behavioral] school lunch works again the next day                                                            |
| QA-B016 | behavioral  | pass   | QA-B016 [behavioral] water-bottle prop uses drink scale and ml table                                                  |
| QA-B017 | behavioral  | pass   | QA-B017 [behavioral] the same food prop is applied only once per passage                                              |
| QA-B018 | behavioral  | pass   | QA-B018 [behavioral] snack hunger is doubled relative to the listed value                                             |
| QA-B019 | behavioral  | pass   | QA-B019 [behavioral] tea prop applies a milder diuretic                                                               |
| QA-B020 | behavioral  | pass   | QA-B020 [behavioral] toilet bladder visit empties the bar and counts a pee                                            |
| QA-B021 | behavioral  | pass   | QA-B021 [behavioral] combined toilet does not count a poop when bowels are above 1000                                 |
| QA-B022 | behavioral  | pass   | QA-B022 [behavioral] combined toilet empties bowels when below the 1000 threshold                                     |
| QA-B023 | behavioral  | pass   | QA-B023 [behavioral] holding-on relief XP is 120 at empty, 80 under 200, 0 at 400                                     |
| QA-B024 | behavioral  | pass   | QA-B024 [behavioral] scheduled-toilet bonus applies only in the 200-1600 window                                       |
| QA-B025 | behavioral  | pass   | QA-B025 [behavioral] first daily bladder exercise costs £10 and grants 90 XP                                          |
| QA-B026 | behavioral  | pass   | QA-B026 [behavioral] later same-day bladder exercise grants 25 XP                                                     |
| QA-B027 | behavioral  | pass   | QA-B027 [behavioral] bladder exercise is refused without enough money                                                 |
| QA-B028 | behavioral  | pass   | QA-B028 [behavioral] leaky accident chance is zero at or above the 1800 threshold                                     |
| QA-B029 | behavioral  | pass   | QA-B029 [behavioral] steel continence stays at 6 when XP is already at the cap                                        |
| QA-B030 | behavioral  | pass   | QA-B030 [behavioral] leaky continence stays at 0 when negative XP is already at the floor                             |
| QA-B031 | behavioral  | pass   | QA-B031 [behavioral] high continence does not bedwet on a long rest                                                   |
| QA-B032 | behavioral  | pass   | QA-B032 [behavioral] steel grace holds at empty without an immediate accident                                         |
| QA-B033 | behavioral  | pass   | QA-B033 [behavioral] steel grace expires into an accident after enough time at empty                                  |
| QA-B034 | behavioral  | pass   | QA-B034 [behavioral] dirt keyword tiers match 500/1000/1500 thresholds                                                |
| QA-B035 | behavioral  | pass   | QA-B035 [behavioral] dirt reduces allure and seduction multipliers                                                    |
| QA-B036 | behavioral  | pass   | QA-B036 [behavioral] clothes clean fails when random is at or above 0.6                                               |
| QA-B037 | behavioral  | pass   | QA-B037 [behavioral] laundromat is refused without £5                                                                 |
| QA-B038 | behavioral  | pass   | QA-B038 [behavioral] floor accidents add more reputation than hidden ones                                             |
| QA-B039 | behavioral  | pass   | QA-B039 [behavioral] school and busy multipliers stack on witnessed accident reputation                               |
| QA-B040 | behavioral  | pass   | QA-B040 [behavioral] night halves witnessed accident reputation                                                       |
| QA-B041 | behavioral  | pass   | QA-B041 [behavioral] reputation is clamped at 1000 Notorious                                                          |
| QA-B042 | behavioral  | pass   | QA-B042 [behavioral] reputation labels match every published threshold                                                |
| QA-B043 | behavioral  | pass   | QA-B043 [behavioral] clean-day fade uses the published decay table                                                    |
| QA-B044 | behavioral  | pass   | QA-B044 [behavioral] forest spotting uses depth 0, 100, and the 0.03 clamp                                            |
| QA-B045 | behavioral  | pass   | QA-B045 [behavioral] beach, park, and wolf-cave use their own base chances                                            |
| QA-B046 | behavioral  | pass   | QA-B046 [behavioral] night halves outdoor spotting chance                                                             |
| QA-B047 | behavioral  | pass   | QA-B047 [behavioral] class teacher names resolve from lesson passages                                                 |
| QA-B048 | behavioral  | pass   | QA-B048 [behavioral] class refuse chance rises with delinquency and repeat asks                                       |
| QA-B049 | behavioral  | pass   | QA-B049 [behavioral] high teacher love lowers refuse chance                                                           |
| QA-B050 | behavioral  | pass   | QA-B050 [behavioral] class ask records return passage and respects a forced grant roll                                |
| QA-B051 | behavioral  | pass   | QA-B051 [behavioral] knock pool reduces Ask-for-work weights using reputation                                         |
| QA-B052 | behavioral  | pass   | QA-B052 [behavioral] knock pool is unchanged outside house-knock passages                                             |
| QA-B053 | behavioral  | pass   | QA-B053 [behavioral] restroom ask is one-shot per house                                                               |
| QA-B054 | behavioral  | pass   | QA-B054 [behavioral] unused disposables cannot be disposed                                                            |
| QA-B055 | behavioral  | pass   | QA-B055 [behavioral] used cloth diapers cannot be thrown away                                                         |
| QA-B056 | behavioral  | pass   | QA-B056 [behavioral] five-packs are 20% off and ten-packs are 30% off                                                 |
| QA-B057 | behavioral  | pass   | QA-B057 [behavioral] adult packs are hidden until the adult shop is unlocked                                          |
| QA-B058 | behavioral  | pass   | QA-B058 [behavioral] clothing shop lists exclude oversize adult-only models                                           |
| QA-B059 | behavioral  | pass   | QA-B059 [behavioral] each published model exposes the documented capacities and iconFile                              |
| QA-B060 | behavioral  | pass   | QA-B060 [behavioral] buying a pack deducts money and adds wardrobe copies                                             |
| QA-B061 | behavioral  | pass   | QA-B061 [behavioral] buying a pack fails without enough money                                                         |
| QA-B062 | behavioral  | pass   | QA-B062 [behavioral] incontinent start does nothing without the background                                            |
| QA-B063 | behavioral  | pass   | QA-B063 [behavioral] incontinent start equips a pull-up, five spares, and leaky continence                            |
| QA-B064 | behavioral  | pass   | QA-B064 [behavioral] spare count ignores a used wardrobe diaper                                                       |
| QA-B065 | behavioral  | pass   | QA-B065 [behavioral] supply warning fires once per day when spares run out                                            |
| QA-B066 | behavioral  | pass   | QA-B066 [behavioral] jeans conceal 4 and gym bloomers conceal 0                                                       |
| QA-B067 | behavioral  | pass   | QA-B067 [behavioral] a medium plastic diaper stays hidden under jeans until it outgrows size 4                        |
| QA-B068 | behavioral  | pass   | QA-B068 [behavioral] sag tiers map empty, 25%, 50%, 75%, full, and overflow                                           |
| QA-B069 | behavioral  | pass   | QA-B069 [behavioral] over-capacity plastic absorption records leak overflow                                           |
| QA-B070 | behavioral  | pass   | QA-B070 [behavioral] washing cloth resets fill; disposing a used disposable succeeds                                  |
| QA-B071 | behavioral  | pass   | QA-B071 [behavioral] old v1 names all map to published v2 models                                                      |
| QA-B072 | behavioral  | pass   | QA-B072 [behavioral] migrating a v1 pull-up converts wet/soil counts into ml and lb                                   |
| QA-B081 | behavioral  | pass   | QA-B081 [behavioral] migrateAll retries later if the clothing catalog was not ready                                   |
| QA-B073 | behavioral  | pass   | QA-B073 [behavioral] signing a winter lease charges the deposit and marks the flat rented                             |
| QA-B074 | behavioral  | pass   | QA-B074 [behavioral] lease cannot be signed outside winter or without deposit                                         |
| QA-B075 | behavioral  | pass   | QA-B075 [behavioral] unpaid rent after the due month increments grace then evicts                                     |
| QA-B076 | behavioral  | pass   | QA-B076 [behavioral] collecting rent when funded clears grace and advances the due month                              |
| QA-B077 | behavioral  | pass   | QA-B077 [behavioral] moving out ends the lease without eviction                                                       |
| QA-B078 | behavioral  | pass   | QA-B078 [behavioral] daily ml counter resets when the day key changes                                                 |
| QA-B079 | behavioral  | pass   | QA-B079 [behavioral] accepting a diaper exposure raises insecurity and acceptance together                            |
| QA-B080 | behavioral  | pass   | QA-B080 [behavioral] full acceptance disables diaper-use stress                                                       |
| QA-S001 | static      | pass   | QA-S001 [static] Start2 and modUpdate initialize $danny control and dependency                                        |
| QA-S002 | static      | pass   | QA-S002 [static] Danny wait-until-morning uses passTimeUntil instead of raw $time                                     |
| QA-S003 | static      | pass   | QA-S003 [static] Canteen links the existing Danny intro and home exposes dannyroom_link                               |
| QA-S004 | static      | pass   | QA-S004 [static] Danny intro continue returns to Canteen                                                              |
| QA-S005 | static      | pass   | QA-S005 [static] class-ask widgets sit on all five lesson files                                                       |
| QA-S006 | static      | pass   | QA-S006 [static] official srcfn calls plusSagSrc and plusSagHook does not wrap layers                                 |
| QA-S007 | static      | pass   | QA-S007 [static] password gate exists only as the compile-flow head copy                                              |
| QA-S008 | static      | pass   | QA-S008 [static] time, prop, and catalog hooks are present exactly once                                               |
| QA-S009 | static      | pass   | QA-S009 [static] Danny is registered on native npcincr whitelist and relationshipclamp                                |
| QA-S010 | static      | pass   | QA-S010 [static] Danny save migration and new-game adult flags                                                        |
| QA-S011 | static      | pass   | QA-S011 [static] Danny portrait uses blank fallback and does not invent or reuse another NNPC folder                  |
| QA-L030 | behavioral  | pass   | replaces throwing localStorage/sessionStorage getters and disables IDB                                                |
| QA-L031 | behavioral  | pass   | disables IDB when native Web Storage is unavailable even if IDB looks present                                         |
| QA-L032 | behavioral  | pass   | disables IDB when the factory getter throws                                                                           |
| QA-L033 | behavioral  | pass   | disables IDB when open throws synchronously                                                                           |
| QA-L034 | behavioral  | pass   | leaves a working IndexedDB factory alone when Web Storage works                                                       |
| QA-L035 | behavioral  | pass   | falls back when Storage.prototype methods throw                                                                       |
| QA-L036 | integration | pass   | Tutorial NPC: stale count 1 + generate1                                                                               |
| QA-L037 | integration | pass   | Tutorial NPC: double generate1                                                                                        |
| QA-L038 | integration | pass   | Tutorial NPC: Bailey without endevent                                                                                 |
| QA-L039 | integration | pass   | Tutorial NPC: generate1 then generate2                                                                                |
| QA-L040 | integration | pass   | Tutorial NPC: Bailey then generate2                                                                                   |
| QA-L041 | integration | pass   | Tutorial NPC: clean Start2/Tutorial                                                                                   |
| QA-L042 | integration | pass   | No-storage compiled startup (getters, IDB null, password gate, modules)                                               |

## Limitations

- Automated tests and the live browser route are separate. The suite does not replay the Incognito save. The browser route does not re-run the 149 named cases.
- Compiled runtime tests load the page behind the password gate and do not complete character creation or wander the map.
- Old-save coverage remains a synthesized old-test-build state, not a player's personal save file.
- Paperdoll checks cover official srcfn path rewrite and decoded sprites, not a composited on-model screenshot.
- Live play did not complete every world branch. Sunday–Tuesday covered school, canteen, library, shops, and an attempted Office Temp job; Wednesday–Sunday stayed home-focused after forced-encounter blockers. Thursday–Saturday school and work were not replayed after Wednesday.
- Forced encounters that blocked safe progress (Domus tutorial was completed via Scream/Bite/Thank; Whitney hallway; office Floor 9 coffee-lift assault; Wednesday school abduction; Sunday Bailey debt Fight) were not fully played through. The Sunday weekly debt branch remains untested: the run did not click Get out of bed after reaching Sun 11 Sep 07:57.
- Winter housing / lease UI was covered by unit tests (QA-B073–B077) only, not by live UI.
- Console at the Danny-room snapshot showed four 404s. The Danny portrait is a verified product defect. `style.css` is requested by `importStyles("style.css")` and is absent from this tree. `img/ui/wolf-harmony.png` is registered in `canvasmodel-patterns-lib.js` and is absent from `img/ui/`. `usettings.js` 404 was observed; no matching source string was found in game files this pass. Do not claim a zero-console-error live session.

## Live browser Danny follow-up (local fix, not published)

Captured from `/workspace/qa-gameplay-log.md` on the live Pages build (source `7dccddef3` / compiled `f8cf2cf1`). This suite does not replay or alter that save.

- `<<npcincr>>` error `NNPC 'Danny' is not whitelisted for use with <<npcincr>>` came from `_validNNPCNames` in `game/base-system/named-npcs.twee` missing `"Danny"` even though `setup.NPCNameList` already listed him. `"Danny"` is now on that native whitelist.
- Clamps were added in `<<relationshipclamp>>` (`game/base-system/widgets.twee`): love 0–100, dom -50–50, trust -100–300. Talk/Help only increment love; Danny is not on the lust whitelist.
- `updateNewNamedNpcs` now inserts `{nam: "Danny", title: "dependent", insecurity: "weak", adult: 1, teen: 0}` for saves that already have `$npcListVersion >= 1` but no Danny record.
- New games: last `_swi` entry (Danny) is `"a"`, so `adult: 1` and `teen: 0`.
- Portrait: there is no `img/ui/nnpc/danny/` tree in source or the old compile. No new artwork was drawn and Danny was not pointed at another named NPC folder. `nnpc` srcfn returns existing `img/ui/nnpc/blank.png` when `active === "danny"`. Limitation: Danny has no character portrait.
- Local compiled file: `Degrees of Lewdity 7dccddef3-dirty.html` (not pushed). Live Pages still serves the pre-fix build until a later publish.
- New compiled/static cases: QA-C013 (Talk `<<npcincr Danny love 2>>` and Help `<<set $danny.control += 5>><<npcincr Danny love 3>>`), QA-C014 (migration), QA-C015 (blank portrait srcfn), QA-S009–S011.

## Source-verified Domus tutorial / settings for ordinary playthrough clicks

The Sunday leave-orphanage scene with only **Next** is the scripted first-street combat tutorial, not a missing-choice bug.

- Passage `Domus Street` in `game/overworld-town/loc-street/domus.twee` lines 52–55: when `$tutorial is 0` and `$debug is 0`, the only link is `[[Next|Tutorial]]`, which sets `$molestationstart` to 1 and `$tutorialExit` to `"Domus Street"`.
- Passage `Tutorial` in `game/base-combat/tutorial.twee` starts combat (when `$molestationstart` is 1: `<<controlloss>>`, `<<violence 1>>`, `<<neutral 1>>`, `<<molested>>`, `<<enable_rescue>>`, `<<maninit>>`). Bottom-of-turn advance is **Next** (loops on `Tutorial` until `_combatend`, then `Tutorial Finish`).
- Tutorial text (non-soft): "There are three common ways to escape an attacker; fight them off, sexually satisfy them, or be rescued." and "For this encounter, screaming will get you rescued."
- Mouth actions from `game/base-combat/actions-speech.twee`: **Scream**, **Plead**, **Demand** (plus TF-only Growl/Forgive/Retribution/Seduce/Disparage when those transformations apply). Choose **Scream**, then **Next**. Rescue end is `$rescue is 1 and $alarm is 1`.
- Hand actions at encounter start from `game/base-combat/actions-hands.twee`: **Punch** (defiant; non-consensual), **Stroke**, and when targeting self **Hold behind back** and **Cover your face**. After a grab, struggle generation in `game/base-combat/struggle.twee` exposes **Struggle** on left/right hands.
- **Pepper spray** is not granted until after the tutorial (`<<wearProp "pepper spray">>` on `Tutorial Flirt` / `Tutorial Thank`).
- After combat ends, `Tutorial Finish` offers **Flirt** (`[[Flirt|Tutorial Flirt]]`, tagged `<<promiscuous1>>`) or **Thank him/her** (`[[Thank <<him>>|Tutorial Thank]]`). Then **Next** returns to `$tutorialExit` (`Domus Street`). **Thank** is the non-flirt exit.
- Soft mode (`$gamemode` `"soft"`) changes tutorial flavour text but does not skip this encounter.

Content / mode settings reachable from normal UI (exact labels):

- Sidebar **OPTIONS** (`game/base-system/caption.twee` `<<button OPTIONS>>` / `<<overlayReplace "options">>`) opens overlay tabs **General**, **Theme**, **Performance**, **Advanced**, **Information** only. It does not contain Game Mode or Fetish Settings.
- From the Bedroom: link **Gameplay Settings** (`game/overworld-town/loc-home/main.twee:564`, `[[Gameplay Settings|Settings]]`, `$settingsExitPassage` `"Bedroom"`). The `Settings` passage (`game/base-system/settings.twee:4717`) renders `<<settings>>`, whose tabs are **Quick Edit**, **Game Settings**, **DoLP Settings**, and **Gallery** (`<<widget "settingsOptions">>`).
- **Game Mode:** labels **Normal mode**, **Soft mode**, and (only at game start, or if already selected) **Hard mode** (`<<widget "gameMode">>`, `settings.twee` around 1434). Soft mode tooltip states it is experimental, can contain gamebreaking bugs, and leaving settings with soft mode prevents earning feats until returned to normal mode (some feats then permanently blocked on that save).
- Start-screen only (`$passage is "Start"`) **Fetish Settings** presets: **Vanilla**, **Reasonably Debauched**, **No Beasts**, **Anything Goes** (`settings.twee` 906–916). After the game has started those four radios are not on that Start-only block; use **Gameplay Settings** → **Game Settings** → subsection **Fetish Settings** (`<<subsectionSettingsTabButton "Fetish Settings" "fetish">>`) and **Beast Settings** for individual toggles such as **Enable bestiality**, **Enable tentacles**, **Enable watersports**, **Enable facesitting**, **Enable hypnosis**.
- Bedroom also has **Attitudes** and **Bedroom UI Settings**; those are not encounter-content filters.

No live-save fixtures were written. Browser seven-day evidence is recorded below and in `/workspace/qa-gameplay-log.md`.

## Live browser seven-day evidence (separate stream)

Source of truth: `/workspace/qa-gameplay-log.md`, updated through the final history-recovery section. Real-world play date Sunday 8 Nov 2026 (America/Los_Angeles). In-game year was never shown.

### Deployed build that was played

- Target: https://redcommand025.github.io/dol-plus-localStorage-danny-comp/
- Live compiled `test` tip: `f8cf2cf14d72f73a456b3e72cbfb8c409f551515` (https://github.com/redcommand025/dol-plus-localStorage-danny-comp/commit/f8cf2cf14d72f73a456b3e72cbfb8c409f551515), message “Rebuild plus-needs native integration from source 7dccddef3”.
- Matching published source `test` tip: `7dccddef31ada38935fe490df8ca145997954518` (https://github.com/redcommand025/dol-plus-localStorage-danny/commit/7dccddef31ada38935fe490df8ca145997954518). Local worktree is `7dccddef3-dirty`.
- The three product fixes listed above are local and uncommitted. They are **not** on the live Pages build. `main` was not updated (source `origin/main` `be2c10d8e`; compiled `origin/main` `6a28a298`).
- Session: fresh Chrome Incognito, adult notice, female character, Incontinent background, No Beasts preset, pregnancy Disabled, Normal mode. Gate password is omitted from this document.

### Clock and dates

- Initial HUD: Sunday 07:00, £5. No numeric calendar date was captured on that first Sunday.
- First numeric date observed: **Mon 5th Sep** (sidebar money/time/day group). Year not shown.
- Final numeric date observed: **Sun 11th Sep 07:57** (screenshot HUD).
- Elapsed: seven full in-game days plus 57 minutes from the initial Sunday 07:00 to Sun 11 Sep 07:57. Do not invent a starting Sunday calendar number or a year.

### Day-by-day coverage (unique time; rollbacks not double-counted)

- **First Sunday (07:00 onward):** Bailey office £100 / one-week intro; bedroom, bathroom toilet/tap, kitchen snack/water, main hall, Danny's room (`<<npcincr>>` whitelist error plus Danny portrait 404). School set equipped. Domus Street tutorial: Scream, then Bite; bystanders interrupted; Thank (not Flirt); received pepper spray. Garden till rain-exposure; Leave; wardrobe recovery; sleep.
- **Mon 5 Sep:** School day. Bus Domus→Oxford (£1). Science (Sirris; restroom refused; Focus then Daydream), maths (Focus/Daydream), school toilets/tap, canteen Eat lunch, library Study history; student harassment ended after asking the librarian for help. Whitney hallway bullying was a forced Next-only scene; no sexual action chosen. Returned home by bus.
- **Tue 6 Sep (first attempt, later rolled back):** Walked to school (no fare). Cafe waitress role refused after the grope warning. High Street clothing shop browsed (medium pull-up packs £48/£84; unaffordable). Science, housekeeping, English, lunch, history. Office Temp accepted (£6.25/hour); Floor 7 completed; balance reached £21.45. Floor 9 coffee delivery became a forced lift assault; Scream/Struggle/Kick failed; stopped. **Rollback:** SAVES AutoSave A → Tue 07:15, £3.
- **Tue 6 Sep (replay, counted once):** School and library again (science, housekeeping, English, lunch, history, library study); asked librarian for help. No Office Temp replay. Home by bus (£2 remaining). Slept to Wed 06:51.
- **Wed 7 Sep:** School courtyard “Enter the school” triggered an empty-classroom abduction; Struggle failed; stopped before Next. **Rollback:** AutoSave A → Wed 06:51. Safe city/home only: High Street shop browse, weekday-closed museum, ignored dogboy, unaffordable laundromat. Manual slot 1 saved at orphanage main hall, Wed 7 Sep 08:02, £0, ID 95904; left untouched afterward.
- **Wed 7 Sep 08:02 through Sat 10 Sep:** Home endurance only (no school/Office). Attitudes and Statistics > Needs read-only. Wardrobe, kitchen snacks (when power was on), toilet/tap, paper-towel scrub, ordinary sleep. Pull-up supply exhausted Wednesday; later nights wet filthy PJs with nothing beneath. Robin kitchen Help (nonsexual; meal charred). Main-hall scream: Ignore. Helper paper-pickup: refused a later sexualized coupon. School-morning 8-hour sleep attempts on Thu and Fri produced a Bailey school-wake passage with no time advance; later sleeps after ~08:00 advanced normally.
- **Sat 10 Sep evening into Sunday:** Slept 8 hours from ~20:56/20:57 to Sun 11 Sep 04:57. Get out of bed opened Bailey’s overdue £100 collection (Submit or Fight). Fight plus one pepper-spray use did not provide a safe exit; stopped. **Rollback:** AutoSave A → Sun 11 Sep 04:57 wake page.
- **Final recovery (native history, not browser Back or engine writes):** OPTIONS → Performance → checked “Display history controls in the sidebar”; left “States saved to memory” at 5. Native “Go backward within the game history” once → Bed at Sat 10 Sep 20:57. Sleep 3 hours → Sat 23:57; Get out of bed (no debt); “Wear Pyjamas and climb in bed”; Sleep 8 hours → **Sun 11 Sep 07:57**. Did not click Get out of bed on that Sunday. Sunday debt branch remains untested.

### Final safe resume (screenshot)

Path: `/cursor/stores/user/grok-bot/agents/ad49364e-362e-43a3-8194-f63717adb29a/assets/fdc6e8251e5b147439d69a9f2d0b275640884079a382831820da1fe9c954c69d.png`.

HUD read from that image: £0, 07:57, Sun 11th Sep; version text `0.5.12.11 DoLP version`. Filthy blue pyjama shirt and bottoms with nothing beneath; hunger hungry; thirst parched; bladder and bowels fine; trauma healthy; fatigue refreshed; stress placid. Wetting notice and “out of clean spare diapers.” Outfit radios plus **Get out of bed** (not clicked). Sidebar history controls visible.

### Recommendation (not acted on)

Publish the tested local fixes to source and compiled `test` only; leave `main` unchanged. Re-verify Danny Talk/Help and the blank portrait on the published `test` Pages build, then a real existing-user save and winter-lease UI if those become the next goal. Do not push or commit until the user asks.
