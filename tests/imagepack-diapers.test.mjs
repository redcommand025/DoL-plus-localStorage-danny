/* Image-pack diaper sprites: every base diaper sprite (all states and sag tiers) has an Aoki Utage
 * (au / aumasc) counterpart at the pack's 2x size, listed in the manifest, and sized/placed to fit
 * the pack's paper doll (waistband at the pack briefs' waistband, centred on the pack body). */
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import zlib from "node:zlib";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const PACKS = ["au", "aumasc"];
const BASE = join(root, "img/clothes/under-lower");
const { loadSizeTable } = await import("../devTools/diaper-sag-sizes.mjs");
const SIZES = loadSizeTable();
const LEGACY = { plusdiaper: "plusdpm", plusdiapersmall: "plusdps", plusdiaperlarge: "plusdpl", plusclothdiaper: "pluscdm", pluspullup: "pluspum" };
const DIAPERS = readdirSync(BASE)
	.filter(d => d.startsWith("plus") && statSync(join(BASE, d)).isDirectory())
	.sort();

function walk(dir, rel = "") {
	const out = [];
	for (const name of readdirSync(dir)) {
		const p = join(dir, name);
		if (statSync(p).isDirectory()) out.push(...walk(p, rel + name + "/"));
		else if (name.endsWith(".png") && !name.startsWith("acc-") && !name.startsWith("soil-")) out.push(rel + name); // acc-* prints, soil-* soiled overlays (own tests)
	}
	return out;
}

/* Minimal decoder for 8-bit, non-interlaced RGBA or palette PNGs (what the game's sprites use).
 * Returns the alpha channel only. */
function decode(path) {
	const buf = readFileSync(path);
	const w = buf.readUInt32BE(16),
		h = buf.readUInt32BE(20),
		type = buf[25];
	assert.equal(buf[24], 8, `${path}: bit depth`);
	assert.ok(type === 6 || type === 3, `${path}: colour type ${type}`);
	assert.equal(buf[28], 0, `${path}: not interlaced`);
	const idat = [];
	let trns = Buffer.alloc(0);
	for (let o = 8; o < buf.length; ) {
		const len = buf.readUInt32BE(o),
			chunk = buf.toString("latin1", o + 4, o + 8);
		if (chunk === "IDAT") idat.push(buf.subarray(o + 8, o + 8 + len));
		if (chunk === "tRNS") trns = buf.subarray(o + 8, o + 8 + len);
		o += 12 + len;
	}
	const bpp = type === 6 ? 4 : 1;
	const raw = zlib.inflateSync(Buffer.concat(idat));
	const stride = w * bpp,
		px = Buffer.alloc(stride * h);
	for (let y = 0; y < h; y++) {
		const f = raw[y * (stride + 1)],
			line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
		for (let x = 0; x < stride; x++) {
			const a = x >= bpp ? px[y * stride + x - bpp] : 0,
				b = y ? px[(y - 1) * stride + x] : 0,
				c = x >= bpp && y ? px[(y - 1) * stride + x - bpp] : 0;
			const p = a + b - c,
				pa = Math.abs(p - a),
				pb = Math.abs(p - b),
				pc = Math.abs(p - c);
			const pred = [0, a, b, (a + b) >> 1, pa <= pb && pa <= pc ? a : pb <= pc ? b : c][f];
			px[y * stride + x] = (line[x] + pred) & 255;
		}
	}
	const alpha = Buffer.alloc(w * h);
	for (let i = 0; i < w * h; i++) alpha[i] = type === 6 ? px[i * 4 + 3] : px[i] < trns.length ? trns[px[i]] : 255;
	return { w, h, alpha };
}
/* Opaque bbox of the left frame, in units of a 256px frame. */
function bbox(path) {
	const { w, h, alpha } = decode(path);
	let x0 = 1e9,
		y0 = 1e9,
		x1 = -1,
		y1 = -1;
	for (let y = 0; y < h; y++)
		for (let x = 0; x < h; x++)
			if (alpha[y * w + x] > 127) {
				x0 = Math.min(x0, x);
				y0 = Math.min(y0, y);
				x1 = Math.max(x1, x);
				y1 = Math.max(y1, y);
			}
	const k = 256 / h;
	return { x0: x0 * k, y0: y0 * k, x1: (x1 + 1) * k, y1: (y1 + 1) * k, cx: ((x0 + x1 + 1) / 2) * k };
}
const size = path => {
	const b = readFileSync(path);
	return [b.readUInt32BE(16), b.readUInt32BE(20)];
};

const manifest = (() => {
	const sandbox = { window: {} };
	vm.runInNewContext(readFileSync(join(root, "game/03-JavaScript/imagepacks-manifest.js"), "utf8"), sandbox);
	return sandbox.window.ImagePackManifest;
})();
const listed = (pack, rel) => {
	const i = rel.lastIndexOf("/");
	return (manifest[pack].files[rel.slice(0, i)] || []).includes(rel.slice(i + 1));
};

describe("image-pack diaper sprites", () => {
	it("the generator script exists", () => {
		assert.ok(existsSync(join(root, "devTools/generate-pack-diapers.py")));
	});
	it("there are 20 diaper folders with 30 sprites each (5 states x unsagged + sag1-5)", () => {
		assert.equal(DIAPERS.length, 20);
		for (const d of DIAPERS) assert.equal(walk(join(BASE, d)).length, 30, d);
	});
	for (const pack of PACKS) {
		it(`${pack}: every base diaper sprite has a 2x pack sprite listed in the manifest`, () => {
			let n = 0;
			for (const d of DIAPERS) {
				for (const f of walk(join(BASE, d))) {
					const rel = `clothes/under-lower/${d}/${f}`;
					const packFile = join(root, "imagepacks", pack, rel);
					assert.ok(existsSync(packFile), `${pack}: missing ${rel}`);
					const [bw, bh] = size(join(root, "img", rel));
					assert.deepEqual(size(packFile), [bw * 2, bh * 2], `${pack}: ${rel} size`);
					assert.ok(listed(pack, rel), `${pack}: ${rel} not in manifest`);
					n++;
				}
			}
			assert.equal(n, 600);
		});
		it(`${pack}: every diaper has a picture for each concealment size it can reach (+ leak), listed in the manifest`, () => {
			let n = 0;
			for (const d of DIAPERS) {
				const row = SIZES[LEGACY[d] || d];
				for (const key of [...row.sizes.map(z => `size${z}`), `leak${row.overflow}`])
					for (const state of ["full", "frayed", "torn", "tattered", "penis"]) {
						const rel = `clothes/under-lower/${d}/${key}/${state}.png`;
						const file = join(root, "imagepacks", pack, rel);
						assert.ok(existsSync(file), `${pack}: missing ${rel}`);
						assert.deepEqual(size(file), [512, 256], `${pack}: ${rel} size`);
						assert.ok(listed(pack, rel), `${pack}: ${rel} not in manifest`);
						n++;
					}
			}
			assert.equal(n, 500); // 100 size/leak pictures x 5 states
		});
		it(`${pack}: a size looks the same in every model (identical within a category, same length/width across)`, () => {
			const byKey = {};
			for (const d of DIAPERS)
				for (const z of SIZES[LEGACY[d] || d].sizes) {
					const file = join(root, "imagepacks", pack, `clothes/under-lower/${d}/size${z}/full.png`);
					(byKey[z] ||= []).push({
						d,
						cat: d.startsWith("pluspu") ? "pu" : d.startsWith("pluscd") || d === "plusclothdiaper" ? "cd" : "dp",
						file,
						box: bbox(file),
						bytes: readFileSync(file),
					});
				}
			for (const [z, list] of Object.entries(byKey)) {
				for (const a of list)
					for (const b of list) {
						if (a.cat === b.cat) assert.ok(a.bytes.equals(b.bytes), `${pack} size${z}: ${a.d} and ${b.d} differ`);
						assert.ok(Math.abs(a.box.y1 - b.box.y1) <= 3, `${pack} size${z}: ${a.d} bottom ${a.box.y1} vs ${b.d} ${b.box.y1}`);
						assert.ok(Math.abs(a.box.x1 - a.box.x0 - (b.box.x1 - b.box.x0)) <= 6, `${pack} size${z}: ${a.d} vs ${b.d} width`);
					}
			}
		});
		it(`${pack}: bigger sizes hang lower; size 13 (Hyper at 75%) reaches the feet, 15 (full Hyper) is past them`, () => {
			const body = decode(join(root, "imagepacks", pack, "body/base-classic.png"));
			let feet = 0;
			for (let y = 0; y < body.h; y++) for (let x = 60; x < 150; x++) if (body.alpha[y * body.w + x] > 127) feet = y;
			const at = z => {
				const d =
					DIAPERS.find(x => x.startsWith("plusdp") && SIZES[x] && SIZES[x].sizes.includes(z)) || DIAPERS.find(x => SIZES[LEGACY[x] || x].sizes.includes(z));
				return bbox(join(root, "imagepacks", pack, `clothes/under-lower/${d}/size${z}/full.png`)).y1;
			};
			for (let z = 2; z <= 15; z++) assert.ok(at(z) > at(z - 1), `${pack}: size${z} bottom ${at(z)} not below size${z - 1} ${at(z - 1)}`);
			assert.ok(Math.abs(at(13) - feet) <= 4, `${pack}: size13 bottom ${at(13)} vs feet ${feet}`);
			assert.ok(at(15) > feet + 10, `${pack}: size15 ${at(15)} not past the feet ${feet}`);
			assert.ok(at(8) < feet - 40, `${pack}: dry Hyper (size 8) not short`);
			const hyper = k => bbox(join(root, "imagepacks", pack, `clothes/under-lower/plusdphyper/${k}/full.png`)).y1;
			assert.ok(hyper("leak15") >= hyper("size15"), `${pack}: leak15 shorter than size15`);
		});
		it(`${pack}: diapers are drawn in the pack's pixel style (hard edges, both frames identical)`, () => {
			for (const d of DIAPERS) {
				for (const f of ["full.png", "torn.png", "sag3/full.png"]) {
					const { w, h, alpha } = decode(join(root, "imagepacks", pack, `clothes/under-lower/${d}/${f}`));
					let soft = 0,
						diff = 0;
					for (let y = 0; y < h; y++)
						for (let x = 0; x < w / 2; x++) {
							const a = alpha[y * w + x];
							if (a !== 0 && a !== 255) soft++;
							if (a !== alpha[y * w + x + w / 2]) diff++;
						}
					assert.equal(soft, 0, `${pack} ${d}/${f}: semi-transparent pixels`);
					assert.equal(diff, 0, `${pack} ${d}/${f}: frames differ`);
				}
			}
		});
		it(`${pack}: diapers sit on the pack body (waistband and centre match the pack briefs)`, () => {
			const briefs = bbox(join(root, "imagepacks", pack, "clothes/under-lower/briefs/full.png"));
			const baseBriefs = bbox(join(root, "img/clothes/under-lower/briefs/full.png"));
			for (const d of DIAPERS) {
				const rel = `clothes/under-lower/${d}/full.png`;
				const base = bbox(join(root, "img", rel));
				const out = bbox(join(root, "imagepacks", pack, rel));
				// the diaper's rise above the briefs' waistband is kept (scaled to the pack), within a few px
				const wantTop = briefs.y0 + (base.y0 - baseBriefs.y0) * 1.3;
				assert.ok(Math.abs(out.y0 - wantTop) <= 5, `${pack} ${d}: top ${out.y0} vs ${wantTop.toFixed(1)}`);
				assert.ok(Math.abs(out.cx - briefs.cx - (base.cx - baseBriefs.cx) * 1.7) <= 5, `${pack} ${d}: centre ${out.cx} vs briefs ${briefs.cx}`);
				// unscaled base art drawn over this pack would sit far lower: the generated sprite must not
				assert.ok(out.y0 < base.y0 - 15, `${pack} ${d}: not moved up`);
			}
		});
	}
});
