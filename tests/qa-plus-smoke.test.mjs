/**
 * Named QA behavioral cases for plus-needs native integration.
 * Each it() is one independently reported case. No cloned asset lookups.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
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
		passage: overrides.passage || "High Street",
	};
	const Time = {
		days: 10,
		year: 2022,
		month: 12,
		monthDay: 1,
		hour: 9,
		season: "winter",
		date: { timeStamp: 1_000_000 },
		dayState: "day",
		...(overrides.Time || {}),
	};
	class ClothesItem {
		constructor(o) {
			Object.assign(this, o);
		}
	}
	Math.clamp = (n, min, max) => Math.min(max, Math.max(min, n));
	const setup = {
		clothes: { under_lower: [], lower: [{ name: "jeans", type: ["normal"], skirt: 0 }] },
		moddedClothes: { under_lower: [] },
		...(overrides.setup || {}),
	};
	const C = { npc: { Doren: { love: 0 }, River: { love: 0 }, Sirris: { love: 0 }, Winter: { love: 0 }, Mason: { love: 0 } }, ...(overrides.C || {}) };
	const T = { eventpool: overrides.eventpool || [] };
	const context = { window, document: {}, State, Time, setup, ClothesItem, Math, console, $, jQuery: $, C, T };
	context.globalThis = context;
	vm.createContext(context);
	vm.runInContext(readFileSync(join(root, "game/ModLI/plus-needs/needs.js"), "utf8"), context, { filename: "needs.js" });
	return { window: context.window, State, Time, setup, C, T };
}

function withRandom(value, fn) {
	const orig = Math.random;
	Math.random = typeof value === "function" ? value : () => value;
	try {
		return fn();
	} finally {
		Math.random = orig;
	}
}

function registerItems(ctx) {
	const items = ctx.window.plusDiaperItems();
	ctx.setup.clothes.under_lower.push(...items);
	return items;
}

function wearNamed(ctx, name) {
	registerItems(ctx);
	const tpl = ctx.setup.clothes.under_lower.find(c => c.name === name);
	const it = JSON.parse(JSON.stringify(tpl));
	ctx.window.plusDiaperInit(it);
	ctx.State.variables.worn.under_lower = it;
	return it;
}

describe("QA plus-needs behavioral cases", () => {
	it("QA-B001 [behavioral] controlled 60-minute awake drain matches base rates", () => {
		const { window, State } = loadNeeds();
		withRandom(0.5, () => window.plusNeedsTick(60));
		assert.equal(State.variables.plusHunger, 2000 - 96);
		assert.equal(State.variables.plusThirst, 2000 - 156);
		assert.equal(State.variables.plusBladder, 2000 - 216);
		assert.equal(State.variables.plusBowels, 2000 - 30);
	});

	it("QA-B002 [behavioral] 180-minute long rest uses sleep rates", () => {
		const { window, State } = loadNeeds();
		withRandom(0.5, () => window.plusNeedsTick(180));
		assert.equal(State.variables.plusHunger, 2000 - 72);
		assert.equal(State.variables.plusThirst, 2000 - Math.round(2.6 * 180 * 0.25));
		assert.equal(State.variables.plusBladder, 2000 - 324);
	});

	it("QA-B003 [behavioral] long rest floors bladder at 400", () => {
		const { window, State } = loadNeeds({ variables: { plusBladder: 450, plusContinence: 5 } });
		withRandom(0.5, () => window.plusNeedsTick(180));
		assert.equal(State.variables.plusBladder, 400);
		assert.equal(State.variables.plusAccident, undefined);
	});

	it("QA-B004 [behavioral] zero hunger for an hour adds 80 stress", () => {
		const { window, State } = loadNeeds({ variables: { plusHunger: 0, stress: 10, pain: 0 } });
		withRandom(0.5, () => window.plusNeedsTick(60));
		assert.equal(State.variables.stress, 90);
		assert.equal(State.variables.pain, 20);
	});

	it("QA-B005 [behavioral] zero thirst for an hour adds 120 stress", () => {
		const { window, State } = loadNeeds({ variables: { plusThirst: 0, plusHunger: 2000, stress: 0, pain: 0 } });
		withRandom(0.5, () => window.plusNeedsTick(60));
		assert.equal(State.variables.stress, 120);
		assert.equal(State.variables.pain, 26);
	});

	it("QA-B006 [behavioral] crossing zero hunger increments zeroHunger stat once", () => {
		const { window, State } = loadNeeds({ variables: { plusHunger: 10 } });
		withRandom(0.5, () => window.plusNeedsTick(60));
		assert.ok(State.variables.plusHunger <= 0);
		assert.equal(State.variables.plusNeedsStats.zeroHunger, 1);
	});

	it("QA-B007 [behavioral] coffee diuretic doubles bladder loss while active", () => {
		const { window, State } = loadNeeds();
		assert.equal(window.plusApplyDiuretic("coffee"), true);
		assert.equal(State.variables.plusDiureticMul, 2);
		assert.equal(State.variables.plusDiureticMin, 90);
		withRandom(0.5, () => window.plusNeedsTick(60));
		assert.equal(State.variables.plusBladder, 2000 - 432);
		assert.equal(State.variables.plusDiureticMin, 30);
	});

	it("QA-B008 [behavioral] water does not apply a diuretic", () => {
		const { window, State } = loadNeeds();
		assert.equal(window.plusApplyDiuretic("water bottle"), false);
		assert.equal(State.variables.plusDiureticMul, undefined);
	});

	it("QA-B009 [behavioral] intro flag skips needs drain", () => {
		const { window, State } = loadNeeds({ variables: { intro: 1, plusHunger: 1500 } });
		withRandom(0.5, () => window.plusNeedsTick(60));
		assert.equal(State.variables.plusHunger, 1500);
	});

	it("QA-B010 [behavioral] non-positive minutes do not drain", () => {
		const { window, State } = loadNeeds({ variables: { plusHunger: 1500 } });
		window.plusNeedsTick(0);
		window.plusNeedsTick(-5);
		assert.equal(State.variables.plusHunger, 1500);
	});

	it("QA-B011 [behavioral] consume meal raises hunger and fills bowels", () => {
		const { window, State } = loadNeeds({ variables: { plusHunger: 400, plusBowels: 2000 } });
		withRandom(0.5, () => window.plusNeedsConsume(1000, 0, "meal", 0));
		assert.equal(State.variables.plusHunger, 1400);
		assert.equal(State.variables.plusBowels, 1800);
		assert.equal(State.variables.plusNeedsStats.meals, 1);
		assert.equal(State.variables.plusNeedsStats.kcal, 1000);
	});

	it("QA-B012 [behavioral] consume drink raises thirst and fills bladder", () => {
		const { window, State } = loadNeeds({ variables: { plusThirst: 500, plusBladder: 2000 } });
		withRandom(0.5, () => window.plusNeedsConsume(0, 500, "drink", 250, "tap"));
		assert.equal(State.variables.plusThirst, 1000);
		assert.equal(State.variables.plusBladder, 1800);
		assert.equal(State.variables.plusNeedsStats.drinks, 1);
		assert.equal(State.variables.plusNeedsStats.mlTotal, 250);
	});

	it("QA-B013 [behavioral] school lunch applies meal plus water once", () => {
		const { window, State } = loadNeeds({ variables: { plusHunger: 200, plusThirst: 200, plusBladder: 2000, plusBowels: 2000 } });
		withRandom(0.5, () => window.plusNeedsSchoolLunch());
		assert.equal(State.variables.plusHunger, 1200);
		assert.equal(State.variables.plusThirst, 700);
		assert.equal(State.variables.plusNeedsStats.meals, 1);
		assert.equal(State.variables.plusNeedsStats.drinks, 1);
		assert.equal(State.variables.plusSchoolLunchDay, 10);
	});

	it("QA-B014 [behavioral] second school lunch the same day is a no-op", () => {
		const { window, State } = loadNeeds({ variables: { plusHunger: 200 } });
		withRandom(0.5, () => {
			window.plusNeedsSchoolLunch();
			const after = State.variables.plusHunger;
			window.plusNeedsSchoolLunch();
			assert.equal(State.variables.plusHunger, after);
			assert.equal(State.variables.plusNeedsStats.meals, 1);
		});
	});

	it("QA-B015 [behavioral] school lunch works again the next day", () => {
		const { window, State, Time } = loadNeeds({ variables: { plusHunger: 200 } });
		withRandom(0.5, () => {
			window.plusNeedsSchoolLunch();
			Time.days = 11;
			window.plusNeedsSchoolLunch();
			assert.equal(State.variables.plusNeedsStats.meals, 2);
			assert.equal(State.variables.plusSchoolLunchDay, 11);
		});
	});

	it("QA-B016 [behavioral] water-bottle prop uses drink scale and ml table", () => {
		const { window, State } = loadNeeds({ variables: { plusThirst: 1000, plusBladder: 2000 } });
		withRandom(0.5, () => window.plusNeedsProp("water bottle"));
		assert.equal(State.variables.plusThirst, 1000 + 480);
		assert.equal(State.variables.plusBladder, 2000 - 192);
		assert.equal(State.variables.plusNeedsStats.drinks, 1);
		assert.equal(State.variables.plusNeedsStats.mlTotal, 500);
	});

	it("QA-B017 [behavioral] the same food prop is applied only once per passage", () => {
		const { window, State } = loadNeeds({ variables: { plusHunger: 100 } });
		withRandom(0.5, () => {
			window.plusNeedsProp("chocolate");
			window.plusNeedsProp("chocolate");
		});
		assert.equal(State.variables.plusNeedsStats.snacks, 1);
		assert.equal(State.variables.plusHunger, 100 + 500);
	});

	it("QA-B018 [behavioral] snack hunger is doubled relative to the listed value", () => {
		const { window, State } = loadNeeds({ variables: { plusHunger: 0 } });
		withRandom(0.5, () => window.plusNeedsProp("apple"));
		assert.equal(State.variables.plusHunger, 500);
		assert.equal(State.variables.plusNeedsStats.snacks, 1);
	});

	it("QA-B019 [behavioral] tea prop applies a milder diuretic", () => {
		const { window, State } = loadNeeds();
		withRandom(0.5, () => window.plusNeedsProp("tea"));
		assert.equal(State.variables.plusDiureticMul, 1.3);
		assert.equal(State.variables.plusDiureticMin, 45);
	});

	it("QA-B020 [behavioral] toilet bladder visit empties the bar and counts a pee", () => {
		const { window, State } = loadNeeds({ variables: { plusBladder: 400 } });
		window.plusNeedsToilet("bladder");
		assert.equal(State.variables.plusBladder, 2000);
		assert.equal(State.variables.plusNeedsStats.pees, 1);
		assert.equal(State.variables.plusBowels, 2000);
	});

	it("QA-B021 [behavioral] combined toilet does not count a poop when bowels are above 1000", () => {
		const { window, State } = loadNeeds({ variables: { plusBladder: 400, plusBowels: 1500 } });
		window.plusNeedsToilet("both");
		assert.equal(State.variables.plusBladder, 2000);
		assert.equal(State.variables.plusBowels, 1500);
		assert.equal(State.variables.plusNeedsStats.poops, 0);
	});

	it("QA-B022 [behavioral] combined toilet empties bowels when below the 1000 threshold", () => {
		const { window, State } = loadNeeds({ variables: { plusBladder: 400, plusBowels: 800 } });
		window.plusNeedsToilet("both");
		assert.equal(State.variables.plusBowels, 2000);
		assert.equal(State.variables.plusNeedsStats.poops, 1);
	});

	it("QA-B023 [behavioral] holding-on relief XP is 120 at empty, 80 under 200, 0 at 400", () => {
		const { window } = loadNeeds();
		assert.equal(window.plusContinenceReliefXP(0), 120);
		assert.equal(window.plusContinenceReliefXP(199), 80);
		assert.equal(window.plusContinenceReliefXP(399), 40);
		assert.equal(window.plusContinenceReliefXP(400), 0);
	});

	it("QA-B024 [behavioral] scheduled-toilet bonus applies only in the 200-1600 window", () => {
		const { window, State } = loadNeeds({ variables: { plusScheduleOn: true } });
		assert.equal(window.plusScheduleBonus(800), 40);
		assert.equal(window.plusScheduleBonus(199), 0);
		assert.equal(window.plusScheduleBonus(1601), 0);
		State.variables.plusScheduleOn = false;
		assert.equal(window.plusScheduleBonus(800), 0);
	});

	it("QA-B025 [behavioral] first daily bladder exercise costs £10 and grants 90 XP", () => {
		const { window, State } = loadNeeds({ variables: { plusContinence: 3, plusContinenceXP: 0, money: 5000 } });
		const r = window.plusBladderExercise();
		assert.equal(r.ok, true);
		assert.equal(r.xp, 90);
		assert.equal(State.variables.money, 4000);
		assert.equal(State.variables.plusContinenceXP, 90);
	});

	it("QA-B026 [behavioral] later same-day bladder exercise grants 25 XP", () => {
		const { window, State } = loadNeeds({ variables: { plusContinenceXP: 0, money: 5000 } });
		window.plusBladderExercise();
		const r = window.plusBladderExercise();
		assert.equal(r.xp, 25);
		assert.equal(State.variables.plusContinenceXP, 115);
		assert.equal(State.variables.money, 3000);
	});

	it("QA-B027 [behavioral] bladder exercise is refused without enough money", () => {
		const { window, State } = loadNeeds({ variables: { money: 999 } });
		const r = window.plusBladderExercise();
		assert.equal(r.ok, false);
		assert.equal(r.reason, "money");
		assert.equal(State.variables.money, 999);
	});

	it("QA-B028 [behavioral] leaky accident chance is zero at or above the 1800 threshold", () => {
		const { window } = loadNeeds();
		assert.equal(window.plusContinenceChance(0, 1800, 1), 0);
		assert.ok(window.plusContinenceChance(0, 1799, 1) > 0);
	});

	it("QA-B029 [behavioral] steel continence stays at 6 when XP is already at the cap", () => {
		const { window, State } = loadNeeds({ variables: { plusContinence: 6, plusContinenceXP: 599 } });
		window.plusContinenceXP(10);
		assert.equal(State.variables.plusContinence, 6);
		assert.equal(State.variables.plusContinenceXP, 600);
	});

	it("QA-B030 [behavioral] leaky continence stays at 0 when negative XP is already at the floor", () => {
		const { window, State } = loadNeeds({ variables: { plusContinence: 0, plusContinenceXP: -599 } });
		window.plusContinenceXP(-10);
		assert.equal(State.variables.plusContinence, 0);
		assert.equal(State.variables.plusContinenceXP, -600);
	});

	it("QA-B031 [behavioral] high continence does not bedwet on a long rest", () => {
		const { window, State } = loadNeeds({ variables: { plusContinence: 5, plusBladder: 500 } });
		withRandom(0, () => window.plusNeedsTick(240));
		assert.equal(State.variables.plusBedwet, undefined);
		assert.equal(State.variables.plusNeedsStats.bedwets || 0, 0);
	});

	it("QA-B032 [behavioral] steel grace holds at empty without an immediate accident", () => {
		const { window, State } = loadNeeds({ variables: { plusContinence: 6, plusBladder: 1 } });
		withRandom(0.5, () => window.plusNeedsTick(60));
		assert.equal(State.variables.plusBladder, 0);
		assert.equal(State.variables.plusAccident, undefined);
		assert.ok(State.variables.plusHoldShow >= 1);
	});

	it("QA-B033 [behavioral] steel grace expires into an accident after enough time at empty", () => {
		const { window, State } = loadNeeds({ variables: { plusContinence: 6, plusBladder: 0, plusGrace: { plusBladder: 119, plusBowels: 0 } } });
		withRandom(0.5, () => window.plusNeedsTick(10));
		assert.equal(State.variables.plusAccident, "plusBladder");
		assert.equal(State.variables.plusBladder, 2000);
	});

	it("QA-B034 [behavioral] dirt keyword tiers match 500/1000/1500 thresholds", () => {
		const { window } = loadNeeds();
		assert.equal(window.plusDirtKeyword({ plusDirt: 0 }), "");
		const d500 = window.plusDirtKeyword({ plusDirt: 500 });
		const d1000 = window.plusDirtKeyword({ plusDirt: 1000 });
		const d1500 = window.plusDirtKeyword({ plusDirt: 1500 });
		assert.ok(d500);
		assert.ok(d1000);
		assert.ok(d1500);
		assert.notEqual(d500, d1000);
		assert.notEqual(d1000, d1500);
	});

	it("QA-B035 [behavioral] dirt reduces allure and seduction multipliers", () => {
		const { window, State } = loadNeeds();
		State.variables.worn.lower.plusDirt = 1500;
		window.plusClothesSync && window.plusClothesSync();
		assert.ok(window.plusDirtAllureMul() < 1);
		assert.ok(window.plusDirtSeductionMul() < 1);
		assert.ok(window.plusDirtFactor() > 0);
	});

	it("QA-B036 [behavioral] clothes clean fails when random is at or above 0.6", () => {
		const { window, State } = loadNeeds();
		State.variables.worn.lower.plusDirt = 800;
		const failed = withRandom(0.6, () => window.plusClothesClean());
		assert.equal(failed, false);
		assert.equal(State.variables.worn.lower.plusDirt, 800);
	});

	it("QA-B037 [behavioral] laundromat is refused without £5", () => {
		const { window, State } = loadNeeds({ variables: { money: 499 } });
		assert.equal(window.plusLaundromatWash(), false);
		assert.equal(State.variables.money, 499);
	});

	it("QA-B038 [behavioral] floor accidents add more reputation than hidden ones", () => {
		const { window, State } = loadNeeds();
		const hidden = window.plusContRepOnAccident(0, { which: "plusBladder", floor: true });
		assert.equal(hidden, 0);
		window.plusContRepOnAccident(1, { which: "plusBladder", floor: true, busy: false, school: false, night: false });
		const floorAmt = State.variables.plusContRep;
		State.variables.plusContRep = 0;
		State.variables.plusContRepDayGain = 0;
		window.plusContRepOnAccident(1, { which: "plusBladder", floor: false, absorbed: false, busy: false, school: false, night: false });
		assert.ok(floorAmt > State.variables.plusContRep);
		assert.equal(floorAmt, 40);
	});

	it("QA-B039 [behavioral] school and busy multipliers stack on witnessed accident reputation", () => {
		const { window, State } = loadNeeds();
		window.plusContRepOnAccident(1, { which: "plusBladder", floor: false, busy: true, school: true, night: false });
		assert.equal(State.variables.plusContRep, Math.round(Math.round(20 * 1.5) * 1.5));
	});

	it("QA-B040 [behavioral] night halves witnessed accident reputation", () => {
		const { window, State } = loadNeeds();
		window.plusContRepOnAccident(1, { which: "plusBladder", floor: false, busy: false, school: false, night: true });
		assert.equal(State.variables.plusContRep, Math.round(20 * 0.5));
	});

	it("QA-B041 [behavioral] reputation is clamped at 1000 Notorious", () => {
		const { window, State } = loadNeeds({ variables: { plusContRep: 990 } });
		assert.equal(window.plusContRepAdd(50), 1000);
		assert.equal(window.plusContRepLabel(), "Notorious");
		assert.equal(window.plusContRepWorkMul(), 0.74);
		assert.equal(window.plusContRepRestroomMod(), -0.22);
	});

	it("QA-B042 [behavioral] reputation labels match every published threshold", () => {
		const { window, State } = loadNeeds();
		const expected = [
			[0, "Unknown"],
			[30, "Obscure"],
			[100, "Low-key"],
			[200, "Known"],
			[400, "Recognised"],
			[600, "Famous"],
			[1000, "Notorious"],
		];
		for (const [v, name] of expected) {
			State.variables.plusContRep = v;
			assert.equal(window.plusContRepLabel(), name, "label at " + v);
		}
	});

	it("QA-B043 [behavioral] clean-day fade uses the published decay table", () => {
		const { window, State, Time } = loadNeeds({ variables: { plusContRep: 200, plusContRepCleanDays: 0, plusContRepDayGain: 0, plusContRepDecayDay: 10 } });
		Time.days = 11;
		const before = State.variables.plusContRep;
		window.plusContRepDecay();
		assert.ok(State.variables.plusContRep < before);
		assert.ok(State.variables.plusContRepCleanDays >= 1);
	});

	it("QA-B044 [behavioral] forest spotting uses depth 0, 100, and the 0.03 clamp", () => {
		const { window, State } = loadNeeds({ variables: { forest: 0 } });
		assert.equal(window.plusNeedsSpotChance("forest"), 0.35);
		State.variables.forest = 100;
		assert.equal(window.plusNeedsSpotChance("forest"), 0.05);
		State.variables.forest = 200;
		assert.equal(window.plusNeedsSpotChance("forest"), 0.03);
	});

	it("QA-B045 [behavioral] beach, park, and wolf-cave use their own base chances", () => {
		const { window } = loadNeeds();
		assert.equal(window.plusNeedsSpotChance("beach"), 0.35);
		assert.equal(window.plusNeedsSpotChance("park"), 0.4);
		assert.equal(window.plusNeedsSpotChance("wolfcave"), 0.05);
	});

	it("QA-B046 [behavioral] night halves outdoor spotting chance", () => {
		const { window, Time } = loadNeeds();
		Time.dayState = "night";
		assert.equal(window.plusNeedsSpotChance("beach"), 0.175);
	});

	it("QA-B047 [behavioral] class teacher names resolve from lesson passages", () => {
		const { window } = loadNeeds();
		assert.equal(window.plusClassTeacher("English Lesson"), "Doren");
		assert.equal(window.plusClassTeacher("Maths Lesson"), "River");
		assert.equal(window.plusClassTeacher("Science Lesson"), "Sirris");
		assert.equal(window.plusClassTeacher("History Lesson"), "Winter");
		assert.equal(window.plusClassTeacher("Swimming Lesson"), "Mason");
		assert.equal(window.plusClassTeacher("Canteen"), undefined);
	});

	it("QA-B048 [behavioral] class refuse chance rises with delinquency and repeat asks", () => {
		const { window, State } = loadNeeds({ variables: { delinquency: 0 }, passage: "Science Lesson" });
		const base = window.plusClassRefuseChance("Sirris", 0);
		State.variables.delinquency = 1000;
		const delinquent = window.plusClassRefuseChance("Sirris", 0);
		const repeat = window.plusClassRefuseChance("Sirris", 3);
		assert.equal(Math.round(base * 1000) / 1000, 0.25);
		assert.ok(delinquent > base);
		assert.ok(repeat > delinquent);
	});

	it("QA-B049 [behavioral] high teacher love lowers refuse chance", () => {
		const { window, C } = loadNeeds();
		const low = window.plusClassRefuseChance("Doren", 0);
		C.npc.Doren.love = 80;
		const high = window.plusClassRefuseChance("Doren", 0);
		assert.ok(high < low);
	});

	it("QA-B050 [behavioral] class ask records return passage and respects a forced grant roll", () => {
		const { window, State } = loadNeeds({ passage: "History Lesson" });
		const granted = withRandom(0.99, () => window.plusClassAsk("toilet"));
		assert.equal(granted, true);
		assert.equal(State.variables.plusClassTeacherName, "Winter");
		assert.equal(State.variables.plusClassReturn, "History Lesson");
		assert.equal(State.variables.plusClassKind, "toilet");
	});

	it("QA-B051 [behavioral] knock pool reduces Ask-for-work weights using reputation", () => {
		const pool = [
			{ content: "Ask for work on Domus", weight: 10 },
			{ content: "Something else", weight: 10 },
		];
		const { window, State } = loadNeeds({ variables: { plusContRep: 1000 }, passage: "Domus House Knock", eventpool: pool });
		const out = window.plusKnockAdjustPool({ pool, title: "Domus House Knock" });
		assert.equal(out[0].weight, 10 * 0.74);
		assert.equal(out[1].weight, 10);
	});

	it("QA-B052 [behavioral] knock pool is unchanged outside house-knock passages", () => {
		const pool = [{ content: "Ask for work on Domus", weight: 10 }];
		const { window } = loadNeeds({ variables: { plusContRep: 1000 }, passage: "High Street" });
		const out = window.plusKnockAdjustPool({ pool, title: "High Street" });
		assert.equal(out[0].weight, 10);
	});

	it("QA-B053 [behavioral] restroom ask is one-shot per house", () => {
		const { window } = loadNeeds();
		assert.equal(window.plusRestroomCanAsk("Domus", 1), true);
		window.plusRestroomMarkUsed("Domus", 1);
		assert.equal(window.plusRestroomCanAsk("Domus", 1), false);
		assert.equal(window.plusRestroomCanAsk("Domus", 2), true);
	});

	it("QA-B054 [behavioral] unused disposables cannot be disposed", () => {
		const ctx = loadNeeds();
		const it = wearNamed(ctx, "plastic-backed diaper (Medium)");
		assert.equal(it.plusMl, 0);
		assert.equal(ctx.window.plusDiaperCanDispose(), false);
	});

	it("QA-B055 [behavioral] used cloth diapers cannot be thrown away", () => {
		const ctx = loadNeeds();
		const it = wearNamed(ctx, "cloth diaper (Medium)");
		it.plusMl = 200;
		assert.equal(ctx.window.plusDiaperCanDispose(), false);
	});

	it("QA-B056 [behavioral] five-packs are 20% off and ten-packs are 30% off", () => {
		const { window } = loadNeeds();
		const five = window.plusDiaperPackPrice("plastic-backed diaper (Medium)", 5);
		const ten = window.plusDiaperPackPrice("plastic-backed diaper (Medium)", 10);
		assert.equal(five.disc, 0.2);
		assert.equal(five.price, Math.round(900 * 5 * 0.8));
		assert.equal(ten.disc, 0.3);
		assert.equal(ten.price, Math.round(900 * 10 * 0.7));
	});

	it("QA-B057 [behavioral] adult packs are hidden until the adult shop is unlocked", () => {
		const { window, State } = loadNeeds({ variables: { adultshopunlocked: false } });
		assert.equal(window.plusDiaperPackList("adult").length, 0);
		assert.equal(window.plusDiaperSoldAt("plastic-backed diaper (Hyper)", "adult"), false);
		State.variables.adultshopunlocked = true;
		assert.ok(window.plusDiaperPackList("adult").length > 0);
		assert.equal(window.plusDiaperSoldAt("plastic-backed diaper (Hyper)", "adult"), true);
	});

	it("QA-B058 [behavioral] clothing shop lists exclude oversize adult-only models", () => {
		const { window } = loadNeeds();
		const clothing = window.plusDiaperShopNames("clothing");
		const adult = window.plusDiaperShopNames("adult");
		assert.ok(!clothing.some(n => /Hyper|Max|Ultra|Extra Large/.test(n)));
		assert.ok(adult.includes("plastic-backed diaper (Hyper)"));
		assert.equal(window.plusDiaperItems().length, 15);
	});

	it("QA-B059 [behavioral] each published model exposes the documented capacities and iconFile", () => {
		const { window } = loadNeeds();
		const expect = {
			"plastic-backed diaper (Hyper)": [12000, 9, "plusneeds/diaper-large.png", "plusdphyper"],
			"plastic-backed diaper (Max)": [7500, 5.5, "plusneeds/diaper-large.png", "plusdpmax"],
			"plastic-backed diaper (Ultra)": [5000, 3.75, "plusneeds/diaper-large.png", "plusdpultra"],
			"plastic-backed diaper (Extra Large)": [3500, 2.75, "plusneeds/diaper-large.png", "plusdpxl"],
			"plastic-backed diaper (Large)": [2500, 2, "plusneeds/diaper-large.png", "plusdpl"],
			"plastic-backed diaper (Medium)": [1800, 1.5, "plusneeds/diaper.png", "plusdpm"],
			"plastic-backed diaper (Small)": [1000, 1, "plusneeds/diaper-small.png", "plusdps"],
			"cloth diaper (Extra Large)": [2000, 1.75, "plusneeds/cloth-diaper.png", "pluscdxl"],
			"cloth diaper (Large)": [1500, 1.25, "plusneeds/cloth-diaper.png", "pluscdl"],
			"cloth diaper (Medium)": [1000, 0.875, "plusneeds/cloth-diaper.png", "pluscdm"],
			"cloth diaper (Small)": [600, 0.5, "plusneeds/cloth-diaper.png", "pluscds"],
			"pull-up (Large)": [2200, 1.5, "plusneeds/pull-up.png", "pluspul"],
			"pull-up (Medium)": [1600, 1, "plusneeds/pull-up.png", "pluspum"],
			"pull-up (Small)": [1000, 0.75, "plusneeds/pull-up.png", "pluspus"],
			"pull-up (Extra Small)": [450, 0.4, "plusneeds/pull-up.png", "pluspuxs"],
		};
		const items = window.plusDiaperItems();
		assert.equal(items.length, Object.keys(expect).length);
		for (const it of items) {
			const row = expect[it.name];
			assert.ok(row, it.name);
			window.plusDiaperInit(it);
			assert.equal(it.plusCapMl, row[0], it.name + " ml");
			assert.equal(it.plusCapLb, row[1], it.name + " lb");
			assert.equal(it.iconFile, row[2], it.name + " icon");
			assert.equal(it.variable, row[3], it.name + " variable");
		}
	});

	it("QA-B060 [behavioral] buying a pack deducts money and adds wardrobe copies", () => {
		const ctx = loadNeeds({ variables: { money: 10000 } });
		registerItems(ctx);
		const r = ctx.window.plusDiaperBuyPack("plastic-backed diaper (Medium)", 5);
		assert.equal(r.ok, true);
		assert.equal(ctx.State.variables.money, 10000 - r.price);
		assert.equal(ctx.State.variables.wardrobe.under_lower.length, 5);
	});

	it("QA-B061 [behavioral] buying a pack fails without enough money", () => {
		const ctx = loadNeeds({ variables: { money: 10 } });
		registerItems(ctx);
		const r = ctx.window.plusDiaperBuyPack("plastic-backed diaper (Medium)", 5);
		assert.equal(r.ok, false);
		assert.equal(r.reason, "money");
		assert.equal(ctx.State.variables.wardrobe.under_lower.length, 0);
	});

	it("QA-B062 [behavioral] incontinent start does nothing without the background", () => {
		const ctx = loadNeeds();
		registerItems(ctx);
		assert.equal(ctx.window.plusIncontinentStart(), false);
		assert.equal(ctx.State.variables.worn.under_lower.name, "plain panties");
	});

	it("QA-B063 [behavioral] incontinent start equips a pull-up, five spares, and leaky continence", () => {
		const ctx = loadNeeds({ variables: { background: { incontinent: true }, backgroundTraits: [] } });
		registerItems(ctx);
		assert.equal(ctx.window.plusIncontinentStart(), true);
		assert.equal(ctx.State.variables.plusContinence, 0);
		assert.equal(ctx.State.variables.worn.under_lower.name, "pull-up (Medium)");
		assert.equal(ctx.window.plusDiaperSpareCount(), 5);
		assert.ok(ctx.State.variables.backgroundTraits.includes("incontinent"));
	});

	it("QA-B064 [behavioral] spare count ignores a used wardrobe diaper", () => {
		const ctx = loadNeeds({ variables: { background: { incontinent: true }, backgroundTraits: [] } });
		registerItems(ctx);
		ctx.window.plusIncontinentStart();
		ctx.State.variables.wardrobe.under_lower[0].plusMl = 100;
		assert.equal(ctx.window.plusDiaperSpareCount(), 4);
	});

	it("QA-B065 [behavioral] supply warning fires once per day when spares run out", () => {
		const ctx = loadNeeds({ variables: { background: { incontinent: true } } });
		registerItems(ctx);
		ctx.window.plusIncontinentStart();
		ctx.State.variables.wardrobe.under_lower = [];
		const first = ctx.window.plusSupplyWarn();
		const second = ctx.window.plusSupplyWarn();
		assert.match(first, /out of clean spare diapers/);
		assert.equal(second, "");
	});

	it("QA-B066 [behavioral] jeans conceal 4 and gym bloomers conceal 0", () => {
		const { window } = loadNeeds();
		assert.equal(window.plusConcealOf({ name: "jeans", type: ["normal"] }, "lower"), 4);
		assert.equal(window.plusConcealOf({ name: "gym bloomers", type: ["normal"] }, "lower"), 0);
		assert.equal(window.plusConcealOf({ name: "witch robe", type: ["normal"] }, "over_lower"), 15);
	});

	it("QA-B067 [behavioral] a medium plastic diaper stays hidden under jeans until it outgrows size 4", () => {
		const ctx = loadNeeds();
		const it = wearNamed(ctx, "plastic-backed diaper (Medium)");
		it.plusMl = 0;
		const hidden = ctx.window.plusDiaperVisibility();
		assert.equal(hidden.conceal, 4);
		it.plusMl = it.plusCapMl;
		it.plusOverflow = 1;
		const shown = ctx.window.plusDiaperVisibility();
		assert.ok(shown.size >= hidden.size);
	});

	it("QA-B068 [behavioral] sag tiers map empty, 25%, 50%, 75%, full, and overflow", () => {
		const ctx = loadNeeds();
		const it = wearNamed(ctx, "plastic-backed diaper (Medium)");
		const src = "img/clothes/under-lower/plusdpm/full.png";
		it.plusMl = 0;
		assert.equal(ctx.window.plusSagTier(it), 0);
		assert.equal(ctx.window.plusSagSrc(src, it), src);
		it.plusMl = it.plusCapMl * 0.25;
		assert.equal(ctx.window.plusSagTier(it), 1);
		assert.equal(ctx.window.plusSagSrc(src, it), "img/clothes/under-lower/plusdpm/sag1/full.png");
		it.plusMl = it.plusCapMl * 0.5;
		assert.equal(ctx.window.plusSagTier(it), 2);
		it.plusMl = it.plusCapMl * 0.75;
		assert.equal(ctx.window.plusSagTier(it), 3);
		it.plusMl = it.plusCapMl;
		assert.equal(ctx.window.plusSagTier(it), 4);
		it.plusOverflow = 1;
		assert.equal(ctx.window.plusSagTier(it), 5);
		assert.equal(ctx.window.plusSagSrc(src, it), "img/clothes/under-lower/plusdpm/sag5/full.png");
	});

	it("QA-B069 [behavioral] over-capacity plastic absorption records leak overflow", () => {
		const ctx = loadNeeds();
		const it = wearNamed(ctx, "plastic-backed diaper (Small)");
		it.plusMl = it.plusCapMl;
		withRandom(0.5, () => ctx.window.plusDiaperAbsorb("plusBladder"));
		assert.ok(it.plusOverflow > 0);
	});

	it("QA-B070 [behavioral] washing cloth resets fill; disposing a used disposable succeeds", () => {
		const ctx = loadNeeds();
		const cloth = wearNamed(ctx, "cloth diaper (Small)");
		cloth.plusMl = 200;
		cloth.plusLb = 0.2;
		ctx.window.plusDiaperReset(cloth);
		assert.equal(cloth.plusMl, 0);
		assert.equal(cloth.plusLb, 0);
		const plastic = wearNamed(ctx, "plastic-backed diaper (Small)");
		plastic.plusMl = 100;
		assert.equal(ctx.window.plusDiaperDispose(), true);
		assert.equal(ctx.State.variables.plusNeedsStats.diapersUsed, 1);
	});

	it("QA-B071 [behavioral] old v1 names all map to published v2 models", () => {
		const { window } = loadNeeds();
		const map = window.plusDiaperOldMap;
		assert.equal(map["pull-up"], "pull-up (Medium)");
		assert.equal(map["plastic diaper"], "plastic-backed diaper (Medium)");
		assert.equal(map["plastic diaper (large)"], "plastic-backed diaper (Extra Large)");
		assert.equal(map["plastic diaper (small)"], "plastic-backed diaper (Small)");
		assert.equal(map["cloth diaper"], "cloth diaper (Small)");
		for (const next of Object.values(map)) assert.ok(window.plusDiaperDefs[next], next);
	});

	it("QA-B072 [behavioral] migrating a v1 pull-up converts wet/soil counts into ml and lb", () => {
		const ctx = loadNeeds();
		registerItems(ctx);
		ctx.State.variables.worn.under_lower = { name: "pull-up", type: ["normal"], plusDiaperWet: 2, plusDiaperSoil: 1 };
		delete ctx.State.variables.plusDiaperV2;
		const n = ctx.window.plusDiaperMigrateAll();
		assert.ok(n >= 1);
		assert.equal(ctx.State.variables.worn.under_lower.name, "pull-up (Medium)");
		assert.equal(ctx.State.variables.worn.under_lower.plusMl, 800);
		assert.equal(ctx.State.variables.worn.under_lower.plusLb, 0.5);
	});

	it("QA-B081 [behavioral] migrateAll retries later if the clothing catalog was not ready", () => {
		const ctx = loadNeeds();
		ctx.State.variables.worn.under_lower = { name: "pull-up", type: ["normal"], plusDiaperWet: 2, plusDiaperSoil: 1 };
		delete ctx.State.variables.plusDiaperV2;
		assert.equal(ctx.window.plusDiaperMigrateAll(), 0);
		assert.equal(ctx.State.variables.plusDiaperV2, undefined);
		assert.equal(ctx.State.variables.worn.under_lower.name, "pull-up");
		registerItems(ctx);
		assert.equal(ctx.window.plusDiaperMigrateAll(), 1);
		assert.equal(ctx.State.variables.worn.under_lower.name, "pull-up (Medium)");
		assert.equal(ctx.State.variables.plusDiaperV2, 1);
	});

	it("QA-B073 [behavioral] signing a winter lease charges the deposit and marks the flat rented", () => {
		const { window, State, Time } = loadNeeds({ variables: { money: 400000 }, Time: { season: "winter", year: 2022, month: 12, monthDay: 1 } });
		Time.season = "winter";
		const can = window.plusFlatCanSign();
		assert.equal(can.ok, true);
		const r = window.plusFlatSign();
		assert.equal(r.ok, true);
		assert.equal(State.variables.money, 100000);
		assert.equal(State.variables.plusFlat.rented, true);
		assert.equal(State.variables.plusFlat.dueY, 2022);
		assert.equal(State.variables.plusFlat.dueM, 12);
	});

	it("QA-B074 [behavioral] lease cannot be signed outside winter or without deposit", () => {
		const { window, Time } = loadNeeds({ variables: { money: 400000 } });
		Time.season = "summer";
		assert.equal(window.plusFlatCanSign().reason, "winter");
		Time.season = "winter";
		const poor = loadNeeds({ variables: { money: 100 }, Time: { season: "winter" } });
		poor.Time.season = "winter";
		assert.equal(poor.window.plusFlatCanSign().reason, "money");
	});

	it("QA-B075 [behavioral] unpaid rent after the due month increments grace then evicts", () => {
		const { window, State, Time } = loadNeeds({
			variables: { money: 0, plusFlat: { rented: true, dueY: 2022, dueM: 10, grace: 0 } },
			Time: { year: 2022, month: 12, monthDay: 2, days: 40 },
		});
		Time.year = 2022;
		Time.month = 12;
		window.plusFlatDaily();
		assert.equal(State.variables.plusFlat.grace, 1);
		window.plusFlatDaily();
		assert.equal(State.variables.plusFlat.grace, 2);
		window.plusFlatDaily();
		assert.equal(State.variables.plusFlat.grace, 3);
		window.plusFlatDaily();
		assert.equal(State.variables.plusFlat.rented, false);
		assert.equal(State.variables.plusFlat.last, "evicted");
	});

	it("QA-B076 [behavioral] collecting rent when funded clears grace and advances the due month", () => {
		const { window, State, Time } = loadNeeds({
			variables: { money: 200000, plusFlat: { rented: true, dueY: 2022, dueM: 10, grace: 2 } },
			Time: { year: 2022, month: 12, monthDay: 2 },
		});
		Time.year = 2022;
		Time.month = 12;
		assert.equal(window.plusFlatTryCollect(), true);
		assert.equal(State.variables.plusFlat.grace, 0);
		assert.equal(State.variables.plusFlat.last, "collected");
		assert.ok(State.variables.money < 200000);
		assert.ok(State.variables.plusFlat.dueM !== 10 || State.variables.plusFlat.dueY !== 2022);
	});

	it("QA-B077 [behavioral] moving out ends the lease without eviction", () => {
		const { window, State } = loadNeeds({ variables: { plusFlat: { rented: true, dueY: 2022, dueM: 12, grace: 0 } } });
		assert.equal(window.plusFlatMoveOut().ok, true);
		assert.equal(State.variables.plusFlat.rented, false);
		assert.equal(State.variables.plusFlat.last, "movedout");
	});

	it("QA-B078 [behavioral] daily ml counter resets when the day key changes", () => {
		const { window, State, Time } = loadNeeds();
		withRandom(0.5, () => window.plusNeedsConsume(0, 250, "drink", 250));
		assert.equal(State.variables.plusNeedsStats.mlToday, 250);
		Time.days = 11;
		window.plusNeedsStats();
		assert.equal(State.variables.plusNeedsStats.mlToday, 0);
		assert.equal(State.variables.plusNeedsStats.mlTotal, 250);
	});

	it("QA-B079 [behavioral] accepting a diaper exposure raises insecurity and acceptance together", () => {
		const { window, State } = loadNeeds({ variables: { insecurity_diaper: 0, acceptance_diaper: 0 } });
		const r = window.plusDiaperExposure();
		assert.equal(State.variables.insecurity_diaper, 1);
		assert.ok(State.variables.acceptance_diaper > 0);
		assert.equal(r.accepted, false);
	});

	it("QA-B080 [behavioral] full acceptance disables diaper-use stress", () => {
		const { window, State } = loadNeeds({ variables: { acceptance_diaper: 1000, uncomfortable: { diaperUse: true, diaperSeen: true } } });
		assert.equal(window.plusDiaperAccepted(), true);
		assert.equal(window.plusDiaperStressApplies("use"), false);
		assert.equal(window.plusDiaperStressApplies("seen"), false);
	});
});

describe("QA plus-needs static integration boundaries", () => {
	const read = rel => readFileSync(join(root, rel), "utf8");

	it("QA-S001 [static] Start2 and modUpdate initialize $danny control and dependency", () => {
		const start2 = read("game/04-Variables/variables-start2.twee");
		const mod = read("game/04-Variables/variables-modUpdate.twee");
		assert.match(start2, /\$danny to \{ control: 0, dependency: 0 \}/);
		assert.match(mod, /\$danny\.control/);
		assert.match(mod, /\$danny\.dependency/);
	});

	it("QA-S002 [static] Danny door uses the schedule helper instead of raw $time writes", () => {
		const danny = read("game/ModLI/Danny/danny.twee");
		assert.match(danny, /getDannyLocation\(\)/);
		assert.doesNotMatch(danny, /<<set \$time to 420>>/);
	});

	it("QA-S003 [static] Canteen links the existing Danny intro and home exposes dannyroom_link", () => {
		assert.match(read("game/overworld-town/loc-school/canteen.twee"), /Meet Danny\|Danny First Meeting Canteen/);
		assert.match(read("game/overworld-town/loc-home/main.twee"), /dannyroom_link/);
		assert.match(read("game/ModLI/Danny/danny.twee"), /:: Danny First Meeting Canteen/);
	});

	it("QA-S004 [static] Danny intro continue returns to Canteen", () => {
		assert.match(read("game/ModLI/Danny/danny.twee"), /\[\[Continue\|Canteen\]\]/);
	});

	it("QA-S005 [static] class-ask widgets sit on all five lesson files", () => {
		for (const [file, n] of [
			["game/overworld-town/loc-school/classes/english.twee", 2],
			["game/overworld-town/loc-school/classes/maths.twee", 1],
			["game/overworld-town/loc-school/classes/science.twee", 1],
			["game/overworld-town/loc-school/classes/history.twee", 1],
			["game/overworld-town/loc-school/classes/swimming.twee", 1],
		]) {
			const t = read(file);
			assert.equal((t.match(/<<plusClassAskLinks>>/g) || []).length, n, file);
		}
	});

	it("QA-S006 [static] official srcfn calls plusSagSrc and plusSagHook does not wrap layers", () => {
		const canvas = read("game/04-Variables/canvasmodel-main.js");
		const needs = read("game/ModLI/plus-needs/needs.js");
		assert.match(canvas, /plusSagSrc\(src, wornItem\)/);
		assert.doesNotMatch(needs, /plusSagHooked/);
		assert.match(needs, /Do not wrap Renderer\.CanvasModels/);
	});

	it("QA-S007 [static] password gate exists only as the compile-flow head copy", () => {
		const head = read("devTools/head.html");
		assert.equal((head.match(/dol-password-gate/g) || []).length, 3);
		assert.doesNotMatch(read("compile.sh"), /plusneeds.*password|password.*index\.html/);
	});

	it("QA-S008 [static] time, prop, and catalog hooks are present exactly once", () => {
		const time = read("game/03-JavaScript/time.js");
		const props = read("game/base-clothing/clothing-props.js");
		const under = read("game/base-clothing/clothing-under-lower.js");
		assert.equal((time.match(/plusNeedsTick\(/g) || []).length, 1);
		assert.equal((props.match(/plusNeedsProp\(/g) || []).length, 1);
		assert.match(under, /plusDiaperItems\(\)/);
	});

	it("QA-S009 [static] Danny is registered on native npcincr whitelist and relationshipclamp", () => {
		const incr = read("game/base-system/named-npcs.twee");
		const clamp = read("game/base-system/widgets.twee");
		assert.match(incr, /_validNNPCNames to \[.*"Danny".*\]/s);
		assert.match(clamp, /indexOf\("Danny"\)/);
		assert.match(clamp, /\$NPCName\[_i\]\.love = Math\.clamp\(\$NPCName\[_i\]\.love, 0, 100\)/);
	});

	it("QA-S010 [static] Danny save migration and new-game adult flags", () => {
		const named = read("game/04-Variables/npcNamed.twee");
		assert.match(named, /"danny": \{nam : "Danny", title: "dependent", insecurity: "weak", adult: 1, teen: 0\}/);
		const swi = named.match(/<<set _swi to \[(.*?)\]>>/s);
		assert.ok(swi);
		const last = swi[1]
			.split(",")
			.map(s => s.trim().replace(/"/g, ""))
			.filter(Boolean)
			.at(-1);
		assert.equal(last, "a");
	});

	it("QA-S011 [static] Danny portrait uses blank fallback and does not invent or reuse another NNPC folder", () => {
		const canvas = read("game/04-Variables/canvasmodel-main.js");
		assert.match(canvas, /dannyPortraitFallback = \(\) => "img\/ui\/nnpc\/blank\.png"/);
		assert.equal((canvas.match(/if \(active === "danny"\) return dannyPortraitFallback\(\);/g) || []).length, 3);
		assert.doesNotMatch(canvas, /img\/ui\/nnpc\/danny/);
		assert.ok(existsSync(join(root, "img/ui/nnpc/blank.png")));
		assert.equal(existsSync(join(root, "img/ui/nnpc/danny")), false);
	});

	it("QA-S012 [static] Danny social continence and acceptance are wired without stripping room interactions", () => {
		const danny = read("game/ModLI/Danny/danny.twee");
		const social = read("game/base-system/overlays/social.twee");
		const widgets = read("game/base-system/widgets.twee");
		assert.match(danny, /<<widget "dannyInit">>/);
		assert.match(danny, /<<link \[\[Talk\|Danny Room\]\]>>/);
		assert.match(danny, /<<link \[\[Help with control training\|Danny Room\]\]>>/);
		assert.match(danny, /<<link \[\[Offer dependency care\|Danny Room\]\]>>/);
		assert.match(danny, /<<npc "Danny">>/);
		assert.match(social, /<<dannyInit>>/);
		assert.match(social, /"Danny"\s*:\s*\{/);
		assert.match(social, /maxValue : 6000/);
		assert.match(social, /maxValue : 1000/);
		assert.match(social, /T\.importantNpcOrder = \[[^\]]*\"Danny\"\]/);
		assert.match(widgets, /"continence", "acceptance", "harmony", "ferocity"/);
		assert.match(widgets, /Math\.clamp\(\$NPCName\[_i\]\.continence, 0, 6000\)/);
		assert.ok(existsSync(join(root, "img/ui/sym-continence.png")));
		assert.ok(existsSync(join(root, "img/ui/sym-acceptance.png")));
	});

	it("QA-S013 [static] Danny schedule drives the door without an init gate or broken Canteen link", () => {
		const danny = read("game/ModLI/Danny/danny.twee");
		const schedule = read("game/ModLI/Danny/schedule.js");
		assert.match(schedule, /function getDannyLocation/);
		assert.match(schedule, /window\.getDannyLocation = getDannyLocation/);
		assert.doesNotMatch(schedule, /C\.npc\.Danny\.init/);
		assert.doesNotMatch(schedule, /if \(!C\.npc\.Danny/);
		assert.match(danny, /<<set _loc to getDannyLocation\(\)>>/);
		assert.match(danny, /At Niki's photography/);
		assert.match(danny, /Danny's room \(locked\)/);
		assert.match(danny, /<<npc "Danny">>/);
		assert.match(danny, /<<link \[\[Talk\|Danny Room\]\]>>/);
		assert.match(danny, /<<link \[\[Continue\|Canteen\]\]>>/);
		assert.doesNotMatch(danny, /School Canteen/);
	});

	it("QA-S016 [static] Danny presence hooks sit on the timetable locations", () => {
		const danny = read("game/ModLI/Danny/danny.twee");
		assert.match(danny, /<<widget "dannyPresence">>/);
		assert.match(read("game/overworld-town/loc-school/canteen.twee"), /<<dannyPresence "canteen">>/);
		assert.match(read("game/overworld-town/loc-school/canteen.twee"), /getDannyLocation\(\) is "canteen"/);
		assert.match(read("game/overworld-town/loc-school/hallways.twee"), /<<dannyPresence "school">>/);
		assert.match(read("game/overworld-town/loc-school/main.twee"), /<<dannyPresence "courtyard">>/);
		assert.match(read("game/overworld-town/loc-photography/main.twee"), /<<dannyPresence "work">>/);
	});
});
