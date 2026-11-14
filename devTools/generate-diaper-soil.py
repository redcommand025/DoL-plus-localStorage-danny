#!/usr/bin/env python3
"""Draw the Plus diaper soiled overlays: 9 per diaper picture (light/medium/heavy x pee/poo/both).

Garment-level discolouration, clearly soiled and dirty, but still stains on the fabric only
(no shapes, lumps or graphic detail):

  * pee  - a muted, pale straw-yellow tint, slightly deeper in the wettest area:
           light is a patch on the CROTCH only; medium spreads from the crotch down
           into the SEAT and out toward the side walls, fading at the edges; heavy
           fills the seat and the side walls fully (crotch still included), covering
           most of the padding;
  * poo  - a muddy brown discolouration on the SEAT (front view: the low, sagging bottom
           of the padding), darker toward the centre and the bottom bulge, covering most
           of the seat at heavy;
  * both - both areas; at heavy, a muddy blend where they meet, covering most of the diaper.

Edges are uneven and blotchy (noise plus irregular tide-mark rings where the stain dries).
Medium and heavy also add a faint dingy greying across the padding. The blotch pattern is
sampled in garment (u, v) with a seed that is stable across size/sag pictures of the same
garment, so it stretches with the sag instead of flickering. Intensity grows the stained
area and the strength. Only padding tones are tinted (outline, seams, rips, waistband and
tapes stay clean) and the tint keeps the diaper's shading.

Placement uses the same garment (u, v) mapping as the prints (generate-diaper-prints.py:
u across each row between the garment's edges, v waistband 0 to bottom 1).

Outputs (compile.sh regenerates the image-pack manifest):
  imagepacks/<pack>/clothes/under-lower/plussoil/<dp|cd|pu>/<size<N>|leak<N>>/<integrity>-<level>-<type>.png
  img/clothes/under-lower/<diaper>/[sag<N>/]soil-<integrity>-<level>-<type>.png
"""
import hashlib
import importlib.util
import os

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location("prints", os.path.join(HERE, "generate-diaper-prints.py"))
G = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(G)

LEVELS = ["light", "medium", "heavy"]
TYPES = ["pee", "poo", "both"]

# Pee is a muted, pale straw (more see-through than a solid yellow). Edge is the
# outer stain; core is slightly deeper in the wettest area. Poo stays muddy brown.
PEE_EDGE = np.array([214, 196, 112], float)
PEE_CORE = np.array([178, 158, 74], float)
POO_EDGE = np.array([102, 72, 34], float)
POO_CORE = np.array([52, 34, 16], float)
GRIME = np.array([90, 82, 68], float)
MUD = np.array([82, 58, 22], float)

# pee crotch ellipse (centre v, half width u, half height v) and max alpha.
# Medium/heavy also union a seat lobe (top v, half width u) and a side-wall band
# (v0, v1, half width u). Light has no seat or wall component.
PEE_CROTCH = {
    "light": (0.58, 0.54, 0.21),
    "medium": (0.57, 0.66, 0.24),
    "heavy": (0.55, 0.78, 0.28),
}
PEE_SEAT = {"light": None, "medium": (0.70, 0.68), "heavy": (0.36, 1.04)}
PEE_WALLS = {"light": None, "medium": (0.40, 0.82, 0.74), "heavy": (0.22, 1.02, 1.04)}
PEE_AMAX = {"light": 0.44, "medium": 0.56, "heavy": 0.68}
POO_SHAPE = {
    "light": (0.68, 0.74, 0.72),
    "medium": (0.50, 0.90, 0.88),
    "heavy": (0.36, 1.05, 0.96),
}
GRIME_A = {"light": 0.0, "medium": 0.14, "heavy": 0.24}


def smooth(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


def stable_seed(*parts):
    h = hashlib.md5("|".join(map(str, parts)).encode("utf-8")).digest()
    return int.from_bytes(h[:4], "little")


def _hash2(ix, iy, seed):
    ix = ix.astype(np.uint64)
    iy = iy.astype(np.uint64)
    s = np.uint64(seed & 0xFFFFFFFF)
    n = (ix * np.uint64(374761393) + iy * np.uint64(668265263) + s * np.uint64(2654435761)) & np.uint64(0xFFFFFFFF)
    n = (n ^ (n >> np.uint64(13))) & np.uint64(0xFFFFFFFF)
    n = (n * np.uint64(1274126177)) & np.uint64(0xFFFFFFFF)
    n = (n ^ (n >> np.uint64(16))) & np.uint64(0xFFFFFFFF)
    return n.astype(np.float64) / 4294967295.0


def value_noise(u, v, seed, fu, fv):
    x = (u + 3.0) * fu + (seed % 16) * 1.7
    y = (v + 1.0) * fv + ((seed // 16) % 16) * 2.3
    x0 = np.floor(x).astype(np.int64)
    y0 = np.floor(y).astype(np.int64)
    fx = smooth(x - x0)
    fy = smooth(y - y0)
    n00 = _hash2(x0, y0, seed)
    n10 = _hash2(x0 + 1, y0, seed)
    n01 = _hash2(x0, y0 + 1, seed)
    n11 = _hash2(x0 + 1, y0 + 1, seed)
    return (n00 * (1 - fx) + n10 * fx) * (1 - fy) + (n01 * (1 - fx) + n11 * fx) * fy


def fbm(u, v, seed, octaves=4, fu=3.0, fv=3.5):
    acc = 0.0
    w = 0.5
    s = 0.0
    for i in range(octaves):
        acc += w * value_noise(u, v, seed + i * 101, fu * (2**i), fv * (2**i))
        s += w
        w *= 0.5
    return acc / s


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


def noise_bank(u, v, seed):
    """Blotch fields in garment (u, v). Same seed for every size/sag of a garment, so the
    pattern stretches with the silhouette instead of flickering."""
    return {
        "pee_j1": fbm(u, v, seed + 11, 3, 2.2, 2.6),
        "pee_j2": fbm(u, v, seed + 13, 3, 2.0, 2.4),
        "pee_warp": fbm(u, v, seed + 17, 4, 3.4, 3.9),
        "pee_blotch": fbm(u, v, seed + 19, 4, 5.6, 6.1),
        "pee_ring": fbm(u, v, seed + 23, 3, 6.0, 6.5),
        "pee_dark": fbm(u, v, seed + 29, 3, 3.8, 4.2),
        "pee_mottle": fbm(u, v, seed + 31, 3, 7.0, 7.5),
        "poo_j1": fbm(u, v, seed + 41, 3, 2.1, 2.5),
        "poo_j2": fbm(u, v, seed + 43, 3, 2.3, 2.7),
        "poo_warp": fbm(u, v, seed + 47, 4, 3.3, 3.8),
        "poo_blotch": fbm(u, v, seed + 53, 4, 5.2, 5.8),
        "poo_ring": fbm(u, v, seed + 59, 3, 5.8, 6.4),
        "poo_dark": fbm(u, v, seed + 61, 3, 3.6, 4.0),
        "poo_mottle": fbm(u, v, seed + 67, 3, 6.8, 7.4),
        "grime": fbm(u, v, seed + 71, 4, 6.2, 7.0),
    }


def tide_marks(r, n_ring, level):
    rings = {
        "light": [(0.80, 0.08, 0.22)],
        "medium": [(0.56, 0.07, 0.18), (0.84, 0.09, 0.32)],
        "heavy": [(0.40, 0.06, 0.16), (0.64, 0.07, 0.24), (0.88, 0.10, 0.38)],
    }
    t = np.zeros_like(r)
    for rc, w, s in rings[level]:
        t += s * smooth(1.0 - np.abs(r - rc) / w) * (0.60 + 0.40 * n_ring)
    return np.clip(t, 0, 1)


def stain_colour(edge, core, r, n_dark, n_mottle, tide):
    centre = np.clip(smooth(np.clip(1.18 - r, 0, 1)) * (0.70 + 0.45 * n_dark), 0, 1)
    col = edge[None, None, :] * (1 - centre[..., None]) + core[None, None, :] * centre[..., None]
    dark = col * 0.58
    col = col * (1 - tide[..., None] * 0.58) + dark * (tide[..., None] * 0.58)
    col = col * (0.88 + 0.16 * n_mottle[..., None])
    return col


def pee_crotch_r(u, v, level, N):
    cv, hu, hv = PEE_CROTCH[level]
    uc = u - 0.07 * (N["pee_j1"] * 2 - 1)
    vc = v - 0.03 * (N["pee_j2"] * 2 - 1)
    p = 2.6
    return (np.abs(uc / hu) ** p + np.abs((vc - cv) / hv) ** p) ** (1.0 / p)


def pee_radius(u, v, level, N):
    """Light = crotch only; medium begins to mix into the seat and side walls;
    heavy fills the seat and walls (crotch still included)."""
    p = 2.6
    r = pee_crotch_r(u, v, level, N)
    if PEE_SEAT[level] is not None:
        top, shu = PEE_SEAT[level]
        top_w = top + 0.06 * (N["pee_j1"] * 2 - 1)
        side = (np.abs(u) / shu) * (1.0 + 0.16 * (N["pee_warp"] * 2 - 1))
        rv = np.clip((1.0 - v) / np.maximum(1.0 - top_w, 0.08), 0, 4)
        r = np.minimum(r, np.sqrt(side ** 2 + rv ** 2))
    if PEE_WALLS[level] is not None:
        v0, v1, whu = PEE_WALLS[level]
        r_u = np.abs(u) / whu
        r_v = np.maximum(np.maximum((v0 - v) / 0.12, (v - v1) / 0.10), 0.0)
        r = np.minimum(r, (np.abs(r_u) ** p + r_v ** p) ** (1.0 / p))
    if level == "light":
        # keep the light patch off the sagging seat
        r = r + 0.9 * smooth((v - 0.74) / 0.10)
    r = r * (1.0 + 0.16 * (N["pee_warp"] * 2 - 1))
    bite = 0.16 * (N["pee_blotch"] - 0.42)
    bite = bite * (0.55 + 0.45 * smooth((v - 0.28) / 0.18))
    r = r - bite
    return r, PEE_AMAX[level]


def poo_radius(u, v, level, N):
    top, hu, amax = POO_SHAPE[level]
    top_w = top + 0.07 * (N["poo_j1"] * 2 - 1) + 0.04 * (N["poo_j2"] * 2 - 1)
    side = (np.abs(u) / hu) * (1.0 + 0.20 * (N["poo_warp"] * 2 - 1))
    rv = np.clip((1.0 - v) / np.maximum(1.0 - top_w, 0.08), 0, 4)
    r = np.sqrt(side ** 2 + rv ** 2)
    r = r - 0.14 * (N["poo_blotch"] - 0.42)
    return r, amax


def region_alpha(r, amax, tide):
    a = amax * smooth((1.10 - r) / 0.30)
    a = a * (1.0 + 0.18 * tide)
    return np.clip(a, 0, 0.97)


def grime_layer(u, v, level, N):
    gmax = GRIME_A[level]
    if gmax <= 0:
        return np.zeros_like(u), np.zeros(u.shape + (3,))
    cover = smooth((v - 0.10) / 0.14) * smooth((1.04 - np.abs(u)) / 0.14)
    a = gmax * cover * (0.30 + 0.70 * N["grime"])
    a *= 0.65 + 0.35 * smooth((v - 0.22) / 0.50)
    return np.clip(a, 0, 0.35), np.broadcast_to(GRIME, u.shape + (3,)).copy()


def composite(rgb, alpha, col, a):
    out_a = a + alpha * (1 - a)
    rgb = np.where(
        out_a[..., None] > 0,
        (col * a[..., None] + rgb * (alpha * (1 - a))[..., None]) / np.maximum(out_a, 1e-6)[..., None],
        0,
    )
    return rgb, out_a


def overlay(sprite, level, typ, printable, N=None, seed=1):
    u, v, ok, shade, W = fields(sprite, printable)
    if N is None:
        N = noise_bank(u, v, seed)
    rgb = np.zeros(u.shape + (3,))
    alpha = np.zeros(u.shape)

    ga, gc = grime_layer(u, v, level, N)
    if typ in ("pee", "poo", "both") and ga.max() > 0:
        rgb, alpha = composite(rgb, alpha, gc, ga)

    pa = np.zeros_like(u)
    qa = np.zeros_like(u)
    poo_col = pee_col = None
    if typ in ("poo", "both"):
        r, amax = poo_radius(u, v, level, N)
        tide = tide_marks(r, N["poo_ring"], level)
        pa = region_alpha(r, amax, tide)
        poo_col = stain_colour(POO_EDGE, POO_CORE, r, N["poo_dark"], N["poo_mottle"], tide)
        rgb, alpha = composite(rgb, alpha, poo_col, pa)
    if typ in ("pee", "both"):
        r, amax = pee_radius(u, v, level, N)
        tide = tide_marks(r, N["pee_ring"], level)
        qa = region_alpha(r, amax, tide)
        qa = qa * smooth((v - 0.16) / 0.10)  # keep a clean band under the waistband
        if level == "medium":
            # the spread into the seat and walls is fainter than the crotch patch
            qa = qa * (0.50 + 0.50 * smooth((1.05 - pee_crotch_r(u, v, level, N)) / 0.35))
        pee_col = stain_colour(PEE_EDGE, PEE_CORE, r, N["pee_dark"], N["pee_mottle"], tide)
        if typ == "both" and poo_col is not None and level in ("medium", "heavy"):
            # blend naturally where pee and poo overlap (they share the seat from medium up)
            meet = np.minimum(qa, pa)
            ov = smooth(meet / 0.18) * smooth(meet / np.maximum(np.maximum(qa, pa), 1e-6) / 0.30)
            if level == "heavy":
                seat_ov = smooth((v - 0.48) / 0.10) * smooth(meet / 0.10)
                ov = np.clip(ov + 0.6 * seat_ov, 0, 1)
                strength, poo_d = 0.70, 0.35
            else:
                strength, poo_d = 0.40, 0.18
            mud = np.broadcast_to(MUD, pee_col.shape)
            pee_col = pee_col * (1 - ov[..., None] * strength) + mud * (ov[..., None] * strength)
            rgb = rgb * (1 - ov[..., None] * poo_d) + mud * (ov[..., None] * poo_d)
        rgb, alpha = composite(rgb, alpha, pee_col, qa)

    rgb = rgb * shade[..., None]
    a8 = np.where(ok, np.round(np.clip(alpha, 0, 1) * 255), 0).astype(np.uint8)
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
        pack_n = 0
        for cat in ("dp", "cd", "pu"):
            keys = {}
            for v in [v for v, r in table.items() if G.CAT[r["cat"]] == cat]:
                for z in table[v]["sizes"]:
                    keys.setdefault(f"size{z}", v)
                keys.setdefault(f"leak{table[v]['overflow']}", v)
            for key, v in sorted(keys.items()):
                for integ in G.INTEGRITY:
                    spr = G.load(os.path.join(pdir, v, key, f"{integ}.png"))
                    seed = stable_seed(pack, cat, integ)
                    u, vuv, ok, shade, W = fields(spr, G.PACK_PRINTABLE)
                    N = noise_bank(u, vuv, seed)
                    for lv in LEVELS:
                        for t in TYPES:
                            G.save(overlay(spr, lv, t, G.PACK_PRINTABLE, N=N, seed=seed), os.path.join(pdir, "plussoil", cat, key, f"{integ}-{lv}-{t}.png"))
                            n += 1
                            pack_n += 1
        print(f"{pack}: {pack_n} (total {n})")
    for v in table:
        for sub in ["", "sag1", "sag2", "sag3", "sag4", "sag5"]:
            for integ in G.INTEGRITY:
                spr = G.load(os.path.join(G.BASE, v, sub, f"{integ}.png"))
                seed = stable_seed("base", v, integ)
                u, vuv, ok, shade, W = fields(spr, G.BASE_PRINTABLE)
                N = noise_bank(u, vuv, seed)
                for lv in LEVELS:
                    for t in TYPES:
                        G.save(overlay(spr, lv, t, G.BASE_PRINTABLE, N=N, seed=seed), os.path.join(G.BASE, v, sub, f"soil-{integ}-{lv}-{t}.png"))
                        n += 1
    print(f"total {n}")


if __name__ == "__main__":
    main()
