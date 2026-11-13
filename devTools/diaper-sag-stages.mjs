#!/usr/bin/env node
/* Print the diaper sag-stage table from the game (needs.js plusSagStageTable): for every diaper
 * model, the fill at which each of the 15 sag stages starts and the concealment size it shows.
 *   node devTools/diaper-sag-stages.mjs          readable table
 *   node devTools/diaper-sag-stages.mjs --json   JSON (used by generate-pack-diapers.py) */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
export function loadStageTable() {
	const window = { console };
	const $ = () => ({ on() {} });
	const State = { variables: { worn: {}, wardrobe: {} }, temporary: {}, passage: "Start" };
	class ClothesItem {
		constructor(o) {
			Object.assign(this, o);
		}
	}
	const math = Object.create(Math);
	math.clamp = (n, a, b) => Math.min(b, Math.max(a, n));
	const ctx = { window, document: {}, State, Time: { date: { timeStamp: 0 } }, setup: { clothes: { under_lower: [] } }, ClothesItem, Math: math, console, $, jQuery: $ };
	ctx.globalThis = ctx;
	vm.createContext(ctx);
	vm.runInContext(readFileSync(join(root, "game/ModLI/plus-needs/needs.js"), "utf8"), ctx, { filename: "needs.js" });
	return JSON.parse(JSON.stringify(ctx.window.plusSagStageTable()));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
	const table = loadStageTable();
	if (process.argv.includes("--json")) console.log(JSON.stringify(table));
	else
		for (const [v, r] of Object.entries(table))
			console.log(v.padEnd(12), r.stages.map(x => `${x.stage}:${x.from === "overflow" ? "OF" : Math.round(x.from * 100) + "%"}/${x.size}`).join(" "));
}
