import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
	return readFileSync(join(root, rel), "utf8");
}

function passage(src, name) {
	const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const re = new RegExp("^:: " + escaped + "(?: \\[[^\\]]*\\])?\\s*$", "m");
	const m = src.match(re);
	assert.ok(m, "missing passage " + name);
	const start = m.index + m[0].length;
	const rest = src.slice(start);
	const next = rest.search(/^:: /m);
	return next === -1 ? rest : rest.slice(0, next);
}

const FOUNTAIN_ENTRIES = [
	["game/overworld-town/loc-school/hallways.twee", "Hallways"],
	["game/overworld-town/loc-school/library.twee", "School Library"],
	["game/overworld-town/loc-beach/main.twee", "Beach"],
	["game/overworld-town/loc-alley/park.twee", "Park"],
	["game/overworld-town/loc-street/high.twee", "High Street"],
	["game/overworld-town/loc-shop/main.twee", "Shopping Centre"],
];

function loadNeeds(overrides = {}) {
	const window = { plusNeedsPassTotal: 0, console };
	const $ = () => ({ on() {} });
	$.on = () => {};
	const State = {
		variables: {
			plusHunger: 2000,
			plusThirst: 800,
			plusBladder: 2000,
			plusBowels: 2000,
			stress: 0,
			stressmax: 10000,
			pain: 0,
			tiredness: 0,
			gamemode: "normal",
			money: 500000,
			worn: { under_lower: { name: "naked", type: ["naked"] } },
			wardrobe: { under_lower: [] },
			background: {},
			backgroundTraits: [],
			uncomfortable: {},
			...overrides,
		},
		temporary: {},
		passage: "Hallways",
	};
	const Time = { days: 10, year: 2022, month: 12, monthDay: 1, date: { timeStamp: 1_000_000 } };
	Math.clamp = (n, min, max) => Math.min(max, Math.max(min, n));
	const setup = { clothes: { under_lower: [] }, moddedClothes: { under_lower: [] } };
	const context = {
		window,
		document: {},
		State,
		Time,
		setup,
		ClothesItem: class ClothesItem {
			constructor(o) {
				Object.assign(this, o);
			}
		},
		Math,
		console,
		$,
		jQuery: $,
	};
	context.globalThis = context;
	vm.createContext(context);
	vm.runInContext(read("game/ModLI/plus-needs/needs.js"), context, { filename: "needs.js" });
	return { window: context.window, State, Time };
}

describe("plus drinking fountain sip and leave", () => {
	it("keeps a fountain entry link at every Plus fountain location", () => {
		for (const [file, name] of FOUNTAIN_ENTRIES) {
			const src = read(file);
			assert.match(src, /<<plusDrinkLink "fountain">>/, `${file} missing plusDrinkLink`);
			assert.match(passage(src, name), /<<plusDrinkLink "fountain">>/, `${name} missing plusDrinkLink`);
		}
	});

	it("entry links still go to Plus Needs Drink in two minutes and remember the previous location", () => {
		const widget = passage(read("game/ModLI/plus-needs/widgets.twee"), "Widgets Plus Needs Spots");
		assert.match(widget, /<<widget "plusDrinkLink">>/);
		assert.match(widget, /`_pnLabel \+ " \(0:02\)"` "Plus Needs Drink"/);
		assert.match(widget, /<<set \$plusDrinkSpot to _pnSpot>>/);
		assert.match(widget, /<<set \$plusDrinkReturn to \$passage>>/);
	});

	it("after a fountain drink, the only options are another sip for one minute or leave", () => {
		const drink = passage(read("game/ModLI/plus-needs/widgets.twee"), "Plus Needs Drink");
		assert.match(drink, /<<if _pnFountain>>/);
		assert.match(drink, /<<link \[\[Take another sip \(0:01\)\|Plus Needs Drink\]\]>>/);
		assert.match(drink, /<<set \$plusDrinkAgain to 1>>/);
		assert.match(drink, /<<link \[\[Leave\|\$plusDrinkReturn\]\]>>/);
		assert.match(drink, /<<set \$eventskip to 1>>/);
		const fountainMenu = drink.split("<<if _pnFountain>>")[1].split("<<else>>")[0];
		const links = [...fountainMenu.matchAll(/<<link /g)];
		assert.equal(links.length, 2, fountainMenu);
		assert.doesNotMatch(fountainMenu, /Finish/);
		assert.match(drink, /<<if _pnSip>>[\s\S]*?<<pass 1>>/);
		assert.match(drink, /<<elseif _pnSip>>[\s\S]*?plusNeedsConsume\(0, 400, "drink", plusNeedsML\["fountain"\]\)/);
		assert.match(drink, /take a long drink of cool water\.[\s\S]*?plusNeedsConsume\(0, 400, "drink", plusNeedsML\["fountain"\]\)/);
	});

	it("stream, lake, cooler, cafe and shower drinks still only offer Finish", () => {
		const drink = passage(read("game/ModLI/plus-needs/widgets.twee"), "Plus Needs Drink");
		const otherMenu = drink.split("<<if _pnFountain>>")[1].split("<<else>>")[1];
		assert.match(otherMenu, /<<link \[\[Finish\|\$plusDrinkReturn\]\]>>/);
		assert.doesNotMatch(otherMenu, /Take another sip/);
	});

	it("another sip refills thirst with the existing variance and fills the bladder", () => {
		const { window, State } = loadNeeds();
		const V = State.variables;
		const beforeThirst = V.plusThirst;
		const beforeBladder = V.plusBladder;
		window.plusNeedsConsume(0, 400, "drink", window.plusNeedsML.fountain);
		window.plusNeedsTick(1);
		assert.ok(V.plusThirst > beforeThirst, `thirst should rise, was ${beforeThirst}, now ${V.plusThirst}`);
		assert.ok(V.plusThirst <= beforeThirst + 400 * 1.22 + 1, `thirst rose too far: ${V.plusThirst}`);
		assert.ok(V.plusThirst >= beforeThirst + 400 * 0.78 - 10, `thirst rose too little: ${V.plusThirst}`);
		assert.ok(V.plusBladder < beforeBladder, `bladder should fill, was ${beforeBladder}, now ${V.plusBladder}`);
		assert.equal(window.plusNeedsML.fountain, 200);
	});

	it("a second sip adds more thirst on top of the first drink", () => {
		const { window, State } = loadNeeds({ plusThirst: 600 });
		const V = State.variables;
		window.plusNeedsConsume(0, 400, "drink", window.plusNeedsML.fountain);
		window.plusNeedsTick(2);
		const afterFirst = V.plusThirst;
		window.plusNeedsConsume(0, 400, "drink", window.plusNeedsML.fountain);
		window.plusNeedsTick(1);
		assert.ok(V.plusThirst > afterFirst, `second sip should add thirst, first ${afterFirst}, now ${V.plusThirst}`);
	});
});
