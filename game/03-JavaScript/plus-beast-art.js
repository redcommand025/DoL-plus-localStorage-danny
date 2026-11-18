/**
 * Combat-sprite fallbacks for New World beast types that have no unique art.
 * Never change $NPCList[n].type; only remap the type used to build image paths.
 * Licensed with the New World port (CC BY-NC-SA 4.0).
 */
(function () {
	"use strict";

	/** Types that already have unique combat/sex sprites in this game. */
	const UNIQUE_ART = new Set([
		"bear",
		"boar",
		"bull",
		"cat",
		"centaur",
		"cow",
		"creature",
		"dog",
		"dolphin",
		"fox",
		"harpy",
		"hawk",
		"horse",
		"lizard",
		"pig",
		"wolf",
		"spider",
		"snake",
	]);

	/**
	 * Base-type fallbacks when a type has no unique combat sprite.
	 * Chosen to keep a similar silhouette: hooves, wings, scales, or small mammals.
	 */
	const FALLBACK = {
		sheep: "horse",
		deer: "horse",
		bee: "hawk",
		wasp: "hawk",
		dragon: "lizard",
		raccoon: "fox",
		frog: "lizard",
		rabbit: "fox",
		ant: "spider",
		rat: "fox",
	};

	function baseType(type) {
		if (type == null) return "";
		return String(type)
			.replace(/(boy|girl)$/i, "")
			.toLowerCase();
	}

	function hasUniqueArt(type) {
		const raw = String(type || "").toLowerCase();
		const base = baseType(raw);
		return UNIQUE_ART.has(raw) || UNIQUE_ART.has(base);
	}

	function spriteType(type) {
		const raw = String(type || "").toLowerCase();
		if (!raw) return "creature";
		if (UNIQUE_ART.has(raw)) return raw;
		const base = baseType(raw);
		if (UNIQUE_ART.has(base)) return base;
		if (FALLBACK[raw]) return FALLBACK[raw];
		if (FALLBACK[base]) return FALLBACK[base];
		return "creature";
	}

	/** Types we expect to generate that must always resolve to an existing sprite family. */
	const PORT_TYPES = ["sheep", "deer", "bee", "wasp", "dragon", "raccoon", "frog"];

	function missingArtTypes(types) {
		return (types || PORT_TYPES).filter(t => spriteType(t) === String(t) && !hasUniqueArt(t));
	}

	/**
	 * Return true if a combat image src path would refer to a type without unique art.
	 * Used by tests and as a guard when building dynamic paths.
	 *
	 * @param src
	 */
	function pathUsesMissingBeastArt(src) {
		if (!src) return false;
		const s = String(src).toLowerCase();
		if (!/img\/sex\//.test(s)) return false;
		return PORT_TYPES.some(t => {
			const re = new RegExp(`(?:^|/)(${t}|${t}boy|${t}girl)(?:/|_|\\.|$)`);
			return re.test(s);
		});
	}

	const api = {
		UNIQUE_ART,
		FALLBACK,
		PORT_TYPES,
		baseType,
		hasUniqueArt,
		spriteType,
		missingArtTypes,
		pathUsesMissingBeastArt,
	};

	if (typeof window !== "undefined") window.PlusBeastArt = api;
	globalThis.PlusBeastArt = api;
})();
