import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const artifacts = join(root, "tests/artifacts");
mkdirSync(artifacts, { recursive: true });

function pngInfo(buf, label) {
	assert.equal(buf[0], 0x89, `${label} missing PNG signature`);
	assert.equal(buf.toString("ascii", 1, 4), "PNG", `${label} not a PNG`);
	const width = buf.readUInt32BE(16);
	const height = buf.readUInt32BE(20);
	const sha = createHash("sha256").update(buf).digest("hex");
	return { width, height, sha, bytes: buf.length, label };
}

describe("paperdoll sag sprites via official paths", () => {
	it("resolves distinct loadable PNGs for empty, half-full, and overflowing plusdpm", () => {
		const files = {
			empty: join(root, "img/clothes/under-lower/plusdpm/full.png"),
			sag2: join(root, "img/clothes/under-lower/plusdpm/sag2/full.png"),
			sag5: join(root, "img/clothes/under-lower/plusdpm/sag5/full.png"),
			penisEmpty: join(root, "img/clothes/under-lower/plusdpm/penis.png"),
			penisSag5: join(root, "img/clothes/under-lower/plusdpm/sag5/penis.png"),
		};
		for (const [k, p] of Object.entries(files)) assert.ok(existsSync(p), `missing ${k}: ${p}`);
		const infos = {};
		for (const [k, p] of Object.entries(files)) {
			const buf = readFileSync(p);
			infos[k] = pngInfo(buf, k);
			copyFileSync(p, join(artifacts, `plusdpm-${k}.png`));
		}
		assert.equal(infos.empty.width, infos.sag2.width);
		assert.equal(infos.empty.height, infos.sag2.height);
		assert.notEqual(infos.empty.sha, infos.sag2.sha, "half-full sag sprite must differ from empty visually");
		assert.notEqual(infos.empty.sha, infos.sag5.sha, "overflow sag sprite must differ from empty visually");
		assert.notEqual(infos.penisEmpty.sha, infos.penisSag5.sha);
		writeFileSync(
			join(artifacts, "plusdpm-sprite-hashes.json"),
			JSON.stringify(
				{
					note: "These are decoded sprite-file hashes for official paperdoll paths, not a composite character screenshot.",
					paths: {
						empty: "img/clothes/under-lower/plusdpm/full.png",
						half: "img/clothes/under-lower/plusdpm/sag2/full.png",
						overflow: "img/clothes/under-lower/plusdpm/sag5/full.png",
					},
					infos,
				},
				null,
				2
			)
		);
	});

	it("keeps official genlayer clothing src construction and native sag rewrite", () => {
		const src = readFileSync(join(root, "game/04-Variables/canvasmodel-main.js"), "utf8");
		const start = src.indexOf("function genlayer_clothing_main");
		const chunk = src.slice(start, start + 1800);
		assert.match(chunk, /img\/clothes\/\$\{folder\}\/\$\{setup\.variable\}/);
		assert.match(chunk, /plusSagSrc\(src, wornItem\)/);
		assert.doesNotMatch(chunk, /plusSagHooked/);
	});
});

it("compiled paperdoll layer srcfn rewrites sag without monkeypatching the layer", async function () {
	const html = join(root, "Degrees of Lewdity.html");
	if (!existsSync(html)) this.skip();
	const { pathToFileURL } = await import("node:url");
	const { createRequire } = await import("node:module");
	const require = createRequire(import.meta.url);
	let puppeteer;
	try {
		puppeteer = require("puppeteer-core");
	} catch (e) {
		puppeteer = require("/tmp/dol-diag/node_modules/puppeteer-core");
	}
	const browser = await puppeteer.launch({
		executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
		headless: "new",
		args: ["--no-sandbox", "--disable-gpu", "--allow-file-access-from-files"],
	});
	const page = await browser.newPage();
	try {
		await page.goto(pathToFileURL(html).href, { waitUntil: "domcontentloaded", timeout: 180000 });
		await new Promise(r => setTimeout(r, 8000));
		const result = await page.evaluate(() => {
			const M = window.Renderer && window.Renderer.CanvasModels && window.Renderer.CanvasModels.main;
			const layer = M && M.layers && M.layers.under_lower;
			const penis = M && M.layers && M.layers.under_lower_penis;
			const State = window.SugarCube && window.SugarCube.State;
			const V = State && State.variables;
			const item = window.plusDiaperItems ? window.plusDiaperItems().find(i => i.name === "plastic-backed diaper (Medium)") : null;
			if (item && window.plusDiaperInit) window.plusDiaperInit(item);
			if (item) {
				item.plusMl = item.plusCapMl * 0.5;
				item.plusOverflow = 0;
			}
			if (V) {
				V.worn = V.worn || {};
				V.worn.under_lower = item;
			}
			const options = {
				show_clothes: true,
				hood_down: false,
				alt_override: false,
				worn: {
					under_lower: {
						index: 1,
						integrity: "full",
						alt: "",
						pattern: 0,
						setup: item || { variable: "plusdpm", mainImage: 1, altdisabled: [] },
					},
				},
			};
			if (options.worn.under_lower.setup && !options.worn.under_lower.setup.altdisabled) options.worn.under_lower.setup.altdisabled = [];
			return {
				hasLayer: !!(layer && typeof layer.srcfn === "function"),
				monkeypatched: !!(M && M.plusSagHooked),
				src: layer && layer.srcfn ? layer.srcfn(options) : null,
				penisSrc: penis && penis.srcfn ? penis.srcfn(options) : null,
				srcfnSource: layer && layer.srcfn ? Function.prototype.toString.call(layer.srcfn) : "",
				gate: !!document.getElementById("dol-password-gate"),
			};
		});
		assert.equal(result.hasLayer, true);
		assert.equal(result.monkeypatched, false);
		assert.match(result.srcfnSource, /plusSagSrc/);
		assert.doesNotMatch(result.srcfnSource, /plusSagHooked/);
		assert.equal(result.src, "img/clothes/under-lower/plusdpm/sag2/full.png");
		writeFileSync(join(artifacts, "compiled-srcfn.json"), JSON.stringify(result, null, 2));
	} finally {
		await browser.close();
	}
});
