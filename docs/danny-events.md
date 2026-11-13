# Danny location events

Short scenes with Danny that can start when you visit a real location at the right time. When one is available, the location shows a teal line describing what Danny is doing and a link (for example **Say hello**). Ignoring the link costs nothing. Following it plays a short multiple-choice scene in the `Danny Event` passage, then **Continue** returns you to the location.

- Engine: `game/ModLI/Danny/events/engine.js` (`window.DannyEvents`)
- Events: `game/ModLI/Danny/events/events-after.js`, `events-orphanage.js`, `events-school.js`
- Passage and widgets: `game/ModLI/Danny/danny.twee` (`Danny Event`, `<<dannyEvents "place">>`, `<<ldannyacceptance>>`, `<<dannyForcedAcceptanceText>>`)
- Tests: `tests/danny-events.test.mjs` (data, windows, requirements, rolls, branches, content) and QA-C022 in `tests/qa-compiled-runtime.test.mjs` (renders every node in the compiled game)

## How an event is chosen

- Each location calls `<<dannyEvents "place">>`. Hooks are skipped while you are exposed, at max stress or possessed.
- An event needs its place, day type (school day or any day), time window, requirements, and no active avoidance. Most events need you to have met Danny (`$dannyIntro`). Only the send-off and the camera check can be the first meeting.
- Each event rolls its chance **once per in-game day**, so walking in and out does not reroll. An event that has started is done for the day. All events are repeatable; lasting consequences come from the flags below.
- If several events are possible in one place, the first in load order wins. The aftermath scene loads first, so it always takes priority.
- A 0–99 roll (`$dannyEv.roll`) is made when a scene starts and is used for "unlucky roll" checks and for whether staff are around.

## Stat mapping

The spec uses percentages; the game's stats map like this:

| Spec                        | Game stat                         | Mapping                                                                |
| --------------------------- | --------------------------------- | ---------------------------------------------------------------------- |
| Love %                      | `C.npc.Danny.love` (0–100)        | same number (`dannyLove()`)                                            |
| Continence %                | `C.npc.Danny.continence` (0–6000) | ÷ 60 (`dannyCont()`); 30% = 1800, 25% = 1500, 15% = 900, 10% = 600     |
| Acceptance %                | `C.npc.Danny.acceptance` (0–1000) | ÷ 10 (`dannyAcc()`); 10% = 100                                         |
| Status / Reputation         | `$cool` (school status)           | asking a student to move succeeds if roll < clamp(`$cool` ÷ 4, 10, 90) |
| Submissive / Defiant traits | `$submissive`                     | defiant option at ≤ 850, submissive option at ≥ 1150                   |

"Low continence" means ≤ 30%, "very low" ≤ 15% (≤ 10% for the in-class accident), "low love" is mostly below 15–30% depending on the scene.

Stat changes are small: love ±1 to ±2 (±3 at most), acceptance +5 or +10 (gentle handling) and −10 or −25 (pushing), stress −6/+6.

## Events

| Event                                              | Where (passage)                                                               | When                                                                                 | Chance                      | Requirements             |
| -------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | --------------------------- | ------------------------ |
| Orphanage send-off                                 | Orphanage main hall                                                           | school days 7:00–7:30                                                                | 25%                         | can be the first meeting |
| Camera check                                       | Domus Street                                                                  | school days 7:10–7:30                                                                | 35%                         | can be the first meeting |
| Wet sheets (changing sheets + laundry sighting)    | Orphanage main hall, orphanage Bathroom                                       | any day 5:00–7:09 and 19:00–20:59                                                    | 15% (30% at low continence) | met                      |
| Breakfast line                                     | Orphanage Kitchen                                                             | school days 7:00–7:20                                                                | 50%                         | met                      |
| Shared morning chore                               | Garden, Kitchen                                                               | any day 6:00–7:59                                                                    | 30%                         | met                      |
| Common room evening                                | Orphanage main hall                                                           | 16:00–20:59 while Danny is home (school days from 20:00)                             | 35%                         | met, love ≥ 10           |
| Stairwell / side entrance                          | School Front Courtyard                                                        | school days 7:35–7:50                                                                | 30%                         | met                      |
| Hallway pass-by (near the bathrooms)               | Hallways                                                                      | school days 7:40–7:50                                                                | 15% (30% at low continence) | met                      |
| Bathroom timing overlap                            | School Toilets                                                                | school days 7:45–7:55                                                                | 30%                         | met                      |
| Library before class (with bathroom return)        | School Library                                                                | school days 7:50–8:55                                                                | 50% (70% at love ≥ 25)      | met                      |
| Science early seat                                 | Science Classroom (early study)                                               | school days 8:30–8:59                                                                | 80%                         | met                      |
| Science lab partner                                | Science Lesson (start)                                                        | Tuesdays and Thursdays, first 5 minutes                                              | 40%                         | met                      |
| Science seat next to Danny (with continence check) | Science Lesson (start)                                                        | school days, first 5 minutes                                                         | 75%                         | met                      |
| Canteen edge seat                                  | Canteen                                                                       | school days 12:00–12:59                                                              | 40%                         | met                      |
| Rainy day spare clothes                            | Hallways, School Front Courtyard                                              | rainy school days 8:00–15:00                                                         | 35%                         | met, love ≥ 15           |
| After-school photography                           | School Rear Courtyard                                                         | clear (not overcast) school days 15:00–15:19                                         | 40%                         | met, love ≥ 10           |
| Niki's studio critique                             | Photo (Niki's studio)                                                         | while Danny is at work                                                               | 35%                         | met                      |
| Post-accident aftermath                            | Hallways, Library, Canteen, both courtyards, main hall, Kitchen, Domus Street | from an hour after an accident the player saw or learned of, until noon the next day | 100%                        | an accident is pending   |

## Flags and effects

All event state is in `$dannyEv`, so old saves just gain it:

- `rolls`, `done`, `seen`: daily rolls, events done today, how often each was seen.
- `avoid`: avoidance until an absolute hour. Keys:
  - `library`: 3 days after following Danny uninvited at low love, or asking outright after a library accident.
  - `route`: hallway, stairwell and toilet events, 2–3 days after commenting on Danny's bathroom timing.
  - `orphanage`: main hall events for 3 hours (common room) or 3 days (telling the staff about the sheets).
  - `all`: no events until noon ("avoids you the rest of the morning" after the sheets).
- `accident`: pending aftermath `{ d, h }`. Set by `DannyEvents.accident()` from the wet sheets, the library bathroom return and the in-class accident. It also sets `$dannyAccidentKnown` to 1.
- `forcedAcceptance`: the **Forced Acceptance** failed-arc flag (the in-game day it first happened + 1) and `forcedCount`. It is set by pushing "just wear protection" or telling others while acceptance is still low: the sheets at love < 25 or acceptance < 30 (and the medium-love "wear protection" option, offered below 40% acceptance), the after-class follow-up below 20% acceptance and 50 love, and the aftermath at ≤ 15% acceptance and love < 40. Each time it takes 150 acceptance and 3 love, shows "Danny has shut you out of this part of his/her life. (Forced Acceptance: failed)", and from then on every acceptance gain from events is halved (rounded up). The flag is permanent.

## Content rules

Danny is a school student. Everything is non-sexual and non-romantic: no lust, flirting or intimacy, and no nudity when Danny changes. Continence is written as a matter-of-fact medical issue Danny manages; gentle, discreet handling is rewarded and making a scene of it is punished. Being in a photo is platonic. `tests/danny-events.test.mjs` checks every line for banned words.

## Approximations and things left out

- **Merged duplicates:** both send-off write-ups are one event; Library Early Arrival, Library Before Class and Library Bathroom Return are one event (the return is the "wait at the table" branch); Changing Sheets and Laundry Room Sighting are one event; Hallway Near Bathroom and Hallway Pass-By are one event. Science early seat and seat-next-to-Danny stay separate because they are different situations (arriving early avoids the seat conflict).
- **Places the game doesn't have:** no laundry room or common room, so the sheets use the main hall and the orphanage bathroom, and the evening scene uses the main hall. There are no bleachers or photography club, so the after-school scene is on the spectator steps by the field off the rear courtyard during Danny's after-school courtyard slot, and the club is Niki's studio while Danny works there.
- **Science:** the game has no lab days, so Tuesday and Thursday are lab days. "Well before the bell" is the existing early-study visit to the science classroom (8:30–8:59).
- **Requirements the spec left open:** "relationship established enough to visit" is love ≥ 10; the wet sheets and breakfast need you to have met Danny.
- **Schedule:** event times follow the spec, not `getDannyLocation()`. The schedule still has Danny in their room until 8:00 and walking to school 8:00–8:44, while the send-off says they leave at 7:00–7:30 and the library says they're there from 7:50. I didn't change the schedule.
- **Left out:** "If Lust is active and this happens near intimacy..." (content rule).
