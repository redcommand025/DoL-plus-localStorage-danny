#!/usr/bin/env python3
"""Draw image-pack versions of the DoL Plus diaper sprites (v2: redrawn, not resampled).

The Aoki Utage packs (imagepacks/au, imagepacks/aumasc) draw the paper doll at 2x the base
resolution with different proportions (higher hips, longer legs) and a clean pixel-art style:
binary alpha, a 1px dark outline, a few flat grey tones, a light waistband band. They have no
diaper sprites, so without these the game would fall back to the base sprites, which sit too low
and too wide and look blocky when scaled 2x.

This script draws every diaper sprite natively at the pack resolution:
  * Silhouettes are smooth curves (shield shape for dry diapers, a rounder hanging bulge for sag
    tiers) evaluated with 8x8 supersampling and snapped to binary alpha like the pack's garments.
  * Size and sag progression follow the base sprites: each base sprite's bounding box is mapped
    to the pack body through a fit measured from garments both sets have (briefs, boxers,
    boyshorts, long johns), so sizes and sag tiers grow exactly as they do in the base game.
  * The waist hugs the pack body's hips (read from the pack's body sprite) plus padding thickness.
  * Per type: plastic diapers (plusdp*, plusdiaper*) get side tapes, a front landing strip, a
    padded centre panel and ruffled leg cuffs; cloth diapers (pluscd*, plusclothdiaper) a rounder
    shape, side pins and soft fold lines; pull-ups (pluspu*) a ribbed waistband, side tear seams
    and a slimmer underwear-like cut.
  * frayed / torn / tattered add progressively more edge nicks and rips; sag5 (overflowing) adds a
    few small drips. penis.png is the same garment drawn over the penis layer, exactly as in base.
  * Greyscale only (the game tints clothing), both animation frames identical.

Usage: python3 devTools/generate-pack-diapers.py [pack ...]   (default: au aumasc)
Output: imagepacks/<pack>/clothes/under-lower/<diaper>/... (compile.sh regenerates the manifest)
"""
import os
import sys
import zlib

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = os.path.join(ROOT, "img/clothes/under-lower")
FIT_GARMENTS = ["briefs", "boxers", "boyshorts", "longjohns"]
SS = 8  # supersampling per axis for the silhouette
STATES = ["full", "frayed", "torn", "tattered", "penis"]
# tones (greyscale; the game multiplies in the clothing colour)
OUTLINE = 74
LINE = 104
TONES = np.array([108, 120, 132, 144, 156, 168])
BAND = 176
TAPE = 196
STRIP = 162


def diaper_dirs():
    return sorted(d for d in os.listdir(BASE) if d.startswith("plus") and os.path.isdir(os.path.join(BASE, d)))


def category(d):
    if d.startswith("pluspu"):
        return "pu"
    if d.startswith("pluscd") or d == "plusclothdiaper":
        return "cd"
    return "dp"


def load_alpha(path):
    return np.array(Image.open(path).convert("RGBA"))[..., 3]


def bbox(alpha):
    fw = alpha.shape[1] // 2
    ys, xs = np.nonzero(alpha[:, :fw] > 0)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def measure(pack):
    """Base -> pack maps (frame-local): x linear, y quadratic, from shared garments."""
    pairs = []
    for g in FIT_GARMENTS:
        b = os.path.join(BASE, g, "full.png")
        p = os.path.join(ROOT, "imagepacks", pack, "clothes/under-lower", g, "full.png")
        if os.path.exists(b) and os.path.exists(p):
            pairs.append((bbox(load_alpha(b)), bbox(load_alpha(p))))
    if len(pairs) < 2:
        raise SystemExit(f"{pack}: not enough reference garments to fit")
    sx, ox = np.polyfit([v for b, _ in pairs for v in (b[0], b[2])], [v for _, p in pairs for v in (p[0], p[2])], 1)
    coef = np.polyfit([v for b, _ in pairs for v in (b[1], b[3])], [v for _, p in pairs for v in (p[1], p[3])], 2)
    return (lambda x: sx * x + ox), (lambda y: float(np.polyval(coef, max(y, 55.0)) - max(0.0, 55.0 - y) * np.polyval(np.polyder(coef), 55.0))), sx


def body_profile(pack):
    """Centre and half-width of the pack body per row (outer extents, frame 1)."""
    a = load_alpha(os.path.join(ROOT, "imagepacks", pack, "body/base-classic.png"))
    fw = a.shape[1] // 2
    a = a[:, :fw] > 127
    half = np.zeros(a.shape[0])
    centre = np.full(a.shape[0], np.nan)
    for y in range(a.shape[0]):
        xs = np.nonzero(a[y, 60:150])[0]
        if len(xs):
            half[y] = (xs[-1] + 1 - xs[0]) / 2
            centre[y] = 60 + (xs[0] + xs[-1] + 1) / 2
    cx = float(np.nanmedian(centre[80:130]))
    return cx, half


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


class Spec:
    pass


# relative capacity within each type (0 = smallest, ~0.2 = the regular/medium one, 1 = biggest)
CAPACITY = {
    "plusdps": 0.0, "plusdiapersmall": 0.0, "plusdpm": 0.2, "plusdiaper": 0.2, "plusdpl": 0.4, "plusdiaperlarge": 0.4,
    "plusdpxl": 0.55, "plusdpultra": 0.7, "plusdpmax": 0.85, "plusdphyper": 1.0,
    "pluscds": 0.0, "pluscdm": 0.2, "plusclothdiaper": 0.2, "pluscdl": 0.5, "pluscdxl": 0.75,
    "pluspuxs": 0.0, "pluspus": 0.1, "pluspum": 0.2, "pluspullup": 0.2, "pluspul": 0.45,
}
REGULAR = {"dp": "plusdpm", "cd": "pluscdm", "pu": "pluspum"}


def make_spec(d, rel, base_box, dry_box, reg_box, xmap, ymap, sx, cx, half, frame):
    """Shape parameters for one sprite from its base bbox, its dry bbox and the regular type's dry bbox.

    Larger-capacity types are drawn slimmer than base when dry (close to the regular diaper) but
    sag further as they fill: their sag drop is amplified and their sideways growth reduced, so the
    extra capacity shows as a deeper, lower, droopier bulge rather than bulk at the hips."""
    s = Spec()
    s.cat = category(d)
    s.size = frame
    parts = rel.split(os.sep)
    s.tier = int(parts[0][3:]) if parts[0].startswith("sag") else 0
    s.state = os.path.splitext(parts[-1])[0]
    big = float(np.clip((CAPACITY.get(d, 0.2) - 0.2) / 0.8, 0, 1))  # 0 regular and below .. 1 biggest
    s.big = big
    x0, y0, x1, y1 = base_box
    dx0, dy0, dx1, dy1 = dry_box
    # slim dry shape: only a quarter of the base size difference over the regular type is kept
    keep = 1.0 - 0.75 * big
    rx0, ry0, rx1, ry1 = reg_box
    ex0, ey0, ex1, ey1 = (rx0 + keep * (dx0 - rx0), ry0 + keep * (dy0 - ry0), rx1 + keep * (dx1 - rx1), ry1 + keep * (dy1 - ry1))
    s.cx = cx
    s.T = ymap(y0) + 0.3
    dryB = ymap(ey1) - 0.5
    # sag drop scales with the frame (2x), not with the leg-length fit, so a sagging diaper hangs
    # as far relative to the body as it does in base; bigger types hang further
    base_drop = 2.0 * (y1 - dy1)
    # big types hang much lower as they fill. The game's sag tiers are fill levels (sag1 25%,
    # sag2 50%, sag3 75%, sag4 100%, sag5 overflowing); the biggest (hyper) reaches the doll's feet
    # at 75% and hangs past them when full; other big types scale in between by capacity.
    feet = float(np.nonzero(half > 0)[0].max())
    hyper_bottom = {0: dryB, 1: dryB + 0.15 * (feet - dryB), 2: dryB + 0.45 * (feet - dryB), 3: feet, 4: feet + 22, 5: feet + 40}[s.tier]
    s.B = dryB + (1 - big) * base_drop + big * (hyper_bottom - dryB)
    s.B = min(s.B, half.shape[0] - 10)  # keep room for drips inside the sprite frame
    s.thick = float(np.clip((ey1 - ey0 - 11) / 5.0, 0, 1))  # 0 small .. 1 thick
    hips = float(half[int(s.T) : int(s.T) + 14].max())
    trim = 1.5 if s.cat == "dp" else 0.5 if s.cat == "pu" else 0.0  # base widths include tape tips etc.
    dry_target = (ex1 - ex0) * sx / 2 - trim
    pad = 1.2 + 1.6 * s.thick
    dryW = max(dry_target, hips + pad)
    full_w = max((x1 - x0) * sx / 2 - trim, hips + pad)  # base width of this tier on the pack body
    s.grow = max(0.0, full_w - dryW) * (1 - 0.5 * big)  # bigger types: more downward than outward
    s.Wmax = dryW + s.grow
    s.drop = max(0.0, s.B - dryB)
    waist = float(half[int(round(s.T)) + 1]) + pad
    s.Wtop = min(s.Wmax, waist + 0.6 + 0.15 * (1 - 0.6 * big) * s.grow)
    sag = min(1.0, s.drop / 40.0)
    s.sag = sag
    # widest at the hips, then the leg openings run in toward the crotch; sagging pushes the
    # widest point down and rounds the bottom into a hanging bulge (lower and rounder for big types)
    s.tm = {"dp": 0.30, "cd": 0.34, "pu": 0.26}[s.cat] + (0.36 + 0.18 * big) * sag
    s.q = {"dp": 1.05, "cd": 1.35, "pu": 0.95}[s.cat] + (1.0 + 0.4 * big) * sag
    s.cw = {"dp": 4.0, "cd": 5.0, "pu": 3.5}[s.cat] + 2.0 * s.thick + 0.45 * s.grow + (0.12 - 0.04 * big) * s.drop
    return s


def halfwidth(s, y):
    H = max(1e-6, s.B - s.T)
    t = (y - s.T) / H
    up = s.Wtop + (s.Wmax - s.Wtop) * np.sin(np.pi / 2 * np.clip(t / s.tm, 0, 1))
    r = np.clip((t - s.tm) / (1 - s.tm), 0, 1)
    low = s.cw + (s.Wmax - s.cw) * np.power(np.clip(1 - np.power(r, s.q), 0, 1), 1 / s.q)
    h = np.where(t <= s.tm, up, low)
    # round off the crotch bottom over the last few pixels
    e = min(0.3, (3.0 + 4.0 * s.sag) / H)
    k = np.clip((t - (1 - e)) / e, 0, 1)
    h = h * np.sqrt(np.clip(1 - k**2, 0, 1))
    return np.where((t >= 0) & (t <= 1), h, -1)


def topcurve(s, u):
    # waistband dips ~1px at the front centre and lifts slightly at the sides
    return s.T + 1.1 * (1 - np.clip(u / max(s.Wtop, 1), 0, 1) ** 2)


def silhouette(s, H, W):
    sub = (np.arange(SS) + 0.5) / SS
    ys = (np.arange(H)[:, None] + sub[None, :]).ravel()
    xs = (np.arange(W)[:, None] + sub[None, :]).ravel()
    hw = halfwidth(s, ys)[:, None]
    u = np.abs(xs[None, :] - s.cx)
    inside = (u <= hw) & (ys[:, None] >= topcurve(s, u))
    cov = inside.reshape(H, SS, W, SS).mean(axis=(1, 3))
    return cov >= 0.5


def edge_of(m):
    p = np.pad(m, 1)
    return m & ~(p[:-2, 1:-1] & p[2:, 1:-1] & p[1:-1, :-2] & p[1:-1, 2:])


def column_extents(m):
    top = np.full(m.shape[1], -1)
    bot = np.full(m.shape[1], -1)
    for x in np.nonzero(m.any(axis=0))[0]:
        ys = np.nonzero(m[:, x])[0]
        top[x], bot[x] = ys[0], ys[-1]
    return top, bot


def draw(s, H=256, W=256):
    m = silhouette(s, H, W)
    g = np.zeros((H, W))
    yy, xx = np.mgrid[0:H, 0:W] + 0.5
    hw = np.maximum(halfwidth(s, yy), 1)
    nx = np.clip((xx - s.cx) / hw, -1, 1)
    t = np.clip((yy - s.T) / max(1, s.B - s.T), 0, 1)
    # soft, rounded padding: darker toward the sides and the bottom, highlight upper-left
    tone = 150 - 30 * nx**2 - 16 * smoothstep(0.55, 1.0, t)
    tone -= (10 + 14 * s.sag) * smoothstep(0.45, 1.0, t) * (s.tier > 0)
    hl = np.exp(-(((nx + 0.42) / 0.22) ** 2) - ((t - 0.34) / 0.16) ** 2)
    tone += 22 * hl
    if s.cat == "cd":
        tone += 4
    idx = np.abs(tone[..., None] - TONES[None, None, :]).argmin(-1)
    g = TONES[idx].astype(float)

    top, bot = column_extents(m)
    cols = np.nonzero(top >= 0)[0]
    cxi = s.cx

    def put(y, x, v):
        if 0 <= y < H and 0 <= x < W and m[y, x]:
            g[y, x] = v

    # waistband
    wb = 3 if s.cat == "pu" else 2
    for x in cols:
        for k in range(1, wb + 1):
            v = BAND
            if s.cat == "pu" and (x % 2 == 0):
                v = BAND - 14  # ribbing
            put(top[x] + k, x, v)
        put(top[x] + wb + 1, x, LINE)

    # leg cuffs: gathered elastic just inside the bottom edge
    for x in cols:
        u = abs(x + 0.5 - cxi)
        if u < halfwidth(s, bot[x] + 0.5) * 0.9 and bot[x] - top[x] > wb + 6:
            if s.cat != "cd" and (x % 3 != 0):
                put(bot[x] - 2, x, LINE + 8)
            elif s.cat == "cd":
                put(bot[x] - 2, x, TONES[1])

    if s.cat == "dp":
        # absorbent core: a faint hourglass panel down the middle (never narrower than 3px a side,
        # stops short of the edges)
        for x in cols:
            for y in range(top[x] + wb + 6, bot[x] - 4):
                u = x + 0.5 - cxi
                h = halfwidth(s, y + 0.5)
                w = max(3.0, 0.38 * s.Wtop + 0.3 * (h - s.Wtop))
                if w < h - 3 and abs(abs(u) - w) < 0.5:
                    g[y, x] = max(TONES[0], g[y, x] - 10)
        # front landing strip
        lw = int(round(s.Wtop * 0.42))
        ly = int(round(s.T)) + wb + 3
        for x in range(int(cxi) - lw, int(cxi) + lw):
            for y in range(ly, ly + 3):
                put(y, x, STRIP)
            put(ly - 1, x, LINE + 16)
            put(ly + 3, x, LINE + 16)
        # side tapes: small light tabs on the hips, sticking out 1px
        th = 3 + int(round(s.thick))
        for side in (-1, 1):
            xe = int(np.floor(cxi + side * s.Wtop - (0.5 if side > 0 else -0.5)))
            y0 = int(round(s.T)) + 2
            for y in range(y0, y0 + th):
                for k in range(0, 6):
                    x = xe + side * (1 - k)
                    if 0 <= x < W:
                        m[y, x] = True
                        g[y, x] = TAPE
    elif s.cat == "cd":
        # side pins and soft folds
        for side in (-1, 1):
            xe = cxi + side * (s.Wtop - 3)
            y0 = int(round(s.T)) + 4
            for k in range(4):
                put(y0 + (k // 2), int(xe) + side * k - side, 214)
            put(y0 - 1, int(xe) - side, 90)
            # fold line from the hip toward the centre bottom
            for k in range(int((s.B - s.T) * 0.6)):
                fy = y0 + 2 + k
                fx = xe - side * (k * (s.Wtop * 0.55) / max(1, (s.B - s.T) * 0.6))
                if k % 4 != 3:
                    put(int(fy), int(fx), max(TONES[0], g[int(fy), int(fx)] - 14))
    else:
        # pull-up side seams (tear-away), dashed
        for side in (-1, 1):
            for y in range(int(round(s.T)) + wb + 2, int(s.T + (s.B - s.T) * 0.55)):
                if y % 3 == 2:
                    continue
                x = int(np.floor(cxi + side * (halfwidth(s, y + 0.5) - 3.0)))
                put(y, x, LINE + 6)
        # small front marker
        for x in range(int(cxi) - 1, int(cxi) + 1):
            put(int(round(s.T)) + wb + 4, x, 184)

    rng = np.random.default_rng(zlib.crc32(f"{s.cat}/{s.tier}/{s.state}/{s.Wmax:.1f}".encode()))
    edge = edge_of(m)
    if s.state in ("frayed", "torn", "tattered"):
        # nicks along the leg edge
        n = {"frayed": 3, "torn": 5, "tattered": 9}[s.state]
        bx = [x for x in cols if bot[x] - top[x] > 6]
        for x in rng.choice(bx, size=min(n, len(bx)), replace=False):
            m[bot[x], x] = False
            if s.state == "tattered" and rng.random() < 0.6 and bot[x] - 1 > top[x] + 4:
                m[bot[x] - 1, x] = False
    if s.state in ("torn", "tattered"):
        rips = 1 if s.state == "torn" else 3
        for _ in range(rips):
            ry = int(s.T + (s.B - s.T) * rng.uniform(0.35, 0.75))
            rx = int(cxi + rng.uniform(-0.55, 0.55) * s.Wmax)
            ln = rng.integers(3, 6)
            for k in range(ln):
                yk, xk = ry + k // 2, rx + (k if rng.random() < 0.5 else k - 1) // 1 - k // 2
                if 0 <= yk < H and 0 <= xk < W and m[yk, xk] and not edge[yk, xk]:
                    g[yk, xk] = OUTLINE
                    if 0 <= xk + 1 < W and m[yk, xk + 1]:
                        g[yk, xk + 1] = min(g[yk, xk + 1], TONES[1])
    if s.tier == 5:
        # overflowing: a few small drips under the bottom edge
        lowc = [x for x in cols if bot[x] >= bot[cols].max() - 2]
        for x in lowc[:: max(1, len(lowc) // 3)][:3]:
            ln = 2 + int(rng.integers(0, 3))
            for k in range(1, ln + 1):
                if bot[x] + k < H:
                    m[bot[x] + k, x] = True
                    g[bot[x] + k, x] = TONES[1]

    edge = edge_of(m)
    g[edge] = OUTLINE
    rgba = np.zeros((H, W, 4), np.uint8)
    rgba[..., 0] = rgba[..., 1] = rgba[..., 2] = np.clip(g, 0, 255).astype(np.uint8)
    rgba[..., 3] = np.where(m, 255, 0)
    rgba[~m] = 0
    return rgba


def main(packs):
    for pack in packs:
        xmap, ymap, sx = measure(pack)
        cx, half = body_profile(pack)
        size = Image.open(os.path.join(ROOT, "imagepacks", pack, "clothes/under-lower/briefs/full.png")).size
        H = size[1]
        print(f"{pack}: body centre x={cx}, base rows 57/71/92 -> {[round(ymap(v), 1) for v in (57, 71, 92)]}")
        count = 0
        for d in diaper_dirs():
            dry_box = bbox(load_alpha(os.path.join(BASE, d, "full.png")))
            reg_box = bbox(load_alpha(os.path.join(BASE, REGULAR[category(d)], "full.png")))
            for dirpath, _, names in os.walk(os.path.join(BASE, d)):
                for name in sorted(names):
                    if not name.endswith(".png"):
                        continue
                    rel = os.path.relpath(os.path.join(dirpath, name), os.path.join(BASE, d))
                    sub = os.path.dirname(rel)
                    # sag tier shape comes from that tier's full sprite; states share it
                    shape_src = os.path.join(BASE, d, sub, "full.png")
                    s = make_spec(d, rel, bbox(load_alpha(shape_src)), dry_box, reg_box, xmap, ymap, sx, cx, half, None)
                    if s.state == "penis":
                        s.state = "full"
                    frame = draw(s, H, H)
                    out = np.concatenate([frame, frame], axis=1)
                    dest = os.path.join(ROOT, "imagepacks", pack, "clothes/under-lower", d, rel)
                    os.makedirs(os.path.dirname(dest), exist_ok=True)
                    Image.fromarray(out, "RGBA").save(dest, optimize=True)
                    count += 1
        print(f"{pack}: wrote {count} sprites")


if __name__ == "__main__":
    main(sys.argv[1:] or ["au", "aumasc"])
