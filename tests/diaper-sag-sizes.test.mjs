/* Image-pack diaper pictures are chosen from the diaper's concealment size (one picture per size),
 * with overflow drawn as leak<N>, and fall back to the base game's 5 sag tiers without a pack. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function load(imagePacks) {
	const window = { console };
	if (imagePacks) window.ImagePacks = imagePacks;
	const $ = () => ({ on() {} });
	const State = { variables: { worn: {}, wardrobe: { under_lower: [] } }, temporary: {}, passage: "Start" };
	class ClothesItem {
		constructor(o) {
			Object.assign(this, o);
		}
	}
	const math = Object.create(Math);
	math.clamp = (n, a, b) => Math.min(b, Math.max(a, n));
	const ctx = {
		window,
		document: {},
		State,
		Time: { date: { timeStamp: 0 } },
		setup: { clothes: { under_lower: [] } },
		ClothesItem,
		Math: math,
		console,
		$,
		jQuery: $,
	};
	ctx.globalThis = ctx;
	vm.createContext(ctx);
	vm.runInContext(readFileSync(join(root, "game/ModLI/plus-needs/needs.js"), "utf8"), ctx, { filename: "needs.js" });
	ctx.setup.clothes.under_lower = window.plusDiaperItems();
	const item = name => {
		const it = window.plusDiaperItems().find(i => i.name === name);
		window.plusDiaperInit(it);
		return it;
	};
	return { window, item };
}
const fill = (it, f, over) => {
	it.plusMl = it.plusCapMl * f;
	it.plusLb = 0;
	if (over) it.plusOverflow = 1;
	else delete it.plusOverflow;
	return it;
};
const HYPER = "plastic-backed diaper (Hyper)";

describe("diaper pictures by concealment size", () => {
	it("Hyper: dry size 8, 75% size 13, full size 15, overflowing leak15", () => {
		const { window, item } = load();
		const it = item(HYPER);
		const key = (f, o) => window.plusSagSizeKey(fill(it, f, o));
		assert.deepEqual([key(0), key(0.15), key(0.75), key(0.9), key(1), key(1, true)], ["size8", "size9", "size13", "size14", "size15", "leak15"]);
		const m = item("plastic-backed diaper (Medium)");
		assert.equal(window.plusSagSizeKey(fill(m, 0)), "size3");
		assert.equal(window.plusSagSizeKey(fill(m, 1, true)), "leak7");
	});

	it("the picture is always the diaper's current concealment size", () => {
		const { window, item } = load();
		for (const d of Object.values(window.plusDiaperDefs)) {
			const it = item(d.name);
			for (let i = 0; i <= 200; i++) {
				fill(it, i / 200);
				assert.equal(window.plusSagSizeKey(it), `size${window.plusDiaperSize(it)}`, `${d.name} ${i / 2}%`);
			}
			fill(it, 1, true);
			assert.equal(window.plusSagSizeKey(it), `leak${window.plusDiaperSize(it)}`);
			const row = window.plusSagSizeTable()[d.variable];
			assert.equal(row.overflow, window.plusDiaperSize(it));
			assert.equal(row.sizes[0], d.base);
		}
	});

	it("uses the size picture when the active image pack has it", () => {
		const packed = new Set();
		const { window, item } = load({ resolve: src => (packed.has(src) ? "imagepacks/au/" + src.slice(4) : src) });
		const it = fill(item(HYPER), 0.75);
		const base = "img/clothes/under-lower/plusdphyper/full.png";
		packed.add("img/clothes/under-lower/plusdphyper/size13/full.png");
		assert.equal(window.plusSagSrc(base, it), "img/clothes/under-lower/plusdphyper/size13/full.png");
		fill(it, 0);
		packed.add("img/clothes/under-lower/plusdphyper/size8/full.png");
		assert.equal(window.plusSagSrc(base, it), "img/clothes/under-lower/plusdphyper/size8/full.png");
		fill(it, 1, true);
		packed.add("img/clothes/under-lower/plusdphyper/leak15/penis.png");
		assert.equal(window.plusSagSrc("img/clothes/under-lower/plusdphyper/penis.png", it), "img/clothes/under-lower/plusdphyper/leak15/penis.png");
		packed.clear();
		assert.equal(window.plusSagSrc(base, fill(it, 0.75)), "img/clothes/under-lower/plusdphyper/sag3/full.png");
	});

	it("falls back to the base sprite's sag1-5 tier without an image pack (never a size or leak path)", () => {
		const { window, item } = load();
		const it = item(HYPER);
		const base = "img/clothes/under-lower/plusdphyper/full.png";
		const cases = [
			[0.1, base],
			[0.3, "img/clothes/under-lower/plusdphyper/sag1/full.png"],
			[0.6, "img/clothes/under-lower/plusdphyper/sag2/full.png"],
			[0.8, "img/clothes/under-lower/plusdphyper/sag3/full.png"],
			[1, "img/clothes/under-lower/plusdphyper/sag4/full.png"],
		];
		for (const [f, want] of cases) assert.equal(window.plusSagSrc(base, fill(it, f)), want, `fill ${f}`);
		assert.equal(window.plusSagSrc("img/clothes/under-lower/plusdphyper/penis.png", fill(it, 1, true)), "img/clothes/under-lower/plusdphyper/sag5/penis.png");
		for (let i = 0; i <= 100; i++) assert.match(window.plusSagSrc(base, fill(it, i / 100)), /plusdphyper\/(sag[1-5]\/)?full\.png$/);
		assert.equal(window.plusSagSrc("img/clothes/lower/jeans/full.png", it), "img/clothes/lower/jeans/full.png");
	});
});
