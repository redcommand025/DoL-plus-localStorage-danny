/**
 * Sleep metabolism and night wake/accident rules for plus-needs.
 * Actual sleep uses slower rates than a generic 3+ hour skip.
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

function withRandom(value, fn) {
	const orig = Math.random;
	Math.random = typeof value === "function" ? value : () => value;
	try {
		return fn();
	} finally {
		Math.random = orig;
	}
}

function src(rel) {
	return readFileSync(join(root, rel), "utf8");
}

describe("plus-needs sleep metabolism and night continence", () => {
	it("exposes slower sleep rates and the original long-pass rates", () => {
		const { window } = loadNeeds();
		assert.equal(JSON.stringify(window.plusNeedsSleepRate), JSON.stringify({ plusHunger: 0.125, plusThirst: 0.125, plusBladder: 0.25, plusBowels: 0.25 }));
		assert.equal(JSON.stringify(window.plusNeedsLongPassRate), JSON.stringify({ plusHunger: 0.25, plusThirst: 0.25, plusBladder: 0.5, plusBowels: 0.5 }));
		assert.equal(JSON.stringify(window.plusSleepAccidentChance), JSON.stringify([1, 0.6, 0.3]));
	});

	it("uses x1/8 hunger and thirst and x1/4 bladder and bowels on a 60-minute sleep tick", () => {
		const { window, State } = loadNeeds();
		window.plusNeedsBeginSleep();
		withRandom(0.5, () => window.plusNeedsTick(60));
		assert.equal(State.variables.plusHunger, 2000 - 1.6 * 60 * 0.125);
		assert.equal(State.variables.plusThirst, 2000 - 2.6 * 60 * 0.125);
		assert.equal(State.variables.plusBladder, 2000 - 3.6 * 60 * 0.25);
		assert.equal(State.variables.plusBowels, 2000 - 0.5 * 60 * 0.25);
	});

	it("keeps 179 minutes awake at full rates", () => {
		const { window, State } = loadNeeds();
		withRandom(0.5, () => window.plusNeedsTick(179));
		assert.equal(State.variables.plusHunger, 2000 - 1.6 * 179);
		assert.equal(State.variables.plusBladder, 2000 - 3.6 * 179);
	});

	it("keeps 180 minutes without the sleep flag on long-pass rates and the 400 floor", () => {
		const rest = loadNeeds();
		withRandom(0.5, () => rest.window.plusNeedsTick(180));
		assert.equal(rest.State.variables.plusHunger, 2000 - 1.6 * 180 * 0.25);
		assert.equal(rest.State.variables.plusThirst, 2000 - 2.6 * 180 * 0.25);
		assert.equal(rest.State.variables.plusBladder, 2000 - 3.6 * 180 * 0.5);
		assert.equal(rest.State.variables.plusBowels, 2000 - 0.5 * 180 * 0.5);
		const floored = loadNeeds({ variables: { plusBladder: 200, plusBowels: 0, plusContinence: 0 } });
		withRandom(0, () => floored.window.plusNeedsTick(180));
		assert.equal(floored.State.variables.plusBladder, 400);
		assert.equal(floored.State.variables.plusBowels, 400);
		assert.equal(floored.State.variables.plusAccident, undefined);
		assert.equal(floored.State.variables.plusSleepWake, undefined);
		assert.equal(floored.State.variables.plusSleepAccident, undefined);
	});

	it("lets sleep bars reach 0 and does not apply the 400 floor", () => {
		const { window, State } = loadNeeds({ variables: { plusBladder: 40, plusBowels: 2000, plusContinence: 3 } });
		window.plusNeedsBeginSleep();
		withRandom(0.5, () => window.plusNeedsTick(60));
		assert.equal(State.variables.plusBladder, 0);
		assert.equal(State.variables.plusAccident, undefined);
		assert.notEqual(State.variables.plusBladder, 400);
	});

	it("always wakes at continence 3+ for bladder and bowels, with no accident", () => {
		for (const kind of ["plusBladder", "plusBowels"]) {
			for (const lvl of [3, 4, 6]) {
				const vars = { plusContinence: lvl, plusBladder: 2000, plusBowels: 2000 };
				vars[kind] = 0;
				const { window, State } = loadNeeds({ variables: vars });
				window.plusNeedsBeginSleep();
				const result = window.plusSleepResolveAfterPass();
				assert.equal(result.kind, kind, `level ${lvl} ${kind}`);
				assert.equal(State.variables.plusSleepWake.kind, kind);
				assert.equal(State.variables.plusAccident, undefined);
				assert.equal(State.variables.plusSleepAccident, undefined);
			}
		}
	});

	it("always accidents at continence 0 and stays asleep for bladder and bowels", () => {
		for (const kind of ["plusBladder", "plusBowels"]) {
			const vars = { plusContinence: 0, plusBladder: 2000, plusBowels: 2000 };
			vars[kind] = 0;
			const { window, State } = loadNeeds({ variables: vars });
			window.plusNeedsBeginSleep();
			const result = withRandom(0.99, () => window.plusSleepResolveAfterPass());
			assert.equal(result.accident, true);
			assert.equal(State.variables.plusAccident, kind);
			assert.equal(State.variables.plusSleepAccident.sleptThrough, true);
			assert.equal(State.variables.plusSleepWake, undefined);
			assert.equal(State.variables[kind], 2000);
		}
	});

	it("at continence 1 accidents 60% of the time and wakes otherwise, for both needs", () => {
		for (const kind of ["plusBladder", "plusBowels"]) {
			const accVars = { plusContinence: 1, plusBladder: 2000, plusBowels: 2000 };
			accVars[kind] = 0;
			const acc = loadNeeds({ variables: accVars });
			acc.window.plusNeedsBeginSleep();
			const accResult = withRandom(0.59, () => acc.window.plusSleepResolveAfterPass());
			assert.equal(accResult.accident, true, kind);
			assert.equal(acc.State.variables.plusAccident, kind);
			assert.equal(acc.State.variables.plusSleepAccident.sleptThrough, false);

			const wakeVars = { plusContinence: 1, plusBladder: 2000, plusBowels: 2000 };
			wakeVars[kind] = 0;
			const wake = loadNeeds({ variables: wakeVars });
			wake.window.plusNeedsBeginSleep();
			const wakeResult = withRandom(0.6, () => wake.window.plusSleepResolveAfterPass());
			assert.equal(wakeResult.accident, undefined, kind);
			assert.equal(wake.State.variables.plusSleepWake.kind, kind);
			assert.equal(wake.State.variables.plusAccident, undefined);
		}
	});

	it("at continence 2 accidents 30% of the time and wakes otherwise, for both needs", () => {
		for (const kind of ["plusBladder", "plusBowels"]) {
			const accVars = { plusContinence: 2, plusBladder: 2000, plusBowels: 2000 };
			accVars[kind] = 0;
			const acc = loadNeeds({ variables: accVars });
			acc.window.plusNeedsBeginSleep();
			const accResult = withRandom(0.29, () => acc.window.plusSleepResolveAfterPass());
			assert.equal(accResult.accident, true, kind);

			const wakeVars = { plusContinence: 2, plusBladder: 2000, plusBowels: 2000 };
			wakeVars[kind] = 0;
			const wake = loadNeeds({ variables: wakeVars });
			wake.window.plusNeedsBeginSleep();
			const wakeResult = withRandom(0.3, () => wake.window.plusSleepResolveAfterPass());
			assert.equal(wakeResult.accident, undefined, kind);
			assert.equal(wake.State.variables.plusSleepWake.kind, kind);
		}
	});

	it("treats both bars at 0 as a combined night event", () => {
		const { window, State } = loadNeeds({ variables: { plusContinence: 3, plusBladder: 0, plusBowels: 0 } });
		window.plusNeedsBeginSleep();
		const result = window.plusSleepResolveAfterPass();
		assert.equal(result.kind, "both");
		assert.equal(State.variables.plusSleepWake.kind, "both");
	});

	it("plans the minutes until a sleep bar would hit 0", () => {
		const { window } = loadNeeds({ variables: { plusBladder: 54, plusBowels: 2000 } });
		window.plusNeedsBeginSleep();
		assert.equal(window.plusSleepMinutesUntilEvent(60), 60);
		const soon = loadNeeds({ variables: { plusBladder: 27, plusBowels: 2000 } });
		soon.window.plusNeedsBeginSleep();
		assert.equal(soon.window.plusSleepMinutesUntilEvent(60), 30);
		const now = loadNeeds({ variables: { plusBladder: 0, plusBowels: 2000 } });
		assert.equal(now.window.plusSleepMinutesUntilEvent(60), 0);
	});

	it("routes night toilet trips to the home bathroom, the flat, or an outdoor spot", () => {
		const home = loadNeeds({ variables: { location: "home", plusSleepBed: "Bedroom" } });
		const homeInfo = home.window.plusSleepToiletInfo();
		assert.equal(homeInfo.type, "bathroom");
		assert.equal(homeInfo.passage, "Bathroom");
		assert.equal(homeInfo.label, "Go to the bathroom (0:01)");
		assert.equal(homeInfo.pass, 1);
		const flat = loadNeeds({ variables: { location: "flat", plusSleepBed: "Plus Flat Sleep" } });
		assert.equal(flat.window.plusSleepToiletInfo().passage, "Plus Flat Bathroom");
		const forest = loadNeeds({ variables: { location: "forest", plusSleepBed: "Forest Sleep" } });
		const forestInfo = forest.window.plusSleepToiletInfo();
		assert.equal(forestInfo.type, "outdoor");
		assert.equal(forestInfo.spot, "forest");
		assert.equal(forestInfo.label, "Relieve yourself nearby (0:03)");
	});

	it("hooks sleephour, sewers, livestock, sleep links, and the main bed passages", () => {
		const sleephour = src("game/base-system/sleep.twee");
		assert.match(sleephour, /plusNeedsBeginSleep/);
		assert.match(sleephour, /plusSleepMinutesUntilEvent/);
		assert.match(sleephour, /plusSleepResolveAfterPass/);
		assert.match(sleephour, /Plus Needs Sleep Wake/);
		assert.match(sleephour, /plusNeedsEndSleep/);

		const sewers = src("game/overworld-underground/loc-sewers/widgets.twee");
		assert.match(sewers, /plusNeedsBeginSleep/);
		assert.match(sewers, /widget "sewerssleephour"[\s\S]*plusSleepMinutesUntilEvent/);
		const sewersPass = src("game/overworld-underground/loc-sewers/morgan.twee");
		assert.match(sewersPass, /Plus Needs Sleep Wake/);

		const livestock = src("game/overworld-plains/loc-livestock/widgets.twee");
		assert.match(livestock, /widget "livestock_sleep"[\s\S]*plusNeedsBeginSleep[\s\S]*plusSleepMinutesUntilEvent/);
		const livestockPass = src("game/overworld-plains/loc-livestock/main.twee");
		assert.match(livestockPass, /Plus Needs Sleep Wake/);

		const links = src("game/overworld-town/loc-home/widgets.twee");
		assert.match(links, /widget "generateSleepLinks"[\s\S]*plusSleepBed/);

		const plusWidgets = src("game/ModLI/plus-needs/widgets.twee");
		assert.match(plusWidgets, /:: Plus Flat Sleep[\s\S]*<<sleep>>/);
		assert.match(plusWidgets, /:: Plus Needs Sleep Wake/);
		assert.match(plusWidgets, /You leaked in your sleep|You had an accident in your sleep/);

		const home = src("game/overworld-town/loc-home/main.twee");
		assert.match(home, /:: Sleep\n[\s\S]{0,400}<<sleep>>/);
		assert.match(home, /:: Robin Sleep\n[\s\S]{0,400}<<sleep>>/);
	});
});
