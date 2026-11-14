/* Soiled overlays: one of 9 (light/medium/heavy x pee/poo/both) chosen from what the diaper holds and
 * how full it is, drawn above the diaper; pee on the crotch, poo on the seat, stretched with the sag. */
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import zlib from "node:zlib";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const { loadSizeTable } = await import("../devTools/diaper-sag-sizes.mjs");
const SIZES = loadSizeTable();
const INTEGRITY = ["full", "frayed", "torn", "tattered"];
const CAT = { "plastic-backed diaper": "dp", "cloth diaper": "cd", "pull-up": "pu" };

function load({ money = 5000, imagePacks } = {}) {
	const window = { console };
	if (imagePacks) window.ImagePacks = imagePacks;
	const $ = () => ({ on() {} });
	const State = { variables: { money, worn: {}, wardrobe: { under_lower: [] } }, temporary: {}, passage: "Start" };
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
		const it = JSON.parse(JSON.stringify(ctx.setup.clothes.under_lower.find(i => i.name === name)));
		window.plusDiaperInit(it);
		return it;
	};
	return { window, item, V: State.variables, setup: ctx.setup };
}
const HYPER = "plastic-backed diaper (Hyper)";
const MED = "plastic-backed diaper (Medium)";

function rgba(path) {
	const buf = readFileSync(path);
	const w = buf.readUInt32BE(16),
		h = buf.readUInt32BE(20),
		type = buf[25];
	assert.equal(type, 6, `${path}: RGBA`);
	const idat = [];
	for (let o = 8; o < buf.length; ) {
		const len = buf.readUInt32BE(o);
		if (buf.toString("latin1", o + 4, o + 8) === "IDAT") idat.push(buf.subarray(o + 8, o + 8 + len));
		o += 12 + len;
	}
	const raw = zlib.inflateSync(Buffer.concat(idat));
	const stride = w * 4,
		px = Buffer.alloc(stride * h);
	for (let y = 0; y < h; y++) {
		const f = raw[y * (stride + 1)],
			line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
		for (let x = 0; x < stride; x++) {
			const a = x >= 4 ? px[y * stride + x - 4] : 0,
				b = y ? px[(y - 1) * stride + x] : 0,
				c = x >= 4 && y ? px[(y - 1) * stride + x - 4] : 0;
			const p = a + b - c,
				pa = Math.abs(p - a),
				pb = Math.abs(p - b),
				pc = Math.abs(p - c);
			px[y * stride + x] = (line[x] + [0, a, b, (a + b) >> 1, pa <= pb && pa <= pc ? a : pb <= pc ? b : c][f]) & 255;
		}
	}
	return { w, h, alpha: i => px[i * 4 + 3], grey: i => px[i * 4], px };
}
const manifest = (() => {
	const sandbox = { window: {} };
	vm.runInNewContext(readFileSync(join(root, "game/03-JavaScript/imagepacks-manifest.js"), "utf8"), sandbox);
	return sandbox.window.ImagePackManifest;
})();
const listed = (pack, rel) => {
	const i = rel.lastIndexOf("/");
	return (manifest[pack].files[rel.slice(0, i)] || []).includes(rel.slice(i + 1));
};
/* every size/leak picture of a category -> one model folder that has it */
function catKeys() {
	const out = { dp: {}, cd: {}, pu: {} };
	for (const [v, row] of Object.entries(SIZES)) {
		const c = out[CAT[row.cat]];
		for (const z of row.sizes) c[`size${z}`] ??= v;
		c[`leak${row.overflow}`] ??= v;
	}
	return out;
}

const LEVELS = ["light", "medium", "heavy"];
const TYPES = ["pee", "poo", "both"];
const set = (it, ml, lb, over) => {
	it.plusMl = it.plusCapMl * ml;
	it.plusLb = it.plusCapLb * lb;
	if (over) it.plusOverflow = 1;
	else delete it.plusOverflow;
	return it;
};

describe("soiled overlays: which one shows", () => {
	it("empty diapers show none; type follows what is held", () => {
		const { window, item } = load();
		const it = item(HYPER);
		assert.equal(window.plusDiaperSoil(set(it, 0, 0)), null);
		assert.equal(window.plusDiaperSoil(set(it, 0.5, 0)).type, "pee");
		assert.equal(window.plusDiaperSoil(set(it, 0, 0.5)).type, "poo");
		assert.equal(window.plusDiaperSoil(set(it, 0.5, 0.2)).type, "both");
		assert.equal(window.plusDiaperSoil({ name: "jeans" }), null);
	});
	it("intensity: >0-1/3 light, 1/3-2/3 medium, 2/3+ or overflowing heavy (by the fill that drives the sag)", () => {
		const { window, item } = load();
		const it = item(HYPER);
		const lv = (ml, lb, o) => window.plusDiaperSoil(set(it, ml, lb, o)).level;
		assert.deepEqual([lv(0.01, 0), lv(0.32, 0), lv(0.34, 0), lv(0.65, 0), lv(0.67, 0), lv(1, 0)], ["light", "light", "medium", "medium", "heavy", "heavy"]);
		assert.equal(lv(0.1, 0.7), "heavy", "the fuller of the two decides");
		assert.equal(lv(0.1, 0, true), "heavy");
	});
	it("Hyper example: size 8 empty = none, size 15 full = heavy both", () => {
		const { window, item } = load();
		const it = item(HYPER);
		set(it, 0, 0);
		assert.equal(window.plusDiaperSize(it), 8);
		assert.equal(window.plusDiaperSoil(it), null);
		set(it, 1, 1);
		assert.equal(window.plusDiaperSize(it), 15);
		assert.equal(window.plusDiaperSoil(it).key, "heavy-both");
	});
	it("routes to the pack overlay for the size picture, else the base sag tier; penis uses full", () => {
		const packed = new Set();
		const { window, item } = load({ imagePacks: { resolve: s => (packed.has(s) ? "imagepacks/au/" + s.slice(4) : s) } });
		const it = set(item(HYPER), 0.75, 0);
		assert.equal(window.plusDiaperSoilSrc(it, "torn"), "img/clothes/under-lower/plusdphyper/sag3/soil-torn-heavy-pee.png");
		const shared = "img/clothes/under-lower/plussoil/dp/size13/torn-heavy-pee.png";
		packed.add(shared);
		assert.equal(window.plusDiaperSoilSrc(it, "torn"), shared);
		packed.add("img/clothes/under-lower/plussoil/dp/size13/full-heavy-pee.png");
		assert.equal(window.plusDiaperSoilSrc(it, "penis"), "img/clothes/under-lower/plussoil/dp/size13/full-heavy-pee.png");
		assert.equal(window.plusDiaperSoilSrc(set(it, 0, 0), "full"), "");
	});
	it("the paper doll has soiled layers above the diaper", () => {
		const cm = readFileSync(join(root, "game/04-Variables/canvasmodel-main.js"), "utf8");
		for (const l of ["under_lower_soil", "under_lower_penis_soil"]) {
			const i = cm.indexOf(`"${l}"`);
			assert.ok(i > 0, l);
			const block = cm.slice(i, i + 1500);
			assert.match(block, /plusDiaperSoilSrc/);
			assert.match(block, /alpha/);
			assert.match(block, /\+ 0\.5/);
		}
	});
});

describe("soiled overlays: art", () => {
	const keys = catKeys();
	for (const pack of ["au", "aumasc"])
		it(`${pack}: 9 overlays for every category size picture x integrity, in the manifest`, () => {
			let n = 0;
			for (const [cat, ks] of Object.entries(keys))
				for (const key of Object.keys(ks))
					for (const integ of INTEGRITY)
						for (const l of LEVELS)
							for (const t of TYPES) {
								const rel = `clothes/under-lower/plussoil/${cat}/${key}/${integ}-${l}-${t}.png`;
								assert.ok(existsSync(join(root, "imagepacks", pack, rel)), rel);
								assert.ok(listed(pack, rel), `${rel} not in manifest`);
								n++;
							}
			assert.equal(n, Object.values(keys).reduce((s, k) => s + Object.keys(k).length, 0) * 4 * 9);
		});
	it("base: 9 overlays for every shop diaper x sag tier x integrity", () => {
		let n = 0;
		for (const v of Object.keys(SIZES))
			for (const sub of ["", "sag1/", "sag2/", "sag3/", "sag4/", "sag5/"])
				for (const integ of INTEGRITY)
					for (const l of LEVELS)
						for (const t of TYPES) {
							assert.ok(existsSync(join(root, "img/clothes/under-lower", v, `${sub}soil-${integ}-${l}-${t}.png`)));
							n++;
						}
		assert.equal(n, 15 * 6 * 4 * 9);
	});
	/* visible stain in the overlay's left frame (alpha > 40 ignores faint padding grime) */
	const stats = (p, thr = 40) => {
		const o = rgba(p);
		let n = 0,
			sy = 0,
			sx = 0,
			top = 1e9,
			bot = -1,
			sumL = 0;
		const pts = [];
		for (let y = 0; y < o.h; y++)
			for (let x = 0; x < o.w / 2; x++) {
				const a = o.alpha(y * o.w + x);
				if (a > thr) {
					n++;
					sy += y;
					sx += x;
					top = Math.min(top, y);
					bot = Math.max(bot, y);
					const i = y * o.w + x;
					sumL += o.px[i * 4] + o.px[i * 4 + 1] + o.px[i * 4 + 2];
					pts.push([x, y, a, i]);
				}
			}
		return { n, cy: sy / Math.max(1, n), cx: sx / Math.max(1, n), top, bot, o, lum: sumL / Math.max(1, n) / 3, pts };
	};
	const padCount = spr => {
		const s = rgba(spr);
		let n = 0;
		for (let y = 0; y < s.h; y++)
			for (let x = 0; x < s.w / 2; x++) {
				const i = y * s.w + x;
				if (s.alpha(i) > 0 && s.grey(i) > 106 && s.grey(i) <= 170) n++;
			}
		return n;
	};
	it("clipped to the diaper's padding (inside the garment, outlines and rips left clean)", () => {
		const check = (ov, spr, line) => {
			const o = rgba(ov),
				s = rgba(spr);
			for (let i = 0; i < o.w * o.h; i++)
				if (o.alpha(i)) {
					assert.ok(s.alpha(i) > 0, `${ov}: outside the garment`);
					assert.ok(s.grey(i) > line && s.grey(i) <= 170, `${ov}: over an outline, rip, band or tape`);
				}
		};
		for (const [cat, ks] of Object.entries(keys))
			for (const [key, v] of Object.entries(ks))
				for (const integ of INTEGRITY)
					check(
						join(root, "imagepacks/au/clothes/under-lower/plussoil", cat, key, `${integ}-heavy-both.png`),
						join(root, "imagepacks/au/clothes/under-lower", v, key, `${integ}.png`),
						106
					);
		for (const v of Object.keys(SIZES))
			for (const sub of ["", "sag4/"])
				check(
					join(root, "img/clothes/under-lower", v, `${sub}soil-tattered-heavy-both.png`),
					join(root, "img/clothes/under-lower", v, `${sub}tattered.png`),
					100
				);
	});
	it("heavier covers more; poo sits lower (seat) than pee (crotch); stains drop with the sag", () => {
		const P = "imagepacks/au/clothes/under-lower/plussoil/dp";
		for (const t of TYPES) {
			const [a, b, c] = LEVELS.map(l => stats(join(root, P, "size15", `full-${l}-${t}.png`)).n);
			assert.ok(a < b && b < c, `${t}: ${a} ${b} ${c}`);
		}
		const pee = stats(join(root, P, "size15/full-medium-pee.png"));
		const poo = stats(join(root, P, "size15/full-medium-poo.png"));
		assert.ok(poo.cy > pee.cy + 5, `poo ${poo.cy} below pee ${pee.cy}`);
		const dry = stats(join(root, P, "size8/full-heavy-poo.png"));
		assert.ok(poo.bot > dry.bot + 20, "seat stain hangs lower on the sagged picture");
	});
	it("covers more of the padding at every intensity; heavy both covers most of the diaper", () => {
		const P = "imagepacks/au/clothes/under-lower/plussoil/dp";
		const pad = padCount(join(root, "imagepacks/au/clothes/under-lower/plusdphyper/size15/full.png"));
		const frac = (l, t) => stats(join(root, P, "size15", `full-${l}-${t}.png`)).n / pad;
		assert.ok(frac("light", "pee") >= 0.15 && frac("light", "poo") >= 0.15, "light still a clear patch");
		assert.ok(frac("medium", "pee") >= 0.4 && frac("medium", "poo") >= 0.3, "medium covers a large area");
		assert.ok(frac("heavy", "pee") >= 0.7, `heavy pee fills seat and walls: ${frac("heavy", "pee")}`);
		assert.ok(frac("heavy", "poo") >= 0.45, `heavy poo most of the seat: ${frac("heavy", "poo")}`);
		assert.ok(frac("heavy", "both") >= 0.7, `heavy both most of the diaper: ${frac("heavy", "both")}`);
		// base sag too
		const bpad = padCount(join(root, "img/clothes/under-lower/plusdphyper/sag4/full.png"));
		const bboth = stats(join(root, "img/clothes/under-lower/plusdphyper/sag4/soil-full-heavy-both.png")).n / bpad;
		assert.ok(bboth >= 0.7, `base heavy both ${bboth}`);
	});
	it("light pee stays on the crotch; medium reaches into the seat and walls; heavy fills both", () => {
		const P = "imagepacks/au/clothes/under-lower/plussoil/dp";
		const light = stats(join(root, P, "size15/full-light-pee.png"));
		const medium = stats(join(root, P, "size15/full-medium-pee.png"));
		const heavy = stats(join(root, P, "size15/full-heavy-pee.png"));
		const seat = stats(join(root, P, "size15/full-heavy-poo.png"));
		assert.ok(light.bot < seat.bot - 15, `light pee (${light.bot}) should stay above the seat (${seat.bot})`);
		assert.ok(medium.bot > light.bot + 10, `medium pee should reach lower than light (${medium.bot} vs ${light.bot})`);
		assert.ok(medium.bot >= seat.bot - 10, `medium pee should reach into the seat (${medium.bot} vs ${seat.bot})`);
		assert.ok(heavy.bot >= seat.bot - 3, `heavy pee should fill the seat (${heavy.bot} vs ${seat.bot})`);
		const width = st => {
			let lo = 1e9,
				hi = -1;
			for (const [x] of st.pts) {
				lo = Math.min(lo, x);
				hi = Math.max(hi, x);
			}
			return hi - lo;
		};
		const [wL, wM, wH] = [light, medium, heavy].map(width);
		assert.ok(wM > wL + 5, `medium should spread toward the walls (${wM} vs light ${wL})`);
		assert.ok(wH > wM + 3, `heavy should fill the walls (${wH} vs medium ${wM})`);
	});
	it("stains are dingy and darker toward the centre, with uneven blotchy edges", () => {
		const P = "imagepacks/au/clothes/under-lower/plussoil/dp/size15";
		const pee = stats(join(root, P, "full-heavy-pee.png"));
		const poo = stats(join(root, P, "full-heavy-poo.png"));
		assert.ok(pee.lum < 175, `pee should be a muted straw, not a bright neon yellow (${pee.lum})`);
		let pr = 0,
			pg = 0,
			pb = 0;
		for (const [, , , i] of pee.pts) {
			pr += pee.o.px[i * 4];
			pg += pee.o.px[i * 4 + 1];
			pb += pee.o.px[i * 4 + 2];
		}
		pr /= pee.pts.length;
		pg /= pee.pts.length;
		pb /= pee.pts.length;
		assert.ok(pg / pr >= 0.8, `pee should not be orange (rgb ${pr.toFixed(0)},${pg.toFixed(0)},${pb.toFixed(0)})`);
		assert.ok(pb / pg >= 0.35 && pb / pg <= 0.75, `pee should be a muted straw, not neon yellow (rgb ${pr.toFixed(0)},${pg.toFixed(0)},${pb.toFixed(0)})`);
		assert.ok(poo.lum < 90, `poo should be a dark muddy brown (${poo.lum})`);
		const coreVsEdge = st => {
			let core = 0,
				nC = 0,
				edge = 0,
				nE = 0,
				ringR = [];
			for (const [x, y, a, i] of st.pts) {
				const d = Math.hypot(x - st.cx, y - st.cy);
				const L = (st.o.px[i * 4] + st.o.px[i * 4 + 1] + st.o.px[i * 4 + 2]) / 3;
				if (d < 12) {
					core += L;
					nC++;
				} else if (d > 22) {
					edge += L;
					nE++;
				}
				if (a > 50 && a < 140) ringR.push(d);
			}
			const mean = ringR.reduce((s, v) => s + v, 0) / Math.max(1, ringR.length);
			const varr = ringR.reduce((s, v) => s + (v - mean) ** 2, 0) / Math.max(1, ringR.length);
			return { core: core / Math.max(1, nC), edge: edge / Math.max(1, nE), ringStd: Math.sqrt(varr), nC, nE, nRing: ringR.length };
		};
		const pe = coreVsEdge(pee);
		const po = coreVsEdge(poo);
		// Heavy pee now fills the seat too, so the geometric stain centroid is not the wettest spot.
		// The soaked interiors (lower half, high alpha) should be deeper than the paler upper fade.
		let upper = 0,
			nU = 0,
			deep = 0,
			nD = 0;
		const midY = (pee.top + pee.bot) / 2;
		const upperBand = pee.top + (pee.bot - pee.top) * 0.25;
		for (const [, y, a, i] of pee.pts) {
			const L = (pee.o.px[i * 4] + pee.o.px[i * 4 + 1] + pee.o.px[i * 4 + 2]) / 3;
			if (y < upperBand) {
				upper += L;
				nU++;
			} else if (y > midY && a > 140) {
				deep += L;
				nD++;
			}
		}
		upper /= Math.max(1, nU);
		deep /= Math.max(1, nD);
		assert.ok(nU > 20 && nD > 20 && deep < upper - 8, `soaked pee interiors ${deep} should be deeper than the paler upper fade ${upper}`);
		assert.ok(po.nC > 20 && po.nE > 20 && po.core < po.edge - 5, `poo core ${po.core} should be darker than edge ${po.edge}`);
		assert.ok(pe.ringStd > 6 && po.ringStd > 6, `edges should be blotchy, not a smooth oval (std ${pe.ringStd} ${po.ringStd})`);
	});
});
