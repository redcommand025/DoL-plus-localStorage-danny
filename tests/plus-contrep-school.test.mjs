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
			location: "school",
			fame: { good: 0 },
			schoolrep: { crossdress: 0, herm: 0, continence: 0 },
			settings: {},
			combat: 0,
			intro: 0,
			worn: { face: { type: [] } },
		},
		temporary: {},
		passage: "Science Lesson",
	};
	const Time = { days: 10, year: 2022, month: 12, monthDay: 1, dayState: "day", date: { timeStamp: 1_000_000 } };
	Math.clamp = (n, min, max) => Math.min(max, Math.max(min, n));
	const context = { window, document: {}, State, Time, Math, console, $, jQuery: $ };
	context.globalThis = context;
	vm.createContext(context);
	vm.runInContext(read("game/ModLI/plus-needs/needs.js"), context, { filename: "needs.js" });
	return { window: context.window, State, Time };
}

describe("continence reputation: school rumours and labels", () => {
	it("renames Famous to Known and the old Known tier to Talked about", () => {
		const { window, State } = load();
		const names = window.plusContRepStates.map(s => s.name).join(",");
		assert.equal(names, "Unknown,Obscure,Low-key,Talked about,Recognised,Known,Notorious");
		assert.equal(window.plusContRepInfoFrom(200).name, "Talked about");
		assert.equal(window.plusContRepInfoFrom(600).name, "Known");
		assert.equal(read("game/ModLI/plus-needs/widgets.twee").includes("Famous"), false);
		assert.match(read("game/ModLI/plus-needs/widgets.twee"), /Talked about/);
		assert.match(read("game/base-system/overlays/social.twee"), /plusSchoolContRepBox/);
	});

	it("queues a school rumour when a school accident is seen, and applies it at midnight", () => {
		const { window, State, Time } = load();
		State.variables.plusContRepDecayDay = Time.days;
		window.plusContRepInit();
		assert.equal(window.plusContRepPublicValue(), 0);
		assert.equal(window.plusSchoolContRep(), 0);
		const amt = window.plusContRepOnAccident(1, { school: true, which: "plusBladder", clothed: true });
		assert.ok(amt > 0);
		assert.ok(State.variables.plusContRep >= amt);
		assert.equal(window.plusContRepPublicValue(), 0);
		assert.equal(window.plusSchoolContRep(), 0);
		assert.equal(State.variables.plusContRepSchoolPending, 1);

		Time.days += 1;
		window.plusContRepDecay();
		assert.equal(window.plusSchoolContRep(), 1);
		assert.equal(State.variables.school_continence_message, 1);
		assert.equal(State.variables.plusContRepSchoolPending, 0);
		assert.equal(window.plusContRepPublicValue(), State.variables.plusContRep);
		assert.ok(window.plusContRepPublicValue() > 0);
	});

	it("has no Bailey continence remarks or Relentless Bailey setting", () => {
		const { window } = load();
		assert.equal(typeof window.plusBaileyRelentless, "undefined");
		assert.doesNotMatch(read("game/base-system/settings.twee"), /inflationBaileyRelentless/);
		assert.doesNotMatch(read("game/overworld-town/loc-home/rent.twee"), /plusBaileyContRepComment/);
		assert.doesNotMatch(read("game/overworld-town/loc-home/main.twee"), /plusBaileyContRepComment/);
		assert.doesNotMatch(read("game/ModLI/plus-needs/widgets.twee"), /plusBaileyContRepComment|plusWhitneyContRepDay|Whitney's voice/);
	});

	it("lets kindness slightly speed clean decay and soften remark chance", () => {
		const { window, State } = load();
		State.variables.plusContRepPublic = 600;
		State.variables.plusContRep = 600;
		window.plusContRepInit();
		const base = window.plusContRepRemarkChance();
		State.variables.fame.good = 400;
		const soft = window.plusContRepRemarkChance();
		assert.ok(soft < base);
		assert.ok(Math.abs(soft - base * 0.7) < 0.0001);
		const without = window.plusContRepDecayAmt(1, false);
		// plusFameGood is already 400 here, so bump fame down for the control
		State.variables.fame.good = 0;
		const raw = window.plusContRepDecayAmt(1, false);
		assert.equal(without, Math.min(28, raw + 4));
	});

	it("uses the public meter for restroom and work modifiers until midnight", () => {
		const { window, State } = load();
		State.variables.plusContRep = 1000;
		State.variables.plusContRepPublic = 0;
		window.plusContRepInit();
		assert.equal(window.plusContRepRestroomMod(), 0);
		assert.equal(window.plusContRepWorkMul(), 1);
		State.variables.plusContRepPublic = 1000;
		assert.equal(window.plusContRepRestroomMod(), -0.22);
		assert.ok(window.plusContRepWorkMul() < 1);
	});

	it("registers the hallway remark as a widget, not as evicted-flat prose", () => {
		const widgets = read("game/ModLI/plus-needs/widgets.twee");
		const reput = widgets.split(":: Widgets Plus Needs Continence Reputation")[1].split(":: ")[0];
		assert.match(reput, /<<widget "plusSchoolContRepRemark">>/);
		assert.match(reput, /<<widget "plusSchoolContRepBox">>/);
		assert.doesNotMatch(reput, /plusBaileyContRepComment/);
		const evicted = widgets.split(":: Plus Flat Evicted")[1].split(":: ")[0];
		assert.doesNotMatch(evicted, /<<widget /);
		assert.match(read("game/overworld-town/loc-school/hallways.twee"), /<<plusSchoolContRepRemark>>/);
	});
});
