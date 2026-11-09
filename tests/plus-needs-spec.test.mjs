/**
 * Spec regressions for the published plus-needs rates and rules.
 * Deterministic cases seed Math.random; randomness cases check bounds.
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

describe("plus-needs published spec", () => {
	it("QA-N001 [spec] awake minute rates match 1.6 / 2.6 / 3.6 / 0.5 with seeded RNG", () => {
		const { window, State } = loadNeeds();
		withRandom(0.5, () => window.plusNeedsTick(60));
		assert.equal(State.variables.plusHunger, 2000 - 96);
		assert.equal(State.variables.plusThirst, 2000 - 156);
		assert.equal(State.variables.plusBladder, 2000 - 216);
		assert.equal(State.variables.plusBowels, 2000 - 30);
		assert.equal(Math.round(2000 / 1.6 / 60), 21);
		assert.equal(Math.round(2000 / 2.6 / 60), 13);
		assert.equal(Math.round(2000 / 3.6 / 60), 9);
		assert.equal(Math.round(2000 / 0.5 / 60), 67);
		assert.ok(1.6 * 10 * 60 > 900 && 1.6 * 10 * 60 < 1100);
	});

	it("QA-N002 [spec] each tick stays within ±25% and drift stays in 0.8–1.2", () => {
		const losses = [];
		const drifts = [];
		for (let i = 0; i < 120; i++) {
			const { window, State } = loadNeeds();
			window.plusNeedsTick(1);
			losses.push(2000 - State.variables.plusHunger);
			drifts.push(State.variables.plusNeedsDrift.plusHunger);
		}
		const minL = Math.min(...losses);
		const maxL = Math.max(...losses);
		const mean = losses.reduce((a, b) => a + b, 0) / losses.length;
		assert.ok(minL >= 1.6 * 0.8 * 0.75 - 1e-9, String(minL));
		assert.ok(maxL <= 1.6 * 1.2 * 1.25 + 1e-9, String(maxL));
		assert.ok(mean > 1.2 && mean < 2.0, String(mean));
		assert.ok(Math.min(...drifts) >= 0.8);
		assert.ok(Math.max(...drifts) <= 1.2);
		const lo = withRandom(0, () => {
			const { window, State } = loadNeeds();
			window.plusNeedsTick(60);
			return 2000 - State.variables.plusHunger;
		});
		const hi = withRandom(1, () => {
			const { window, State } = loadNeeds();
			window.plusNeedsTick(60);
			return 2000 - State.variables.plusHunger;
		});
		assert.ok(Math.abs(lo - 1.6 * 60 * (1 - 0.03) * 0.75) < 1e-9, String(lo));
		assert.ok(Math.abs(hi - 1.6 * 60 * (1 + 0.03) * 1.25) < 1e-9, String(hi));
	});

	it("QA-N003 [spec] meal and drink refills vary by ±22% and drinks use 30–500 ml sizes", () => {
		const { window } = loadNeeds();
		assert.equal(window.plusNeedsML.shot, 30);
		assert.equal(window.plusNeedsML["water bottle"], 500);
		const refill = r =>
			withRandom(r, () => {
				const ctx = loadNeeds({ variables: { plusHunger: 0, plusThirst: 0, plusBladder: 2000, plusBowels: 2000 } });
				ctx.window.plusNeedsConsume(1000, 500, "meal", 0);
				return { h: ctx.State.variables.plusHunger, t: ctx.State.variables.plusThirst };
			});
		assert.equal(refill(0.5).h, 1000);
		assert.equal(refill(0).h, 1000 * 0.78);
		assert.equal(refill(1).h, 1000 * 1.22);
		const drink = withRandom(0.5, () => {
			const ctx = loadNeeds({ variables: { plusThirst: 0, plusBladder: 2000 } });
			ctx.window.plusNeedsConsume(0, 500, "drink", ctx.window.plusNeedsML["water bottle"], "water bottle");
			return ctx.State.variables;
		});
		assert.equal(drink.plusThirst, 500);
		assert.equal(drink.plusBladder, 2000 - 500 * 0.4);
		assert.equal(drink.plusNeedsStats.mlTotal, 500);
	});

	it("QA-N004 [spec] skips of 3 hours or more use sleep rates; 179 minutes stay awake", () => {
		const awake = loadNeeds();
		withRandom(0.5, () => awake.window.plusNeedsTick(179));
		assert.equal(awake.State.variables.plusHunger, 2000 - 1.6 * 179);
		assert.equal(awake.State.variables.plusBladder, 2000 - 3.6 * 179);
		const rest = loadNeeds();
		withRandom(0.5, () => rest.window.plusNeedsTick(180));
		assert.equal(rest.State.variables.plusHunger, 2000 - 1.6 * 180 * 0.25);
		assert.equal(rest.State.variables.plusThirst, 2000 - 2.6 * 180 * 0.25);
		assert.equal(rest.State.variables.plusBladder, 2000 - 3.6 * 180 * 0.5);
		assert.equal(rest.State.variables.plusBowels, 2000 - 0.5 * 180 * 0.5);
	});

	it("QA-N005 [spec] long skips floor bladder and bowels at 400 and do not cause accidents", () => {
		const fromAbove = loadNeeds({ variables: { plusBladder: 450, plusBowels: 410, plusContinence: 5 } });
		withRandom(0.5, () => fromAbove.window.plusNeedsTick(180));
		assert.equal(fromAbove.State.variables.plusBladder, 400);
		assert.equal(fromAbove.State.variables.plusBowels, 400);
		assert.equal(fromAbove.State.variables.plusAccident, undefined);
		const fromBelow = loadNeeds({ variables: { plusBladder: 200, plusBowels: 0, plusContinence: 3 } });
		withRandom(0.5, () => fromBelow.window.plusNeedsTick(240));
		assert.equal(fromBelow.State.variables.plusBladder, 400);
		assert.equal(fromBelow.State.variables.plusBowels, 400);
		assert.equal(fromBelow.State.variables.plusAccident, undefined);
		assert.equal(fromBelow.State.variables.plusBedwet, undefined);
	});

	it("QA-N006 [spec] bedwetting on long rest is separate and only at continence 0–2", () => {
		const high = loadNeeds({ variables: { plusContinence: 5, plusBladder: 500 } });
		withRandom(0, () => high.window.plusNeedsTick(480));
		assert.equal(high.State.variables.plusBedwet, undefined);
		const low = loadNeeds({ variables: { plusContinence: 1, plusBladder: 800 } });
		withRandom(0, () => low.window.plusNeedsTick(480));
		assert.equal(low.State.variables.plusBedwet, 1);
	});

	it("QA-N007 [spec] empty hunger and thirst apply stacked hourly stress, pain, and fatigue", () => {
		const hunger = loadNeeds({ variables: { plusHunger: 0, plusThirst: 2000, stress: 0, pain: 0, tiredness: 0 } });
		withRandom(0.5, () => hunger.window.plusNeedsTick(60));
		assert.equal(hunger.State.variables.stress, 80);
		assert.equal(hunger.State.variables.pain, 20);
		assert.equal(hunger.State.variables.tiredness, 15);
		const thirst = loadNeeds({ variables: { plusHunger: 2000, plusThirst: 0, stress: 0, pain: 0, tiredness: 0 } });
		withRandom(0.5, () => thirst.window.plusNeedsTick(60));
		assert.equal(thirst.State.variables.stress, 120);
		assert.equal(thirst.State.variables.pain, 26);
		assert.equal(thirst.State.variables.tiredness, 15);
		const both = loadNeeds({ variables: { plusHunger: 0, plusThirst: 0, stress: 0, pain: 0, tiredness: 0 } });
		withRandom(0.5, () => both.window.plusNeedsTick(60));
		assert.equal(both.State.variables.stress, 200);
		assert.equal(both.State.variables.pain, 46);
		assert.equal(both.State.variables.tiredness, 30);
	});

	it("QA-N008 [spec] needs pain is capped at 40 hunger and 60 thirst without using unrelated pain", () => {
		const hunger = loadNeeds({ variables: { plusHunger: 0, plusThirst: 2000, pain: 0 } });
		withRandom(0.5, () => {
			hunger.window.plusNeedsTick(60);
			hunger.window.plusNeedsTick(60);
			hunger.window.plusNeedsTick(60);
		});
		assert.equal(hunger.State.variables.pain, 40);
		assert.equal(hunger.State.variables.plusNeedsPain.plusHunger, 40);
		const thirst = loadNeeds({ variables: { plusHunger: 2000, plusThirst: 0, pain: 0 } });
		withRandom(0.5, () => {
			thirst.window.plusNeedsTick(60);
			thirst.window.plusNeedsTick(60);
			thirst.window.plusNeedsTick(60);
		});
		assert.equal(thirst.State.variables.pain, 60);
		const other = loadNeeds({ variables: { plusHunger: 0, plusThirst: 2000, pain: 50 } });
		withRandom(0.5, () => other.window.plusNeedsTick(60));
		assert.equal(other.State.variables.pain, 70);
		assert.equal(other.State.variables.plusNeedsPain.plusHunger, 20);
	});

	it("QA-N009 [spec] accident risk starts at 1800/1200/600 for levels 0–2, at 0 for 3, and grace is 30/60/120", () => {
		const { window } = loadNeeds();
		assert.equal(window.plusContinenceChance(0, 1800, 1), 0);
		assert.ok(window.plusContinenceChance(0, 1799, 1) > 0);
		assert.equal(window.plusContinenceChance(1, 1200, 1), 0);
		assert.ok(window.plusContinenceChance(1, 1199, 1) > 0);
		assert.equal(window.plusContinenceChance(2, 600, 1), 0);
		assert.ok(window.plusContinenceChance(2, 599, 1) > 0);
		assert.equal(window.plusContinenceChance(3, 0, 1), 0);
		const hold = (lvl, minutes, start = 1) => {
			const ctx = loadNeeds({ variables: { plusContinence: lvl, plusBladder: start, plusBowels: 2000 } });
			withRandom(0.5, () => ctx.window.plusNeedsTick(minutes));
			return ctx.State.variables;
		};
		assert.equal(hold(4, 20).plusAccident, undefined);
		assert.equal(hold(4, 20).plusBladder, 0);
		assert.equal(hold(4, 40).plusAccident, "plusBladder");
		assert.equal(hold(5, 50).plusAccident, undefined);
		assert.equal(hold(5, 70).plusAccident, "plusBladder");
		assert.equal(hold(6, 110).plusAccident, undefined);
		assert.equal(hold(6, 130).plusAccident, "plusBladder");
	});
});
