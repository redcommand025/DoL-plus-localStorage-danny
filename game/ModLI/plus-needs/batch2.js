/* Plus Needs content-batch 2: bus accidents, hospital clinic, named-NPC scenes,
 * weather flavour, flat life, and Robin moving in. */
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
		Robin() {
			const loc = typeof window.getRobinLocation === "function" ? window.getRobinLocation() : "";
			const title = passageTitle();
			if (/Robin|Plus Flat/.test(title) && window.plusRobinLivesAtFlat && window.plusRobinLivesAtFlat())
				return loc === "flat" || loc === "sleep" || loc === "orphanage";
			if (/Robin/.test(title)) return true;
			return (
				(loc === "orphanage" || loc === "flat") &&
				(V().location === "home" || (typeof window.plusLocationIsFlat === "function" ? window.plusLocationIsFlat() : V().location === "flat"))
			);
		},
		Bailey() {
			return !!(
				typeof window.plusBaileyRelentless === "function" &&
				window.plusBaileyRelentless() &&
				/Bailey|rentdue|Rent Due|Bedroom Bailey/i.test(passageTitle())
			);
		},
		Sam() {
			return V().location === "cafe" || /Cafe|Sam/.test(passageTitle());
		},
		Alex() {
			return V().location === "farm" || /Alex|Farm /.test(passageTitle());
		},
		Charlie() {
			const loc = V().location;
			return /Dance|Charlie/.test(passageTitle()) || loc === "dance_studio" || loc === "dance";
		},
		Sirris() {
			return /Science Lesson|Sirris/.test(passageTitle());
		},
		River() {
			return /Maths Lesson|River/.test(passageTitle());
		},
		Doren() {
			return /English Lesson|Doren/.test(passageTitle());
		},
		Winter() {
			return /History Lesson|Winter/.test(passageTitle());
		},
		Mason() {
			return /Swimming Lesson|Mason/.test(passageTitle());
		},
		Whitney() {
			return /Hallway|Whitney/.test(passageTitle()) || V().location === "school";
		},
		Kylar() {
			return npcInit("Kylar") && (/Kylar|Street|Hallway/.test(passageTitle()) || V().location === "town" || V().location === "school");
		},
		Sydney() {
			return npcInit("Sydney") && (/Sydney|Temple|Library/.test(passageTitle()) || V().location === "temple");
		},
		Avery() {
			return npcInit("Avery") && (/Avery|Danube|Street/.test(passageTitle()) || V().location === "town");
		},
		Eden() {
			return npcInit("Eden") && (/Eden|Cabin|Forest/.test(passageTitle()) || V().location === "forest" || V().location === "cabin");
		},
		Niki() {
			return npcInit("Niki") && (/Niki|Photograph|Studio/.test(passageTitle()) || V().location === "studio");
		},
		Landlord() {
			return (typeof window.plusLocationIsFlat === "function" && window.plusLocationIsFlat()) || /Plus Flat Hallway|Plus Flat Bedroom/.test(passageTitle());
		},
		Neighbour() {
			return (typeof window.plusLocationIsFlat === "function" && window.plusLocationIsFlat()) || /Plus Flat Hallway/.test(passageTitle());
		},
	};
	window.plusNpcPresent = function (name) {
		if (name === "Danny") return false;
		const fn = NPC_WHERE[name];
		if (!fn) return false;
		try {
			return !!fn();
		} catch (e) {
			return false;
		}
	};
	window.plusNpcSceneAllowed = function (name, kind) {
		if (name === "Danny") return false;
		if (name === "Bailey" && !(typeof window.plusBaileyRelentless === "function" && window.plusBaileyRelentless())) return false;
		if (
			["Robin", "Sam", "Alex", "Charlie", "Whitney", "Kylar", "Sydney", "Avery", "Eden", "Niki", "Sirris", "River", "Doren", "Winter", "Mason"].includes(
				name
			) &&
			name !== "Landlord" &&
			name !== "Neighbour" &&
			name !== "Bailey"
		) {
			if (["Sirris", "River", "Doren", "Winter", "Mason", "Whitney"].includes(name)) {
				/* teachers and Whitney exist once school is in play */
			} else if (!npcInit(name) && name === "Robin") {
				return false;
			} else if (["Kylar", "Sydney", "Avery", "Eden", "Niki", "Robin"].includes(name) && !npcInit(name)) {
				return false;
			}
		}
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
		/* Soft relationship gates: close friends get the kinder lines; low love still can see. */
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
		Robin: {
			diaper: [
				'Robin notices the shape under your clothes and looks worried, not unkind. "If you ever want to talk about it, or if you need help finding a bathroom, I\'m here."',
				'Robin glances down, then quickly back to your face. "I don\'t mind. Do you want to go somewhere quieter?"',
				'Robin gives you a small, private smile. "You look uncomfortable. We can take a break whenever you need. No one else has to know."',
			],
			accident: [
				"Robin sees what happened and steps in close, trying to shield you from anyone else. \"It's all right. Let's get you somewhere you can clean up. I'll walk with you.\"",
				"Colour rises in Robin's face, but {{he}} does not laugh. \"Come on. We can go back to my room — or yours. You don't have to explain.\"",
				'Robin puts a hand on your arm, steady and quiet. "These things happen. Let me help you get out of here before more people notice."',
			],
		},
		Bailey: {
			diaper: [
				'Bailey\'s gaze flicks to the padding at your waist and stays there a moment too long. "If that is how you mean to get through the day, keep it out of my sight and out of the hallway."',
				'Bailey folds their arms. "I did not take you in so you could walk around like that. Sort yourself out before someone complains."',
			],
			accident: [
				'Bailey takes in the state of you and does not bother to lower their voice. "Clean that up, and yourself. I have no patience for this today."',
				'Bailey\'s mouth tightens. "If you cannot hold it, you can explain the mess to whoever has to deal with it. Get out of my way."',
			],
		},
		Sam: {
			diaper: [
				'Sam\'s eyes catch on the outline at your waist as they set a cup down. They keep their voice low. "If you need the loo, just say. I can watch the counter."',
				'Sam pretends to tidy a napkin stack so no one else looks over. "You\'re fine. The back room is free if you want a minute."',
			],
			accident: [
				'Sam notices at once and moves to block the view from the tables. "Come through the back. I\'ll get you a cloth and a bit of space. No one out here needs to stare."',
				"Sam's professional smile does not slip, but they steer you toward the staff door. \"Accidents happen. Let's get you sorted before the lunch rush.\"",
			],
		},
		Alex: {
			diaper: [
				'Alex clocked the padding when you bent to lift a crate, and does not make a fuss. "If you need a break, take one. The work will still be here."',
				"Alex nods toward the farmhouse. \"There's a toilet inside. Use it when you need. I don't care what you wear to get through a long shift.\"",
			],
			accident: [
				"Alex looks, then looks away toward the fields, giving you a moment. \"There's a hose by the shed and a change of clothes in the porch. Go. I'll cover for you.\"",
				'Alex\'s voice is practical, not unkind. "It happens, especially on a long day. Get cleaned up. We can finish later."',
			],
		},
		Charlie: {
			diaper: [
				'Charlie notices as you adjust your clothes and keeps their tone professional. "If you need to step out, do it. I would rather you were comfortable than pushing through a class."',
				'Charlie glances once, then back to the studio floor. "The changing room is yours if you want it. No questions."',
			],
			accident: [
				'Charlie stops the music and turns so the others look at them, not at you. "Take five, everyone." Then, quietly, to you: "There\'s a shower in the back. Go. I\'ll hold the class."',
				"Charlie's face is tight with concern, not anger. \"Leave the floor. I'll tell them you felt unwell. Come back when you're ready, or don't.\"",
			],
		},
		Sirris: {
			diaper: [
				'Sirris notices as they pass your bench and lowers their voice. "If you need to be excused, you only have to ask. I would rather you were not sitting in discomfort."',
				'Sirris\'s eyes flick down and then to the clock. "There is time before the next demonstration. Use it if you need."',
			],
			accident: [
				'Sirris sees immediately and steps between you and the rest of the class. "Everyone, eyes on the board. You — come with me. The staff bathroom is this way."',
				'Sirris keeps their voice even. "These things are medical, not a joke. Go and get cleaned up. I will mark you present."',
			],
		},
		River: {
			diaper: [
				'River clocks it and does not waste words. "If you need to leave, leave. Better that than sitting there distracted."',
				'River taps the desk once. "Ask if you need the toilet. I will not make a scene of it."',
			],
			accident: [
				'River\'s chair scrapes back. "Out. Now. The corridor bathroom. I will deal with the class." Their tone is sharp, but it is meant to get you moving, not to shame you in front of everyone.',
				'River cuts off a rising laugh with a look. "Enough. You, go and sort yourself out. The rest of you, back to the problem on the board."',
			],
		},
		Doren: {
			diaper: [
				'Doren\'s glance is brief and kind. "If you need to step out, you may. You will not be marked late."',
				'Doren sets a book down and speaks only to you. "Comfort matters more than the next page. Go if you need to."',
			],
			accident: [
				'Doren is at your side before anyone can comment, a coat already half off. "Come with me. We will find you something to wear and a sink. You are all right."',
				'Doren\'s voice is quiet and firm. "This is not a story for the corridor. Go to the staff room. I will follow in a moment."',
			],
		},
		Winter: {
			diaper: [
				'Winter notices and looks, as usual, faintly unimpressed by the world\'s inconveniences. "If you require an excuse, you have one. Do not sit there in misery for the sake of a lesson."',
				'Winter\'s comment is dry. "I have seen worse preparations for a long afternoon. Use the facilities if you need them."',
			],
			accident: [
				'Winter does not raise their voice. They simply close the book and say, "The rest of you will read the next two pages. You, with me." The walk to the door is blessedly short.',
				'Winter\'s look silences the first whisper. "That will do. Go and make yourself presentable. This will not be discussed."',
			],
		},
		Mason: {
			diaper: [
				'Mason notices as you sit on the bench and keeps it matter-of-fact. "If you need the changing room, take it. I would rather you were ready than pretending you are fine."',
				'Mason nods toward the showers. "Use them. No one has to make a speech about it."',
			],
			accident: [
				'Mason steps in front of you and points the others toward the pool. "Laps. Now." Then, to you: "Shower, kit from the lost-and-found, and take your time. I\'ll say you cramped."',
				'Mason\'s voice is low. "It happens. Get cleaned up. You are not finishing this lesson, and that is all right."',
			],
		},
		Whitney: {
			diaper: [
				'Whitney spots the outline and smirks, but keeps it to a mutter. "Nice look. Try not to rustle in assembly, yeah?" A couple of hangers-on snigger and then lose interest.',
				"Whitney's eyes go to your waist and back up, pleased with themselves. \"Didn't think you'd show up like that. Don't look at me if someone notices.\"",
			],
			accident: [
				'Whitney sees it and, for a moment, just stares. Then the smirk comes back, thinner than usual. "Wow. You really couldn\'t wait. Maybe walk faster next time." They do not follow you.',
				'Whitney lets out a short laugh, then glances at the others as if deciding how far to take it. "Go on, then. Before I have to smell it." It is cruel, but it is also a way out.',
			],
		},
		Kylar: {
			diaper: [
				'Kylar notices and goes very still, then steps closer than is comfortable. "You should have told me. I would have — I can walk you. People shouldn\'t stare."',
				"Kylar's voice is tight. \"If anyone says anything, tell me. You shouldn't have to deal with this alone.\"",
			],
			accident: [
				"Kylar is in front of you almost at once, blocking the view, shaking. \"Don't look at them. Look at me. I'll get you out of here. I won't let them talk.\"",
				"Kylar's face is white. \"It's all right. It's all right. Come with me. I'll find you something clean. You don't have to stay here.\"",
			],
		},
		Sydney: {
			diaper: [
				'Sydney notices and colours, then offers a careful smile. "If you need a moment, the side room is usually empty. I won\'t mention it."',
				'Sydney\'s voice is gentle. "You look like you could use a break. I can finish up here if you want to go."',
			],
			accident: [
				"Sydney's eyes go wide, then soft. They move to your side and speak very quietly. \"It's all right. There's a washroom just there. I'll wait outside if you want me to.\"",
				'Sydney looks as if they might pray, then simply takes a breath. "Come on. No one here should make this worse. I\'ll walk with you."',
			],
		},
		Avery: {
			diaper: [
				'Avery notices and looks quickly away, then clears their throat. "If you would rather sit this out, I understand. I can make an excuse."',
				"Avery's smile is polite and a little strained. \"You needn't explain. The cloakroom is just back there, if that helps.\"",
			],
			accident: [
				'Avery goes still, then steps in with surprising speed, shrugging off a coat. "Here. This way — there is a bathroom off the lobby. I will tell them you were unwell."',
				'Avery\'s voice stays low and even. "This does not have to be a scene. Let me get you out of the room. We can talk later, or not at all."',
			],
		},
		Eden: {
			diaper: [
				"Eden notices and snorts, not unkindly. \"Wear what you have to. The woods don't care, and neither do I. There's a bucket and a stream if you need them.\"",
				'Eden glances once. "If that keeps you from having to run back to town, fine. Just don\'t expect me to fuss."',
			],
			accident: [
				"Eden looks, then jerks their chin at the trees. \"Go down to the water. There's soap in the cabin. I'll keep watch. It happens.\"",
				"Eden's comment is blunt. \"Worse things have happened out here. Get cleaned up. I'll put the kettle on.\"",
			],
		},
		Niki: {
			diaper: [
				'Niki notices as they adjust a light and keeps it professional. "If you need a break, say so. I can wait. Comfort shows in the pictures anyway."',
				"Niki's tone is easy. \"Changing room is yours. No need to sit through a session if you're uncomfortable.\"",
			],
			accident: [
				"Niki turns the camera away at once and steps between you and the set. \"We're done for now. There's a sink in the back and a spare robe on the hook. Take your time.\"",
				"Niki's voice is calm and practical. \"It happens. I'll clear the room. You get cleaned up; we can reschedule, or not. Your call.\"",
			],
		},
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
	function boot() {
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
