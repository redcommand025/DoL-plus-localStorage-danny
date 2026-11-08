/* Storage polyfill for no-storage mode.
 * If localStorage/sessionStorage/indexedDB throw SecurityError, fall back to in-memory. */
(function () {
  "use strict";
  function makeMemoryStorage() {
    var store = {};
    return {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
      setItem: function (k, v) { store[k] = String(v); },
      removeItem: function (k) { delete store[k]; },
      clear: function () { store = {}; },
      key: function (i) { return Object.keys(store)[i] || null; },
      get length() { return Object.keys(store).length; }
    };
  }
  try { window.localStorage.getItem("__test"); } catch (e) {
    try { Object.defineProperty(window, "localStorage", { value: makeMemoryStorage(), configurable: true }); } catch (e2) {}
  }
  try { window.sessionStorage.getItem("__test"); } catch (e) {
    try { Object.defineProperty(window, "sessionStorage", { value: makeMemoryStorage(), configurable: true }); } catch (e2) {}
  }
  try { if (window.indexedDB) window.indexedDB; } catch (e) {
    try { Object.defineProperty(window, "indexedDB", { value: null, configurable: true }); } catch (e2) {}
  }
})();
