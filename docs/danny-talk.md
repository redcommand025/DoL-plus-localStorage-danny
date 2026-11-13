# Danny room Talk system

Pressing **Talk** in Danny's room starts a conversation. The game picks a random topic, then a random conversation tree in that topic. It skips the last four trees you used (`$dannyTalkRecent`).

## How it works

| Part                                                 | Where                                                                                                                                                                                                   |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Engine (picking, gates, pronouns, effect shorthands) | `game/ModLI/Danny/talk/engine.js` → `window.DannyTalk`                                                                                                                                                  |
| Trees                                                | `game/ModLI/Danny/talk/topic-school.js`, `topic-photo.js`, `topic-hobbies.js`, `topic-family.js`                                                                                                        |
| Passages                                             | `game/ModLI/Danny/danny.twee`: `Danny Room` (Talk link), `Danny Conversation` (renders one node), widget `gdannyacceptance`                                                                             |
| Tests                                                | `tests/danny-talk.test.mjs` (static graph, content, selection, save compatibility), `tests/qa-compiled-runtime.test.mjs` QA-C021 (walks every path in the compiled game for low and high stat profiles) |

- **Room slot:** Talk only shows when `getDannyLocation()` is `"room"`. Otherwise the room shows "Danny is about to head out, so there's no time for a proper talk."
- **Picking:** `DannyTalk.start()` runs inside the Talk link, so reloading the page does not pick a new tree. It picks a topic uniformly from the topics that still have a tree not in the recent list, then a random tree from that topic. The tree id is saved in `$dannyTalkTree` and the current node in `$dannyTalkNode`.
- **Save compatibility:** older saves with no `$dannyTalkRecent`, or a broken one, are repaired by `DannyTalk.ensureState()`. It keeps only known tree ids, the newest four, and nothing else needs migrating. An unknown tree or node ends the talk cleanly with a link back to the room.
- **Nodes:** each node is written in a small script inside a JS template string:
  - `## 1.2.1` starts a node. The key is a dotted path, so its depth is the number of segments.
  - Text lines are SugarCube markup, and a blank line starts a new paragraph. In-text variants use `<<if>>`.
  - `!fx love+1 stress-` lists shorthand effects. The engine expands them to the game's own widgets.
  - `-> 1.2.1.1: Label ?? <TwineScript gate>` is an option. A gate hides the option until it is true. DoL usually hides unavailable dialogue options rather than greying them out, so these do the same.
- **Ending a conversation:** a node with no options ends it with **Back to Danny's room**. Every node that has options has at least two that are always available, so there are no dead ends at low stats.
- **Time:** the opening scene uses `<<pass 1>>` and every later exchange uses `<<pass 2>>`.
- **Pronouns:** `{he} {He} {him} {his} {His} {himself}` follow Danny's pronoun with the same rule as `<<nnpc_he "Danny">>`. Niki uses the `{n…}` forms and Bailey the `{b…}` forms. Other named NPCs are referred to by name only.

## Totals

- 4 topics, 12 trees (3 per topic), **566 nodes**
- Every tree has a 3–5 option opening and reaches **10 exchanges** in at least one branch.

## Effects (the game's own widgets, each with its usual coloured feedback)

| Shorthand                      | Expands to                                                                      | Uses          |
| ------------------------------ | ------------------------------------------------------------------------------- | ------------- |
| `love+1` / `love+2` / `love+3` | `<<npcincr Danny love N>>` + `<<glove>>` / `<<gglove>>` / `<<ggglove>> "Danny"` | 193 / 83 / 14 |
| `love-1`                       | `<<npcincr Danny love -1>><<llove "Danny">>`                                    | 6             |
| `acceptance+`                  | `<<npcincr Danny acceptance 5>><<gdannyacceptance>>`                            | 15            |
| `stress-` / `stress+`          | `<<stress -6>><<lstress>>` / `<<stress 6>><<gstress>>`                          | 68 / 1        |
| `trauma-`                      | `<<trauma -6>><<ltrauma>>`                                                      | 5             |
| `control+`                     | `<<control 5>><<gcontrol>>`                                                     | 29            |

Danny's trust can't be raised with `<<npcincr>>` (the game only allows that for Eden), so trust is only read in gates. Love does the main work.

## Gate helpers

- `dannyLove()`, `dannyTrust()`, `dannyAcceptance()`, `dannyContinence()`: read `C.npc.Danny` and return 0 if Danny isn't loaded.
- `npcLove("Niki")`, `npcLove("Robin")`.
- Player variables: `$science`, `$maths`, `$history`, `$stress`, `$trauma`, `$control`, `$money`, `$swimmingskill`, `$tending`, `$housekeeping`.
- `$dannyAccidentKnown`: the user's existing flag. It is only used for one gentle, supportive line about planning a toilet stop before an early bus.

## Trees

| Topic                         | Tree                                    | Nodes | Max depth | Opening options                                                                                                                                                                                                                                                         | Gates and stat-based variants                                                                                                                                                                  |
| ----------------------------- | --------------------------------------- | ----- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| School and homework           | `school.homework` The science worksheet | 45    | 10        | 1. Offer to work through it together<br>2. Ask what the worksheet is actually about<br>3. Tease him about leaving it until the last minute<br>4. Suggest he takes a break first<br>5. Glance at the page and point straight at the mistake _(gated)_                    | opt 5: `$science gte 400`<br>opt 1.1.1.1.3: `$science lt 300`<br>text 1.1.1.1.1.1.1.1: `$science gte 400`                                                                                      |
| School and homework           | `school.project` The group project      | 45    | 10        | 1. Ask how he feels about that<br>2. Ask what the project is on<br>3. Offer to talk to Winter about switching groups<br>4. Tell him it might not be as bad as he thinks                                                                                                 | opt 2.2: `$history gte 400`<br>opt 1.1.1.1.1.1.1.3: `$trauma gte 2000 or $stress gte 5000 or dannyTrust() gte 50`<br>text 1.1.1.1.1.1.1: `$trauma gte 2000`                                    |
| School and homework           | `school.exam` The maths test            | 47    | 10        | 1. Offer to quiz him with the flashcards<br>2. Tell him to sit down before he wears a hole in the floor<br>3. Ask which topic scares him most<br>4. Ask how much sleep he's planning to get<br>5. Tell him you've got the same test and you're just as scared _(gated)_ | opt 5: `$stress gte 4000`<br>text 1.1.1.1.1: `$maths gte 400`<br>opt 1.1.1.1.1.1.1.1.3: `$control lte 400`<br>text 1.1.1.1.1.1.1.1: `$control lte 400`<br>text 3.2.2: `$maths gte 500`         |
| Photography and Niki's studio | `photo.contact` The contact sheet       | 47    | 10        | 1. Sit down and help him choose<br>2. Ask why Niki only lets him print one<br>3. Ask what he was photographing<br>4. Pick one at random and say that one                                                                                                                | opt 2.2: `$money gte 2000`<br>opt 1.1.1.1.1.1.1.1.3: `$trauma gte 2000`<br>text 1.1.1.1.1.1.1.1: `$trauma gte 2000`                                                                            |
| Photography and Niki's studio | `photo.shift` A shift at Niki's         | 50    | 10        | 1. Ask him to tell you everything<br>2. Ask if Niki was okay with how it went<br>3. Ask if he got paid at least<br>4. Tell him to take his coat off before he melts<br>5. Ask how Niki is doing, since you know him a bit _(gated)_                                     | opt 5: `npcLove("Niki") gte 10`                                                                                                                                                                |
| Photography and Niki's studio | `photo.stilllife` The still life        | 46    | 10        | 1. Offer to help with the lighting<br>2. Suggest swapping one of the objects<br>3. Ask why Niki sets homework like this<br>4. Take a bite of the apple                                                                                                                  | opt 1.1.1.1.1.1.1.1.3: `$control gte 600 or dannyLove() gte 40`<br>text 1.1.1.1.1.1.1.1: `dannyAcceptance() gte 400`                                                                           |
| Hobbies and weekend plans     | `hobbies.sunrise` The sunrise plan      | 46    | 10        | 1. Offer to help him plan it properly<br>2. Ask why the sunrise, and not the sunset<br>3. Ask if he's allowed out that early<br>4. Tell him you love the beach _(gated)_<br>5. Say it sounds like a lot of effort for one photo                                         | opt 4: `$swimmingskill gte 200`<br>text 1.1.1.1: `$control gte 700`<br>text 1.1.1.1.1.1.1: `$dannyAccidentKnown is 1 and dannyContinence() lt 2000`                                            |
| Hobbies and weekend plans     | `hobbies.beetles` The beetle book       | 48    | 10        | 1. Ask him to tell you more<br>2. Say that's horrifying<br>3. Ask why he likes beetles so much<br>4. Tell him about a beetle you saw in the forest<br>5. Share a beetle fact of your own _(gated)_                                                                      | opt 5: `$science gte 500`<br>text 1.1.1.1.1: `$trauma gte 2000 or $stress gte 5000`                                                                                                            |
| Hobbies and weekend plans     | `hobbies.chess` The donated chessboard  | 48    | 10        | 1. Offer to play a proper game<br>2. Admit you don't really know the rules<br>3. Ask who taught him<br>4. Ask if he wants to play something less serious instead<br>5. Tell him you're actually quite good at chess _(gated)_                                           | opt 5: `$maths gte 500`<br>text 1.1.1.1.1: `dannyLove() gte 40`<br>text 1.1.1.1.1.1.1.1.1: `$maths gte 500`                                                                                    |
| Family and home               | `family.littleones` The little ones     | 49    | 10        | 1. Sit down beside him and ask what happened<br>2. Ask if he got any sleep at all<br>3. Ask why Bailey didn't come<br>4. Tell him that was kind of him<br>5. Mention that Robin sometimes looks after the little ones too _(gated)_                                     | opt 5: `npcLove("Robin") gte 20`<br>text 1.1.1.1.1: `dannyLove() gte 40`<br>opt 1.1.1.1.1.1.1.1.3: `$trauma gte 2000 or dannyAcceptance() gte 400`<br>text 1.1.1.1.1.1.1.1: `$trauma gte 2000` |
| Family and home               | `family.camera` Before the orphanage    | 48    | 10        | 1. Ask about his gran<br>2. Ask how old the camera is<br>3. Ask if he remembers much from before<br>4. Tell him it's beautiful<br>5. Ask if he'd ever show you the photos she took _(gated)_                                                                            | opt 5: `dannyLove() gte 60 or dannyTrust() gte 50`                                                                                                                                             |
| Family and home               | `family.someday` Someday flat           | 47    | 10        | 1. Lie down next to the paper and look with him<br>2. Ask what his dream place would be like<br>3. Ask how far off someday is<br>4. Say you'd rather not think about leaving<br>5. Offer some tips on keeping a place nice _(gated)_                                    | opt 5: `$housekeeping gte 300`<br>opt 1.1.1.2: `$tending gte 200`<br>text 1.1.1.1.1: `dannyLove() gte 40`<br>text 1.1.1.1.1.1.1.1: `$stress gte 5000`                                          |

## Content rules

All the writing is second person ("You…"), with narration of what Danny and the player do. Danny is a school student, so nothing is romantic or sexual: no flirting, kissing, romance or innuendo. `tests/danny-talk.test.mjs` checks every node for banned words, and checks that continence words only appear behind `$dannyAccidentKnown`.

## What happened to the earlier Talk content

The old **Small talk** menu (`Danny Talk`: About day / work / them, About continence / accidents, Break down, Complain) and its scene banks in `game/ModLI/Danny/dialogues.js` were removed at the user's request. **Talk** (this conversation system) is the only way to chat with Danny in his room.
