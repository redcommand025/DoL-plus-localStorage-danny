import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = rel => readFileSync(join(root, rel), "utf8");

describe("PlusBeastArt combat-sprite fallbacks", () => {
	it("maps every new beast type to an existing sprite family and never leaves a gap", async () => {
		await import(join(root, "game/03-JavaScript/plus-beast-art.js"));
		const A = globalThis.PlusBeastArt;
		assert.deepEqual(A.missingArtTypes(), []);
		const expected = {
			sheep: "horse",
			deer: "horse",
			bee: "hawk",
			wasp: "hawk",
			dragon: "lizard",
			raccoon: "fox",
			frog: "lizard",
			beegirl: "hawk",
			sheepboy: "horse",
			deergirl: "horse",
			dragonboy: "lizard",
			raccoongirl: "fox",
		};
		for (const [type, sprite] of Object.entries(expected)) {
			assert.equal(A.spriteType(type), sprite, type);
			assert.equal(A.hasUniqueArt(sprite), true, sprite);
		}
		assert.equal(A.spriteType("wolf"), "wolf");
		assert.equal(A.spriteType("unknown-beast"), "creature");
		assert.equal(A.pathUsesMissingBeastArt("img/sex/doggy/beast/bee/back.png"), true);
		assert.equal(A.pathUsesMissingBeastArt("img/sex/doggy/beast/hawk/back.png"), false);
		assert.equal(A.pathUsesMissingBeastArt("img/transformations/bee/ear.png"), false);
	});
});

function tweeFiles() {
	const out = [];
	const walk = dir => {
		for (const name of readdirSync(dir, { withFileTypes: true })) {
			const p = join(dir, name.name);
			if (name.isDirectory()) walk(p);
			else if (name.name.endsWith(".twee")) out.push(p);
		}
	};
	walk(join(root, "game"));
	return out;
}

function readGame() {
	return tweeFiles()
		.map(p => readFileSync(p, "utf8"))
		.join("\n");
}

describe("new transformation acquisition routes", () => {
	it("registers the new beast types so generateBEAST can create them", () => {
		const lists = read("game/04-Variables/npcList.twee");
		for (const t of ["sheep", "deer", "bee", "wasp", "dragon", "raccoon", "frog"]) {
			assert.match(lists, new RegExp(`"${t}"`));
		}
		const gen = read("game/base-combat/beast-generation.twee");
		for (const t of ["sheep", "deer", "bee", "wasp", "dragon", "raccoon", "frog"]) {
			assert.match(gen, new RegExp(`"${t}"`));
		}
		assert.match(read("game/04-Variables/variables-modUpdate.twee"), /sheep.*deer.*bee.*wasp.*dragon.*raccoon.*frog/s);
	});

	it("sheep can be gained by watching meadow sheep and by the relax encounter", () => {
		const meadow = read("game/overworld-plains/loc-farm/meadow.twee");
		assert.match(meadow, /Watch the sheep \(0:30\)\|Meadow Sheep Watch/);
		assert.match(meadow, /Search for Clovers/);
		assert.match(meadow, /Relax \(0:15\)\|Meadow Relax/);
		assert.match(meadow, /<<beastNEWinit 1 sheep>>/);
		assert.match(meadow, /<<transform sheep 1>>/);
		const sheep = read("game/ModLI/plus-tf-encounters/meadow-sheep.twee");
		assert.match(sheep, /:: Meadow Sheep Watch/);
		assert.match(sheep, /<<transform sheep 1>>/);
		assert.match(sheep, /:: Meadow Sheep Sex/);
		assert.match(sheep, /:: Meadow Sheep Resist/);
	});

	it("raccoon can be gained at the landfill den, by searching trash, and in the forest", () => {
		const main = read("game/overworld-town/loc-landfill/main.twee");
		assert.match(main, /Trash Mammals/);
		assert.match(main, /<<beastNEWinit 3 raccoon>>/);
		assert.match(main, /<<transform raccoon 1>>/);
		assert.match(main, /Search for valuables/);
		const widgets = read("game/overworld-town/loc-landfill/widgets.twee");
		assert.match(widgets, /<<beastNEWinit 1 raccoon>>/);
		const den = read("game/ModLI/plus-tf-encounters/landfill-raccoon.twee");
		assert.match(den, /:: Trash Mammals/);
		assert.match(den, /:: Raccoons Rape/);
		const forest = read("game/overworld-forest/loc-forest/widgets.twee");
		assert.match(forest, /<<addevent "forestraccoon"/);
		assert.match(read("game/ModLI/plus-tf-encounters/widgets.twee"), /widget "forestraccoon"/);
	});

	it("frog can be gained from the bog croak and from bog frog combat", () => {
		const bog = read("game/overworld-forest/loc-bog/widgets.twee");
		assert.match(bog, /<<transform frog 1>>/);
		assert.match(bog, /<<beastNEWinit 1 frog>>/);
		assert.match(bog, /Bog Frog/);
		const combat = read("game/ModLI/plus-tf-encounters/bog-frog.twee");
		assert.match(combat, /:: Bog Frog\n/);
		assert.match(combat, /:: Bog Frog Finish/);
		assert.match(combat, /<<beastejaculation>>/);
	});

	it("deer still grants points on approach and can start a forest deer fight", () => {
		const deer = read("game/overworld-forest/loc-forest/events.twee");
		const start = deer.indexOf(":: Forest Deer");
		const body = deer.slice(start, start + 1500);
		assert.match(body, /<<transform deer 1>>/);
		assert.match(body, /<<beastNEWinit 1 deer>>/);
		assert.match(body, /Deer Rape/);
		assert.doesNotMatch(body, /<<location "forest">><<effects>>\n<<location "forest">>/);
		const combat = read("game/ModLI/plus-tf-encounters/forest-encounters.twee");
		assert.match(combat, /:: Deer Rape\n/);
		assert.match(combat, /:: Deer Rape Finish/);
		assert.doesNotMatch(combat, /Deer Rescue/);
	});

	it("fish and spider swarms grant their transformations", () => {
		const swarms = read("game/base-combat/swarms.twee");
		assert.match(swarms, /\$swarm\.type is "fish"[\s\S]*<<transform fish 1>>/);
		assert.match(swarms, /\$swarm\.type is "eels"[\s\S]*<<transform fish 1>>/);
		assert.match(swarms, /\$swarm\.type is "spiders"[\s\S]*<<transform spider 1>>/);
	});

	it("bee can be gained in the forest hive, and the hive is reachable from the deep forest", () => {
		const forest = read("game/overworld-forest/loc-forest/main.twee");
		assert.match(forest, /\$hive_intro isnot 1/);
		assert.match(forest, /Hive Approach/);
		assert.match(forest, /Hive Entrance/);
		assert.match(forest, /plusOutdoorToiletLink "forest"/);
		assert.match(read("game/base-system/location.twee"), /addlocation\(\s*"hive"/);
		const events = read("game/overworld-forest/loc-hive/events.twee");
		assert.match(events, /<<transform bee 2>>/);
		const main = read("game/overworld-forest/loc-hive/main.twee");
		assert.match(main, /<<transform bee 2>>/);
		assert.match(main, /<<beastNEWinit .*bee/);
		assert.doesNotMatch(main, /\|Fly\]\]/);
		assert.ok(existsSync(join(root, "img/misc/locations/hive/base.png")));
		assert.ok(existsSync(join(root, "img/misc/icon/bighive.png")));
		assert.ok(existsSync(join(root, "img/background/hive/day.png")));
	});

	it("dragon can be gained from forest footprints, a rare forest glade, and the moor", () => {
		const widgets = read("game/overworld-forest/loc-forest/widgets.twee");
		assert.match(widgets, /<<addevent "forestdragon"/);
		assert.match(widgets, /<<addevent "forestgladedragon"/);
		const enc = read("game/ModLI/plus-tf-encounters/widgets.twee");
		assert.match(enc, /widget "forestdragon"/);
		assert.match(enc, /widget "forestgladedragon"/);
		assert.match(enc, /widget "moordragon"/);
		assert.match(read("game/ModLI/plus-tf-encounters/forest-encounters.twee"), /:: Forest Dragon Molestation/);
		assert.match(read("game/ModLI/plus-tf-encounters/forest-glade-dragon.twee"), /:: Fae Dragon Molestation/);
		assert.match(read("game/ModLI/plus-tf-encounters/forest-glade-dragon.twee"), /\|Forest\]\]/);
		assert.doesNotMatch(read("game/ModLI/plus-tf-encounters/forest-glade-dragon.twee"), /Fae Realm/);
		assert.match(read("game/overworld-plains/loc-moor/widgets.twee"), /<<moordragon>>/);
		assert.match(read("game/ModLI/plus-tf-encounters/moor-dragon.twee"), /:: Moor Dragons Continue/);
		assert.match(read("game/ModLI/plus-tf-encounters/moor-dragon.twee"), /<<beastNEWinit 1 dragon>>/);
	});
});

describe("new beast combat art does not reference missing files", () => {
	it("beast-images remaps types through PlusBeastArt.spriteType", () => {
		const images = read("game/base-combat/beast-images.twee");
		assert.match(images, /PlusBeastArt\.spriteType\(\$NPCList\[_na\]\.type\)/);
		assert.match(images, /PlusBeastArt\.spriteType\(\$_npc\.type\)/);
		assert.equal((images.match(/PlusBeastArt\.spriteType/g) || []).length, 3);
	});

	it("no combat/sex path in the game tree points at bee, sheep, deer, dragon, raccoon, frog, or wasp sprite folders", async () => {
		await import(join(root, "game/03-JavaScript/plus-beast-art.js"));
		const A = globalThis.PlusBeastArt;
		const hits = [];
		for (const file of tweeFiles()) {
			const rel = file.slice(root.length + 1);
			const text = readFileSync(file, "utf8");
			for (const line of text.split("\n")) {
				if (A.pathUsesMissingBeastArt(line)) hits.push(rel + ": " + line.trim());
			}
		}
		assert.deepEqual(hits, []);
	});
});
