import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const src = readFileSync(fileURLToPath(new URL("../game/ModLI/plus-needs/retire-danny.js", import.meta.url)), "utf8");
const sandbox = { window: {} };
vm.runInNewContext(src, sandbox);
const { plusRetireDanny } = sandbox.window;

describe("plusRetireDanny save migration", () => {
	it("removes a trailing Danny entry without shifting earlier official NPC indices", () => {
		const official = ["Avery", "Bailey", "Sydney", "Riley", "Poppy"];
		const V = {
			NPCNameList: official.concat(["Danny"]),
			NPCName: official.map(nam => ({ nam })).concat([{ nam: "Danny", description: "Danny", love: 12 }]),
			loveInterest: { primary: "Danny", secondary: "Robin" },
			danny: { control: 1, dependency: 2 },
			dannyIntro: 1,
			dannyEv: { id: "hallway" },
			dannyTalkNode: "0",
			daily: { dannyCanteen: 1, school: { lunchEaten: 1 } },
			options: { nnpcDisplay: "Danny", autoNNPCDisplay: { danny: { slot: 1 } } },
		};
		assert.equal(plusRetireDanny(V), true);
		assert.deepEqual(V.NPCNameList, official);
		assert.deepEqual(
			V.NPCName.map(n => n.nam),
			official
		);
		assert.equal(V.NPCNameList.indexOf("Sydney"), 2);
		assert.equal(V.loveInterest.primary, "None");
		assert.equal(V.loveInterest.secondary, "Robin");
		assert.equal(V.danny, undefined);
		assert.equal(V.dannyIntro, undefined);
		assert.equal(V.dannyEv, undefined);
		assert.equal(V.daily.dannyCanteen, undefined);
		assert.deepEqual(V.daily.school, { lunchEaten: 1 });
		assert.equal(V.options.nnpcDisplay, undefined);
		assert.equal(V.options.autoNNPCDisplay.danny, undefined);
	});

	it("splices Danny from the middle only of his own slot, leaving later custom names shifted but earlier ones fixed", () => {
		const V = {
			NPCNameList: ["Robin", "Poppy", "Danny", "Custom"],
			NPCName: [{ nam: "Robin" }, { nam: "Poppy" }, { nam: "Danny" }, { nam: "Custom" }],
		};
		assert.equal(plusRetireDanny(V), true);
		assert.deepEqual(V.NPCNameList, ["Robin", "Poppy", "Custom"]);
		assert.equal(V.NPCName[0].nam, "Robin");
		assert.equal(V.NPCName[1].nam, "Poppy");
		assert.equal(V.NPCName[2].nam, "Custom");
		assert.equal(plusRetireDanny(V), false);
	});

	it("is a no-op when Danny is already absent", () => {
		const V = { NPCNameList: ["Robin", "Poppy"], NPCName: [{ nam: "Robin" }, { nam: "Poppy" }], money: 10 };
		assert.equal(plusRetireDanny(V), false);
		assert.deepEqual(V.NPCNameList, ["Robin", "Poppy"]);
		assert.equal(V.money, 10);
	});
});
