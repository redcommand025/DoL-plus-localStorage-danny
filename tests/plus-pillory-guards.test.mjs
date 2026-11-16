import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = rel => readFileSync(join(root, rel), "utf8");

describe("pillory and named-NPC widgets skip invalid entries", () => {
	it("personselect does not read title or nam from a missing $NPCName slot", () => {
		const src = read("game/base-system/text.twee");
		const start = src.indexOf('<<widget "personselect">>');
		const body = src.slice(start, src.indexOf("<</widget>>", start));
		assert.match(body, /def \$NPCName\[_namedIdx\] and \$NPCName\[_namedIdx\]\.nam/);
		assert.doesNotMatch(body, /\$NPCName\[\$npcnum\[\$npcrow\.indexOf\(_n\)\]\]\.title/);
	});

	it("endnpc does not add trust on a missing C.npc entry", () => {
		const src = read("game/base-system/named-npcs.twee");
		const start = src.indexOf('<<widget "endnpc">>');
		const body = src.slice(start, src.indexOf("<</widget>>", start));
		assert.match(body, /def C\.npc\[_passargs\]/);
		assert.match(body, /def C\.npc\[_nam\]/);
	});

	it("get_pillory_npc skips a tenant without a person and drops a stale named slot", () => {
		const src = read("game/base-system/widgets.twee");
		const start = src.indexOf('<<widget "get_pillory_npc">>');
		const body = src.slice(start, src.indexOf("<</widget>>", start));
		assert.match(body, /!\$pillory\.tenant\.person\.pronoun/);
		assert.match(body, /\$npcrow\.splice/);
	});
});
