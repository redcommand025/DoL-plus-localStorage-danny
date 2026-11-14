#!/usr/bin/env python3
"""Draw the Plus diaper print overlays (the native secondary pattern layer: acc-<integrity>-<pattern>.png).

Prints are original kid-print designs (no third-party artwork): ten follow common baby-print themes
(stars, dinosaurs, paws, bunnies, crowns, crocodiles, puppies, hearts, rainbows, plaid) and five are
unique to this game (film strips and cameras, autumn leaves, waves, galaxy, polka dots).

Each overlay is drawn for one diaper picture:
  * The print lives in garment space: every pixel is mapped by its row's left/right edge and the
    garment's top/bottom to (u, v) (u -1..1 across the row, v 0..1 waistband to bottom). The print is
    sampled at (u * width / 2, v * length), with width/length growing only partly with the garment
    (power 0.4), so as a diaper sags the motifs stretch downward and bulge sideways with its silhouette
    instead of being a flat tiled clip.
  * Only the garment's padding tones are printed: the outline, seams, rips/nicks (frayed/torn/tattered),
    waistband and tapes stay as drawn. The print colour is multiplied by the diaper's own shading, so
    the bulge and highlight still show. Hard alpha, both animation frames identical.

Outputs (compile.sh regenerates the image-pack manifest):
  imagepacks/<pack>/clothes/under-lower/pluspatterns/<dp|cd|pu>/<size<N>|leak<N>>/<integrity>-<print>.png
      (one per category and size picture: within a category those pictures are identical)
  img/clothes/under-lower/<diaper>/[sag<N>/]acc-<integrity>-<print>.png   (base sprites, 5 sag tiers)

Usage: python3 devTools/generate-diaper-prints.py [--only print,...]
"""
import json
import math
import os
import subprocess
import sys

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = os.path.join(ROOT, "img/clothes/under-lower")
PACKS = ["au", "aumasc"]
INTEGRITY = ["full", "frayed", "torn", "tattered"]
SS = 4

# ---------------------------------------------------------------- prints
def C(*hexes):
    return np.array([[int(h[i : i + 2], 16) for i in (1, 3, 5)] for h in hexes], float)


def circ(x, y, cx, cy, r):
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r


def ell(x, y, cx, cy, rx, ry):
    return ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1


def rect(x, y, x0, y0, x1, y1):
    return (x >= x0) & (x <= x1) & (y >= y0) & (y <= y1)


def star(x, y, cx, cy, ro, ri, rot=0.0):
    a = np.arctan2(y - cy, x - cx) + math.pi / 2 + rot
    r = np.hypot(x - cx, y - cy)
    k = (a / (2 * math.pi / 5)) % 1.0
    t = np.abs(k - 0.5) * 2  # 1 at points, 0 between
    return r <= ri + (ro - ri) * t


def heart(x, y, cx, cy, s):
    X = (x - cx) / s
    Y = -(y - cy) / s + 0.25
    return (X * X + Y * Y - 1) ** 3 - X * X * Y**3 <= 0


def tri(x, y, ax, ay, bx, by, cx_, cy_):
    def side(px, py, qx, qy):
        return (x - qx) * (py - qy) - (px - qx) * (y - qy)

    d1, d2, d3 = side(ax, ay, bx, by), side(bx, by, cx_, cy_), side(cx_, cy_, ax, ay)
    neg = (d1 < 0) | (d2 < 0) | (d3 < 0)
    pos = (d1 > 0) | (d2 > 0) | (d3 > 0)
    return ~(neg & pos)


def put(out, mask, idx):
    sel = mask & (out < 0)
    out[sel] = idx[sel] if isinstance(idx, np.ndarray) else idx


# motif(x, y, k) -> palette index (-1 = no print); x, y in -0.5..0.5 of a cell, k = cell number
def m_stars(x, y, k):
    o = np.full(x.shape, -1)
    kind = k % 3
    put(o, (kind == 2) & circ(x, y, 0, 0, 0.2) & ~circ(x, y, 0.09, -0.06, 0.17), 2)
    put(o, (kind != 2) & star(x, y, 0, 0, 0.27, 0.12, 0.3 * (k % 2)), 0)
    put(o, (kind != 2) & (k % 2 == 1) & star(x, y, 0, 0, 0.27, 0.12, 0.3), 1)
    put(o, circ(x, y, 0.36, 0.36, 0.05), 3)
    return o


def m_dino(x, y, k):
    o = np.full(x.shape, -1)
    for sx, sy in ((-0.12, -0.17), (0.0, -0.21), (0.12, -0.17)):
        put(o, tri(x, y, sx - 0.06, sy + 0.08, sx + 0.06, sy + 0.08, sx, sy - 0.04), 2)
    body = ell(x, y, 0, 0.05, 0.27, 0.17) | circ(x, y, 0.28, -0.1, 0.11) | tri(x, y, -0.2, -0.02, -0.2, 0.14, -0.47, 0.12)
    body |= rect(x, y, -0.15, 0.12, -0.07, 0.3) | rect(x, y, 0.08, 0.12, 0.16, 0.3)
    put(o, body & ~circ(x, y, 0.31, -0.13, 0.025), np.where(k % 2 == 0, 0, 1))
    return o


def m_paws(x, y, k):
    o = np.full(x.shape, -1)
    c = np.where(k % 2 == 0, 0, 1)
    pad = ell(x, y, 0, 0.1, 0.17, 0.14)
    toes = circ(x, y, -0.18, -0.09, 0.07) | circ(x, y, -0.065, -0.19, 0.07) | circ(x, y, 0.065, -0.19, 0.07) | circ(x, y, 0.18, -0.09, 0.07)
    put(o, pad | toes, c)
    return o


def m_bunny(x, y, k):
    o = np.full(x.shape, -1)
    put(o, ell(x, y, -0.085, -0.17, 0.03, 0.11) | ell(x, y, 0.085, -0.17, 0.03, 0.11), 1)
    put(o, ell(x, y, -0.085, -0.17, 0.06, 0.17) | ell(x, y, 0.085, -0.17, 0.06, 0.17) | circ(x, y, 0, 0.11, 0.17), 0)
    put(o, circ(x, y, 0, 0.14, 0.035), 1)
    return o


def m_crowns(x, y, k):
    o = np.full(x.shape, -1)
    put(o, circ(x, y, 0, 0.15, 0.045), 1)
    band = rect(x, y, -0.25, 0.08, 0.25, 0.24)
    teeth = tri(x, y, -0.25, 0.1, -0.1, 0.1, -0.25, -0.2) | tri(x, y, -0.13, 0.1, 0.13, 0.1, 0, -0.26) | tri(x, y, 0.1, 0.1, 0.25, 0.1, 0.25, -0.2)
    put(o, band | teeth, 0)
    put(o, circ(x, y, -0.25, -0.22, 0.04) | circ(x, y, 0, -0.28, 0.04) | circ(x, y, 0.25, -0.22, 0.04), 2)
    return o


def m_croc(x, y, k):
    o = np.full(x.shape, -1)
    put(o, circ(x, y, 0.13, -0.08, 0.025), 2)
    put(o, ell(x, y, -0.02, 0.1, 0.3, 0.05), 1)
    body = ell(x, y, -0.04, 0.05, 0.33, 0.11) | ell(x, y, 0.3, 0.08, 0.17, 0.065) | circ(x, y, 0.13, -0.05, 0.06) | tri(x, y, -0.3, 0.0, -0.3, 0.12, -0.5, 0.1)
    body |= rect(x, y, -0.18, 0.1, -0.11, 0.22) | rect(x, y, 0.06, 0.1, 0.13, 0.22)
    put(o, body, 0)
    return o


def m_puppy(x, y, k):
    o = np.full(x.shape, -1)
    put(o, circ(x, y, 0, 0.07, 0.045) | circ(x, y, -0.07, -0.03, 0.025) | circ(x, y, 0.07, -0.03, 0.025), 2)
    put(o, ell(x, y, -0.2, 0.03, 0.07, 0.16) | ell(x, y, 0.2, 0.03, 0.07, 0.16), 1)
    put(o, circ(x, y, 0, 0, 0.19), np.where(k % 2 == 0, 0, 3))
    return o


def m_hearts(x, y, k):
    o = np.full(x.shape, -1)
    put(o, heart(x, y, 0, 0, 0.2), np.where(k % 2 == 0, 0, 1))
    put(o, heart(x, y, 0.37, 0.37, 0.07), 2)
    return o


def m_rainbow(x, y, k):
    o = np.full(x.shape, -1)
    put(o, circ(x, y, -0.24, 0.14, 0.09) | circ(x, y, -0.33, 0.17, 0.07) | circ(x, y, 0.24, 0.14, 0.09) | circ(x, y, 0.33, 0.17, 0.07), 3)
    r = np.hypot(x, y - 0.14)
    up = y <= 0.14
    put(o, up & (r <= 0.3) & (r > 0.23), 0)
    put(o, up & (r <= 0.23) & (r > 0.16), 1)
    put(o, up & (r <= 0.16) & (r > 0.1), 2)
    return o


def m_polka(x, y, k):
    o = np.full(x.shape, -1)
    put(o, circ(x, y, 0, 0, 0.21), k % 3)
    return o


def m_leaves(x, y, k):
    o = np.full(x.shape, -1)
    a = 0.6 * ((k * 7) % 5 - 2) / 2
    ca, sa = np.cos(a), np.sin(a)
    X, Y = x * ca + y * sa, -x * sa + y * ca
    put(o, rect(X, Y, -0.015, 0.18, 0.015, 0.32), 3)
    put(o, (np.abs(X) < 0.015) & (Y > -0.2) & (Y < 0.15), 3)
    leaf = ell(X, Y, 0, -0.02, 0.17, 0.24) | ell(X, Y, -0.12, 0.02, 0.1, 0.12) | ell(X, Y, 0.12, 0.02, 0.1, 0.12)
    put(o, leaf, k % 3)
    return o


def m_reel(x, y, k):
    o = np.full(x.shape, -1)
    if True:
        cam = (k % 3) == 2
        # little camera
        put(o, cam & circ(x, y, 0, 0.04, 0.09), 2)
        put(o, cam & circ(x, y, 0, 0.04, 0.13), 3)
        put(o, cam & (rect(x, y, -0.28, -0.12, 0.28, 0.22) | rect(x, y, -0.12, -0.2, 0.06, -0.1)), 0)
        # film strip frame
        holes = (rect(x, y, -0.5, -0.4, 0.5, -0.3) | rect(x, y, -0.5, 0.3, 0.5, 0.4)) & (np.abs(((x + 0.5) * 5) % 1 - 0.5) < 0.22)
        put(o, ~cam & holes, 2)
        put(o, ~cam & rect(x, y, -0.36, -0.22, 0.36, 0.22), 1)
        put(o, ~cam & rect(x, y, -0.5, -0.45, 0.5, 0.45), 0)
    return o


def f_plaid(tx, ty, S):
    o = np.zeros(tx.shape, int)
    gx, gy = (tx / S) % 1, (ty / S) % 1
    o[(gx < 0.22) | (gy < 0.22)] = 1
    o[(gx < 0.22) & (gy < 0.22)] = 2
    o[(np.abs(gx - 0.6) < 0.04) | (np.abs(gy - 0.6) < 0.04)] = 3
    return o


def f_waves(tx, ty, S):
    w = ty / S + 0.18 * np.sin(tx / S * 2 * math.pi)
    band = np.floor(w).astype(int) % 3
    o = band.copy()
    o[(w % 1) > 0.86] = 3
    return o


def f_galaxy(tx, ty, S):
    r = np.hypot(tx / S, ty / S)
    a = np.arctan2(ty, tx)
    swirl = np.sin(2 * a + r * 1.3) > 0.55
    o = np.where(swirl, 1, 0)
    i, j = np.floor(tx / (S * 0.34)), np.floor(ty / (S * 0.34))
    h = (np.abs(np.sin(i * 12.9898 + j * 78.233) * 43758.5453) % 1 * 97).astype(int)
    fx, fy = (tx / (S * 0.34)) % 1, (ty / (S * 0.34)) % 1
    o[(h < 14) & (np.abs(fx - 0.5) < 0.3) & (np.abs(fy - 0.5) < 0.3)] = 2
    o[(h == 3) & (np.abs(fx - 0.5) < 0.45) & (np.abs(fy - 0.5) < 0.45)] = 3
    return o


PRINTS = [
    # id, motif or field, palette, cell size (pack px), field?
    ("starry dreams", m_stars, C("#f7d55c", "#f4a6c8", "#c9b6f0", "#9fd3f5"), 12, False),
    ("dino stomp", m_dino, C("#6cc46e", "#4fb3a8", "#f2c94c"), 15, False),
    ("paw parade", m_paws, C("#9a6b4f", "#e89ab0"), 11, False),
    ("bunny meadow", m_bunny, C("#b9a3e3", "#f3a5c0"), 13, False),
    ("little crowns", m_crowns, C("#e8b923", "#d6334d", "#ffffff"), 13, False),
    ("croc smiles", m_croc, C("#4caf50", "#c5e1a5", "#ffffff"), 14, False),
    ("puppy pals", m_puppy, C("#c8a27c", "#7b5a43", "#3b2f2f", "#9e9e9e"), 13, False),
    ("candy hearts", m_hearts, C("#ef5a7a", "#f9a8c0", "#d81b60"), 11, False),
    ("rainbow clouds", m_rainbow, C("#ef6461", "#f6c85f", "#6cc5a0", "#8ec9f0"), 15, False),
    ("pastel plaid", f_plaid, C("#b3d4f2", "#f6bfd3", "#d7a6c6", "#fff3d6"), 10, True),
    ("photo reel", m_reel, C("#3b3b48", "#9fd0f0", "#f4f1e8", "#7a7a88"), 13, False),
    ("autumn leaves", m_leaves, C("#e8772e", "#c9412e", "#e9b63b", "#7b4a2a"), 13, False),
    ("ocean waves", f_waves, C("#3f7fcf", "#5fa8e6", "#2d5fa6", "#e8f6ff"), 9, True),
    ("galaxy swirl", f_galaxy, C("#46307a", "#7c5cc0", "#fff6c9", "#9fd8ff"), 14, True),
    ("polka pop", m_polka, C("#5fd3b3", "#ff8a7a", "#ffd25a"), 9, False),
]


def print_index(fn, field, tx, ty, S):
    if field:
        return fn(tx, ty, S)
    row = np.floor(ty / S).astype(int)
    off = np.where(row % 2 == 1, 0.5, 0.0)
    col = np.floor(tx / S + off).astype(int)
    x = ((tx / S + off) - col - 0.5) * 0.78  # motifs fill most of their cell
    y = (ty / S - row - 0.5) * 0.78
    k = (col * 3 + row * 5) % 7
    k = np.where(k < 0, k + 7, k)
    return fn(x, y, k)


# ---------------------------------------------------------------- mapping
def garment_geometry(alpha):
    """Row extents, top/bottom of the left frame's garment."""
    m = alpha > 0
    rows = np.nonzero(m.any(axis=1))[0]
    T, B = rows.min(), rows.max() + 1
    left = np.full(m.shape[0], np.nan)
    right = np.full(m.shape[0], np.nan)
    for y in rows:
        xs = np.nonzero(m[y])[0]
        left[y], right[y] = xs[0], xs[-1] + 1
    width = np.nanmax(right - left)
    return T, B, left, right, width


def overlay(sprite, ref, prt, scale, printable):
    """sprite: RGBA (H, 2W) sheet; ref: (length, width) of the reference (dry) garment; returns RGBA sheet."""
    pid, fn, pal, cell, field = prt
    H, W2 = sprite.shape[:2]
    W = W2 // 2
    fr = sprite[:, :W]
    a = fr[..., 3]
    g = fr[..., 0].astype(float)
    T, B, left, right, width = garment_geometry(a)
    L = max(1.0, B - T)
    Lref, Wref = ref
    Le = Lref * (L / Lref) ** 0.4
    We = Wref * (width / Wref) ** 0.4
    S = cell * scale
    sub = (np.arange(SS) + 0.5) / SS
    ys = (np.arange(H)[:, None] + sub[None, :]).ravel()
    xs = (np.arange(W)[:, None] + sub[None, :]).ravel()
    yi = np.clip(ys.astype(int), 0, H - 1)
    lf, rt = left[yi], right[yi]
    c = (lf + rt) / 2
    hw = np.maximum((rt - lf) / 2, 1)
    u = (xs[None, :] - c[:, None]) / hw[:, None]
    v = np.broadcast_to(((ys - T) / L)[:, None], u.shape)
    tx = u * We / 2 + 0.25 * S
    ty = v * Le + 0.15 * S
    tx = np.nan_to_num(tx, nan=0.0)
    idx = print_index(fn, field, tx, ty, S)
    # majority vote of supersamples per pixel
    idx = idx.reshape(H, SS, W, SS).transpose(0, 2, 1, 3).reshape(H, W, SS * SS)
    out_idx = np.full((H, W), -1)
    best = np.zeros((H, W))
    for p in range(len(pal)):
        cnt = (idx == p).sum(-1)
        sel = cnt > best
        out_idx[sel] = p
        best[sel] = cnt[sel]
    out_idx[best < SS * SS / 2] = -1
    ok = printable(g) & (a > 0) & (out_idx >= 0)
    ref_tone = np.median(g[printable(g) & (a > 0)]) if (printable(g) & (a > 0)).any() else 140
    shade = np.clip(g / ref_tone, 0.72, 1.12)
    rgb = pal[np.clip(out_idx, 0, len(pal) - 1)] * shade[..., None]
    o = np.zeros((H, W, 4), np.uint8)
    o[..., :3] = np.clip(rgb, 0, 255).astype(np.uint8)
    o[..., 3] = np.where(ok, 255, 0)
    o[~ok] = 0
    return np.concatenate([o, o], axis=1)


PACK_PRINTABLE = lambda g: (g > 106) & (g <= 170)  # padding tones (outline 74, lines 104, band 176, tapes 196 stay)
BASE_PRINTABLE = lambda g: (g > 100) & (g <= 170)  # base art: outline 80, seams 96


def load(p):
    return np.array(Image.open(p).convert("RGBA"))


def save(arr, dest):
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    Image.fromarray(arr, "RGBA").save(dest, optimize=True)


def size_table():
    out = subprocess.run(["node", os.path.join(ROOT, "devTools/diaper-sag-sizes.mjs"), "--json"], check=True, capture_output=True, text=True).stdout
    return json.loads(out)


CAT = {"plastic-backed diaper": "dp", "cloth diaper": "cd", "pull-up": "pu"}
REGULAR = {"dp": "plusdpm", "cd": "pluscdm", "pu": "pluspum"}


def main(only):
    prints = [p for p in PRINTS if not only or p[0] in only]
    table = size_table()
    n = 0
    # image packs: one overlay per category and size/leak picture
    for pack in PACKS:
        pdir = os.path.join(ROOT, "imagepacks", pack, "clothes/under-lower")
        for cat in ("dp", "cd", "pu"):
            models = [v for v, r in table.items() if CAT[r["cat"]] == cat]
            keys = {}
            for v in models:
                for z in table[v]["sizes"]:
                    keys.setdefault(f"size{z}", v)
                keys.setdefault(f"leak{table[v]['overflow']}", v)
            rs = load(os.path.join(pdir, REGULAR[cat], f"size{table[REGULAR[cat]]['sizes'][0]}", "full.png"))
            T, B, _, _, wd = garment_geometry(rs[:, : rs.shape[1] // 2, 3])
            ref = (B - T, wd)
            for key, v in sorted(keys.items()):
                for integ in INTEGRITY:
                    spr = load(os.path.join(pdir, v, key, f"{integ}.png"))
                    for prt in prints:
                        save(overlay(spr, ref, prt, 1.0, PACK_PRINTABLE), os.path.join(pdir, "pluspatterns", cat, key, f"{integ}-{prt[0].replace(' ', '-')}.png"))
                        n += 1
        print(f"{pack}: {n} overlays so far")
    # base sprites: per diaper folder, unsagged + sag1-5
    for v in table:
        dry = load(os.path.join(BASE, v, "full.png"))
        T, B, _, _, wd = garment_geometry(dry[:, : dry.shape[1] // 2, 3])
        ref = (B - T, wd)
        for sub in ["", "sag1", "sag2", "sag3", "sag4", "sag5"]:
            for integ in INTEGRITY:
                spr = load(os.path.join(BASE, v, sub, f"{integ}.png"))
                for prt in prints:
                    save(overlay(spr, ref, prt, 0.5, BASE_PRINTABLE), os.path.join(BASE, v, sub, f"acc-{integ}-{prt[0].replace(' ', '-')}.png"))
                    n += 1
    print(f"total {n} overlays")


if __name__ == "__main__":
    only = None
    if "--only" in sys.argv:
        only = sys.argv[sys.argv.index("--only") + 1].split(",")
    main(only)
