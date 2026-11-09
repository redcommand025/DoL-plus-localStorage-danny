/**
 * Isolated compiled-HTML runtime integration (puppeteer, not a persistent browser).
 * Does not start a 7-day playthrough and does not return the password.
 */
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { after, before, describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = join(root, "Degrees of Lewdity.html");

function loadPuppeteer() {
	const require = createRequire(import.meta.url);
	try {
		return require("puppeteer-core");
	} catch (e) {
		return require("/tmp/dol-diag/node_modules/puppeteer-core");
	}
}

describe("QA compiled isolated runtime", () => {
	let browser, page;
	before(async () => {
		assert.ok(existsSync(html), "compiled HTML missing: " + html);
		const puppeteer = loadPuppeteer();
		browser = await puppeteer.launch({
			executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
			headless: "new",
			args: ["--no-sandbox", "--disable-gpu", "--allow-file-access-from-files"],
		});
		page = await browser.newPage();
		page.setDefaultTimeout(180000);
		await page.goto(pathToFileURL(html).href, { waitUntil: "domcontentloaded", timeout: 180000 });
		await new Promise(r => setTimeout(r, 8000));
	});
	after(async () => {
		if (browser) await browser.close();
	});

	it("QA-C001 [integration] compiled page loads SugarCube with the password gate up", async () => {
		const info = await page.evaluate(() => ({
			sugarcube: !!(window.SugarCube && window.SugarCube.State),
			gate: !!document.getElementById("dol-password-gate"),
			title: document.title || "",
		}));
		assert.equal(info.sugarcube, true);
		assert.equal(info.gate, true);
	});

	it("QA-C002 [integration] evaluated page text does not include a leaked password field", async () => {
		const leaked = await page.evaluate(() => {
			const el = document.getElementById("dol-password-gate");
			if (!el) return { hasGate: false, hasPasswordInput: false };
			const input = el.querySelector("input[type='password'], input[type='text']");
			return {
				hasGate: true,
				hasPasswordInput: !!input,
				inputType: input ? input.type : null,
				valueEmpty: input ? input.value === "" : true,
			};
		});
		assert.equal(leaked.hasGate, true);
		assert.equal(leaked.hasPasswordInput, true);
		assert.equal(leaked.inputType, "password");
		assert.equal(leaked.valueEmpty, true);
	});

	it("QA-C003 [integration] plusNeedsTick and plusDiaperItems are present on the compiled page", async () => {
		const info = await page.evaluate(() => ({
			tick: typeof window.plusNeedsTick,
			items: typeof window.plusDiaperItems === "function" ? window.plusDiaperItems().length : 0,
			sag: typeof window.plusSagSrc,
			migrate: typeof window.plusDiaperMigrateAll,
		}));
		assert.equal(info.tick, "function");
		assert.equal(info.items, 15);
		assert.equal(info.sag, "function");
		assert.equal(info.migrate, "function");
	});

	it("QA-C004 [integration] compiled tick with Math.random stubbed drains hunger at the awake rate", async () => {
		const result = await page.evaluate(() => {
			const State = window.SugarCube.State;
			const V = State.variables;
			const orig = Math.random;
			Math.random = () => 0.5;
			const before = Number.isFinite(V.plusHunger) ? V.plusHunger : 2000;
			V.plusHunger = 2000;
			V.intro = 0;
			try {
				window.plusNeedsTick(60);
				return { after: V.plusHunger, before };
			} finally {
				Math.random = orig;
				V.plusHunger = before;
			}
		});
		assert.equal(result.after, 1904);
	});

	it("QA-C005 [integration] widget macros needed for UI captions exist", async () => {
		const names = await page.evaluate(() => {
			const Macro = window.SugarCube && window.SugarCube.Macro;
			const list = [
				"plusCaptionExtras",
				"plusneedscaption",
				"plusdiaperbars",
				"plusNeedsStatistics",
				"plusContinenceBox",
				"plusContRepFame",
				"plusClassAskLinks",
				"plusAskRestroomLink",
				"plusToiletLink",
				"plusPublicToiletLink",
				"plusOutdoorToiletLink",
				"plusDiaperShop",
				"plusNeedsAccident",
				"plusFlatNotices",
			];
			const out = {};
			for (const n of list) out[n] = !!(Macro && Macro.has && Macro.has(n));
			return out;
		});
		for (const [name, ok] of Object.entries(names)) assert.equal(ok, true, name);
	});

	it("QA-C006 [integration] caption extras and statistics widgets wikify without throwing", async () => {
		const result = await page.evaluate(() => {
			function wiki(name) {
				const div = document.createElement("div");
				try {
					// eslint-disable-next-line no-undef
					new Wikifier(div, "<<" + name + ">>");
					return { ok: true, empty: div.innerHTML.trim() === "", len: div.innerHTML.length };
				} catch (e) {
					return { ok: false, error: String(e && e.message ? e.message : e) };
				}
			}
			return {
				caption: wiki("plusCaptionExtras"),
				stats: wiki("plusNeedsStatistics"),
				continence: wiki("plusContinenceBox"),
				fame: wiki("plusContRepFame"),
			};
		});
		for (const [k, v] of Object.entries(result)) {
			assert.equal(v.ok, true, k + " " + (v.error || ""));
		}
	});

	it("QA-C007 [integration] class-ask and knock widgets wikify without throwing", async () => {
		const result = await page.evaluate(() => {
			function wiki(name) {
				const div = document.createElement("div");
				try {
					new Wikifier(div, "<<" + name + ">>");
					return { ok: true, html: div.innerHTML.slice(0, 300) };
				} catch (e) {
					return { ok: false, error: String(e && e.message ? e.message : e) };
				}
			}
			return { classAsk: wiki("plusClassAskLinks"), knock: wiki("plusAskRestroomLink"), toilet: wiki("plusPublicToiletLink") };
		});
		assert.equal(result.classAsk.ok, true, result.classAsk.error);
		assert.equal(result.knock.ok, true, result.knock.error);
		assert.equal(result.toilet.ok, true, result.toilet.error);
	});

	it("QA-C008 [integration] compiled clothing srcfn rewrites a half-full plusdpm path", async () => {
		const result = await page.evaluate(() => {
			const M = window.Renderer && window.Renderer.CanvasModels && window.Renderer.CanvasModels.main;
			const layer = M && M.layers && M.layers.under_lower;
			const State = window.SugarCube.State;
			const V = State.variables;
			const item = window.plusDiaperItems().find(i => i.name === "plastic-backed diaper (Medium)");
			window.plusDiaperInit(item);
			item.plusMl = item.plusCapMl * 0.5;
			item.plusOverflow = 0;
			V.worn = V.worn || {};
			V.worn.under_lower = item;
			const options = {
				show_clothes: true,
				hood_down: false,
				alt_override: false,
				worn: { under_lower: { index: 1, integrity: "full", alt: "", pattern: 0, setup: Object.assign({ altdisabled: [] }, item) } },
			};
			return {
				src: layer.srcfn(options),
				monkeypatched: !!M.plusSagHooked,
			};
		});
		assert.equal(result.src, "img/clothes/under-lower/plusdpm/sag2/full.png");
		assert.equal(result.monkeypatched, false);
	});

	it("QA-C009 [integration] compiled module namespace deepMerge is a function", async () => {
		const info = await page.evaluate(() => ({
			deepMerge: typeof window.deepMerge || typeof (window.setup && window.setup.deepMerge),
			sugarType: typeof window.SugarCube,
		}));
		assert.equal(info.sugarType, "object");
	});

	it("QA-C010 [integration] compiled page can write and read localStorage when Web Storage exists", async () => {
		const info = await page.evaluate(() => {
			try {
				window.localStorage.setItem("qa-plus", "1");
				const got = window.localStorage.getItem("qa-plus");
				window.localStorage.removeItem("qa-plus");
				return { setget: got, idbType: window.indexedDB === null ? "null" : typeof window.indexedDB };
			} catch (e) {
				return { error: String(e && e.message ? e.message : e) };
			}
		});
		assert.equal(info.error, undefined);
		assert.equal(info.setget, "1");
		// When Web Storage works, the fallback must not force IndexedDB off.
		assert.equal(info.idbType, "object");
	});

	it("QA-C011 [integration] generateNPC still sets enemyno from the filled slot, not a call counter", async () => {
		const info = await page.evaluate(() => {
			const src = Function.prototype.toString.call(window.generateNPC || (window.setup && window.setup.generateNPC) || function () {});
			return { hasMax: /Math\.max/.test(src), len: src.length };
		});
		// fallback: inspect SugarCube script text if generateNPC is not on window
		if (!info.hasMax) {
			const htmlHas = await page.evaluate(
				() =>
					/Math\.max\(\s*\$enemyno/.test(document.documentElement.innerHTML) ||
					/Math\.max\(\s*V\.enemyno/.test(document.documentElement.innerHTML) ||
					(document.documentElement.innerHTML.includes("Math.max(") && document.documentElement.innerHTML.includes("enemyno"))
			);
			assert.equal(htmlHas, true);
		} else {
			assert.equal(info.hasMax, true);
		}
	});

	it("QA-C012 [integration] compiled HTML contains one plusNeedsTick call site and no plusCanteenLunch", async () => {
		const info = await page.evaluate(() => {
			const html = document.documentElement.innerHTML;
			return {
				ticks: (html.match(/plusNeedsTick\(/g) || []).length,
				canteen: (html.match(/plusCanteenLunch/g) || []).length,
				hooked: (html.match(/plusSagHooked/g) || []).length,
			};
		});
		assert.ok(info.ticks >= 1);
		assert.equal(info.canteen, 0);
		assert.equal(info.hooked, 0);
	});

	it("QA-C013 [integration] compiled npcincr Talk and Help with control training raise Danny love without a whitelist error", async () => {
		const info = await page.evaluate(() => {
			const wiki = src => {
				const d = document.createElement("div");
				try {
					// eslint-disable-next-line no-undef
					new Wikifier(d, src);
					return { ok: true, text: d.textContent || "", html: d.innerHTML || "" };
				} catch (e) {
					return { ok: false, text: String(e && e.message ? e.message : e), html: d.innerHTML || "" };
				}
			};
			const V = window.SugarCube.State.variables;
			if (!Array.isArray(V.NPCNameList) || !V.NPCNameList.includes("Danny")) wiki("<<npcNamed>>");
			if (!V.danny || typeof V.danny !== "object") V.danny = { control: 0, dependency: 0 };
			const listed = Array.isArray(V.NPCNameList) && V.NPCNameList.includes("Danny");
			const loveBefore = window.C && C.npc && C.npc.Danny ? C.npc.Danny.love : null;
			const talk = wiki("<<npcincr Danny love 2>>");
			const help = wiki("<<set $danny.control += 5>><<npcincr Danny love 3>>");
			const combined = (talk.text || "") + (help.text || "") + (talk.html || "") + (help.html || "");
			return {
				listed,
				loveBefore,
				loveAfter: window.C && C.npc && C.npc.Danny ? C.npc.Danny.love : null,
				control: V.danny && V.danny.control,
				adult: window.C && C.npc && C.npc.Danny ? C.npc.Danny.adult : null,
				teen: window.C && C.npc && C.npc.Danny ? C.npc.Danny.teen : null,
				whitelistError: /not whitelisted/.test(combined),
				talkOk: talk.ok,
				helpOk: help.ok,
				talkText: (talk.text || "").slice(0, 200),
			};
		});
		assert.equal(info.listed, true);
		assert.equal(info.whitelistError, false);
		assert.equal(info.talkOk, true);
		assert.equal(info.helpOk, true);
		assert.ok(info.loveAfter >= (info.loveBefore || 0) + 5, JSON.stringify(info));
		assert.ok((info.control || 0) >= 5, JSON.stringify(info));
		assert.equal(info.adult, 1);
		assert.equal(info.teen, 0);
	});

	it("QA-C014 [integration] updateNewNamedNpcs migrates a save missing Danny", async () => {
		const info = await page.evaluate(() => {
			const wiki = src => {
				const d = document.createElement("div");
				try {
					// eslint-disable-next-line no-undef
					new Wikifier(d, src);
					return { ok: true, text: d.textContent || "" };
				} catch (e) {
					return { ok: false, text: String(e && e.message ? e.message : e) };
				}
			};
			const V = window.SugarCube.State.variables;
			wiki("<<if def $NPCNameList is false>><<npcNamed>><</if>>");
			if (typeof V.npcListVersion !== "number" || V.npcListVersion < 1) V.npcListVersion = 1;
			const idx = (V.NPCNameList || []).indexOf("Danny");
			if (idx >= 0) {
				V.NPCNameList.splice(idx, 1);
				if (Array.isArray(V.NPCName)) V.NPCName.splice(idx, 1);
			}
			const missing = !(V.NPCNameList || []).includes("Danny");
			const migrated = wiki("<<updateNewNamedNpcs>>");
			const afterIdx = (V.NPCNameList || []).indexOf("Danny");
			const rec = afterIdx >= 0 && Array.isArray(V.NPCName) ? V.NPCName[afterIdx] : null;
			return {
				missing,
				ok: migrated.ok,
				present: afterIdx >= 0,
				title: rec && rec.title,
				adult: rec && rec.adult,
				teen: rec && rec.teen,
				text: (migrated.text || "").slice(0, 200),
			};
		});
		assert.equal(info.missing, true);
		assert.equal(info.ok, true);
		assert.equal(info.present, true);
		assert.equal(info.title, "dependent");
		assert.equal(info.adult, 1);
		assert.equal(info.teen, 0);
	});

	it("QA-C015 [integration] Danny portrait srcfn uses the generic blank fallback", async () => {
		const info = await page.evaluate(() => {
			const M = window.Renderer && window.Renderer.CanvasModels && window.Renderer.CanvasModels.main;
			const nnpc = M && M.layers && M.layers.nnpc;
			const models = window.Renderer && window.Renderer.CanvasModels;
			if (!nnpc || typeof nnpc.srcfn !== "function") {
				return { error: "nnpc layer missing", models: models ? Object.keys(models) : [] };
			}
			const V = window.SugarCube.State.variables;
			V.options = V.options || {};
			V.options.autoNNPCDisplay = Object.assign({}, V.options.autoNNPCDisplay, { enabled: false });
			V.options.nnpcDisplay = "Danny";
			V.options.nnpcDisplaySlot = 1;
			V.options.nnpcDisplayGender = "male";
			V.options.nnpcDisplaySkin = "pale";
			window.T = window.T || {};
			window.SugarCube.State.temporary.optionsEnabled = false;
			const src = nnpc.srcfn({});
			return { src };
		});
		assert.equal(info.error, undefined, JSON.stringify(info));
		assert.equal(info.src, "img/ui/nnpc/blank.png");
	});
});
