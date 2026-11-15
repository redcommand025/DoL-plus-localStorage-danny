import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = rel => readFileSync(join(root, rel), "utf8");

function load(overrides = {}) {
	const window = { plusNeedsPassTotal: 0, console };
	const $ = () => ({ on() {}, wiki() {}, one() {} });
	$.on = () => {};
	$.one = () => {};
	const State = {
		variables: {
			plusHunger: 2000,
			plusThirst: 2000,
			plusBladder: 2000,
			plusBowels: 2000,
			plusContinence: 3,
			stress: 0,
			stressmax: 10000,
			pain: 0,
			tiredness: 0,
			gamemode: "normal",
			money: 0,
			outside: 0,
			location: "oxford",
			bus: "oxford",
			worn: { under_lower: { name: "naked", type: ["naked"] } },
			wardrobe: { under_lower: [] },
			background: {},
			backgroundTraits: [],
			uncomfortable: {},
			plusFlat: { rented: true, decor: {}, grace: 0 },
			schoolrep: { continence: 0 },
			plusContRep: 0,
			plusContRepPublic: 0,
			fame: { good: 0 },
			settings: { inflationBaileyRelentless: false },
			options: {},
			...overrides.variables,
		},
		temporary: {},
		passage: overrides.passage || "Plus Flat Bedroom",
	};
	const Time = {
		days: 10,
		year: 2022,
		month: 12,
		monthDay: 15,
		hour: 8,
		schoolDay: true,
		season: "winter",
		date: { timeStamp: 1_000_000 },
		dayState: "day",
		isWeekEnd: () => false,
		schoolTerm: true,
		...(overrides.Time || {}),
	};
	class ClothesItem {
		constructor(o) {
			Object.assign(this, o);
		}
	}
	const Weather = { temperature: 15, precipitation: "none", isFreezing: false, isSnow: false, windSpeed: 0 };
	const setup = {
		clothes: { under_lower: [] },
		moddedClothes: { under_lower: [] },
		Locations: {
			get() {
				return this[State.variables.location] ? this[State.variables.location]() : State.variables.location;
			},
		},
		LocationImages: { flats: { folder: "flats" }, home: { folder: "home" } },
	};
	const C = { npc: { Robin: { init: 1, love: 60, pronoun: "f" }, Charlie: { init: 1 } } };
	const Config = { navigation: { override: undefined } };
	Math.clamp = (n, min, max) => Math.min(max, Math.max(min, n));
	const context = {
		window,
		document: { createElement: () => ({ className: "", innerHTML: "" }), querySelectorAll: () => [] },
		State,
		Time,
		Weather,
		setup,
		ClothesItem,
		Math,
		console,
		$,
		jQuery: $,
		C,
		Config,
		getRobinLocation: () => "orphanage",
	};
	context.globalThis = context;
	vm.createContext(context);
	vm.runInContext(read("game/ModLI/plus-needs/needs.js"), context, { filename: "needs.js" });
	vm.runInContext(read("game/ModLI/plus-needs/content.js"), context, { filename: "content.js" });
	vm.runInContext(read("game/ModLI/plus-needs/batch2.js"), context, { filename: "batch2.js" });
	return { window: context.window, State, Time, setup, C };
}

describe("plus bug-pass: flat location and Charlie", () => {
	it("maps $location 'flat' to the flats building art", () => {
		const { window, setup, State } = load();
		assert.equal(typeof setup.Locations.flat, "function");
		assert.equal(setup.Locations.flat(), "flats");
		State.variables.location = "flat";
		assert.equal(window.plusLocationIsFlat(), true);
		State.variables.location = "flats";
		assert.equal(window.plusLocationIsFlat(), true);
		State.variables.location = "home";
		State.passage = "Bedroom";
		assert.equal(window.plusLocationIsFlat(), false);
	});

	it("keeps plusFlatArrive from leaving $location as the building name", () => {
		const twee = read("game/ModLI/plus-needs/widgets.twee") + read("game/ModLI/plus-needs/content.twee") + read("game/ModLI/plus-needs/batch2.twee");
		assert.match(twee, /<<widget "plusFlatArrive">>/);
		assert.match(twee, /<<set \$location to "flat">>/);
		assert.match(twee, /<<plusFlatArrive>>/);
		assert.doesNotMatch(twee, /<<set \$location to "flat">><<location "flats">>/);
		assert.doesNotMatch(twee, /<<set \$bus to "plus_flat">><<location "flats">>/);
	});

	it("treats Charlie as present at the dance studio's real $location", () => {
		const { window, State } = load({ passage: "Dance Studio" });
		State.variables.location = "dance_studio";
		assert.equal(window.plusNpcPresent("Charlie"), true);
		State.variables.location = "office";
		State.passage = "Office Lobby";
		assert.equal(window.plusNpcPresent("Charlie"), false);
	});
});

describe("plus bug-pass: missed-day rent and evict", () => {
	it("walks each missed day and evicts after the grace period when rent cannot be collected", () => {
		const { window, State, Time } = load();
		const f = State.variables.plusFlat;
		f.rented = true;
		f.grace = 0;
		f.dueY = 2022;
		f.dueM = 10;
		f.processDay = Time.days;
		State.variables.money = 0;
		window.plusRobinMoveIn();
		assert.equal(window.plusRobinLivesAtFlat(), true);
		Time.days += 10;
		window.plusFlatOnTick();
		assert.equal(f.rented, false);
		assert.equal(f.msg, "evicted");
		assert.equal(f.processDay, Time.days);
		assert.equal(window.plusRobinLivesAtFlat(), false);
	});

	it("does not evict when only a single day has passed after the due date", () => {
		const { window, State, Time } = load();
		const f = State.variables.plusFlat;
		f.rented = true;
		f.grace = 0;
		f.dueY = 2022;
		f.dueM = 10;
		f.processDay = Time.days;
		State.variables.money = 0;
		Time.days += 1;
		window.plusFlatOnTick();
		assert.equal(f.rented, true);
		assert.equal(f.grace, 1);
		assert.equal(f.msg, "grace");
	});
});

describe("plus bug-pass: location image path guard", () => {
	it("does not build a location path from an Image-like object", () => {
		const src = read("game/03-JavaScript/weather/03-canvas/02-lib/00-effects/effects-location.js") + read("game/base-system/widgets.twee");
		assert.match(src, /imageSrc/);
		assert.doesNotMatch(
			read("game/03-JavaScript/weather/03-canvas/02-lib/00-effects/effects-location.js"),
			/const imagePath = typeof obj === "object" && obj\.image \? obj\.image : this\.obj;/
		);
	});
});
