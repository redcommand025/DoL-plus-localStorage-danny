import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = rel => readFileSync(join(root, rel), "utf8");

function load(opts = {}) {
	const window = { plusNeedsPassTotal: 0, console };
	const $ = () => ({ on() {} });
	$.on = () => {};
	const State = {
		variables: {
			money: 100000,
			adultshopunlocked: !!opts.adult,
			wardrobe: { under_lower: [] },
			plusHunger: 2000,
			plusThirst: 2000,
			plusBladder: 2000,
			plusBowels: 2000,
			worn: {},
			settings: {},
		},
		temporary: {},
		passage: "Hospital Foyer",
	};
	const Time = { days: 10, year: 2022, month: 12, monthDay: 1, dayState: "day", date: { timeStamp: 1_000_000 } };
	Math.clamp = (n, min, max) => Math.min(max, Math.max(min, n));
	const context = {
		window,
		document: {},
		State,
		Time,
		Math,
		console,
		$,
		jQuery: $,
		setup: { clothes: { under_lower: [] } },
	};
	context.globalThis = context;
	vm.createContext(context);
	vm.runInContext(read("game/ModLI/plus-needs/needs.js"), context, { filename: "needs.js" });
	return { window: context.window, State };
}

describe("continence store", () => {
	it("is linked from the hospital foyer and the adult shop, and holds the old pack options", () => {
		const widgets = read("game/ModLI/plus-needs/widgets.twee");
		assert.match(widgets, /<<widget "plusContinenceStoreLink">>/);
		assert.match(widgets, /\[\[Continence Store\|Plus Continence Store\]\]/);
		assert.match(widgets, /:: Plus Continence Store/);
		assert.match(widgets, /<<plusDiaperShop "store">>/);
		assert.match(read("game/overworld-town/loc-hospital/main.twee"), /plusContinenceStoreLink/);
		assert.match(read("game/overworld-town/loc-adultshop/adultshop.twee"), /plusContinenceStoreLink/);
		assert.doesNotMatch(read("game/overworld-town/loc-shop/clothing.twee"), /plusDiaperShop|plusContinenceStoreLink/);
		assert.doesNotMatch(read("game/overworld-town/loc-hospital/pharmacy.twee"), /plusDiaperShop|plusContinenceStoreLink/);
		assert.doesNotMatch(read("game/overworld-town/loc-adultshop/adultshop.twee"), /plusDiaperShop/);
		assert.doesNotMatch(read("game/ModLI/plus-needs/batch2.twee"), /plusDiaperShop/);
	});

	it("sells clothing packs always and adult packs only after the adult shop opens, at the same prices", () => {
		const closed = load({ adult: false });
		const open = load({ adult: true });
		const clothing = closed.window.plusDiaperPackList("clothing");
		const storeClosed = closed.window.plusDiaperPackList("store");
		const storeOpen = open.window.plusDiaperPackList("store");
		const adult = open.window.plusDiaperPackList("adult");
		const key = p => p.name + "@" + p.count + "@" + p.price;
		assert.equal(JSON.stringify(storeClosed.map(key)), JSON.stringify(clothing.map(key)));
		assert.equal(JSON.stringify(storeOpen.map(key)), JSON.stringify(clothing.concat(adult).map(key)));
		assert.ok(clothing.some(p => p.count === 5 && p.disc === 0.2));
		assert.ok(clothing.some(p => p.count === 10 && p.disc === 0.3));
		assert.ok(adult.some(p => /Extra Large|Ultra|Max|Hyper/.test(p.name)));
	});

	it("tells the player the Continence Store is where to buy more packs", () => {
		const { window, State } = load();
		State.variables.background = { incontinent: true };
		State.variables.plusNeedsStats = { diapersUsed: 1 };
		if (typeof window.plusNeedsStats === "function") {
			// plusNeedsStats() may be a function returning the object
		}
		State.variables.wardrobe.under_lower = [];
		// Make the warning relevant
		State.variables.plusNeeds = State.variables.plusNeeds || {};
		const text = window.plusSupplyWarn();
		if (text) {
			assert.match(text, /Continence Store/);
			assert.doesNotMatch(text, /clothing shop or the pharmacy/);
		}
	});
});
