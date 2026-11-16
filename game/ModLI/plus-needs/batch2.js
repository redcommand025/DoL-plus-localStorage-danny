/* Plus Needs content-batch 2: bus accidents, hospital clinic, named-NPC scenes,
 * weather flavour, flat life, and Robin moving in.
 * Named-NPC accident and diaper reactions have been removed; only generic
 * landlord and neighbour lines remain. */
(function () {
	"use strict";

	function V() {
		return State.variables;
	}
	function T() {
		return State.temporary;
	}
	function dayKey() {
		return typeof window.plusDayKey === "function" ? window.plusDayKey() : 0;
	}
	function passageTitle() {
		return (State && State.passage) || "";
	}
	function pick(list) {
		if (!list || !list.length) return "";
		return list[Math.floor(Math.random() * list.length)];
	}
	function moneyOk(pence) {
		const st = V();
		return st && Number.isFinite(st.money) && st.money >= pence;
	}
	function charge(pence, source) {
		const st = V();
		if (!st) return false;
		if (typeof statChange !== "undefined" && statChange.money) statChange.money(-pence, source || "plusneeds");
		else st.money -= pence;
		return true;
	}

	/* ---------- Bus accident ---------- */
	const BUS_RIDE_MIN = 15;
	const BUS_FEE = 800; // £8 cleaning fee
	const BUS_SCHOOL = new Set(["oxford"]);
	window.plusBusRideMinutes = BUS_RIDE_MIN;
	window.plusBusFeePence = BUS_FEE;

	window.plusBusIsSchoolTrip = function () {
		const st = V();
		try {
			return !!(st && BUS_SCHOOL.has(st.bus) && Time.schoolDay && Time.hour >= 7 && Time.hour <= 8);
		} catch (e) {
			return !!(st && BUS_SCHOOL.has(st.bus));
		}
	};
	window.plusBusRideBefore = function () {
		const st = V();
		if (!st) return;
		T().plusBusHadDiaper = !!(typeof window.plusDiaperWorn === "function" && window.plusDiaperWorn());
		T().plusBusAccBefore = st.plusAccident || "";
	};
	window.plusBusRideAfter = function () {
		const st = V();
		if (!st) return null;
		const which = st.plusAccident || "";
		const diaper = !!(typeof window.plusDiaperWorn === "function" && window.plusDiaperWorn());
		/* Consume the generic prepended accident notice; the bus scene tells it. */
		if (which) delete st.plusAccident;
		let kind = "";
		if (which && !diaper) kind = "open";
		else if (diaper) {
			const it = window.plusDiaperWorn();
			const smell = typeof window.plusSmellChance === "function" ? window.plusSmellChance() : 0;
			const soaked = it && ((it.plusMl > 0 && typeof window.plusDiaperPeeFull === "function" && window.plusDiaperPeeFull(it)) || it.plusOverflow);
			const soiled = it && it.plusLb > 0;
			if ((soaked || soiled || smell >= 0.16 || which) && Math.random() < 0.35) kind = "mild";
		}
		if (!kind) return null;
		const ev = window.plusBusBuildEvent(kind, which || "plusBladder");
		st.plusBusEvent = ev;
		return ev;
	};
	window.plusBusEventReady = function () {
		const ev = V() && V().plusBusEvent;
		return !!(ev && ev.kind);
	};
	window.plusBusBuildEvent = function (kind, which) {
		const st = V() || {};
		const driver = Math.random() < 0.5 ? "off" : "fee";
		const canPay = driver === "fee" && moneyOk(BUS_FEE);
		const jacket = Math.random() < (kind === "mild" ? 0.45 : 0.3);
		const school = window.plusBusIsSchoolTrip();
		return {
			kind,
			which: which || "plusBladder",
			route: st.bus || "",
			driver,
			canPay,
			fee: BUS_FEE,
			jacket,
			school,
			seen: kind === "open" ? 2 : 1,
		};
	};
	window.plusBusApply = function (ev) {
		const st = V();
		ev = ev || (st && st.plusBusEvent);
		if (!st || !ev) return ev;
		const school = ev.school || window.plusBusIsSchoolTrip();
		/* Whole bus finds out. Reputation goes on the private meter now and becomes public at midnight.
		 * No instant schoolrep bump — classmates on a school bus still only update the school rumour at midnight. */
		if (typeof window.plusContRepOnAccident === "function") {
			window.plusContRepOnAccident(ev.seen || 2, {
				which: ev.which,
				busy: true,
				school,
				floor: false,
				absorbed: ev.kind === "mild",
			});
		}
		if (ev.applied) return ev;
		if (ev.driver === "fee" && !ev.canPay) ev.driver = "off";
		if (ev.driver === "fee") charge(BUS_FEE, "bus-cleaning");
		if (ev.jacket) st.plusBusJacket = 1;
		ev.applied = true;
		return ev;
	};
	window.plusBusJacketOn = function () {
		return !!(V() && V().plusBusJacket);
	};
	window.plusBusJacketClear = function () {
		const st = V();
		if (st) delete st.plusBusJacket;
	};
	window.plusBusJacketMaybeClear = function () {
		const st = V();
		if (!st || !st.plusBusJacket) return;
		const wet = Math.max(Number(st.lowerwet) || 0, Number(st.underlowerwet) || 0);
		if (wet < 20) window.plusBusJacketClear();
	};

	/* ---------- Hospital continence clinic ---------- */
	const CONT_NAMES = ["Leaky", "Weak", "Unsteady", "Steady", "Firm", "Reliable", "Steel"];
	window.plusClinicAssess = function () {
		const st = V();
		if (!st) return null;
		if (typeof window.plusContRepInit === "function") window.plusContRepInit();
		const lvl = typeof window.plusContinenceLevel === "function" ? window.plusContinenceLevel() : Number(st.plusContinence) || 0;
		const name = CONT_NAMES[Math.max(0, Math.min(CONT_NAMES.length - 1, lvl))] || "Unsteady";
		const bladder = Number(st.plusBladder);
		const bowels = Number(st.plusBowels);
		const urgent = (Number.isFinite(bladder) && bladder <= 400) || (Number.isFinite(bowels) && bowels <= 400);
		const day = dayKey();
		const exercised = st.plusExerciseDay === day;
		const visits = (st.plusClinicVisits || 0) + 1;
		st.plusClinicVisits = visits;
		st.plusClinicLastDay = day;
		st.plusClinicLastLevel = lvl;
		const prev = Number.isFinite(st.plusClinicBaseLevel) ? st.plusClinicBaseLevel : lvl;
		if (!Number.isFinite(st.plusClinicBaseLevel)) st.plusClinicBaseLevel = lvl;
		const delta = lvl - prev;
		return {
			level: lvl,
			name,
			bladder,
			bowels,
			urgent,
			exercised,
			visits,
			delta,
			rep: typeof window.plusContRepPublicValue === "function" ? window.plusContRepPublicValue() : 0,
		};
	};
	window.plusClinicFollowup = function () {
		const st = V();
		if (!st) return { ready: false, reason: "none" };
		if (!Number.isFinite(st.plusClinicBaseLevel)) return { ready: false, reason: "no-baseline" };
		const since = dayKey() - (st.plusClinicLastDay || 0);
		if (since < 2) return { ready: false, reason: "soon", days: since };
		const a = window.plusClinicAssess();
		if (a) a.ready = true;
		return a;
	};

	/* ---------- Weather flavour ---------- */
	window.plusWeatherFlavour = function (opts) {
		opts = opts || {};
		const st = V();
		if (!st) return "";
		const info = typeof window.plusNeedsWeatherInfo === "function" ? window.plusNeedsWeatherInfo() : null;
		if (!info || !info.exposed) return "";
		const notes = info.notes || [];
		const loc = String(st.location || "");
		const farm = loc === "farm" || /farm|alex/i.test(passageTitle());
		const beach = loc === "beach" || loc === "starfish" || /beach|coast/i.test(passageTitle());
		const moor = loc === "moor" || /moor|bog/i.test(passageTitle());
		const lines = [];
		if (notes.includes("veryHot") || notes.includes("hot") || notes.includes("warm")) {
			if (farm) lines.push("The heat over the fields sticks to you. Your mouth is dry, and every swallow reminds you how long it has been since a drink.");
			else if (beach) lines.push("The sun off the water is fierce. Heat sits on your tongue and you keep thinking about a cold drink.");
			else if (moor) lines.push("The moor offers no shade. The warmth makes you thirsty faster than the walk alone would.");
			else lines.push("The air is close and warm. You feel thirstier than the hour should account for.");
		}
		if (notes.includes("freezing") || notes.includes("chilly")) {
			lines.push(
				pick([
					"The cold settles in your belly. You need the toilet sooner than you would in milder weather.",
					"A chill runs through you, and the urge to find a toilet comes with it.",
				])
			);
		}
		if (notes.includes("rain")) {
			const it = typeof window.plusDiaperWorn === "function" ? window.plusDiaperWorn() : null;
			if (it) {
				lines.push(
					pick([
						"Rain soaks through your outer clothes. Your diaper feels heavier and colder against your skin.",
						"The rain creeps under your clothes. The padding at your waist holds the damp in a way fabric never would.",
					])
				);
			} else {
				lines.push(
					pick([
						"The rain soaks your clothes. They cling, cold and heavy, and will want a wash later.",
						"You walk with wet sleeves and a dripping hem. The rain has found every layer.",
					])
				);
			}
		}
		try {
			if (typeof Weather !== "undefined" && Weather.precipitation === "snow") {
				lines.push("Snow dusts your shoulders. The cold makes you want to get indoors, and the toilet, sooner.");
			}
			if (typeof Weather !== "undefined" && Weather.windSpeed && Weather.windSpeed > 8) {
				lines.push("The wind presses your clothes against you and cuts through to the skin.");
			}
		} catch (e) {}
		if (opts.accident) {
			if (notes.includes("rain")) lines.push("The rain will not hide what happened. If anything, the wet makes it more obvious.");
			if (notes.includes("veryHot") || notes.includes("hot")) lines.push("In this heat, you are even more aware of the mess and the smell.");
		}
		if (!lines.length) return "";
		const last = st.plusWeatherFlavourAt;
		const now = typeof window.plusNowTs === "function" ? window.plusNowTs() : 0;
		if (!opts.accident && !opts.force && last && now && now - last < 25 * 60) return "";
		if (!opts.accident) st.plusWeatherFlavourAt = now;
		return lines[0];
	};

	/* ---------- Named NPC scenes ---------- */
	function npcInit(name) {
		try {
			return !!(C && C.npc && C.npc[name] && C.npc[name].init === 1);
		} catch (e) {
			return false;
		}
	}
	function npcLove(name) {
		try {
			return (C && C.npc && C.npc[name] && Number(C.npc[name].love)) || 0;
		} catch (e) {
			return 0;
		}
	}
	const NPC_WHERE = {
		Landlord() {
			return (typeof window.plusLocationIsFlat === "function" && window.plusLocationIsFlat()) || /Plus Flat Hallway|Plus Flat Bedroom/.test(passageTitle());
		},
		Neighbour() {
			return (typeof window.plusLocationIsFlat === "function" && window.plusLocationIsFlat()) || /Plus Flat Hallway/.test(passageTitle());
		},
	};
	window.plusNpcPresent = function (name) {
		const fn = NPC_WHERE[name];
		if (!fn) return false;
		try {
			return !!fn();
		} catch (e) {
			return false;
		}
	};
	window.plusNpcSceneAllowed = function (name, kind) {
		if (!window.plusNpcPresent(name)) return false;
		const st = V();
		if (!st.plusNpcSceneDay || typeof st.plusNpcSceneDay !== "object") st.plusNpcSceneDay = {};
		const key = name + ":" + kind;
		if (st.plusNpcSceneDay[key] === dayKey()) return false;
		if (kind === "diaper") {
			const vis = typeof window.plusDiaperVisible === "function" && window.plusDiaperVisible();
			const worn = typeof window.plusDiaperWorn === "function" && window.plusDiaperWorn();
			if (!worn || !vis) return false;
		}
		return true;
	};
	window.plusNpcMark = function (name, kind) {
		const st = V();
		if (!st) return;
		if (!st.plusNpcSceneDay || typeof st.plusNpcSceneDay !== "object") st.plusNpcSceneDay = {};
		st.plusNpcSceneDay[name + ":" + kind] = dayKey();
	};
	window.plusNpcPickPresent = function (kind) {
		const names = Object.keys(NPC_WHERE);
		const found = [];
		for (const n of names) if (window.plusNpcSceneAllowed(n, kind)) found.push(n);
		/* Prefer a more specific location match over generic town. */
		if (!found.length) return "";
		return found[0];
	};

	/* ---------- Flat life ---------- */
	const DECOR = {
		plant: { name: "a potted plant", price: 1500, relief: 2, desc: "A small plant sits on the windowsill, green against the canal light." },
		curtains: { name: "new curtains", price: 2500, relief: 2, desc: "Proper curtains frame the window, and the room feels less bare." },
		rug: { name: "a rug", price: 2000, relief: 2, desc: "A plain rug covers the worst of the floorboards." },
		lamp: { name: "a reading lamp", price: 1800, relief: 2, desc: "A reading lamp by the bed makes the evenings softer." },
		photos: { name: "a few framed pictures", price: 1200, relief: 3, desc: "A few framed pictures lean on the shelf. The place looks lived in." },
	};
	window.plusFlatDecorItems = DECOR;
	window.plusFlatDecorOwned = function () {
		const f = V() && V().plusFlat;
		if (!f) return [];
		if (!f.decor || typeof f.decor !== "object") f.decor = {};
		return Object.keys(DECOR).filter(k => f.decor[k]);
	};
	window.plusFlatDecorBuy = function (id) {
		const st = V();
		const spec = DECOR[id];
		if (!st || !spec || !st.plusFlat || !st.plusFlat.rented) return { ok: false, reason: "flat" };
		if (!st.plusFlat.decor || typeof st.plusFlat.decor !== "object") st.plusFlat.decor = {};
		if (st.plusFlat.decor[id]) return { ok: false, reason: "owned" };
		if (!moneyOk(spec.price)) return { ok: false, reason: "money", price: spec.price };
		charge(spec.price, "plusFlatDecor");
		st.plusFlat.decor[id] = 1;
		if (Number.isFinite(st.stress)) {
			const max = Number.isFinite(st.stressmax) ? st.stressmax : 10000;
			st.stress = Math.clamp(st.stress - spec.relief, 0, max);
		}
		return { ok: true, item: spec };
	};
	window.plusFlatDecorText = function () {
		const owned = window.plusFlatDecorOwned();
		if (!owned.length) return "";
		return owned.map(k => DECOR[k].desc).join(" ");
	};
	window.plusFlatWeekendActivity = function () {
		const st = V();
		if (!st || !st.plusFlat || !st.plusFlat.rented) return [];
		let weekend = false;
		try {
			weekend = Time.isWeekEnd && Time.isWeekEnd();
		} catch (e) {}
		const evening = (function () {
			try {
				return Time.hour >= 18 || Time.dayState === "dusk" || Time.dayState === "night";
			} catch (e2) {
				return false;
			}
		})();
		const out = [];
		if (evening || weekend) out.push("cook", "read", "window");
		if (weekend) out.push("tidy", "market");
		if (window.plusRobinLivesAtFlat && window.plusRobinLivesAtFlat()) out.push("tea");
		return out;
	};

	/* Neighbour storyline: one new beat a week, for six weeks, then idle remarks. */
	window.plusFlatNeighbourAdvance = function () {
		const st = V();
		if (!st || !st.plusFlat || !st.plusFlat.rented) return 0;
		const week = Math.floor((dayKey() || 0) / 7);
		if (!Number.isFinite(st.plusNeighbourWeek)) st.plusNeighbourWeek = 0;
		if (!Number.isFinite(st.plusNeighbourAt)) st.plusNeighbourAt = week;
		if (week > st.plusNeighbourAt && st.plusNeighbourWeek < 6) {
			st.plusNeighbourWeek += 1;
			st.plusNeighbourAt = week;
		}
		return st.plusNeighbourWeek;
	};
	window.plusFlatNeighbourLine = function () {
		window.plusFlatNeighbourAdvance();
		const w = (V() && V().plusNeighbourWeek) || 0;
		const lines = [
			"",
			"Your neighbour from across the hall nods as they pass, still a little shy.",
			'The neighbour mentions the noisy pipes, then smiles. "At least it is not just me."',
			"They leave a note offering to take a parcel in if you are out.",
			"You chat a little on the stairs. They ask how the flat is treating you.",
			"They knock to return a mug you did not realise had gone missing, slightly embarrassed.",
			"By now the neighbour greets you by habit, and the hallway feels less anonymous.",
		];
		return lines[Math.min(w, lines.length - 1)] || "";
	};

	/* ---------- Robin at the flat ---------- */
	window.plusRobinLivesAtFlat = function () {
		const st = V();
		return !!(st && st.plusFlat && st.plusFlat.rented && st.plusRobinMoved);
	};
	window.plusRobinCanInvite = function () {
		const st = V();
		if (!st || !st.plusFlat || !st.plusFlat.rented || st.plusRobinMoved) return { ok: false, reason: st && st.plusRobinMoved ? "already" : "flat" };
		if (!npcInit("Robin")) return { ok: false, reason: "init" };
		if (npcLove("Robin") < 50) return { ok: false, reason: "love", love: npcLove("Robin") };
		return { ok: true };
	};
	window.plusRobinMoveIn = function () {
		const check = window.plusRobinCanInvite();
		if (!check.ok) return check;
		V().plusRobinMoved = 1;
		return { ok: true };
	};
	window.plusRobinMoveOut = function () {
		const st = V();
		if (st) st.plusRobinMoved = 0;
		return { ok: true };
	};
	window.plusRobinHomeNow = function () {
		if (!window.plusRobinLivesAtFlat()) return false;
		const loc = typeof window.getRobinLocation === "function" ? window.getRobinLocation() : "";
		return loc === "flat" || loc === "sleep";
	};

	const NPC_LINES = {
		Landlord: {
			diaper: [
				"The landlord's eyes catch on the outline as they pass in the hallway, then they look pointedly at the noticeboard instead. \"Keep the place tidy. That's all I ask.\"",
				"The landlord clears their throat. \"I don't need to know the details. Just don't leave anything in the hall that I'll have to explain to the neighbours.\"",
			],
			accident: [
				"The landlord sees the state of you and takes a step back. \"For heaven's sake — get inside. If there's a mess in the hall, you'll be the one cleaning it.\"",
				'The landlord\'s voice is tight. "This is a respectable building. Sort yourself out in your own flat, and quickly."',
			],
		},
		Neighbour: {
			diaper: [
				"Your neighbour's glance is brief and awkward. They offer a small nod, as if to say they will not mention it, and unlock their door a little faster than usual.",
				'The neighbour smiles tightly. "Morning." They look as if they might say more, then think better of it and leave you the stairs.',
			],
			accident: [
				"Your neighbour stops short, then recovers. \"Do you — do you want me to get out of the way? There's no one else on the landing. I'll hold the lift.\"",
				'The neighbour looks horrified for you, not at you. "Go in, I\'ll make sure no one comes up for a minute. Truly. Go."',
			],
		},
	};

	function heFor(name) {
		try {
			if (C && C.npc && C.npc[name] && C.npc[name].pronoun) {
				const p = C.npc[name].pronoun;
				if (p === "m") return "he";
				if (p === "f") return "she";
			}
		} catch (e) {}
		return "they";
	}
	window.plusNpcSceneText = function (name, kind) {
		const pack = NPC_LINES[name];
		if (!pack) return "";
		const list = pack[kind] || [];
		let line = pick(list);
		if (!line) return "";
		const he = heFor(name);
		const his = he === "he" ? "his" : he === "she" ? "her" : "their";
		const He = he.charAt(0).toUpperCase() + he.slice(1);
		line = line
			.replace(/\{\{he\}\}/g, he)
			.replace(/\{\{He\}\}/g, He)
			.replace(/\{\{his\}\}/g, his);
		return line;
	};
	window.plusNpcLineCatalog = NPC_LINES;

	/* Wrap getRobinLocation so "orphanage" becomes "flat" when Robin lives there.
	 * School, beach, park, bath and sleep are unchanged. */
	let robinLocWrapped = false;
	let navigationWrapped = false;
	let evictWrapped = false;
	function wrapRobinLocation() {
		if (robinLocWrapped || typeof window.getRobinLocation !== "function") return;
		const orig = window.getRobinLocation;
		window.getRobinLocation = function () {
			const loc = orig.apply(this, arguments);
			if (loc === "orphanage" && window.plusRobinLivesAtFlat()) {
				try {
					State.temporary.robin_location = "flat";
				} catch (e) {}
				return "flat";
			}
			return loc;
		};
		robinLocWrapped = true;
	}
	function wrapNavigation() {
		if (navigationWrapped || typeof Config === "undefined" || !Config.navigation) return;
		const prev = Config.navigation.override;
		Config.navigation.override = function (dest) {
			try {
				const st = V();
				if (st && window.plusRobinLivesAtFlat() && dest === "Orphanage" && (st.fromRobinRoom || st.plusRobinRoomFromFlat)) {
					st.fromRobinRoom = false;
					st.plusRobinRoomFromFlat = 0;
					return "Plus Flat Bedroom";
				}
			} catch (e) {}
			return prev ? prev(dest) : undefined;
		};
		navigationWrapped = true;
	}
	function wrapEvict() {
		if (evictWrapped) return;
		if (typeof window.plusFlatEvict === "function") {
			const ev = window.plusFlatEvict;
			window.plusFlatEvict = function () {
				window.plusRobinMoveOut();
				return ev.apply(this, arguments);
			};
		}
		if (typeof window.plusFlatMoveOut === "function") {
			const mo = window.plusFlatMoveOut;
			window.plusFlatMoveOut = function () {
				window.plusRobinMoveOut();
				return mo.apply(this, arguments);
			};
		}
		if (typeof window.plusHomeWash === "function") {
			const hw = window.plusHomeWash;
			window.plusHomeWash = function () {
				const r = hw.apply(this, arguments);
				window.plusBusJacketClear();
				return r;
			};
		}
		if (typeof window.plusLaundromatWash === "function") {
			const lw = window.plusLaundromatWash;
			window.plusLaundromatWash = function () {
				const r = lw.apply(this, arguments);
				if (r) window.plusBusJacketClear();
				return r;
			};
		}
		if (typeof window.plusFlatEvict === "function" || typeof window.plusFlatMoveOut === "function") evictWrapped = true;
	}
	function plusDropNamedNpcReactionState() {
		const st = V();
		if (!st) return;
		delete st.plusWhitneyContRepDay;
		if (st.plusNpcSceneDay && typeof st.plusNpcSceneDay === "object") {
			for (const k of Object.keys(st.plusNpcSceneDay)) {
				if (!/^(Landlord|Neighbour):/.test(k)) delete st.plusNpcSceneDay[k];
			}
		}
	}
	function boot() {
		try {
			plusDropNamedNpcReactionState();
		} catch (e) {}
		try {
			wrapRobinLocation();
		} catch (e) {}
		try {
			wrapNavigation();
		} catch (e) {}
		try {
			wrapEvict();
		} catch (e) {}
	}
	try {
		if (typeof $ === "function") $(document).one(":storyready", boot);
	} catch (e) {}
	boot();
	if (typeof $ === "function")
		$(document).on(":passagerender", function (ev) {
			try {
				window.plusBusJacketMaybeClear();
			} catch (e) {}
			try {
				window.plusRobinRewriteLeaveLinks(ev);
			} catch (e) {}
			if (!ev || !ev.content) return;
			const st = V();
			if (!st || st.combat === 1 || st.intro) return;
			try {
				const line = window.plusWeatherFlavour();
				if (line) {
					const div = document.createElement("div");
					div.className = "plus-weather-flavour";
					$(div).wiki('<span class="teal">' + line + "</span><br><br>");
					ev.content.prepend(div);
				}
			} catch (e) {}
			try {
				const name = window.plusNpcPickPresent("diaper");
				if (name) {
					window.plusNpcMark(name, "diaper");
					const text = window.plusNpcSceneText(name, "diaper");
					if (text) {
						const div = document.createElement("div");
						div.className = "plus-npc-diaper";
						$(div).wiki('<span class="purple">' + text + "</span><br><br>");
						ev.content.prepend(div);
					}
				}
			} catch (e) {}
		});
	window.plusRobinRewriteLeaveLinks = function (ev) {
		const st = V();
		if (!st || !window.plusRobinLivesAtFlat() || !(st.fromRobinRoom || st.plusRobinRoomFromFlat) || !ev || !ev.content) return;
		const links = ev.content.querySelectorAll ? ev.content.querySelectorAll("a") : [];
		for (const a of links) {
			const dest = a.getAttribute("data-passage") || "";
			if (dest !== "Orphanage") continue;
			const t = a.textContent || "";
			if (/Main hall|Orphanage|Leave/i.test(t))
				a.textContent = t.replace(/Main hall(?: \(0:01\))?/i, "Back to the bedroom").replace(/Orphanage/i, "the bedroom");
		}
	};
})();
