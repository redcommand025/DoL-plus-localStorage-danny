# DoL-plus-localStorage-danny

Combined project:

- Base: Official Frostberg Degrees of Lewdity Plus source (gitgud.io/Frostberg/degrees-of-lewdity-plus)
- Danny: Integrated as standard named NPC (same path as Robin/Poppy)
- User additions from compiled HTML: storage polyfill, plus-needs mod (see \_user-decompiled/)

## Danny integration

- setup.NPCNameList includes "Danny"
- Parallel arrays in npcNamed.twee extended
- loveAlias and loveInterestNpc updated
- game/ModLI/Danny/danny.twee has skeleton passages
- <<dannyroom_link>> hooked next to <<robinroom_link>>

## Build

Use `./compile.sh`. That compiles with `--head devTools/head.html --module modules`
and prepends the storage fallback so it runs before SugarCube libraries.

Equivalent core tweego invocation (still needs the prepend step in `compile.sh`):
./devTools/tweego/tweego_linux64 -o index.html --head "devTools/head.html" --module "modules" game/
