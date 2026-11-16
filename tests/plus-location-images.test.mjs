import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = rel => readFileSync(join(root, rel), "utf8");

function loadLocations() {
	const sandbox = {
		setup: {},
		V: { location: "home", bus: "" },
		Weather: { isSnow: false, bloodMoon: false, lightsOn: false },
		Time: { dayState: "day" },
		random: () => 0,
		console,
	};
	vm.createContext(sandbox);
	vm.runInContext(read("game/03-JavaScript/weather/01-setup/location-images.js"), sandbox);
	sandbox.setup.locations = {
		cliff: { location_name: "town", bus_name: "cliff" },
		high: { location_name: "town" },
		oxford: { location_name: "town" },
		barb: { location_name: "town" },
	};
	return sandbox;
}

function collectImages(cfg, folder, acc = []) {
	if (!cfg || typeof cfg !== "object") return acc;
	if (typeof cfg.image === "string") {
		const img = cfg.image;
		acc.push(img.startsWith("img/") ? img : `img/misc/locations/${folder}/${img}`);
	}
	if (Array.isArray(cfg)) {
		for (const v of cfg) collectImages(v, folder, acc);
	} else {
		for (const [k, v] of Object.entries(cfg)) {
			if (k === "folder" || k === "condition" || v == null || typeof v !== "object") continue;
			collectImages(v, folder, acc);
		}
	}
	return acc;
}

describe("location images resolve to real files", () => {
	it("maps flat and hotel, and inherits town art for bus streets instead of falling back to home", () => {
		const { setup, V } = loadLocations();
		V.location = "flat";
		assert.equal(setup.Locations.get(), "flats");
		assert.equal(setup.LocationImages.flats.folder, "flats");
		V.location = "hotel";
		assert.equal(setup.Locations.get(), "town");
		V.location = "cliff";
		assert.equal(setup.Locations.get(), "town");
		V.location = "unknown_place";
		assert.equal(setup.Locations.get(), "home");
		assert.ok(existsSync(join(root, "img/misc/locations/town/driving-car.png")));
		assert.ok(existsSync(join(root, "img/misc/locations/town/parked-car.png")));
		assert.ok(existsSync(join(root, "img/misc/locations/town/cat.png")));
		assert.equal(existsSync(join(root, "img/misc/locations/home/driving-car.png")), false);
	});

	it("has a real image file for every layer in every LocationImages config", () => {
		const { setup } = loadLocations();
		const missing = [];
		for (const [key, cfg] of Object.entries(setup.LocationImages)) {
			assert.ok(cfg.folder, key + " has no folder");
			const paths = collectImages(cfg, cfg.folder);
			assert.ok(paths.length > 0, key + " has no images");
			for (const rel of paths) {
				if (!existsSync(join(root, rel))) missing.push(key + ": " + rel);
			}
		}
		assert.deepEqual(missing, []);
	});

	it("resolves every Plus location to a config whose layer files exist", () => {
		const { setup, V } = loadLocations();
		const plusLocations = ["flat", "flats", "home", "town", "hotel", "hospital", "school", "dance_studio", "cafe", "beach", "spa", "forest", "farm", "cliff"];
		const missing = [];
		for (const loc of plusLocations) {
			V.location = loc;
			const key = setup.Locations.get();
			const cfg = setup.LocationImages[key];
			assert.ok(cfg, loc + " resolved to missing config " + key);
			for (const rel of collectImages(cfg, cfg.folder)) {
				if (!existsSync(join(root, rel))) missing.push(loc + " -> " + key + ": " + rel);
			}
		}
		assert.deepEqual(missing, []);
	});

	it("captures the folder from the same config the layers use", () => {
		const src = read("game/03-JavaScript/weather/03-canvas/02-lib/00-effects/effects-location.js");
		assert.match(src, /const locationConfig = this\.location/);
		assert.match(src, /const capturedPath = /);
		assert.match(src, /const basePath = capturedPath/);
		assert.match(src, /locationConfig\[this\.key\]\.deepCopy\(\)/);
	});
});
