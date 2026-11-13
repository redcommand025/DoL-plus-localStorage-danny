/* globals SimpleAudio, Weather, Save, Time */
/* Game audio, ported from DoL X-Change's audio system (background music, weather ambience and a few sound effects).
 *
 * Settings live in $options, so they are part of the save and work without browser storage:
 *   audio (0/1), muteonhide (0/1), mastervolume, bgm_volume, ambience_volume (0..1)
 *
 * <<update-audio>> (Audio Widgets) runs from PassageFooter on every passage and picks the music for the current
 * location, encounter or named NPC; weather ambience follows Weather and is muffled indoors.
 * X-Change's sex sounds and voiceovers are intentionally not ported.
 */
window.GameAudio = (() => {
	"use strict";

	const DEFAULTS = { audio: 1, muteonhide: 1, mastervolume: 0.5, bgm_volume: 1, ambience_volume: 1 };

	/* Playlist id -> files under audio/bgm/ */
	const BGM = {
		arcade: ["arcade/HoliznaCC0 - Mutant Club.mp3"],
		asylum: ["asylum/Pulse Burst - The Organization of Society and the Conditions of Health & Safety.mp3"],
		beach: ["beach/Anthem of Rain - Bad Nostalgia (Instrumental).mp3"],
		brothel: ["brothel/Beat Mekanik - Pink Soul.mp3"],
		cafe: ["cafe/Mr Smith - Constance Chill.mp3"],
		dance_studio: ["dance_studio/Anthem of Rain - So My Love - Instrumental.mp3"],
		"encounter-consensual": ["encounter/consensual/Hotham - Love Me Back (Instrumental).mp3"],
		"encounter-noncon": ["encounter/noncon/Audroid Mk1 - Dark Moon.mp3"],
		"farm-day": ["farm/day/legacyAlli - RF Country Landscape.mp3"],
		"farm-night": ["farm/night/Axletree - The New Mown Hay, feat. Will Mason (after Holst).mp3"],
		forest: ["forest/HoliznaCC0 - Yesterday.mp3"],
		hospital: ["hospital/Portrayal - Out of Light.mp3"],
		home: ["home/Jahzzar - Maybe.mp3"],
		island: ["island/Mark Wilson X - Ritual.mp3"],
		mma_gym: ["mma_gym/Anthem of Rain - Rock This House (Instrumental).mp3"],
		meadow: ["meadow/Strobotone - City Meadow.mp3"],
		moor: ["moor/A. Cooper - Sleeping Cat.mp3"],
		Avery: ["nnpc/Avery/Beat Mekanik - Savage.mp3"],
		Bailey: ["nnpc/Bailey/Frequently Asked Music - Hallo Holla Halloween.mp3"],
		Eden: ["nnpc/Eden/Anthem of Rain - Blood (Instrumental).mp3"],
		Gwylan: ["nnpc/Gwylan/LaFaena - Magic In The Magician's Library.mp3"],
		IvoryWraith: ["nnpc/Ivory Wraith/Pulse Burst - all hail the shine (in good health).mp3"],
		Kylar: ["nnpc/Kylar/HoliznaCC0 - Machines With Feelings.mp3"],
		Robin: ["nnpc/Robin/Cedric Galke x Fachhochschule Dortmund - Flowers.mp3"],
		Sydney: ["nnpc/Sydney/Beat Mekanik - Dreams (Free Stems).mp3"],
		Whitney: ["nnpc/Whitney/Beat Mekanik - Influence.mp3"],
		Wren: ["nnpc/Wren/Mr Smith - Badass.mp3"],
		Zephyr: ["nnpc/Zephyr/Mr Smith - Blood In The Water.mp3"],
		office: ["office/Lite Saturation - Upbeat Corporate - Medium1.mp3"],
		old_temple: ["old_temple/Xennial - Coven.mp3"],
		"park-day": ["park/day/snoozy beats - green valley.mp3"],
		"park-night": ["park/night/Kirk Osamayo - Early Morning Self Reflection.mp3"],
		prison: ["prison/HoliznaCC0 - Between Life And Death.mp3"],
		pub: ["pub/Jahzzar - Boulevard St Germain.mp3"],
		school: ["school/Beat Mekanik - Flashy.mp3"],
		afterschool: ["school/afterschool/Myra Russell - Peaceful Serenity (Part 1).mp3"],
		sea: ["sea/KaizanBlu - Deep.mp3"],
		Poppy: ["nnpc/Poppy/Makaih Beats - Late.mp3"],
		sewers: ["sewers/Kirk Osamayo - Unsettling Ambience.mp3"],
		shopping_centre: ["shopping_centre/Beat Mekanik - Good Ol' Days.mp3"],
		strip_club: ["strip_club/Zight - Daisy (EDM _ Instrumental).mp3"],
		studio: ["studio/Jahzzar - Jardins du Luxembourg.mp3"],
		temple: ["temple/Kirk Osamayo - Ice World 2.mp3"],
		tentworld: ["tentworld/Schemawound - Tone 5 - Body Temperature Drops and the Heart Rate Begins to Slow.mp3"],
		"town-day": ["town/day/Beat Mekanik - Flashback.mp3", "town/day/Anthem of Rain - Gimme All I Want (Instrumental).mp3"],
		"town-night": ["town/night/Beat Mekanik - Stars.mp3", "town/night/Mr Smith - Dusk.mp3"],
	};

	/* Named NPCs with their own theme, in priority order (fullDescription -> playlist id). */
	const NPC_THEMES = ["Ivory Wraith", "Eden", "Avery", "Bailey", "Wren", "Gwylan", "Whitney", "Zephyr", "Kylar", "Robin", "Sydney", "Poppy"];

	const DAY_NIGHT = { town: ["town-day", "town-night"], farm: ["farm-day", "farm-night"], park: ["park-day", "park-night"] };
	const LOCATIONS = {};
	const map = (theme, ...locations) => locations.forEach(l => (LOCATIONS[l] = theme));
	map(
		"town",
		"town",
		"alley",
		"canals",
		"canal",
		"police_station",
		"market",
		"spa",
		"chalets",
		"museum",
		"docks",
		"avery_mansion",
		"landfill",
		"compound",
		"factory",
		"pound",
		"townhall",
		"kylarmanor_outside",
		"kylarmanor_grounds",
		"industrial",
		"boutique",
		"dilapidated_shop"
	);
	map("cafe", "flats", "seaspray_hotel", "hotel", "cafe");
	map("sewers", "drain", "sewers", "underground", "Underground", "catacombs", "sepulchre", "mines", "kylarmanor");
	map("farm", "farm", "alex_cottage", "alex_farm", "estate", "farm_manors");
	map("park", "park");
	map("meadow", "meadow", "coastpath", "mer_pier", "riding_school", "farmroad3");
	map("school", "school", "pool", "school_rear_courtyard");
	map("forest", "forest", "lake", "bog", "wolf_cave", "churchyard", "lake_ruin", "cabin", "lake_office");
	map("sea", "sea", "seabeach", "searocks", "seacliffs", "pirate_ship", "prison_beach");
	map("old_temple", "old_temple");
	map("moor", "tower", "moor", "castle");
	map("brothel", "adult_shop", "brothel", "UBM");
	map("office", "officeBuilding", "office", "office_building");
	map("shopping_centre", "shopping_centre", "changingroom");
	map("home", "home", "orphanage", "garden");
	map("beach", "beach", "promenade");
	map("Gwylan", "forest_shop", "forest_shop_garden");
	map("Avery", "avery_skyscraper");
	["pub", "asylum", "arcade", "dance_studio", "mma_gym", "studio", "strip_club", "temple", "hospital", "island", "tentworld", "prison"].forEach(l => map(l, l));

	const AFTER_SCHOOL = ["early", "late", "earlynoschool", "latenoschool", "daynoschool"];

	const WEATHER = {
		rain: {
			lightPrecipitation: ["rain", "light-precipitation"],
			heavyPrecipitation: ["rain", "heavy-precipitation", "light-precipitation"],
			storm: ["rain", "heavy-precipitation", "light-precipitation", "storm"],
			thunderstorm: ["thunderstorm"],
		},
		/* Snowfall uses the wind recordings in ambience/snow instead of rain. */
		snow: {
			lightPrecipitation: ["wind"],
			heavyPrecipitation: ["wind", "heavyPrecipitation"],
			storm: ["wind", "storm"],
			thunderstorm: ["wind", "storm", "thunderstorm"],
		},
	};

	const tracks = new Map(); // key -> AudioTrack
	const looping = new WeakSet();
	const pending = new Set();
	let bgm = { id: null, intermission: false, index: 0 };
	let paused = null; // location theme paused under an intermission theme {id, index}
	let context;
	let filter;
	let lastLightning = -Infinity;
	let lightningIndex = 0;
	let initialised = false;

	const options = () => (window.V && V.options) || {};
	const num = (value, fallback) => (typeof value === "number" && Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : fallback);
	const enabled = () => options().audio === 1;
	const encode = path => path.split("/").map(encodeURIComponent).join("/");

	function ensureDefaults() {
		const o = window.V && V.options;
		if (!o) return;
		for (const [key, value] of Object.entries(DEFAULTS)) if (o[key] === undefined) o[key] = value;
	}

	function init() {
		if (initialised) return;
		initialised = true;
		/* Avoid metadata requests for every clip; tracks are created on demand. */
		try {
			Config.audio.preloadMetadata = false;
		} catch (e) {}
	}

	/* One AudioContext: the weather low-pass filter muffles ambience indoors. */
	function audioContext() {
		if (!context && (window.AudioContext || window.webkitAudioContext)) {
			context = new (window.AudioContext || window.webkitAudioContext)();
			filter = context.createBiquadFilter();
			filter.type = "lowpass";
			filter.Q.value = 0.7;
			filter.connect(context.destination);
		}
		return context;
	}

	function resumeContext() {
		if (context && context.state === "suspended") context.resume().catch(() => {});
	}

	function getTrack(key, src, routeThroughFilter) {
		if (!tracks.has(key)) {
			const id = `gameaudio-${key}`;
			SimpleAudio.tracks.add(id, encode(src));
			const track = SimpleAudio.tracks.get(id);
			/* file:// media counts as cross-origin and would be silenced by Web Audio. */
			if (routeThroughFilter && window.location.protocol !== "file:" && audioContext()) {
				try {
					context.createMediaElementSource(track.audio).connect(filter);
				} catch (e) {}
			}
			tracks.set(key, track);
		}
		return tracks.get(key);
	}

	/* Retry once the player interacts: browsers block audio until a user gesture. */
	function whenAllowed(error) {
		if (error && error.name === "NotAllowedError") {
			$(document)
				.off(".gameAudioUnlock")
				.one("pointerup.gameAudioUnlock keydown.gameAudioUnlock touchend.gameAudioUnlock", () => {
					resumeContext();
					update();
				});
		}
	}

	function start(track) {
		if (track.isPlaying() || pending.has(track)) return;
		if (track.isUnloaded()) track.load();
		pending.add(track);
		const result = track.play();
		Promise.resolve(result)
			.catch(whenAllowed)
			.finally(() => pending.delete(track));
	}

	/* ---------- music ---------- */

	function bgmTrack(id, index) {
		const files = BGM[id];
		return getTrack(`bgm/${id}/${index}`, `audio/bgm/${files[index % files.length]}`, false);
	}

	function release(id) {
		if (!id || !BGM[id]) return;
		BGM[id].forEach((_, i) => {
			const key = `bgm/${id}/${i}`;
			const track = tracks.get(key);
			if (!track) return;
			track.off(".gameAudio");
			track.stop();
			if (!track.isUnloaded()) track.unload();
		});
	}

	function playBgm() {
		if (!bgm.id) return;
		const volume = num(options().bgm_volume, 1);
		const files = BGM[bgm.id];
		const track = bgmTrack(bgm.id, bgm.index);
		track.volume(volume).loop(files.length === 1);
		if (files.length > 1) {
			track.off(".gameAudio").on("ended.gameAudio", () => {
				track.off(".gameAudio");
				bgm.index = (bgm.index + 1) % files.length;
				playBgm();
			});
		}
		if (volume > 0) start(track);
		else track.pause();
	}

	function setBgm(id, intermission = false) {
		if (id && !BGM[id]) id = null;
		if (id === bgm.id) {
			bgm.intermission = intermission;
			playBgm();
			return;
		}
		if (bgm.id) {
			if (intermission && !bgm.intermission && !paused) {
				/* keep the location theme to resume after the encounter / NPC theme */
				bgmTrack(bgm.id, bgm.index).pause();
				paused = { id: bgm.id, index: bgm.index };
			} else {
				release(bgm.id);
			}
		}
		if (!intermission && paused) {
			if (paused.id === id) {
				bgm = { id, intermission: false, index: paused.index };
				paused = null;
				playBgm();
				return;
			}
			release(paused.id);
			paused = null;
		}
		bgm = { id, intermission, index: id ? Math.floor(Math.random() * BGM[id].length) : 0 };
		playBgm();
	}

	function stopAll() {
		setBgm(null);
		if (paused) release(paused.id);
		paused = null;
	}

	function npcTheme() {
		const list = (window.V && V.NPCList) || [];
		const names = list.flatMap(n => (n && n.fullDescription ? [n.fullDescription] : []));
		const name = NPC_THEMES.find(n => names.includes(n));
		return name ? name.replace(/\s+/g, "") : null;
	}

	function locationTheme(location) {
		const theme = LOCATIONS[location];
		if (!theme) return null;
		const night = ["night", "dusk"].includes(window.Time && Time.dayState);
		if (DAY_NIGHT[theme]) return DAY_NIGHT[theme][night ? 1 : 0];
		if (theme === "school") return AFTER_SCHOOL.includes(V.schoolstate) ? "afterschool" : "school";
		if (theme === "old_temple" && ["cell", "guardhouse"].includes(V.bus)) return "sewers";
		return theme;
	}

	/* What should play now: [playlist id, is an intermission over the location theme]. */
	function wanted() {
		if (!enabled() || !V.location || V.location === "banner" || V.passage === "Start") return [null, false];
		if (V.possessed) return ["IvoryWraith", true];
		if (V.combat === 1 && V.consensual !== 1) return ["encounter-noncon", true];
		const npc = npcTheme();
		if (npc && BGM[npc]) return [npc, true];
		if (V.combat === 1 || V.masturbating === 1) return ["encounter-consensual", true];
		return [locationTheme(V.location), false];
	}

	/* ---------- ambience ---------- */

	function surroundings() {
		return V.outside ? { gain: 1, cutoff: 22000 } : { gain: 0.3, cutoff: 650 };
	}

	function ambienceVolume(muffled = true) {
		return num(options().ambience_volume, 1) * (muffled ? surroundings().gain : 1);
	}

	function ambienceTrack(name, folder) {
		const path = folder ? `${folder}/${name}` : name;
		const track = getTrack(`ambience/${path}`, `audio/sfx/ambience/${path}.mp3`, true);
		if (!track.__gameAudioLoop) {
			track.__gameAudioLoop = true;
			/* restart slightly early so loops have no gap */
			track.audio.addEventListener("timeupdate", () => {
				if (looping.has(track) && track.audio.duration - track.audio.currentTime <= 0.5) track.audio.currentTime = 0;
			});
		}
		return track;
	}

	function playAmbience(track, loop, muffled = true) {
		if (context) {
			filter.frequency.setTargetAtTime(surroundings().cutoff, context.currentTime, 0.08);
			resumeContext();
		}
		track.volume(ambienceVolume(muffled)).loop(loop);
		if (loop) looping.add(track);
		else looping.delete(track);
		start(track);
	}

	function ambienceOn() {
		return enabled() && num(options().ambience_volume, 1) > 0 && V.location && V.location !== "banner" && V.passage !== "Start";
	}

	function updateAmbience() {
		if (filter) filter.frequency.setTargetAtTime(surroundings().cutoff, context.currentTime, 0.08);
		const want = new Set();
		const on = ambienceOn();
		if (on && window.Weather && V.weatherObj) {
			const folder = Weather.precipitation === "snow" && WEATHER.snow[Weather.name] ? "snow" : "rain";
			(WEATHER[folder][Weather.name] || []).forEach(name => want.add(`ambience/${folder}/${name}`));
		}
		for (const [key, track] of tracks) {
			if (!key.startsWith("ambience/")) continue;
			if (key.startsWith("ambience/rain/lightning") || key === "ambience/money" || key === "ambience/meds") {
				if (!on) track.stop();
				else track.volume(ambienceVolume(!(key === "ambience/money" || key === "ambience/meds")));
			} else if (!want.has(key)) {
				looping.delete(track);
				track.loop(false);
				track.stop();
				if (!track.isUnloaded()) track.unload();
			}
		}
		for (const key of want) {
			const [, folder, name] = key.split("/");
			playAmbience(ambienceTrack(name, folder), true);
		}
	}

	function lightning(renderer) {
		if (!window.Weather || renderer !== Weather.sidebar || !ambienceOn() || !Weather.enableLightning) return;
		const now = Date.now();
		lightningIndex = now - lastLightning < 10000 ? (lightningIndex + 1) % 3 : 0;
		lastLightning = now;
		const track = ambienceTrack(["lightning", "lightning2", "lightning3"][lightningIndex], "rain");
		track.stop();
		playAmbience(track, false);
	}

	/* One-shot effects: "money" (spending) and "meds" (taking pills). */
	function effect(name) {
		if (!enabled() || num(options().ambience_volume, 1) <= 0) return;
		const track = ambienceTrack(name, "");
		track.stop();
		playAmbience(track, false, false);
	}

	/* ---------- main ---------- */

	function update() {
		if (typeof SimpleAudio === "undefined" || !window.V) return;
		init();
		ensureDefaults();
		const o = options();
		try {
			SimpleAudio.muteOnHidden(o.muteonhide === 1);
		} catch (e) {}
		SimpleAudio.volume(num(o.mastervolume, DEFAULTS.mastervolume));
		if (!enabled()) {
			stopAll();
			updateAmbience();
			$(document).off(".gameAudioUnlock");
			return;
		}
		const [id, intermission] = wanted();
		setBgm(id, intermission);
		updateAmbience();
	}

	/* Diagnostics for tests: what is loaded and how it is playing. */
	function status() {
		const list = [];
		for (const [key, track] of tracks) {
			const a = track.audio;
			list.push({ key, src: a.currentSrc || a.src, readyState: a.readyState, paused: a.paused, currentTime: a.currentTime, volume: a.volume });
		}
		return { bgm: bgm.id, intermission: bgm.intermission, paused: paused && paused.id, master: SimpleAudio.volume(), tracks: list };
	}

	$(document).on(":onWeatherChange.gameAudio", () => {
		if (window.V && V.options) updateAmbience();
	});
	/* The loaded save picks its own theme and volume on its first passage. */
	Save.onLoad.add(() => stopAll());

	return Object.freeze({ update, ensureDefaults, lightning, effect, status, wanted, locationTheme, BGM, LOCATIONS, DEFAULTS });
})();
