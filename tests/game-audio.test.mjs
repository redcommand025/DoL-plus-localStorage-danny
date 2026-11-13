// Static checks for the audio system ported from X-Change (headless playback check: tests/game-audio.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import os from "node:os";
import { execFileSync, spawnSync } from "node:child_process";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const read = p => fs.readFileSync(path.join(root, p), "utf8");

function makeAudio() {
	const tracks = new Map();
	let master = 1;
	let muteOnHidden = false;
	class Track {
		constructor(src) {
			this.src = src;
			this.audio = { src, currentSrc: src, readyState: 0, paused: true, currentTime: 0, duration: 100, volume: 1, addEventListener() {} };
			this.state = "unloaded";
			this._volume = 1;
			this._loop = false;
			this.handlers = {};
		}
		play() {
			this.state = "playing";
			this.audio.paused = false;
			return Promise.resolve();
		}
		pause() {
			if (this.state === "playing") this.state = "paused";
			this.audio.paused = true;
		}
		stop() {
			if (this.state !== "unloaded") this.state = "stopped";
			this.audio.paused = true;
		}
		load() {
			this.state = "stopped";
		}
		unload() {
			this.state = "unloaded";
			this.audio.paused = true;
		}
		isUnloaded() {
			return this.state === "unloaded";
		}
		isPlaying() {
			return this.state === "playing";
		}
		volume(v) {
			if (v === undefined) return this._volume;
			this._volume = v;
			return this;
		}
		loop(v) {
			if (v === undefined) return this._loop;
			this._loop = v;
			return this;
		}
		on(ev, fn) {
			this.handlers[ev] = fn;
			return this;
		}
		off() {
			this.handlers = {};
			return this;
		}
	}
	const SimpleAudio = {
		tracks: { add: (id, src) => tracks.set(id, new Track(src)), get: id => tracks.get(id) },
		volume: v => (v === undefined ? master : (master = v)),
		muteOnHidden: v => (v === undefined ? muteOnHidden : (muteOnHidden = v)),
	};
	return { SimpleAudio, tracks };
}

function load(vars = {}) {
	const { SimpleAudio, tracks } = makeAudio();
	const chain = { on: () => chain, off: () => chain, one: () => chain };
	const onLoad = [];
	const V = { options: {}, location: "town", passage: "Town Square", NPCList: [], outside: true, schoolstate: "morning", ...vars };
	const ctx = {
		window: { location: { protocol: "https:" } },
		V,
		SimpleAudio,
		Config: { audio: {} },
		Save: { onLoad: { add: fn => onLoad.push(fn) } },
		Time: { dayState: "day" },
		Weather: { name: "clear", precipitation: "none", enableLightning: false },
		$: () => chain,
		document: {},
		Promise,
	};
	Object.assign(ctx.window, { V, Time: ctx.Time, Weather: ctx.Weather });
	vm.runInNewContext(read("game/03-JavaScript/game-audio.js"), ctx);
	return { GameAudio: ctx.window.GameAudio, V, ctx, tracks, SimpleAudio, onLoad };
}

const tick = () => new Promise(resolve => setImmediate(resolve));
const playing = tracks => [...tracks.values()].filter(t => t.isPlaying()).map(t => t.src);

test("every playlist file and ambience clip exists, is real audio and matches its hash", () => {
	const out = execFileSync("python3", ["devTools/check-audio.py"], { cwd: root, encoding: "utf8" });
	assert.match(out, /Audio OK: \d+ files/);
	const { GameAudio } = load();
	for (const [id, files] of Object.entries(GameAudio.BGM)) {
		assert.ok(files.length > 0, id);
		for (const f of files) assert.ok(fs.existsSync(path.join(root, "audio/bgm", f)), `${id}: ${f}`);
	}
	for (const id of Object.values(GameAudio.LOCATIONS)) assert.ok(GameAudio.BGM[id] || ["town", "farm", "park", "school"].includes(id), id);
	assert.equal(fs.existsSync(path.join(root, ".gitattributes")) && /audio.*filter=lfs/.test(read(".gitattributes")), false);
});

test("the audio guard rejects Git LFS pointers and wrong hashes", () => {
	const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "audio-guard-"));
	for (const line of read("devTools/audio-files.sha256").split("\n")) {
		if (!line || line.startsWith("#")) continue;
		const rel = line.split("  ")[2];
		fs.mkdirSync(path.join(tmp, path.dirname(rel)), { recursive: true });
		fs.copyFileSync(path.join(root, rel), path.join(tmp, rel));
	}
	const ok = spawnSync("python3", ["devTools/check-audio.py", tmp], { cwd: root, encoding: "utf8" });
	assert.equal(ok.status, 0, ok.stderr);
	fs.writeFileSync(path.join(tmp, "audio/sfx/ambience/money.mp3"), "version https://git-lfs.github.com/spec/v1\noid sha256:00\nsize 1\n");
	const bad = spawnSync("python3", ["devTools/check-audio.py", tmp], { cwd: root, encoding: "utf8" });
	assert.equal(bad.status, 1);
	assert.match(bad.stderr, /Git LFS pointer, not audio: audio\/sfx\/ambience\/money\.mp3/);
	fs.rmSync(tmp, { recursive: true, force: true });
});

test("defaults are filled in for old saves and stored in $options", () => {
	const { GameAudio, V, SimpleAudio } = load();
	GameAudio.update();
	assert.deepEqual(
		{
			audio: V.options.audio,
			muteonhide: V.options.muteonhide,
			mastervolume: V.options.mastervolume,
			bgm_volume: V.options.bgm_volume,
			ambience_volume: V.options.ambience_volume,
		},
		{ audio: 1, muteonhide: 1, mastervolume: 0.5, bgm_volume: 1, ambience_volume: 1 }
	);
	assert.equal(SimpleAudio.volume(), 0.5);
	assert.equal(SimpleAudio.muteOnHidden(), true);
	const start = read("game/04-Variables/variables-start.twee");
	for (const key of ["audio: 1", "muteonhide: 1", "mastervolume: 0.5", "bgm_volume: 1", "ambience_volume: 1"]) assert.ok(start.includes(key), key);
});

test("music follows location, time of day and school hours", () => {
	const { GameAudio, ctx, V } = load();
	assert.equal(GameAudio.locationTheme("town"), "town-day");
	ctx.Time.dayState = "night";
	assert.equal(GameAudio.locationTheme("park"), "park-night");
	V.schoolstate = "morning";
	assert.equal(GameAudio.locationTheme("school"), "school");
	V.schoolstate = "late";
	assert.equal(GameAudio.locationTheme("school"), "afterschool");
	assert.equal(GameAudio.locationTheme("home"), "home");
	assert.equal(GameAudio.locationTheme("not_a_place"), null);
});

test("encounter and NPC themes interrupt and then resume the location theme", async () => {
	const { GameAudio, V, tracks } = load({ location: "cafe" });
	GameAudio.update();
	await tick();
	assert.equal(GameAudio.status().bgm, "cafe");
	assert.equal(playing(tracks).length, 1);
	V.NPCList = [{ fullDescription: "Robin" }];
	GameAudio.update();
	await tick();
	assert.equal(GameAudio.status().bgm, "Robin");
	assert.equal(GameAudio.status().paused, "cafe");
	assert.deepEqual(playing(tracks), ["audio/bgm/nnpc/Robin/Cedric%20Galke%20x%20Fachhochschule%20Dortmund%20-%20Flowers.mp3"]);
	V.NPCList = [];
	V.combat = 1;
	V.consensual = 0;
	GameAudio.update();
	await tick();
	assert.equal(GameAudio.status().bgm, "encounter-noncon");
	assert.equal(GameAudio.status().paused, "cafe");
	V.combat = 0;
	GameAudio.update();
	await tick();
	assert.equal(GameAudio.status().bgm, "cafe");
	assert.equal(GameAudio.status().paused, null);
	assert.equal(playing(tracks).length, 1);
	assert.match(playing(tracks)[0], /audio\/bgm\/cafe\//);
});

test("turning audio off or music to 0% stops it; volumes apply", () => {
	const { GameAudio, V, tracks, SimpleAudio, ctx } = load({ location: "town", outside: false });
	ctx.Weather.name = "heavyPrecipitation";
	ctx.Weather.precipitation = "rain";
	V.weatherObj = {};
	GameAudio.update();
	assert.ok(playing(tracks).some(s => s.includes("bgm/town/day/")));
	assert.ok(playing(tracks).some(s => s.endsWith("ambience/rain/rain.mp3")));
	const rain = [...tracks.values()].find(t => t.src.endsWith("rain/rain.mp3"));
	assert.equal(rain.volume(), 0.3, "muffled indoors");
	V.options.mastervolume = 0.2;
	V.options.bgm_volume = 0.4;
	GameAudio.update();
	assert.equal(SimpleAudio.volume(), 0.2);
	assert.equal([...tracks.values()].find(t => t.isPlaying() && t.src.includes("bgm/")).volume(), 0.4);
	V.options.bgm_volume = 0;
	GameAudio.update();
	assert.ok(!playing(tracks).some(s => s.includes("bgm/")));
	V.options.audio = 0;
	GameAudio.update();
	assert.deepEqual(playing(tracks), []);
});

test("weather ambience: rain, snow and lightning", () => {
	const { GameAudio, V, tracks, ctx } = load({ location: "park" });
	V.weatherObj = {};
	Object.assign(ctx.Weather, { name: "thunderstorm", precipitation: "snow", enableLightning: true, sidebar: {} });
	GameAudio.update();
	const amb = playing(tracks).filter(s => s.includes("ambience"));
	assert.deepEqual(amb.map(s => s.split("ambience/")[1]).sort(), ["snow/storm.mp3", "snow/thunderstorm.mp3", "snow/wind.mp3"]);
	GameAudio.lightning(ctx.Weather.sidebar);
	assert.ok(playing(tracks).some(s => s.endsWith("rain/lightning.mp3")));
	GameAudio.effect("money");
	assert.ok(playing(tracks).some(s => s.endsWith("ambience/money.mp3")));
	ctx.Weather.name = "clear";
	GameAudio.update();
	assert.ok(!playing(tracks).some(s => s.includes("snow/")));
});

test("no music on the start screen; loading a save stops the old theme", () => {
	const { GameAudio, V, tracks, onLoad } = load({ passage: "Start" });
	GameAudio.update();
	assert.deepEqual(playing(tracks), []);
	V.passage = "Town Square";
	GameAudio.update();
	assert.equal(playing(tracks).length, 1);
	onLoad.forEach(fn => fn());
	assert.deepEqual(playing(tracks), []);
});

test("options UI, passage hook and sound effect hooks are native", () => {
	const opts = read("game/base-system/overlays/options.twee");
	assert.match(opts, /<div class="settingsHeader options">Audio<\/div>/);
	for (const v of ["audio", "muteonhide"]) assert.match(opts, new RegExp(`<<checkbox "\\$options\\.${v}" 0 1 autocheck>>`));
	for (const v of ["mastervolume", "bgm_volume", "ambience_volume"])
		assert.match(opts, new RegExp(`<<numberslider "\\$options\\.${v}" \\$options\\.${v} 0 1 0\\.01`));
	assert.match(read("game/04-Variables/variables-passageFooter.twee"), /^:: PassageFooter\n<<update-audio>>/);
	assert.match(read("game/base-system/audio/audio.twee"), /<<widget "update-audio">>\s*<<run GameAudio\.update\(\)>>/);
	assert.match(read("game/base-system/stat-changes.js"), /GameAudio\.effect\("money"\)/);
	assert.match(read("game/03-JavaScript/bedroom-pills.js"), /GameAudio\.effect\("meds"\)/);
	assert.match(read("game/03-JavaScript/weather/03-canvas/02-lib/00-effects/effects-lightning.js"), /GameAudio\.lightning\(this\.renderInstance\)/);
	const src = read("game/03-JavaScript/game-audio.js");
	assert.doesNotMatch(src, /bgv\/|audio\/ve\/|sfx\/ejaculation|bgs\/(sex|rub|rotor)/);
	assert.ok(fs.statSync(path.join(root, "devTools/prepare-pages.sh")).mode & 0o111);
	assert.match(read("devTools/prepare-pages.sh"), /check-audio\.py "\$out"/);
});
