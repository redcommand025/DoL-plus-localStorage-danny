import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadNeeds(overrides = {}) {
	const window = { plusNeedsPassTotal: 0, console };
	const $ = () => ({ on() {} });
	const State = {
		variables: {
			plusHunger: 2000,
			plusThirst: 2000,
			plusBladder: 2000,
			plusBowels: 2000,
			stress: 0,
			stressmax: 10000,
			pain: 0,
			tiredness: 0,
			gamemode: "normal",
			money: 500000,
			adultshopunlocked: true,
			worn: {
				under_lower: { name: "plain panties", type: ["normal"], plusDirt: 0, plusSoiled: 0 },
				lower: { name: "jeans", type: ["normal"], plusDirt: 0, plusSoiled: 0 },
			},
			wardrobe: { under_lower: [] },
			background: {},
			backgroundTraits: [],
			uncomfortable: {},
			...overrides.variables,
		},
		temporary: {},
		passage: overrides.passage || "Start",
	};
	const Time = { days: 10, year: 2022, month: 12, monthDay: 1, date: { timeStamp: 1_000_000 }, dayState: "day", ...(overrides.Time || {}) };
	class ClothesItem {
		constructor(o) {
			Object.assign(this, o);
		}
	}
	Math.clamp = (n, min, max) => Math.min(max, Math.max(min, n));
	const setup = { clothes: { under_lower: [], lower: [{ name: "jeans", skirt: 0 }] }, moddedClothes: { under_lower: [] } };
	const context = { window, document: {}, State, Time, setup, ClothesItem, Math, console, $, jQuery: $ };
	context.globalThis = context;
	vm.createContext(context);
	vm.runInContext(readFileSync(join(root, "game/ModLI/plus-needs/needs.js"), "utf8"), context, { filename: "needs.js" });
	return { window: context.window, State, Time, setup };
}

describe("plus-needs behavioral matrix", () => {
	it("combines bladder and bowel accidents into one pending notice", () => {
		const { window, State } = loadNeeds();
		State.variables.plusContinence = 3;
		State.variables.plusBladder = 2;
		State.variables.plusBowels = 2;
		window.plusNeedsTick(20);
		assert.equal(State.variables.plusAccident, "both");
		assert.equal(State.variables.plusNeedsStats.accBoth, 1);
		assert.ok(State.variables.plusNeedsStats.accWet >= 1);
		assert.ok(State.variables.plusNeedsStats.accSoiled >= 1);
	});

	it("trains continence up at 600 XP and down on enough negative XP", () => {
		const { window, State } = loadNeeds();
		State.variables.plusContinence = 3;
		State.variables.plusContinenceXP = 599;
		window.plusContinenceXP(2);
		assert.equal(State.variables.plusContinence, 4);
		assert.equal(State.variables.plusContinenceNote, "up");
		State.variables.plusContinenceXP = -599;
		window.plusContinenceXP(-2);
		assert.equal(State.variables.plusContinence, 3);
		assert.equal(State.variables.plusContinenceNote, "down");
		assert.equal(Array.from(window.plusContinenceNames).join(","), "Leaky,Weak,Unreliable,Normal,Strong,Iron,Steel");
	});

	it("bedwets on a long rest at low continence without a diaper, but a diaper absorbs instead", () => {
		const orig = Math.random;
		Math.random = () => 0;
		try {
			const bare = loadNeeds();
			bare.State.variables.plusContinence = 1;
			bare.State.variables.plusBladder = 800;
			bare.window.plusNeedsTick(480);
			assert.equal(bare.State.variables.plusBedwet, 1);
			assert.equal(bare.State.variables.plusNeedsStats.bedwets, 1);

			const protectedRun = loadNeeds();
			protectedRun.setup.clothes.under_lower = protectedRun.window.plusDiaperItems();
			const pull = protectedRun.window.plusDiaperItems().find(i => i.name === "pull-up (Medium)");
			protectedRun.window.plusDiaperInit(pull);
			protectedRun.State.variables.worn.under_lower = pull;
			protectedRun.State.variables.plusContinence = 1;
			protectedRun.State.variables.plusBladder = 800;
			protectedRun.window.plusNeedsTick(480);
			assert.notEqual(protectedRun.State.variables.plusBedwet, 1);
			assert.equal(protectedRun.State.variables.plusNightProtect, 1);
			assert.ok(pull.plusMl > 0);
		} finally {
			Math.random = orig;
		}
	});

	it("dirties individual worn items and laundromat/wash resets them; cloth diapers reset fill", () => {
		const { window, State, setup } = loadNeeds();
		setup.clothes.under_lower = window.plusDiaperItems();
		const cloth = window.plusDiaperItems().find(i => i.name === "cloth diaper (Medium)");
		window.plusDiaperInit(cloth);
		cloth.plusMl = 400;
		cloth.plusLb = 0.4;
		State.variables.worn.under_lower = cloth;
		State.variables.worn.lower = { name: "jeans", type: ["normal"] };
		window.plusClothesDirt(1200);
		assert.equal(State.variables.worn.lower.plusDirt, 1200);
		assert.equal(cloth.plusDirt, 1200);
		const orig = Math.random;
		Math.random = () => 0.1;
		try {
			assert.equal(window.plusClothesClean(), true);
			assert.ok(State.variables.worn.lower.plusDirt < 1200);
			assert.ok(cloth.plusMl > 0, "hand-scrub does not empty a diaper");
		} finally {
			Math.random = orig;
		}
		assert.equal(window.plusLaundromatWash(), true);
		assert.equal(State.variables.worn.lower.plusDirt, 0);
		assert.equal(cloth.plusDirt, 0);
		assert.equal(cloth.plusMl, 0);
		assert.equal(State.variables.plusNeedsStats.laundromat, 1);
	});

	it("raises continence reputation only when an accident is seen, and fades across clean days", () => {
		const { window, State, Time } = loadNeeds();
		window.plusContRepInit();
		const hidden = window.plusContRepOnAccident(0, { which: "plusBladder", title: "Beach" });
		assert.equal(hidden, 0);
		assert.equal(State.variables.plusContRep, 0);
		const seen = window.plusContRepOnAccident(1, { which: "plusBladder", title: "Beach", busy: false, school: false, night: false });
		assert.ok(seen > 0);
		assert.equal(State.variables.plusContRep, seen);
		const before = State.variables.plusContRep;
		State.variables.plusContRepDayGain = 0;
		State.variables.plusContRepCleanDays = 2;
		State.variables.plusContRepDecayDay = 10;
		Time.days = 12;
		const faded = window.plusContRepDecay();
		assert.ok(faded > 0);
		assert.ok(State.variables.plusContRep < before);
	});

	it("scales outdoor spotting down with forest depth and at night", () => {
		const { window, State, Time } = loadNeeds();
		State.variables.forest = 0;
		Time.dayState = "day";
		const edge = window.plusNeedsSpotChance("forest");
		State.variables.forest = 100;
		const deep = window.plusNeedsSpotChance("forest");
		assert.ok(edge > deep);
		assert.equal(edge, 0.35);
		assert.ok(deep <= 0.06);
		Time.dayState = "night";
		const nightDeep = window.plusNeedsSpotChance("forest");
		assert.ok(nightDeep < deep);
		assert.equal(window.plusNeedsSpotChance("park"), 0.2);
	});

	it("leaks when over capacity, washes cloth, disposes used disposables, and sells bulk packs cheaper", () => {
		const { window, State, setup } = loadNeeds();
		setup.clothes.under_lower = window.plusDiaperItems();
		const small = window.plusDiaperItems().find(i => i.name === "plastic-backed diaper (Small)");
		window.plusDiaperInit(small);
		State.variables.worn.under_lower = small;
		for (let i = 0; i < 8; i++) window.plusDiaperAbsorb("plusBladder");
		assert.ok(small.plusOverflow === 1 || State.temporary.plusLeakPee > 0);
		assert.equal(window.plusDiaperCanDispose(), true);
		assert.equal(window.plusDiaperDispose(), true);
		assert.equal(State.variables.plusNeedsStats.diapersUsed, 1);
		const cloth = window.plusDiaperItems().find(i => i.name === "cloth diaper (Small)");
		window.plusDiaperInit(cloth);
		cloth.plusMl = 200;
		State.variables.worn.under_lower = cloth;
		assert.equal(window.plusDiaperCanDispose(), false, "cloth is washed, not thrown away");
		window.plusDiaperReset(cloth);
		assert.equal(cloth.plusMl, 0);

		const pack5 = window.plusDiaperPackPrice("plastic-backed diaper (Medium)", 5);
		const pack10 = window.plusDiaperPackPrice("plastic-backed diaper (Medium)", 10);
		assert.equal(pack5.disc, 0.2);
		assert.equal(pack10.disc, 0.3);
		assert.ok(pack5.price < pack5.unit * 5);
		assert.ok(pack10.price < pack5.price * 2);
		const bought = window.plusDiaperBuyPack("plastic-backed diaper (Medium)", 5);
		assert.equal(bought.ok, true);
		assert.equal(State.variables.wardrobe.under_lower.length, 5);
		State.variables.adultshopunlocked = false;
		assert.equal(window.plusDiaperPackList("adult").length, 0);
	});

	it("maps official clothing srcfn output into sag folders and does not wrap layer objects", () => {
		const main = readFileSync(join(root, "game/04-Variables/canvasmodel-main.js"), "utf8");
		assert.match(main, /window\.plusSagSrc\(src, wornItem\)/);
		assert.match(main, /under-lower\/\$\{options\.worn\.under_lower\.setup\.variable\}\/penis\.png/);
		const needs = readFileSync(join(root, "game/ModLI/plus-needs/needs.js"), "utf8");
		assert.doesNotMatch(needs, /L\.srcfn = function/);
		assert.doesNotMatch(needs, /plusSagHooked/);
		const { window, setup } = loadNeeds();
		setup.clothes.under_lower = window.plusDiaperItems();
		const it = window.plusDiaperItems().find(i => i.name === "plastic-backed diaper (Medium)");
		window.plusDiaperInit(it);
		const base = "img/clothes/under-lower/plusdpm/full.png";
		assert.equal(window.plusSagSrc(base, it), base);
		it.plusMl = it.plusCapMl * 0.5;
		assert.equal(window.plusSagTier(it), 2);
		assert.equal(window.plusSagSrc(base, it), "img/clothes/under-lower/plusdpm/sag2/full.png");
		it.plusOverflow = 1;
		assert.equal(window.plusSagSrc("img/clothes/under-lower/plusdpm/penis.png", it), "img/clothes/under-lower/plusdpm/sag5/penis.png");
		assert.equal(window.plusSagSrc("img/clothes/lower/jeans/full.png", it), "img/clothes/lower/jeans/full.png");
		assert.equal(window.plusSagHook(), true);
	});

	it("uses native plusneeds iconFile paths and concealment properties", () => {
		const { window, setup } = loadNeeds();
		const items = window.plusDiaperItems();
		setup.clothes.under_lower = items;
		assert.ok(items.every(it => String(it.iconFile).startsWith("plusneeds/")));
		assert.equal(window.plusConcealOf({ name: "jeans", type: ["normal"] }, "lower"), 4);
		assert.equal(window.plusConcealOf({ name: "school skirt", type: ["normal"] }, "lower"), 7);
		assert.equal(window.plusConcealOf({ name: "micro skirt", type: ["normal"] }, "lower"), 1);
	});
});
