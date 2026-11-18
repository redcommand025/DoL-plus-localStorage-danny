/**
 * Plus transformation choice helper.
 * Resolves which animal (or hybrid) transformation is displayed when several
 * are qualified. "automatic" uses New World's fixed priority order.
 *
 * Safe to load in Node tests (no SugarCube dependency).
 *
 * @param root
 */
(function (root) {
	"use strict";

	const AUTOMATIC = "automatic";

	const catalog = {
		okami: { label: "Okami", kind: "hybrid", component: "wolf", partsKey: "okami", hybridParts: ["ears", "tail", "misc"] },
		wolf: { label: "Wolf", kind: "animal", stageVar: "wolfgirl", buildVar: "wolfbuild", widget: "wolfTransform", partsKey: "wolf", completeStage: 6 },
		cat: { label: "Cat", kind: "animal", stageVar: "cat", buildVar: "catbuild", widget: "catTransform", partsKey: "cat", completeStage: 6 },
		cow: { label: "Cow", kind: "animal", stageVar: "cow", buildVar: "cowbuild", widget: "cowTransform", partsKey: "cow", completeStage: 6 },
		seraphim: { label: "Seraphim", kind: "hybrid", component: "bird", partsKey: "seraphim", hybridParts: ["wings"] },
		bird: { label: "Bird", kind: "animal", stageVar: "harpy", buildVar: "birdbuild", widget: "harpyTransform", partsKey: "bird", completeStage: 6 },
		kitsune: { label: "Kitsune", kind: "hybrid", component: "fox", partsKey: "kitsune", hybridParts: ["ears", "tail", "cheeks"] },
		fox: { label: "Fox", kind: "animal", stageVar: "fox", buildVar: "foxbuild", widget: "foxTransform", partsKey: "fox", completeStage: 6 },
		bunny: { label: "Bunny", kind: "animal", stageVar: "bunny", buildVar: "bunnybuild", widget: "bunnyTransform", partsKey: "bunny", completeStage: 6 },
		bee: { label: "Bee", kind: "animal", stageVar: "bee", buildVar: "beebuild", widget: "beeTransform", partsKey: "bee", completeStage: 6 },
		sheep: { label: "Sheep", kind: "animal", stageVar: "sheep", buildVar: "sheepbuild", widget: "sheepTransform", partsKey: "sheep", completeStage: 6 },
		deer: { label: "Deer", kind: "animal", stageVar: "deer", buildVar: "deerbuild", widget: "deerTransform", partsKey: "deer", completeStage: 6 },
		bear: { label: "Bear", kind: "animal", stageVar: "bear", buildVar: "bearbuild", widget: "bearTransform", partsKey: "bear", completeStage: 6 },
		waterdragon: {
			label: "Water dragon",
			kind: "animal",
			stageVar: "waterdragon",
			buildVar: "waterdragonbuild",
			widget: "waterdragonTransform",
			partsKey: "waterdragon",
			completeStage: 7,
		},
		dragon: { label: "Dragon", kind: "animal", stageVar: "dragon", buildVar: "dragonbuild", widget: "dragonTransform", partsKey: "dragon", completeStage: 6 },
		lizard: { label: "Lizard", kind: "animal", stageVar: "lizard", buildVar: "lizardbuild", widget: "lizardTransform", partsKey: "lizard", completeStage: 6 },
		dolphin: {
			label: "Dolphin",
			kind: "animal",
			stageVar: "dolphin",
			buildVar: "dolphinbuild",
			widget: "dolphinTransform",
			partsKey: "dolphin",
			completeStage: 6,
		},
		dog: { label: "Dog", kind: "animal", stageVar: "dog", buildVar: "dogbuild", widget: "dogTransform", partsKey: "dog", completeStage: 6 },
		fish: { label: "Fish", kind: "animal", stageVar: "fish", buildVar: "fishbuild", widget: "fishTransform", partsKey: "fish", completeStage: 6 },
		raccoon: {
			label: "Raccoon",
			kind: "animal",
			stageVar: "raccoon",
			buildVar: "raccoonbuild",
			widget: "raccoonTransform",
			partsKey: "raccoon",
			completeStage: 6,
		},
		horse: { label: "Horse", kind: "animal", stageVar: "horse", buildVar: "horsebuild", widget: "horseTransform", partsKey: "horse", completeStage: 6 },
		spider: { label: "Spider", kind: "animal", stageVar: "spider", buildVar: "spiderbuild", widget: "spiderTransform", partsKey: "spider", completeStage: 6 },
		frog: { label: "Frog", kind: "animal", stageVar: "frog", buildVar: "frogbuild", widget: "frogTransform", partsKey: "frog", completeStage: 6 },
		pig: { label: "Pig", kind: "animal", stageVar: "pig", buildVar: "pigbuild", widget: "pigTransform", partsKey: "pig", completeStage: 6 },
	};

	/* New World's animal order, with kept Plus TFs slotted in:
	   hybrids immediately above their component, bunny after fox, water dragon immediately before dragon. */
	const animalPriority = [
		"okami",
		"wolf",
		"cat",
		"cow",
		"seraphim",
		"bird",
		"kitsune",
		"fox",
		"bunny",
		"bee",
		"sheep",
		"deer",
		"bear",
		"waterdragon",
		"dragon",
		"lizard",
		"dolphin",
		"dog",
		"fish",
		"raccoon",
		"horse",
		"spider",
		"frog",
		"pig",
	];

	const defaultBuildsAndStages = {
		wolfbuild: 0,
		wolfgirl: 0,
		wolftf: 0,
		catbuild: 0,
		cat: 0,
		cattf: 0,
		cowbuild: 0,
		cow: 0,
		cowtf: 0,
		birdbuild: 0,
		harpy: 0,
		harpytf: 0,
		foxbuild: 0,
		fox: 0,
		foxtf: 0,
		bunnybuild: 0,
		bunny: 0,
		beebuild: 0,
		bee: 0,
		beetf: 0,
		sheepbuild: 0,
		sheep: 0,
		sheeptf: 0,
		deerbuild: 0,
		deer: 0,
		deertf: 0,
		bearbuild: 0,
		bear: 0,
		beartf: 0,
		waterdragonbuild: 0,
		waterdragon: 0,
		waterdragontf: 0,
		dragonbuild: 0,
		dragon: 0,
		dragontf: 0,
		lizardbuild: 0,
		lizard: 0,
		lizardtf: 0,
		dolphinbuild: 0,
		dolphin: 0,
		dolphintf: 0,
		dogbuild: 0,
		dog: 0,
		dogtf: 0,
		fishbuild: 0,
		fish: 0,
		fishtf: 0,
		raccoonbuild: 0,
		raccoon: 0,
		raccoontf: 0,
		horsebuild: 0,
		horse: 0,
		horsetf: 0,
		spiderbuild: 0,
		spider: 0,
		spidertf: 0,
		frogbuild: 0,
		frog: 0,
		frogtf: 0,
		pigbuild: 0,
		pig: 0,
		pigtf: 0,
		permanentTransform: 0,
		TFWolfBuffs: 0,
		TFCatBuffs: 0,
		TFCowBuffs: 0,
		TFBirdBuffs: 0,
		TFFoxBuffs: 0,
		TFBearBuffs: 0,
		TFBunnyBuffs: 0,
		TFWaterDragonBuffs: 0,
	};

	const defaultTransformationParts = {
		traits: {
			fangs: "disabled",
			sharpEyes: "disabled",
			dragonEyes: "disabled",
			mateForLife: "disabled",
			chase: "disabled",
			flaunting: "disabled",
			preyAnimal: "disabled",
			strongFeet: "disabled",
			predatoryAnimal: "disabled",
			tempTolerance: "disabled",
			aquatic: "disabled",
			wdgrace: "disabled",
			incognito: "disabled",
			aquatail: "disabled",
			lungs: "disabled",
			vigorous: "disabled",
			webbedfeet: "disabled",
			strongnose: "disabled",
			longtongue: "disabled",
			kicks: "disabled",
			activeTF: "disabled",
			activeTFOverride: false,
		},
		angel: { halo: "disabled", wings: "disabled" },
		fallenAngel: { halo: "disabled", wings: "disabled" },
		demon: { horns: "disabled", wings: "disabled", tail: "disabled" },
		cat: { ears: "disabled", tail: "disabled", heterochromia: "disabled" },
		cow: { horns: "disabled", ears: "disabled", tail: "disabled" },
		wolf: { ears: "disabled", tail: "disabled", pubes: "disabled", pits: "disabled", cheeks: "disabled" },
		bird: { tail: "disabled", wings: "disabled", eyes: "disabled", malar: "disabled", plumage: "disabled", pubes: "disabled" },
		fox: { ears: "disabled", tail: "disabled", cheeks: "disabled" },
		bee: { ears: "disabled", tail: "disabled", wings: "disabled" },
		sheep: { ears: "disabled", tail: "disabled", horns: "disabled" },
		deer: { ears: "disabled", tail: "disabled", horns: "disabled" },
		bear: { plumage: "disabled", pubes: "disabled", ears: "disabled", tail: "disabled" },
		dragon: { tail: "disabled", wings: "disabled", eyes: "disabled", horns: "disabled", claws: "disabled", whisker: "disabled", fangs: "disabled" },
		lizard: { horns: "disabled", tail: "disabled", eyes: "disabled" },
		dolphin: { tail: "disabled" },
		dog: { ears: "disabled", tail: "disabled" },
		ghost: { eyes: "disabled", hitodama: "disabled", mist: "disabled", stream: "disabled", flame: "disabled" },
		slime: { bubble: "disabled", stream: "disabled", core: "disabled" },
		mushroom: { cap: "disabled", eyes: "disabled", spores: "disabled", mushrooms: "disabled" },
		raccoon: { mask: "disabled", ears: "disabled", tail: "disabled" },
		fish: { fins: "disabled", tail: "disabled" },
		horse: { ears: "disabled", tail: "disabled" },
		frog: { eyes: "disabled", cheeks: "disabled" },
		spider: { eyes: "disabled", tail: "disabled" },
		pig: { ears: "disabled", tail: "disabled" },
		bunny: { ears: "disabled", tail: "disabled" },
		okami: { ears: "disabled", tail: "disabled", wings: "disabled", misc: "disabled" },
		seraphim: { wings: "disabled", plumage: "disabled", eyes: "disabled" },
		kitsune: { ears: "disabled", tail: "disabled", cheeks: "disabled", misc: "disabled" },
		waterdragon: { horns: "disabled", ears: "disabled", tail: "disabled" },
		goblin: { ears: "disabled" },
		eldritch: { skin: "disabled", tentacle: "disabled", eyes: "disabled", mist: "disabled" },
		fae: { wings: "disabled", fairies: "disabled" },
	};

	const physicalStageVars = [
		"wolfgirl",
		"cat",
		"cow",
		"harpy",
		"fox",
		"bunny",
		"bee",
		"sheep",
		"deer",
		"bear",
		"waterdragon",
		"dragon",
		"lizard",
		"dolphin",
		"dog",
		"fish",
		"raccoon",
		"horse",
		"spider",
		"frog",
		"pig",
	];

	const historyVars = physicalStageVars.concat(["angel", "fallenangel", "demon", "dryad"]);

	function num(value) {
		const n = Number(value);
		return Number.isFinite(n) ? n : 0;
	}

	function label(key) {
		if (key === AUTOMATIC) return "Automatic";
		return (catalog[key] && catalog[key].label) || key;
	}

	function isVisiblePart(value) {
		return value != null && value !== "disabled" && value !== "hidden";
	}

	function hybridIsActive(vars, key) {
		const entry = catalog[key];
		if (!entry || entry.kind !== "hybrid") return false;
		const group = vars.transformationParts && vars.transformationParts[entry.partsKey];
		if (!group) return false;
		const parts = entry.hybridParts || [];
		if (key === "kitsune" || key === "okami") {
			/* Match the characteristics screen: qualified when not every listed part is disabled. */
			const disabledCount = parts.filter(part => group[part] === "disabled" || group[part] == null).length;
			return disabledCount < parts.length;
		}
		return parts.some(part => isVisiblePart(group[part]));
	}

	function isQualified(vars, key) {
		const entry = catalog[key];
		if (!entry) return false;
		if (entry.kind === "hybrid") return hybridIsActive(vars, key);
		const stage = num(vars[entry.stageVar]);
		const build = num(vars[entry.buildVar]);
		return stage >= 1 || build >= 5;
	}

	function qualifiedKeys(vars) {
		return animalPriority.filter(key => isQualified(vars || {}, key));
	}

	function listboxMap(vars) {
		const map = { Automatic: AUTOMATIC };
		qualifiedKeys(vars).forEach(key => {
			map[label(key)] = key;
		});
		return map;
	}

	function ensureParts(vars) {
		const state = vars || {};
		if (state.transformationParts == null || typeof state.transformationParts !== "object") {
			state.transformationParts = {};
		}
		const parts = state.transformationParts;
		Object.keys(defaultTransformationParts).forEach(group => {
			const defaults = defaultTransformationParts[group];
			if (parts[group] == null || typeof parts[group] !== "object") {
				parts[group] = Object.assign({}, defaults);
				return;
			}
			Object.keys(defaults).forEach(key => {
				if (parts[group][key] == null) parts[group][key] = defaults[key];
			});
		});
		return state;
	}

	function migrate(vars) {
		const state = vars || {};
		if (state.transformPreferred == null || state.transformPreferred === "") {
			state.transformPreferred = AUTOMATIC;
		}
		Object.keys(defaultBuildsAndStages).forEach(name => {
			if (state[name] == null) state[name] = defaultBuildsAndStages[name];
		});
		if (state.permanentTransform == null) state.permanentTransform = 0;
		return ensureParts(state);
	}

	function fallbackPreferred(vars) {
		const state = migrate(vars || {});
		const preferred = state.transformPreferred;
		if (preferred !== AUTOMATIC && !isQualified(state, preferred)) {
			state.transformPreferred = AUTOMATIC;
		}
		return state.transformPreferred;
	}

	function resolve(vars) {
		const state = vars || {};
		const preferred = fallbackPreferred(state);
		if (preferred !== AUTOMATIC && isQualified(state, preferred)) return preferred;
		for (let i = 0; i < animalPriority.length; i++) {
			const key = animalPriority[i];
			if (isQualified(state, key)) return key;
		}
		return null;
	}

	function keepPartGroups(key) {
		const entry = catalog[key];
		if (!entry) return [];
		if (entry.kind === "hybrid") {
			const component = catalog[entry.component];
			return [entry.partsKey, component && component.partsKey].filter(Boolean);
		}
		return [entry.partsKey];
	}

	function hasPhysicalTransform(vars) {
		const state = vars || {};
		return physicalStageVars.some(name => num(state[name]) > 0);
	}

	/* Visual parts to re-enable when a staged TF becomes the displayed one. */
	const stageParts = {
		wolf: [
			{ min: 2, traits: { fangs: "default" } },
			{ min: 4, parts: { ears: "default", pubes: "default", pits: "default" } },
			{ min: 5, parts: { cheeks: "feral" } },
			{ min: 6, parts: { tail: "default" }, flags: { hastail: "true", thintail: "true" } },
		],
		cat: [
			{ min: 2, traits: { fangs: "default", sharpEyes: "default" } },
			{ min: 4, parts: { ears: "default" } },
			{ min: 6, parts: { tail: "default" }, flags: { hastail: "true", thintail: "true" } },
			{ min: 7, parts: { heterochromia: "default" } },
		],
		cow: [
			{ min: 2, parts: { horns: "default" } },
			{ min: 4, parts: { ears: "default" } },
			{ min: 6, parts: { tail: "default" }, flags: { hastail: "true", thintail: "true" } },
		],
		bird: [
			{ min: 2, traits: { sharpEyes: "default" }, parts: { eyes: "default" } },
			{ min: 4, parts: { wings: "default", plumage: "default" } },
			{ min: 6, parts: { tail: "default", malar: "default" } },
		],
		fox: [
			{ min: 2, traits: { fangs: "default", sharpEyes: "default" } },
			{ min: 4, parts: { ears: "default", cheeks: "default" } },
			{ min: 6, parts: { tail: "default" }, flags: { hastail: "true", thintail: "true" } },
		],
		bunny: [
			{ min: 2, traits: { preyAnimal: "default" } },
			{ min: 4, parts: { ears: "default" }, traits: { strongFeet: "default" } },
			{ min: 6, parts: { tail: "default" }, flags: { hastail: "true", thintail: "true" } },
		],
		bee: [
			{ min: 2, parts: { ears: "default" } },
			{ min: 4, parts: { tail: "default" }, flags: { hastail: "true", thicktail: "true" } },
			{ min: 6, parts: { wings: "default" } },
		],
		sheep: [
			{ min: 2, parts: { horns: "default" } },
			{ min: 4, parts: { ears: "default" } },
			{ min: 6, parts: { tail: "default" }, flags: { hastail: "true", thintail: "true" } },
		],
		deer: [
			{ min: 2, parts: { horns: "default" } },
			{ min: 4, parts: { ears: "default" } },
			{ min: 6, parts: { tail: "default" }, traits: { kicks: "default" }, flags: { hastail: "true", thintail: "true" } },
		],
		bear: [
			{ min: 2, traits: { fangs: "default", strongnose: "default" } },
			{ min: 4, parts: { ears: "default", plumage: "default" } },
			{ min: 6, parts: { tail: "default", pubes: "default" }, flags: { hastail: "true", thintail: "true" } },
		],
		waterdragon: [
			{ min: 2, parts: { horns: "default" }, traits: { sharpEyes: "default", dragonEyes: "default" } },
			{ min: 4, parts: { ears: "default" } },
			{ min: 7, parts: { tail: "default" }, traits: { aquatic: "default", wdgrace: "default" }, flags: { hastail: "true", thicktail: "true" } },
		],
		dragon: [
			{ min: 1, parts: { eyes: "default" } },
			{ min: 2, traits: { fangs: "default" } },
			{ min: 3, parts: { horns: "default" } },
			{ min: 4, parts: { tail: "default" }, flags: { hastail: "true", thicktail: "true" } },
			{ min: 6, parts: { wings: "default", claws: "default" } },
		],
		lizard: [
			{ min: 1, parts: { eyes: "default" } },
			{ min: 2, traits: { fangs: "default" } },
			{ min: 6, parts: { tail: "default" }, traits: { aquatail: "default", lungs: "default" }, flags: { hastail: "true", thicktail: "true" } },
		],
		dolphin: [
			{ min: 2, traits: { lungs: "default" } },
			{ min: 4, parts: { tail: "default" }, flags: { hastail: "true", thicktail: "true", swimtail: "true" } },
			{ min: 6, traits: { aquatail: "default" } },
		],
		dog: [
			{ min: 2, traits: { fangs: "default" } },
			{ min: 4, parts: { ears: "default" } },
			{ min: 6, parts: { tail: "default" }, flags: { hastail: "true", thintail: "true" } },
		],
		fish: [
			{ min: 2, traits: { aquatic: "default" } },
			{ min: 4, parts: { fins: "default" } },
			{ min: 6, parts: { tail: "default" }, traits: { aquatail: "default" }, flags: { hastail: "true", thicktail: "true", swimtail: "true" } },
		],
		raccoon: [
			{ min: 2, traits: { incognito: "default", sharpEyes: "default" }, parts: { mask: "default" } },
			{ min: 4, parts: { ears: "default" } },
			{ min: 6, parts: { tail: "default" }, flags: { hastail: "true", thintail: "true" } },
		],
		horse: [
			{ min: 2, traits: { vigorous: "default" } },
			{ min: 4, parts: { ears: "default" } },
			{ min: 6, parts: { tail: "default" }, traits: { kicks: "default" }, flags: { hastail: "true", thintail: "true" } },
		],
		spider: [
			{ min: 2, traits: { fangs: "default" } },
			{ min: 4, parts: { eyes: "default" }, traits: { sharpEyes: "default" } },
			{ min: 6, parts: { tail: "default" }, flags: { hastail: "true", thicktail: "true" } },
		],
		frog: [
			{ min: 2, traits: { kicks: "default", lungs: "default", longtongue: "default", webbedfeet: "default" } },
			{ min: 4, parts: { eyes: "default" } },
			{ min: 6, parts: { cheeks: "default" } },
		],
		pig: [
			{ min: 2, traits: { strongnose: "default" } },
			{ min: 4, parts: { ears: "default" } },
			{ min: 6, parts: { tail: "default" }, flags: { hastail: "true", thintail: "true" } },
		],
		okami: [{ min: 0, parts: { ears: "default", tail: "default", wings: "default", misc: "default" } }],
		seraphim: [{ min: 0, parts: { wings: "default", plumage: "default", eyes: "default" } }],
		kitsune: [{ min: 0, parts: { ears: "default", tail: "default", cheeks: "default", misc: "default" } }],
	};

	function applyStageRules(vars, key, stage) {
		const rules = stageParts[key] || [];
		const entry = catalog[key];
		if (!entry) return;
		vars.transformationParts = vars.transformationParts || {};
		const groupName = entry.partsKey;
		vars.transformationParts[groupName] = vars.transformationParts[groupName] || {};
		vars.transformationParts.traits = vars.transformationParts.traits || {};
		rules.forEach(rule => {
			if (stage < rule.min) return;
			if (rule.parts) {
				Object.keys(rule.parts).forEach(part => {
					const current = vars.transformationParts[groupName][part];
					if (current == null || current === "disabled") {
						vars.transformationParts[groupName][part] = rule.parts[part];
					}
				});
			}
			if (rule.traits) {
				Object.keys(rule.traits).forEach(trait => {
					const current = vars.transformationParts.traits[trait];
					if (current == null || current === "disabled") {
						vars.transformationParts.traits[trait] = rule.traits[trait];
					}
				});
			}
			if (rule.flags) {
				Object.keys(rule.flags).forEach(flag => {
					vars[flag] = rule.flags[flag];
				});
			}
		});
	}

	function restoreDisplayedParts(vars, key) {
		const state = vars || {};
		const entry = catalog[key];
		if (!entry) return state;
		if (entry.kind === "hybrid") {
			applyStageRules(state, key, 6);
			const component = entry.component;
			if (component && catalog[component]) {
				applyStageRules(state, component, Math.max(num(state[catalog[component].stageVar]), 6));
			}
			return state;
		}
		applyStageRules(state, key, num(state[entry.stageVar]));
		return state;
	}

	const PlusTransform = {
		AUTOMATIC,
		catalog,
		animalPriority,
		physicalStageVars,
		historyVars,
		defaultBuildsAndStages,
		defaultTransformationParts,
		label,
		isQualified,
		qualifiedKeys,
		listboxMap,
		ensureParts,
		migrate,
		fallbackPreferred,
		resolve,
		keepPartGroups,
		hybridIsActive,
		hasPhysicalTransform,
		restoreDisplayedParts,
		num,
	};

	if (typeof module !== "undefined" && module.exports) {
		module.exports = PlusTransform;
	}
	root.PlusTransform = PlusTransform;
	if (typeof setup !== "undefined") setup.PlusTransform = PlusTransform;
})(typeof globalThis !== "undefined" ? globalThis : this);
