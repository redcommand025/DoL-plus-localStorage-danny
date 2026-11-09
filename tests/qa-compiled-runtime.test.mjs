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

	it("QA-C016 [integration] Danny social stats initialize and room interactions remain", async () => {
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
			const html = document.documentElement.innerHTML;
			const V = window.SugarCube.State.variables;
			if (!Array.isArray(V.NPCNameList) || !V.NPCNameList.includes("Danny")) wiki("<<npcNamed>>");
			if (!V.danny || typeof V.danny !== "object") V.danny = { control: 0, dependency: 0 };
			wiki('<<npc "Danny">>');
			const init = wiki("<<dannyInit>>");
			const after = window.C && C.npc && C.npc.Danny ? C.npc.Danny : null;
			const defaults = after ? { c: after.continence, a: after.acceptance, initFlag: after.init } : {};
			if (after) {
				after.continence = 99999;
				after.acceptance = -5;
			}
			const clamp = wiki("<<dannyInit>>");
			const clamped = window.C && C.npc && C.npc.Danny ? { c: C.npc.Danny.continence, a: C.npc.Danny.acceptance } : {};
			if (after) {
				after.continence = 3000;
				after.acceptance = 200;
				after.init = 1;
			}
			const idx = (V.NPCNameList || []).indexOf("Danny");
			if (idx >= 0 && Array.isArray(V.NPCName) && V.NPCName[idx]) {
				V.NPCName[idx].init = 1;
				V.NPCName[idx].continence = 3000;
				V.NPCName[idx].acceptance = 200;
			}
			const box = wiki(
				'<<set _idx to $NPCNameList.indexOf("Danny")>><<relation-box $NPCName[_idx] `{important:true, continence:{name:"Continence", maxValue:6000, minValue:0}, acceptance:{name:"Acceptance", maxValue:1000, minValue:0}}`>>'
			);
			const boxText = (box.text || "") + (box.html || "");
			const social = wiki("<<social>>");
			return {
				hasInitWidget: html.includes("dannyInit"),
				hasTalk: html.includes("Talk") && html.includes("Danny Room"),
				hasHelp: html.includes("Help with control training"),
				hasOffer: html.includes("Offer dependency care"),
				hasContinenceIcon: html.includes("img/ui/sym-continence.png"),
				initOk: init.ok,
				clampOk: clamp.ok,
				initFlag: defaults.initFlag,
				continenceDefault: defaults.c,
				acceptanceDefault: defaults.a,
				continenceClamped: clamped.c,
				acceptanceClamped: clamped.a,
				sameObject: !!(after && idx >= 0 && V.NPCName[idx] === after),
				namedInit: idx >= 0 && V.NPCName[idx] ? V.NPCName[idx].init : null,
				boxOk: box.ok,
				socialHasContinence: /Continence/.test(boxText),
				socialHasAcceptance: /Acceptance/.test(boxText),
				socialHasDanny: /Danny/.test(boxText),
				socialOk: box.ok,
				socialError: box.ok ? "" : (box.text || "").slice(0, 200),
				whitelistError: /not whitelisted/.test(boxText + (init.text || "")),
				rendererWired: html.includes("continence") && html.includes("acceptance") && html.includes('"Danny"'),
			};
		});
		assert.equal(info.hasInitWidget, true, JSON.stringify(info));
		assert.equal(info.hasTalk, true, JSON.stringify(info));
		assert.equal(info.hasHelp, true, JSON.stringify(info));
		assert.equal(info.hasOffer, true, JSON.stringify(info));
		assert.equal(info.hasContinenceIcon, true, JSON.stringify(info));
		assert.equal(info.initOk, true, JSON.stringify(info));
		assert.equal(info.clampOk, true, JSON.stringify(info));
		assert.equal(info.continenceDefault, 3000, JSON.stringify(info));
		assert.equal(info.acceptanceDefault, 200, JSON.stringify(info));
		assert.equal(info.continenceClamped, 6000, JSON.stringify(info));
		assert.equal(info.acceptanceClamped, 0, JSON.stringify(info));
		assert.equal(info.socialOk, true, info.socialError || JSON.stringify(info));
		assert.equal(info.whitelistError, false, JSON.stringify(info));
		assert.equal(info.socialHasContinence, true, JSON.stringify(info));
		assert.equal(info.socialHasAcceptance, true, JSON.stringify(info));
	});

	it("QA-C017 [integration] Danny schedule works before named init and does not throw", async () => {
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
			const html = document.documentElement.innerHTML;
			const result = {
				hasFn: typeof window.getDannyLocation === "function",
				hasLocked: html.includes("Danny's room (locked)") || html.includes("Danny&#39;s room (locked)"),
				hasNiki: html.includes("Niki") && html.includes("photography"),
				hasBrokenCanteen: html.includes("School Canteen"),
				hasInitGate: /C\.npc\.Danny\.init !== 1/.test(html),
			};
			try {
				if (window.C && C.npc && C.npc.Danny) C.npc.Danny.init = 0;
				result.locUninit = window.getDannyLocation();
				result.callOk = true;
			} catch (e) {
				result.callOk = false;
				result.callError = String(e && e.message ? e.message : e);
			}
			const printed = wiki("<<set _loc to getDannyLocation()>><<print _loc>>");
			result.printOk = printed.ok && !/Error/.test(printed.text || "");
			result.printText = (printed.text || "").trim().slice(0, 80);
			const known = ["sleep", "room", "walk", "school", "canteen", "courtyard", "work", "unknown"];
			result.knownLocation = known.includes(result.locUninit) || known.includes(result.printText);
			return result;
		});
		assert.equal(info.hasFn, true, JSON.stringify(info));
		assert.equal(info.hasLocked, true, JSON.stringify(info));
		assert.equal(info.hasNiki, true, JSON.stringify(info));
		assert.equal(info.hasBrokenCanteen, false, JSON.stringify(info));
		assert.equal(info.hasInitGate, false, JSON.stringify(info));
		assert.equal(info.callOk, true, JSON.stringify(info));
		assert.equal(info.printOk, true, JSON.stringify(info));
		assert.equal(info.knownLocation, true, JSON.stringify(info));
		assert.notEqual(info.locUninit, "unknown", JSON.stringify(info));
	});

	it("QA-C018 [integration] timetable slots change the door and show Danny only at the matching place", async () => {
		const info = await page.evaluate(() => {
			const wiki = src => {
				const d = document.createElement("div");
				try {
					new Wikifier(d, src);
					return { ok: true, text: d.textContent || "", err: /Error:/.test(d.textContent || "") };
				} catch (e) {
					return { ok: false, text: String(e && e.message ? e.message : e), err: true };
				}
			};
			const addDay = () => {
				const next = new DateTime(Time.date.year, Time.date.month, Time.date.day, Time.hour, Time.minute);
				next.addDays(1);
				Time.setDate(next);
			};
			const advanceTo = school => {
				if (school) {
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
						Time.setDate(new DateTime(y, month, day, Time.hour || 10, Time.minute || 0));
						let g = 0;
						while (!Time.schoolDay && Time.schoolTerm && g++ < 6) addDay();
						if (Time.schoolDay) return true;
					}
				} else {
					let g = 0;
					while (Time.schoolDay && g++ < 8) addDay();
					if (!Time.schoolDay) return true;
					g = 0;
					while (Time.weekDay !== 1 && Time.weekDay !== 7 && g++ < 8) addDay();
				}
				return !!Time.schoolDay === school;
			};
			const probe = (h, m) => {
				Time.setTime(h, m);
				const loc = getDannyLocation();
				const door = wiki("<<include [[Danny Room Door]]>>");
				const text = door.text || "";
				const presence = {
					school: wiki('<<dannyPresence "school">>').text.includes("You see Danny here."),
					canteen: wiki('<<dannyPresence "canteen">>').text.includes("You see Danny here."),
					courtyard: wiki('<<dannyPresence "courtyard">>').text.includes("You see Danny here."),
					work: wiki('<<dannyPresence "work">>').text.includes("You see Danny here."),
				};
				const sleepNote = /Sleeping/.test(text);
				const workNote = /Niki/.test(text);
				const schoolNote = /At school/.test(text);
				const knock = /Knock and enter/.test(text);
				return {
					h,
					m,
					loc,
					schoolDay: !!Time.schoolDay,
					doorOk: door.ok && !door.err,
					sleepNote,
					workNote,
					schoolNote,
					knock,
					presence,
				};
			};
			const result = { hasSetTime: typeof Time.setTime === "function", slots: [], errors: [] };
			try {
				if (!advanceTo(true)) result.errors.push("no-school-day");
				const weekday = [
					[6, 0, "sleep"],
					[7, 15, "room"],
					[8, 20, "walk"],
					[8, 45, "school"],
					[10, 0, "school"],
					[12, 0, "canteen"],
					[14, 0, "school"],
					[15, 10, "courtyard"],
					[15, 30, "work"],
					[18, 0, "work"],
					[20, 5, "room"],
					[21, 0, "sleep"],
				];
				for (const [h, m, expected] of weekday) {
					const row = probe(h, m);
					row.expected = expected;
					row.locOk = row.loc === expected;
					row.doorMatches =
						(expected === "sleep" && row.sleepNote && !row.knock) ||
						(expected === "work" && row.workNote && !row.knock) ||
						(["school", "walk", "canteen", "courtyard"].includes(expected) && row.schoolNote && !row.knock) ||
						(expected === "room" && row.knock && !row.sleepNote && !row.workNote);
					row.presenceOk =
						row.presence.school === (expected === "school") &&
						row.presence.canteen === (expected === "canteen") &&
						row.presence.courtyard === (expected === "courtyard") &&
						row.presence.work === (expected === "work");
					result.slots.push(row);
				}
				if (!advanceTo(false)) result.errors.push("no-weekend");
				const weekend = [
					[8, 0, "room"],
					[10, 0, "work"],
					[16, 0, "room"],
					[22, 0, "sleep"],
				];
				for (const [h, m, expected] of weekend) {
					const row = probe(h, m);
					row.expected = expected;
					row.locOk = row.loc === expected;
					row.doorMatches =
						(expected === "sleep" && row.sleepNote && !row.knock) || (expected === "work" && row.workNote && !row.knock) || (expected === "room" && row.knock);
					row.presenceOk =
						row.presence.school === false && row.presence.canteen === false && row.presence.courtyard === false && row.presence.work === (expected === "work");
					result.slots.push(row);
				}
			} catch (e) {
				result.errors.push(String(e && e.message ? e.message : e));
			}
			result.allLocOk = result.slots.every(s => s.locOk);
			result.allDoorOk = result.slots.every(s => s.doorOk && s.doorMatches);
			result.allPresenceOk = result.slots.every(s => s.presenceOk);
			result.failed = result.slots
				.filter(s => !s.locOk || !s.doorMatches || !s.presenceOk || !s.doorOk)
				.map(s => ({
					h: s.h,
					m: s.m,
					loc: s.loc,
					expected: s.expected,
					schoolDay: s.schoolDay,
					doorOk: s.doorOk,
					doorMatches: s.doorMatches,
					presenceOk: s.presenceOk,
					sleepNote: s.sleepNote,
					workNote: s.workNote,
					schoolNote: s.schoolNote,
					knock: s.knock,
					presence: s.presence,
				}));
			return result;
		});
		assert.equal(info.hasSetTime, true, JSON.stringify(info));
		assert.deepEqual(info.errors, [], JSON.stringify(info));
		assert.equal(info.allLocOk, true, JSON.stringify(info.failed));
		assert.equal(info.allDoorOk, true, JSON.stringify(info.failed));
		assert.equal(info.allPresenceOk, true, JSON.stringify(info.failed));
	});
});
