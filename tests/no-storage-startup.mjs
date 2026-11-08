/**
 * Integration check: load the compiled HTML with Web Storage getters denied
 * and IndexedDB open failing, then verify startup registrations.
 *
 * Usage: node tests/no-storage-startup.mjs [path-to-compiled.html]
 */
import { pathToFileURL } from "node:url";
import { dirname, join, resolve } from "node:path";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const htmlPath = resolve(process.argv[2] || join(root, "Degrees of Lewdity.html"));
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
const pageErrors = [];
page.on("dialog", async d => {
	alerts.push(d.message());
	try {
		await d.accept();
	} catch (e) {}
});
page.on("pageerror", err => {
	pageErrors.push(String(err && err.message ? err.message : err));
});

await page.evaluateOnNewDocument(() => {
	function denyAccess(obj, name) {
		try {
			Object.defineProperty(obj, name, {
				configurable: true,
				enumerable: true,
				get() {
					throw new DOMException("Failed to read the '" + name + "' property from 'Window': Access is denied for this document.", "SecurityError");
				},
				set() {
					throw new DOMException("Failed to read the '" + name + "' property from 'Window': Access is denied for this document.", "SecurityError");
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
			error: new DOMException("The user denied permission to access the database.", "UnknownError"),
			onerror: null,
			onsuccess: null,
			onupgradeneeded: null,
			onblocked: null,
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
		cmp() {
			return 0;
		},
		databases() {
			return Promise.reject(new DOMException("The user denied permission to access the database.", "UnknownError"));
		},
	};
	try {
		Object.defineProperty(window, "indexedDB", {
			configurable: true,
			enumerable: true,
			get() {
				return fakeIDB;
			},
		});
	} catch (e) {}
});

await page.goto(fileUrl, { waitUntil: "domcontentloaded", timeout: 180000 });
await new Promise(r => setTimeout(r, 8000));

const snapshot = await page.evaluate(() => {
	function probe(name) {
		try {
			const s = window[name];
			const t = "__probe__";
			s.setItem(t, "1");
			const ok = s.getItem(t) === "1";
			s.removeItem(t);
			return { ok, error: null };
		} catch (e) {
			return { ok: false, error: String(e) };
		}
	}
	return {
		deepMergeType: typeof Object.prototype.deepMerge,
		initFoodstuff: typeof window.initFoodstuff,
		initTendingConfig: typeof window.initTendingConfig,
		initFishingFishConfig: typeof window.initFishingFishConfig,
		clothing_data: !!(window.SugarCube && window.SugarCube.Macro && window.SugarCube.Macro.has && window.SugarCube.Macro.has("clothing_data")),
		sugarcube: !!window.SugarCube,
		indexedDBIsNull: window.indexedDB == null,
		localStorage: probe("localStorage"),
		sessionStorage: probe("sessionStorage"),
		errorViews: Array.from(document.querySelectorAll(".error-view")).map(el => (el.textContent || "").slice(0, 300)),
		passwordGate: !!document.getElementById("dol-password-gate"),
	};
});

await browser.close();

const problems = [];
if (alerts.some(m => /deepMerge is not a function/i.test(m))) problems.push("alert: deepMerge is not a function");
if (alerts.some(m => /initFoodstuff is not defined|initTendingConfig is not defined|initFishingFishConfig is not defined|clothing_data/i.test(m))) {
	problems.push("alert: StoryInit startup functions missing");
}
if (pageErrors.some(m => /denied permission to access the database/i.test(m))) {
	problems.push("pageerror: IndexedDB permission denial leaked");
}
if (snapshot.deepMergeType !== "function") problems.push("Object.prototype.deepMerge was not installed");
if (snapshot.initFoodstuff !== "function") problems.push("initFoodstuff was not registered");
if (snapshot.initTendingConfig !== "function") problems.push("initTendingConfig was not registered");
if (snapshot.initFishingFishConfig !== "function") problems.push("initFishingFishConfig was not registered");
if (!snapshot.clothing_data) problems.push("clothing_data macro was not registered");
if (!snapshot.localStorage.ok) problems.push("localStorage stub failed: " + snapshot.localStorage.error);
if (!snapshot.sessionStorage.ok) problems.push("sessionStorage stub failed: " + snapshot.sessionStorage.error);
if (!snapshot.indexedDBIsNull) problems.push("indexedDB was not disabled after storage denial");
if (snapshot.errorViews.length) problems.push("error-view: " + snapshot.errorViews.join(" | "));

const result = { ok: problems.length === 0, problems, alerts: alerts.map(m => m.slice(0, 200)), pageErrors, snapshot };
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exit(1);
