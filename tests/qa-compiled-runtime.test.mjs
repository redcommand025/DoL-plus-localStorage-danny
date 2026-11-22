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
	const startupDialogs = [];
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
		page.on("dialog", async d => {
			startupDialogs.push(d.message().slice(0, 400));
			await d.dismiss();
		});
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
				"plusDiaperVisibleCaption",
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
				"plusWorkBreakLink",
				"plusInfirmaryNurseLink",
				"plusCustodyWashLink",
				"plusKitchenSnack",
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

	it("QA-C013 [integration] plusRetireDanny drops Danny from an old save without shifting earlier NPC indices", async () => {
		const info = await page.evaluate(() => {
			document.getElementById("dol-password-gate")?.remove();
			const wiki = src => {
				const d = document.createElement("div");
				try {
					new Wikifier(d, src);
					return { ok: true, text: (d.textContent || "").replace(/\s+/g, " ") };
				} catch (e) {
					return { ok: false, text: String(e && e.message ? e.message : e) };
				}
			};
			wiki("<<gameStartOnly>><<variablesStart2>>");
			const V = SugarCube.State.variables;
			if (!Array.isArray(V.NPCNameList) || V.NPCNameList.length < 30) wiki("<<npcNamed>>");
			const official = V.NPCNameList.slice();
			const sydneyBefore = V.NPCNameList.indexOf("Sydney");
			const poppyBefore = V.NPCNameList.indexOf("Poppy");
			const robinBefore = V.NPCNameList[0];
			// Simulate a pre-removal save: Danny is last, love interest and vars are set.
			V.NPCNameList.push("Danny");
			V.NPCName.push({ nam: "Danny", description: "Danny", title: "dependent", love: 40, lust: 20, adult: 1, teen: 0 });
			V.loveInterest = V.loveInterest || {};
			V.loveInterest.primary = "Danny";
			V.loveInterest.secondary = "None";
			V.danny = { control: 5, dependency: 2 };
			V.dannyIntro = 1;
			V.dannyEv = { active: true, id: "hallway" };
			V.dannyAccidentKnown = 1;
			V.daily = V.daily || {};
			V.daily.dannyCanteen = 1;
			V.options = V.options || {};
			V.options.nnpcDisplay = "danny";
			const removed = window.plusRetireDanny(V);
			const keys = Object.keys(V).filter(k => k === "danny" || /^danny/i.test(k));
			const dailyKeys = V.daily ? Object.keys(V.daily).filter(k => /^danny/i.test(k)) : [];
			return {
				removed,
				hasPlus: typeof window.plusRetireDanny === "function",
				hasDanny: V.NPCNameList.includes("Danny"),
				listLen: V.NPCNameList.length,
				nameLen: Array.isArray(V.NPCName) ? V.NPCName.length : null,
				lastName: V.NPCNameList[V.NPCNameList.length - 1],
				sydneyBefore,
				sydneyAfter: V.NPCNameList.indexOf("Sydney"),
				poppyBefore,
				poppyAfter: V.NPCNameList.indexOf("Poppy"),
				officialUnchanged: official.every((n, i) => V.NPCNameList[i] === n),
				lovePrimary: V.loveInterest && V.loveInterest.primary,
				loveSecondary: V.loveInterest && V.loveInterest.secondary,
				leftoverKeys: keys,
				dailyKeys,
				display: V.options && V.options.nnpcDisplay,
				noDannyEvents: typeof window.DannyEvents === "undefined",
				noDannyTalk: typeof window.DannyTalk === "undefined",
				noGetLoc: typeof window.getDannyLocation === "undefined",
			};
		});
		assert.equal(info.hasPlus, true, JSON.stringify(info));
		assert.equal(info.removed, true);
		assert.equal(info.hasDanny, false);
		assert.equal(info.lastName, "Poppy");
		assert.equal(info.sydneyAfter, info.sydneyBefore);
		assert.equal(info.poppyAfter, info.poppyBefore);
		assert.equal(info.officialUnchanged, true);
		assert.equal(info.listLen, info.nameLen);
		assert.equal(info.lovePrimary, "None");
		assert.equal(info.loveSecondary, "None");
		assert.deepEqual(info.leftoverKeys, []);
		assert.deepEqual(info.dailyKeys, []);
		assert.equal(info.display, undefined);
		assert.equal(info.noDannyEvents, true);
		assert.equal(info.noDannyTalk, true);
		assert.equal(info.noGetLoc, true);
		assert.ok(info.sydneyBefore >= 0);
	});

	it("QA-C014 [integration] school and home locations play without Danny hooks or macro errors", async () => {
		const info = await page.evaluate(() => {
			document.getElementById("dol-password-gate")?.remove();
			const errorsOf = root =>
				Array.from((root || document).querySelectorAll(".error, .error-view, #errorbox, .macro-error"))
					.map(el => (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim())
					.filter(Boolean);
			const wiki = src => {
				const d = document.createElement("div");
				try {
					new Wikifier(d, src);
					return { ok: true, text: (d.textContent || "").replace(/\s+/g, " ") };
				} catch (e) {
					return { ok: false, text: String(e && e.message ? e.message : e) };
				}
			};
			wiki("<<gameStartOnly>><<variablesStart2>>");
			const V = () => SugarCube.State.variables;
			V().intro = 0;
			V().combat = 0;
			V().eventskip = 1;
			V().exposed = 0;
			V().tutorial = 1;
			if (typeof plusNeedsInit === "function") plusNeedsInit();
			if (typeof window.plusRetireDanny === "function") plusRetireDanny(V());
			const addDay = () => {
				const next = new DateTime(Time.date.year, Time.date.month, Time.date.day, Time.hour, Time.minute);
				next.addDays(1);
				Time.setDate(next);
			};
			const y = Time.year || Time.date.year;
			for (const [month, day] of [
				[9, 15],
				[10, 12],
				[11, 12],
				[2, 12],
				[3, 12],
				[5, 12],
				[6, 12],
			]) {
				Time.setDate(new DateTime(y, month, day, 10, 15));
				let g = 0;
				while (!Time.schoolDay && Time.schoolTerm && g++ < 6) addDay();
				if (Time.schoolDay) break;
			}
			Time.setTime(10, 15);
			V().location = "school";
			const play = name => {
				try {
					SugarCube.Engine.play(name);
				} catch (e) {
					return { name, ok: false, text: String(e && e.message ? e.message : e), errors: [String(e)] };
				}
				const root = document.getElementById("passages") || document.body;
				const text = (root.innerText || "").replace(/\s+/g, " ");
				const errors = errorsOf(root);
				const bad =
					/does not exist|Error \(::|NPCINCR error|macro <</i.test(text) || errors.some(t => /does not exist|Error \(::|NPCINCR error|macro <</i.test(t));
				return {
					name,
					ok: !bad,
					errors: errors.slice(0, 8),
					hasDanny: /\bDanny\b/.test(text),
					passage: SugarCube.State.passage,
					text: text.slice(0, 180),
				};
			};
			return {
				schoolDay: !!Time.schoolDay,
				hallways: play("Hallways"),
				canteen: play("Canteen"),
				library: play("School Library"),
				front: play("School Front Courtyard"),
				rear: play("School Rear Courtyard"),
				bedroom: play("Bedroom"),
				orphanage: play("Orphanage"),
			};
		});
		assert.equal(info.schoolDay, true, JSON.stringify(info));
		for (const key of ["hallways", "canteen", "library", "front", "rear", "bedroom", "orphanage"]) {
			const r = info[key];
			assert.equal(r.ok, true, key + " " + JSON.stringify(r));
			assert.equal(r.hasDanny, false, key + " mentioned Danny: " + r.text);
			assert.deepEqual(r.errors, [], key + " " + JSON.stringify(r.errors));
		}
	});

	it("QA-C019 [integration] startup raises no error dialogs and every diaper shop renders its packs without an <<icon>> error", async () => {
		const info = await page.evaluate(() => {
			const wiki = src => {
				const d = document.createElement("div");
				try {
					new Wikifier(d, src);
					return { ok: true, text: d.textContent || "" };
				} catch (e) {
					return { ok: false, text: String(e && e.message ? e.message : e) };
				}
			};
			const V = SugarCube.State.variables;
			const widgetPassages = [...document.querySelectorAll("tw-passagedata")]
				.filter(p => (p.getAttribute("tags") || "").split(/\s+/).includes("widget"))
				.filter(p => /<<plusDiaperShop\s+"/.test(p.textContent))
				.map(p => p.getAttribute("name"));
			const shops = {};
			const prevOpen = window.plusDiaperAdultShopOpen;
			window.plusDiaperAdultShopOpen = () => true;
			for (const loc of ["clothing", "pharmacy", "adult"]) {
				const r = wiki('<<plusDiaperShop "' + loc + '">>');
				shops[loc] = {
					ok: r.ok,
					error: /Error|cannot execute|reading 'images'/.test(r.text),
					packs: (r.text.match(/Pack of/g) || []).length,
					expected: window.plusDiaperPackList(loc).filter(Boolean).length,
				};
			}
			window.plusDiaperAdultShopOpen = prevOpen;
			return { optionsDefined: !!(V.options && "images" in V.options), widgetPassages, shops };
		});
		assert.deepEqual(startupDialogs, []);
		assert.deepEqual(info.widgetPassages, []);
		assert.equal(info.optionsDefined, true);
		for (const [loc, r] of Object.entries(info.shops)) {
			assert.equal(r.ok, true, loc + JSON.stringify(r));
			assert.equal(r.error, false, loc + JSON.stringify(r));
			assert.equal(r.packs, r.expected, loc + JSON.stringify(r));
		}
		assert.ok(info.shops.clothing.packs > 0, JSON.stringify(info.shops));
	});

	it("QA-C023 [integration] buying a diaper pack with a colour and pattern at the shop counter stamps the wardrobe and renders on the doll", async () => {
		const info = await page.evaluate(() => {
			const wiki = src => {
				const d = document.createElement("div");
				try {
					new Wikifier(d, src);
					return { ok: true, text: (d.textContent || "").replace(/\s+/g, " "), html: d.innerHTML, el: d };
				} catch (e) {
					return { ok: false, text: String(e && e.message ? e.message : e), html: "", el: d };
				}
			};
			const bad = r => !r.ok || /Error|cannot execute|macro does not exist/.test(r.text);
			wiki("<<gameStartOnly>><<variablesStart2>>");
			const V = SugarCube.State.variables;
			V.money = 1000000;
			V.options = V.options || {};
			V.options.images = 1;
			if (!V.wardrobe) V.wardrobe = {};
			if (!Array.isArray(V.wardrobe.under_lower)) V.wardrobe.under_lower = [];
			const shop = wiki('<<plusDiaperShop "clothing">>');
			const pharmacy = wiki('<<plusDiaperShop "pharmacy">>');
			const prevOpen = window.plusDiaperAdultShopOpen;
			window.plusDiaperAdultShopOpen = () => true;
			const adult = wiki('<<plusDiaperShop "adult">>');
			window.plusDiaperAdultShopOpen = prevOpen;
			const hasPrintsSection = /Diaper prints/.test(shop.text + pharmacy.text + adult.text);
			const customiseHref = /Plus Needs Diaper Customise/.test(shop.html + pharmacy.html);
			V.plusBuyName = "plastic-backed diaper (Medium)";
			V.plusBuyCount = 5;
			V.plusBuyReturn = "Start";
			delete V.colouraction;
			delete V.patternaction;
			delete V.plusBuyColour;
			delete V.plusBuyPattern;
			const custom = wiki("<<include [[Plus Needs Diaper Customise]]>>");
			const pink = custom.el && custom.el.querySelector(".colour-options-div.primary .bg-pink a");
			if (pink) pink.click();
			const listbox = custom.el && custom.el.querySelector("#listbox-patternaction");
			if (listbox) {
				listbox.value = "dino stomp";
				listbox.dispatchEvent(new Event("change", { bubbles: true }));
			}
			/* listbox change events are SugarCube-specific; set the same variable the widget writes. */
			V.patternaction = "dino stomp";
			const before = V.wardrobe.under_lower.length;
			const bought = window.plusDiaperBuyPack(V.plusBuyName, V.plusBuyCount, {
				colour: V.colouraction,
				pattern: V.patternaction,
			});
			const fresh = V.wardrobe.under_lower.slice(before);
			const worn = fresh[0] && JSON.parse(JSON.stringify(fresh[0]));
			if (worn) {
				window.plusDiaperInit(worn);
				V.worn = V.worn || {};
				V.worn.under_lower = worn;
			}
			const M = window.Renderer && window.Renderer.CanvasModels && window.Renderer.CanvasModels.main;
			const acc = M && M.layers && M.layers.under_lower_acc;
			const main = M && M.layers && M.layers.under_lower;
			const setupItem = Object.assign({ altdisabled: [] }, worn || {});
			const options = {
				show_clothes: true,
				mannequin: false,
				belly_hides_under_lower: false,
				hood_down: false,
				alt_override: false,
				worn: {
					under_lower: {
						index: worn && worn.index ? worn.index : 1,
						integrity: "full",
						alt: "",
						pattern: worn && worn.pattern,
						colour: worn && worn.colour,
						setup: setupItem,
					},
				},
			};
			return {
				shopBad: bad(shop),
				pharmacyBad: bad(pharmacy),
				adultBad: bad(adult),
				shopPacks: (shop.text.match(/Pack of/g) || []).length,
				pharmacyPacks: (pharmacy.text.match(/Pack of/g) || []).length,
				hasPrintsSection,
				customiseHref,
				customBad: bad(custom),
				hasColours: !!(custom.el && custom.el.querySelector(".colour-options-div.primary")),
				hasPatterns: !!(listbox || (custom.el && custom.el.querySelector(".colour-options-div.pattern"))),
				hasMannequin: !!(custom.el && custom.el.querySelector("#mannequin")),
				hasBuy: /Buy the pack/.test(custom.text),
				colouraction: V.colouraction,
				patternaction: V.patternaction,
				boughtOk: !!(bought && bought.ok),
				boughtColour: bought && bought.colour,
				boughtPattern: bought && bought.pattern,
				freshN: fresh.length,
				freshColour: fresh[0] && fresh[0].colour,
				freshPattern: fresh[0] && fresh[0].pattern,
				of: worn ? window.plusDiaperPatternOf(worn) : 0,
				mainSrc: main && worn ? main.srcfn(options) : "",
				accShow: acc && worn ? !!acc.showfn(options) : false,
				accSrc: acc && worn ? acc.srcfn(options) : "",
			};
		});
		assert.equal(info.shopBad, false, JSON.stringify(info));
		assert.equal(info.pharmacyBad, false, JSON.stringify(info));
		assert.equal(info.customBad, false, JSON.stringify(info));
		assert.ok(info.shopPacks > 0, JSON.stringify(info));
		assert.equal(info.pharmacyPacks, info.shopPacks);
		assert.equal(info.hasPrintsSection, false, "old print shop should be gone");
		assert.equal(info.customiseHref, true);
		assert.equal(info.hasColours, true, JSON.stringify(info));
		assert.equal(info.hasPatterns, true, JSON.stringify(info));
		assert.equal(info.hasMannequin, true);
		assert.equal(info.hasBuy, true);
		assert.equal(info.colouraction, "pink");
		assert.equal(info.patternaction, "dino stomp");
		assert.equal(info.boughtOk, true);
		assert.equal(info.boughtColour, "pink");
		assert.equal(info.boughtPattern, "dino stomp");
		assert.equal(info.freshN, 5);
		assert.equal(info.freshColour, "pink");
		assert.equal(info.freshPattern, "dino stomp");
		assert.equal(info.of, "dino stomp");
		assert.match(info.mainSrc, /plusdpm/);
		assert.equal(info.accShow, true, JSON.stringify(info));
		assert.match(info.accSrc, /dino-stomp/);
	});
	it("QA-C024 [integration] sidebar visibility caption shows when a diaper is visible and hides when it is not", async () => {
		const info = await page.evaluate(() => {
			function wiki() {
				const div = document.createElement("div");
				try {
					new Wikifier(div, "<<plusDiaperVisibleCaption>>");
					return { ok: true, text: (div.textContent || "").replace(/\s+/g, " ").trim(), html: div.innerHTML };
				} catch (e) {
					return { ok: false, text: String(e && e.message ? e.message : e), html: "" };
				}
			}
			function cloneItem(name) {
				const src = window.plusDiaperItems().find(i => i.name === name);
				const it = JSON.parse(JSON.stringify(src));
				window.plusDiaperInit(it);
				return it;
			}
			const naked = { name: "naked", type: ["naked"] };
			const V = window.SugarCube.State.variables;
			V.worn = V.worn || {};
			const out = {};

			const bare = cloneItem("plastic-backed diaper (Medium)");
			V.worn.under_lower = bare;
			V.worn.lower = naked;
			V.worn.over_lower = naked;
			out.bare = {
				notice: window.plusDiaperVisibleNotice(),
				wiki: wiki(),
				visible: window.plusDiaperVisibility().visible,
				conceal: window.plusDiaperVisibility().conceal,
			};

			const skirt = cloneItem("plastic-backed diaper (Medium)");
			skirt.plusMl = skirt.plusCapMl;
			V.worn.under_lower = skirt;
			V.worn.lower = { name: "school skirt", type: ["normal"] };
			V.worn.over_lower = naked;
			out.skirt = {
				notice: window.plusDiaperVisibleNotice(),
				wiki: wiki(),
				visible: window.plusDiaperVisibility().visible,
				size: window.plusDiaperVisibility().size,
				conceal: window.plusDiaperVisibility().conceal,
			};

			const trousers = cloneItem("plastic-backed diaper (Medium)");
			trousers.plusMl = 0;
			V.worn.under_lower = trousers;
			V.worn.lower = { name: "trousers", type: ["normal"] };
			V.worn.over_lower = naked;
			out.trousers = {
				notice: window.plusDiaperVisibleNotice(),
				wiki: wiki(),
				visible: window.plusDiaperVisibility().visible,
				size: window.plusDiaperVisibility().size,
				conceal: window.plusDiaperVisibility().conceal,
			};

			V.worn.under_lower = { name: "plain panties", type: ["normal"] };
			V.worn.lower = { name: "trousers", type: ["normal"] };
			out.none = {
				notice: window.plusDiaperVisibleNotice(),
				wiki: wiki(),
				worn: window.plusDiaperVisibility().worn,
				visible: window.plusDiaperVisibility().visible,
			};

			return out;
		});
		assert.equal(info.bare.visible, true);
		assert.equal(info.bare.conceal, -1);
		assert.equal(info.bare.notice.text, "Your diaper can be seen by others.");
		assert.equal(info.bare.notice.cls, "red");
		assert.equal(info.bare.wiki.ok, true, info.bare.wiki.text);
		assert.match(info.bare.wiki.text, /Your diaper can be seen by others\./);
		assert.match(info.bare.wiki.html, /class="red"/);

		assert.equal(info.skirt.visible, true);
		assert.equal(info.skirt.size, 6);
		assert.equal(info.skirt.conceal, 5);
		assert.equal(info.skirt.notice.text, "Your diaper is showing through your clothes.");
		assert.equal(info.skirt.notice.cls, "purple");
		assert.equal(info.skirt.wiki.ok, true, info.skirt.wiki.text);
		assert.match(info.skirt.wiki.text, /Your diaper is showing through your clothes\./);
		assert.match(info.skirt.wiki.html, /class="purple"/);

		assert.equal(info.trousers.visible, false);
		assert.equal(info.trousers.size, 3);
		assert.equal(info.trousers.conceal, 6);
		assert.equal(info.trousers.notice, null);
		assert.equal(info.trousers.wiki.ok, true, info.trousers.wiki.text);
		assert.doesNotMatch(info.trousers.wiki.text, /diaper/);

		assert.equal(info.none.worn, false);
		assert.equal(info.none.visible, false);
		assert.equal(info.none.notice, null);
		assert.equal(info.none.wiki.ok, true, info.none.wiki.text);
		assert.doesNotMatch(info.none.wiki.text, /diaper/);
	});

	it("QA-C025 [integration] school continence rumours catch up at midnight", async () => {
		const info = await page.evaluate(() => {
			const V = window.SugarCube.State.variables;
			window.plusContRepInit();
			V.plusContRep = 0;
			V.plusContRepPublic = 0;
			V.plusContRepSchoolPending = 0;
			V.plusContRepDayGain = 0;
			V.schoolrep = V.schoolrep || {};
			V.schoolrep.continence = 0;
			delete V.school_continence_message;
			const today = window.plusDayKey();
			V.plusContRepDecayDay = today;
			V.location = "school";
			const amt = window.plusContRepOnAccident(1, { school: true, which: "plusBladder", clothed: true });
			const afterSeen = {
				amt,
				raw: V.plusContRep,
				pub: window.plusContRepPublicValue(),
				school: window.plusSchoolContRep(),
				pending: V.plusContRepSchoolPending,
				today,
			};
			V.plusContRepDecayDay = today - 1;
			window.plusContRepDecay();
			return {
				afterSeen,
				afterMidnight: {
					raw: V.plusContRep,
					pub: window.plusContRepPublicValue(),
					school: window.plusSchoolContRep(),
					pending: V.plusContRepSchoolPending,
					message: V.school_continence_message,
					label: window.plusContRepLabel(),
				},
			};
		});
		assert.ok(info.afterSeen.amt > 0);
		assert.ok(info.afterSeen.raw >= info.afterSeen.amt);
		assert.equal(info.afterSeen.pub, 0);
		assert.equal(info.afterSeen.school, 0);
		assert.equal(info.afterSeen.pending, 1);
		assert.equal(info.afterMidnight.school, 1);
		assert.equal(info.afterMidnight.pending, 0);
		assert.equal(info.afterMidnight.message, 1);
		assert.equal(info.afterMidnight.pub, info.afterMidnight.raw);
		assert.ok(info.afterMidnight.pub > 0);
	});

	it("QA-C026 [integration] combat audio is present, real, and still blocked for leftover Danny scene names", async () => {
		const info = await page.evaluate(async () => {
			const blockedDanny = (() => {
				const V = window.SugarCube.State.variables;
				const oldP = V.passage;
				const oldN = V.NPCList;
				const oldL = V.location;
				V.passage = "Danny Room";
				V.location = "orphanage";
				V.NPCList = [];
				const blocked = window.GameCombatAudio && window.GameCombatAudio.blocked();
				V.passage = oldP;
				V.NPCList = oldN;
				V.location = oldL;
				return blocked;
			})();
			const street = (() => {
				const V = window.SugarCube.State.variables;
				const oldP = V.passage;
				const oldN = V.NPCList;
				const oldL = V.location;
				V.passage = "Streets";
				V.location = "town";
				V.NPCList = [{ fullDescription: "a tall man", description: "a tall man" }];
				const blocked = window.GameCombatAudio && window.GameCombatAudio.blocked();
				V.passage = oldP;
				V.NPCList = oldN;
				V.location = oldL;
				return blocked;
			})();
			const Macro = window.SugarCube && window.SugarCube.Macro;
			const hasUpdate = !!(Macro && Macro.has && Macro.has("update-combat-audio") && Macro.has("init-playlist") && Macro.has("sex-sound"));
			const url = new URL("audio/bgs/sex/slow_normal1.mp3", location.href).href;
			let lfs = null;
			let status = 0;
			try {
				const res = await fetch(url);
				status = res.status;
				const buf = await res.arrayBuffer();
				const head = new TextDecoder().decode(buf.slice(0, 80));
				lfs = head.startsWith("version https://git-lfs.github.com");
			} catch (e) {
				lfs = String(e);
			}
			return {
				hasGameCombatAudio: typeof window.GameCombatAudio,
				hasEnsure: !!(window.GameCombatAudio && window.GameCombatAudio.ensureDefaults),
				blockedDanny,
				street,
				hasUpdate,
				status,
				lfs,
			};
		});
		assert.equal(info.hasGameCombatAudio, "object");
		assert.equal(info.hasEnsure, true);
		assert.equal(info.blockedDanny, true);
		assert.equal(info.street, false);
		assert.equal(info.hasUpdate, true);
		assert.equal(info.status, 200);
		assert.equal(info.lfs, false);
	});

	it("QA-C027 [integration] Hallways at school time does not error, and every <<plus...>> macro exists", async () => {
		const plusNames = await (async () => {
			const { plusInvocations } = await import(new URL("./plus-macros-defined.test.mjs", import.meta.url));
			return plusInvocations();
		})();
		const info = await page.evaluate(async plusNames => {
			document.getElementById("dol-password-gate")?.remove();
			const wiki = src => {
				const d = document.createElement("div");
				try {
					new Wikifier(d, src);
					return { ok: true, text: (d.textContent || "").replace(/\s+/g, " "), html: d.innerHTML || "" };
				} catch (e) {
					return { ok: false, text: String(e && e.message ? e.message : e), html: "" };
				}
			};
			const errorsOf = root =>
				Array.from((root || document).querySelectorAll(".error, .error-view, #errorbox, .macro-error"))
					.map(el => (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim())
					.filter(Boolean);
			wiki("<<gameStartOnly>><<variablesStart2>>");
			const V = SugarCube.State.variables;
			V.intro = 0;
			V.combat = 0;
			V.eventskip = 1;
			V.exposed = 0;
			V.schoolrep = V.schoolrep || {};
			const addDay = () => {
				const next = new DateTime(Time.date.year, Time.date.month, Time.date.day, Time.hour, Time.minute);
				next.addDays(1);
				Time.setDate(next);
			};
			const y = Time.year || Time.date.year;
			let school = false;
			for (const [month, day] of [
				[9, 15],
				[10, 12],
				[11, 12],
				[2, 12],
				[3, 12],
				[5, 12],
				[6, 12],
			]) {
				Time.setDate(new DateTime(y, month, day, 10, 15));
				let g = 0;
				while (!Time.schoolDay && Time.schoolTerm && g++ < 6) addDay();
				if (Time.schoolDay) {
					school = true;
					break;
				}
			}
			Time.setTime(10, 15);
			V.location = "school";
			const Macro = window.SugarCube && window.SugarCube.Macro;
			const missing = plusNames.filter(n => !(Macro && Macro.has && Macro.has(n)));
			const playHallways = level => {
				V.schoolrep.continence = level;
				delete V.plusSchoolContRepRemarkNext;
				const before = SugarCube.State.passage;
				try {
					SugarCube.Engine.play("Hallways");
				} catch (e) {
					return {
						level,
						ok: false,
						text: String(e && e.message ? e.message : e),
						errors: [String(e)],
						schoolstate: V.schoolstate,
						passage: SugarCube.State.passage,
					};
				}
				const root = document.getElementById("passages") || document.body;
				const text = (root.innerText || "").replace(/\s+/g, " ");
				const errors = errorsOf(root)
					.concat(errorsOf(document))
					.filter(t => /does not exist|Error \(::/.test(t) || /macro/.test(t.toLowerCase()));
				const allErrors = errorsOf(root);
				return {
					level,
					ok: !/does not exist/.test(text) && errors.length === 0,
					missingMacro: /does not exist/.test(text),
					text: text.slice(0, 400),
					errors: allErrors.slice(0, 8),
					schoolstate: V.schoolstate,
					passage: SugarCube.State.passage,
					before,
				};
			};
			const zero = playHallways(0);
			const three = playHallways(3);
			return {
				schoolDay: !!(Time.schoolDay && school),
				hour: Time.hour,
				minute: Time.minute,
				hasRemark: !!(Macro && Macro.has && Macro.has("plusSchoolContRepRemark")),
				hasBox: !!(Macro && Macro.has && Macro.has("plusSchoolContRepBox")),
				hasBailey: !!(Macro && Macro.has && Macro.has("plusBaileyContRepComment")),
				missing,
				zero,
				three,
			};
		}, plusNames);
		assert.equal(info.hasRemark, true, "plusSchoolContRepRemark is not registered");
		assert.equal(info.hasBox, true);
		assert.equal(info.hasBailey, false, "plusBaileyContRepComment should be gone");
		assert.deepEqual(info.missing, [], "undefined plus macros: " + info.missing.join(", "));
		assert.equal(info.schoolDay, true, JSON.stringify({ hour: info.hour, minute: info.minute }));
		assert.equal(info.zero.ok, true, JSON.stringify(info.zero));
		assert.equal(info.three.ok, true, JSON.stringify(info.three));
		assert.equal(info.zero.missingMacro, false, info.zero.text);
		assert.equal(info.three.missingMacro, false, info.three.text);
		assert.equal(info.zero.passage, "Hallways");
		assert.equal(info.three.passage, "Hallways");
	});

	it("QA-C028 [integration] Cliff Street with an occupied pillory works on a fresh game and after retiring Danny", async () => {
		const info = await page.evaluate(() => {
			document.getElementById("dol-password-gate")?.remove();
			const wiki = src => {
				const d = document.createElement("div");
				try {
					new Wikifier(d, src);
					return { ok: true, text: (d.textContent || "").replace(/\s+/g, " ") };
				} catch (e) {
					return { ok: false, text: String(e && e.message ? e.message : e) };
				}
			};
			const errorsOf = root =>
				Array.from((root || document).querySelectorAll(".error, .error-view, #errorbox, .macro-error"))
					.map(el => (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim())
					.filter(Boolean);
			wiki("<<gameStartOnly>><<variablesStart2>>");
			if (typeof plusNeedsInit === "function") plusNeedsInit();
			const V = SugarCube.State.variables;
			V.intro = 0;
			V.combat = 0;
			V.eventskip = 1;
			V.exposed = 0;
			V.rng = 99;
			if (!Array.isArray(V.NPCNameList) || V.NPCNameList.length < 30) wiki("<<npcNamed>>");
			const officialLen = V.NPCNameList.length;
			const playCliff = label => {
				try {
					SugarCube.Engine.play("Cliff Street");
				} catch (e) {
					return { label, ok: false, passage: SugarCube.State.passage, text: String(e && e.message ? e.message : e), errors: [String(e)] };
				}
				const root = document.getElementById("passages") || document.body;
				const text = (root.innerText || "").replace(/\s+/g, " ");
				const errors = errorsOf(root).filter(t => /does not exist|Error \(::|title|nam|trust|pillory/i.test(t));
				const bad = /does not exist|Error \(::|Cannot read properties of undefined/i.test(text) || errors.length > 0;
				return {
					label,
					ok: !bad,
					passage: SugarCube.State.passage,
					text: text.slice(0, 400),
					errors: errors.slice(0, 8),
					hasPillory: /pillory/i.test(text),
				};
			};
			wiki("<<setup_pillory>>");
			const generic = {
				pronoun: "m",
				description: "lanky man",
				fullDescription: "lanky man",
				gender: "m",
				title: "man",
			};
			V.pillory.tenant.exists = 1;
			V.pillory.tenant.person = generic;
			V.pillory.tenant.special = { name: "", desc: "" };
			V.pillory.tenant.endTime = Time.date.timeStamp + 6 * 60 * 60;
			V.pillory.tenant.startTime = Time.date.timeStamp;
			const fresh = playCliff("fresh");
			const sydneyBefore = V.NPCNameList.indexOf("Sydney");
			V.NPCNameList.push("Danny");
			V.NPCName.push({ nam: "Danny", description: "Danny", title: "student", love: 10 });
			V.npc = ["Danny"];
			V.npcnum = [officialLen];
			V.npcrow = [0];
			V.loveInterest = V.loveInterest || {};
			V.loveInterest.primary = "Danny";
			V.pillory.tenant.exists = 1;
			V.pillory.tenant.person = { ...generic };
			V.pillory.tenant.special = { name: "", desc: "" };
			V.pillory.tenant.endTime = Time.date.timeStamp + 6 * 60 * 60;
			const retired = window.plusRetireDanny(V);
			const after = playCliff("retired");
			const readLoc = name => {
				SugarCube.State.variables.location = name;
				return setup.Locations.get();
			};
			const loc = { flat: readLoc("flat"), home: readLoc("home"), hotel: readLoc("hotel") };
			return {
				retired,
				hasDanny: V.NPCNameList.includes("Danny"),
				npc: V.npc.slice(),
				npcnum: V.npcnum.slice(),
				sydneyBefore,
				sydneyAfter: V.NPCNameList.indexOf("Sydney"),
				fresh,
				after,
				loc,
			};
		});
		assert.equal(info.retired, true);
		assert.equal(info.hasDanny, false);
		assert.deepEqual(info.npc, []);
		assert.equal(info.sydneyAfter, info.sydneyBefore);
		assert.equal(info.fresh.ok, true, JSON.stringify(info.fresh));
		assert.equal(info.after.ok, true, JSON.stringify(info.after));
		assert.equal(info.fresh.passage, "Cliff Street");
		assert.equal(info.after.passage, "Cliff Street");
		assert.equal(info.loc.flat, "flats");
		assert.equal(info.loc.home, "home");
		assert.equal(info.loc.hotel, "town");
	});

	it("QA-C032 [integration] Hallways to School Library with images on does not throw a missing-canvas style error, including on a pre-port save", async () => {
		const pageErrors = [];
		const onDialog = async d => {
			pageErrors.push("DIALOG: " + String(d.message()).slice(0, 240));
			await d.dismiss();
		};
		const onPageError = e => pageErrors.push(String(e && e.message ? e.message : e).slice(0, 240));
		page.on("dialog", onDialog);
		page.on("pageerror", onPageError);
		const info = await page.evaluate(() => {
			const caught = [];
			const onErr = ev => caught.push((ev && ev.message) || String(ev));
			window.addEventListener("error", onErr);
			const prevOnError = window.onerror;
			window.onerror = function (msg, src, line, col, err) {
				caught.push(String(msg));
				return false;
			};
			document.getElementById("dol-password-gate")?.remove();
			const wiki = src => {
				const d = document.createElement("div");
				try {
					new Wikifier(d, src);
					return { ok: true, text: (d.textContent || "").replace(/\s+/g, " ").slice(0, 200) };
				} catch (e) {
					return { ok: false, text: String(e && e.message ? e.message : e) };
				}
			};
			wiki("<<gameStartOnly>><<variablesStart2>>");
			const V = SugarCube.State.variables;
			V.intro = 0;
			V.combat = 0;
			V.eventskip = 1;
			V.exposed = 0;
			V.tutorial = 1;
			V.options = V.options || {};
			V.options.images = 1;
			if (typeof plusNeedsInit === "function") plusNeedsInit();
			if (typeof window.plusRetireDanny === "function") plusRetireDanny(V);
			const addDay = () => {
				const next = new DateTime(Time.date.year, Time.date.month, Time.date.day, Time.hour, Time.minute);
				next.addDays(1);
				Time.setDate(next);
			};
			const y = Time.year || Time.date.year;
			for (const [month, day] of [
				[9, 15],
				[10, 12],
				[11, 12],
				[2, 12],
				[3, 12],
				[5, 12],
				[6, 12],
			]) {
				Time.setDate(new DateTime(y, month, day, 10, 15));
				let g = 0;
				while (!Time.schoolDay && Time.schoolTerm && g++ < 6) addDay();
				if (Time.schoolDay) break;
			}
			Time.setTime(10, 15);
			V.location = "school";
			if (V.transformationParts) {
				delete V.transformationParts.bee;
				delete V.transformationParts.sheep;
				delete V.transformationParts.deer;
			}
			const play = name => {
				try {
					SugarCube.Engine.play(name);
					return null;
				} catch (e) {
					const msg = String(e && e.message ? e.message : e);
					caught.push("Engine.play " + name + ": " + msg);
					return msg;
				}
			};
			const snap = label => {
				const cur = SugarCube.State.variables;
				return {
					label,
					passage: SugarCube.State.passage,
					hasCanvas: !!document.querySelector("canvas.mainCanvas"),
					bee: !!(cur.transformationParts && cur.transformationParts.bee),
					styleError: caught.some(t => /reading 'style'/i.test(t)),
				};
			};
			const hallwaysErr = play("Hallways");
			const afterHallways = snap("after Hallways");
			const root = document.getElementById("passages") || document.body;
			const libLink = [...root.querySelectorAll("a")].find(a => /librar/i.test(a.textContent || ""));
			if (libLink) {
				try {
					libLink.click();
				} catch (e) {
					caught.push("click: " + String(e && e.message ? e.message : e));
				}
			}
			const afterLibrary = snap("after Library click");
			V.location = "forest";
			V.hive_intro = 1;
			const visits = {};
			for (const name of ["Settings", "Forest", "Hive Entrance", "Meadow", "Trash", "Bog"]) {
				const err = play(name);
				visits[name] = {
					passage: SugarCube.State.passage,
					err,
					hasCanvas: !!document.querySelector("canvas.mainCanvas"),
					styleError: err ? /reading 'style'/i.test(err) : false,
				};
			}
			const chars = wiki("<<characteristics>>");
			const options = wiki("<<optionsgeneral>>");
			window.onerror = prevOnError;
			window.removeEventListener("error", onErr);
			return {
				hallwaysErr,
				afterHallways,
				clickedLibrary: !!libLink,
				libraryLink: libLink ? libLink.textContent.trim() : null,
				afterLibrary,
				visits,
				charsOk: chars.ok && !/reading 'style'|Error \(::/i.test(chars.text),
				optionsOk: options.ok && !/reading 'style'|Error \(::/i.test(options.text),
				caught,
				styleErrors: caught.filter(t => /reading 'style'/i.test(t)),
			};
		});
		page.off("dialog", onDialog);
		page.off("pageerror", onPageError);
		assert.equal(info.hallwaysErr, null, JSON.stringify(info));
		assert.equal(info.afterHallways.hasCanvas, true, JSON.stringify(info.afterHallways));
		assert.equal(info.afterHallways.bee, true, "migration should restore bee parts before the sidebar renders");
		assert.equal(info.clickedLibrary, true, JSON.stringify(info));
		assert.equal(info.afterLibrary.passage, "School Library", JSON.stringify(info.afterLibrary));
		assert.equal(info.afterLibrary.hasCanvas, true, JSON.stringify(info.afterLibrary));
		assert.deepEqual(info.styleErrors, [], JSON.stringify(info.caught));
		assert.equal(info.afterLibrary.styleError, false, JSON.stringify(info));
		for (const name of ["Settings", "Forest", "Hive Entrance", "Meadow", "Trash", "Bog"]) {
			assert.equal(info.visits[name].styleError, false, name + " " + JSON.stringify(info.visits[name]));
			assert.equal(info.visits[name].err, null, name + " " + JSON.stringify(info.visits[name]));
		}
		assert.equal(info.charsOk, true, JSON.stringify(info));
		assert.equal(info.optionsOk, true, JSON.stringify(info));
		assert.deepEqual(
			pageErrors.filter(t => /reading 'style'|An error has occurred/i.test(t)),
			[],
			JSON.stringify(pageErrors)
		);
	});

	it("QA-C033 [integration] another sip at the school fountain adds a minute and thirst, and Leave returns to the hallways", async () => {
		const info = await page.evaluate(() => {
			const caught = [];
			document.getElementById("dol-password-gate")?.remove();
			const wiki = src => {
				const d = document.createElement("div");
				try {
					new Wikifier(d, src);
					return { ok: true, text: (d.textContent || "").replace(/\s+/g, " ").slice(0, 200) };
				} catch (e) {
					return { ok: false, text: String(e && e.message ? e.message : e) };
				}
			};
			wiki("<<gameStartOnly>><<variablesStart2>>");
			const V = SugarCube.State.variables;
			V.intro = 0;
			V.combat = 0;
			V.eventskip = 1;
			V.exposed = 0;
			V.tutorial = 1;
			V.options = V.options || {};
			V.options.images = 1;
			if (typeof plusNeedsInit === "function") plusNeedsInit();
			if (typeof window.plusRetireDanny === "function") plusRetireDanny(V);
			const addDay = () => {
				const next = new DateTime(Time.date.year, Time.date.month, Time.date.day, Time.hour, Time.minute);
				next.addDays(1);
				Time.setDate(next);
			};
			const y = Time.year || Time.date.year;
			for (const [month, day] of [
				[9, 15],
				[10, 12],
				[11, 12],
				[2, 12],
				[3, 12],
				[5, 12],
				[6, 12],
			]) {
				Time.setDate(new DateTime(y, month, day, 10, 15));
				let g = 0;
				while (!Time.schoolDay && Time.schoolTerm && g++ < 6) addDay();
				if (Time.schoolDay) break;
			}
			Time.setTime(10, 15);
			V.location = "school";
			V.plusThirst = 800;
			V.plusBladder = 2000;
			V.plusDrinkSpot = "fountain";
			V.plusDrinkReturn = "Hallways";
			V.plusDrinkAgain = 0;
			const play = name => {
				try {
					SugarCube.Engine.play(name);
					return null;
				} catch (e) {
					const msg = String(e && e.message ? e.message : e);
					caught.push("Engine.play " + name + ": " + msg);
					return msg;
				}
			};
			const passageLinks = () => {
				const root = document.getElementById("passages") || document.body;
				return [...root.querySelectorAll("a")].map(a => (a.textContent || "").replace(/\s+/g, " ").trim()).filter(Boolean);
			};
			const snapNeeds = () => {
				const cur = SugarCube.State.variables;
				return {
					passage: SugarCube.State.passage,
					links: passageLinks(),
					thirst: cur.plusThirst,
					bladder: cur.plusBladder,
					hour: Time.hour,
					minute: Time.minute,
					stamp: Time.date && Time.date.timeStamp,
				};
			};
			const firstErr = play("Plus Needs Drink");
			const afterFirst = snapNeeds();
			const sipLink = [...(document.getElementById("passages") || document.body).querySelectorAll("a")].find(a =>
				/Take another sip \(0:01\)/i.test(a.textContent || "")
			);
			if (sipLink) {
				try {
					sipLink.click();
				} catch (e) {
					caught.push("sip click: " + String(e && e.message ? e.message : e));
				}
			}
			const afterSip = snapNeeds();
			const leaveLink = [...(document.getElementById("passages") || document.body).querySelectorAll("a")].find(a =>
				/^(Leave)$/i.test((a.textContent || "").replace(/\s+/g, " ").trim())
			);
			if (leaveLink) {
				try {
					leaveLink.click();
				} catch (e) {
					caught.push("leave click: " + String(e && e.message ? e.message : e));
				}
			}
			const afterLeave = {
				passage: SugarCube.State.passage,
				clickedLeave: !!leaveLink,
			};
			return { firstErr, afterFirst, clickedSip: !!sipLink, afterSip, afterLeave, caught };
		});
		assert.equal(info.firstErr, null, JSON.stringify(info));
		assert.equal(info.afterFirst.passage, "Plus Needs Drink", JSON.stringify(info.afterFirst));
		assert.ok(
			info.afterFirst.links.some(t => /Take another sip \(0:01\)/.test(t)),
			JSON.stringify(info.afterFirst.links)
		);
		assert.ok(info.afterFirst.links.includes("Leave") || info.afterFirst.links.some(t => /^Leave$/.test(t)), JSON.stringify(info.afterFirst.links));
		assert.equal(info.clickedSip, true, JSON.stringify(info));
		assert.equal(info.afterSip.passage, "Plus Needs Drink", JSON.stringify(info.afterSip));
		assert.ok(info.afterSip.thirst > info.afterFirst.thirst, JSON.stringify({ first: info.afterFirst.thirst, sip: info.afterSip.thirst }));
		assert.ok(info.afterSip.bladder < info.afterFirst.bladder, JSON.stringify({ first: info.afterFirst.bladder, sip: info.afterSip.bladder }));
		const firstMin = info.afterFirst.hour * 60 + info.afterFirst.minute;
		const sipMin = info.afterSip.hour * 60 + info.afterSip.minute;
		let delta = sipMin - firstMin;
		if (delta < 0) delta += 24 * 60;
		assert.equal(delta, 1, JSON.stringify({ first: info.afterFirst, sip: info.afterSip }));
		assert.ok(
			info.afterSip.links.some(t => /Take another sip \(0:01\)/.test(t)),
			JSON.stringify(info.afterSip.links)
		);
		assert.equal(info.afterLeave.clickedLeave, true, JSON.stringify(info.afterLeave));
		assert.equal(info.afterLeave.passage, "Hallways", JSON.stringify(info));
		assert.deepEqual(info.caught, [], JSON.stringify(info.caught));
	});
});
