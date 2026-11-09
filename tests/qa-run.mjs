/**
 * Run the full named QA suite once, parse each case, write docs/qa-results.json
 * and docs/qa-findings.md. Does not push remotes or claim a 7-day playthrough.
 */
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const docs = join(root, "docs");
mkdirSync(docs, { recursive: true });

function git(args) {
	return spawnSync("git", args, { cwd: root, encoding: "utf8" }).stdout.trim();
}

const meta = {
	sourceCommit: git(["rev-parse", "HEAD"]),
	sourceBranch: git(["rev-parse", "--abbrev-ref", "HEAD"]),
	describe: git(["describe", "--tags", "--always", "--dirty"]),
	compiledHtml: existsSync(join(root, "Degrees of Lewdity.html"))
		? spawnSync("readlink", ["-n", "Degrees of Lewdity.html"], { cwd: root, encoding: "utf8" }).stdout.trim() || "Degrees of Lewdity.html"
		: null,
	startedAt: new Date().toISOString(),
	command:
		"node --test --test-reporter tap tests/storage-fallback.test.mjs tests/prepend-storage-fallback.test.mjs tests/npc-count-invariant.test.mjs tests/plus-needs-native.test.mjs tests/plus-needs-behavior.test.mjs tests/plus-paperdoll-src.test.mjs tests/plus-old-save-migration.test.mjs tests/qa-plus-smoke.test.mjs tests/qa-compiled-runtime.test.mjs && node tests/tutorial-npc-count.mjs && node tests/no-storage-startup.mjs Degrees of Lewdity.html",
};

const testFiles = [
	"tests/storage-fallback.test.mjs",
	"tests/prepend-storage-fallback.test.mjs",
	"tests/npc-count-invariant.test.mjs",
	"tests/plus-needs-native.test.mjs",
	"tests/plus-needs-behavior.test.mjs",
	"tests/plus-paperdoll-src.test.mjs",
	"tests/plus-old-save-migration.test.mjs",
	"tests/qa-plus-smoke.test.mjs",
	"tests/qa-compiled-runtime.test.mjs",
];

function classify(name) {
	if (/^QA-[B]\d+/.test(name)) return "behavioral";
	if (/^QA-C\d+/.test(name)) return "integration";
	if (/^QA-S\d+/.test(name)) return "static";
	if (/compiled paperdoll|compiled-HTML|no-storage|Tutorial|migrates a synthesized/.test(name)) return "integration";
	if (
		/wires location|registers wearProp|removes undefined|keeps a single compile|includes copied|official genlayer|password gate|Danny wait|class-ask widgets|srcfn calls|time, prop/.test(
			name
		)
	)
		return "static";
	if (/generateNPC|combatinit|baseNPC|stale count|double generate|Bailey|generate1 then|clean Start2/.test(name)) return "integration";
	if (/localStorage|IndexedDB|Storage\.prototype|prepend-storage|inserts the fallback/.test(name)) return "behavioral";
	return "behavioral";
}

function parseTap(text) {
	const cases = [];
	const lines = text.split("\n");
	for (let i = 0; i < lines.length; i++) {
		const m = /^(?:\s*)(not )?ok \d+ - (.+)$/.exec(lines[i]);
		if (!m) continue;
		let typ = "";
		let error;
		for (let j = i + 1; j < Math.min(i + 20, lines.length); j++) {
			const tm = /type: '(\w+)'/.exec(lines[j]);
			if (tm) typ = tm[1];
			if (/^\s+error: /.test(lines[j])) {
				error = lines[j]
					.replace(/^\s+error: \|-?\s*/, "")
					.replace(/^\s+error: /, "")
					.trim();
				if (error === "|-") {
					error = (lines[j + 1] || "").trim();
				}
			}
			if (typ && (lines[j].trim() === "..." || /^\s*(#|ok |not ok )/.test(lines[j + 1] || ""))) break;
		}
		if (typ !== "test") continue;
		const name = m[2].trim();
		const fail = !!m[1];
		const idMatch = /^(QA-[A-Z]\d{3})\b/.exec(name);
		cases.push({
			id: idMatch ? idMatch[1] : null,
			name,
			kind: classify(name),
			status: fail ? "fail" : "pass",
			source: "node:test",
			error,
		});
	}
	return cases;
}

const tap = spawnSync("node", ["--test", "--test-reporter", "tap", ...testFiles], {
	cwd: root,
	encoding: "utf8",
	maxBuffer: 20 * 1024 * 1024,
	env: process.env,
});
const combinedOut = (tap.stdout || "") + (tap.stderr || "");
writeFileSync(join(docs, "qa-tap-output.txt"), combinedOut);
let cases = parseTap(tap.stdout || "");

const tutorial = spawnSync("node", ["tests/tutorial-npc-count.mjs"], {
	cwd: root,
	encoding: "utf8",
	maxBuffer: 5 * 1024 * 1024,
});
let tutorialJson = null;
try {
	const start = tutorial.stdout.indexOf("{");
	const end = tutorial.stdout.lastIndexOf("}");
	tutorialJson = JSON.parse(start >= 0 ? tutorial.stdout.slice(start, end + 1) : tutorial.stdout);
} catch (e) {
	tutorialJson = { parseError: true, stdout: (tutorial.stdout || "").slice(0, 500) };
}
if (tutorialJson && Array.isArray(tutorialJson.cases)) {
	for (const c of tutorialJson.cases) {
		const failed = Array.isArray(tutorialJson.failures) && tutorialJson.failures.some(f => f.name === c.name);
		cases.push({
			id: null,
			name: "Tutorial NPC: " + c.name,
			kind: "integration",
			status: tutorial.status === 0 && !failed ? "pass" : "fail",
			source: "tests/tutorial-npc-count.mjs",
			expected: "enemyno matches generated slots; no personselect 1",
			actual: `enemyno=${c.enemyno} enemynomax=${c.enemynomax} passage=${c.passage || ""}`,
		});
	}
} else {
	cases.push({
		id: null,
		name: "Tutorial NPC runtime suite",
		kind: "integration",
		status: tutorial.status === 0 ? "pass" : "fail",
		source: "tests/tutorial-npc-count.mjs",
		error: tutorialJson && tutorialJson.parseError ? "could not parse tutorial JSON" : undefined,
	});
}

const nostore = spawnSync("node", ["tests/no-storage-startup.mjs", "Degrees of Lewdity.html"], {
	cwd: root,
	encoding: "utf8",
	maxBuffer: 5 * 1024 * 1024,
});
let ns = null;
try {
	ns = JSON.parse(nostore.stdout);
} catch (e) {
	ns = null;
}
cases.push({
	id: null,
	name: "No-storage compiled startup (getters, IDB null, password gate, modules)",
	kind: "integration",
	status: nostore.status === 0 && ns && ns.ok ? "pass" : "fail",
	source: "tests/no-storage-startup.mjs",
	expected: "ok true, passwordGate true, indexedDBIsNull true, deepMerge function",
	actual: ns
		? `ok=${ns.ok} passwordGate=${ns.snapshot && ns.snapshot.passwordGate} indexedDBIsNull=${ns.snapshot && ns.snapshot.indexedDBIsNull} deepMerge=${
				ns.snapshot && ns.snapshot.deepMergeType
		  }`
		: (nostore.stdout || nostore.stderr || "").slice(0, 300),
});

// Assign leftover IDs for legacy cases so every row has one
let legacy = 1;
for (const c of cases) {
	if (!c.id) {
		c.id = "QA-L" + String(legacy).padStart(3, "0");
		legacy++;
	}
}

const summary = {
	total: cases.length,
	pass: cases.filter(c => c.status === "pass").length,
	fail: cases.filter(c => c.status === "fail").length,
	byKind: {},
};
for (const c of cases) {
	summary.byKind[c.kind] = summary.byKind[c.kind] || { total: 0, pass: 0, fail: 0 };
	summary.byKind[c.kind].total++;
	summary.byKind[c.kind][c.status]++;
}

const report = {
	meta: { ...meta, finishedAt: new Date().toISOString(), nodeTestExit: tap.status, tutorialExit: tutorial.status, noStorageExit: nostore.status },
	summary,
	cases,
	limitations: [
		"This automated pass is not a 7-day gameplay click-through. The parent workstream owns browser playthrough evidence.",
		"Compiled runtime tests load the page behind the password gate and do not complete character creation or wander the map.",
		"Old-save coverage remains a synthesized old-test-build state, not a player's personal save file.",
		"Paperdoll checks cover official srcfn path rewrite and decoded sprites, not a composited on-model screenshot.",
	],
};

writeFileSync(join(docs, "qa-results.json"), JSON.stringify(report, null, 2));

const lines = [];
lines.push("# Plus-needs QA findings (automated)");
lines.push("");
lines.push(
	"Status: automated source/runtime suite. Browser 7-day click-through evidence is **not** included yet and must be added by the parent workstream before any Page claim of full gameplay verification."
);
lines.push("");
lines.push("## Build");
lines.push("");
lines.push(`- Source branch: \`${report.meta.sourceBranch}\``);
lines.push(`- Source commit: \`${report.meta.sourceCommit}\``);
lines.push(`- git describe: \`${report.meta.describe}\``);
lines.push(`- Compiled symlink target: \`${report.meta.compiledHtml}\``);
lines.push(`- Command: \`${report.meta.command}\``);
lines.push(`- Started (UTC): ${report.meta.startedAt}`);
lines.push(`- Finished (UTC): ${report.meta.finishedAt}`);
lines.push("");
lines.push("## Counts");
lines.push("");
lines.push(`- Total named cases executed: **${summary.total}**`);
lines.push(`- Passed: **${summary.pass}**`);
lines.push(`- Failed: **${summary.fail}**`);
lines.push(`- Behavioral: ${summary.byKind.behavioral ? `${summary.byKind.behavioral.pass}/${summary.byKind.behavioral.total}` : "0"}`);
lines.push(`- Integration: ${summary.byKind.integration ? `${summary.byKind.integration.pass}/${summary.byKind.integration.total}` : "0"}`);
lines.push(`- Static: ${summary.byKind.static ? `${summary.byKind.static.pass}/${summary.byKind.static.total}` : "0"}`);
lines.push("");
lines.push("## Bugs found in this automated pass");
lines.push("");
lines.push(
	"- **plusDiaperMigrateAll sealed `plusDiaperV2` even when old item names could not be rewritten** because `setup.clothes.under_lower` did not yet contain the v2 templates (`migrate` returned false). A too-early call would skip later retries. Fixed in `game/ModLI/plus-needs/needs.js` by counting pending old names and only setting `plusDiaperV2` when none remain. Regression: `QA-B081`. Initial failure: `QA-B072` returned `n === 0` before catalog registration; after the catalog-ready setup plus the retry fix both `QA-B072` and `QA-B081` pass."
);
lines.push(
	"- `QA-C010` first assumed IndexedDB was null in a normal compiled Chromium sandbox. That contradicted the existing fallback rule (IDB is only disabled when Web Storage is unusable). The case was corrected to assert working `localStorage` while leaving IDB alone; no product change. The no-storage IDB denial remains covered by `tests/no-storage-startup.mjs` and `tests/storage-fallback.test.mjs`."
);
lines.push("");
lines.push("## Initial failures");
lines.push("");
const failed = cases.filter(c => c.status === "fail");
if (!failed.length) lines.push("None in this automated run.");
else for (const c of failed) lines.push(`- \`${c.id}\` ${c.name}${c.actual ? ` — ${c.actual}` : ""}${c.error ? ` — ${c.error}` : ""}`);
lines.push("");
lines.push("## Case register");
lines.push("");
lines.push("| ID | Kind | Status | Name |");
lines.push("| --- | --- | --- | --- |");
for (const c of cases) lines.push(`| ${c.id} | ${c.kind} | ${c.status} | ${c.name.replace(/\|/g, "&#124;")} |`);
lines.push("");
lines.push("## Limitations");
lines.push("");
for (const l of report.limitations) lines.push(`- ${l}`);
lines.push("");
writeFileSync(join(docs, "qa-findings.md"), lines.join("\n"));

console.log(
	JSON.stringify(
		{ summary, sourceCommit: meta.sourceCommit, describe: meta.describe, compiledHtml: meta.compiledHtml, findings: "docs/qa-findings.md" },
		null,
		2
	)
);
if (summary.fail || tap.status !== 0) process.exitCode = 1;
