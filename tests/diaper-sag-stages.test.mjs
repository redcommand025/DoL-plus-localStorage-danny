/* 15 diaper sag stages (image-pack sprites) aligned with the concealment scale, and the fallback to
 * the base game's 5 sag tiers when no image pack provides a stage. */
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
const fill = (it, f) => {
	it.plusMl = it.plusCapMl * f;
	it.plusLb = 0;
	delete it.plusOverflow;
	return it;
};

describe("diaper sag stages (15, aligned with concealment)", () => {
	it("Hyper: empty 0, damp 1, 75% stage 11, full 14, overflowing 15", () => {
		const { window, item } = load();
		const it = item("plastic-backed diaper (Hyper)");
		assert.equal(window.plusSagStage(fill(it, 0)), 0);
		assert.equal(window.plusSagStage(fill(it, 0.001)), 1);
		assert.equal(window.plusSagStage(fill(it, 0.75)), 11);
		assert.equal(window.plusSagStage(fill(it, 0.7499)), 10);
		assert.equal(window.plusSagStage(fill(it, 0.9999)), 13);
		assert.equal(window.plusSagStage(fill(it, 1)), 14);
		it.plusOverflow = 1;
		assert.equal(window.plusSagStage(it), 15);
		assert.equal(window.plusSagStageCount, 15);
	});

	it("every model reaches all 15 stages in order as it fills", () => {
		const { window } = load();
		for (const d of Object.values(window.plusDiaperDefs)) {
			const seen = new Set();
			let prev = 0;
			for (let i = 0; i <= 10000; i++) {
				const s = window.plusSagStageForFill(d, i / 10000, false);
				assert.ok(s >= prev, `${d.name}: stage went down at ${i / 100}%`);
				prev = s;
				seen.add(s);
			}
			seen.add(window.plusSagStageForFill(d, 1, true));
			assert.deepEqual(
				[...seen].sort((a, b) => a - b),
				[...Array(16).keys()],
				d.name
			);
		}
	});

	it("each stage shows exactly one concealment size; every size step starts a new stage", () => {
		const { window, item } = load();
		for (const d of Object.values(window.plusDiaperDefs)) {
			const it = item(d.name);
			const sizeOf = new Map();
			const fills = new Set();
			for (let i = 0; i <= 4000; i++) fills.add(i / 4000);
			for (let st = 0; st <= d.stages; st++) for (const e of [-1e-6, 0, 1e-6]) fills.add(Math.min(1, Math.max(0, st / d.stages + e)));
			for (const f of fills) {
				fill(it, f);
				const stage = window.plusSagStage(it);
				const sz = window.plusDiaperSize(it);
				if (sizeOf.has(stage)) assert.equal(sizeOf.get(stage), sz, `${d.name}: stage ${stage} spans sizes ${sizeOf.get(stage)} and ${sz} (fill ${f})`);
				else sizeOf.set(stage, sz);
			}
			it.plusOverflow = 1;
			assert.equal(window.plusSagStage(it), 15);
			// the table the sprite generator uses agrees with the live functions
			const row = window.plusSagStageTable()[d.variable];
			for (const r of row.stages) if (sizeOf.has(r.stage)) assert.equal(r.size, sizeOf.get(r.stage), `${d.name}: table size for stage ${r.stage}`);
			assert.equal(row.stages[15].size, window.plusDiaperSize(it), `${d.name}: overflow size`);
		}
	});

	it("concealment is unchanged: Hyper steps up a size at 15/30/45/60/75/90/100% = stages 3/5/7/9/11/13/14", () => {
		const { window, item } = load();
		const it = item("plastic-backed diaper (Hyper)");
		const at = f => [window.plusSagStage(fill(it, f)), window.plusDiaperSize(it)];
		assert.deepEqual([0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1].map(at), [
			[3, 9],
			[5, 10],
			[7, 11],
			[9, 12],
			[11, 13],
			[13, 14],
			[14, 15],
		]);
	});

	it("uses the 15-stage sprite when the active image pack has it", () => {
		const packed = new Set();
		const { window, item } = load({ resolve: src => (packed.has(src) ? "imagepacks/au/" + src.slice(4) : src) });
		const it = fill(item("plastic-backed diaper (Hyper)"), 0.75);
		const base = "img/clothes/under-lower/plusdphyper/full.png";
		packed.add("img/clothes/under-lower/plusdphyper/sag11/full.png");
		assert.equal(window.plusSagSrc(base, it), "img/clothes/under-lower/plusdphyper/sag11/full.png");
		packed.clear();
		assert.equal(window.plusSagSrc(base, it), "img/clothes/under-lower/plusdphyper/sag3/full.png");
	});

	it("falls back to the base sprite's sag1-5 tier without an image pack (never a missing sag6-15)", () => {
		const { window, item } = load();
		const it = item("plastic-backed diaper (Hyper)");
		const base = "img/clothes/under-lower/plusdphyper/full.png";
		const cases = [
			[0.1, base],
			[0.3, "img/clothes/under-lower/plusdphyper/sag1/full.png"],
			[0.6, "img/clothes/under-lower/plusdphyper/sag2/full.png"],
			[0.8, "img/clothes/under-lower/plusdphyper/sag3/full.png"],
			[1, "img/clothes/under-lower/plusdphyper/sag4/full.png"],
		];
		for (const [f, want] of cases) assert.equal(window.plusSagSrc(base, fill(it, f)), want, `fill ${f}`);
		it.plusOverflow = 1;
		assert.equal(window.plusSagSrc("img/clothes/under-lower/plusdphyper/penis.png", it), "img/clothes/under-lower/plusdphyper/sag5/penis.png");
		for (let i = 0; i <= 100; i++) assert.match(window.plusSagSrc(base, fill(it, i / 100)), /plusdphyper\/(sag[1-5]\/)?full\.png$/);
	});
});
