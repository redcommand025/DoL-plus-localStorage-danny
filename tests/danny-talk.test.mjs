/**
 * Danny room Talk system: static graph validation and engine behaviour (node vm, no browser).
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const talkDir = join(root, "game/ModLI/Danny/talk");
const read = rel => readFileSync(join(root, rel), "utf8");
const TOPIC_FILES = ["engine.js", "topic-school.js", "topic-photo.js", "topic-hobbies.js", "topic-family.js"];

function load({ pronoun = "m", variables = {} } = {}) {
	const State = { variables: { ...variables } };
	const npc = {
		Danny: { love: 0, trust: 0, acceptance: 200, continence: 3000, pronoun },
		Niki: { love: 0, pronoun: "f" },
		Bailey: { love: 0, pronoun: "m" },
		Robin: { love: 0, pronoun: "m" },
	};
	const ctx = { console, Math, State, C: { npc } };
	ctx.window = ctx;
	ctx.Scripting = {
		evalTwineScript(expr) {
			const js = String(expr)
				.replace(/\$(\w+)/g, "State.variables.$1")
				.replace(/\bgte\b/g, ">=")
				.replace(/\blte\b/g, "<=")
				.replace(/\bgt\b/g, ">")
				.replace(/\blt\b/g, "<")
				.replace(/\band\b/g, "&&")
				.replace(/\bor\b/g, "||")
				.replace(/\bis\b/g, "===");
			return vm.runInContext(js, ctx);
		},
	};
	vm.createContext(ctx);
	for (const f of TOPIC_FILES) vm.runInContext(readFileSync(join(talkDir, f), "utf8"), ctx, { filename: f });
	return ctx;
}

function gameSource() {
	let out = "";
	const walk = dir => {
		for (const name of readdirSync(dir)) {
			const full = join(dir, name);
			if (statSync(full).isDirectory()) walk(full);
			else if (/\.(twee|js)$/.test(name)) out += readFileSync(full, "utf8") + "\n";
		}
	};
	walk(join(root, "game"));
	return out;
}

const depthOf = key => (key === "0" ? 0 : key.split(".").length);

describe("Danny Talk static graph", () => {
	const ctx = load();
	const trees = Object.values(ctx.DannyTalk.trees());

	it("has four topics with at least three distinct trees each", () => {
		assert.deepEqual(Object.keys(ctx.DannyTalk.TOPICS).sort(), ["family", "hobbies", "photo", "school"]);
		for (const topic of Object.keys(ctx.DannyTalk.TOPICS)) assert.ok(ctx.DannyTalk.treesInTopic(topic).length >= 3, topic);
		assert.equal(new Set(trees.map(t => t.id)).size, trees.length);
	});

	it("every tree has an opening with 3-5 options, unique keys, no orphans, and only child links", () => {
		for (const tree of trees) {
			const heads = [...tree.src.matchAll(/^##\s*(\S+)\s*$/gm)].map(m => m[1]);
			assert.deepEqual(
				heads.filter((h, i) => heads.indexOf(h) !== i),
				[],
				tree.id + " duplicate node keys"
			);
			const n = tree.nodes;
			assert.ok(n["0"], tree.id + " opening");
			assert.ok(n["0"].o.length >= 3 && n["0"].o.length <= 5, tree.id + " opening options " + n["0"].o.length);
			assert.ok(n["0"].o.filter(o => !o[2]).length >= 3, tree.id + " at least 3 ungated opening options");
			for (const [key, node] of Object.entries(n)) {
				assert.ok(node.t && node.t.length > 40, tree.id + " " + key + " has text");
				for (const [label, to] of node.o) {
					assert.ok(label && label.length > 2, tree.id + " " + key + " label");
					assert.ok(n[to], tree.id + " " + key + " -> missing " + to);
					assert.ok(key === "0" ? /^\d+$/.test(to) : to.startsWith(key + "."), tree.id + " " + key + " -> " + to + " is not a child");
				}
				if (key !== "0") {
					const parents = Object.entries(n).filter(([, p]) => p.o.some(o => o[1] === key));
					assert.equal(parents.length, 1, tree.id + " " + key + " should have exactly one parent");
				}
			}
		}
	});

	it("no dead ends: every node with options keeps at least two ungated choices; others end the talk", () => {
		for (const tree of trees)
			for (const [key, node] of Object.entries(tree.nodes))
				if (node.o.length) assert.ok(node.o.filter(o => !o[2]).length >= 2, tree.id + " " + key + " multi-choice without gates");
		const conv = read("game/ModLI/Danny/danny.twee");
		assert.match(conv, /:: Danny Conversation\n[\s\S]*?<<link \[\[Back to Danny's room\|Danny Room\]\]>><<run DannyTalk\.finish\(\)>><<\/link>>/);
	});

	it("each tree reaches ten exchanges in at least one branch, and every opening option branches further", () => {
		for (const tree of trees) {
			const keys = Object.keys(tree.nodes);
			assert.ok(Math.max(...keys.map(depthOf)) >= 10, tree.id + " max depth");
			const ungatedOpeners = tree.nodes["0"].o.filter(o => !o[2]).map(o => o[1]);
			for (const k of ungatedOpeners) assert.ok(tree.nodes[k].o.length >= 2, tree.id + " opener " + k + " branches");
		}
	});

	it("gates and in-text conditions only use defined variables and known helpers", () => {
		const src = gameSource();
		// $dannyAccidentKnown is the user's own Danny flag: their room, Small talk and Outings already gate on it.
		const userFlags = new Set(["dannyAccidentKnown"]);
		assert.match(read("game/ModLI/Danny/danny.twee"), /<<if \$dannyAccidentKnown is 1>>/);
		const helpers = new Set(["dannyLove", "dannyTrust", "dannyAcceptance", "dannyContinence", "npcLove"]);
		const npcList = /setup\.NPCNameList = \[([^\]]+)\]/.exec(src)[1];
		const exprs = [];
		for (const tree of trees)
			for (const node of Object.values(tree.nodes)) {
				for (const o of node.o) if (o[2]) exprs.push(o[2]);
				for (const m of node.t.matchAll(/<<if (.+?)>>/g)) exprs.push(m[1]);
			}
		assert.ok(exprs.length >= 20, "plenty of gates/variants: " + exprs.length);
		for (const e of exprs) {
			for (const [, v] of e.matchAll(/\$(\w+)/g))
				assert.ok(
					userFlags.has(v) || new RegExp("(set \\$" + v + "\\b|V\\." + v + "\\s*=|\\$" + v + " to)").test(src),
					"undefined variable $" + v + " in gate " + e
				);
			for (const [, fn] of e.matchAll(/([A-Za-z_]\w*)\(/g)) assert.ok(helpers.has(fn), "unknown helper " + fn + " in " + e);
			for (const [, who] of e.matchAll(/npcLove\("([^"]+)"\)/g)) assert.ok(npcList.includes('"' + who + '"'), "unknown NPC " + who);
		}
		for (const fn of helpers) assert.equal(typeof ctx[fn], "function", fn);
	});

	it("effects only use the game's stat widgets, small amounts, and npcincr love/acceptance", () => {
		const allowed = new Set([
			"npcincr",
			"glove",
			"gglove",
			"ggglove",
			"llove",
			"lllove",
			"gdannyacceptance",
			"stress",
			"lstress",
			"gstress",
			"trauma",
			"ltrauma",
			"control",
			"gcontrol",
		]);
		let count = 0;
		for (const tree of trees)
			for (const [key, node] of Object.entries(tree.nodes)) {
				if (!node.fx) continue;
				count++;
				for (const [, name, args] of node.fx.matchAll(/<<(\w+)([^>]*)>>/g)) {
					assert.ok(allowed.has(name), tree.id + " " + key + " uses " + name);
					if (name === "npcincr") {
						const m = /^\s+Danny (love|acceptance) (-?\d+)$/.exec(args);
						assert.ok(m, tree.id + " " + key + " npcincr " + args);
						assert.ok(m[1] === "acceptance" ? Number(m[2]) <= 5 : Math.abs(Number(m[2])) <= 3, tree.id + " " + key + " small change");
					}
					if (["stress", "trauma", "control"].includes(name)) assert.ok(Math.abs(Number(args)) <= 12, tree.id + " " + key + " small " + name);
				}
			}
		assert.ok(count > 300, "most nodes change something: " + count);
		const widgets = read("game/ModLI/Danny/danny.twee");
		assert.match(widgets, /<<widget "gdannyacceptance">>/);
	});

	it("content stays non-sexual and age-appropriate", () => {
		const banned =
			/\b(kiss\w*|flirt\w*|lust\w*|sexy|sexual|naked|nude|undress\w*|strip\w*|romantic|romance|boyfriend|girlfriend|crush|date night|make out|bed together|seduc\w*|aroused)\b/i;
		for (const tree of trees)
			for (const [key, node] of Object.entries(tree.nodes)) {
				assert.doesNotMatch(node.t, banned, tree.id + " " + key);
				for (const o of node.o) assert.doesNotMatch(o[0], banned, tree.id + " " + key + " label");
				assert.doesNotMatch(node.fx || "", /lust/, tree.id + " " + key);
			}
		// Continence references only appear behind $dannyAccidentKnown.
		for (const tree of trees)
			for (const [key, node] of Object.entries(tree.nodes)) {
				const plain = node.t.replace(/<<if [^>]*\$dannyAccidentKnown is 1[^>]*>>[\s\S]*?<<\/if>>/g, "");
				assert.doesNotMatch(plain, /\b(diapers?|nappy|nappies|wet the bed|bladder|continence|leak\w*)\b/i, tree.id + " " + key);
			}
	});

	it("pronoun tokens resolve for Danny, Niki and Bailey, and none are left over", () => {
		const he = load({ pronoun: "m" });
		const she = load({ pronoun: "f" });
		for (const tree of Object.values(he.DannyTalk.trees()))
			for (const key of Object.keys(tree.nodes)) {
				const a = he.DannyTalk.text(tree.id, key);
				assert.doesNotMatch(a, /\{[nb]?(he|He|him|Him|his|His|himself|Himself)\}/, tree.id + " " + key);
				assert.doesNotMatch(a, /\{\w+\}/, tree.id + " " + key + " unknown token");
			}
		assert.equal(he.DannyTalk.fillPronouns("{He} lost {his} pen; {nhe} found it."), "He lost his pen; she found it.");
		assert.equal(she.DannyTalk.fillPronouns("{He} sat by {himself}."), "She sat by herself.");
	});
});

describe("Danny Talk selection", () => {
	it("picks random topics and trees, never repeating any of the last four", () => {
		const ctx = load();
		let seed = 12345;
		const rng = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
		const seen = new Set();
		const topics = new Set();
		const history = [];
		for (let i = 0; i < 400; i++) {
			const tree = ctx.DannyTalk.start(rng);
			assert.ok(tree, "picked");
			assert.ok(!history.slice(-4).includes(tree.id), "repeat of " + tree.id + " within 4: " + history.slice(-4));
			history.push(tree.id);
			seen.add(tree.id);
			topics.add(tree.topic);
			assert.equal(ctx.State.variables.dannyTalkNode, "0");
			assert.equal(ctx.State.variables.dannyTalkTree, tree.id);
			assert.ok(ctx.State.variables.dannyTalkRecent.length <= 4);
		}
		assert.equal(seen.size, Object.keys(ctx.DannyTalk.trees()).length);
		assert.equal(topics.size, 4);
	});

	it("topic choice is roughly uniform and tree choice uses the RNG", () => {
		const ctx = load();
		const counts = {};
		for (let i = 0; i < 2000; i++) {
			const t = ctx.DannyTalk.start(Math.random);
			counts[t.topic] = (counts[t.topic] || 0) + 1;
		}
		for (const c of Object.values(counts)) assert.ok(c > 350 && c < 650, JSON.stringify(counts));
		const a = load();
		a.State.variables.dannyTalkRecent = [];
		const first = a.DannyTalk.pick(() => 0);
		const b = load();
		const last = b.DannyTalk.pick(() => 0.999);
		assert.notEqual(first.id, last.id);
	});

	it("is save compatible: missing, malformed or stale recent lists are repaired", () => {
		for (const bad of [
			undefined,
			null,
			"school.homework",
			7,
			{ a: 1 },
			["gone.tree", 5, "school.homework", "school.exam", "photo.shift", "family.camera", "hobbies.chess"],
		]) {
			const ctx = load({ variables: bad === undefined ? {} : { dannyTalkRecent: bad } });
			const recent = ctx.DannyTalk.ensureState();
			assert.ok(Array.isArray(recent));
			assert.ok(recent.length <= 4);
			assert.ok(recent.every(id => ctx.DannyTalk.tree(id)));
			assert.ok(ctx.DannyTalk.start(Math.random));
		}
		const ctx = load();
		ctx.State.variables.dannyTalkTree = "gone.tree";
		ctx.State.variables.dannyTalkNode = "9.9";
		assert.equal(ctx.DannyTalk.node("gone.tree", "9.9"), null);
		assert.equal(ctx.DannyTalk.options("gone.tree", "9.9").length, 0);
		ctx.DannyTalk.finish();
		assert.equal(ctx.State.variables.dannyTalkTree, undefined);
	});

	it("gated options appear only when their stat requirement is met", () => {
		const low = load({ variables: { science: 0 } });
		const high = load({ variables: { science: 1000 } });
		const lowOpts = low.DannyTalk.options("school.homework", "0").map(o => o.to);
		const highOpts = high.DannyTalk.options("school.homework", "0").map(o => o.to);
		assert.ok(!lowOpts.includes("5"));
		assert.ok(highOpts.includes("5"));
		high.C.npc.Danny.love = 70;
		assert.ok(high.DannyTalk.options("family.camera", "0").some(o => o.to === "5"));
		assert.ok(!low.DannyTalk.options("family.camera", "0").some(o => o.to === "5"));
		assert.equal(low.DannyTalk.gateErrors.length, 0, JSON.stringify(low.DannyTalk.gateErrors));
	});
});

describe("Danny Talk wiring", () => {
	const danny = read("game/ModLI/Danny/danny.twee");
	it("room Talk starts a conversation only in Danny's room slot and keeps the user's Small talk menu", () => {
		assert.match(danny, /<<if getDannyLocation\(\) is "room">>\s*<<link \[\[Talk\|Danny Conversation\]\]>><<run DannyTalk\.start\(\)>><<\/link>>/);
		assert.match(danny, /<<link \[\[Small talk\|Danny Talk\]\]>>/);
		for (const p of [
			"Danny Talk",
			"Danny Talk Day",
			"Danny Talk Work",
			"Danny Talk Them",
			"Danny Talk Continence",
			"Danny Talk Accidents",
			"Danny Talk Breakdown",
			"Danny Talk Complain",
		])
			assert.match(danny, new RegExp("^:: " + p + "$", "m"), p);
		assert.match(read("game/ModLI/Danny/dialogues.js"), /window\.dannyDialogues/);
	});
	it("conversation passage renders node text, effects, numbered options and passes time", () => {
		assert.match(danny, /<<print DannyTalk\.text\(\$dannyTalkTree, \$dannyTalkNode\)>>/);
		assert.match(danny, /<<print DannyTalk\.fx\(\$dannyTalkTree, \$dannyTalkNode\)>>/);
		assert.match(danny, /<<print \(_dtI \+ 1\) \+ "\.">> <<link _dtOpts\[_dtI\]\.label "Danny Conversation">>/);
		assert.match(danny, /<<if \$dannyTalkNode is "0">><<pass 1>><<else>><<pass 2>><<\/if>>/);
	});
});
