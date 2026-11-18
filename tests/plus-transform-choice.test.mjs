/**
 * Unit tests for the Automatic / manual transformation dropdown.
 * These exercise PlusTransform directly (no compiled game required).
 */
import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
await import(pathToFileURL(join(root, "game/03-JavaScript/plus-transform-choice.js")).href);
const PlusTransform = globalThis.PlusTransform;

function vars(overrides = {}) {
	return PlusTransform.migrate({ ...overrides });
}

describe("PlusTransform choice and migration", () => {
	it("defaults missing saves to Automatic", () => {
		const state = PlusTransform.migrate({});
		assert.equal(state.transformPreferred, "automatic");
		assert.equal(state.beebuild, 0);
		assert.equal(state.dragon, 0);
		assert.equal(state.permanentTransform, 0);
		assert.equal(state.bunnybuild, 0);
		assert.equal(state.waterdragon, 0);
	});

	it("does not overwrite an existing choice during migration", () => {
		const state = PlusTransform.migrate({ transformPreferred: "cat", catbuild: 20 });
		assert.equal(state.transformPreferred, "cat");
	});

	it("treats empty or null choice as Automatic", () => {
		assert.equal(PlusTransform.migrate({ transformPreferred: null }).transformPreferred, "automatic");
		assert.equal(PlusTransform.migrate({ transformPreferred: "" }).transformPreferred, "automatic");
	});

	it("Automatic uses New World's priority (wolf before later animals)", () => {
		const state = vars({
			transformPreferred: "automatic",
			wolfbuild: 20,
			catbuild: 80,
			dragonbuild: 100,
		});
		assert.equal(PlusTransform.resolve(state), "wolf");
	});

	it("slots kept Plus TFs in the Automatic order", () => {
		assert.ok(PlusTransform.animalPriority.indexOf("okami") < PlusTransform.animalPriority.indexOf("wolf"));
		assert.ok(PlusTransform.animalPriority.indexOf("seraphim") < PlusTransform.animalPriority.indexOf("bird"));
		assert.ok(PlusTransform.animalPriority.indexOf("kitsune") < PlusTransform.animalPriority.indexOf("fox"));
		assert.ok(PlusTransform.animalPriority.indexOf("bunny") > PlusTransform.animalPriority.indexOf("fox"));
		assert.ok(PlusTransform.animalPriority.indexOf("bunny") < PlusTransform.animalPriority.indexOf("bee"));
		assert.ok(PlusTransform.animalPriority.indexOf("waterdragon") < PlusTransform.animalPriority.indexOf("dragon"));
		assert.ok(PlusTransform.animalPriority.indexOf("waterdragon") > PlusTransform.animalPriority.indexOf("bear"));
	});

	it("Automatic prefers an active okami hybrid over wolf", () => {
		const state = vars({
			transformPreferred: "automatic",
			wolfgirl: 6,
			wolfbuild: 100,
			transformationParts: { okami: { ears: "default", tail: "default", misc: "default" } },
		});
		assert.equal(PlusTransform.resolve(state), "okami");
	});

	it("lets the player pick a lower-priority qualified TF", () => {
		const state = vars({
			transformPreferred: "dragon",
			wolfbuild: 50,
			wolfgirl: 4,
			dragonbuild: 20,
			dragon: 2,
		});
		assert.equal(PlusTransform.resolve(state), "dragon");
	});

	it("falls back to Automatic when the chosen TF is no longer qualified", () => {
		const state = vars({
			transformPreferred: "bee",
			wolfbuild: 40,
			wolfgirl: 3,
			beebuild: 0,
			bee: 0,
		});
		assert.equal(PlusTransform.fallbackPreferred(state), "automatic");
		assert.equal(state.transformPreferred, "automatic");
		assert.equal(PlusTransform.resolve(state), "wolf");
	});

	it("qualifies a TF from build points even before a stage is set", () => {
		const state = vars({ catbuild: 5, cat: 0 });
		assert.equal(PlusTransform.isQualified(state, "cat"), true);
		assert.equal(PlusTransform.isQualified(vars({ catbuild: 4, cat: 0 }), "cat"), false);
		assert.equal(PlusTransform.isQualified(vars({ catbuild: 0, cat: 1 }), "cat"), true);
	});

	it("lists only currently qualified TFs in the dropdown map", () => {
		const state = vars({ wolfbuild: 10, bunnybuild: 30, dragon: 1 });
		const map = PlusTransform.listboxMap(state);
		assert.equal(map.Automatic, "automatic");
		assert.equal(map.Wolf, "wolf");
		assert.equal(map.Bunny, "bunny");
		assert.equal(map.Dragon, "dragon");
		assert.equal(map.Cat, undefined);
		assert.deepEqual(Object.keys(map), ["Automatic", "Wolf", "Bunny", "Dragon"]);
	});

	it("keeps hybrid component parts visible when that hybrid is displayed", () => {
		assert.deepEqual(PlusTransform.keepPartGroups("okami"), ["okami", "wolf"]);
		assert.deepEqual(PlusTransform.keepPartGroups("seraphim"), ["seraphim", "bird"]);
		assert.deepEqual(PlusTransform.keepPartGroups("kitsune"), ["kitsune", "fox"]);
		assert.deepEqual(PlusTransform.keepPartGroups("wolf"), ["wolf"]);
	});

	it("treats any animal stage above 0 as a physical transformation", () => {
		assert.equal(PlusTransform.hasPhysicalTransform(vars({ bee: 1 })), true);
		assert.equal(PlusTransform.hasPhysicalTransform(vars({ waterdragon: 2 })), true);
		assert.equal(PlusTransform.hasPhysicalTransform(vars()), false);
	});
});
