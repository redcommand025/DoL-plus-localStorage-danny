#!/usr/bin/env python3
"""Draw the Plus diaper soiled overlays: 9 per diaper picture (light/medium/heavy x pee/poo/both).

Garment-level discolouration only, subtle and non-graphic:
  * pee  - a translucent yellow tint on the CROTCH: centred across the padding, in its middle-lower part,
           growing in area and strength with intensity;
  * poo  - a soft olive-brown discolouration on the SEAT: these sprites are front views, so the seat is
           drawn as the low, sagging bottom of the padding, rising from the bottom edge with intensity and
           slightly darker towards the bottom (bulge shading); no shapes or detail;
  * both - both areas (pee over poo).
Placement uses the same garment (u, v) mapping as the prints (generate-diaper-prints.py: u across each
row between the garment's edges, v waistband 0 to bottom 1), so the stains stretch and drop with the sag.
Only padding tones are tinted (outline, seams, rips, waistband and tapes stay clean) and the tint keeps
the diaper's shading. Soft alpha edges.

Outputs (compile.sh regenerates the image-pack manifest):
  imagepacks/<pack>/clothes/under-lower/plussoil/<dp|cd|pu>/<size<N>|leak<N>>/<integrity>-<level>-<type>.png
  img/clothes/under-lower/<diaper>/[sag<N>/]soil-<integrity>-<level>-<type>.png
"""
import importlib.util
import os

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location("prints", os.path.join(HERE, "generate-diaper-prints.py"))
G = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(G)

LEVELS = ["light", "medium", "heavy"]
TYPES = ["pee", "poo", "both"]
PEE = np.array([226, 196, 70], float)
POO = np.array([122, 104, 58], float)
# per level: pee (centre v, half width u, half height v, max alpha); poo (top v of seat, half width u, max alpha)
PEE_SHAPE = {"light": (0.66, 0.32, 0.17, 0.36), "medium": (0.64, 0.48, 0.26, 0.42), "heavy": (0.62, 0.68, 0.36, 0.54)}
POO_SHAPE = {"light": (0.80, 0.42, 0.38), "medium": (0.68, 0.58, 0.45), "heavy": (0.55, 0.78, 0.58)}


def smooth(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


def fields(sprite, printable):
    H, W2 = sprite.shape[:2]
    W = W2 // 2
    fr = sprite[:, :W]
    a = fr[..., 3]
    g = fr[..., 0].astype(float)
    T, B, left, right, _ = G.garment_geometry(a)
    L = max(1.0, B - T)
    ys = np.arange(H) + 0.5
    xs = np.arange(W) + 0.5
    lf, rt = left[np.clip(ys.astype(int), 0, H - 1)], right[np.clip(ys.astype(int), 0, H - 1)]
    c = (lf + rt) / 2
    hw = np.maximum((rt - lf) / 2, 1)
    u = np.nan_to_num((xs[None, :] - c[:, None]) / hw[:, None], nan=9.0)
    v = np.broadcast_to(((ys - T) / L)[:, None], u.shape)
    ok = printable(g) & (a > 0)
    ref = np.median(g[ok]) if ok.any() else 140
    shade = np.clip(g / ref, 0.72, 1.12)
    return u, v, ok, shade, W


def pee_alpha(u, v, level):
    cv, hu, hv, amax = PEE_SHAPE[level]
    r = np.sqrt((u / hu) ** 2 + ((v - cv) / hv) ** 2)
    return amax * smooth((1.0 - r) / 0.45)


def poo_alpha(u, v, level):
    top, hu, amax = POO_SHAPE[level]
    edge = 1 - (u / hu) ** 2 - ((np.maximum(0, 1 - v)) / (1 - top)) ** 2 * 0.0
    up = smooth((v - top) / 0.12)
    side = smooth((1 - np.abs(u) / hu) / 0.35)
    deep = 0.8 + 0.2 * smooth((v - top) / max(0.05, 1 - top))  # slightly stronger toward the bottom bulge
    return amax * up * side * deep * (edge > -9)


def overlay(sprite, level, typ, printable):
    u, v, ok, shade, W = fields(sprite, printable)
    rgb = np.zeros(u.shape + (3,))
    alpha = np.zeros(u.shape)
    if typ in ("poo", "both"):
        pa = poo_alpha(u, v, level)
        darker = 1 - 0.18 * smooth((v - POO_SHAPE[level][0]) / 0.4)  # bulge shading
        rgb = POO[None, None, :] * darker[..., None]
        alpha = pa
    if typ in ("pee", "both"):
        qa = pee_alpha(u, v, level)
        out_a = qa + alpha * (1 - qa)
        rgb = np.where(out_a[..., None] > 0, (PEE * qa[..., None] + rgb * (alpha * (1 - qa))[..., None]) / np.maximum(out_a, 1e-6)[..., None], 0)
        alpha = out_a
    rgb = rgb * shade[..., None]
    a8 = np.where(ok, np.round(alpha * 255), 0).astype(np.uint8)
    o = np.zeros(u.shape + (4,), np.uint8)
    o[..., :3] = np.clip(rgb, 0, 255).astype(np.uint8)
    o[..., 3] = a8
    o[a8 == 0] = 0
    return np.concatenate([o, o], axis=1)


def main():
    root = G.ROOT
    table = G.size_table()
    n = 0
    for pack in G.PACKS:
        pdir = os.path.join(root, "imagepacks", pack, "clothes/under-lower")
        for cat in ("dp", "cd", "pu"):
            keys = {}
            for v in [v for v, r in table.items() if G.CAT[r["cat"]] == cat]:
                for z in table[v]["sizes"]:
                    keys.setdefault(f"size{z}", v)
                keys.setdefault(f"leak{table[v]['overflow']}", v)
            for key, v in sorted(keys.items()):
                for integ in G.INTEGRITY:
                    spr = G.load(os.path.join(pdir, v, key, f"{integ}.png"))
                    for lv in LEVELS:
                        for t in TYPES:
                            G.save(overlay(spr, lv, t, G.PACK_PRINTABLE), os.path.join(pdir, "plussoil", cat, key, f"{integ}-{lv}-{t}.png"))
                            n += 1
        print(f"{pack}: {n}")
    for v in table:
        for sub in ["", "sag1", "sag2", "sag3", "sag4", "sag5"]:
            for integ in G.INTEGRITY:
                spr = G.load(os.path.join(G.BASE, v, sub, f"{integ}.png"))
                for lv in LEVELS:
                    for t in TYPES:
                        G.save(overlay(spr, lv, t, G.BASE_PRINTABLE), os.path.join(G.BASE, v, sub, f"soil-{integ}-{lv}-{t}.png"))
                        n += 1
    print(f"total {n}")


if __name__ == "__main__":
    main()
