/* Danny location events: data graph, availability windows, requirements, daily rolls, branch
 * outcomes and content rules. Runs the real engine and event files in a vm sandbox. */
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = rel => readFileSync(join(root, rel), "utf8");
const FILES = [
	"game/ModLI/Danny/talk/engine.js",
	"game/ModLI/Danny/schedule.js",
	"game/ModLI/Danny/events/engine.js",
	"game/ModLI/Danny/events/events-after.js",
	"game/ModLI/Danny/events/events-orphanage.js",
	"game/ModLI/Danny/events/events-school.js",
];

const pct = { love: v => v, cont: v => v * 60, acc: v => v * 10 };

function load({ love = 20, cont = 50, acc = 20, met = true, time = {}, weather = "none", overcast = false, vars = {} } = {}) {
	const State = { variables: { dannyIntro: met ? 1 : undefined, submissive: 1000, cool: 100, ...vars } };
	const npc = {
		Danny: { love: pct.love(love), acceptance: pct.acc(acc), continence: pct.cont(cont), pronoun: "m" },
		Niki: { pronoun: "f" },
		Bailey: { pronoun: "m" },
	};
	const MathX = Object.create(Math);
	MathX.clamp = (v, a, b) => Math.min(b, Math.max(a, v));
	const ctx = {
		console,
		Math: MathX,
		State,
		C: { npc },
		Time: { days: 10, hour: 7, minute: 45, schoolDay: true, weekDay: 3, ...time },
		Weather: { precipitation: weather, isOvercast: overcast },
	};
	ctx.window = ctx;
	ctx.Scripting = {
		evalTwineScript(expr) {
			const js = String(expr)
				.replace(/\$(\w+)/g, "State.variables.$1")
				.replace(/\bisnot\b/g, "!==")
				.replace(/\bgte\b/g, ">=")
				.replace(/\blte\b/g, "<=")
				.replace(/\bgt\b/g, ">")
				.replace(/\blt\b/g, "<")
				.replace(/\band\b/g, "&&")
				.replace(/\bor\b/g, "||")
				.replace(/\bnot\b/g, "!")
				.replace(/\bis\b/g, "===");
			return vm.runInContext(js, ctx);
		},
	};
	vm.createContext(ctx);
	for (const f of FILES) vm.runInContext(read(f), ctx, { filename: f });
	return ctx;
}

const setStats = (ctx, { love, cont, acc }) => {
	const d = ctx.C.npc.Danny;
	if (love !== undefined) d.love = pct.love(love);
	if (cont !== undefined) d.continence = pct.cont(cont);
	if (acc !== undefined) d.acceptance = pct.acc(acc);
};

/* Start an event with a fixed roll and walk a path of option targets; returns the shown node. */
function walk(ctx, id, path = [], roll = 50) {
	const E = ctx.DannyEvents;
	E.begin(id, "Hallways", () => roll / 100);
	const s = ctx.State.variables.dannyEv;
	let key = E.resolve(id, "0");
	for (const to of path) {
		const opts = E.options(id, key).map(o => o.to);
		assert.ok(opts.includes(to), `${id}: option ${to} not offered at ${key} (have ${opts})`);
		key = E.resolve(id, to);
	}
	s.node = key;
	return key;
}

const atTime = (ctx, h, m, extra = {}) => Object.assign(ctx.Time, { hour: h, minute: m, ...extra });

function gameSource() {
	let out = "";
	const walkDir = dir => {
		for (const name of readdirSync(dir)) {
			const full = join(dir, name);
			if (statSync(full).isDirectory()) walkDir(full);
			else if (/\.twee$/.test(name)) out += readFileSync(full, "utf8") + "\n";
		}
	};
	walkDir(join(root, "game"));
	return out;
}

const EXPECTED = [
	"aftermath",
	"bleachers",
	"studio",
	"sendoff",
	"camera",
	"sheets",
	"breakfast",
	"chores",
	"commonroom",
	"stairwell",
	"hallway",
	"toilets",
	"library",
	"scienceEarly",
	"scienceLab",
	"scienceSeat",
	"canteen",
	"rainBag",
];

describe("Danny events data", () => {
	const ctx = load();
	const events = ctx.DannyEvents.events();

	it("registers every merged event exactly once, aftermath first", () => {
		assert.deepEqual(Object.keys(events), EXPECTED);
		assert.equal(ctx.DannyEventData.length, EXPECTED.length);
	});

	it("every event has places, a schedule, a chance, a teaser, a link and a parsed scene", () => {
		for (const ev of Object.values(events)) {
			assert.ok(Array.isArray(ev.places) && ev.places.length, ev.id);
			assert.ok(["school", "any"].includes(ev.days), ev.id);
			assert.ok(ev.windows || typeof ev.when === "function", ev.id + " needs windows or when");
			assert.ok(typeof ev.chance === "number" || typeof ev.chance === "function", ev.id);
			assert.ok(ev.teaser && ev.link, ev.id);
			assert.ok(ev.nodes["0"], ev.id + " has node 0");
		}
	});

	it("every option and redirect points at an existing node, and every node is reachable from 0", () => {
		for (const ev of Object.values(events)) {
			const reach = new Set();
			const stack = ["0"];
			while (stack.length) {
				const k = stack.pop();
				if (reach.has(k)) continue;
				reach.add(k);
				const n = ev.nodes[k];
				assert.ok(n, `${ev.id}: missing node ${k}`);
				for (const o of n.o) stack.push(o[1]);
				for (const r of n.r) stack.push(r[0]);
			}
			assert.deepEqual([...reach].sort(), Object.keys(ev.nodes).sort(), ev.id + " unreachable nodes");
		}
	});

	it("every node is actually shown for some stat profile, without gate errors", () => {
		const E = ctx.DannyEvents;
		const seen = {};
		for (const love of [0, 12, 20, 30, 50])
			for (const cont of [5, 12, 20, 28, 50])
				for (const acc of [10, 35, 50, 70])
					for (const roll of [0, 25, 45, 55, 90])
						for (const submissive of [700, 1000, 1200])
							for (const first of [false, true]) {
								setStats(ctx, { love, cont, acc });
								Object.assign(ctx.State.variables, { submissive, cool: roll < 50 ? 400 : 0, dannyIntro: first ? undefined : 1 });
								for (const ev of Object.values(events)) {
									E.begin(ev.id, "Hallways", () => roll / 100);
									const stack = [E.resolve(ev.id, "0")];
									const done = new Set();
									while (stack.length) {
										const k = stack.pop();
										if (!k || done.has(k)) continue;
										done.add(k);
										(seen[ev.id] = seen[ev.id] || new Set()).add(k);
										for (const o of E.options(ev.id, k)) stack.push(E.resolve(ev.id, o.to));
									}
								}
							}
		assert.equal(E.gateErrors.length, 0, JSON.stringify(E.gateErrors.slice(0, 5)));
		for (const ev of Object.values(events)) {
			const shown = Object.keys(ev.nodes).filter(k => seen[ev.id].has(k) || ev.nodes[k].r.length);
			assert.deepEqual(shown.sort(), Object.keys(ev.nodes).sort(), ev.id + " nodes never shown");
		}
	});

	it("effect lines are expanded tokens or SugarCube markup, never stray words", () => {
		for (const ev of Object.values(events))
			for (const [k, n] of Object.entries(ev.nodes)) if (n.fx) assert.match(n.fx, /^<<[\s\S]*>>$/, `${ev.id} ${k}: ${n.fx}`);
	});

	it("pronoun tokens are all filled", () => {
		for (const ev of Object.values(events)) {
			assert.doesNotMatch(ctx.DannyEvents.teaser(ev.id) + ctx.DannyEvents.link(ev.id), /\{\w+\}/, ev.id);
			for (const k of Object.keys(ev.nodes)) {
				assert.doesNotMatch(ctx.DannyEvents.text(ev.id, k), /\{\w+\}/, ev.id + " " + k);
				for (const o of ev.nodes[k].o) assert.doesNotMatch(ctx.DannyEvents.fill(o[0]), /\{\w+\}/, ev.id + " " + k);
			}
		}
	});

	it("content stays non-sexual and non-romantic, with no nudity or lust", () => {
		const banned =
			/\b(kiss\w*|flirt\w*|lust\w*|romanc\w*|crush|date|dating|sexy|sex|sexual\w*|arous\w*|naked|nude|nudity|undress\w*|strip(s|ped|ping)?\b|underwear|panties|boxers|briefs|diaper\w*|nappy|nappies|cute|blush\w*|intimac\w*|lewd|grope\w*|breast\w*|butt|bottom|crotch|thigh\w*)\b/i;
		for (const ev of Object.values(events)) {
			for (const s of [ev.teaser, ev.link, ev.title]) assert.doesNotMatch(s, banned, ev.id);
			for (const [k, n] of Object.entries(ev.nodes)) {
				assert.doesNotMatch(n.t, banned, `${ev.id} ${k}: ${(n.t.match(banned) || [])[0]}`);
				for (const o of n.o) assert.doesNotMatch(o[0], banned, `${ev.id} ${k}`);
				if (n.fx) assert.doesNotMatch(n.fx, /lust/i, ev.id);
			}
		}
	});

	it("every place used by an event has a <<dannyEvents>> hook in a real location passage, and vice versa", () => {
		const src = gameSource();
		const hooks = new Set([...src.matchAll(/<<dannyEvents "(\w+)">>/g)].map(m => m[1]).filter(p => p !== "place"));
		const places = new Set(Object.values(events).flatMap(e => e.places));
		assert.equal(JSON.stringify([...places].sort()), JSON.stringify([...hooks].sort()));
		const where = {
			orphanage: ":: Orphanage",
			orphanageBathroom: ":: Bathroom",
			kitchen: ":: Kitchen",
			garden: ":: Garden",
			domus: ":: Domus Street",
			hallways: ":: Hallways",
			schoolFront: ":: School Front Courtyard",
			schoolRear: ":: School Rear Courtyard",
			library: ":: School Library",
			canteen: ":: Canteen",
			toilets: ":: School Toilets",
			studio: ":: Photo",
			scienceEarly: ":: Science Classroom",
			scienceLesson: ":: Science Classroom",
		};
		const passages = src.split(/\n(?=:: )/);
		for (const [place, head] of Object.entries(where)) {
			const p = passages.find(x => x.startsWith(head + "\n") || x.startsWith(head + " ["));
			assert.ok(p, head);
			if (place === "scienceLesson") assert.match(src, /:: Science Lesson\n[\s\S]*?<<if Time\.minute lt 5>>\n\t\t<<dannyEvents "scienceLesson">>/);
			else assert.ok(p.includes(`<<dannyEvents "${place}">>`), place + " hook in " + head);
		}
	});

	it("the Danny Event passage and hook widget are wired natively", () => {
		const danny = read("game/ModLI/Danny/danny.twee");
		assert.match(danny, /^:: Danny Event$/m);
		assert.match(danny, /<<widget "dannyEvents">>/);
		assert.match(danny, /DannyEvents\.pick\(_args\[0\]\)/);
		assert.match(danny, /DannyEvents\.begin\(_dEv\.id, passage\(\)\)/);
		assert.match(danny, /\$exposed lte 0 and \$stress lt \$stressmax/);
		assert.match(danny, /<<widget "ldannyacceptance">>/);
		assert.match(danny, /<<widget "dannyForcedAcceptanceText">>/);
		assert.match(danny, /<<link "Continue" _deRet>><<run DannyEvents\.finish\(\)>>/);
	});
});

/* [event, place, inside window [h, m], outside window [h, m], extra time/ctx] */
const WINDOWS = [
	["sendoff", "orphanage", [7, 15], [7, 31]],
	["camera", "domus", [7, 20], [7, 9]],
	["sheets", "orphanage", [6, 30], [7, 10]],
	["sheets", "orphanageBathroom", [19, 30], [18, 59]],
	["breakfast", "kitchen", [7, 10], [7, 21]],
	["chores", "garden", [6, 15], [8, 0]],
	["stairwell", "schoolFront", [7, 40], [7, 51]],
	["hallway", "hallways", [7, 45], [7, 39]],
	["toilets", "toilets", [7, 50], [7, 56]],
	["library", "library", [8, 30], [8, 56]],
	["scienceEarly", "scienceEarly", [8, 45], [8, 29]],
	["canteen", "canteen", [12, 30], [13, 0]],
	["rainBag", "hallways", [10, 0], [15, 1], { weather: "rain" }],
	["bleachers", "schoolRear", [15, 10], [15, 20]],
];

describe("Danny events availability", () => {
	for (const [id, place, inside, outside, extra = {}] of WINDOWS) {
		it(`${id} at ${place}: open at ${inside.join(":")}, closed at ${outside.join(":")}`, () => {
			const ctx = load({ ...extra });
			const E = ctx.DannyEvents;
			const ev = E.event(id);
			atTime(ctx, ...inside);
			assert.equal(E.available(ev, place), true, "inside window");
			atTime(ctx, ...outside);
			assert.equal(E.available(ev, place), false, "outside window");
			atTime(ctx, ...inside);
			assert.equal(E.available(ev, "nowhere"), false, "other place");
		});
	}

	it("school-day events never fire on a weekend; 'any' events can", () => {
		const ctx = load({ time: { schoolDay: false, weekDay: 1, hour: 7, minute: 15 } });
		const E = ctx.DannyEvents;
		assert.equal(E.available(E.event("sendoff"), "orphanage"), false);
		atTime(ctx, 6, 30);
		assert.equal(E.available(E.event("chores"), "garden"), true);
	});

	it("only the first-meeting windows (send-off, camera check) fire before the player has met Danny", () => {
		const ctx = load({ met: false });
		const E = ctx.DannyEvents;
		atTime(ctx, 7, 20);
		assert.equal(E.available(E.event("sendoff"), "orphanage"), true);
		assert.equal(E.available(E.event("camera"), "domus"), true);
		for (const [id, place, inside, , extra] of WINDOWS) {
			if (id === "sendoff" || id === "camera" || extra) continue;
			atTime(ctx, ...inside);
			assert.equal(E.available(E.event(id), place), false, id);
		}
	});

	it("science lab only on Tuesday and Thursday at the start of the lesson; the seat event any school day", () => {
		const ctx = load({ time: { hour: 9, minute: 2, weekDay: 3 } });
		const E = ctx.DannyEvents;
		assert.equal(E.available(E.event("scienceLab"), "scienceLesson"), true);
		assert.equal(E.available(E.event("scienceSeat"), "scienceLesson"), true);
		ctx.Time.weekDay = 2;
		assert.equal(E.available(E.event("scienceLab"), "scienceLesson"), false);
		assert.equal(E.available(E.event("scienceSeat"), "scienceLesson"), true);
		ctx.Time.minute = 6;
		assert.equal(E.available(E.event("scienceSeat"), "scienceLesson"), false);
	});

	it("stat and weather requirements: bleachers needs clear weather and love 10; rain bag needs rain and love 15; common room needs love 10 and Danny home", () => {
		const ctx = load({ love: 9, time: { hour: 15, minute: 5 } });
		const E = ctx.DannyEvents;
		assert.equal(E.available(E.event("bleachers"), "schoolRear"), false);
		setStats(ctx, { love: 10 });
		assert.equal(E.available(E.event("bleachers"), "schoolRear"), true);
		ctx.Weather.precipitation = "rain";
		assert.equal(E.available(E.event("bleachers"), "schoolRear"), false);
		atTime(ctx, 10, 0);
		setStats(ctx, { love: 14 });
		assert.equal(E.available(E.event("rainBag"), "hallways"), false);
		setStats(ctx, { love: 15 });
		assert.equal(E.available(E.event("rainBag"), "hallways"), true);
		ctx.Weather.precipitation = "none";
		ctx.Weather.isOvercast = true;
		atTime(ctx, 15, 5);
		assert.equal(E.available(E.event("bleachers"), "schoolRear"), false, "overcast is not clear");
		atTime(ctx, 20, 30);
		setStats(ctx, { love: 10 });
		assert.equal(E.available(E.event("commonroom"), "orphanage"), true);
		setStats(ctx, { love: 9 });
		assert.equal(E.available(E.event("commonroom"), "orphanage"), false);
		setStats(ctx, { love: 10 });
		atTime(ctx, 17, 0);
		assert.equal(E.available(E.event("commonroom"), "orphanage"), false, "Danny is at work at 17:00 on a school day");
		atTime(ctx, 17, 0, { schoolDay: false });
		assert.equal(E.available(E.event("commonroom"), "orphanage"), true, "home from 16:00 at weekends");
	});

	it("chances: send-off 25%, hallway 15% (30% on low continence), library 50% (70% at love 25)", () => {
		const ctx = load({ cont: 50, love: 20 });
		const E = ctx.DannyEvents;
		const c = () => E.ctx();
		assert.equal(E.chance(E.event("sendoff"), c()), 25);
		assert.equal(E.chance(E.event("hallway"), c()), 15);
		assert.equal(E.chance(E.event("library"), c()), 50);
		setStats(ctx, { cont: 30, love: 25 });
		assert.equal(E.chance(E.event("hallway"), c()), 30);
		assert.equal(E.chance(E.event("library"), c()), 70);
	});

	it("rolls once per event per day: a miss stays a miss until tomorrow, a hit stays a hit", () => {
		const ctx = load();
		const E = ctx.DannyEvents;
		atTime(ctx, 7, 45);
		assert.equal(
			E.pick("hallways", () => 0.99),
			null
		);
		assert.equal(
			E.pick("hallways", () => 0),
			null,
			"same day, no reroll"
		);
		ctx.Time.days = 11;
		assert.equal(E.pick("hallways", () => 0).id, "hallway");
		assert.equal(E.pick("hallways", () => 0.99).id, "hallway", "hit is kept");
		E.begin("hallway", "Hallways");
		assert.equal(
			E.pick("hallways", () => 0),
			null,
			"done for the day once started"
		);
		ctx.Time.days = 12;
		assert.equal(E.pick("hallways", () => 0).id, "hallway");
	});

	it("begin records the return passage and finish hands it back and clears the scene", () => {
		const ctx = load();
		const E = ctx.DannyEvents;
		E.begin("library", "School Library", () => 0.42);
		const s = ctx.State.variables.dannyEv;
		assert.equal(s.id, "library");
		assert.equal(s.node, "0");
		assert.equal(s.roll, 42);
		assert.equal(E.finish(), "School Library");
		assert.equal(s.id, undefined);
	});

	it("old saves without $dannyEv, or with a broken one, get a clean state", () => {
		const ctx = load({ vars: { dannyEv: "corrupt" } });
		const s = ctx.DannyEvents.state();
		assert.equal(typeof s.rolls, "object");
		assert.equal(typeof s.avoid, "object");
	});
});

describe("Danny events branch outcomes", () => {
	it("send-off: first meeting sets $dannyIntro; camera opener raises love; personal question too early lowers it", () => {
		const ctx = load({ met: false });
		const E = ctx.DannyEvents;
		assert.equal(walk(ctx, "sendoff"), "10");
		assert.match(E.fx("sendoff", "10"), /\$dannyIntro to 1/);
		assert.match(E.fx("sendoff", walk(ctx, "sendoff", ["12"])), /love 2/);
		ctx.State.variables.dannyIntro = 1;
		setStats(ctx, { love: 5, cont: 50 });
		assert.equal(walk(ctx, "sendoff"), "23");
		assert.match(E.fx("sendoff", walk(ctx, "sendoff", ["23.2"])), /love -1/);
		setStats(ctx, { love: 15 });
		assert.equal(walk(ctx, "sendoff"), "22", "love 15: slight pause");
		setStats(ctx, { cont: 30 });
		assert.equal(walk(ctx, "sendoff"), "21", "low continence: hurried");
	});

	it("staff in the background are rolled and mentioned", () => {
		const ctx = load({ met: false });
		walk(ctx, "sendoff", [], 10);
		assert.match(ctx.DannyEvents.text("sendoff", "10"), /<<if \$dannyEv\.roll lt 40>>/);
	});

	it("wet sheets: learning of it sets $dannyAccidentKnown; gentle handling raises acceptance; 'just wear protection' or telling triggers Forced Acceptance", () => {
		const ctx = load({ love: 10, acc: 20 });
		const E = ctx.DannyEvents;
		assert.equal(walk(ctx, "sheets"), "1");
		assert.match(E.fx("sheets", "0"), /DannyEvents\.accident\(\)/);
		assert.match(E.fx("sheets", walk(ctx, "sheets", ["1.1"])), /acceptance _dAcc[\s\S]*avoid\("all"/);
		assert.match(E.fx("sheets", walk(ctx, "sheets", ["1.2"])), /love -2/);
		assert.match(E.fx("sheets", walk(ctx, "sheets", ["1.3"])), /DannyEvents\.forced\(\)/);
		assert.match(E.fx("sheets", walk(ctx, "sheets", ["1.4"])), /DannyEvents\.forced\(\)/);
		setStats(ctx, { love: 30, acc: 35 });
		assert.equal(walk(ctx, "sheets"), "2", "medium love: awkward silence");
		assert.match(E.fx("sheets", walk(ctx, "sheets", ["2.1"])), /DannyEvents\.accGain\(10\)/);
		assert.match(E.fx("sheets", walk(ctx, "sheets", ["2.4"])), /forced/);
	});

	it("Forced Acceptance: records the flag, takes 150 acceptance and 3 love, then halves acceptance gains", () => {
		const ctx = load({ love: 10, acc: 20 });
		const E = ctx.DannyEvents;
		assert.equal(E.accGain(5), 5);
		E.forced();
		const s = ctx.State.variables.dannyEv;
		assert.ok(s.forcedAcceptance);
		assert.equal(s.forcedCount, 1);
		assert.equal(ctx.C.npc.Danny.acceptance, 50);
		assert.equal(ctx.C.npc.Danny.love, 7);
		assert.equal(E.accGain(5), 3);
		assert.equal(E.accGain(10), 5);
		E.forced();
		assert.equal(ctx.C.npc.Danny.acceptance, 0, "clamped at 0");
	});

	it("aftermath: queued by an accident, fires an hour later the same day or the next morning, once", () => {
		const ctx = load({ time: { hour: 9, minute: 10 } });
		const E = ctx.DannyEvents;
		E.accident();
		assert.equal(ctx.State.variables.dannyAccidentKnown, 1);
		assert.equal(E.available(E.event("aftermath"), "hallways"), false, "same hour");
		atTime(ctx, 10, 0);
		assert.equal(E.available(E.event("aftermath"), "hallways"), true);
		assert.equal(E.pick("hallways", () => 0.5).id, "aftermath", "takes priority");
		atTime(ctx, 9, 0, { days: 11 });
		assert.equal(E.available(E.event("aftermath"), "hallways"), true, "next morning");
		atTime(ctx, 12, 0, { days: 11 });
		assert.equal(E.available(E.event("aftermath"), "hallways"), false, "expired by next noon");
		atTime(ctx, 9, 0, { days: 11 });
		E.begin("aftermath", "Hallways");
		assert.equal(ctx.State.variables.dannyEv.accident, undefined);
		ctx.Time.days = 12;
		assert.equal(E.available(E.event("aftermath"), "hallways"), false);
	});

	it("aftermath: space or quiet help at moderate love raises acceptance; early 'wear protection' at ~10% acceptance and low love fails the arc", () => {
		const ctx = load({ love: 30, acc: 20 });
		const E = ctx.DannyEvents;
		assert.match(E.fx("aftermath", walk(ctx, "aftermath", ["1"])), /accGain\(5\)/);
		assert.match(E.fx("aftermath", walk(ctx, "aftermath", ["2"])), /accGain\(10\)/);
		setStats(ctx, { love: 10, acc: 10 });
		assert.equal(walk(ctx, "aftermath", ["4"]), "4.1");
		assert.match(E.fx("aftermath", "4.1"), /forced/);
		setStats(ctx, { love: 60, acc: 50 });
		assert.equal(walk(ctx, "aftermath", ["4"]), "4.2");
		assert.doesNotMatch(E.fx("aftermath", "4.2"), /forced/);
	});

	it("library: low continence makes Danny leave mid-conversation; following uninvited at low love empties the library for days", () => {
		const ctx = load({ love: 20, cont: 20, time: { hour: 8, minute: 0 } });
		const E = ctx.DannyEvents;
		assert.equal(walk(ctx, "library", ["1"], 10), "10");
		assert.equal(walk(ctx, "library", ["1"], 90), "1", "good roll: stays");
		const k = walk(ctx, "library", ["1", "10.2"], 10);
		assert.equal(k, "10.2.1");
		assert.match(E.fx("library", k), /avoid\("library", 72\)/);
		E.avoid("library", 72);
		ctx.Time.days = 11;
		assert.equal(E.available(E.event("library"), "library"), false, "avoiding the next day");
		ctx.Time.days = 13;
		assert.equal(E.available(E.event("library"), "library"), true, "back after three days");
	});

	it("library bathroom return: very low continence plus a bad roll is an accident; obvious questions at low love avoid the library", () => {
		const ctx = load({ love: 20, cont: 10, acc: 10, time: { hour: 8, minute: 0 } });
		const E = ctx.DannyEvents;
		assert.equal(walk(ctx, "library", ["1", "10.1"], 10), "11");
		assert.match(E.fx("library", "11"), /accident/);
		assert.match(E.fx("library", walk(ctx, "library", ["1", "10.1", "11.4"], 10)), /avoid\("library", 72\)/);
		setStats(ctx, { cont: 20 });
		assert.equal(walk(ctx, "library", ["1", "10.1"], 10), "12", "not very low: normal return");
	});

	it("library: careful 'timing' hint only once acceptance is rising and love is high", () => {
		const ctx = load({ love: 50, acc: 45 });
		assert.equal(walk(ctx, "library", ["3"]), "3.1");
		assert.match(ctx.DannyEvents.text("library", "3.1"), /careful with timing/);
		setStats(ctx, { acc: 20 });
		assert.equal(walk(ctx, "library", ["3"]), "3.2");
	});

	it("hallway: low-love comment on the timing makes Danny change routes, suppressing hallway, stairwell and toilets", () => {
		const ctx = load({ love: 10 });
		const E = ctx.DannyEvents;
		const k = walk(ctx, "hallway", ["5"]);
		assert.equal(k, "5.1");
		assert.match(E.fx("hallway", k), /avoid\("route", 72\)/);
		E.avoid("route", 72);
		atTime(ctx, 7, 45, { days: 11 });
		assert.equal(E.available(E.event("hallway"), "hallways"), false);
		assert.equal(E.available(E.event("stairwell"), "schoolFront"), false);
		atTime(ctx, 7, 50, { days: 11 });
		assert.equal(E.available(E.event("toilets"), "toilets"), false);
		setStats(ctx, { love: 20, cont: 20 });
		assert.equal(walk(ctx, "hallway", ["2"]), "2.1", "love 20 + low continence: diverts to the bathroom");
	});

	it("toilets: 'Long morning?' lands only past the low teens", () => {
		const ctx = load({ love: 12 });
		assert.equal(walk(ctx, "toilets", ["2"]), "2.2");
		setStats(ctx, { love: 13 });
		assert.equal(walk(ctx, "toilets", ["2"]), "2.1");
	});

	it("science seat: taken seat, Danny's interjection, status-scaled asking, defiant/submissive options", () => {
		const ctx = load({ love: 30, cont: 50, vars: { cool: 400 } });
		const E = ctx.DannyEvents;
		assert.equal(walk(ctx, "scienceSeat", [], 50), "10", "roll 50: seat free");
		assert.equal(walk(ctx, "scienceSeat", [], 30), "21", "roll 30, love 30: Danny interjects");
		setStats(ctx, { love: 10 });
		assert.equal(walk(ctx, "scienceSeat", [], 30), "20");
		assert.equal(walk(ctx, "scienceSeat", ["22"], 30), "22.1", "high status: student moves");
		ctx.State.variables.cool = 0;
		assert.equal(walk(ctx, "scienceSeat", ["22"], 30), "22.2", "low status: refusal");
		const opts = () => E.options("scienceSeat", "20").map(o => o.to);
		ctx.State.variables.submissive = 800;
		walk(ctx, "scienceSeat", [], 30);
		assert.ok(opts().includes("23") && !opts().includes("24"));
		ctx.State.variables.submissive = 1200;
		assert.ok(opts().includes("24") && !opts().includes("23"));
	});

	it("science seat continence check: low continence restless, very low plus bad roll is an accident with an after-class choice", () => {
		const ctx = load({ love: 30, cont: 25 });
		const E = ctx.DannyEvents;
		assert.equal(walk(ctx, "scienceSeat", ["30"], 50), "32");
		setStats(ctx, { cont: 8 });
		assert.equal(walk(ctx, "scienceSeat", ["30"], 20), "41");
		assert.match(E.fx("scienceSeat", "40"), /accident/);
		assert.match(E.fx("scienceSeat", walk(ctx, "scienceSeat", ["30", "41.1"], 20)), /accGain\(10\)/);
		setStats(ctx, { love: 30, acc: 10 });
		assert.match(E.fx("scienceSeat", walk(ctx, "scienceSeat", ["30", "41.4"], 20)), /forced/);
		setStats(ctx, { love: 10 });
		assert.equal(walk(ctx, "scienceSeat", ["30"], 20), "40", "love too low to follow up: no after-class choice");
		assert.equal(
			E.options("scienceSeat", "40")
				.map(o => o.to)
				.join(),
			"42"
		);
	});

	it("lab partner: covering smoothly helps, drawing attention hurts, high love collaborates", () => {
		const ctx = load({ love: 20, cont: 20 });
		const E = ctx.DannyEvents;
		assert.equal(walk(ctx, "scienceLab", [], 30), "1");
		assert.match(E.fx("scienceLab", walk(ctx, "scienceLab", ["1.1"], 30)), /love 2/);
		assert.match(E.fx("scienceLab", walk(ctx, "scienceLab", ["1.2"], 30)), /love -2/);
		setStats(ctx, { love: 45, cont: 50 });
		assert.equal(walk(ctx, "scienceLab", [], 30), "2");
	});

	it("breakfast: saving a seat or walking together only works at higher love and normal continence", () => {
		const ctx = load({ love: 20 });
		assert.equal(walk(ctx, "breakfast", ["1"]), "1.2");
		setStats(ctx, { love: 35 });
		assert.equal(walk(ctx, "breakfast", ["1"]), "1.1");
		assert.equal(walk(ctx, "breakfast", ["2"]), "2.1");
		setStats(ctx, { cont: 20 });
		assert.equal(walk(ctx, "breakfast", ["2"]), "2.2");
	});

	it("chores and common room: asking about sheets in front of others is shut down", () => {
		const ctx = load({ love: 30 });
		const E = ctx.DannyEvents;
		assert.match(E.fx("chores", walk(ctx, "chores", ["1.2"])), /acceptance -10/);
		setStats(ctx, { love: 30, cont: 50 });
		const k = walk(ctx, "commonroom", ["2.3"]);
		assert.match(E.fx("commonroom", k), /avoid\("orphanage", 3\)/);
	});

	it("rain bag: 'just in case' admission needs love; pushing stalls acceptance", () => {
		const ctx = load({ love: 20 });
		const E = ctx.DannyEvents;
		assert.equal(walk(ctx, "rainBag", ["1"]), "1.2");
		setStats(ctx, { love: 35 });
		assert.equal(walk(ctx, "rainBag", ["1"]), "1.1");
		assert.match(E.text("rainBag", "1.1"), /Just in case/);
		assert.match(E.fx("rainBag", walk(ctx, "rainBag", ["3"])), /acceptance -10/);
	});

	it("bleachers: low continence keeps it short; being photographed is a hesitant yes only at higher love", () => {
		const ctx = load({ love: 30, cont: 20, acc: 20 });
		assert.equal(walk(ctx, "bleachers"), "1");
		setStats(ctx, { cont: 50 });
		assert.equal(walk(ctx, "bleachers"), "3");
		assert.equal(walk(ctx, "bleachers", ["3.1"]), "3.1.2");
		setStats(ctx, { love: 45 });
		assert.equal(walk(ctx, "bleachers", ["3.1"]), "3.1.1");
	});

	it("canteen and studio: love gains through shared interest; pointed comments cost love", () => {
		const ctx = load({ love: 25, cont: 50 });
		const E = ctx.DannyEvents;
		assert.equal(walk(ctx, "canteen"), "2");
		assert.match(E.fx("canteen", walk(ctx, "canteen", ["2.3"])), /love -1/);
		setStats(ctx, { cont: 20 });
		assert.equal(walk(ctx, "canteen"), "1");
		setStats(ctx, { cont: 20 });
		assert.match(E.fx("studio", walk(ctx, "studio", ["1.1"], 10)), /love 2/);
		assert.match(E.fx("studio", walk(ctx, "studio", ["1.2"], 10)), /love -2/);
	});
});
