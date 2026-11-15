/* Combat and voice-over helpers, ported from X-Change (koztools voice routing + settings defaults).
 * GameCombatAudio.blocked() is true in Danny-related scenes; update-combat-audio stops loops there.
 */
(function () {
	"use strict";

	const DEFAULTS = {
		voiceoverAudio: 1,
		npcVoiceoverAudio: 1,
		postureAffectsVoice: 0,
		f_voice: "v1",
		bgs_volume: 1,
		voice_volume: 1,
		nonCombatMoanVolume: 1,
	};

	function playerIsHerm() {
		if (typeof window.playerIsHerm === "function" && window.playerIsHerm !== playerIsHerm) {
			try {
				return !!window.playerIsHerm();
			} catch (e) {}
		}
		const p = window.V && V.player;
		return !!(p && p.penisExist && p.vaginaExist);
	}

	function playerVoiceCategory() {
		if (playerIsHerm()) return "herm";
		const p = window.V && V.player;
		const sex = p && p.sex;
		const posture = p && p.gender_posture;
		const usePosture = !!(V.options && V.options.postureAffectsVoice);
		if (sex === "m") return usePosture && posture === "f" ? "sissy" : "male";
		if (sex === "f") return usePosture && posture === "m" ? "butch" : "female";
		return "male";
	}

	function defaultVoiceConfig() {
		const fv = (V.options && V.options.f_voice) || "v1";
		return {
			male: { voice: "m", enabled: true, npc: "all" },
			female: { voice: fv, enabled: true, npc: "all" },
			sissy: { voice: fv, enabled: true, npc: "all" },
			butch: { voice: "m", enabled: true, npc: "all" },
			herm: { voice: "v1", enabled: true, npc: "all" },
		};
	}

	function ensureVoiceConfig() {
		if (!V.options) return;
		const def = defaultVoiceConfig();
		const cfg = V.options.voiceConfig;
		if (!cfg || typeof cfg !== "object" || Array.isArray(cfg)) {
			V.options.voiceConfig = def;
			return;
		}
		for (const cat of Object.keys(def)) {
			const d = def[cat];
			const c = cfg[cat];
			if (!c || typeof c !== "object" || Array.isArray(c)) {
				cfg[cat] = Object.assign({}, d);
				continue;
			}
			if (c.voice === undefined) c.voice = d.voice;
			if (c.enabled === undefined) c.enabled = d.enabled;
			if (c.npc === undefined) c.npc = d.npc;
		}
	}

	function playerVoiceSettings() {
		ensureVoiceConfig();
		const cat = playerVoiceCategory();
		const def = defaultVoiceConfig()[cat];
		const cur = (V.options && V.options.voiceConfig && V.options.voiceConfig[cat]) || {};
		return {
			category: cat,
			voice: cur.voice || def.voice,
			enabled: cur.enabled !== false,
			npc: cur.npc || def.npc,
		};
	}

	function playerVoiceIsFemale() {
		const s = playerVoiceSettings();
		return s.enabled && (s.voice === "v1" || s.voice === "v2");
	}

	function playerVoiceIsMale() {
		const s = playerVoiceSettings();
		return s.enabled && s.voice === "m";
	}

	function npcVoiceAllowed(pronoun) {
		if (!V.options || V.options.npcVoiceoverAudio === 0) return false;
		const npc = playerVoiceSettings().npc;
		if (npc === "off") return false;
		if (npc === "m") return pronoun === "m";
		if (npc === "f") return pronoun === "f";
		return true;
	}

	function ensureDefaults() {
		const o = window.V && V.options;
		if (!o) return;
		for (const [key, value] of Object.entries(DEFAULTS)) if (o[key] === undefined) o[key] = value;
		ensureVoiceConfig();
	}

	function blocked() {
		if (!window.V) return true;
		const passage = String(V.passage || (window.SugarCube && SugarCube.State && SugarCube.State.passage) || "");
		if (/danny/i.test(passage)) return true;
		const loc = String(V.location || "");
		if (/danny/i.test(loc)) return true;
		const list = V.NPCList || [];
		for (const n of list) {
			if (!n) continue;
			const blob = `${n.fullDescription || ""} ${n.description || ""} ${n.fullName || ""} ${n.name || ""}`;
			if (/\bdanny\b/i.test(blob)) return true;
		}
		if (V.dannyScene || V.eventName === "danny" || (V.dannyEv && V.dannyEv.active)) return true;
		return false;
	}

	window.playerVoiceCategory = playerVoiceCategory;
	window.defaultVoiceConfig = defaultVoiceConfig;
	window.ensureVoiceConfig = ensureVoiceConfig;
	window.playerVoiceSettings = playerVoiceSettings;
	window.playerVoiceIsFemale = playerVoiceIsFemale;
	window.playerVoiceIsMale = playerVoiceIsMale;
	window.npcVoiceAllowed = npcVoiceAllowed;
	if (typeof window.playerIsHerm !== "function") window.playerIsHerm = playerIsHerm;

	window.GameCombatAudio = Object.freeze({ ensureDefaults, blocked, DEFAULTS });
})();
