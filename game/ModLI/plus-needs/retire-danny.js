/**
 * Quietly drop Danny from an old save. Official NNPCs stay at their
 * existing $NPCName indices: Danny was last in setup.NPCNameList, and
 * we only splice a "Danny" entry (any official names after him would
 * shift, but none exist; only a custom NNPC appended after him would).
 *
 * Also remaps or clears stored $NPCName indices ($npc / $npcnum / $npcrow)
 * and a pillory tenant that still points at Danny, so widgets like
 * <<personselect>> and <<endnpc>> do not read title/nam/trust of undefined.
 *
 * @param {object} [vars] SugarCube State.variables; defaults to the live save.
 * @param removedIndex
 */
function plusSanitizeNamedNpcRefs(vars, removedIndex) {
	const V = vars;
	if (!V || typeof V !== "object") return;
	if (!Array.isArray(V.npc)) V.npc = [];
	if (!Array.isArray(V.npcnum)) V.npcnum = [];
	if (!Array.isArray(V.npcrow)) V.npcrow = [];
	const names = Array.isArray(V.NPCName) ? V.NPCName : [];
	const len = names.length;
	const dropName = n => n === "Danny" || (typeof n === "string" && /^danny$/i.test(n));
	const n = Math.max(V.npc.length, V.npcnum.length, V.npcrow.length);
	/* Drop Danny first, while $npcnum still uses pre-splice indices. */
	for (let i = n - 1; i >= 0; i--) {
		const name = V.npc[i];
		const idx = V.npcnum[i];
		if (dropName(name) || (typeof removedIndex === "number" && removedIndex >= 0 && idx === removedIndex)) {
			V.npc.splice(i, 1);
			V.npcnum.splice(i, 1);
			V.npcrow.splice(i, 1);
		}
	}
	if (typeof removedIndex === "number" && removedIndex >= 0) {
		for (let i = 0; i < V.npcnum.length; i++) {
			if (typeof V.npcnum[i] === "number" && V.npcnum[i] > removedIndex) V.npcnum[i] -= 1;
		}
	}
	for (let i = V.npc.length - 1; i >= 0; i--) {
		const idx = V.npcnum[i];
		const entry = typeof idx === "number" ? names[idx] : null;
		if (typeof idx === "number" && (idx < 0 || idx >= len || (entry && entry.nam === "Danny"))) {
			V.npc.splice(i, 1);
			V.npcnum.splice(i, 1);
			V.npcrow.splice(i, 1);
		}
	}
	const tenant = V.pillory && V.pillory.tenant;
	if (tenant) {
		const special = tenant.special && tenant.special.name;
		const person = tenant.person || {};
		const personName = person.fullDescription || person.nam || person.description;
		if (special === "Danny" || personName === "Danny") {
			tenant.exists = 0;
			if (tenant.special) {
				tenant.special.name = "";
				tenant.special.desc = "";
			}
		}
	}
}

/**
 * @param {object} [vars] SugarCube State.variables; defaults to the live save.
 */
function plusRetireDanny(vars) {
	const V =
		vars ||
		(typeof window !== "undefined" && window.SugarCube && SugarCube.State && SugarCube.State.variables) ||
		(typeof window !== "undefined" && window.V) ||
		null;
	if (!V || typeof V !== "object") return false;

	if (V.loveInterest && typeof V.loveInterest === "object") {
		if (V.loveInterest.primary === "Danny") V.loveInterest.primary = "None";
		if (V.loveInterest.secondary === "Danny") V.loveInterest.secondary = "None";
	}

	if (V.options && typeof V.options === "object") {
		const display = V.options.nnpcDisplay;
		if (
			display != null &&
			String(display)
				.toLowerCase()
				.replace(/[\s-]+/g, "_") === "danny"
		) {
			V.options.nnpcDisplay = undefined;
		}
		const auto = V.options.autoNNPCDisplay;
		if (auto && typeof auto === "object" && auto.danny) delete auto.danny;
	}

	let removed = false;
	let removedIndex = -1;
	const list = V.NPCNameList;
	const names = V.NPCName;
	if (Array.isArray(list)) {
		const i = list.indexOf("Danny");
		if (i >= 0) {
			const entry = Array.isArray(names) ? names[i] : null;
			const isDanny = !entry || entry.nam === "Danny" || entry.description === "Danny";
			if (isDanny) {
				list.splice(i, 1);
				if (Array.isArray(names) && names.length > i) names.splice(i, 1);
				removed = true;
				removedIndex = i;
			}
		}
	}

	for (const key of Object.keys(V)) {
		if (key === "danny" || /^danny/i.test(key)) delete V[key];
	}
	if (V.daily && typeof V.daily === "object") {
		for (const key of Object.keys(V.daily)) {
			if (/^danny/i.test(key)) delete V.daily[key];
		}
	}

	plusSanitizeNamedNpcRefs(V, removedIndex);
	return removed;
}

if (typeof window !== "undefined") {
	window.plusRetireDanny = plusRetireDanny;
	window.plusSanitizeNamedNpcRefs = plusSanitizeNamedNpcRefs;
}
