import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const jsonPath = join(root, "devTools/diaper-concealment-data.json");
const scriptPath = join(root, "devTools/diaper-concealment-table.py");

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
			location: "town",
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
		passage: overrides.passage || "Oxford Street",
	};
	const Time = { days: 10, year: 2022, month: 12, monthDay: 1, date: { timeStamp: 1_000_000 }, dayState: "day", ...(overrides.Time || {}) };
	class ClothesItem {
		constructor(o) {
			Object.assign(this, o);
		}
	}
	Math.clamp = (n, min, max) => Math.min(max, Math.max(min, n));
	const setup = { clothes: { under_lower: [], lower: [{ name: "jeans", type: ["normal"], skirt: 0 }] }, moddedClothes: { under_lower: [] } };
	const context = { window, document: {}, State, Time, setup, ClothesItem, Math, console, $, jQuery: $ };
	context.globalThis = context;
	vm.createContext(context);
	vm.runInContext(readFileSync(join(root, "game/ModLI/plus-needs/needs.js"), "utf8"), context, { filename: "needs.js" });
	return { window: context.window, State, Time, setup };
}

function wear(ctx, name, fill = 0, overflow = 0) {
	setupItems(ctx);
	const tpl = ctx.setup.clothes.under_lower.find(c => c.name === name);
	assert.ok(tpl, "missing diaper " + name);
	const it = JSON.parse(JSON.stringify(tpl));
	ctx.window.plusDiaperInit(it);
	it.plusMl = fill * it.plusCapMl;
	it.plusOverflow = overflow;
	ctx.State.variables.worn.under_lower = it;
	return it;
}

function setupItems(ctx) {
	if (ctx.setup.clothes.under_lower.length) return;
	ctx.setup.clothes.under_lower = ctx.window.plusDiaperItems();
}

describe("diaper concealment table (sprite-derived)", () => {
	it("plusConcealTable is loaded and matches the generated JSON", () => {
		const { window } = loadNeeds();
		const T = window.plusConcealTable;
		assert.ok(T && T.items && T.rules && T.defaults);
		const data = JSON.parse(readFileSync(jsonPath, "utf8"));
		assert.equal(Object.keys(T.items).length, Object.keys(data.items).length);
		for (const [name, hide] of Object.entries(data.items)) {
			assert.equal(T.items[name], hide, name);
		}
		assert.equal(T.defaults.lower, data.defaults.lower);
		assert.equal(T.defaults.over_lower, data.defaults.over_lower);
		assert.equal(T.rules.length, data.rules.length);
		for (let i = 0; i < data.rules.length; i++) {
			assert.equal(T.rules[i][1], data.rules[i].hide, data.rules[i].tag);
		}
	});

	it("main garments use the measured Can hide values", () => {
		const { window } = loadNeeds();
		const of = (name, slot = "lower") => window.plusConcealOf({ name, type: ["normal"] }, slot);
		assert.equal(of("jeans"), 6);
		assert.equal(of("school skirt"), 5);
		assert.equal(of("shorts"), 3);
		assert.equal(of("school shorts"), 3);
		assert.equal(of("gym bloomers"), 0);
		assert.equal(of("leather miniskirt"), 2);
		assert.equal(of("long skirt"), 9);
		assert.equal(of("trousers"), 6);
		assert.equal(of("school trousers"), 6);
		assert.equal(of("yoga pants"), 6);
		assert.equal(of("wide leg trousers"), 12);
		assert.equal(of("overall bottoms"), 12);
		assert.equal(of("evening gown skirt"), 12);
		assert.equal(of("bathrobe bottom"), 12);
		assert.equal(of("kimono skirt"), 9);
		assert.equal(of("witch skirt"), 3);
		assert.equal(of("patient gown skirt"), 0);
		assert.equal(of("micro pleated skirt"), 4);
		assert.equal(of("maid skirt"), 12);
		assert.equal(of("hanfu skirt"), 13);
		// unmeasured / synthetic names hit first-match fallbacks
		assert.equal(of("micro skirt"), 3);
		assert.equal(of("witch robe", "over_lower"), 10);
		assert.equal(window.plusConcealOf({ name: "naked", type: ["naked"] }, "lower"), -1);
	});

	it("a Medium stays hidden under jeans until size 7, and is visible under a school skirt when full", () => {
		const ctx = loadNeeds();
		const it = wear(ctx, "plastic-backed diaper (Medium)", 0);
		let v = ctx.window.plusDiaperVisibility();
		assert.equal(v.conceal, 6);
		assert.equal(v.size, 3);
		assert.equal(v.visible, false);

		it.plusMl = it.plusCapMl;
		v = ctx.window.plusDiaperVisibility();
		assert.equal(v.size, 6);
		assert.equal(v.visible, false);

		it.plusOverflow = 1;
		v = ctx.window.plusDiaperVisibility();
		assert.equal(v.size, 7);
		assert.equal(v.visible, true);

		it.plusOverflow = 0;
		it.plusMl = 0;
		ctx.State.variables.worn.lower = { name: "school skirt", type: ["normal"] };
		v = ctx.window.plusDiaperVisibility();
		assert.equal(v.conceal, 5);
		assert.equal(v.size, 3);
		assert.equal(v.visible, false);
		it.plusMl = it.plusCapMl;
		v = ctx.window.plusDiaperVisibility();
		assert.equal(v.size, 6);
		assert.equal(v.visible, true);
	});

	it("keeps the 3% per point, 25% cap notice mechanic", () => {
		const ctx = loadNeeds({ passage: "Oxford Street" });
		ctx.State.variables.location = "town";
		wear(ctx, "plastic-backed diaper (Medium)", 1, 1); // size 7 under jeans (hide 6) => over 1
		assert.equal(ctx.window.plusIsPublic("Oxford Street"), true);
		assert.equal(ctx.window.plusDiaperNoticeChance("Oxford Street"), 0.03);

		ctx.State.variables.worn.lower = { name: "gym bloomers", type: ["normal"] };
		const hyper = wear(ctx, "plastic-backed diaper (Hyper)", 1, 0); // size 15, conceal 0, over 15
		assert.equal(ctx.window.plusDiaperSize(hyper), 15);
		assert.equal(ctx.window.plusDiaperVisibility().conceal, 0);
		assert.equal(ctx.window.plusDiaperNoticeChance("Oxford Street"), 0.25);
	});

	it("the generated table matches a fresh script run", function () {
		assert.ok(existsSync(scriptPath));
		const dir = mkdtempSync(join(tmpdir(), "conceal-"));
		const out = join(dir, "diaper-concealment-data.json");
		try {
			const r = spawnSync("python3", [scriptPath, "--json-only", "--output", out], {
				cwd: root,
				encoding: "utf8",
				timeout: 120000,
			});
			assert.equal(r.status, 0, r.stderr || r.stdout || "script failed");
			const fresh = JSON.parse(readFileSync(out, "utf8"));
			const committed = JSON.parse(readFileSync(jsonPath, "utf8"));
			assert.deepEqual(fresh.items, committed.items);
			assert.deepEqual(
				fresh.rules.map(x => ({ pattern: x.pattern, hide: x.hide, tag: x.tag })),
				committed.rules.map(x => ({ pattern: x.pattern, hide: x.hide, tag: x.tag }))
			);
			assert.deepEqual(fresh.defaults, committed.defaults);
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});
});
