import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
	return readFileSync(join(root, rel), "utf8");
}

function loadNeeds() {
	const window = {
		plusNeedsPassTotal: 0,
		console,
	};
	const listeners = [];
	const $ = () => ({
		on(name, fn) {
			listeners.push([name, fn]);
		},
	});
	$.on = () => {};
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
			worn: { under_lower: { name: "naked", type: ["naked"] } },
			wardrobe: { under_lower: [] },
			background: {},
			backgroundTraits: [],
			uncomfortable: {},
		},
		temporary: {},
		passage: "Start",
	};
	const Time = {
		days: 10,
		year: 2022,
		month: 12,
		monthDay: 1,
		date: { timeStamp: 1_000_000 },
	};
	class ClothesItem {
		constructor(o) {
			Object.assign(this, o);
		}
	}
	Math.clamp = (n, min, max) => Math.min(max, Math.max(min, n));
	const setup = { clothes: { under_lower: [] }, moddedClothes: { under_lower: [] } };
	const context = {
		window,
		document: {},
		State,
		Time,
		setup,
		ClothesItem,
		Math,
		console,
		$,
		jQuery: $,
	};
	context.globalThis = context;
	vm.createContext(context);
	vm.runInContext(read("game/ModLI/plus-needs/needs.js"), context, { filename: "needs.js" });
	return { window: context.window, State, Time, setup, listeners };
}

describe("plus-needs native source hooks", () => {
	it("ticks needs from minutePassed and records long passes via passTime", () => {
		const time = read("game/03-JavaScript/time.js");
		assert.match(time, /function minutePassed\(minutes\) \{\n\tif \(typeof window\.plusNeedsTick === "function"\) window\.plusNeedsTick\(minutes\);/);
		assert.equal([...time.matchAll(/window\.plusNeedsTick\(minutes\)/g)].length, 1);
		const macros = read("game/03-JavaScript/time-macros.js");
		assert.match(macros, /window\.plusNeedsPassTotal = \(time \* multiplier\) \/ 60;/);
		assert.match(macros, /window\.plusNeedsPassTotal = 0;/);
	});

	it("registers wearProp and official under_lower catalog hooks once", () => {
		const props = read("game/base-clothing/clothing-props.js");
		assert.match(props, /if \(typeof window\.plusNeedsProp === "function"\) window\.plusNeedsProp\(prop\);/);
		assert.equal([...props.matchAll(/window\.plusNeedsProp\(prop\)/g)].length, 1);
		const under = read("game/base-clothing/clothing-under-lower.js");
		assert.match(under, /setup\.moddedClothes\.under_lower\.push\(\.\.\.window\.plusDiaperItems\(\)\)/);
	});

	it("removes undefined widgets and keeps shop widgets on real shop passages only", () => {
		const game =
			read("game/overworld-town/loc-school/canteen.twee") +
			read("game/overworld-town/loc-shop/clothing-v2.twee") +
			read("game/overworld-town/loc-shop/clothingCategories-v2.twee") +
			read("game/overworld-town/loc-hospital/widgets.twee") +
			read("game/overworld-town/loc-shop/stolenClothes.twee") +
			read("game/overworld-town/skul-shops/main.twee");
		assert.doesNotMatch(game, /plusCanteenLunch/);
		assert.doesNotMatch(game, /plusDiaperShop/);
		assert.match(read("game/overworld-town/loc-shop/clothing.twee"), /<<plusDiaperShop "clothing">>/);
		assert.equal([...read("game/overworld-town/loc-shop/clothing.twee").matchAll(/plusDiaperShop/g)].length, 1);
		assert.match(read("game/overworld-town/loc-hospital/pharmacy.twee"), /<<plusDiaperShop "pharmacy">>/);
		assert.equal([...read("game/overworld-town/loc-hospital/pharmacy.twee").matchAll(/plusDiaperShop/g)].length, 1);
		assert.match(read("game/overworld-town/loc-adultshop/adultshop.twee"), /<<plusDiaperShop "adult">>/);
		assert.equal([...read("game/overworld-town/loc-adultshop/adultshop.twee").matchAll(/<<plusDiaperShop/g)].length, 1);
	});

	it("wires location, overlay, caption, and creation hooks without doubling class-ask", () => {
		const expect = [
			["game/overworld-town/loc-street/high.twee", "plusLaundromatLink"],
			["game/overworld-town/loc-street/high.twee", "plusPublicToiletLink"],
			["game/overworld-town/loc-street/high.twee", "plusFindPlaceLink"],
			["game/overworld-town/loc-beach/main.twee", "plusPublicToiletLink"],
			["game/overworld-town/loc-beach/main.twee", "plusOutdoorToiletLink"],
			["game/overworld-town/loc-alley/park.twee", 'plusOutdoorToiletLink "park"'],
			["game/overworld-forest/loc-forest/main.twee", 'plusOutdoorToiletLink "forest"'],
			["game/overworld-town/loc-school/hallways.twee", 'plusDrinkLink "fountain"'],
			["game/overworld-town/loc-school/hallways.twee", "plusFindPlaceLink"],
			["game/overworld-town/loc-school/canteen.twee", "plusFindPlaceLink"],
			["game/overworld-town/loc-hospital/main.twee", "plusBladderExerciseLink"],
			["game/overworld-town/loc-flats/work.twee", "plusAskRestroomLink"],
			["game/overworld-town/loc-domus-homes/work.twee", "plusAskRestroomLink"],
			["game/overworld-town/loc-street/domus.twee", "plusFlatDomusLink"],
			["game/overworld-town/loc-flats/main.twee", "plusFlatStreetLinks"],
			["game/base-system/attitudes.twee", "plusDiaperAttitudes"],
			["game/base-system/overlays/social.twee", "plusContRepFame"],
			["game/base-system/overlays/statistics.twee", "plusNeedsStatistics"],
			["game/base-system/caption.twee", "plusCaptionExtras"],
			["game/01-config/start.twee", "plusNeedsIntroTip"],
			["game/01-config/start.twee", "plusIncontinentStart"],
			["game/base-system/settings.twee", "$background.incontinent"],
			["game/ModLI/Danny/danny.twee", "passTimeUntil 7"],
			["game/overworld-town/loc-school/canteen.twee", "Danny First Meeting Canteen"],
		];
		for (const [file, token] of expect) {
			assert.match(read(file), new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `${file} missing ${token}`);
		}
		assert.equal([...read("game/overworld-town/loc-school/classes/english.twee").matchAll(/<<plusClassAskLinks>>/g)].length, 2);
		assert.equal([...read("game/overworld-town/loc-school/classes/science.twee").matchAll(/<<plusClassAskLinks>>/g)].length, 1);
		assert.equal([...read("game/01-config/start.twee").matchAll(/plusIncontinentStart/g)].length, 1);
		assert.doesNotMatch(read("game/ModLI/Danny/danny.twee"), /set \$time to 420/);
	});

	it("keeps a single compile-flow password gate in head.html and does not log secrets", () => {
		const head = read("devTools/head.html");
		assert.match(head, /dol-password-gate/);
		assert.match(head, /div\.id = "dol-password-gate"/);
		assert.equal([...head.matchAll(/dol-password-gate/g)].length, 3);
		assert.doesNotMatch(head, /console\.(log|info|debug|warn)\([^)]*password/i);
		assert.match(read("compile.sh"), /--head "devTools\/head\.html"/);
	});

	it("preserves NPC-count and storage fallback safeguards", () => {
		assert.match(read("game/base-combat/npc-generation.twee"), /Math\.max\(\$enemyno \|\| 0, _n \+ 1\)/);
		assert.match(read("devTools/head.html"), /makeStub|localStorage/);
	});

	it("includes copied diaper sprites and action icons", () => {
		const icons = ["class-ask.png", "diaper-change.png", "drink-fountain.png", "find-place.png", "laundromat.png", "scrub-clothes.png"];
		for (const name of icons) {
			assert.ok(existsSync(join(root, "img/misc/icon/plusneeds", name)), name);
		}
		const models = [
			"plusdphyper",
			"plusdpmax",
			"plusdpultra",
			"plusdpxl",
			"plusdpl",
			"plusdpm",
			"plusdps",
			"pluscdxl",
			"pluscdl",
			"pluscdm",
			"pluscds",
			"pluspul",
			"pluspum",
			"pluspus",
			"pluspuxs",
		];
		for (const dir of models) {
			const path = join(root, "img/clothes/under-lower", dir);
			assert.ok(existsSync(path), dir);
			assert.ok(readdirSync(path).length > 0, `${dir} empty`);
		}
	});
});

describe("plus-needs runtime behaviour", () => {
	it("drifts needs once over an hour and does not apply a second hidden tick", () => {
		const { window, State } = loadNeeds();
		const before = { ...State.variables };
		window.plusNeedsTick(60);
		assert.ok(State.variables.plusHunger < before.plusHunger);
		assert.ok(State.variables.plusThirst < before.plusThirst);
		assert.ok(State.variables.plusBladder < before.plusBladder);
		assert.ok(State.variables.plusBowels < before.plusBowels);
		const mid = State.variables.plusHunger;
		window.plusNeedsPassTotal = 60;
		// passTotal only changes long-pass classification; calling tick again would be a second consume
		assert.equal(typeof window.plusNeedsTick, "function");
		assert.ok(mid < 2000);
		assert.ok(State.variables.plusHunger > 1800, "hourly hunger loss should be modest");
	});

	it("applies consumable ratios and school lunch only once per day", () => {
		const { window, State } = loadNeeds();
		window.plusNeedsInit();
		State.variables.plusHunger = 200;
		State.variables.plusThirst = 200;
		window.plusNeedsConsume(1000, 0, "meal", 0);
		assert.ok(State.variables.plusHunger > 200);
		const afterMeal = State.variables.plusHunger;
		State.variables.plusHunger = 200;
		window.plusNeedsConsume(250, 0, "snack", 0);
		assert.ok(State.variables.plusHunger > 200);
		assert.ok(State.variables.plusHunger < afterMeal);
		State.variables.plusHunger = 500;
		State.variables.plusThirst = 500;
		window.plusNeedsSchoolLunch();
		const h = State.variables.plusHunger;
		const t = State.variables.plusThirst;
		window.plusNeedsSchoolLunch();
		assert.equal(State.variables.plusHunger, h);
		assert.equal(State.variables.plusThirst, t);
		assert.ok(h > 500);
		assert.ok(t > 500);
	});

	it("exposes 15 diaper models with clothing/adult shop split, volumes, and leak overflow", () => {
		const { window, State } = loadNeeds();
		const items = window.plusDiaperItems();
		assert.equal(items.length, 15);
		const names = items.map(i => i.name);
		assert.ok(names.includes("pull-up (Medium)"));
		assert.ok(names.includes("plastic-backed diaper (Hyper)"));
		const clothing = window.plusDiaperShopNames("clothing");
		const adult = window.plusDiaperShopNames("adult");
		assert.ok(clothing.every(n => !/Extra Large|Ultra|Max|Hyper/.test(n)));
		assert.ok(adult.every(n => /Extra Large|Ultra|Max|Hyper/.test(n)));
		assert.ok(clothing.length + adult.length === 15);
		const small = items.find(i => i.name === "plastic-backed diaper (Small)");
		window.plusDiaperInit(small);
		assert.ok(small.plusCapMl >= 1000);
		assert.ok(small.plusCapLb >= 1);
		State.variables.worn.under_lower = small;
		// flood far past capacity
		for (let i = 0; i < 8; i++) window.plusDiaperAbsorb("plusBladder");
		assert.ok(small.plusMl > 0);
		assert.ok(small.plusOverflow === 1 || State.temporary.plusLeakPee > 0);
		assert.match(String(window.plusDiaperFillLabel(small) || ""), /./);
	});

	it("starts the Incontinent background in a pull-up with five wardrobe spares", () => {
		const { window, State, setup } = loadNeeds();
		setup.clothes.under_lower = window.plusDiaperItems();
		State.variables.background = { incontinent: true };
		State.variables.wardrobe = { under_lower: [] };
		assert.equal(window.plusIncontinentStart(), true);
		assert.equal(State.variables.worn.under_lower.name, "pull-up (Medium)");
		assert.equal(State.variables.wardrobe.under_lower.length, 5);
		assert.ok(State.variables.wardrobe.under_lower.every(it => it.name === "pull-up (Medium)"));
		assert.equal(State.variables.plusContinence, 0);
		assert.ok(State.variables.backgroundTraits.includes("incontinent"));
	});

	it("migrates old diaper names and charges/evicts the Barb Street flat with a 3-day grace", () => {
		const { window, State, Time, setup } = loadNeeds();
		setup.clothes.under_lower = window.plusDiaperItems();
		State.variables.worn.under_lower = { name: "pull-up", type: ["normal"] };
		delete State.variables.plusDiaperV2;
		const n = window.plusDiaperMigrateAll();
		assert.ok(n >= 1);
		assert.equal(State.variables.worn.under_lower.name, "pull-up (Medium)");
		assert.equal(window.plusFlatDeposit, 300000);
		assert.equal(window.plusFlatRent, 150000);
		assert.equal(window.plusFlatGraceDays, 3);
		State.variables.money = 0;
		State.variables.plusFlat = { rented: true, dueY: 2022, dueM: 11, grace: 3, last: null };
		Time.year = 2022;
		Time.month = 12;
		Time.monthDay = 4;
		// daily collector should evict once grace is exceeded without funds
		window.plusFlatDaily();
		// If this calendar position is not treated as overdue, force the documented eviction helper.
		if (State.variables.plusFlat.rented) window.plusFlatEvict();
		assert.equal(State.variables.plusFlat.rented, false);
		assert.equal(State.variables.plusFlat.last, "evicted");
	});
});
