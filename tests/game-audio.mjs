/**
 * Audio check on a served copy of the compiled game (Options > Audio, music and volume controls).
 *
 *   node tests/game-audio.mjs <http(s)://site/> [--mode=both|normal|strict]
 *
 * The folder needs index.html (compiled game), img/ and audio/. strict = localStorage/sessionStorage throw and
 * indexedDB.open() is denied. Chrome runs with autoplay allowed (as after a click). Checks that the location
 * theme loads (readyState 4) and plays (currentTime advances), that moving to another location switches theme,
 * that the Audio options exist and master volume, music volume and Enable audio work, that the settings are
 * stored in $options, and that there are no page errors or audio 404s.
 */
import { createRequire } from "node:module";

const args = process.argv.slice(2);
const url = args.find(a => !a.startsWith("--"));
const modeArg = (args.find(a => a.startsWith("--mode=")) || "--mode=both").slice(7);
if (!url || !/^https?:\/\//.test(url)) {
	console.error("usage: node tests/game-audio.mjs <http(s)://site/> [--mode=both|normal|strict]");
	process.exit(2);
}
const require = createRequire(import.meta.url);
let puppeteer;
for (const id of ["puppeteer-core", "puppeteer", "/tmp/dol-diag/node_modules/puppeteer-core"]) {
	try {
		puppeteer = require(id);
		break;
	} catch (e) {}
}
if (!puppeteer) {
	console.error("puppeteer-core is required");
	process.exit(1);
}

function blockStorage() {
	const deny = name => () => {
		throw new DOMException(`Failed to read the '${name}' property from 'Window': Access is denied for this document.`, "SecurityError");
	};
	for (const name of ["localStorage", "sessionStorage"]) {
		for (const t of [Window.prototype, window]) {
			try {
				Object.defineProperty(t, name, { configurable: true, enumerable: true, get: deny(name), set: deny(name) });
			} catch (e) {}
		}
	}
	const denied = () => {
		const req = { error: new DOMException("The user denied permission to access the database.", "UnknownError"), onerror: null };
		setTimeout(() => {
			try {
				if (req.onerror) req.onerror({ type: "error", target: req, preventDefault() {} });
			} catch (e) {}
		}, 0);
		return req;
	};
	const fake = { open: denied, deleteDatabase: denied, cmp: () => 0, databases: () => Promise.reject(new Error("denied")) };
	try {
		Object.defineProperty(window, "indexedDB", { configurable: true, enumerable: true, get: () => fake });
	} catch (e) {}
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function run(browser, mode) {
	const page = await browser.newPage();
	const pageErrors = [];
	const consoleErrors = [];
	const audioResponses = [];
	const bad = [];
	page.on("pageerror", e => pageErrors.push(String(e.message || e)));
	page.on("console", m => m.type() === "error" && consoleErrors.push(m.text()));
	page.on("response", r => {
		const u = decodeURIComponent(r.url());
		if (u.includes("/audio/")) audioResponses.push({ status: r.status(), path: u.split("/audio/")[1] });
		if (r.status() >= 400 && !/usettings\.js$/.test(u)) bad.push(`${r.status()} ${u}`);
	});
	if (mode === "strict") await page.evaluateOnNewDocument(blockStorage);
	await page.goto(url, { waitUntil: "domcontentloaded", timeout: 180000 });
	await page.waitForFunction(() => window.SugarCube && SugarCube.State && SugarCube.State.passage === "Start", { timeout: 120000 });
	const ev = (fn, ...a) => page.evaluate(fn, ...a);
	const problems = [];
	const results = { mode };
	results.storage = await ev(() => ({ localStorageStub: !(window.localStorage instanceof Storage), idb: !!(window.idb && idb.active) }));
	results.startScreen = await ev(() => GameAudio.status().bgm);
	if (results.startScreen) problems.push("music on the start screen: " + results.startScreen);

	await ev(async () => {
		const s = ms => new Promise(r => setTimeout(r, ms));
		document.getElementById("dol-password-gate")?.remove();
		SugarCube.Engine.play("Start2");
		await s(1000);
		Object.assign(SugarCube.State.variables.options, { sidebarAnimations: false, blinkingEnabled: false });
		SugarCube.Engine.play("Orphanage Intro");
		await s(1000);
		SugarCube.Engine.play("Bedroom");
	});
	const music = () =>
		ev(() => {
			const st = GameAudio.status();
			const t = st.tracks.filter(x => x.key.startsWith("bgm/") && !x.paused);
			return { bgm: st.bgm, master: st.master, playing: t };
		});
	const sample = async label => {
		await page
			.waitForFunction(() => GameAudio.status().tracks.some(x => x.key.startsWith("bgm/") && !x.paused && x.readyState === 4), { timeout: 60000 })
			.catch(() => {});
		const a = await music();
		await sleep(1500);
		const b = await music();
		const t0 = a.playing[0];
		const t1 = b.playing.find(x => t0 && x.key === t0.key);
		const r = {
			bgm: b.bgm,
			src: t1 && decodeURIComponent(t1.src.split("/audio/")[1] || ""),
			readyState: t1 && t1.readyState,
			advanced: !!(t0 && t1 && t1.currentTime > t0.currentTime),
			volume: t1 && t1.volume,
		};
		if (!t1 || t1.readyState !== 4 || !r.advanced) problems.push(`${label}: music not playing ${JSON.stringify(r)}`);
		return r;
	};
	results.bedroom = await sample("Bedroom");
	if (results.bedroom.bgm !== "home") problems.push("Bedroom theme is " + results.bedroom.bgm);

	const openPerformance = async () => {
		await ev(() => {
			$.wiki('<<overlayReplace "options">>');
			$.wiki("<<replace #customOverlayContent>><<optionsperformance>><</replace>>");
		});
		await sleep(800);
	};
	const closeOverlay = () => ev(() => $.wiki("<<closeOverlay>>")).catch(() => {});
	const slide = (id, value) =>
		ev(
			(id, value) => {
				const el = document.getElementById(`numberslider-input-options${id.replace(/_/g, "-")}`);
				el.value = value;
				el.dispatchEvent(new Event("input", { bubbles: true }));
				el.dispatchEvent(new Event("change", { bubbles: true }));
			},
			id,
			value
		);
	await openPerformance();
	results.ui = await ev(() => ({
		header: Array.from(document.querySelectorAll(".settingsHeader")).some(h => h.textContent.trim() === "Audio"),
		audio: !!document.getElementById("checkbox-optionsaudio"),
		muteonhide: !!document.getElementById("checkbox-optionsmuteonhide"),
		sliders: ["mastervolume", "bgm_volume", "ambience_volume"].filter(id => document.getElementById(`numberslider-input-options${id.replace(/_/g, "-")}`)),
	}));
	if (!results.ui.header || !results.ui.audio || !results.ui.muteonhide || results.ui.sliders.length !== 3)
		problems.push("Audio options incomplete: " + JSON.stringify(results.ui));

	await slide("mastervolume", 0.2);
	await sleep(800);
	const m = await music();
	results.master = {
		option: await ev(() => SugarCube.State.variables.options.mastervolume),
		simpleAudio: m.master,
		elementVolume: m.playing[0] && m.playing[0].volume,
	};
	if (results.master.option !== 0.2 || Math.abs(m.master - 0.2) > 1e-6 || !(m.playing[0] && Math.abs(m.playing[0].volume - 0.2) < 0.02))
		problems.push("master volume not applied: " + JSON.stringify(results.master));

	await slide("bgm_volume", 0);
	await sleep(800);
	results.musicOff = (await music()).playing.length;
	if (results.musicOff !== 0) problems.push("music still playing at 0% music volume");
	await slide("bgm_volume", 1);
	await sleep(800);
	results.musicBack = (await music()).playing.length;
	if (results.musicBack !== 1) problems.push("music did not resume at 100%");

	await ev(() => document.getElementById("checkbox-optionsaudio").click());
	await sleep(800);
	results.audioOff = {
		option: await ev(() => SugarCube.State.variables.options.audio),
		playing: await ev(() => GameAudio.status().tracks.filter(x => !x.paused).length),
	};
	if (results.audioOff.option !== 0 || results.audioOff.playing !== 0)
		problems.push("Enable audio off did not stop audio: " + JSON.stringify(results.audioOff));
	await ev(() => document.getElementById("checkbox-optionsaudio").click());
	await sleep(800);
	await slide("mastervolume", 0.5);
	await sleep(500);
	await closeOverlay();
	results.audioBack = await sample("re-enabled");

	await ev(() => SugarCube.Engine.play("Domus Street"));
	results.town = await sample("Domus Street");
	if (!/^town-(day|night)$/.test(results.town.bgm)) problems.push("Domus Street theme is " + results.town.bgm);
	const playingNow = (await music()).playing.length;
	if (playingNow !== 1) problems.push(`${playingNow} music tracks playing at once`);

	/* one-shot sound effect (spending money) loads and starts */
	await ev(() => GameAudio.effect("money"));
	await page.waitForFunction(() => GameAudio.status().tracks.some(x => x.key === "ambience/money" && x.readyState >= 2), { timeout: 30000 }).catch(() => {});
	results.moneySfx = await ev(() => GameAudio.status().tracks.find(x => x.key === "ambience/money") || null);
	if (!results.moneySfx || results.moneySfx.readyState < 2) problems.push("money sound effect did not load: " + JSON.stringify(results.moneySfx));

	results.audioRequests = { ok: audioResponses.filter(r => r.status < 400).length, failed: audioResponses.filter(r => r.status >= 400).map(r => r.path) };
	if (results.audioRequests.failed.length) problems.push("audio requests failed: " + results.audioRequests.failed.join(", "));
	/* storage follows the DoL-localStorage method, which leaves a denied IndexedDB alone: SugarCube's idb adapter
	   then reports an uncaught "denied permission" rejection. Reported, not failed; any other page error fails. */
	const idbDenialErrors = pageErrors.filter(m => /denied permission to access the database|indexeddb/i.test(m));
	const otherPageErrors = pageErrors.filter(m => !idbDenialErrors.includes(m));
	results.idbDenialErrors = idbDenialErrors.length;
	if (otherPageErrors.length) problems.push("page errors: " + otherPageErrors.join(" | "));
	await page.close();
	return { mode, ok: problems.length === 0, problems, results, consoleErrors: [...new Set(consoleErrors)], otherHttpErrors: [...new Set(bad)] };
}

const browser = await puppeteer.launch({
	executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
	headless: "new",
	args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required", "--mute-audio"],
});
const modes = modeArg === "both" ? ["normal", "strict"] : [modeArg];
const out = [];
try {
	for (const mode of modes) out.push(await run(browser, mode));
} finally {
	await browser.close();
}
console.log(JSON.stringify(out, null, 2));
process.exit(out.every(r => r.ok) ? 0 : 1);
