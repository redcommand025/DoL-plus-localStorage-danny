import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = rel => readFileSync(join(root, rel), "utf8");

function load(opts = {}) {
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
			location: opts.location || "town",
			fame: { good: 0 },
			schoolrep: { crossdress: 0, herm: 0, continence: 0 },
			settings: {},
			combat: 0,
			intro: 0,
			masturbating: 0,
			plusContRep: 600,
			plusContRepPublic: 600,
			worn: { face: { type: [] } },
			schoolstate: opts.schoolstate || "day",
		},
		temporary: {},
		passage: opts.passage || "Oxford Street",
	};
	const Time = { days: 10, year: 2022, month: 12, monthDay: 1, dayState: "day", date: { timeStamp: 1_000_000 } };
	Math.clamp = (n, min, max) => Math.min(max, Math.max(min, n));
	const context = { window, document: {}, State, Time, Math, console, $, jQuery: $ };
	context.globalThis = context;
	vm.createContext(context);
	vm.runInContext(read("game/ModLI/plus-needs/needs.js"), context, { filename: "needs.js" });
	return { window: context.window, State, Time };
}

describe("town and school rumour comments", () => {
	it("uses substantially lower per-passage chances and a three-hour cooldown", () => {
		const { window } = load();
		const info = window.plusContRepRemarkInfo;
		assert.equal(JSON.stringify([...info.chance]), JSON.stringify([0, 0, 0, 0.02, 0.04, 0.06, 0.1]));
		assert.equal(info.cooldown, 3 * 60 * 60);
		assert.equal(JSON.stringify([...info.schoolChance]), JSON.stringify([0, 0.02, 0.03, 0.05, 0.08, 0.12]));
		assert.equal(info.schoolCooldown, 3 * 60 * 60);
		assert.equal(info.chance[3], 0.02);
		assert.equal(info.chance[6], 0.1);
	});

	it("allows remarks only in busy public or social places, and not at school", () => {
		const { window, State } = load();
		window.plusContRepInit();
		const allowed = (location, passage, extra = {}) => {
			State.variables.location = location;
			State.passage = passage;
			Object.assign(State.variables, extra);
			return window.plusContRepRemarkAllowed(passage);
		};
		assert.equal(allowed("town", "Oxford Street"), true);
		assert.equal(allowed("park", "Park"), true);
		assert.equal(allowed("beach", "Beach"), true);
		assert.equal(allowed("pub", "Pub"), true);
		assert.equal(allowed("cafe", "Cafe"), true);
		assert.equal(allowed("market", "Market"), true);
		assert.equal(allowed("arcade", "Arcade"), true);
		assert.equal(allowed("museum", "Museum"), true);
		assert.equal(allowed("shopping_centre", "Shopping Centre"), true);
		assert.equal(allowed("alley", "Alley"), true);
		assert.equal(allowed("docks", "Docks"), true);

		assert.equal(allowed("school", "Hallways"), false, "school uses the hallway widget only");
		assert.equal(allowed("home", "Orphanage"), false);
		assert.equal(allowed("home", "Bedroom"), false);
		assert.equal(allowed("orphanage", "Orphanage"), false);
		assert.equal(allowed("flat", "Plus Flat Hallway"), false);
		assert.equal(allowed("flats", "Flats"), false);
		assert.equal(allowed("forest", "Forest"), false);
		assert.equal(allowed("lake", "Lake"), false);
		assert.equal(allowed("hospital", "Hospital Foyer"), false);
		assert.equal(allowed("office", "Office Lobby"), false);
		assert.equal(allowed("adult_shop", "Adult Shop"), false);
		assert.equal(allowed("asylum", "Asylum"), false);
		assert.equal(allowed("cabin", "Eden Cabin"), false);

		assert.equal(allowed("town", "Bedroom"), false);
		assert.equal(allowed("town", "Public Toilet"), false);
		assert.equal(allowed("town", "Beach Changing Room"), false);
		assert.equal(allowed("town", "Options"), false);
		assert.equal(allowed("town", "Settings"), false);
		assert.equal(allowed("town", "Journal"), false);
		assert.equal(allowed("town", "Social"), false);
		assert.equal(allowed("town", "Clothing Shop"), false);
		assert.equal(allowed("shopping_centre", "Clothing Shop"), false);
		assert.equal(allowed("town", "Adult Shop Store"), false);
		assert.equal(allowed("town", "Pharmacy"), false);
		assert.equal(allowed("town", "Robin Room Naked Sex"), false);
		assert.equal(allowed("park", "Park Encounter"), false);
		assert.equal(allowed("town", "Street Combat"), false);
		assert.equal(allowed("town", "Oxford Street", { combat: 1 }), false);
		assert.equal(allowed("town", "Oxford Street", { intro: 1 }), false);
		assert.equal(allowed("town", "Oxford Street", { masturbating: 1 }), false);
		State.variables.combat = 0;
		State.variables.intro = 0;
		State.variables.masturbating = 0;
		assert.equal(allowed("cafe", "Chef Work"), false);
		assert.equal(allowed("town", "Plus Needs Toilet"), false);
	});

	it("does not fire a second town remark until the cooldown has elapsed", () => {
		const { window, State, Time } = load();
		window.plusContRepInit();
		State.variables.location = "town";
		State.passage = "Oxford Street";
		const first = window.plusContRepRemarkCheck("Oxford Street", true);
		assert.ok(first.length > 0);
		assert.equal(window.plusContRepRemarkCheck("Oxford Street"), "");
		Time.date.timeStamp += 3 * 60 * 60 - 1;
		assert.equal(window.plusContRepRemarkCheck("Oxford Street"), "");
		Time.date.timeStamp += 2;
		const rand = Math.random;
		Math.random = () => 0;
		try {
			const again = window.plusContRepRemarkCheck("Oxford Street");
			assert.ok(again.length > 0);
		} finally {
			Math.random = rand;
		}
	});

	it("keeps school hallway remarks behind the same lower chance and cooldown", () => {
		const { window, State, Time } = load({ location: "school", passage: "Hallways" });
		window.plusContRepInit();
		State.variables.schoolrep.continence = 4;
		assert.ok(Math.abs(window.plusSchoolContRepRemarkChance() - 0.08) < 1e-9);
		State.variables.fame.good = 400;
		assert.ok(Math.abs(window.plusSchoolContRepRemarkChance() - 0.08 * 0.7) < 1e-9);
		State.variables.fame.good = 0;
		assert.equal(window.plusSchoolContRepRemarkCheck(true), true);
		assert.equal(window.plusSchoolContRepRemarkCheck(), false);
		Time.date.timeStamp += 3 * 60 * 60 + 1;
		const rand = Math.random;
		Math.random = () => 0;
		try {
			assert.equal(window.plusSchoolContRepRemarkCheck(), true);
		} finally {
			Math.random = rand;
		}
		assert.match(read("game/ModLI/plus-needs/widgets.twee"), /plusSchoolContRepRemarkCheck\(\)/);
		assert.doesNotMatch(read("game/ModLI/plus-needs/widgets.twee"), /0\.08, 0\.12, 0\.2, 0\.3, 0\.4/);
		assert.match(read("game/overworld-town/loc-school/hallways.twee"), /<<plusSchoolContRepRemark>>/);
	});

	it("still never has named-NPC accident or diaper remarks", () => {
		assert.doesNotMatch(read("game/ModLI/plus-needs/widgets.twee"), /plusBaileyContRepComment|plusWhitneyContRepDay/);
		assert.doesNotMatch(read("game/ModLI/plus-needs/needs.js"), /C\.npc\.(Robin|Bailey|Whitney|Kylar|Sydney|Avery)/);
	});
});
