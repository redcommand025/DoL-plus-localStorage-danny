/* Diaper prints: bought at the diaper shops, stored on the native clothing `pattern` field and drawn on the
 * native secondary pattern layer (acc-<integrity>-<pattern>.png), with overlays for every image-pack size
 * picture and every base sag tier that stretch with the diaper's silhouette. */
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
	return { w, h, alpha: i => px[i * 4 + 3], grey: i => px[i * 4] };
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

describe("diaper prints: shop and native pattern field", () => {
	it("15 original prints (10 themed, 5 unique) with prices, names and file ids", () => {
		const { window } = load();
		const defs = window.plusDiaperPatternDefs;
		assert.equal(defs.length, 15);
		assert.equal(defs.filter(d => d.unique).length, 5);
		for (const d of defs) {
			assert.ok(d.price >= 500 && d.price <= 2000, d.id);
			assert.equal(d.file, d.id.replace(/ /g, "-"));
			assert.match(d.file, /^[a-z0-9-]+$/);
		}
		const banned = /peekabu|littlepawz|little kings|alphagator|dinorawr|bunnyhopps|tinytails|huskies|cushies|abu/i;
		for (const d of defs) assert.doesNotMatch(`${d.id} ${d.name} ${d.desc}`, banned);
	});

	it("buying unlocks a print once, takes the money, and refuses without enough money", () => {
		const { window, V } = load({ money: 1000 });
		assert.deepEqual(window.plusDiaperPatternBuy("galaxy swirl").reason, "money");
		assert.equal(V.money, 1000);
		const r = window.plusDiaperPatternBuy("polka pop");
		assert.ok(r.ok);
		assert.equal(V.money, 300);
		assert.ok(window.plusDiaperPatternOwned("polka pop"));
		assert.equal(window.plusDiaperPatternBuy("polka pop").reason, "owned");
		assert.equal(window.plusDiaperPatternBuy("nope").reason, "item");
		assert.deepEqual([...V.plusDiaperPatterns], ["polka pop"]);
	});

	it("native pattern_options of every Plus diaper are plain + owned prints", () => {
		const { window, setup } = load();
		const plus = setup.clothes.under_lower.filter(c => c.modder === "plusneeds");
		assert.ok(plus.length >= 15);
		for (const c of plus) {
			assert.equal(c.pattern_layer, "secondary");
			assert.equal(c.accessory_integrity_img, 1);
			assert.deepEqual([...c.pattern_options], ["plain"]);
		}
		window.plusDiaperPatternBuy("dino stomp");
		window.plusDiaperPatternBuy("candy hearts");
		for (const c of plus) assert.deepEqual([...c.pattern_options], ["plain", "dino stomp", "candy hearts"]);
	});

	it("packs bought after choosing a print come printed; plain otherwise", () => {
		const { window, V } = load({ money: 100000 });
		assert.equal(window.plusDiaperPatternSetNext("croc smiles"), false, "not owned");
		window.plusDiaperBuyPack(MED, window.plusDiaperPackPrice(MED, 1) ? 1 : 10);
		assert.ok(V.wardrobe.under_lower.length > 0);
		assert.ok(V.wardrobe.under_lower.every(it => window.plusDiaperPatternOf(it) === 0));
		window.plusDiaperPatternBuy("croc smiles");
		assert.ok(window.plusDiaperPatternSetNext("croc smiles"));
		const before = V.wardrobe.under_lower.length;
		const counts = [1, 5, 10, 20, 30, 40, 50].filter(n => window.plusDiaperPackPrice(MED, n));
		assert.ok(window.plusDiaperBuyPack(MED, counts[0]).ok);
		const fresh = V.wardrobe.under_lower.slice(before);
		assert.ok(fresh.length > 0 && fresh.every(it => it.pattern === "croc smiles" && window.plusDiaperPatternOf(it) === "croc smiles"));
	});

	it("prints go on clean diapers only, need ownership, and can be removed", () => {
		const { window, item, V } = load();
		const it = item(HYPER);
		assert.equal(window.plusDiaperPatternApply(it, "paw parade"), false, "not owned");
		window.plusDiaperPatternBuy("paw parade");
		assert.ok(window.plusDiaperPatternApply(it, "paw parade"));
		assert.equal(window.plusDiaperPatternOf(it), "paw parade");
		const wet = item(HYPER);
		wet.plusMl = 50;
		assert.equal(window.plusDiaperPatternApply(wet, "paw parade"), false);
		assert.ok(window.plusDiaperPatternApply(it, ""));
		assert.equal(it.pattern, "plain");
		assert.equal(window.plusDiaperPatternOf(it), 0);
		V.wardrobe.under_lower.push(item(HYPER), item(HYPER), wet);
		assert.equal(window.plusDiaperPatternApplySpares("paw parade"), 2);
		assert.equal(window.plusDiaperPatternOf({ ...it, pattern: "plain" }), 0);
	});
});

describe("diaper prints: picture routing", () => {
	it("image pack: shared per-category overlay for the diaper's size picture; penis uses full", () => {
		const packed = new Set();
		const { window, item } = load({ imagePacks: { resolve: s => (packed.has(s) ? "imagepacks/au/" + s.slice(4) : s) } });
		const it = item(HYPER);
		it.plusMl = it.plusCapMl * 0.75;
		const want = "img/clothes/under-lower/pluspatterns/dp/size13/torn-dino-stomp.png";
		packed.add(want);
		assert.equal(window.plusSagSrc("img/clothes/under-lower/plusdphyper/acc-torn-dino-stomp.png", it), want);
		packed.add("img/clothes/under-lower/pluspatterns/dp/size13/full-dino-stomp.png");
		assert.equal(
			window.plusSagSrc("img/clothes/under-lower/plusdphyper/acc-penis-dino-stomp.png", it),
			"img/clothes/under-lower/pluspatterns/dp/size13/full-dino-stomp.png"
		);
		it.plusOverflow = 1;
		packed.add("img/clothes/under-lower/pluspatterns/dp/leak15/full-dino-stomp.png");
		assert.equal(
			window.plusSagSrc("img/clothes/under-lower/plusdphyper/acc-full-dino-stomp.png", it),
			"img/clothes/under-lower/pluspatterns/dp/leak15/full-dino-stomp.png"
		);
	});

	it("no image pack: the base overlay for the diaper folder's sag tier", () => {
		const { window, item } = load();
		const it = item(HYPER);
		const src = "img/clothes/under-lower/plusdphyper/acc-full-polka-pop.png";
		assert.equal(window.plusSagSrc(src, it), src);
		it.plusMl = it.plusCapMl;
		assert.equal(window.plusSagSrc(src, it), "img/clothes/under-lower/plusdphyper/sag4/acc-full-polka-pop.png");
		assert.equal(
			window.plusSagSrc("img/clothes/under-lower/plusdphyper/acc-penis-polka-pop.png", it),
			"img/clothes/under-lower/plusdphyper/sag4/acc-full-polka-pop.png"
		);
	});

	it("the paper doll's accessory layers show plus prints through plusSagSrc", () => {
		const cm = readFileSync(join(root, "game/04-Variables/canvasmodel-main.js"), "utf8");
		const acc = cm.slice(cm.indexOf("under_lower_acc"), cm.indexOf("under_lower_penis_acc") + 3000);
		assert.match(acc, /plusDiaperPatternOf/);
		assert.match(acc, /plusSagSrc/);
		const w = readFileSync(join(root, "game/ModLI/plus-needs/widgets.twee"), "utf8");
		assert.match(w, /<<plusDiaperPrints>>/);
		assert.match(w, /:: Plus Needs Diaper Print Buy/);
		assert.match(w, /:: Plus Needs Diaper Print Apply/);
	});
});

describe("diaper prints: overlay art", () => {
	const { window } = load();
	const files = window.plusDiaperPatternDefs.map(d => d.file);
	const keys = catKeys();
	for (const pack of ["au", "aumasc"]) {
		it(`${pack}: an overlay for every category size picture x integrity x print, in the manifest`, () => {
			let n = 0;
			for (const [cat, ks] of Object.entries(keys))
				for (const key of Object.keys(ks))
					for (const integ of INTEGRITY)
						for (const f of files) {
							const rel = `clothes/under-lower/pluspatterns/${cat}/${key}/${integ}-${f}.png`;
							assert.ok(existsSync(join(root, "imagepacks", pack, rel)), rel);
							assert.ok(listed(pack, rel), `${rel} not in manifest`);
							n++;
						}
			assert.equal(n, Object.values(keys).reduce((s, k) => s + Object.keys(k).length, 0) * 4 * 15);
		});
	}
	it("base: an overlay for every shop diaper x sag tier x integrity x print", () => {
		let n = 0;
		for (const v of Object.keys(SIZES))
			for (const sub of ["", "sag1/", "sag2/", "sag3/", "sag4/", "sag5/"])
				for (const integ of INTEGRITY)
					for (const f of files) {
						assert.ok(existsSync(join(root, "img/clothes/under-lower", v, `${sub}acc-${integ}-${f}.png`)), `${v}/${sub}${integ}-${f}`);
						n++;
					}
		assert.equal(n, 15 * 6 * 4 * 15);
	});
	it("overlays have hard alpha, stay inside the garment, and leave rips and outlines unprinted", () => {
		const check = (ov, spr, line) => {
			const o = rgba(ov),
				s = rgba(spr);
			assert.deepEqual([o.w, o.h], [s.w, s.h]);
			let printed = 0;
			for (let i = 0; i < o.w * o.h; i++) {
				const a = o.alpha(i);
				assert.ok(a === 0 || a === 255, `${ov}: soft alpha`);
				if (a) {
					assert.ok(s.alpha(i) > 0, `${ov}: outside the garment`);
					assert.ok(s.grey(i) > line && s.grey(i) <= 170, `${ov}: printed over an outline, rip, band or tape`);
					printed++;
				}
			}
			assert.ok(printed > 20, `${ov}: nearly empty`);
		};
		for (const [cat, ks] of Object.entries(keys))
			for (const [key, v] of Object.entries(ks))
				for (const integ of INTEGRITY)
					for (const f of ["polka-pop", "galaxy-swirl"])
						check(
							join(root, "imagepacks/au/clothes/under-lower/pluspatterns", cat, key, `${integ}-${f}.png`),
							join(root, "imagepacks/au/clothes/under-lower", v, key, `${integ}.png`),
							106
						);
		for (const v of Object.keys(SIZES))
			for (const sub of ["", "sag4/"])
				check(
					join(root, "img/clothes/under-lower", v, `${sub}acc-tattered-pastel-plaid.png`),
					join(root, "img/clothes/under-lower", v, `${sub}tattered.png`),
					100
				);
	});
	it("prints stretch with sag: motifs are taller on a sagged diaper than on a dry one", () => {
		/* mean vertical run of printed pixels (polka dots) per column */
		const runs = p => {
			const o = rgba(p);
			const W = o.w / 2;
			let total = 0,
				count = 0;
			for (let x = 0; x < W; x++) {
				let r = 0;
				for (let y = 0; y <= o.h; y++) {
					const on = y < o.h && o.alpha(y * o.w + x) > 0;
					if (on) r++;
					else if (r) {
						total += r;
						count++;
						r = 0;
					}
				}
			}
			return total / count;
		};
		const P = "imagepacks/au/clothes/under-lower/pluspatterns/dp";
		const dry = runs(join(root, P, "size3/full-polka-pop.png"));
		const sag = runs(join(root, P, "size15/full-polka-pop.png"));
		assert.ok(sag > dry * 1.25, `dry ${dry.toFixed(2)} vs sagged ${sag.toFixed(2)}`);
		const bdry = runs(join(root, "img/clothes/under-lower/plusdphyper/acc-full-polka-pop.png"));
		const bsag = runs(join(root, "img/clothes/under-lower/plusdphyper/sag4/acc-full-polka-pop.png"));
		assert.ok(bsag > bdry * 1.15, `base dry ${bdry.toFixed(2)} vs sagged ${bsag.toFixed(2)}`);
	});
});
