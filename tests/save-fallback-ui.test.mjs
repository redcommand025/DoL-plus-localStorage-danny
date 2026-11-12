/* Static regression checks for the saves menu under blocked storage.
 * The headless end-to-end check is tests/save-ui-fallback.mjs (needs the compiled HTML). */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = p => readFileSync(join(root, p), "utf8");
const head = read("devTools/head.html");
const fallbackScript = head.slice(head.indexOf("<script>") + 8, head.indexOf("</script>"));

function runFallback({ idbOpen }) {
	const listeners = {};
	const mem = {};
	const storage = {
		getItem: k => (k in mem ? mem[k] : null),
		setItem: (k, v) => (mem[k] = String(v)),
		removeItem: k => delete mem[k],
		clear() {},
		key: () => null,
		length: 0,
	};
	const win = {
		localStorage: storage,
		sessionStorage: storage,
		indexedDB: { open: idbOpen, deleteDatabase() {} },
		addEventListener: (t, f) => (listeners[t] = f),
		navigator: {},
	};
	win.window = win;
	const ctx = vm.createContext({ window: win, navigator: {}, DOMException, Object, String, setTimeout });
	vm.runInContext(fallbackScript, ctx);
	return { win, listeners, ctx };
}

describe("saves menu storage fallback", () => {
	it("the saves menu renders the fallback notice and re-applies an IndexedDB denial before the list", () => {
		const saves = read("game/base-system/overlays/saves.twee");
		const notice = saves.indexOf("<<storageFallbackSaves>>");
		const apply = saves.indexOf("DoLStorageFallback.applyToIdb()");
		const list = saves.indexOf('<div id="saveList">');
		assert.ok(notice > 0 && apply > notice && list > apply);
		const widget = read("game/base-system/overlays/saves-storage-fallback.twee");
		assert.match(widget, /<<widget "storageFallbackSaves">>/);
		assert.match(widget, /SugarCube\.Save\.export\(/);
		assert.match(widget, /importSave\(this\.files\)/);
		assert.match(widget, /lost when this tab is closed/);
	});

	it("an asynchronous indexedDB.open() failure is reported as denied and turns idb.active off", () => {
		let req;
		const { win, ctx } = runFallback({ idbOpen: () => (req = {}) });
		assert.equal(win.DoLStorageFallback.indexedDB, "native");
		assert.equal(win.DoLStorageFallback.memoryOnly, false);
		const idb = { active: true };
		vm.runInContext("var idb = __idb;", Object.assign(ctx, { __idb: idb }));
		req.onerror({ preventDefault() {} });
		assert.equal(win.DoLStorageFallback.indexedDB, "denied");
		assert.equal(idb.active, false);
	});

	it("a working IndexedDB is left alone", () => {
		let req;
		const { win } = runFallback({ idbOpen: () => (req = { result: { close() {} } }) });
		req.onsuccess();
		assert.equal(win.DoLStorageFallback.indexedDB, "native");
		assert.equal(win.DoLStorageFallback.active(), false);
	});

	it("the uncaught idb.init rejection from a denied database is suppressed", () => {
		const { win, listeners } = runFallback({ idbOpen: () => ({}) });
		let prevented = false;
		listeners.unhandledrejection({
			reason: new DOMException("The user denied permission to access the database.", "UnknownError"),
			preventDefault: () => (prevented = true),
		});
		assert.ok(prevented);
		assert.equal(win.DoLStorageFallback.indexedDB, "denied");
	});

	it("the first fallback report survives the second head.html copy", () => {
		assert.match(fallbackScript, /window\.DoLStorageFallback \|\| \(window\.DoLStorageFallback =/);
	});
});
