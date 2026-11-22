/**
 * School accident noticing: location bases, diaper / concealment, discomfort, and the library fine.
 */
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
			detention: 0,
			delinquency: 0,
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

function almost(actual, expected) {
	assert.ok(Math.abs(actual - expected) < 1e-9, `expected ${expected}, got ${actual}`);
}

describe("school accident spotting chances", () => {
	it("classifies hallways, class, library, and other school spots", () => {
		const { window } = loadNeeds();
		assert.equal(window.plusSchoolAccidentSpotKind("Hallways"), "hall");
		assert.equal(window.plusSchoolAccidentSpotKind("Maths Classroom"), "class");
		assert.equal(window.plusSchoolAccidentSpotKind("Science Classroom"), "class");
		assert.equal(window.plusSchoolAccidentSpotKind("Maths Event1"), "class");
		assert.equal(window.plusSchoolAccidentSpotKind("School Detention"), "class");
		assert.equal(window.plusSchoolAccidentSpotKind("School Library"), "library");
		assert.equal(window.plusSchoolAccidentSpotKind("Library Study"), "library");
		assert.equal(window.plusSchoolAccidentSpotKind("Canteen"), "other");
		assert.equal(window.plusSchoolAccidentSpotKind("School Front Courtyard"), "other");
		assert.equal(window.plusSchoolAccidentSpotBase("Hallways"), 0.75);
		assert.equal(window.plusSchoolAccidentSpotBase("Maths Classroom"), 1);
		assert.equal(window.plusSchoolAccidentSpotBase("School Library"), 0.4);
		assert.equal(window.plusSchoolAccidentSpotBase("Canteen"), 0.5);
	});

	it("uses each location's no-diaper chance, then /2, /4, and x3 with a 100% cap", () => {
		const { window } = loadNeeds();
		const cases = [
			["Hallways", 0.75, 0.375, 0.1875, 1, 1, 0.5625],
			["Maths Classroom", 1, 0.5, 0.25, 1, 1, 0.75],
			["School Library", 0.4, 0.2, 0.1, 1, 0.6, 0.3],
			["Canteen", 0.5, 0.25, 0.125, 1, 0.75, 0.375],
		];
		for (const [title, bare, vis, hid, bareU, visU, hidU] of cases) {
			almost(window.plusSchoolAccidentSpotChance(title, { worn: false, visible: false, uncomfortable: false }), bare);
			almost(window.plusSchoolAccidentSpotChance(title, { worn: true, visible: true, uncomfortable: false }), vis);
			almost(window.plusSchoolAccidentSpotChance(title, { worn: true, visible: false, uncomfortable: false }), hid);
			almost(window.plusSchoolAccidentSpotChance(title, { worn: false, visible: false, uncomfortable: true }), bareU);
			almost(window.plusSchoolAccidentSpotChance(title, { worn: true, visible: true, uncomfortable: true }), visU);
			almost(window.plusSchoolAccidentSpotChance(title, { worn: true, visible: false, uncomfortable: true }), hidU);
		}
	});

	it("treats $uncomfortable.diaperUse as the discomfort flag, on by default", () => {
		const { window, State } = loadNeeds({ passage: "Hallways", variables: { location: "school" } });
		assert.equal(window.plusAccidentUncomfortable(), true);
		almost(window.plusSchoolAccidentSpotChance("School Library", { worn: false }), 1);
		State.variables.uncomfortable.diaperUse = false;
		assert.equal(window.plusAccidentUncomfortable(), false);
		almost(window.plusSchoolAccidentSpotChance("School Library", { worn: false }), 0.4);
		State.variables.acceptance_diaper = 1000;
		State.variables.exhibitionism = 80;
		State.variables.uncomfortable.diaperUse = true;
		assert.equal(window.plusAccidentUncomfortable(), true);
	});

	it("reads concealment from plusDiaperVisible when no opts are passed", () => {
		const { window, setup, State } = loadNeeds({ passage: "Hallways", variables: { location: "school", uncomfortable: { diaperUse: false } } });
		almost(window.plusAccidentSpotChance(false, "Hallways"), 0.75);
		setup.clothes.under_lower = window.plusDiaperItems();
		const pull = window.plusDiaperItems().find(i => i.name === "pull-up (Medium)");
		window.plusDiaperInit(pull);
		State.variables.worn.under_lower = pull;
		State.variables.worn.lower = { name: "naked", type: ["naked"] };
		assert.equal(window.plusDiaperVisible(), true);
		almost(window.plusAccidentSpotChance(false, "Hallways"), 0.375);
		State.variables.worn.lower = { name: "school skirt", type: ["normal"], plusConceal: 15 };
		window.plusConcealOf = () => 15;
		assert.equal(window.plusDiaperVisible(), false);
		almost(window.plusAccidentSpotChance(false, "Hallways"), 0.1875);
	});

	it("leaves non-school public spotting unchanged", () => {
		const { window, Time } = loadNeeds({ passage: "Domus Street" });
		Time.dayState = "day";
		almost(window.plusAccidentSpotChance(false, "Domus Street"), 0.25);
		almost(window.plusAccidentSpotChance(true, "Domus Street"), 0.6);
		almost(window.plusAccidentSpotChance(false, "High Street"), 0.375);
		almost(window.plusAccidentSpotChance(true, "High Street"), 0.9);
		Time.dayState = "night";
		almost(window.plusAccidentSpotChance(false, "Domus Street"), 0.125);
		almost(window.plusAccidentSpotChance(true, "Domus Street"), 0.3);
	});

	it("charges a £10 library cleaning fine on half of noticed cases, or detention if broke", () => {
		const paid = loadNeeds({ passage: "School Library", variables: { location: "school", money: 500000, detention: 0, delinquency: 0 } });
		const missed = paid.window.plusLibraryAccidentFineRoll({ random: 0.5 });
		assert.equal(missed.caught, false);
		assert.equal(missed.paid, false);
		assert.equal(missed.amount, 1000);
		assert.equal(missed.detention, 0);
		assert.equal(paid.State.variables.money, 500000);
		const fine = paid.window.plusLibraryAccidentFineRoll({ caught: true });
		assert.equal(fine.caught, true);
		assert.equal(fine.paid, true);
		assert.equal(fine.amount, 1000);
		assert.equal(fine.detention, 0);
		assert.equal(paid.State.variables.money, 499000);

		const broke = loadNeeds({ passage: "School Library", variables: { location: "school", money: 200, detention: 0, delinquency: 0 } });
		const debt = broke.window.plusLibraryAccidentFineRoll({ caught: true });
		assert.equal(debt.caught, true);
		assert.equal(debt.paid, false);
		assert.equal(debt.amount, 1000);
		assert.equal(debt.detention, 3);
		assert.equal(broke.State.variables.money, 200);
		assert.equal(broke.State.variables.detention, 30);
		assert.equal(broke.State.variables.delinquency, 12);
	});

	it("rolls the librarian fine only after a library accident is noticed", () => {
		const { window, State } = loadNeeds({
			passage: "School Library",
			variables: { location: "school", money: 500000, detention: 0, uncomfortable: { diaperUse: false } },
		});
		const orig = Math.random;
		try {
			Math.random = () => 0.99;
			assert.equal(window.plusAccidentSpotChance(false, "School Library"), 0.4);
			assert.equal(window.plusAccidentSpotRoll(false), 0);
			assert.equal(State.temporary.plusLibraryFine, null);
			assert.equal(State.variables.money, 500000);

			Math.random = () => 0.1;
			const seen = window.plusAccidentSpotRoll(false);
			assert.equal(seen, 2);
			assert.equal(State.temporary.plusLibraryFine.caught, true);
			assert.equal(State.temporary.plusLibraryFine.paid, true);
			assert.equal(State.variables.money, 499000);
		} finally {
			Math.random = orig;
		}
	});

	it("does not levy the library fine in the hallways or on the street", () => {
		const hall = loadNeeds({
			passage: "Hallways",
			variables: { location: "school", money: 500000, uncomfortable: { diaperUse: true } },
		});
		const orig = Math.random;
		try {
			Math.random = () => 0;
			assert.equal(hall.window.plusAccidentSpotRoll(false), 2);
			assert.equal(hall.State.temporary.plusLibraryFine, null);
			assert.equal(hall.State.variables.money, 500000);

			const street = loadNeeds({ passage: "High Street", variables: { money: 500000 } });
			assert.equal(street.window.plusAccidentSpotRoll(true), 1);
			assert.equal(street.State.temporary.plusLibraryFine, null);
			assert.equal(street.State.variables.money, 500000);
		} finally {
			Math.random = orig;
		}
	});
});
