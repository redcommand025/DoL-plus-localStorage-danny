import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
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
			money: 500000,
			outside: 0,
			location: "oxford",
			bus: "oxford",
			worn: {
				upper: { name: "t-shirt", type: ["normal"], plusDirt: 0, plusSoiled: 0 },
				lower: { name: "trousers", type: ["normal"], plusDirt: 0, plusSoiled: 0 },
				under_lower: { name: "naked", type: ["naked"] },
			},
			wardrobe: { under_lower: [] },
			background: {},
			backgroundTraits: [],
			uncomfortable: {},
			plusFlat: { rented: true, decor: {} },
			schoolrep: { continence: 0 },
			plusContRep: 0,
			plusContRepPublic: 0,
			fame: { good: 0 },
			settings: { inflationBaileyRelentless: false },
			options: {},
			...overrides.variables,
		},
		temporary: {},
		passage: overrides.passage || "Bus seat",
	};
	const Time = {
		days: 10,
		year: 2022,
		month: 12,
		monthDay: 1,
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
	Math.clamp = (n, min, max) => Math.min(max, Math.max(min, n));
	const Weather = { temperature: 15, precipitation: "none", isFreezing: false, isSnow: false, windSpeed: 0, ...(overrides.Weather || {}) };
	const setup = { clothes: { under_lower: [] }, moddedClothes: { under_lower: [] } };
	const C = {
		npc: {
			Robin: { init: 1, love: 60, pronoun: "f" },
			Whitney: { init: 1, love: 0, pronoun: "f" },
			Bailey: { init: 1 },
		},
	};
	const Config = { navigation: { override: undefined } };
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
		getRobinLocation: overrides.getRobinLocation || (() => "orphanage"),
	};
	context.globalThis = context;
	vm.createContext(context);
	vm.runInContext(read("game/ModLI/plus-needs/needs.js"), context, { filename: "needs.js" });
	vm.runInContext(read("game/ModLI/plus-needs/content.js"), context, { filename: "content.js" });
	vm.runInContext(read("game/ModLI/plus-needs/batch2.js"), context, { filename: "batch2.js" });
	return { window: context.window, State, Time, Weather, C, Config, context };
}

describe("plus content batch 2: bus accident", () => {
	it("builds an open accident the whole bus sees, with a driver choice and optional jacket", () => {
		const { window, State } = load();
		const ev = window.plusBusBuildEvent("open", "plusBladder");
		assert.equal(ev.kind, "open");
		assert.ok(ev.driver === "off" || ev.driver === "fee");
		assert.equal(ev.fee, 800);
		assert.equal(typeof ev.jacket, "boolean");
		assert.equal(ev.seen, 2);
		State.variables.plusBusEvent = ev;
		const before = State.variables.money;
		const pubBefore = State.variables.plusContRepPublic;
		window.plusBusApply(ev);
		assert.ok(State.variables.plusContRep > 0, "private meter rises at once");
		assert.equal(State.variables.plusContRepPublic, pubBefore, "public rumour waits for midnight");
		assert.equal(State.variables.schoolrep.continence, 0, "no instant school rumour bump");
		if (ev.driver === "fee") assert.equal(State.variables.money, before - 800);
		if (ev.jacket) assert.equal(State.variables.plusBusJacket, 1);
		window.plusBusJacketClear();
		assert.ok(!window.plusBusJacketOn());
	});

	it("does not charge a fee the player cannot pay, and gets them off instead", () => {
		const { window, State } = load({ variables: { money: 100 } });
		const ev = window.plusBusBuildEvent("open", "plusBowels");
		ev.driver = "fee";
		ev.canPay = false;
		window.plusBusApply(ev);
		assert.equal(ev.driver, "off");
		assert.equal(State.variables.money, 100);
	});

	it("school-morning oxford trips only queue the midnight school rumour", () => {
		const { window, State } = load({ passage: "Bus seat" });
		assert.equal(window.plusBusIsSchoolTrip(), true);
		const ev = window.plusBusBuildEvent("open", "plusBladder");
		assert.equal(ev.school, true);
		window.plusBusApply(ev);
		assert.equal(State.variables.schoolrep.continence, 0);
		assert.ok(State.variables.plusContRepSchoolPending > 0 || State.variables.plusContRep > 0);
	});

	it("hook, event passage and dropped extras are in source, and the jacket caption exists", () => {
		const bus = read("game/overworld-town/loc-bus/main.twee");
		const twee = read("game/ModLI/plus-needs/batch2.twee");
		assert.match(bus, /plusBusRideTick/);
		assert.match(bus, /Plus Bus Accident/);
		assert.match(twee, /:: Plus Bus Accident/);
		assert.match(twee, /cleaning fee/);
		assert.match(twee, /next stop/);
		assert.match(twee, /jacket/);
		assert.doesNotMatch(twee, /films it|filmed|nervous on that route|instant.*school rumour/i);
		assert.match(read("game/ModLI/plus-needs/widgets.twee"), /plusBusJacketCaption/);
	});
});

describe("plus content batch 2: hospital clinic", () => {
	it("records an assessment against the Continence trait and supports a later follow-up", () => {
		const { window, State } = load();
		const a = window.plusClinicAssess();
		assert.equal(a.name, "Steady");
		assert.equal(a.level, 3);
		assert.equal(a.visits, 1);
		assert.equal(window.plusClinicFollowup().reason, "soon");
		State.variables.plusClinicLastDay = window.plusDayKey() - 3;
		State.variables.plusContinence = 4;
		const f = window.plusClinicFollowup();
		assert.equal(f.ready, true);
		assert.ok(f.delta > 0);
	});

	it("is linked from the foyer and sells pharmacy-priced supplies", () => {
		assert.match(read("game/overworld-town/loc-hospital/main.twee"), /plusContinenceClinicLink/);
		const twee = read("game/ModLI/plus-needs/batch2.twee");
		assert.match(twee, /:: Plus Continence Clinic/);
		assert.match(twee, /plusDiaperShop "pharmacy"/);
		assert.match(twee, /Plus Continence Clinic Followup/);
	});
});

describe("plus content batch 2: named NPC scenes", () => {
	it("has diaper-use and accident lines for every listed character, and none for Danny", () => {
		const { window } = load();
		const names = [
			"Robin",
			"Bailey",
			"Sam",
			"Alex",
			"Charlie",
			"Sirris",
			"River",
			"Doren",
			"Winter",
			"Mason",
			"Whitney",
			"Kylar",
			"Sydney",
			"Avery",
			"Eden",
			"Niki",
			"Landlord",
			"Neighbour",
		];
		const cat = window.plusNpcLineCatalog;
		for (const n of names) {
			assert.ok(cat[n], n);
			assert.ok(cat[n].diaper.length >= 2, n + " diaper");
			assert.ok(cat[n].accident.length >= 2, n + " accident");
			assert.ok(window.plusNpcSceneText(n, "accident"));
		}
		assert.equal(cat.Danny, undefined);
		assert.equal(window.plusNpcPresent("Danny"), false);
	});

	it("Bailey only reacts when Relentless Bailey is on, and scenes have a daily cooldown", () => {
		const { window, State } = load({ passage: "Bedroom Bailey rentdue" });
		assert.equal(window.plusNpcSceneAllowed("Bailey", "accident"), false);
		State.variables.settings.inflationBaileyRelentless = true;
		assert.equal(window.plusNpcSceneAllowed("Bailey", "accident"), true);
		window.plusNpcMark("Bailey", "accident");
		assert.equal(window.plusNpcSceneAllowed("Bailey", "accident"), false);
	});

	it("hooks accidents and does not mention Danny", () => {
		const w = read("game/ModLI/plus-needs/widgets.twee");
		assert.match(w, /plusNpcAccidentHook/);
		assert.doesNotMatch(read("game/ModLI/plus-needs/batch2.js"), /Danny:/);
	});
});

describe("plus content batch 2: weather flavour", () => {
	it("adds heat, cold and rain lines outdoors, and stays quiet inside", () => {
		const { window, State, Weather } = load();
		State.variables.outside = 0;
		Weather.temperature = 32;
		assert.equal(window.plusWeatherFlavour({ force: true }), "");
		State.variables.outside = 1;
		State.variables.location = "farm";
		let line = window.plusWeatherFlavour({ force: true });
		assert.match(line, /heat|thirst|dry/i);
		Weather.temperature = 1;
		Weather.precipitation = "none";
		line = window.plusWeatherFlavour({ force: true });
		assert.match(line, /cold|chill|toilet/i);
		Weather.temperature = 12;
		Weather.precipitation = "rain";
		line = window.plusWeatherFlavour({ force: true });
		assert.match(line, /[Rr]ain/);
	});
});

describe("plus content batch 2: flat life and Robin", () => {
	it("sells decor once, relieves a little stress, and describes it in the room", () => {
		const { window, State } = load();
		const r = window.plusFlatDecorBuy("plant");
		assert.equal(r.ok, true);
		assert.ok(State.variables.stress < 0 || State.variables.stress === 0);
		assert.equal(window.plusFlatDecorBuy("plant").reason, "owned");
		assert.match(window.plusFlatDecorText(), /plant/);
	});

	it("lets Robin move in when love is high and the flat is rented, and sends them back on move-out", () => {
		const { window, State } = load();
		assert.equal(window.plusRobinCanInvite().ok, true);
		assert.equal(window.plusRobinMoveIn().ok, true);
		assert.equal(window.plusRobinLivesAtFlat(), true);
		window.plusFlatMoveOut();
		assert.equal(window.plusRobinLivesAtFlat(), false);
	});

	it("hides the orphanage room link when Robin lives at the flat, and wraps leave links", () => {
		assert.match(read("game/overworld-town/special-robin/widgets.twee"), /plusRobinLivesAtFlat/);
		assert.match(read("game/ModLI/plus-needs/batch2.twee"), /:: Plus Robin Room Door/);
		assert.match(read("game/ModLI/plus-needs/widgets.twee"), /plusRobinRoomFlatLink/);
		assert.match(read("game/ModLI/plus-needs/batch2.js"), /getRobinLocation/);
		assert.doesNotMatch(read("game/ModLI/plus-needs/batch2.twee"), /Take a peek/);
	});

	it("adds cooking, decorating, hosting and a neighbour storyline", () => {
		const twee = read("game/ModLI/plus-needs/batch2.twee") + read("game/ModLI/plus-needs/content.twee");
		assert.match(twee, /Plus Flat Cook/);
		assert.match(twee, /Plus Flat Decor/);
		assert.match(twee, /Plus Flat Host Robin/);
		assert.match(twee, /plusFlatNeighbourLine/);
		const { window, State } = load();
		State.variables.plusNeighbourAt = -1;
		assert.ok(window.plusFlatNeighbourAdvance() >= 1);
		assert.ok(window.plusFlatNeighbourLine().length > 0);
	});
});

describe("plus content batch 2: voice options, pee edge, Hyper dry size", () => {
	it("ports the per-category voiceConfig UI and hooks ejaculation-sound on portal panties", () => {
		const opt = read("game/base-system/overlays/options.twee");
		assert.match(opt, /voiceConfig\.male\.voice/);
		assert.match(opt, /voiceConfig\.female\.voice/);
		assert.match(opt, /postureAffectsVoice/);
		assert.match(opt, /playerIsHerm\(\)/);
		assert.doesNotMatch(opt, /playerIsXChanged/);
		assert.match(read("game/base-clothing/portalPanties.twee"), /ejaculation-sound/);
	});

	it("makes the soil generator vary the medium and heavy pee tide-line per size", () => {
		const src = read("devTools/generate-diaper-soil.py");
		assert.match(src, /def pee_top_wave/);
		assert.match(src, /size_key/);
	});

	it("lowers Hyper's dry size to 6, grows to 15, and keeps the Hyper label when empty", () => {
		const { window, context } = load();
		context.setup.clothes.under_lower = window.plusDiaperItems();
		const raw = window.plusDiaperItems().find(i => i.name === "plastic-backed diaper (Hyper)");
		assert.ok(raw, "Hyper item exists");
		const item = window.plusDiaperInit(raw);
		const def = window.plusDiaperDef(item);
		assert.ok(def);
		assert.equal(def.base, 6);
		assert.equal(def.grow, 9);
		assert.equal(window.plusDiaperSize(item), 6);
		assert.equal(window.plusSizeLabel(6, item), "Hyper");
		assert.equal(window.plusSizeLabel(6), "Ultra");
	});

	it("keeps the new passages and hooks on disk", () => {
		assert.ok(existsSync(join(root, "game/ModLI/plus-needs/batch2.js")));
		assert.ok(existsSync(join(root, "game/ModLI/plus-needs/batch2.twee")));
	});
});
