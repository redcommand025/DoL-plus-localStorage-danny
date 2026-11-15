import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = rel => readFileSync(join(root, rel), "utf8");

function load() {
	const window = { plusNeedsPassTotal: 0, console };
	const $ = () => ({ on() {} });
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
			outside: 0,
			worn: {
				upper: { name: "t-shirt", type: ["normal"], plusDirt: 0, plusSoiled: 0 },
				lower: { name: "trousers", type: ["normal"], plusDirt: 0, plusSoiled: 0 },
				under_lower: { name: "naked", type: ["naked"] },
			},
			wardrobe: { under_lower: [] },
			background: {},
			backgroundTraits: [],
			uncomfortable: {},
			plusFlat: { rented: true },
		},
		temporary: {},
		passage: "Start",
	};
	const Time = { days: 10, year: 2022, month: 12, monthDay: 1, dayState: "day", date: { timeStamp: 1_000_000 } };
	class ClothesItem {
		constructor(o) {
			Object.assign(this, o);
		}
	}
	Math.clamp = (n, min, max) => Math.min(max, Math.max(min, n));
	const Weather = { temperature: 15, precipitation: "none", isFreezing: false, isSnow: false };
	const setup = { clothes: { under_lower: [] }, moddedClothes: { under_lower: [] } };
	const context = { window, document: {}, State, Time, Weather, setup, ClothesItem, Math, console, $, jQuery: $ };
	context.globalThis = context;
	vm.createContext(context);
	vm.runInContext(read("game/ModLI/plus-needs/needs.js"), context, { filename: "needs.js" });
	vm.runInContext(read("game/ModLI/plus-needs/content.js"), context, { filename: "content.js" });
	return { window: context.window, State, Time, Weather, setup };
}

describe("plus content batch 1: weather", () => {
	it("documents and applies modest outdoor multipliers, and ignores indoor or long passes", () => {
		const { window, State, Weather } = load();
		const docs = window.plusNeedsWeatherDocs;
		assert.equal(docs.thirst.warm, 1.15);
		assert.equal(docs.thirst.hot, 1.25);
		assert.equal(docs.thirst.veryHot, 1.3);
		assert.equal(docs.bladder.chilly, 1.1);
		assert.equal(docs.bladder.freezing, 1.15);
		assert.equal(docs.bladder.rainAdd, 0.1);
		assert.equal(docs.bladder.cap, 1.25);
		assert.equal(docs.rainDirtPerHour, 36);

		State.variables.outside = 0;
		Weather.temperature = 32;
		let info = window.plusNeedsWeatherInfo();
		assert.equal(info.thirstMul, 1);
		assert.equal(info.exposed, false);

		State.variables.outside = 1;
		info = window.plusNeedsWeatherInfo();
		assert.equal(info.thirstMul, 1.3);
		assert.ok(info.notes.includes("veryHot"));

		Weather.temperature = 26;
		assert.equal(window.plusNeedsWeatherInfo().thirstMul, 1.25);
		Weather.temperature = 23;
		assert.equal(window.plusNeedsWeatherInfo().thirstMul, 1.15);
		Weather.temperature = 4;
		assert.equal(window.plusNeedsWeatherInfo().bladderMul, 1.1);
		Weather.temperature = -2;
		Weather.isFreezing = true;
		assert.equal(window.plusNeedsWeatherInfo().bladderMul, 1.15);

		Weather.temperature = 4;
		Weather.isFreezing = false;
		Weather.precipitation = "rain";
		info = window.plusNeedsWeatherInfo();
		assert.equal(info.bladderMul, 1.2);
		assert.equal(info.dirtPerHour, 36);

		Weather.temperature = -2;
		Weather.isFreezing = true;
		info = window.plusNeedsWeatherInfo();
		assert.equal(info.bladderMul, 1.25);

		const loss = { plusThirst: 100, plusBladder: 100 };
		window.plusNeedsWeatherApply(loss, 60, true);
		assert.equal(loss.plusThirst, 100);

		Weather.temperature = 30;
		Weather.precipitation = "none";
		Weather.isFreezing = false;
		const loss2 = { plusThirst: 100, plusBladder: 100 };
		window.plusNeedsWeatherApply(loss2, 60, false);
		assert.equal(loss2.plusThirst, 130);
	});

	it("adds modest dirt to outer clothes in rain and ticks thirst faster outdoors in heat", () => {
		const { window, State, Weather } = load();
		window.plusNeedsInit();
		State.variables.outside = 1;
		Weather.temperature = 15;
		Weather.precipitation = "rain";
		const beforeDirt = State.variables.worn.upper.plusDirt;
		window.plusNeedsTick(60);
		assert.ok(State.variables.worn.upper.plusDirt > beforeDirt);
		assert.ok(State.variables.worn.upper.plusDirt - beforeDirt >= 30);

		State.variables.plusThirst = 2000;
		State.variables.plusHunger = 2000;
		State.variables.plusBladder = 2000;
		State.variables.plusBowels = 2000;
		Weather.precipitation = "none";
		Weather.temperature = 15;
		const mild = [];
		for (let i = 0; i < 8; i++) {
			State.variables.plusThirst = 2000;
			window.plusNeedsTick(60);
			mild.push(2000 - State.variables.plusThirst);
		}
		const avgMild = mild.reduce((a, b) => a + b, 0) / mild.length;
		const hot = [];
		Weather.temperature = 31;
		for (let i = 0; i < 8; i++) {
			State.variables.plusThirst = 2000;
			window.plusNeedsTick(60);
			hot.push(2000 - State.variables.plusThirst);
		}
		const avgHot = hot.reduce((a, b) => a + b, 0) / hot.length;
		assert.ok(avgHot > avgMild * 1.1, `hot ${avgHot} should exceed mild ${avgMild}`);
	});
});

describe("plus content batch 1: cafe, pub, and skips", () => {
	it("keeps cafe and pub menu items on the wearProp consume table and skips coffee refills on flash/finish", () => {
		const { window, State } = load();
		window.plusNeedsInit();
		// Listed hunger/thirst are raw PROP values; drinks are then scaled by 0.6, snacks (hunger < 500) * 2.
		const menu = {
			coffee: [0, 500],
			"pancake fork": [900, 0],
			"fruity ale": [0, 500],
			"winter ale": [0, 500],
			shandy: [0, 500],
			"autumn ale": [0, 500],
			"salad fork": [500, 0],
			gingerbread: [300, 0],
			"cream buns": [400, 0],
			fork: [600, 0],
			milkshake: [200, 700],
			"beer mug": [0, 500],
		};
		for (const [key, expected] of Object.entries(menu)) {
			State.variables.plusHunger = 200;
			State.variables.plusThirst = 200;
			State.temporary.plusNeedsPropsSeen = {};
			window.plusNeedsProp(key);
			if (expected[0] > 0) assert.ok(State.variables.plusHunger > 200, key + " hunger");
			if (expected[1] > 0) assert.ok(State.variables.plusThirst > 200, key + " thirst");
		}
		assert.ok(window.plusNeedsML.coffee >= 250);
		assert.ok(window.plusNeedsML["beer mug"] >= 500);
		assert.ok(window.plusDiureticInfo.coffee[0] >= 2);
		assert.ok(window.plusDiureticInfo["beer mug"][0] >= 1.8);

		State.passage = "Cafe Coffee Flash";
		State.variables.plusThirst = 200;
		State.temporary.plusNeedsPropsSeen = {};
		window.plusNeedsProp("coffee");
		assert.equal(State.variables.plusThirst, 200);
		State.passage = "Cafe Coffee Finish";
		window.plusNeedsProp("coffee");
		assert.equal(State.variables.plusThirst, 200);
		State.passage = "Cafe Coffee";
		window.plusNeedsProp("coffee");
		assert.ok(State.variables.plusThirst > 200);
	});

	it("hooks pancakes to a coffee prop and does not add a second plusNeedsConsume on cafe meal passages", () => {
		const cafe = read("game/overworld-town/loc-cafe/main.twee");
		assert.match(cafe, /wearProp "pancake fork">>.*wearProp "coffee"/s);
		assert.match(cafe, /<<wearProp "coffee">>/);
		assert.match(cafe, /<<wearProp "fruity ale">>/);
		assert.match(cafe, /<<wearProp "winter ale">>/);
		assert.match(cafe, /<<wearProp "shandy">>/);
		assert.match(cafe, /<<wearProp "autumn ale">>/);
		assert.match(cafe, /<<wearProp "salad fork">>/);
		assert.match(cafe, /<<wearProp "gingerbread">>/);
		assert.match(cafe, /<<wearProp "cream buns">>/);
		const pub = read("game/overworld-town/loc-pub/main.twee");
		assert.match(pub, /<<wearProp "beer mug">>/);
		assert.match(pub, /plusToiletLink/);
	});
});

describe("plus content batch 1: work, infirmary, flat, custody, outdoor", () => {
	it("resolves job restroom breaks with job-specific chances", () => {
		const { window, State } = load();
		window.plusNeedsInit();
		assert.ok(window.plusWorkBreakJobs.office);
		assert.ok(window.plusWorkBreakJobs.farm.strict < window.plusWorkBreakJobs.office.strict);
		State.variables.plusBladder = 2000;
		const calm = window.plusWorkBreakChance("office");
		State.variables.plusBladder = 0;
		const desperate = window.plusWorkBreakChance("office");
		assert.ok(desperate > calm);
		const forced = window.plusWorkBreakResolve("farm", true);
		assert.equal(forced.accepted, true);
		assert.equal(forced.speaker, "Alex");
		const refused = window.plusWorkBreakResolve("docks", false);
		assert.equal(refused.accepted, false);
	});

	it("remembers accidents and can issue one infirmary spare a day", () => {
		const { window, State, setup } = load();
		window.plusNeedsInit();
		setup.clothes.under_lower = window.plusDiaperItems();
		assert.equal(window.plusInfirmaryReason(), "");
		window.plusAccidentRemember("plusBladder");
		assert.equal(window.plusInfirmaryReason(), "accident");
		assert.equal(window.plusInfirmaryCanSpare(), true);
		assert.equal(window.plusInfirmaryGiveSpare(), true);
		assert.equal(State.variables.wardrobe.under_lower.length, 1);
		assert.equal(State.variables.wardrobe.under_lower[0].name, "pull-up (Medium)");
		assert.equal(window.plusInfirmaryGiveSpare(), false);
		assert.equal(window.plusCustodyCanSpare(), true);
		assert.equal(window.plusCustodyGiveSpare(), true);
		assert.equal(window.plusCustodyGiveSpare(), false);
	});

	it("washes worn clothes at home and supplies evening and hallway beats", () => {
		const { window, State, Time } = load();
		State.variables.worn.upper.plusDirt = 800;
		State.variables.worn.lower.plusSoiled = 3;
		assert.equal(window.plusHomeWash(), true);
		assert.equal(State.variables.worn.upper.plusDirt, 0);
		assert.equal(State.variables.worn.lower.plusSoiled, 0);
		Time.dayState = "night";
		const beat = window.plusFlatEveningBeat(true);
		assert.ok(String(beat).length > 20);
		const hall = window.plusFlatHallwayBeat();
		assert.ok(["landlord", "neighbour", "quiet", "package"].includes(hall));
	});

	it("gives rural outdoor spots distinct flavour and lower-than-town chances", () => {
		const { window } = load();
		for (const spot of ["farm", "moor", "estate", "coast"]) {
			const where = window.plusOutdoorWhere(spot);
			assert.ok(where.length > 8, spot);
			const p = window.plusNeedsSpotChance(spot);
			assert.ok(p < 0.3, `${spot} ${p}`);
		}
		assert.ok(window.plusNeedsSpotChance("estate") > window.plusNeedsSpotChance("moor"));
	});
});

describe("plus content batch 1: source hooks", () => {
	it("wires toilets, outdoor spots, job breaks, infirmary and flat home links", () => {
		const expect = [
			["game/overworld-town/loc-pub/main.twee", "plusToiletLink"],
			["game/overworld-town/loc-museum/main.twee", "plusToiletLink"],
			["game/overworld-town/loc-spa/main.twee", "plusToiletLink"],
			["game/overworld-town/loc-office/main.twee", "plusToiletLink"],
			["game/overworld-town/loc-office/agency.twee", 'plusWorkBreakLink "office"'],
			["game/overworld-town/loc-temple/main.twee", "plusToiletLink"],
			["game/overworld-town/loc-temple/quarters.twee", "plusToiletLink"],
			["game/overworld-town/loc-town-hall/main.twee", "plusToiletLink"],
			["game/overworld-town/loc-mma-gym/main.twee", "plusToiletLink"],
			["game/overworld-town/loc-bus-station/main.twee", "plusToiletLink"],
			["game/overworld-town/loc-docks/main.twee", 'plusWorkBreakLink "docks"'],
			["game/overworld-town/loc-docks/widgets.twee", "plusToiletLink"],
			["game/overworld-town/loc-dance-studio/main.twee", "plusToiletLink"],
			["game/overworld-town/loc-dance-studio/job.twee", 'plusWorkBreakLink "dance"'],
			["game/overworld-town/loc-cafe/main.twee", 'plusWorkBreakLink "cafe"'],
			["game/overworld-plains/loc-farm/main.twee", "plusToiletLink"],
			["game/overworld-plains/loc-farm/main.twee", 'plusOutdoorToiletLink "farm"'],
			["game/overworld-plains/loc-farm/work.twee", 'plusWorkBreakLink "farm"'],
			["game/overworld-plains/loc-farm/fields.twee", 'plusOutdoorToiletLink "farm"'],
			["game/overworld-plains/loc-farm/cottage.twee", "plusToiletLink"],
			["game/overworld-forest/loc-cabin/widgets.twee", "plusToiletLink"],
			["game/overworld-forest/loc-cabin/widgets.twee", 'plusOutdoorToiletLink "forest"'],
			["game/overworld-plains/loc-moor/main.twee", 'plusOutdoorToiletLink "moor"'],
			["game/overworld-plains/loc-estate/main.twee", 'plusOutdoorToiletLink "estate"'],
			["game/overworld-plains/loc-coast/coast.twee", 'plusOutdoorToiletLink "coast"'],
			["game/overworld-town/loc-prison/main.twee", "plusToiletLink"],
			["game/overworld-town/loc-prison/main.twee", "plusCustodyWashLink"],
			["game/overworld-forest/loc-asylum/main.twee", "plusToiletLink"],
			["game/overworld-forest/loc-asylum/main.twee", "plusCustodyWashLink"],
			["game/overworld-town/loc-school/widgets.twee", "plusInfirmaryNurseLink"],
			["game/ModLI/plus-needs/widgets.twee", "Plus Flat Kitchen"],
			["game/ModLI/plus-needs/widgets.twee", "Plus Flat Laundry"],
			["game/ModLI/plus-needs/widgets.twee", "Plus Flat Desk"],
			["game/ModLI/plus-needs/widgets.twee", "Plus Flat Hallway"],
			["game/ModLI/plus-needs/content.twee", "Plus Infirmary Nurse"],
			["game/ModLI/plus-needs/content.twee", "Plus Needs Work Break"],
			["game/ModLI/plus-needs/needs.js", "plusNeedsWeatherApply"],
		];
		for (const [file, token] of expect) {
			assert.match(read(file), new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `${file} missing ${token}`);
		}
		// Changing room still has its own toilet, and the studio floor now does too.
		assert.ok([...read("game/overworld-town/loc-dance-studio/main.twee").matchAll(/plusToiletLink/g)].length >= 2);
		assert.doesNotMatch(read("game/ModLI/plus-needs/content.js"), /plusContRepRemarkCheck|CONTREP_PLACE|classmate whisper/);
	});

	it("content.twee has no unclosed-if typo and the hallway ifs are balanced", () => {
		const twee = read("game/ModLI/plus-needs/content.twee");
		assert.equal(twee.includes("<<</if>>"), false);
		const hallway = twee.split(":: Plus Flat Hallway")[1].split("\n:: ")[0];
		const opens = (hallway.match(/<<if\b/g) || []).length;
		const closes = (hallway.match(/<<\/if>>/g) || []).length;
		assert.equal(opens, closes, `hallway if ${opens} vs /if ${closes}`);
	});
});
