/* Danny room conversations: data-driven dialog engine.
 *
 * Trees live in game/ModLI/Danny/talk/topic-*.js and register themselves by pushing
 * { id, topic, title, src } onto window.DannyTalkData. src is a small script:
 *
 *   ## 1.2                         node key: a dotted path. "0" is the shared opening scene,
 *                                  "1".."5" answer the opening options, "1.2.1" is three deep.
 *   !fx <<npcincr Danny love 1>>   SugarCube markup run when the node is shown (stat changes).
 *   Text lines...                  SugarCube markup; a blank line starts a new paragraph.
 *   -> 1.2.1: Label                an option; append " ?? <TwineScript gate>" to show it only
 *                                  when the gate is true, e.g. "?? $science gte 400".
 *
 * A node without options ends the conversation with a link back to Danny's room.
 *
 * Text tokens: {he} {He} {him} {his} {His} {himself} use Danny's pronoun with the same rule as
 * <<nnpc_he "Danny">>; {nhe} {nHe} {nhim} {nhis} do the same for Niki and {bhe} {bHe} {bhim}
 * {bhis} for Bailey.
 */
(function () {
	"use strict";

	const RECENT_MAX = 4;
	const TOPICS = {
		school: "School and homework",
		photo: "Photography and Niki's studio",
		hobbies: "Hobbies and weekend plans",
		family: "Family and home",
	};

	window.DannyTalkData = window.DannyTalkData || [];

	function npcStat(name, stat) {
		try {
			const npc = typeof C !== "undefined" && C.npc ? C.npc[name] : null;
			const value = npc ? Number(npc[stat]) : 0;
			return Number.isFinite(value) ? value : 0;
		} catch (e) {
			return 0;
		}
	}

	window.dannyLove = () => npcStat("Danny", "love");
	window.dannyTrust = () => npcStat("Danny", "trust");
	window.dannyAcceptance = () => npcStat("Danny", "acceptance");
	window.dannyContinence = () => npcStat("Danny", "continence");
	window.npcLove = name => npcStat(name, "love");

	function pronounSet(name) {
		let male = false;
		try {
			male = typeof C !== "undefined" && C.npc && C.npc[name] && C.npc[name].pronoun === "m";
		} catch (e) {
			male = false;
		}
		return male ? { he: "he", him: "him", his: "his", himself: "himself" } : { he: "she", him: "her", his: "her", himself: "herself" };
	}

	const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

	function fillPronouns(text) {
		if (typeof text !== "string" || text.indexOf("{") < 0) return text;
		const sets = { "": pronounSet("Danny"), n: pronounSet("Niki"), b: pronounSet("Bailey") };
		return text.replace(/\{([nb]?)(he|He|him|Him|his|His|himself|Himself)\}/g, (m, who, word) => {
			const set = sets[who];
			const base = set[word.toLowerCase()];
			return word.charAt(0) === word.charAt(0).toUpperCase() ? cap(base) : base;
		});
	}

	/* Shorthand effect tokens for "!fx" lines. Each expands to the game's own stat widget plus its
	 * usual coloured feedback. Anything that is not a token is kept as raw SugarCube markup. */
	const FX = {
		"love+1": '<<npcincr Danny love 1>><<glove "Danny">>',
		"love+2": '<<npcincr Danny love 2>><<gglove "Danny">>',
		"love+3": '<<npcincr Danny love 3>><<ggglove "Danny">>',
		"love-1": '<<npcincr Danny love -1>><<llove "Danny">>',
		"love-2": '<<npcincr Danny love -2>><<lllove "Danny">>',
		"acceptance+": "<<npcincr Danny acceptance 5>><<gdannyacceptance>>",
		"stress-": "<<stress -6>><<lstress>>",
		"stress--": "<<stress -12>><<lstress>>",
		"stress+": "<<stress 6>><<gstress>>",
		"trauma-": "<<trauma -6>><<ltrauma>>",
		"control+": "<<control 5>><<gcontrol>>",
		"control++": "<<control 10>><<gcontrol>>",
	};

	function expandFx(line) {
		return line
			.split(/\s+/)
			.filter(Boolean)
			.map(tok => (FX[tok] !== undefined ? FX[tok] : tok))
			.join(" ");
	}

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
				cur = { paras: [], fx: "", o: [] };
				nodes[head[1]] = cur;
				continue;
			}
			if (!cur) continue;
			if (line.startsWith("!fx ")) {
				const body = line.slice(4).trim();
				const tokens = body.split(/\s+/);
				cur.fx += tokens.every(tok => FX[tok] !== undefined) ? expandFx(body) : body;
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
			if (!n.fx) delete n.fx;
		}
		return nodes;
	}

	const DannyTalk = {
		parse,
		FX,

		RECENT_MAX,
		TOPICS,
		gateErrors: [],

		trees() {
			const out = {};
			for (const tree of window.DannyTalkData) {
				if (!tree || !tree.id) continue;
				if (!tree.nodes && typeof tree.src === "string") tree.nodes = parse(tree.src);
				out[tree.id] = tree;
			}
			return out;
		},

		tree(id) {
			return this.trees()[id] || null;
		},

		treesInTopic(topic) {
			return Object.values(this.trees()).filter(t => t.topic === topic);
		},

		/* Save compatibility: older saves have no $dannyTalkRecent, or may hold ids of trees that
		 * no longer exist. Keep only known ids, newest last, at most RECENT_MAX. */
		ensureState() {
			const V = State.variables;
			const known = this.trees();
			if (!Array.isArray(V.dannyTalkRecent)) V.dannyTalkRecent = [];
			V.dannyTalkRecent = V.dannyTalkRecent.filter(id => typeof id === "string" && known[id]).slice(-RECENT_MAX);
			return V.dannyTalkRecent;
		},

		/* Random topic, then a random tree in it that is not among the last RECENT_MAX used. */
		pick(rng) {
			const rand = typeof rng === "function" ? rng : Math.random;
			const recent = this.ensureState();
			const fresh = t => !recent.includes(t.id);
			let topics = Object.keys(TOPICS).filter(topic => this.treesInTopic(topic).some(fresh));
			if (topics.length === 0) topics = Object.keys(TOPICS).filter(topic => this.treesInTopic(topic).length > 0);
			if (topics.length === 0) return null;
			const topic = topics[Math.min(topics.length - 1, Math.floor(rand() * topics.length))];
			let pool = this.treesInTopic(topic).filter(fresh);
			if (pool.length === 0) pool = this.treesInTopic(topic);
			const tree = pool[Math.min(pool.length - 1, Math.floor(rand() * pool.length))];
			recent.push(tree.id);
			State.variables.dannyTalkRecent = recent.slice(-RECENT_MAX);
			return tree;
		},

		start(rng) {
			const tree = this.pick(rng);
			State.variables.dannyTalkTree = tree ? tree.id : null;
			State.variables.dannyTalkNode = tree ? "0" : null;
			return tree;
		},

		finish() {
			delete State.variables.dannyTalkTree;
			delete State.variables.dannyTalkNode;
		},

		node(treeId, key) {
			const tree = this.tree(treeId);
			if (!tree || !tree.nodes) return null;
			const node = tree.nodes[key];
			return node || null;
		},

		text(treeId, key) {
			const node = this.node(treeId, key);
			return node ? fillPronouns(node.t) : "";
		},

		fx(treeId, key) {
			const node = this.node(treeId, key);
			return node && node.fx ? node.fx : "";
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

		options(treeId, key) {
			const node = this.node(treeId, key);
			if (!node || !Array.isArray(node.o)) return [];
			return node.o.filter(o => this.gate(o[2])).map(o => ({ label: fillPronouns(o[0]), to: o[1] }));
		},

		topicTitle(treeId) {
			const tree = this.tree(treeId);
			return tree ? TOPICS[tree.topic] || "" : "";
		},

		fillPronouns,
	};

	window.DannyTalk = DannyTalk;
})();
