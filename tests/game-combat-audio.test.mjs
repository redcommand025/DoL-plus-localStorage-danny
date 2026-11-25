import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = rel => readFileSync(join(root, rel), "utf8");

function load(vars = {}) {
	const V = {
		options: {},
		passage: "Streets",
		location: "town",
		NPCList: [],
		player: { sex: "f", gender_posture: "f", penisExist: false, vaginaExist: true },
		...vars,
	};
	const window = { V, console };
	const context = { window, V, console, Math };
	context.globalThis = context;
	vm.createContext(context);
	vm.runInContext(read("game/03-JavaScript/game-combat-audio.js"), context, { filename: "game-combat-audio.js" });
	return context.window;
}

describe("combat audio port", () => {
	it("the audio manifest covers every file and none are LFS pointers", () => {
		const out = execFileSync("python3", ["devTools/check-audio.py"], { cwd: root, encoding: "utf8" });
		assert.match(out, /Audio OK: 306 files/);
		assert.ok(existsSync(join(root, "audio/bgs/sex/slow_normal1.mp3")));
		assert.ok(existsSync(join(root, "audio/bgv/f_voice1/normal/breath/breath-01.mp3")));
		assert.ok(existsSync(join(root, "audio/ve/npc_m/orgasm/orgasm-01.mp3")));
		assert.ok(existsSync(join(root, "audio/sfx/ejaculation/squirt1.wav")));
		assert.ok(existsSync(join(root, "audio/bgm/nnpc/Luchifen/Ruskerdax - Pondering the Cosmos.mp3")));
	});

	it("defaults match X-Change and are filled in for old saves", () => {
		const w = load();
		w.GameCombatAudio.ensureDefaults();
		assert.equal(w.V.options.voiceoverAudio, 1);
		assert.equal(w.V.options.npcVoiceoverAudio, 1);
		assert.equal(w.V.options.bgs_volume, 1);
		assert.equal(w.V.options.voice_volume, 1);
		assert.equal(w.V.options.postureAffectsVoice, 0);
		assert.ok(w.playerVoiceIsFemale());
		assert.equal(w.playerVoiceIsMale(), false);
		assert.equal(w.npcVoiceAllowed("f"), true);
	});

	it("never plays combat audio in Danny-related scenes", () => {
		const blockedPassage = load({ passage: "Danny Room" });
		assert.equal(blockedPassage.GameCombatAudio.blocked(), true);
		const blockedNpc = load({ passage: "Streets", NPCList: [{ fullDescription: "Danny", description: "Danny" }] });
		assert.equal(blockedNpc.GameCombatAudio.blocked(), true);
		const ok = load({ passage: "Streets", location: "town", NPCList: [{ fullDescription: "a tall man" }] });
		assert.equal(ok.GameCombatAudio.blocked(), false);
		assert.match(read("game/base-system/audio/audio.twee"), /update-combat-audio/);
		assert.match(read("game/base-system/orgasm.twee"), /orgasm-voice/);
		assert.match(read("game/base-combat/ejaculation/ejaculation.twee"), /npc-orgasm-voice/);
	});
	it("guards sex-sound so a missing portalPanties object cannot crash the audio widgets", () => {
		const twee = read("game/base-system/audio/combat-audio.twee");
		const sexSound = twee.split('<<widget "sex-sound">>')[1].split("<</widget>>")[0];
		assert.doesNotMatch(sexSound, /<<if \$portalPanties\.state/);
		assert.match(sexSound, /<<if \$portalPanties and \$portalPanties\.state and \(\$portalPanties\.state\.vagina or \$portalPanties\.state\.anus\)>>/);
		const updateCombat = twee.split('<<widget "update-combat-audio">>')[1].split("<</widget>>")[0];
		assert.match(updateCombat, /\$portalPanties and \$portalPanties\.state and \$portalPanties\.state\.vagina/);
		assert.match(updateCombat, /\$portalPanties and \$portalPanties\.state and \$portalPanties\.state\.mouth/);

		const safe = p => !!(p && p.state && (p.state.vagina || p.state.anus));
		const unsafe = p => !!(p.state.vagina || p.state.anus);
		assert.throws(() => unsafe(undefined), /undefined/);
		assert.throws(() => unsafe({}), /undefined/);
		assert.equal(safe(undefined), false);
		assert.equal(safe({}), false);
		assert.equal(safe({ state: {} }), false);
		assert.equal(safe({ state: { vagina: { timer: 12 } } }), true);
		assert.equal(safe({ state: { anus: { timer: 8 } } }), true);
	});
});
