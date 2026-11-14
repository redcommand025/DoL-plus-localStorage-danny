/* Pack Plus diapers must sit on the pack waist and stay inside the hip line so they
 * never cover the idle hands. Sag still drops toward the feet as size increases. */
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const PACKS = ["au", "aumasc"];
const { loadSizeTable } = await import("../devTools/diaper-sag-sizes.mjs");
const SIZES = loadSizeTable();
const LEGACY = { plusdiaper: "plusdpm", plusdiapersmall: "plusdps", plusdiaperlarge: "plusdpl", plusclothdiaper: "pluscdm", pluspullup: "pluspum" };
const BASE = join(root, "img/clothes/under-lower");
const DIAPERS = readdirSync(BASE)
	.filter(d => d.startsWith("plus") && statSync(join(BASE, d)).isDirectory())
	.sort();

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

function opaque(img, x, y) {
	return img.alpha[y * img.w + x] > 127;
}

/** Outer left..right of the torso/legs in the central band (first frame). */
function torsoSpan(body, y) {
	const fw = body.h; // pack frames are 256x256, two abreast
	let l = -1,
		r = -1;
	for (let x = 70; x < 140 && x < fw; x++)
		if (opaque(body, x, y)) {
			if (l < 0) l = x;
			r = x + 1;
		}
	return l < 0 ? null : { l, r };
}

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
	return { x0, y0, x1: x1 + 1, y1: y1 + 1, cx: (x0 + x1 + 1) / 2, w: x1 + 1 - x0 };
}

function widthAt(path, y) {
	const { w, h, alpha } = decode(path);
	let l = -1,
		r = -1;
	for (let x = 0; x < h; x++)
		if (alpha[y * w + x] > 127) {
			if (l < 0) l = x;
			r = x + 1;
		}
	return l < 0 ? 0 : r - l;
}

function modelForSize(z) {
	return DIAPERS.find(d => d.startsWith("plusdp") && SIZES[d] && SIZES[d].sizes.includes(z)) || DIAPERS.find(d => SIZES[LEGACY[d] || d].sizes.includes(z));
}

describe("pack diaper fit on the Aoki Utage body", () => {
	for (const pack of PACKS) {
		const body = decode(join(root, "imagepacks", pack, "body/base-classic.png"));
		const left = decode(join(root, "imagepacks", pack, "body/left-arm-idle-classic.png"));
		const right = decode(join(root, "imagepacks", pack, "body/right-arm-idle-classic.png"));
		const briefs = bbox(join(root, "imagepacks", pack, "clothes/under-lower/briefs/full.png"));
		const boxers = bbox(join(root, "imagepacks", pack, "clothes/under-lower/boxers/full.png"));
		const fw = body.h;

		// visible hands: idle-arm pixels more than 2px outside the torso envelope
		const hand = Buffer.alloc(body.h * fw);
		let handPx = 0;
		for (let y = 0; y < body.h; y++) {
			const span = torsoSpan(body, y);
			if (!span) continue;
			for (let x = 0; x < fw; x++) {
				const arm = opaque(left, x, y) || opaque(right, x, y);
				if (arm && (x < span.l - 2 || x >= span.r + 2)) {
					hand[y * fw + x] = 1;
					handPx++;
				}
			}
		}

		it(`${pack}: waistband sits on the pack waist and matches the hip width`, () => {
			assert.ok(handPx > 100, `${pack}: expected idle hands`);
			for (const d of DIAPERS) {
				const row = SIZES[LEGACY[d] || d];
				for (const key of [...row.sizes.map(z => `size${z}`), `leak${row.overflow}`]) {
					const file = join(root, "imagepacks", pack, `clothes/under-lower/${d}/${key}/full.png`);
					const box = bbox(file);
					assert.ok(box.y0 >= briefs.y0 - 2 && box.y0 <= briefs.y0, `${pack} ${d}/${key}: waistband row ${box.y0} vs briefs ${briefs.y0}`);
					assert.ok(Math.abs(box.cx - briefs.cx) <= 2, `${pack} ${d}/${key}: centre ${box.cx} vs briefs ${briefs.cx}`);
					const ww = widthAt(file, box.y0 + 1);
					assert.ok(Math.abs(ww - boxers.w) <= 4, `${pack} ${d}/${key}: waist width ${ww} vs boxers ${boxers.w}`);
				}
			}
		});

		it(`${pack}: no diaper pixels cover the idle hands`, () => {
			for (const d of DIAPERS) {
				const row = SIZES[LEGACY[d] || d];
				for (const key of [...row.sizes.map(z => `size${z}`), `leak${row.overflow}`]) {
					const { w, h, alpha } = decode(join(root, "imagepacks", pack, `clothes/under-lower/${d}/${key}/full.png`));
					let hit = 0;
					for (let y = 0; y < h; y++) for (let x = 0; x < fw; x++) if (alpha[y * w + x] > 127 && hand[y * fw + x]) hit++;
					assert.ok(hit <= 4, `${pack} ${d}/${key}: ${hit} pixels overlap the hands`);
				}
			}
		});

		it(`${pack}: bigger sizes still hang lower; size 13 reaches the feet, 15 is past them`, () => {
			let feet = 0;
			for (let y = 0; y < body.h; y++) for (let x = 60; x < 150; x++) if (opaque(body, x, y)) feet = y;
			const at = z => bbox(join(root, "imagepacks", pack, `clothes/under-lower/${modelForSize(z)}/size${z}/full.png`)).y1;
			for (let z = 2; z <= 15; z++) assert.ok(at(z) > at(z - 1), `${pack}: size${z} bottom ${at(z)} not below size${z - 1} ${at(z - 1)}`);
			assert.ok(Math.abs(at(13) - feet) <= 4, `${pack}: size13 bottom ${at(13)} vs feet ${feet}`);
			assert.ok(at(15) > feet + 10, `${pack}: size15 ${at(15)} not past the feet ${feet}`);
			assert.ok(at(8) < feet - 40, `${pack}: dry Hyper (size 8) not short`);
		});
	}
});
