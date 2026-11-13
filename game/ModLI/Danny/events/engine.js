/* Danny location events: short scenes that can fire when the player visits a real game location.
 *
 * Event data lives in game/ModLI/Danny/events/events-*.js and registers itself by pushing onto
 * window.DannyEventData. Each event:
 *
 *   id        unique id
 *   title     short name (docs and tests)
 *   places    hook names; a location passage calls <<dannyEvents "place">> (see danny.twee)
 *   days      "school" (school days only) or "any"
 *   windows   [["7:00", "7:30"], ...] inclusive clock windows; or when(ctx) for anything else
 *   chance    percent, or a function of ctx; rolled once per event per in-game day
 *   met       true (default): needs $dannyIntro; "first": also fires before the first meeting
 *   req       optional function(ctx) -> bool (stat thresholds, weather, schedule)
 *   avoid     avoidance keys that suppress the event while active (DannyEvents.avoid)
 *   once      true for one-time events
 *   teaser    line shown in the location; link: label of the link that starts the scene
 *   src       scene script, same format as the talk engine (talk/engine.js), plus:
 *               => 1.2 ?? <TwineScript gate>   redirect: when this node is reached, jump to the
 *                                              first redirect whose gate is true (or has no gate)
 *             !fx lines accept the talk FX tokens plus the event tokens in FX below.
 *
 * Stat scale used by the gates (the spec talks in percentages):
 *   dannyLove()  = C.npc.Danny.love            (0-100, already a percentage)
 *   dannyCont()  = C.npc.Danny.continence / 60  (0-6000 -> 0-100 %)
 *   dannyAcc()   = C.npc.Danny.acceptance / 10  (0-1000 -> 0-100 %)
 *   $dannyEv.roll is a 0-99 roll made when the scene starts (bad-luck checks).
 */
(function () {
	"use strict";

	window.DannyEventData = window.DannyEventData || [];

	const stat = name => {
		try {
			const npc = typeof C !== "undefined" && C.npc ? C.npc.Danny : null;
			const value = npc ? Number(npc[name]) : 0;
			return Number.isFinite(value) ? value : 0;
		} catch (e) {
			return 0;
		}
	};
	window.dannyCont = () => stat("continence") / 60;
	window.dannyAcc = () => stat("acceptance") / 10;
	if (typeof window.dannyLove !== "function") window.dannyLove = () => stat("love");

	const FORCED_ACCEPTANCE_PENALTY = 150;

	const FX = {
		"acc+": "<<set _dAcc to DannyEvents.accGain(5)>><<npcincr Danny acceptance _dAcc>><<gdannyacceptance>>",
		"acc++": "<<set _dAcc to DannyEvents.accGain(10)>><<npcincr Danny acceptance _dAcc>><<gdannyacceptance>>",
		"acc-": "<<npcincr Danny acceptance -10>><<ldannyacceptance>>",
		"acc--": "<<npcincr Danny acceptance -25>><<ldannyacceptance>>",
		accident: "<<run DannyEvents.accident()>>",
		forced: "<<run DannyEvents.forced()>><<dannyForcedAcceptanceText>>",
		met: "<<set $dannyIntro to 1>>",
		"cool+": "<<status 1>><<gcool>>",
		"cool-": "<<status -1>><<lcool>>",
	};
	const PARAM_FX = [
		[/^avoid:([a-z]+):(\d+)$/, (m, key, h) => '<<run DannyEvents.avoid("' + key + '", ' + Number(h) + ")>>"],
		[/^avoid:([a-z]+):noon$/, (m, key) => '<<run DannyEvents.avoid("' + key + '", Math.max(1, 12 - Time.hour))>>'],
	];

	const fxToken = tok => {
		if (FX[tok] !== undefined) return FX[tok];
		const talk = window.DannyTalk && window.DannyTalk.FX;
		if (talk && talk[tok] !== undefined) return talk[tok];
		for (const [re, fn] of PARAM_FX) {
			const m = re.exec(tok);
			if (m) return fn(...m);
		}
		return undefined;
	};

	function parse(src) {
		const nodes = {};
		let cur = null;
		let para = [];
		const flush = () => {
			if (cur && para.length) cur.paras.push(para.join(" "));
			para = [];
		};
		for (const raw of String(src).split("\n")) {
			const line = raw.trim();
			const head = /^##\s*([0-9]+(?:\.[0-9]+)*)\s*$/.exec(line);
			if (head) {
				flush();
				cur = { paras: [], fx: "", o: [], r: [] };
				nodes[head[1]] = cur;
				continue;
			}
			if (!cur) continue;
			if (line.startsWith("!fx ")) {
				const body = line.slice(4).trim();
				const tokens = body.split(/\s+/);
				const expanded = tokens.map(fxToken);
				cur.fx += expanded.every(x => x !== undefined) ? expanded.join("") : body;
				continue;
			}
			const red = /^=>\s*([0-9]+(?:\.[0-9]+)*)(?:\s+\?\?\s+(.+))?$/.exec(line);
			if (red) {
				cur.r.push(red[2] ? [red[1], red[2]] : [red[1]]);
				continue;
			}
			const opt = /^->\s*([0-9]+(?:\.[0-9]+)*)\s*:\s*(.*?)(?:\s+\?\?\s+(.+))?$/.exec(line);
			if (opt) {
				flush();
				cur.o.push(opt[3] ? [opt[2], opt[1], opt[3]] : [opt[2], opt[1]]);
				continue;
			}
			if (line === "") flush();
			else para.push(line);
		}
		flush();
		for (const key of Object.keys(nodes)) {
			const n = nodes[key];
			n.t = n.paras.join("<br><br>");
			delete n.paras;
		}
		return nodes;
	}

	const toMin = s => {
		const [h, m] = String(s).split(":").map(Number);
		return h * 60 + (m || 0);
	};

	const V = () => State.variables;

	const DannyEvents = {
		parse,
		FX,
		FORCED_ACCEPTANCE_PENALTY,
		gateErrors: [],

		events() {
			const out = {};
			for (const ev of window.DannyEventData) {
				if (!ev || !ev.id) continue;
				if (!ev.nodes && typeof ev.src === "string") ev.nodes = parse(ev.src);
				out[ev.id] = ev;
			}
			return out;
		},

		event(id) {
			return this.events()[id] || null;
		},

		/* All event state lives in one object so old saves just gain it. */
		state() {
			const v = V();
			if (!v.dannyEv || typeof v.dannyEv !== "object") v.dannyEv = {};
			const s = v.dannyEv;
			for (const k of ["rolls", "done", "seen", "avoid"]) if (!s[k] || typeof s[k] !== "object") s[k] = {};
			return s;
		},

		now() {
			const day = typeof Time !== "undefined" && Number.isFinite(Number(Time.days)) ? Number(Time.days) : 0;
			const hour = typeof Time !== "undefined" ? Number(Time.hour) || 0 : 0;
			const minute = typeof Time !== "undefined" ? Number(Time.minute) || 0 : 0;
			return { day, hour, minute, clock: hour * 60 + minute, abs: day * 24 + hour };
		},

		ctx() {
			const n = this.now();
			let weather = "clear";
			try {
				if (typeof Weather !== "undefined") {
					if (Weather.precipitation === "rain") weather = "rain";
					else if (Weather.precipitation === "snow") weather = "snow";
					else if (Weather.isOvercast) weather = "overcast";
				}
			} catch (e) {
				weather = "clear";
			}
			return {
				...n,
				school: typeof Time !== "undefined" && !!Time.schoolDay,
				weekDay: typeof Time !== "undefined" ? Time.weekDay : 0,
				weather,
				love: window.dannyLove(),
				cont: window.dannyCont(),
				acc: window.dannyAcc(),
				met: V().dannyIntro === 1,
				loc: typeof window.getDannyLocation === "function" ? window.getDannyLocation() : "unknown",
				state: this.state(),
			};
		},

		avoid(key, hours) {
			const s = this.state();
			const until = this.now().abs + Math.max(1, Number(hours) || 1);
			s.avoid[key] = Math.max(s.avoid[key] || 0, until);
		},

		avoiding(key) {
			const s = this.state();
			return (s.avoid[key] || 0) > this.now().abs;
		},

		/* Acceptance gains are halved (rounded up) once the Forced Acceptance arc has failed. */
		accGain(n) {
			return this.state().forcedAcceptance ? Math.ceil(n / 2) : n;
		},

		forced() {
			const s = this.state();
			if (!s.forcedAcceptance) s.forcedAcceptance = this.now().day + 1;
			s.forcedCount = (s.forcedCount || 0) + 1;
			try {
				if (C.npc.Danny) {
					C.npc.Danny.acceptance = Math.clamp(stat("acceptance") - FORCED_ACCEPTANCE_PENALTY, 0, 1000);
					C.npc.Danny.love = Math.clamp(stat("love") - 3, 0, 100);
				}
			} catch (e) {
				/* stats unavailable: the flag is still recorded */
			}
		},

		/* The player saw or learned of an accident: they now know, and an aftermath scene is queued. */
		accident() {
			const s = this.state();
			const n = this.now();
			V().dannyAccidentKnown = 1;
			s.accident = { d: n.day, h: n.hour };
			s.accidents = (s.accidents || 0) + 1;
		},

		available(ev, place, c) {
			c = c || this.ctx();
			const s = c.state;
			if (!ev.places.includes(place)) return false;
			if (ev.days === "school" && !c.school) return false;
			if (ev.met !== "first" && !c.met) return false;
			if (ev.once && s.seen[ev.id]) return false;
			if (s.done[ev.id] === c.day) return false;
			if (this.avoiding("all")) return false;
			if ((ev.avoid || []).some(k => this.avoiding(k))) return false;
			if (ev.windows && !ev.windows.some(([a, b]) => c.clock >= toMin(a) && c.clock <= toMin(b))) return false;
			if (typeof ev.when === "function" && !ev.when(c)) return false;
			if (typeof ev.req === "function" && !ev.req(c)) return false;
			return true;
		},

		chance(ev, c) {
			const v = typeof ev.chance === "function" ? ev.chance(c) : ev.chance;
			return Math.max(0, Math.min(100, Number(v) || 0));
		},

		/* First available event for this place whose daily roll succeeds. Rolls are kept for the
		 * day, so revisiting a location does not reroll. */
		pick(place, rng) {
			const rand = typeof rng === "function" ? rng : Math.random;
			const c = this.ctx();
			const s = c.state;
			for (const ev of Object.values(this.events())) {
				if (!this.available(ev, place, c)) continue;
				let r = s.rolls[ev.id];
				if (!r || r.d !== c.day) {
					r = { d: c.day, hit: rand() * 100 < this.chance(ev, c) };
					s.rolls[ev.id] = r;
				}
				if (r.hit) return ev;
			}
			return null;
		},

		begin(id, ret, rng) {
			const ev = this.event(id);
			if (!ev) return null;
			const rand = typeof rng === "function" ? rng : Math.random;
			const s = this.state();
			const n = this.now();
			s.done[id] = n.day;
			s.seen[id] = (s.seen[id] || 0) + 1;
			s.id = id;
			s.node = "0";
			s.ret = ret || s.ret || "Hallways";
			s.roll = Math.floor(rand() * 100);
			s.firstMeeting = V().dannyIntro !== 1;
			if (ev.onBegin) ev.onBegin(s);
			return ev;
		},

		finish() {
			const s = this.state();
			const ret = s.ret || "Hallways";
			delete s.id;
			delete s.node;
			delete s.ret;
			return ret;
		},

		gate(expr) {
			if (!expr) return true;
			try {
				return !!Scripting.evalTwineScript(expr);
			} catch (e) {
				this.gateErrors.push(expr + ": " + (e && e.message ? e.message : e));
				return false;
			}
		},

		/* Follow redirects from a node to the node that is actually shown. */
		resolve(id, key) {
			const ev = this.event(id);
			if (!ev) return null;
			let cur = key;
			for (let guard = 0; guard < 20; guard++) {
				const node = ev.nodes[cur];
				if (!node) return null;
				const next = (node.r || []).find(r => this.gate(r[1]));
				if (!next) return cur;
				cur = next[0];
			}
			return cur;
		},

		node(id, key) {
			const ev = this.event(id);
			return ev && ev.nodes ? ev.nodes[key] || null : null;
		},

		fill(text) {
			return window.DannyTalk ? window.DannyTalk.fillPronouns(text) : text;
		},

		text(id, key) {
			const node = this.node(id, key);
			return node ? this.fill(node.t) : "";
		},

		fx(id, key) {
			const node = this.node(id, key);
			return node && node.fx ? node.fx : "";
		},

		options(id, key) {
			const node = this.node(id, key);
			if (!node) return [];
			return node.o.filter(o => this.gate(o[2])).map(o => ({ label: this.fill(o[0]), to: o[1] }));
		},

		teaser(id) {
			const ev = this.event(id);
			return ev ? this.fill(ev.teaser) : "";
		},

		link(id) {
			const ev = this.event(id);
			return ev ? this.fill(ev.link || "Go over to Danny") : "";
		},
	};

	window.DannyEvents = DannyEvents;
})();
