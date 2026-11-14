#!/usr/bin/env python3
"""Derive Plus diaper concealment ('Can hide') from the pack sprites.

For every concealment size (and leak picture) and every lower / over_lower garment,
measure whether the diaper sprite would stick out past the clothing sprite on the
Aoki Utage pack doll (au and aumasc). A garment's Can hide is the largest size whose pack sprite stays inside the
clothing's outer silhouette (hem and sides) on both packs.

Also records diaper extents (width beyond the hips, bottom vs crotch / knees / feet,
front bulge) and the base (no-pack) sag pictures, so the size-by-fill mapping can
be checked against the art.

Usage:
  python3 devTools/diaper-concealment-table.py           # print tables, write JSON
  python3 devTools/diaper-concealment-table.py --write   # also patch needs.js
  python3 devTools/diaper-concealment-table.py --preview  # also write preview PNGs
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from collections import defaultdict
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
PACKS = ("au", "aumasc")
OUT_JSON = ROOT / "devTools/diaper-concealment-data.json"
NEEDS = ROOT / "game/ModLI/plus-needs/needs.js"
PREVIEW = Path("/workspace/diaper-pack-previews/concealment")
# Front-view "sticks out" test:
#  - hem: diaper pixels below the garment's lowest torso/leg row
#  - sides: diaper outer left/right past the garment's outer envelope
# Trouser inseam gaps are inside the envelope (they are not "sticking out").
# SIDE_SLACK absorbs a 1px outline on each sprite.
SIDE_SLACK = 2
BELOW_TOLERANCE = 10
SIDE_TOLERANCE = 24
ALPHA = 127
TORSO_X0, TORSO_X1 = 70, 140

# Keyword fallbacks, applied first-match, used only for garments we cannot measure.
# Values are filled from the median of measured items after the scan.
RULE_PATTERNS = [
    ("swim|bikini|leotard|tights|legging|thong|bloomer|bike short|cycle short|hot ?pants|booty|latex|spandex|micro|body ?suit|wetsuit|catsuit|unitard|yoga", "tight"),
    (r"robe|cloak|gown|cassock|habit", "long_over"),
    (r"coat|cape|poncho", "coat"),
    (r"overall|dungaree|jumpsuit", "overall"),
    (r"baggy|cargo|hakama|harem|kilt", "baggy"),
    (r"mini|short (cut|school) skirt|micro", "mini"),
    (r"long|maxi|ankle|floor|gown|kimono|robe|habit|cassock|ballgown|hanfu", "long"),
    (r"dress|sundress|pinafore|gothic|lolita|cheongsam|qipao", "dress"),
    (r"skirt|skort", "skirt"),
    (r"sweat|jogger|track|pyjama|pajama|lounge", "sweat"),
    (r"shorts", "shorts"),
    (r"jeans|trouser|pants|slacks|chino", "trousers"),
]


def frame1(path: Path) -> np.ndarray:
    im = Image.open(path).convert("RGBA")
    w, h = im.size
    if w >= int(h * 1.8):
        im = im.crop((0, 0, h, h))
    elif w * 2 == h * 2 and w != h:
        pass
    arr = np.asarray(im)
    # Base 128px frame -> pack 256px, nearest (how the game draws a missing pack file)
    if arr.shape[0] == 128:
        arr = np.asarray(Image.fromarray(arr).resize((256, 256), Image.NEAREST))
    return arr


def alpha(arr: np.ndarray, t: int = ALPHA) -> np.ndarray:
    return arr[..., 3] > t


def bbox(m: np.ndarray):
    ys, xs = np.where(m)
    if len(ys) == 0:
        return None
    return {
        "x0": int(xs.min()),
        "y0": int(ys.min()),
        "x1": int(xs.max()) + 1,
        "y1": int(ys.max()) + 1,
        "w": int(xs.max() - xs.min() + 1),
        "h": int(ys.max() - ys.min() + 1),
        "n": int(m.sum()),
    }


def width_at(m: np.ndarray, y: int):
    if y < 0 or y >= m.shape[0]:
        return 0, None
    xs = np.where(m[y])[0]
    if len(xs) == 0:
        return 0, None
    # prefer the torso/leg run (x 70-140), ignore idle arms on the right
    torso = xs[(xs >= 70) & (xs < 140)]
    use = torso if len(torso) else xs
    return int(use[-1] - use[0] + 1), (int(use[0]), int(use[-1]) + 1)


def landmarks(pack: str):
    body = alpha(frame1(ROOT / f"imagepacks/{pack}/body/base-classic.png"))
    briefs_path = ROOT / f"imagepacks/{pack}/clothes/under-lower/briefs/full.png"
    briefs = alpha(frame1(briefs_path)) if briefs_path.exists() else None
    H = body.shape[0]
    # crotch: first row in the torso band with two separate body runs
    crotch = None
    for y in range(80, 140):
        xs = np.where(body[y, 70:140])[0] + 70
        if len(xs) < 4:
            continue
        gaps = np.where(np.diff(xs) > 2)[0]
        if len(gaps):
            crotch = y
            break
    feet = int(np.where(body[:, 70:140].any(axis=1))[0].max())
    # hips: widest torso row above the crotch
    hip_y, hip_w, hip_span = 96, 0, (90, 120)
    top = (crotch or 110) - 4
    for y in range(80, max(81, top)):
        w, span = width_at(body, y)
        if w > hip_w:
            hip_y, hip_w, hip_span = y, w, span
    waist = int(np.where(briefs)[0].min()) if briefs is not None and briefs.any() else 89
    briefs_bottom = int(np.where(briefs)[0].max()) if briefs is not None and briefs.any() else (crotch or 102)
    # knees: halfway from crotch to feet
    knees = int(round(((crotch or 104) + feet) / 2))
    return {
        "pack": pack,
        "waist": waist,
        "briefs_bottom": briefs_bottom,
        "crotch": crotch or briefs_bottom,
        "hips": hip_y,
        "hip_w": hip_w,
        "hip_span": hip_span,
        "knees": knees,
        "feet": feet,
        "body": body,
    }


def diaper_dirs():
    base = ROOT / "imagepacks/au/clothes/under-lower"
    return sorted(d.name for d in base.iterdir() if d.is_dir() and d.name.startswith("plus"))


def size_keys():
    keys = [f"size{n}" for n in range(1, 16)]
    # leak pictures used for overflow of the same size
    return keys


def first_diaper_path(pack: str, key: str, state="full"):
    for d in diaper_dirs():
        p = ROOT / f"imagepacks/{pack}/clothes/under-lower/{d}/{key}/{state}.png"
        if p.exists():
            return p
    return None


def union_diaper_mask(pack: str, key: str):
    """Union of every category/model that has this size picture (same length, slight cut differences)."""
    acc = None
    n = 0
    for d in diaper_dirs():
        p = ROOT / f"imagepacks/{pack}/clothes/under-lower/{d}/{key}/full.png"
        if not p.exists():
            continue
        m = alpha(frame1(p))
        acc = m if acc is None else (acc | m)
        n += 1
    return acc, n


def measure_diaper_key(pack: str, key: str, lm: dict):
    m, n = union_diaper_mask(pack, key)
    if m is None:
        return None
    b = bbox(m)
    hip_w, hip_span = width_at(m, lm["hips"])
    crotch_w, crotch_span = width_at(m, lm["crotch"])
    body_hip, _ = width_at(lm["body"], lm["hips"])
    body_crotch, _ = width_at(lm["body"], lm["crotch"])
    beyond_hips = (hip_w - body_hip) / 2 if hip_w else 0
    # front bulge: extra half-width at the crotch vs the body
    bulge = (crotch_w - body_crotch) / 2 if crotch_w else 0
    bottom = b["y1"] - 1
    return {
        "key": key,
        "models": n,
        "y0": b["y0"],
        "bottom": bottom,
        "x0": b["x0"],
        "x1": b["x1"],
        "width": b["w"],
        "hip_w": hip_w,
        "crotch_w": crotch_w,
        "beyond_hips": round(beyond_hips, 2),
        "bulge": round(bulge, 2),
        "below_crotch": bottom - lm["crotch"],
        "below_knees": bottom - lm["knees"],
        "below_feet": bottom - lm["feet"],
        "rel": (
            "above crotch" if bottom < lm["crotch"]
            else "at crotch" if abs(bottom - lm["crotch"]) <= 1
            else "above knees" if bottom < lm["knees"] - 2
            else "at knees" if abs(bottom - lm["knees"]) <= 3
            else "above feet" if bottom < lm["feet"] - 2
            else "at feet" if abs(bottom - lm["feet"]) <= 2
            else "past feet"
        ),
    }


def parse_clothes(slot: str):
    path = ROOT / f"game/base-clothing/clothing-{slot.replace('_', '-')}.js"
    if not path.exists():
        return []
    text = path.read_text()
    items = []
    # Each ClothesItem / object: capture name and variable (and optional skirt/short flags)
    for m in re.finditer(r"new ClothesItem\(\{([\s\S]*?)\n\t\t\}\)", text):
        block = m.group(1)
        name = re.search(r'\bname:\s*"([^"]+)"', block)
        var = re.search(r'\bvariable:\s*"([^"]+)"', block)
        if not name or not var:
            continue
        typ = re.search(r"\btype:\s*\[([^\]]*)\]", block)
        types = []
        if typ:
            types = re.findall(r'"([^"]+)"', typ.group(1))
        items.append({
            "name": name.group(1),
            "variable": var.group(1),
            "slot": slot,
            "types": types,
            "skirt": bool(re.search(r"\bskirt:\s*1", block)),
            "short": bool(re.search(r"\bshort:\s*1", block)),
        })
    return items


def sprite_kind(path: Path) -> str:
    """True pack sprites are 256px tall (usually 512×256, two frames). A 128px-tall
    file in the pack folder is a copied base sprite and does not sit on the pack doll."""
    with Image.open(path) as im:
        return "pack" if im.size[1] >= 200 else "base"


def garment_path(pack: str, slot: str, variable: str):
    slot_dir = "over-lower" if slot == "over_lower" else "lower"
    pack_p = ROOT / f"imagepacks/{pack}/clothes/{slot_dir}" / variable / "full.png"
    base_p = ROOT / f"img/clothes/{slot_dir}" / variable / "full.png"
    if pack_p.exists() and sprite_kind(pack_p) == "pack":
        return pack_p, "pack"
    if base_p.exists():
        return base_p, "base"
    if pack_p.exists():
        return pack_p, "base"
    return None, None


def torso_mask(m: np.ndarray) -> np.ndarray:
    out = m.copy()
    out[:, :TORSO_X0] = False
    out[:, TORSO_X1:] = False
    return out


def garment_hem(g: np.ndarray):
    """Lowest and highest opaque rows in the torso/leg column."""
    ys = np.where(g[:, TORSO_X0:TORSO_X1].any(axis=1))[0]
    if len(ys) == 0:
        return None, None
    return int(ys.min()), int(ys.max())


def outer_span(m: np.ndarray, y: int):
    xs = np.where(m[y, TORSO_X0:TORSO_X1])[0]
    if len(xs) == 0:
        return None
    return int(xs[0] + TORSO_X0), int(xs[-1] + TORSO_X0)


def coverage(diaper: np.ndarray, garment: np.ndarray) -> dict:
    """Whether the diaper stays inside the garment's outer silhouette.

    Pixels in a trouser inseam (transparent in the front view, but between the
    outer left and right of the legs) are treated as covered. A diaper only
    sticks out if it hangs below the hem or is wider than the garment at a row.
    """
    d = torso_mask(diaper)
    g = torso_mask(garment)
    waist, hem = garment_hem(g)
    if hem is None:
        return {"below": 0, "side": 0, "covered": False, "hem": None}
    below = int(d[hem + 1 :].sum())
    side = 0
    for y in range(0, hem + 1):
        xs = np.where(d[y])[0]
        if len(xs) == 0:
            continue
        dl, dr = int(xs[0]), int(xs[-1])
        gs = outer_span(g, y)
        if gs is None:
            # Row the garment does not occupy: count a waistband peeking above the waist.
            if waist is not None and y < waist:
                side += int(xs.size)
            continue
        gl, gr = gs
        side += max(0, (gl - SIDE_SLACK) - dl) + max(0, dr - (gr + SIDE_SLACK))
    return {
        "below": below,
        "side": int(side),
        "covered": below <= BELOW_TOLERANCE and side <= SIDE_TOLERANCE,
        "hem": hem,
    }


def can_hide_for(item: dict, size_masks: dict, lms: dict) -> dict:
    """Largest size covered on every pack. None if the garment has no sprite."""
    results = {}
    hems = {}
    source = None
    for pack in PACKS:
        path, src = garment_path(pack, item["slot"], item["variable"])
        if path is None or src != "pack":
            results[pack] = None
            if path is not None and source is None:
                source = src
            continue
        source = "pack"
        g = alpha(frame1(path))
        _, hem = garment_hem(g)
        hems[pack] = hem
        hidden = []
        first_visible = None
        detail = []
        for n in range(1, 16):
            key = f"size{n}"
            dmask = size_masks[pack].get(key)
            if dmask is None:
                continue
            cov = coverage(dmask, g)
            detail.append({"size": n, "below": cov["below"], "side": cov["side"], "covered": cov["covered"]})
            if cov["covered"]:
                hidden.append(n)
            elif first_visible is None:
                first_visible = n
        results[pack] = {
            "src": src,
            "hem": hems[pack],
            "n": int(g.sum()),
            "hide": max(hidden) if hidden else 0,
            "first_visible": first_visible if first_visible is not None else (16 if hidden else 1),
            "detail": detail,
        }
    # Drop empty or stub pack files (e.g. aumasc virgin killer is blank; aumasc
    # gothic skirt is a 409px stub vs au's 6138px garment).
    usable = {p: r for p, r in results.items() if r and r.get("n", 0) >= 200}
    if len(usable) == 2:
        ns = {p: usable[p]["n"] for p in usable}
        lo, hi = min(ns, key=ns.get), max(ns, key=ns.get)
        if ns[lo] < 0.25 * ns[hi]:
            usable.pop(lo)
    vals = [usable[p]["hide"] for p in PACKS if p in usable]
    if not vals:
        # Pack file present but empty (sweater lower pieces, froggy): nothing covers the diaper.
        any_file = any(results.get(p) is not None or source == "pack" for p in PACKS)
        if source == "pack":
            return {"name": item["name"], "variable": item["variable"], "slot": item["slot"], "hide": 0, "source": "pack-empty", "packs": results, "hem_au": None, "hem_aumasc": None}
        return {"name": item["name"], "variable": item["variable"], "slot": item["slot"], "hide": None, "source": source, "packs": results}
    # Stricter of the usable packs
    hide = int(min(vals))
    return {
        "name": item["name"],
        "variable": item["variable"],
        "slot": item["slot"],
        "hide": hide,
        "source": source,
        "hem_au": hems.get("au"),
        "hem_aumasc": hems.get("aumasc"),
        "packs": {p: {k: v[k] for k in ("src", "hem", "n", "hide", "first_visible") if k in v} for p, v in results.items() if v},
    }


def measure_base_sag():
    """Base (no-pack) diaper sag pictures, 128px, for a typical plastic Hyper folder."""
    out = {}
    body_path = ROOT / "img/body/base-classic.png"
    # base body may live under img/body or similar
    body = None
    for cand in [
        ROOT / "img/body/base-classic.png",
        ROOT / "img/body/base.png",
        ROOT / "img/img/body/base-classic.png",
    ]:
        if cand.exists():
            body = alpha(frame1(cand)) if cand.stat().st_size else None
            break
    # Use plusdphyper sag tiers
    folder = ROOT / "img/clothes/under-lower/plusdphyper"
    rows = []
    for key, label in [("", "dry")] + [(f"sag{i}", f"sag{i}") for i in range(1, 6)]:
        p = folder / key / "full.png" if key else folder / "full.png"
        if not p.exists():
            continue
        arr = frame1(p)  # will upscale 128 -> 256
        m = alpha(arr)
        b = bbox(m)
        rows.append({
            "tier": label,
            "path": str(p.relative_to(ROOT)),
            "y0": b["y0"],
            "bottom": b["y1"] - 1,
            "width": b["w"],
            "x0": b["x0"],
            "x1": b["x1"],
        })
    out["plusdphyper"] = rows
    # also medium
    folder = ROOT / "img/clothes/under-lower/plusdpm"
    rows = []
    if folder.exists():
        for key, label in [("", "dry")] + [(f"sag{i}", f"sag{i}") for i in range(1, 6)]:
            p = folder / key / "full.png" if key else folder / "full.png"
            if not p.exists():
                continue
            b = bbox(alpha(frame1(p)))
            rows.append({"tier": label, "bottom": b["y1"] - 1, "width": b["w"], "y0": b["y0"]})
        out["plusdpm"] = rows
    return out


def median_int(vals):
    if not vals:
        return None
    s = sorted(vals)
    return int(round((s[(len(s) - 1) // 2] + s[len(s) // 2]) / 2))


def fallback_rules(measured: list):
    """Median Can hide of measured items whose name matches each keyword pattern."""
    rules = []
    claimed = set()
    for pat, tag in RULE_PATTERNS:
        rx = re.compile(pat, re.I)
        hits = [m for m in measured if m["name"] not in claimed and m["hide"] is not None and rx.search(m["name"])]
        if not hits:
            continue
        for m in hits:
            claimed.add(m["name"])
        vals = [m["hide"] for m in hits]
        v = median_int(vals)
        rules.append({"pattern": pat, "hide": v, "tag": tag, "n": len(vals), "min": min(vals), "max": max(vals)})
    lower_vals = [m["hide"] for m in measured if m["slot"] == "lower" and m["hide"] is not None]
    over_vals = [m["hide"] for m in measured if m["slot"] == "over_lower" and m["hide"] is not None]
    defaults = {
        "lower": median_int(lower_vals) if lower_vals else 4,
        "over_lower": median_int(over_vals) if over_vals else 13,
    }
    return rules, defaults


def apply_fallback(name: str, slot: str, rules: list, defaults: dict) -> tuple:
    nl = name.lower()
    for r in rules:
        if re.search(r["pattern"], nl, re.I):
            return r["hide"], r["tag"]
    return (defaults["over_lower"] if slot == "over_lower" else defaults["lower"]), "default"


def patch_needs_js(items: dict, rules: list, defaults: dict):
    text = NEEDS.read_text()
    # Build JS table
    item_lines = ",\n".join(f'\t\t{json.dumps(k)}: {v}' for k, v in sorted(items.items(), key=lambda kv: kv[0].lower()))
    rule_lines = ",\n".join(
        f'\t\t[/{r["pattern"]}/, {r["hide"]}]'
        for r in rules
    )
    # Rules are first-match fallbacks for names not in the measured item table.
    block = f"""	/* plus-concealment-table:start */
	/* Generated by devTools/diaper-concealment-table.py from the pack sprites. Do not edit by hand;
	 * re-run the script after changing diaper or clothing art. Can hide = the largest concealment
	 * size whose pack sprite stays inside the garment silhouette on both au and aumasc\n	 * (hem slack {BELOW_TOLERANCE} px, side slack {SIDE_SLACK} px, side budget {SIDE_TOLERANCE} px). */
	window.plusConcealTable = {{
		items: {{
{item_lines}
		}},
		rules: [
{rule_lines}
		],
		defaults: {{ lower: {defaults["lower"]}, over_lower: {defaults["over_lower"]} }},
	}};
	/* plus-concealment-table:end */"""

    start = "/* plus-concealment-table:start */"
    end = "/* plus-concealment-table:end */"
    if start in text and end in text:
        text = text[: text.index(start)] + block + text[text.index(end) + len(end) :]
    else:
        # Replace the old CONCEAL_OVERRIDE / CONCEAL_RULES constants with the generated table,
        # and keep plusConcealOf but point it at the table.
        old = "\tconst CONCEAL_OVERRIDE = {"
        idx = text.find(old)
        if idx < 0:
            raise SystemExit("could not find CONCEAL_OVERRIDE in needs.js")
        # cut through the end of CONCEAL_RULES array
        rules_end = text.find("\t];\n\twindow.plusConcealOf", idx)
        if rules_end < 0:
            raise SystemExit("could not find end of CONCEAL_RULES")
        text = text[:idx] + block + "\n" + text[rules_end + 3 :]  # keep window.plusConcealOf

    # Update plusConcealOf to use the table
    old_fn = """	window.plusConcealOf = function (it, slot) {
		if (!it || !it.name || !Array.isArray(it.type) || it.type.includes("naked")) return -1;
		if (Number.isFinite(it.plusConceal)) return it.plusConceal;
		slot = slot || it.slot;
		if (slot === "under_lower" || slot === "under_upper") return 0;
		const n = it.name.toLowerCase();
		if (n in CONCEAL_OVERRIDE) return CONCEAL_OVERRIDE[n];
		for (const [re, v, only] of CONCEAL_RULES) if (re.test(n) && (!only || slot === "over_lower")) return v;
		return slot === "over_lower" ? 13 : 4;
	};"""
    new_fn = """	window.plusConcealOf = function (it, slot) {
		if (!it || !it.name || !Array.isArray(it.type) || it.type.includes("naked")) return -1;
		if (Number.isFinite(it.plusConceal)) return it.plusConceal;
		slot = slot || it.slot;
		if (slot === "under_lower" || slot === "under_upper") return 0;
		const T = window.plusConcealTable || {};
		const n = it.name;
		if (T.items && Object.prototype.hasOwnProperty.call(T.items, n)) return T.items[n];
		const nl = n.toLowerCase();
		if (T.items && Object.prototype.hasOwnProperty.call(T.items, nl)) return T.items[nl];
		for (const row of T.rules || []) {
			const re = row[0],
				v = row[1],
				only = row[2];
			if (re.test(nl) && (!only || slot === "over_lower")) return v;
		}
		const def = T.defaults || { lower: 4, over_lower: 13 };
		return slot === "over_lower" ? def.over_lower : def.lower;
	};"""
    if old_fn not in text and "plusConcealTable" in text and "window.plusConcealOf = function" in text:
        # already patched or we'll replace the function if the override version is gone
        if "T.items" not in text:
            # replace existing plusConcealOf body after we inserted the table
            m = re.search(r"\twindow\.plusConcealOf = function \(it, slot\) \{[\s\S]*?\n\t\};", text)
            if not m:
                raise SystemExit("could not find plusConcealOf to replace")
            text = text[: m.start()] + new_fn + text[m.end() :]
    elif old_fn in text:
        text = text.replace(old_fn, new_fn)
    else:
        m = re.search(r"\twindow\.plusConcealOf = function \(it, slot\) \{[\s\S]*?\n\t\};", text)
        if not m:
            raise SystemExit("could not find plusConcealOf")
        text = text[: m.start()] + new_fn + text[m.end() :]

    NEEDS.write_text(text)
    print("patched", NEEDS.relative_to(ROOT))


def make_previews(measured: list, size_info: dict, lms: dict):
    PREVIEW.mkdir(parents=True, exist_ok=True)
    lm = lms["au"]
    body = lm["body"]
    # pick representative garments
    wanted = [
        ("shorts", "shorts"),
        ("school skirt", "school skirt"),
        ("jeans", "jeans"),
        ("long skirt", "long skirt"),
        ("evening gown skirt", "evening gown"),
        ("bathrobe bottom", "bathrobe"),
        ("gym bloomers", "gym bloomers"),
        ("leather miniskirt", "leather miniskirt"),
    ]
    by_name = {m["name"]: m for m in measured if m["hide"] is not None}

    def load_diaper(n):
        p = first_diaper_path("au", f"size{n}")
        return frame1(p) if p else None

    def panel(item, size, garment_arr, diaper_arr, caption):
        # grey body, tinted diaper, garment on top; crop hip-to-below-feet
        H, W = 256, 256
        canvas = np.full((H, W, 3), 250.0)
        bm = body
        # only torso/legs
        torso = np.zeros_like(bm)
        torso[:, 70:140] = bm[:, 70:140]
        canvas[torso] = (175, 175, 175)
        if diaper_arr is not None:
            da = diaper_arr[..., 3] > ALPHA
            da[:, :70] = False
            da[:, 140:] = False
            tint = diaper_arr[..., :3] / 255.0 * np.array([210, 225, 245])
            a = (diaper_arr[..., 3:4] / 255.0)
            # only where mask
            for c in range(3):
                canvas[..., c] = np.where(da, canvas[..., c] * (1 - a[..., 0]) + tint[..., c] * a[..., 0] * 255, canvas[..., c])
        if garment_arr is not None:
            ga = garment_arr[..., 3] > ALPHA
            ga[:, :70] = False
            ga[:, 140:] = False
            # slightly darken garment so the hem is clear
            gcol = garment_arr[..., :3].astype(float)
            a = garment_arr[..., 3:4] / 255.0
            for c in range(3):
                canvas[..., c] = np.where(ga, canvas[..., c] * (1 - a[..., 0]) + gcol[..., c] * a[..., 0], canvas[..., c])
        # crop: x 60-150, y 70 to max(feet+8, diaper bottom+4, 220)
        y1 = min(256, max(lm["feet"] + 10, (bbox(alpha(diaper_arr))["y1"] + 6 if diaper_arr is not None else 200), 200))
        crop = canvas[70:y1, 60:150].clip(0, 255).astype(np.uint8)
        im = Image.fromarray(crop).resize((crop.shape[1] * 3, crop.shape[0] * 3), Image.NEAREST)
        sheet = Image.new("RGB", (im.width, im.height + 36), (255, 255, 255))
        sheet.paste(im, (0, 36))
        ImageDraw.Draw(sheet).text((6, 10), caption, fill=(30, 30, 30))
        return sheet

    tiles = []
    for name, label in wanted:
        m = by_name.get(name)
        if not m:
            print("preview skip (not measured)", name)
            continue
        hide = m["hide"]
        path, _ = garment_path("au", m["slot"], m["variable"])
        if not path:
            continue
        garr = frame1(path)
        # last hidden and first visible
        sizes = []
        if hide <= 0:
            sizes = [(1, "visible")]
        elif hide >= 15:
            sizes = [(15, "hidden")]
        else:
            sizes = [(hide, "hidden"), (hide + 1, "visible")]
        for sz, state in sizes:
            darr = load_diaper(sz)
            cap = f"{label}  size {sz}  Can hide {hide}  ({state})"
            tile = panel(m, sz, garr, darr, cap)
            fn = PREVIEW / f"{m['variable']}-size{sz}-{state}.png"
            tile.save(fn)
            tiles.append((fn, tile, f"{label} sz{sz} ({state})"))
            print("wrote", fn)

    # contact sheet
    if tiles:
        w = max(t.size[0] for _, t, _ in tiles)
        h = max(t.size[1] for _, t, _ in tiles)
        cols = 2
        rows = (len(tiles) + cols - 1) // cols
        sheet = Image.new("RGB", (cols * w + 16, rows * h + 16), (255, 255, 255))
        for i, (_, t, _) in enumerate(tiles):
            sheet.paste(t, ((i % cols) * w + 8, (i // cols) * h + 8))
        sheet.save(PREVIEW / "contact-sheet.png")
        print("wrote", PREVIEW / "contact-sheet.png")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true", help="patch needs.js with the derived table")
    ap.add_argument("--preview", action="store_true", help="write preview PNGs")
    ap.add_argument("--json-only", action="store_true")
    ap.add_argument("--output", type=Path, help="write measurements JSON here (default: devTools/diaper-concealment-data.json)")
    args = ap.parse_args()
    out_json = args.output if args.output else OUT_JSON

    lms = {p: landmarks(p) for p in PACKS}
    print("Landmarks:")
    for p, lm in lms.items():
        print(f"  {p}: waist={lm['waist']} crotch={lm['crotch']} hips={lm['hips']} (w={lm['hip_w']}) knees={lm['knees']} feet={lm['feet']}")

    # diaper extents
    size_masks = {p: {} for p in PACKS}
    size_rows = {p: [] for p in PACKS}
    for p in PACKS:
        for n in range(1, 16):
            key = f"size{n}"
            m, cnt = union_diaper_mask(p, key)
            if m is not None:
                size_masks[p][key] = m
            row = measure_diaper_key(p, key, lms[p])
            if row:
                size_rows[p].append(row)
        leak = measure_diaper_key(p, "leak15", lms[p])
        if leak:
            size_rows[p].append(leak)
            m, _ = union_diaper_mask(p, "leak15")
            if m is not None:
                size_masks[p]["leak15"] = m

    print("\nDiaper extents (au):")
    print(f"{'key':8} {'bottom':>6} {'rel':14} {'width':>5} {'beyond_hips':>12} {'bulge':>6} {'vs crotch':>9} {'vs knees':>8} {'vs feet':>8}")
    for r in size_rows["au"]:
        print(f"{r['key']:8} {r['bottom']:6} {r['rel']:14} {r['width']:5} {r['beyond_hips']:12} {r['bulge']:6} {r['below_crotch']:9} {r['below_knees']:8} {r['below_feet']:8}")

    base_sag = measure_base_sag()
    print("\nBase (no-pack) sag pictures, scaled to 256px:")
    for folder, rows in base_sag.items():
        print(" ", folder, ", ".join(f"{r['tier']}: bottom {r['bottom']} w {r['width']}" for r in rows))

    # clothes
    clothes = parse_clothes("lower") + parse_clothes("over_lower")
    print(f"\nParsed {len(clothes)} lower/over_lower items")
    measured = []
    for it in clothes:
        if it["name"] == "naked" or "naked" in it["types"]:
            continue
        measured.append(can_hide_for(it, size_masks, lms))

    ok = [m for m in measured if m["hide"] is not None]
    missing = [m for m in measured if m["hide"] is None]
    print(f"Measured {len(ok)} pack sprites, no pack-native sprite {len(missing)}")

    # summary of main garments
    main_names = [
        "shorts", "school shorts", "school skirt", "jeans", "baggy jeans", "trousers",
        "school trousers", "long skirt", "micro pleated skirt", "gym bloomers",
        "yoga pants", "cycle shorts", "overall bottoms", "witch skirt", "evening gown skirt",
        "bathrobe bottom", "kimono skirt", "patient gown skirt", "tights",
        "wide leg trousers", "leather miniskirt", "shortalls", "pyjama bottoms",
        "bike shorts", "maid skirt",
    ]
    print("\nMain garments (old values were name-based guesses):")
    print(f"{'name':28} {'Can hide':>8} {'hem au':>7} {'source':>7}")
    by = {m["name"]: m for m in ok}
    for n in main_names:
        m = by.get(n)
        if not m:
            hits = [x for x in measured if n.lower() == x["name"].lower() or n.lower() in x["name"].lower()]
            # do not let "jeans" steal "baggy jeans" when that name is absent
            hits = [x for x in hits if x["name"].lower() != "jeans" or n.lower() == "jeans"]
            if not hits:
                print(f"{n:28}  (no such item)")
                continue
            m = hits[0]
            extra = f"  [{m['source']}]"
        else:
            extra = f"  [{m.get('source')}]"
        print(f"{m['name']:28} {m['hide']:8} {str(m.get('hem_au')):7} {m['source'] or '':>16}")

    rules, defaults = fallback_rules(ok)
    # Over-lower pack samples are rare; keep a long default if we have none.
    # over_lower has almost no pack samples (froggy is an empty lower piece). Keep a long default.
    over_ok = [m for m in ok if m["slot"] == "over_lower" and m.get("source") == "pack" and m["hide"] > 0]
    if defaults["over_lower"] is None or not over_ok:
        defaults["over_lower"] = 13
    if defaults["lower"] is None:
        defaults["lower"] = 4
    print("\nFallback rules (median of pack-measured names, first match):")
    for r in rules:
        print(f"  /{r['pattern']}/ -> {r['hide']}  (n={r['n']}, {r['min']}..{r['max']}) {r['tag']}")
    print("  defaults", defaults)

    for m in missing:
        hide, tag = apply_fallback(m["name"], m["slot"], rules, defaults)
        m["hide"] = hide
        m["fallback"] = tag
        m["source"] = (m["source"] or "none") + "/fallback"
    print(f"Assigned keyword fallbacks to {len(missing)} items without a pack-native sprite")

    items = {m["name"]: m["hide"] for m in measured if m["hide"] is not None}
    data = {
        "method": "outer-silhouette",
        "side_slack": SIDE_SLACK,
        "below_tolerance": BELOW_TOLERANCE,
        "side_tolerance": SIDE_TOLERANCE,
        "landmarks": {p: {k: v for k, v in lm.items() if k != "body"} for p, lm in lms.items()},
        "sizes": size_rows,
        "base_sag": base_sag,
        "items": items,
        "measured": [{k: m[k] for k in m if k != "packs"} | {"packs": m.get("packs")} for m in measured],
        "rules": rules,
        "defaults": defaults,
        "missing": [m["name"] for m in measured if m.get("hide") is None],
        "fallback_items": {m["name"]: {"hide": m["hide"], "fallback": m.get("fallback"), "source": m.get("source")} for m in missing},
    }
    out_json.parent.mkdir(parents=True, exist_ok=True)
    out_json.write_text(json.dumps(data, indent=2))
    print("\nwrote", out_json)

    if args.write:
        patch_needs_js(items, rules, defaults)
    if args.preview:
        make_previews(measured, size_rows, lms)
    if not args.json_only:
        # distribution
        dist = defaultdict(int)
        for m in ok:
            dist[m["hide"]] += 1
        print("\nCan hide distribution:")
        for k in range(0, 16):
            if dist[k]:
                print(f"  {k:2d}: {dist[k]}")


if __name__ == "__main__":
    main()
