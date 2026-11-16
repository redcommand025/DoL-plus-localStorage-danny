/**
 * Quietly drop Danny from an old save. Official NNPCs stay at their
 * existing $NPCName indices: Danny was last in setup.NPCNameList, and
 * we only splice a "Danny" entry (any official names after him would
 * shift, but none exist; only a custom NNPC appended after him would).
 *
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

	return removed;
}

if (typeof window !== "undefined") window.plusRetireDanny = plusRetireDanny;
