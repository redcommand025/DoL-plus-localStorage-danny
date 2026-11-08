/**
 * Compiled-runtime checks for the Tutorial NPC-count fix.
 *
 * Usage: node tests/tutorial-npc-count.mjs [path-to-compiled.html]
 */
import { pathToFileURL } from "node:url";
import { dirname, join, resolve } from "node:path";
import { existsSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function findCompiledHtml(explicit) {
	if (explicit) return resolve(explicit);
	const preferred = join(root, "Degrees of Lewdity.html");
	if (existsSync(preferred)) return preferred;
	const matches = readdirSync(root).filter(name => /^Degrees of Lewdity.*\.html$/.test(name));
	if (matches.length) return join(root, matches.sort().at(-1));
	return preferred;
}

const htmlPath = findCompiledHtml(process.argv[2]);
if (!existsSync(htmlPath)) {
	console.error("Compiled HTML not found:", htmlPath);
	process.exit(1);
}

const require = createRequire(import.meta.url);
let puppeteer;
try {
	puppeteer = require("puppeteer-core");
} catch (e) {
	try {
		puppeteer = require("/tmp/dol-diag/node_modules/puppeteer-core");
	} catch (e2) {
		console.error("puppeteer-core is required to run this integration test");
		process.exit(1);
	}
}

const fileUrl = pathToFileURL(htmlPath).href;
const browser = await puppeteer.launch({
	executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
	headless: "new",
	args: ["--no-sandbox", "--disable-gpu", "--allow-file-access-from-files"],
});
const page = await browser.newPage();
const alerts = [];
page.on("dialog", async d => {
	alerts.push(d.message());
	try {
		await d.accept();
	} catch (e) {}
});

await page.evaluateOnNewDocument(() => {
	function denyAccess(obj, name) {
		try {
			Object.defineProperty(obj, name, {
				configurable: true,
				enumerable: true,
				get() {
					throw new DOMException("Access is denied", "SecurityError");
				},
				set() {
					throw new DOMException("Access is denied", "SecurityError");
				},
			});
		} catch (e) {}
	}
	try {
		denyAccess(typeof Window !== "undefined" ? Window.prototype : window, "localStorage");
	} catch (e) {}
	try {
		denyAccess(window, "localStorage");
	} catch (e) {}
	try {
		denyAccess(typeof Window !== "undefined" ? Window.prototype : window, "sessionStorage");
	} catch (e) {}
	try {
		denyAccess(window, "sessionStorage");
	} catch (e) {}
	function deniedRequest() {
		const req = {
			result: undefined,
			error: new DOMException("denied", "UnknownError"),
			onerror: null,
			onsuccess: null,
		};
		setTimeout(() => {
			try {
				if (typeof req.onerror === "function") req.onerror({ type: "error", target: req });
			} catch (e) {}
		}, 0);
		return req;
	}
	const fakeIDB = {
		open() {
			return deniedRequest();
		},
		deleteDatabase() {
			return deniedRequest();
		},
		databases() {
			return Promise.reject(new Error("denied"));
		},
	};
	try {
		Object.defineProperty(window, "indexedDB", {
			configurable: true,
			get() {
				return fakeIDB;
			},
		});
	} catch (e) {}
});

await page.goto(fileUrl, { waitUntil: "domcontentloaded", timeout: 180000 });
await new Promise(r => setTimeout(r, 8000));

const result = await page.evaluate(() => {
	const SC = window.SugarCube;
	if (!SC) return { error: "no SugarCube" };
	const V = SC.State.variables;
	const wiki = code => {
		try {
			SC.Wikifier.wikifyEval(code);
			return { ok: true };
		} catch (e) {
			return { ok: false, error: String(e && e.message ? e.message : e) };
		}
	};
	const slot = i => {
		const n = V.NPCList && V.NPCList[i];
		if (!n || typeof n !== "object") return { missing: true };
		return {
			pronoun: n.pronoun || null,
			active: n.active || null,
			lefthand: n.lefthand,
			righthand: n.righthand,
			chest: n.chest,
			fullDescription: n.fullDescription || null,
		};
	};
	const snap = extra =>
		Object.assign(
			{
				enemyno: V.enemyno,
				enemynomax: V.enemynomax,
				slot0: slot(0),
				slot1: slot(1),
			},
			extra || {}
		);

	const cases = [];
	const record = (name, setup, extraAssert) => {
		const setupResult = wiki(setup);
		const after = snap({ setupOk: setupResult.ok, setupError: setupResult.error || null });
		const man = wiki("<<man>>");
		after.manOk = man.ok;
		after.manError = man.error || null;
		after.hasPersonselect1 = !!(man.error && man.error.includes("Undefined NPC in personselect 1"));
		if (typeof extraAssert === "function") extraAssert(after);
		cases.push({ name, ...after });
		wiki("<<endevent>><<set $enemyno to 0>><<set $enemynomax to 0>>");
	};

	const boot = wiki("<<gameStartOnly>><<variablesStart2>>");
	if (!boot.ok) return { error: "boot failed: " + boot.error };

	record("stale count 1 + generate1", "<<set $enemyno to 1>><<generate1>><<maninit>>");
	record("double generate1", "<<generate1>><<generate1>><<maninit>>");
	record("Bailey without endevent", "<<npc Bailey>><<person1>><<generate1>><<person1>><<maninit>>");
	record("generate1 then generate2", "<<generate1>><<generate2>><<person1>><<person2>><<maninit>>");
	record("Bailey then generate2", "<<npc Bailey>><<person1>><<generate2>><<person2>><<maninit>>");

	wiki('<<endevent>><<set $enemyno to 0>><<generate1>><<person1>><<set $molestationstart to 1>><<set $tutorialExit to "Domus Street">>');
	const beforeTutorial = snap();
	let playErr = null;
	try {
		SC.Engine.play("Tutorial");
	} catch (e) {
		playErr = String(e && e.message ? e.message : e);
	}
	const html = (document.getElementById("passages") && document.getElementById("passages").innerText) || "";
	const tutorialErrors = Array.from(document.querySelectorAll(".error, .red"))
		.map(el => (el.textContent || "").trim())
		.filter(Boolean)
		.slice(0, 20);
	cases.push({
		name: "clean Start2/Tutorial",
		...snap({
			setupOk: true,
			playErr,
			passage: SC.State.active && SC.State.active.title,
			htmlHasPersonselect1: html.includes("Undefined NPC in personselect 1") || tutorialErrors.some(t => t.includes("Undefined NPC in personselect 1")),
			htmlHasTutorial: /Combat Tutorial/i.test(html),
			beforeEnemyno: beforeTutorial.enemyno,
		}),
		manOk: !playErr && !html.includes("Undefined NPC in personselect 1"),
		manError: playErr,
		hasPersonselect1: html.includes("Undefined NPC in personselect 1"),
	});

	return { cases, passage: SC.State.active && SC.State.active.title };
});

await browser.close();

if (result.error) {
	console.error(result.error);
	process.exit(1);
}

const failures = [];
function expect(name, cond, detail) {
	if (!cond) failures.push(`${name}: ${detail}`);
}

for (const c of result.cases) {
	const stubSymptoms = /Undefined NPC in personselect 1|reading 'startsWith'|Hand: (?:left|right) Value: undefined|reading 'toString'/;
	if (c.name === "stale count 1 + generate1" || c.name === "double generate1" || c.name === "Bailey without endevent") {
		expect(c.name, c.enemyno === 1, `enemyno=${c.enemyno} expected 1`);
		expect(c.name, c.enemynomax === 1, `enemynomax=${c.enemynomax} expected 1`);
		expect(c.name, !!c.slot0.pronoun, `slot0 missing pronoun`);
		expect(c.name, c.slot0.active === "active", `slot0 not active`);
		expect(c.name, !c.slot1.pronoun, `slot1 unexpectedly generated`);
		expect(c.name, c.slot1.active !== "active", `slot1 stub was activated`);
		expect(c.name, !c.hasPersonselect1 && !stubSymptoms.test(c.manError || ""), c.manError || "stub NPC symptoms in man");
	} else if (c.name === "generate1 then generate2" || c.name === "Bailey then generate2") {
		expect(c.name, c.enemyno === 2, `enemyno=${c.enemyno} expected 2`);
		expect(c.name, c.enemynomax === 2, `enemynomax=${c.enemynomax} expected 2`);
		expect(c.name, !!c.slot0.pronoun, `slot0 missing pronoun`);
		expect(c.name, !!c.slot1.pronoun, `slot1 missing pronoun`);
		expect(c.name, c.slot0.active === "active", `slot0 not active`);
		expect(c.name, c.slot1.active === "active", `slot1 not active`);
		expect(c.name, !c.hasPersonselect1 && !stubSymptoms.test(c.manError || ""), c.manError || "stub NPC symptoms in man");
	} else if (c.name === "clean Start2/Tutorial") {
		expect(c.name, c.passage === "Tutorial", `passage=${c.passage}`);
		expect(c.name, c.beforeEnemyno === 1, `beforeEnemyno=${c.beforeEnemyno}`);
		expect(c.name, !c.hasPersonselect1 && !c.htmlHasPersonselect1, "Tutorial HTML contained personselect 1");
		expect(c.name, !c.playErr, c.playErr || "Engine.play failed");
		expect(c.name, c.htmlHasTutorial, "Tutorial passage text missing");
	}
}

console.log(JSON.stringify({ htmlPath, alerts: alerts.length, cases: result.cases, failures }, null, 2));
if (failures.length) {
	console.error("FAILED\n" + failures.join("\n"));
	process.exit(1);
}
console.log("npc-count runtime tests passed");
