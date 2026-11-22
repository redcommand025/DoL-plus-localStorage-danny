/**
 * Slowed accident and diaper rumour spread: lower per-incident gain,
 * slower daily public and school catch-up, and slightly faster clean decay.
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
			fame: { good: 0 },
			schoolrep: { crossdress: 0, herm: 0, continence: 0 },
			gamemode: "normal",
			worn: {
				under_lower: { name: "plain panties", type: ["normal"], plusDirt: 0, plusSoiled: 0 },
				lower: { name: "jeans", type: ["normal"], plusDirt: 0, plusSoiled: 0 },
			},
			...overrides.variables,
		},
		temporary: {},
		passage: overrides.passage || "Beach",
	};
	const Time = { days: 10, year: 2022, month: 12, monthDay: 1, date: { timeStamp: 1_000_000 }, dayState: "day", ...(overrides.Time || {}) };
	Math.clamp = (n, min, max) => Math.min(max, Math.max(min, n));
	const context = { window, document: {}, State, Time, Math, console, $, jQuery: $ };
	context.globalThis = context;
	vm.createContext(context);
	vm.runInContext(readFileSync(join(root, "game/ModLI/plus-needs/needs.js"), "utf8"), context, { filename: "needs.js" });
	return { window: context.window, State, Time };
}

function daysToFade(start) {
	let v = start;
	let days = 0;
	let clean = 0;
	const decay = { afterGain: 6, clean: 16, cleanStep: 6, max: 36 };
	while (v > 0 && days < 200) {
		clean += 1;
		const extra = Math.max(0, clean - 1);
		const amt = Math.min(decay.max, decay.clean + extra * decay.cleanStep);
		v = Math.max(0, v - amt);
		days += 1;
	}
	return days;
}

describe("continence rumour spread is slower and fades faster when clean", () => {
	it("halves the published per-incident gains", () => {
		const { window } = loadNeeds();
		const g = window.plusContRepGains;
		assert.equal(g.absorbed.plusBladder, 4);
		assert.equal(g.absorbed.plusBowels, 5);
		assert.equal(g.absorbed.both, 7);
		assert.equal(g.clothed.plusBladder, 10);
		assert.equal(g.clothed.plusBowels, 14);
		assert.equal(g.clothed.both, 18);
		assert.equal(g.floor.plusBladder, 20);
		assert.equal(g.floor.plusBowels, 25);
		assert.equal(g.floor.both, 30);
		assert.equal(g.seen, 2);
		assert.equal(g.wet, 2);
		assert.equal(g.dirty, 2);
		assert.equal(g.outdoor, 6);
	});

	it("takes about twice as many quiet clothed bladder accidents to reach each town tier", () => {
		const { window, State } = loadNeeds();
		const gain = window.plusContRepGains.clothed.plusBladder;
		assert.equal(gain, 10);
		const tiers = [
			[30, "Obscure", 3],
			[100, "Low-key", 10],
			[200, "Talked about", 20],
			[400, "Recognised", 40],
			[600, "Known", 60],
			[1000, "Notorious", 100],
		];
		for (const [min, name, incidents] of tiers) {
			assert.equal(Math.ceil(min / gain), incidents, name);
			State.variables.plusContRep = 0;
			State.variables.plusContRepPublic = min;
			assert.equal(window.plusContRepLabel(), name);
		}
	});

	it("lets town gossip catch up by about a third each midnight, and follow decay downward at once", () => {
		const { window, State, Time } = loadNeeds({
			variables: { plusContRep: 90, plusContRepPublic: 0, plusContRepDayGain: 1, plusContRepDecayDay: 10, plusContRepCleanDays: 0 },
		});
		Time.days = 11;
		window.plusContRepDecay();
		const afterGain = 90 - window.plusContRepDecayInfo.afterGain;
		assert.equal(State.variables.plusContRep, afterGain);
		const expectedPub = window.plusContRepCatchupPublic(0, afterGain);
		assert.equal(State.variables.plusContRepPublic, expectedPub);
		assert.ok(expectedPub < afterGain);
		assert.equal(expectedPub, Math.max(1, Math.round(afterGain / 3)));

		// Once town gossip has already caught up, a clean day should fade it immediately.
		State.variables.plusContRepPublic = State.variables.plusContRep;
		State.variables.plusContRepDayGain = 0;
		Time.days = 12;
		const privBefore = State.variables.plusContRep;
		const pubBefore = State.variables.plusContRepPublic;
		window.plusContRepDecay();
		assert.ok(State.variables.plusContRep < privBefore);
		assert.equal(State.variables.plusContRepPublic, State.variables.plusContRep);
		assert.ok(State.variables.plusContRepPublic < pubBefore);
	});

	it("needs three school incident days to raise school rumours by one step, and 15 to reach the top", () => {
		const { window, State, Time } = loadNeeds({
			variables: { plusContRepDecayDay: 10, schoolrep: { continence: 0 }, location: "school" },
			passage: "Hallways",
			Time: { days: 10 },
		});
		window.plusContRepInit();
		for (let i = 0; i < 15; i++) {
			window.plusContRepOnAccident(1, { school: true, which: "plusBladder", busy: false, night: false });
			Time.days += 1;
			window.plusContRepDecay();
		}
		assert.equal(window.plusSchoolContRep(), 5);
		assert.equal(State.variables.plusContRepSchoolCredit, 0);
	});

	it("guarantees a school rumour fade after four clean midnights", () => {
		const { window, State, Time } = loadNeeds({
			variables: {
				plusContRep: 0,
				plusContRepPublic: 0,
				plusContRepDayGain: 0,
				plusContRepDecayDay: 10,
				schoolrep: { continence: 2 },
				plusContRepSchoolCleanDays: 0,
				plusContRepSchoolIncident: 0,
				fame: { good: 0 },
			},
			Time: { days: 10 },
		});
		const orig = Math.random;
		Math.random = () => 0.999;
		try {
			for (let i = 0; i < 3; i++) {
				Time.days += 1;
				window.plusContRepDecay();
			}
			assert.equal(window.plusSchoolContRep(), 2);
			Time.days += 1;
			window.plusContRepDecay();
			assert.equal(window.plusSchoolContRep(), 1);
		} finally {
			Math.random = orig;
		}
	});

	it("uses a slightly faster clean-decay table and does not wipe existing high saves", () => {
		const { window } = loadNeeds();
		const d = window.plusContRepDecayInfo;
		assert.equal(d.afterGain, 6);
		assert.equal(d.clean, 16);
		assert.equal(d.cleanStep, 6);
		assert.equal(d.max, 36);
		assert.equal(window.plusContRepDecayAmt(1, true), 6);
		assert.equal(window.plusContRepDecayAmt(1, false), 16);
		assert.equal(window.plusContRepDecayAmt(2, false), 22);
		assert.equal(window.plusContRepDecayAmt(5, false), 36);
		assert.equal(daysToFade(200), 7);
		assert.equal(daysToFade(1000), 29);

		const high = loadNeeds({ variables: { plusContRep: 800, plusContRepPublic: 750, schoolrep: { continence: 4 } } });
		high.window.plusContRepInit();
		assert.equal(high.State.variables.plusContRep, 800);
		assert.equal(high.State.variables.plusContRepPublic, 750);
		assert.equal(high.State.variables.schoolrep.continence, 4);

		const over = loadNeeds({ variables: { plusContRep: 1400, plusContRepPublic: -20, schoolrep: { continence: 9 } } });
		over.window.plusContRepInit();
		assert.equal(over.State.variables.plusContRep, 1000);
		assert.equal(over.State.variables.plusContRepPublic, 0);
		assert.equal(over.State.variables.schoolrep.continence, 5);
	});
});
