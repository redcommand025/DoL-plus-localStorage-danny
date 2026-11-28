/* Plus Needs content-batch helpers: weather, work breaks, infirmary, flat home, custody.
 * Continence-reputation world hooks are intentionally not added here; that item is being co-designed. */
(function () {
	"use strict";

	function V() {
		return State.variables;
	}
	function dayKey() {
		return typeof window.plusDayKey === "function" ? window.plusDayKey() : 0;
	}
	function nowTs() {
		return typeof window.plusNowTs === "function" ? window.plusNowTs() : 0;
	}
	function clamp(n, min, max) {
		return Math.min(max, Math.max(min, n));
	}
	function dayState() {
		try {
			return Time.dayState || "day";
		} catch (e) {
			return "day";
		}
	}
	function pick(list) {
		if (!list || !list.length) return "";
		return list[Math.floor(Math.random() * list.length)];
	}

	/* ---- Weather drain multipliers (awake, outdoors only) ----
	 * Heat thirst: 22–24.9°C ×1.15, 25–29.9°C ×1.25, 30°C+ ×1.30
	 * Cold bladder: 0.1–5°C ×1.10, ≤0°C or freezing ×1.15
	 * Rain bladder: +0.10 added to the bladder multiplier, then capped at 1.25
	 * Rain dirt: 36 plusDirt per in-game hour on worn outer/upper/lower clothes
	 * Sleep/long passes and indoor time are unchanged.
	 */
	window.plusNeedsWeatherDocs = {
		thirst: { warm: 1.15, hot: 1.25, veryHot: 1.3, warmC: 22, hotC: 25, veryHotC: 30 },
		bladder: { chilly: 1.1, freezing: 1.15, rainAdd: 0.1, cap: 1.25, chillyC: 5, freezingC: 0 },
		rainDirtPerHour: 36,
	};
	window.plusNeedsWeatherInfo = function () {
		const out = { exposed: false, temp: null, precip: "none", freezing: false, thirstMul: 1, bladderMul: 1, dirtPerHour: 0, notes: [] };
		const st = V();
		if (!st) return out;
		const outside = st.outside === 1 || st.outside === true;
		out.exposed = !!outside;
		if (!outside) return out;
		let temp = null;
		let precip = "none";
		let freezing = false;
		try {
			if (typeof Weather !== "undefined") {
				if (Number.isFinite(Weather.temperature)) temp = Weather.temperature;
				if (Weather.precipitation) precip = Weather.precipitation;
				freezing = !!Weather.isFreezing;
			}
		} catch (e) {}
		out.temp = temp;
		out.precip = precip;
		out.freezing = freezing;
		if (Number.isFinite(temp)) {
			if (temp >= 30) {
				out.thirstMul = 1.3;
				out.notes.push("veryHot");
			} else if (temp >= 25) {
				out.thirstMul = 1.25;
				out.notes.push("hot");
			} else if (temp >= 22) {
				out.thirstMul = 1.15;
				out.notes.push("warm");
			}
			if (freezing || temp <= 0) {
				out.bladderMul = 1.15;
				out.notes.push("freezing");
			} else if (temp <= 5) {
				out.bladderMul = 1.1;
				out.notes.push("chilly");
			}
		}
		if (precip === "rain") {
			out.bladderMul = Math.min(1.25, Math.round((out.bladderMul + 0.1) * 100) / 100);
			out.dirtPerHour = 36;
			out.notes.push("rain");
		}
		return out;
	};
	window.plusNeedsWeatherMul = function () {
		return window.plusNeedsWeatherInfo();
	};
	window.plusNeedsWeatherDirt = function (amount) {
		const W = V() && V().worn;
		if (!W || !(amount > 0)) return 0;
		let n = 0;
		for (const s of ["upper", "lower", "over_upper", "over_lower"]) {
			const it = W[s];
			if (!it || !Array.isArray(it.type) || it.type.includes("naked")) continue;
			if (!Number.isFinite(it.plusDirt)) it.plusDirt = 0;
			it.plusDirt = clamp(it.plusDirt + amount, 0, 2000);
			n++;
		}
		return n;
	};
	window.plusNeedsWeatherApply = function (loss, minutes, longPass) {
		if (!loss || !(minutes > 0) || longPass) return loss;
		const w = window.plusNeedsWeatherInfo();
		if (!w.exposed) return loss;
		if (w.thirstMul !== 1 && Number.isFinite(loss.plusThirst)) loss.plusThirst *= w.thirstMul;
		if (w.bladderMul !== 1 && Number.isFinite(loss.plusBladder)) loss.plusBladder *= w.bladderMul;
		if (w.dirtPerHour > 0) window.plusNeedsWeatherDirt((w.dirtPerHour * minutes) / 60);
		return loss;
	};

	/* WearProp passages that re-show the same cup/plate and must not refill again. */
	window.plusNeedsPropSkipPassages = ["Cafe Coffee Flash", "Cafe Coffee Finish"];

	/* ---- Infirmary (player only; matter-of-fact, non-sexual) ---- */
	window.plusAccidentRemember = function (which) {
		const st = V();
		if (!st) return;
		st.plusAccidentDay = dayKey();
		st.plusAccidentKind = which || st.plusAccidentKind || "plusBladder";
	};
	window.plusInfirmaryReason = function () {
		const st = V();
		if (!st) return "";
		if (st.plusAccidentDay === dayKey()) return "accident";
		const it = typeof window.plusDiaperWorn === "function" ? window.plusDiaperWorn() : null;
		if (it && it.plusLb > 0) return "soiled";
		if (it && it.plusMl > 0 && typeof window.plusDiaperPeeFull === "function" && window.plusDiaperPeeFull(it)) return "soaked";
		if (typeof window.plusDiaperVisible === "function" && window.plusDiaperVisible()) return "visible";
		if ((Number(st.plusBladder) <= 300 || Number(st.plusBowels) <= 300) && Number(st.plusBladder) <= 400) return "urgent";
		return "";
	};
	window.plusInfirmaryCanSpare = function () {
		const st = V();
		if (!st) return false;
		return st.plusInfirmarySpareDay !== dayKey();
	};
	window.plusInfirmaryGiveSpare = function () {
		const st = V();
		if (!st || !window.plusInfirmaryCanSpare()) return false;
		const items = typeof window.plusDiaperItems === "function" ? window.plusDiaperItems() : [];
		const proto = items.find(i => i && i.name === "pull-up (Medium)");
		if (!proto) return false;
		if (!st.wardrobe || typeof st.wardrobe !== "object") st.wardrobe = {};
		if (!Array.isArray(st.wardrobe.under_lower)) st.wardrobe.under_lower = [];
		const item = typeof ClothesItem === "function" ? new ClothesItem(proto) : Object.assign({}, proto);
		if (typeof window.plusDiaperInit === "function") window.plusDiaperInit(item);
		st.wardrobe.under_lower.push(item);
		st.plusInfirmarySpareDay = dayKey();
		return true;
	};

	/* ---- Flat home helpers ---- */
	window.plusHomeWash = function () {
		const st = V();
		if (!st || !st.worn) return false;
		const slots = ["upper", "lower", "under_upper", "under_lower", "over_upper", "over_lower", "feet", "hands"];
		for (const s of slots) {
			const it = st.worn[s];
			if (!it || !Array.isArray(it.type) || it.type.includes("naked")) continue;
			it.plusDirt = 0;
			it.plusSoiled = 0;
			if (
				typeof window.plusDiaperDef === "function" &&
				window.plusDiaperDef(it) &&
				window.plusDiaperDef(it).cloth &&
				typeof window.plusDiaperReset === "function"
			) {
				window.plusDiaperReset(it);
			}
		}
		for (const s of ["upper", "lower", "under_upper", "under_lower", "over_upper", "over_lower"]) {
			const k = s.replace("_", "");
			if (Number.isFinite(st[k + "wet"])) st[k + "wet"] = 0;
			if (Number.isFinite(st[k + "wetstage"])) st[k + "wetstage"] = 0;
		}
		try {
			if (typeof window.plusNeedsStats === "function") {
				const S = window.plusNeedsStats();
				S.homeWash = (S.homeWash || 0) + 1;
			}
		} catch (e) {}
		return true;
	};
	window.plusFlatEveningBeat = function (force) {
		const st = V();
		if (!st || !st.plusFlat || !st.plusFlat.rented) return "";
		const ds = dayState();
		if (!force && ds !== "dusk" && ds !== "night") return "";
		const now = nowTs();
		if (!force && Number.isFinite(st.plusFlatBeatNext) && now < st.plusFlatBeatNext) return "";
		if (!force && Math.random() >= 0.45) {
			st.plusFlatBeatNext = now + 20 * 60;
			return "";
		}
		st.plusFlatBeatNext = now + 3 * 60 * 60;
		const rain = (function () {
			try {
				return typeof Weather !== "undefined" && Weather.precipitation === "rain";
			} catch (e) {
				return false;
			}
		})();
		const snow = (function () {
			try {
				return typeof Weather !== "undefined" && (Weather.precipitation === "snow" || Weather.isSnow);
			} catch (e) {
				return false;
			}
		})();
		const lines = [];
		if (ds === "night") {
			lines.push("The canal below is dark. A single lamp on the towpath throws a long reflection on the water.");
			lines.push("The block has settled for the night. Pipes tick as the heating cools, and someone upstairs walks softly to a sink.");
			lines.push("You hear a radio through the wall, turned down low. It is a comfort, having neighbours rather than a dormitory.");
		} else {
			lines.push("Evening light comes in across the canal. The room feels like yours in a way the orphanage bedroom never did.");
			lines.push("Someone in the stairwell laughs and a door closes. The smell of someone else's cooking drifts under your door.");
			lines.push("You set your bag down. For a moment the quiet is so complete you can hear the clock in the kitchen.");
		}
		if (rain) lines.push("Rain needles the window and runs in lines down the glass. The flat feels warm by contrast, and you are glad to be inside.");
		if (snow) lines.push("Snow is gathering on the sill. The street below is muffled, and the radiator ticks as it works.");
		if (st.plusFlat && st.plusFlat.msg === "grace") lines.push("The landlord's reminder is still on your mind. The due date will not wait.");
		return pick(lines);
	};
	window.plusFlatHallwayBeat = function () {
		const st = V();
		const ds = dayState();
		const dueSoon = st && st.plusFlat && (st.plusFlat.msg === "remind" || st.plusFlat.msg === "grace" || st.plusFlat.msg === "unpaid");
		const pool = [];
		if (dueSoon) {
			pool.push("landlord");
			pool.push("landlord");
		}
		pool.push("neighbour", "neighbour", "quiet", "package");
		if (ds === "night") pool.push("quiet", "quiet");
		return pick(pool);
	};

	/* ---- Prison / asylum custody ---- */
	window.plusCustodyWash = function () {
		return window.plusHomeWash();
	};
	window.plusCustodyCanSpare = function () {
		const st = V();
		if (!st) return false;
		const day = dayKey();
		return !Number.isFinite(st.plusCustodySpareDay) || day >= st.plusCustodySpareDay + 2;
	};
	window.plusCustodyGiveSpare = function () {
		const st = V();
		if (!st || !window.plusCustodyCanSpare()) return false;
		const ok = (function () {
			const items = typeof window.plusDiaperItems === "function" ? window.plusDiaperItems() : [];
			const proto = items.find(i => i && i.name === "pull-up (Medium)");
			if (!proto) return false;
			if (!st.wardrobe || typeof st.wardrobe !== "object") st.wardrobe = {};
			if (!Array.isArray(st.wardrobe.under_lower)) st.wardrobe.under_lower = [];
			const item = typeof ClothesItem === "function" ? new ClothesItem(proto) : Object.assign({}, proto);
			if (typeof window.plusDiaperInit === "function") window.plusDiaperInit(item);
			st.wardrobe.under_lower.push(item);
			return true;
		})();
		if (ok) st.plusCustodySpareDay = dayKey();
		return ok;
	};

	/* Outdoor flavour for rural spots. */
	window.plusOutdoorWhere = function (spot) {
		const night = dayState() === "night";
		const table = {
			beach: night ? ["behind a dune in the dark", "in the lee of a breakwater"] : ["behind a dune", "in a dip between two dunes"],
			park: night
				? ["behind a clump of bushes", "under the trees at the edge of the green"]
				: ["behind a clump of bushes", "in a stand of shrubs off the path"],
			wolfcave: ["at the edge of the clearing", "behind a fallen trunk"],
			farm: night
				? ["behind the barn, out of the yard lights", "in the shadow of a hedge at the field edge"]
				: ["behind a hedgerow at the edge of the field", "in the lee of a haystack", "behind the barn where the yard is quiet"],
			moor: night
				? ["in a dip below the path", "behind a rise in the heather"]
				: ["behind a rise in the heather", "in a dip below the path", "among the gorse off the track"],
			estate: night
				? ["behind a dense hedge off the drive", "in the trees beside the wall"]
				: ["behind a dense hedge", "in the trees off the drive", "in a ditch below the fence"],
			coast: night
				? ["behind a rock below the path", "in a cleft above the tide line"]
				: ["behind a rock below the path", "in a cleft above the tide line", "in the sea-grass off the path"],
			forest: night ? ["behind a thick tree", "in a hollow between the roots"] : ["behind a thick tree", "in a stand of ferns off the path"],
			lake: ["behind a thick tree", "in the reeds, out of sight of the water"],
		};
		const lines = table[spot] || table.forest;
		return pick(lines);
	};
})();
