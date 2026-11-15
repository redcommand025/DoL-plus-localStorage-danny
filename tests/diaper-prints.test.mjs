/* Diaper prints: native clothing colour_options and pattern_options, chosen in the shop like other
 * patterned clothes, stored on item.pattern / item.colour and drawn on the native secondary pattern
 * layer (acc-<integrity>-<pattern>.png), with overlays for every image-pack size picture and every base
 * sag tier that stretch with the diaper's silhouette. */
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
	const NAMES = [
		"Starry Dreams",
		"Dino Stomp",
		"Paw Parade",
		"Bunny Meadow",
		"Little Crowns",
		"Croc Smiles",
		"Puppy Pals",
		"Candy Hearts",
		"Rainbow Clouds",
		"Pastel Plaid",
		"Photo Reel",
		"Autumn Leaves",
		"Ocean Waves",
		"Galaxy Swirl",
		"Polka Pop",
	];
	const COLOURS = ["black", "blue", "brown", "green", "pink", "purple", "red", "pale tangerine", "teal", "pale white", "pale yellow", "custom"];

	it("15 original prints (10 themed, 5 unique) with names and file ids, no third-party names", () => {
		const { window } = load();
		const defs = window.plusDiaperPatternDefs;
		assert.equal(defs.length, 15);
		assert.equal(defs.filter(d => d.unique).length, 5);
		assert.deepEqual(
			[...defs].map(d => d.name),
			NAMES
		);
		assert.equal(typeof window.plusDiaperPatternBuy, "undefined");
		for (const d of defs) {
			assert.equal(d.file, d.id.replace(/ /g, "-"));
			assert.match(d.file, /^[a-z0-9-]+$/);
			assert.equal(d.price, undefined);
		}
		const banned = /peekabu|littlepawz|little kings|alphagator|dinorawr|bunnyhopps|tinytails|huskies|cushies|abu/i;
		for (const d of defs) assert.doesNotMatch(`${d.id} ${d.name} ${d.desc}`, banned);
	});

	it("every Plus diaper has the native colour and full pattern pickers", () => {
		const { window, setup } = load();
		const plus = setup.clothes.under_lower.filter(c => c.modder === "plusneeds");
		assert.ok(plus.length >= 15);
		const patterns = window.plusDiaperPatternOptions();
		assert.deepEqual([...patterns], ["plain", ...[...window.plusDiaperPatternDefs].map(d => d.id)]);
		assert.equal(patterns.length, 16);
		assert.deepEqual([...window.plusDiaperColourOptions], COLOURS);
		for (const c of plus) {
			assert.equal(c.pattern_layer, "secondary");
			assert.equal(c.accessory_integrity_img, 1);
			assert.equal(c.pattern_caption, true);
			assert.equal(c.colour_sidebar, 1);
			assert.deepEqual([...c.pattern_options], [...patterns]);
			assert.deepEqual([...c.colour_options], COLOURS);
			assert.deepEqual([...c.accessory_colour_options], []);
		}
	});

	it("pharmacy sells the same packs as the clothing shop; adult stays oversized", () => {
		const { window } = load();
		const clothing = window.plusDiaperPackList("clothing");
		const pharmacy = window.plusDiaperPackList("pharmacy");
		assert.ok(clothing.length > 0);
		assert.deepEqual(
			pharmacy.map(p => p.name + "@" + p.count),
			clothing.map(p => p.name + "@" + p.count)
		);
		assert.ok(clothing.every(p => !/Hyper|Max|Ultra|Extra Large/.test(p.name)));
		window.plusDiaperAdultShopOpen = () => true;
		const adult = window.plusDiaperPackList("adult");
		assert.ok(adult.some(p => /Hyper/.test(p.name)));
		assert.ok(adult.every(p => /Extra Large|Ultra|Max|Hyper/.test(p.name)));
		const adultKeys = new Set(adult.map(p => p.name + "@" + p.count));
		assert.ok(clothing.every(p => !adultKeys.has(p.name + "@" + p.count)));
	});

	it("buying a pack applies the chosen colour and pattern, or pale white and plain by default", () => {
		const { window, V } = load({ money: 100000 });
		const count = [1, 5, 10].find(n => window.plusDiaperPackPrice(MED, n));
		assert.ok(window.plusDiaperBuyPack(MED, count).ok);
		assert.ok(V.wardrobe.under_lower.length > 0);
		assert.ok(V.wardrobe.under_lower.every(it => it.colour === "pale white" && it.pattern === "plain" && window.plusDiaperPatternOf(it) === 0));
		const before = V.wardrobe.under_lower.length;
		const r = window.plusDiaperBuyPack(MED, count, { colour: "pink", pattern: "dino stomp" });
		assert.ok(r.ok);
		assert.equal(r.colour, "pink");
		assert.equal(r.pattern, "dino stomp");
		const fresh = V.wardrobe.under_lower.slice(before);
		assert.ok(
			fresh.length === count && fresh.every(it => it.colour === "pink" && it.pattern === "dino stomp" && window.plusDiaperPatternOf(it) === "dino stomp")
		);
		const unknown = window.plusDiaperBuyPack(MED, count, { colour: "chartreuse", pattern: "not a print" });
		assert.ok(unknown.ok);
		assert.equal(unknown.colour, "pale white");
		assert.equal(unknown.pattern, "plain");
	});

	it("existing prints stay on the item; leftover print-ownership state is cleared", () => {
		const { window, item, V, setup } = load();
		const printed = item(HYPER);
		printed.pattern = "paw parade";
		const plain = item(MED);
		plain.pattern = "plain";
		const junk = item(HYPER);
		junk.pattern = "not a print";
		V.wardrobe.under_lower.push(printed, plain, junk);
		V.worn.under_lower = item(HYPER);
		V.worn.under_lower.pattern = "galaxy swirl";
		V.plusDiaperPatterns = ["paw parade", "galaxy swirl"];
		V.plusDiaperPatternNext = "paw parade";
		assert.equal(window.plusDiaperPatternMigrate(), 1);
		assert.equal(V.plusDiaperPatternNative, 1);
		assert.equal(V.plusDiaperPatterns, undefined);
		assert.equal(V.plusDiaperPatternNext, undefined);
		assert.equal(window.plusDiaperPatternOf(printed), "paw parade");
		assert.equal(printed.pattern, "paw parade");
		assert.equal(window.plusDiaperPatternOf(plain), 0);
		window.plusDiaperInit(junk);
		assert.equal(junk.pattern, "plain");
		assert.equal(window.plusDiaperPatternOf(V.worn.under_lower), "galaxy swirl");
		assert.equal(window.plusDiaperPatternMigrate(), 0, "idempotent");
		assert.equal(V.plusDiaperPatterns, undefined);
		const c = setup.clothes.under_lower.find(x => x.modder === "plusneeds");
		assert.deepEqual([...c.pattern_options], [...window.plusDiaperPatternOptions()]);
	});

	it("plusDiaperPatternSync keeps the full native list on every Plus diaper", () => {
		const { window, setup } = load();
		const c = setup.clothes.under_lower.find(x => x.modder === "plusneeds");
		c.pattern_options = ["plain"];
		c.colour_options = ["pale white"];
		c.colour_sidebar = 0;
		assert.ok(window.plusDiaperPatternSync() > 0);
		assert.deepEqual([...c.pattern_options], [...window.plusDiaperPatternOptions()]);
		assert.deepEqual([...c.colour_options], [...window.plusDiaperColourOptions]);
		assert.equal(c.colour_sidebar, 1);
	});

	it("shop mannequin previews the selected dry pattern; the doll uses the worn diaper's fill", () => {
		const { window, item, V } = load();
		const wet = item(HYPER);
		wet.plusMl = wet.plusCapMl * 0.75;
		wet.pattern = "dino stomp";
		V.worn.under_lower = wet;
		const setupItem = { name: HYPER, variable: "plusdphyper", modder: "plusneeds", pattern_layer: "secondary", type: ["normal"] };
		const mannequin = window.plusDiaperCanvasItem({ mannequin: true }, { setup: setupItem, index: wet.index, pattern: "polka pop", colour: "pink" });
		assert.equal(mannequin.pattern, "polka pop");
		assert.equal(mannequin.colour, "pink");
		assert.equal(mannequin.plusMl, 0);
		assert.equal(window.plusDiaperPatternOf(mannequin), "polka pop");
		assert.equal(window.plusSagSizeKey(mannequin), "size6");
		assert.equal(window.plusDiaperSoil(mannequin), null);
		const doll = window.plusDiaperCanvasItem({ mannequin: false }, { setup: setupItem, index: wet.index, pattern: "polka pop", colour: "pink" });
		assert.equal(doll, wet);
		assert.equal(window.plusDiaperPatternOf(doll), "dino stomp");
		assert.equal(window.plusSagSizeKey(doll), "size12");
		assert.equal(window.plusDiaperSoil(doll).key, "heavy-pee");
	});
});

describe("diaper prints: picture routing", () => {
	it("image pack: shared per-category overlay for the diaper's size picture; penis uses full", () => {
		const packed = new Set();
		const { window, item } = load({ imagePacks: { resolve: s => (packed.has(s) ? "imagepacks/au/" + s.slice(4) : s) } });
		const it = item(HYPER);
		it.plusMl = it.plusCapMl * 0.75;
		const want = "img/clothes/under-lower/pluspatterns/dp/size12/torn-dino-stomp.png";
		packed.add(want);
		assert.equal(window.plusSagSrc("img/clothes/under-lower/plusdphyper/acc-torn-dino-stomp.png", it), want);
		packed.add("img/clothes/under-lower/pluspatterns/dp/size12/full-dino-stomp.png");
		assert.equal(
			window.plusSagSrc("img/clothes/under-lower/plusdphyper/acc-penis-dino-stomp.png", it),
			"img/clothes/under-lower/pluspatterns/dp/size12/full-dino-stomp.png"
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
		assert.match(acc, /plusDiaperCanvasItem/);
		const w = readFileSync(join(root, "game/ModLI/plus-needs/widgets.twee"), "utf8");
		assert.match(w, /:: Plus Needs Diaper Customise/);
		assert.match(w, /<<printShopColourOptions>>/);
		assert.match(w, /<<mannequin "under_lower"/);
		assert.doesNotMatch(w, /plusDiaperPrints|Plus Needs Diaper Print Buy|Plus Needs Diaper Print Apply/);
		const shop = readFileSync(join(root, "game/overworld-town/loc-shop/clothing-v2.twee"), "utf8");
		assert.match(shop, /pattern_options.length gt 1/);
		assert.match(shop, /printShopColourOptions/);
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
