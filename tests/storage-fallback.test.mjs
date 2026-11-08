import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const head = readFileSync(join(root, "devTools/head.html"), "utf8");
const start = head.indexOf("<script>");
const end = head.indexOf("</script>");
const fallbackSource = head.slice(start + "<script>".length, end);

class SecurityError extends Error {
	constructor(message) {
		super(message);
		this.name = "SecurityError";
	}
}

function denyGetter(target, name) {
	Object.defineProperty(target, name, {
		configurable: true,
		enumerable: true,
		get() {
			throw new SecurityError(`Failed to read the '${name}' property`);
		},
		set() {
			throw new SecurityError(`Failed to read the '${name}' property`);
		},
	});
}

function workingStorage() {
	const mem = {};
	return {
		getItem(k) {
			return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null;
		},
		setItem(k, v) {
			mem[k] = String(v);
		},
		removeItem(k) {
			delete mem[k];
		},
		clear() {
			for (const key of Object.keys(mem)) delete mem[key];
		},
		key(i) {
			return Object.keys(mem)[i] || null;
		},
		get length() {
			return Object.keys(mem).length;
		},
	};
}

function workingIDB() {
	return {
		open() {
			return { onerror: null, onsuccess: null, result: {} };
		},
		deleteDatabase() {
			return { onerror: null, onsuccess: null };
		},
	};
}

function runFallback(setup) {
	const window = {
		Object,
		__plusneedsMem: undefined,
		plusneedsMemoryStore: undefined,
		navigator: {},
	};
	setup(window);
	window.window = window;
	vm.runInNewContext(fallbackSource, window);
	return window;
}

function storageWorks(storage) {
	storage.setItem("__t", "1");
	const ok = storage.getItem("__t") === "1";
	storage.removeItem("__t");
	return ok;
}

describe("storage fallback", () => {
	it("replaces throwing localStorage/sessionStorage getters and disables IDB", () => {
		const window = runFallback(w => {
			denyGetter(w, "localStorage");
			denyGetter(w, "sessionStorage");
			w.indexedDB = {
				open() {
					throw new Error("The user denied permission to access the database.");
				},
			};
		});
		assert.equal(storageWorks(window.localStorage), true);
		assert.equal(storageWorks(window.sessionStorage), true);
		assert.equal(window.indexedDB, null);
		window.localStorage.setItem("verifiedAge", "true");
		assert.equal(window.localStorage.getItem("verifiedAge"), "true");
	});

	it("disables IDB when native Web Storage is unavailable even if IDB looks present", () => {
		const window = runFallback(w => {
			denyGetter(w, "localStorage");
			denyGetter(w, "sessionStorage");
			let opened = false;
			w.indexedDB = {
				open() {
					opened = true;
					return { onerror: null, onsuccess: null };
				},
			};
			w._opened = () => opened;
		});
		assert.equal(window.indexedDB, null);
		assert.equal(typeof window.localStorage.getItem, "function");
	});

	it("disables IDB when the factory getter throws", () => {
		const window = runFallback(w => {
			w.localStorage = workingStorage();
			w.sessionStorage = workingStorage();
			denyGetter(w, "indexedDB");
		});
		assert.equal(window.indexedDB, null);
		assert.equal(storageWorks(window.localStorage), true);
	});

	it("disables IDB when open throws synchronously", () => {
		const window = runFallback(w => {
			w.localStorage = workingStorage();
			w.sessionStorage = workingStorage();
			w.indexedDB = {
				open() {
					throw new Error("The user denied permission to access the database.");
				},
			};
		});
		assert.equal(window.indexedDB, null);
	});

	it("leaves a working IndexedDB factory alone when Web Storage works", () => {
		const idb = workingIDB();
		const window = runFallback(w => {
			w.localStorage = workingStorage();
			w.sessionStorage = workingStorage();
			w.indexedDB = idb;
		});
		assert.equal(window.indexedDB, idb);
		assert.equal(typeof window.indexedDB.open, "function");
	});

	it("falls back when Storage.prototype methods throw", () => {
		function ThrowingStorage() {}
		ThrowingStorage.prototype.getItem = function () {
			throw new SecurityError("denied");
		};
		ThrowingStorage.prototype.setItem = function () {
			throw new SecurityError("denied");
		};
		ThrowingStorage.prototype.removeItem = function () {
			throw new SecurityError("denied");
		};
		ThrowingStorage.prototype.clear = function () {
			throw new SecurityError("denied");
		};
		ThrowingStorage.prototype.key = function () {
			throw new SecurityError("denied");
		};
		const ls = new ThrowingStorage();
		const window = runFallback(w => {
			w.Storage = ThrowingStorage;
			w.localStorage = ls;
			w.sessionStorage = new ThrowingStorage();
			w.indexedDB = workingIDB();
		});
		assert.equal(storageWorks(window.localStorage), true);
		assert.equal(window.indexedDB, null);
	});
});
