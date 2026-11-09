/**
 * Unit tests for Danny's timetable. Does not load the compiled HTML.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadSchedule(time, extras = {}) {
	const window = {};
	const context = {
		window,
		Time: {
			hour: time.hour,
			minute: time.minute ?? 0,
			schoolDay: !!time.schoolDay,
			isWeekEnd: () => !!time.weekend,
		},
		C: extras.C,
	};
	vm.createContext(context);
	vm.runInContext(readFileSync(join(root, "game/ModLI/Danny/schedule.js"), "utf8"), context);
	return context;
}

describe("Danny schedule", () => {
	it("QA-S014 [unit] timetable applies when Danny is uninitialized and does not throw without C.npc", () => {
		const noC = loadSchedule({ hour: 22, minute: 0, schoolDay: true }, { C: undefined });
		assert.equal(typeof noC.window.getDannyLocation, "function");
		assert.equal(noC.window.getDannyLocation(), "sleep");

		const uninit = loadSchedule({ hour: 22, minute: 0, schoolDay: true }, { C: { npc: { Danny: { init: 0 } } } });
		assert.equal(uninit.window.getDannyLocation(), "sleep");

		const missingNpc = loadSchedule({ hour: 10, minute: 0, schoolDay: true }, { C: { npc: undefined } });
		assert.equal(missingNpc.window.getDannyLocation(), "school");
	});

	it("QA-S015 [unit] weekday and weekend timetable slots match the documented schedule", () => {
		const cases = [
			[{ hour: 6, minute: 59, schoolDay: true }, "sleep"],
			[{ hour: 7, minute: 0, schoolDay: true }, "room"],
			[{ hour: 8, minute: 20, schoolDay: true }, "walk"],
			[{ hour: 8, minute: 45, schoolDay: true }, "school"],
			[{ hour: 12, minute: 0, schoolDay: true }, "canteen"],
			[{ hour: 14, minute: 0, schoolDay: true }, "school"],
			[{ hour: 15, minute: 10, schoolDay: true }, "courtyard"],
			[{ hour: 15, minute: 20, schoolDay: true }, "work"],
			[{ hour: 18, minute: 0, schoolDay: true }, "work"],
			[{ hour: 20, minute: 0, schoolDay: true }, "room"],
			[{ hour: 21, minute: 0, schoolDay: true }, "sleep"],
			[{ hour: 8, minute: 0, schoolDay: false }, "room"],
			[{ hour: 10, minute: 0, schoolDay: false }, "work"],
			[{ hour: 16, minute: 0, schoolDay: false }, "room"],
			[{ hour: 21, minute: 30, schoolDay: false }, "sleep"],
		];
		for (const [time, expected] of cases) {
			const ctx = loadSchedule(time, { C: undefined });
			assert.equal(ctx.window.getDannyLocation(), expected, JSON.stringify(time));
		}
	});
});
