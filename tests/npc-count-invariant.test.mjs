import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function widgetBody(source, name) {
	const start = source.indexOf(`<<widget "${name}">>`);
	assert.notEqual(start, -1, `missing widget ${name}`);
	const end = source.indexOf("<</widget>>", start);
	assert.notEqual(end, -1, `unclosed widget ${name}`);
	return source.slice(start, end);
}

describe("NPC count invariant in source", () => {
	it("generateNPC sets enemyno from the filled slot index, not a call counter", () => {
		const source = readFileSync(join(root, "game/base-combat/npc-generation.twee"), "utf8");
		const body = widgetBody(source, "generateNPC");
		assert.match(body, /Math\.max\(\$enemyno \|\| 0, _n \+ 1\)/);
		assert.doesNotMatch(body, /\$enemyno \+= 1/);
	});

	it("combatinit does not mark ungenerated stubs active", () => {
		const source = readFileSync(join(root, "game/base-combat/init.twee"), "utf8");
		const body = widgetBody(source, "combatinit");
		assert.match(body, /\$NPCList\[_i\]\.pronoun/);
		assert.match(body, /\$NPCList\[_i\]\.active to "active"/);
		const activeLine = body.split("\n").find(line => line.includes('.active to "active"'));
		assert.ok(activeLine, "missing active assignment");
		const guardLine = body.split("\n").find(line => line.includes("$NPCList[_i].pronoun") && line.includes("defeated"));
		assert.ok(guardLine, "active loop should require pronoun before activating");
	});

	it("does not add dummy combat fields to setup.baseNPC", () => {
		const source = readFileSync(join(root, "game/04-Variables/variables-static.twee"), "utf8");
		const body = widgetBody(source, "variablesStatic");
		assert.match(body, /setup\.baseNPC = \{/);
		assert.doesNotMatch(body, /setup\.baseNPC = \{[^}]*lefthand/);
		assert.doesNotMatch(body, /setup\.baseNPC = \{[^}]*righthand/);
		assert.doesNotMatch(body, /setup\.baseNPC = \{[^}]*pronoun:/);
	});
});
