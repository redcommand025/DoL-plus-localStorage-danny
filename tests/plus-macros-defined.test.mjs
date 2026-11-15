/**
 * Every <<plus...>> macro invoked in the game must be defined as a widget in a
 * [widget]-tagged passage, or registered with Macro.add / DefineMacro.
 * Widgets themselves must live in a [widget] passage, or SugarCube will not
 * register them and the first call (e.g. Hallways) errors with "does not exist".
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function walk(dir, pred, out = []) {
	for (const name of readdirSync(dir)) {
		if (name === "node_modules" || name === ".git") continue;
		const p = join(dir, name);
		const st = statSync(p);
		if (st.isDirectory()) walk(p, pred, out);
		else if (pred(p)) out.push(p);
	}
	return out;
}

function rel(p) {
	return relative(root, p).replaceAll("\\", "/");
}

function read(p) {
	return readFileSync(p, "utf8");
}

function sugarcubeBuiltins() {
	const raw = read(join(root, "devTools/tweego/storyFormats/sugarcube-2/format.js"));
	const m = raw.match(/storyFormat\((\{.*\})\)/s);
	assert.ok(m, "SugarCube format.js is missing or not in the expected wrapper");
	const source = JSON.parse(m[1]).source || "";
	const names = new Set();
	for (const mm of source.matchAll(/Macro\.add\(\s*(\[[^\]]*\]|["'][^"']+["'])/g)) {
		const arg = mm[1];
		for (const n of arg.startsWith("[") ? arg.matchAll(/["']([^"']+)["']/g) : [[null, arg.slice(1, -1)]]) {
			if (n[1]) names.add(n[1]);
		}
	}
	// Compound-macro child tags, not registered as top-level macros.
	for (const n of ["elseif", "else", "case", "default", "option", "optionsfrom", "optgroup"]) names.add(n);
	return names;
}

function collectWidgetDefs() {
	const ok = new Map();
	const bad = [];
	for (const p of walk(join(root, "game"), f => f.endsWith(".twee"))) {
		const file = rel(p);
		let passage = null;
		let tags = [];
		read(p)
			.split(/\n/)
			.forEach((line, idx) => {
				const header = line.match(/^::\s+(\S.*?)\s*(?:\[([^\]]*)\])?\s*$/);
				if (header) {
					passage = header[1].trim();
					tags = (header[2] || "").split(/\s+/).filter(Boolean);
					return;
				}
				for (const wm of line.matchAll(/<<widget\s+(?:["']([^"']+)["']|([A-Za-z_][\w-]*))/g)) {
					const name = wm[1] || wm[2];
					const loc = `${file}:${idx + 1}`;
					if (tags.includes("widget")) ok.set(name, { loc, passage, tags });
					else bad.push({ name, loc, passage, tags });
				}
			});
	}
	return { ok, bad };
}

function collectJsMacros() {
	const found = new Map();
	const add = (name, loc) => {
		if (name) found.set(name, loc);
	};
	for (const p of walk(join(root, "game"), f => f.endsWith(".js"))) {
		const file = rel(p);
		read(p)
			.split(/\n/)
			.forEach((line, idx) => {
				const loc = `${file}:${idx + 1}`;
				for (const mm of line.matchAll(/(?:Macro\.add|DefineMacroS|DefineMacro)\(\s*(\[[^\]]*\]|["'][^"']+["'])/g)) {
					const arg = mm[1];
					if (arg.startsWith("[")) {
						for (const n of arg.matchAll(/["']([^"']+)["']/g)) add(n[1], loc);
					} else add(arg.slice(1, -1), loc);
				}
				for (const mm of line.matchAll(/statDisplay\.create\(\s*["']([^"']+)["']/g)) add(mm[1], loc);
			});
	}
	return found;
}

function stripNoise(text) {
	return text
		.replace(/\/%[\s\S]*?%\//g, " ")
		.replace(/<!--[\s\S]*?-->/g, " ")
		.replace(/<<script\b[^>]*>[\s\S]*?<<\/script>>/g, " ");
}

function collectInvocations() {
	const invoked = new Map();
	const add = (name, loc) => {
		if (!name || name === "widget" || name.startsWith("_") || name.startsWith("$")) return;
		if (!invoked.has(name)) invoked.set(name, []);
		invoked.get(name).push(loc);
	};
	for (const p of walk(join(root, "game"), f => f.endsWith(".twee"))) {
		const file = rel(p);
		if (file.startsWith("game/special-templates/") || file.startsWith("game/base-debug/")) continue;
		const text = stripNoise(read(p));
		text.split(/\n/).forEach((line, idx) => {
			if (line.startsWith(":: ")) return;
			for (const mm of line.matchAll(/<<(\/?)\s*([A-Za-z][\w:-]*)/g)) {
				if (mm[1] === "/") continue;
				add(mm[2], `${file}:${idx + 1}`);
			}
		});
	}
	return invoked;
}

export function plusInvocations() {
	const invoked = collectInvocations();
	return [...invoked.keys()].filter(n => n.toLowerCase().startsWith("plus")).sort();
}

const SKIP_UNTAGGED = new Set([
	// Example markup in the template, not compiled as a real widget.
	"game/special-templates/main.twee",
	// Debug-only passage, not part of the shipped plus-needs widgets.
	"game/base-debug/debug-events.twee",
]);

describe("custom macros are defined before they are invoked", () => {
	const builtins = sugarcubeBuiltins();
	const widgets = collectWidgetDefs();
	const jsMacros = collectJsMacros();
	const invoked = collectInvocations();
	const defined = new Set([...builtins, ...widgets.ok.keys(), ...jsMacros.keys()]);

	it("defines widgets only in passages tagged [widget], outside templates and debug", () => {
		const unexpected = widgets.bad.filter(w => !SKIP_UNTAGGED.has(w.loc.split(":")[0]));
		assert.deepEqual(unexpected, [], unexpected.map(w => `${w.name} in ${w.passage} at ${w.loc}`).join("\n"));
	});

	it("keeps the school rumour and Bailey widgets in a [widget] passage", () => {
		for (const name of ["plusSchoolContRepRemark", "plusSchoolContRepBox", "plusBaileyContRepComment"]) {
			assert.ok(widgets.ok.has(name), `${name} is not defined in a [widget] passage`);
			assert.match(widgets.ok.get(name).passage, /Continence Reputation/);
		}
		assert.match(read(join(root, "game/overworld-town/loc-school/hallways.twee")), /<<plusSchoolContRepRemark>>/);
	});

	it("defines every invoked <<plus...>> macro as a widget or Macro.add/DefineMacro", () => {
		const plus = plusInvocations();
		assert.ok(plus.includes("plusSchoolContRepRemark"));
		const missing = plus.filter(n => !defined.has(n));
		assert.deepEqual(missing, [], missing.map(n => `${n} at ${invoked.get(n)[0]}`).join("\n"));
	});

	it("defines every custom macro invoked from plus-needs as a widget or Macro.add/DefineMacro", () => {
		const missing = [];
		for (const [name, locs] of invoked) {
			const plusLocs = locs.filter(l => l.includes("/plus-needs/"));
			if (!plusLocs.length) continue;
			if (!defined.has(name)) missing.push(`${name} at ${plusLocs[0]}`);
		}
		assert.deepEqual(missing, []);
	});
});
