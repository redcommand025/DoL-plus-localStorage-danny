// Static checks for the Aoki Utage / Mysterious image pack selector (headless check: tests/imagepacks.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { execFileSync } from "node:child_process";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const read = p => fs.readFileSync(path.join(root, p), "utf8");

function walk(dir, base = dir, out = []) {
	for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, e.name);
		if (e.isDirectory()) walk(full, base, out);
		else if (/\.(png|gif|jpe?g|webp)$/i.test(e.name)) out.push(path.relative(base, full).split(path.sep).join("/"));
	}
	return out;
}

function loadManifest() {
	execFileSync("node", ["devTools/generate-imagepack-manifest.cjs"], { cwd: root, stdio: "pipe" });
	const ctx = { window: {} };
	vm.runInNewContext(read("game/03-JavaScript/imagepacks-manifest.js"), ctx);
	return ctx.window.ImagePackManifest;
}

function loadPacks(manifest, options) {
	const calls = [];
	const base = { loadImage: (src, layer, ok, err) => calls.push({ src, layer, ok, err }) };
	const ctx = { window: { ImagePackManifest: manifest }, V: { options }, Renderer: { ImageLoader: base } };
	ctx.window.V = ctx.V;
	ctx.window.Renderer = ctx.Renderer;
	vm.runInNewContext(read("game/03-JavaScript/imagepacks.js"), ctx);
	return { packs: ctx.window.ImagePacks, ctx, calls };
}

test("manifest lists every image in the au, aumasc and mysterious packs", () => {
	const manifest = loadManifest();
	for (const id of ["au", "aumasc", "mysterious"]) {
		assert.ok(manifest[id], id);
		assert.equal(manifest[id].dir, `imagepacks/${id}/`);
		const listed = Object.entries(manifest[id].files).flatMap(([d, names]) => names.map(n => (d ? `${d}/${n}` : n)));
		assert.deepEqual(listed.sort(), walk(path.join(root, "imagepacks", id)).sort(), id);
	}
});

test("resolve maps only files the active packs contain, Mysterious first", () => {
	const manifest = loadManifest();
	const auFile = Object.entries(manifest.au.files).map(([d, n]) => `${d}/${n[0]}`)[0];
	const both = Object.entries(manifest.mysterious.files)
		.flatMap(([d, n]) => n.map(x => (d ? `${d}/${x}` : x)))
		.find(f => new Set(Object.entries(manifest.au.files).flatMap(([d, n]) => n.map(x => (d ? `${d}/${x}` : x)))).has(f));
	const def = loadPacks(manifest, { imagePack: "default", imagePackMysterious: false }).packs;
	assert.equal(def.resolve(`img/${auFile}`), `img/${auFile}`);
	const au = loadPacks(manifest, { imagePack: "au", imagePackMysterious: false }).packs;
	assert.equal(au.resolve(`img/${auFile}`), `imagepacks/au/${auFile}`);
	assert.equal(au.resolve("img/definitely/not/in/pack.png"), "img/definitely/not/in/pack.png");
	if (both) {
		const m = loadPacks(manifest, { imagePack: "au", imagePackMysterious: true }).packs;
		assert.equal(m.resolve(`img/${both}`), `imagepacks/mysterious/${both}`);
	}
});

test("wrapped loader passes the layer through, reports the img/ path and falls back on error", () => {
	const manifest = loadManifest();
	const auFile = Object.entries(manifest.au.files).map(([d, n]) => `${d}/${n[0]}`)[0];
	const { ctx, calls } = loadPacks(manifest, { imagePack: "au", imagePackMysterious: false });
	const layer = { scale: true, model: { height: 256 } };
	let reported;
	ctx.Renderer.ImageLoader.loadImage(
		`img/${auFile}`,
		layer,
		(s, l) => (reported = [s, l]),
		() => {}
	);
	assert.equal(calls[0].src, `imagepacks/au/${auFile}`);
	assert.equal(calls[0].layer, layer);
	calls[0].ok(calls[0].src, layer, {});
	assert.deepEqual(reported, [`img/${auFile}`, layer]);
	calls[0].err();
	assert.equal(calls[1].src, `img/${auFile}`);
});

test("options UI, save defaults and build hook are wired natively", () => {
	const opts = read("game/base-system/overlays/options.twee");
	assert.match(opts, /<<listbox "\$options\.imagePack" autoselect>>/);
	assert.match(opts, /<<option "Aoki Utage \(Fem\)" "au">>/);
	assert.match(opts, /<<option "Aoki Utage \(Masc\)" "aumasc">>/);
	assert.match(opts, /<<checkbox "\$options\.imagePackMysterious" false true autocheck>>/);
	assert.match(opts, /ImagePacks\.changed\(\)/);
	const vars = read("game/04-Variables/variables-start.twee");
	assert.match(vars, /imagePack: "default",/);
	assert.match(vars, /imagePackMysterious: false,/);
	assert.match(read("compile.sh"), /node devTools\/generate-imagepack-manifest\.cjs/);
	assert.match(read("compile.bat"), /generate-imagepack-manifest\.cjs/);
});
