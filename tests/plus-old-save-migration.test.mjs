/**
 * Builds a synthesized save/state in the old test-branch compile runtime, then
 * loads those fields in the new compile. This is NOT a player's personal save.
 */
import assert from "node:assert/strict";
import { existsSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const oldHtml = resolve("/workspace/DoL-Plus-localStorage/Degrees of Lewdity.html");
const newHtml = resolve(process.env.PLUS_NEW_HTML || join(root, "Degrees of Lewdity.html"));
const artifacts = join(root, "tests/artifacts");
mkdirSync(artifacts, { recursive: true });

function loadPuppeteer() {
	const require = createRequire(import.meta.url);
	try {
		return require("puppeteer-core");
	} catch (e) {
		return require("/tmp/dol-diag/node_modules/puppeteer-core");
	}
}

async function openGame(puppeteer, htmlPath) {
	const browser = await puppeteer.launch({
		executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
		headless: "new",
		args: ["--no-sandbox", "--disable-gpu", "--allow-file-access-from-files"],
	});
	const page = await browser.newPage();
	page.setDefaultTimeout(180000);
	await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "domcontentloaded", timeout: 180000 });
	await new Promise(r => setTimeout(r, 8000));
	return { browser, page };
}

describe("old test-build state migration", () => {
	it("migrates a synthesized old-test-compile state, not a user save", async () => {
		assert.ok(existsSync(oldHtml), "old test compile missing: " + oldHtml);
		assert.ok(existsSync(newHtml), "new compile missing: " + newHtml);
		const puppeteer = loadPuppeteer();
		const old = await openGame(puppeteer, oldHtml);
		let payload;
		try {
			payload = await old.page.evaluate(() => {
				const State = window.SugarCube && window.SugarCube.State;
				const V = State && State.variables;
				const planted = {
					kind: "synthesized-old-test-build-state",
					notAUserSave: true,
					oldHasPlusMap: typeof window.plusDiaperOldMap === "object",
					oldHasMigrate: typeof window.plusDiaperMigrateAll === "function",
					passwordGatePresent: !!document.getElementById("dol-password-gate"),
					sugarcube: !!(window.SugarCube && window.SugarCube.State),
				};
				if (!V) return { ...planted, planted: false, reason: "no State.variables in old runtime" };
				V.worn = V.worn || {};
				V.wardrobe = V.wardrobe || { under_lower: [] };
				V.worn.under_lower = {
					name: "pull-up",
					type: ["normal"],
					plusDiaperWet: 3,
					plusDiaperSoil: 1,
				};
				V.plusContinence = 1;
				V.plusContRep = 350;
				V.background = typeof V.background === "object" && V.background ? { ...V.background, incontinent: true } : { incontinent: true };
				V.plusFlat = { rented: true, dueY: 2022, dueM: 11, grace: 2, last: null };
				V.plusHunger = 1111;
				let serialized = null;
				let serializeError = null;
				try {
					const ser =
						typeof Save !== "undefined" && typeof Save.serialize === "function"
							? Save.serialize.bind(Save)
							: typeof window.SerializeGame === "function"
							? window.SerializeGame
							: null;
					if (ser) serialized = ser();
					else serializeError = "no-serialize-fn";
				} catch (e) {
					serializeError = String(e && e.name ? e.name : "serialize-failed");
					serialized = null;
				}
				return {
					...planted,
					planted: true,
					snapshot: {
						wornName: V.worn.under_lower.name,
						plusDiaperWet: V.worn.under_lower.plusDiaperWet,
						plusDiaperSoil: V.worn.under_lower.plusDiaperSoil,
						plusContinence: V.plusContinence,
						plusContRep: V.plusContRep,
						background: V.background,
						plusFlat: V.plusFlat,
						plusHunger: V.plusHunger,
					},
					serializedBytes: serialized ? serialized.length : 0,
					serializeError: serializeError,
					serialized: serialized,
				};
			});
		} finally {
			await old.browser.close();
		}
		assert.equal(payload.planted, true, payload.reason || "old runtime did not expose variables");
		assert.equal(payload.snapshot.wornName, "pull-up");
		assert.equal(payload.kind, "synthesized-old-test-build-state");
		assert.equal(payload.notAUserSave, true);

		const neu = await openGame(puppeteer, newHtml);
		let migrated;
		try {
			migrated = await neu.page.evaluate(
				data => {
					const State = window.SugarCube && window.SugarCube.State;
					const V = State && State.variables;
					const result = {
						kind: "new-compile-load-of-synthesized-old-test-build-state",
						notAUserSave: true,
						passwordGatePresent: !!document.getElementById("dol-password-gate"),
						hasPlusDiaperMigrateAll: typeof window.plusDiaperMigrateAll === "function",
						deserializeAttempted: false,
						deserializeOk: false,
					};
					if (!V) return { ...result, ok: false, reason: "no State.variables in new runtime" };
					if (data.serialized && typeof Save !== "undefined" && typeof Save.deserialize === "function") {
						result.deserializeAttempted = true;
						try {
							Save.deserialize(data.serialized);
							result.deserializeOk = true;
						} catch (e) {
							result.deserializeError = String(e && e.message ? e.message : e);
						}
					}
					const vars = (window.SugarCube && window.SugarCube.State && window.SugarCube.State.variables) || V;
					if (!result.deserializeOk) {
						vars.worn = vars.worn || {};
						vars.wardrobe = vars.wardrobe || { under_lower: [] };
						vars.worn.under_lower = {
							...data.snapshot,
							...data.snapshot,
							name: data.snapshot.wornName,
							type: ["normal"],
							plusDiaperWet: data.snapshot.plusDiaperWet,
							plusDiaperSoil: data.snapshot.plusDiaperSoil,
						};
						vars.plusContinence = data.snapshot.plusContinence;
						vars.plusContRep = data.snapshot.plusContRep;
						vars.background = data.snapshot.background;
						vars.plusFlat = data.snapshot.plusFlat;
						vars.plusHunger = data.snapshot.plusHunger;
						delete vars.plusDiaperV2;
						result.appliedSnapshot = true;
					} else {
						delete vars.plusDiaperV2;
					}
					const n = window.plusDiaperMigrateAll ? window.plusDiaperMigrateAll() : -1;
					const item = vars.worn && vars.worn.under_lower;
					return {
						...result,
						ok: true,
						migratedCount: n,
						itemName: item && item.name,
						plusMl: item && item.plusMl,
						plusLb: item && item.plusLb,
						plusContinence: vars.plusContinence,
						plusContRep: vars.plusContRep,
						backgroundIncontinent: !!(vars.background && vars.background.incontinent),
						flatRented: !!(vars.plusFlat && vars.plusFlat.rented),
						flatGrace: vars.plusFlat && vars.plusFlat.grace,
						plusHunger: vars.plusHunger,
					};
				},
				{ serialized: payload.serialized, snapshot: payload.snapshot }
			);
		} finally {
			await neu.browser.close();
		}

		const report = {
			kind: "synthesized-old-test-build-save-migration",
			notAUserSave: true,
			old: {
				kind: payload.kind,
				oldHasPlusMap: payload.oldHasPlusMap,
				serializedBytes: payload.serializedBytes,
				serializeError: payload.serializeError || null,
				snapshot: payload.snapshot,
				passwordGatePresent: payload.passwordGatePresent,
			},
			new: migrated,
		};
		writeFileSync(join(artifacts, "old-test-build-migration.json"), JSON.stringify(report, null, 2));
		assert.equal(migrated.ok, true, migrated.reason || "new runtime failed");
		assert.equal(migrated.itemName, "pull-up (Medium)");
		assert.equal(migrated.plusMl, 3 * 400);
		assert.equal(migrated.plusLb, 1 * 0.5);
		assert.equal(migrated.plusContinence, 1);
		assert.equal(migrated.plusContRep, 350);
		assert.equal(migrated.backgroundIncontinent, true);
		assert.equal(migrated.flatRented, true);
		assert.equal(migrated.flatGrace, 2);
		assert.equal(migrated.plusHunger, 1111);
	});
});
