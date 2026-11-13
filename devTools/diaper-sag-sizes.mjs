#!/usr/bin/env node
/* Print the diaper size table from the game (needs.js plusSagSizeTable): for every diaper model, the
 * concealment sizes it can show (one image-pack picture each) and the fill at which each starts.
 *   node devTools/diaper-sag-sizes.mjs          readable table
 *   node devTools/diaper-sag-sizes.mjs --json   JSON (used by generate-pack-diapers.py) */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
export function loadSizeTable() {
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
	return JSON.parse(JSON.stringify(ctx.window.plusSagSizeTable()));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
	const table = loadSizeTable();
	if (process.argv.includes("--json")) console.log(JSON.stringify(table));
	else
		for (const [v, r] of Object.entries(table))
			console.log(v.padEnd(12), r.steps.map(x => `${Math.round(x.from * 100)}%=size${x.size}`).join(" "), `overflow=leak${r.overflow}`);
}
