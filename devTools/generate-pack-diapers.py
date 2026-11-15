#!/usr/bin/env python3
"""Draw image-pack versions of the DoL Plus diaper sprites (v2: redrawn, not resampled).

The Aoki Utage packs (imagepacks/au, imagepacks/aumasc) draw the paper doll at 2x the base
resolution with different proportions (higher hips, longer legs) and a clean pixel-art style:
binary alpha, a 1px dark outline, a few flat grey tones, a light waistband band. They have no
diaper sprites, so without these the game would fall back to the base sprites, which sit too low
and too wide and look blocky when scaled 2x.

This script draws every diaper sprite natively at the pack resolution:
  * Silhouettes are smooth curves (shield shape for dry diapers, a rounder hanging bulge for bigger
    sizes) evaluated with 8x8 supersampling and snapped to binary alpha like the pack's garments.
  * The waistband sits on the pack waist (the pack briefs, with a small diaper rise) and matches
    the pack briefs / body outline (about 0-1px of padding). The upper part follows the hip
    curve tightly. Through the hands the sides stay inside the hip line so they never cover the
    idle hands (which the game draws under under_lower). Sag still fills out toward the bottom
    below the hands.
  * Length still follows the base sprites, mapped through a fit from briefs, boxers, boyshorts and
    long johns: bigger sizes hang lower, reaching the feet at 13 and past them at 15.
  * Per type: plastic diapers (plusdp*, plusdiaper*) get side tapes, a front landing strip, a
    padded centre panel and ruffled leg cuffs; cloth diapers (pluscd*, plusclothdiaper) a rounder
    shape, side pins and soft fold lines; pull-ups (pluspu*) a ribbed waistband, side tear seams
    and a slimmer underwear-like cut.
  * One picture per concealment size (size1-size15, plus leak<N> for overflowing): the game picks
    <diaper>/size<N> from the diaper's effective size (plusDiaperSize), and a size-N diaper has the
    same length and width in every model. Sizes up to 8 grow gently; bigger ones hang lower,
    reaching the feet at size 13 and past them at 15 (a full Hyper). Dry Hyper is size 6; at 75% full it is size 12.
  * frayed / torn / tattered add progressively more edge nicks and rips; leak<N> (overflowing) adds a
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


def torso_span(row, x0=70, x1=140):
    """Outer left..right of the torso/legs in the central band, ignoring stray far pixels."""
    xs = np.nonzero(row[x0:x1])[0]
    if not len(xs):
        return None
    xs = xs + x0
    return int(xs[0]), int(xs[-1]) + 1


def body_profile(pack):
    """Centre and half-width of the pack torso/legs per row (frame 1, classic body)."""
    a = load_alpha(os.path.join(ROOT, "imagepacks", pack, "body/base-classic.png"))
    fw = a.shape[1] // 2
    mask = a[:, :fw] > 127
    half = np.zeros(mask.shape[0])
    centre = np.full(mask.shape[0], np.nan)
    for y in range(mask.shape[0]):
        run = torso_span(mask[y])
        if run:
            half[y] = (run[1] - run[0]) / 2
            centre[y] = (run[0] + run[1]) / 2
    # centre from the waist/hips, where the torso is a single run
    cx = float(np.nanmedian(centre[80:110]))
    return cx, half


def hand_bottom(pack):
    """Lowest row of the idle hands/arms (classic), used to keep the garment inside the hip line."""
    la = load_alpha(os.path.join(ROOT, "imagepacks", pack, "body/left-arm-idle-classic.png"))
    ra = load_alpha(os.path.join(ROOT, "imagepacks", pack, "body/right-arm-idle-classic.png"))
    fw = la.shape[1] // 2
    ys = np.nonzero((la[:, :fw] > 127) | (ra[:, :fw] > 127))[0]
    return int(ys.max()) if len(ys) else 114


def safe_half(half, hands_y, pad=1.0):
    """Max half-width through the waist and hands: pack body plus at most 1px, never over the hands.
    Below the hands the seat may be a little fuller, so there is no cap there."""
    safe = np.full(half.shape[0], np.inf)
    for y in range(0, min(hands_y + 3, half.shape[0])):
        if half[y] > 0:
            safe[y] = half[y] + pad
    return safe


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


class Spec:
    pass


REGULAR = {"dp": "plusdpm", "cd": "pluscdm", "pu": "pluspum"}
# legacy sprite folders (no shop model) use a current model's size table
LEGACY_MODEL = {"plusdiaper": "plusdpm", "plusdiapersmall": "plusdps", "plusdiaperlarge": "plusdpl", "plusclothdiaper": "pluscdm", "pluspullup": "pluspum"}
MAX_SIZE = 15


def size_tables():
    """Sizes per model from the game itself (needs.js plusSagSizeTable), so the pictures drawn are
    exactly the sizes the game can ask for."""
    import json
    import subprocess

    out = subprocess.run(["node", os.path.join(ROOT, "devTools/diaper-sag-sizes.mjs"), "--json"], check=True, capture_output=True, text=True).stdout
    return json.loads(out)


def size_bottom(size, d0, feet):
    """Bottom edge of a size-N diaper: gentle growth up to size 8, then it hangs lower and lower,
    reaching the doll's feet at size 13 and past them at 15 (a full Hyper)."""
    if size <= 8:
        return d0 + (size - 3) * 4.8
    b8 = d0 + 5 * 4.8
    if size <= 13:
        return b8 + (feet - b8) * ((size - 8) / 5.0) ** 1.4
    return feet + (size - 13) * 11.5


def size_spec(cat, size, state, leak, ctx):
    """Shape for one concealment size. The same size gets the same length and width in every
    model (only the category's cut and details differ): slim, with extra size going mostly downward."""
    s = Spec()
    s.cat = cat
    s.size = size
    s.tier = size
    s.overflow = leak
    s.state = state
    s.cx = ctx["cx"]
    half = ctx["half"]
    s.T = ctx["T"][cat]
    d0 = ctx["d0"][cat]
    feet = ctx["feet"]
    s.B = min(size_bottom(size, d0, feet), half.shape[0] - 10)
    s.thick = float(np.clip((size - 1) / 6.0, 0, 1))
    big = float(np.clip((size - 8) / 7.0, 0, 1))
    hips = float(half[int(s.T) : int(s.T) + 14].max())
    # modest thickness below the hands: bigger sizes hang lower, they do not grow outward over the hands
    pad = 1.3 + 0.15 * min(size, 8) + 0.08 * max(0, size - 8)
    s.Wmax = hips + pad
    s.grow = max(0.0, s.Wmax - (hips + 1.3))
    s.drop = max(0.0, s.B - d0)
    # waistband matches the body/briefs outline, plus about 0.5px
    wy = int(round(s.T)) + 1
    waist = float(half[wy]) if 0 <= wy < len(half) and half[wy] > 0 else float(half[int(s.T) : int(s.T) + 4].max())
    s.Wtop = min(s.Wmax, waist + 0.5)
    s.safe = ctx["safe"]
    s.half = half
    s.hands_y = ctx.get("hands_y", 113)
    s.sag = min(1.0, s.drop / 40.0)
    s.tm = {"dp": 0.30, "cd": 0.34, "pu": 0.26}[cat] + (0.36 + 0.18 * big) * s.sag
    s.q = {"dp": 1.05, "cd": 1.35, "pu": 0.95}[cat] + (1.0 + 0.4 * big) * s.sag
    s.cw = {"dp": 4.0, "cd": 5.0, "pu": 3.5}[cat] + 2.0 * s.thick + 0.45 * s.grow + (0.12 - 0.04 * big) * s.drop
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
    h = np.where((t >= 0) & (t <= 1), h, -1)
    # follow the hip curve tightly from the waist through the hands (body + 0.5..1px)
    body = getattr(s, "half", None)
    hands_y = getattr(s, "hands_y", None)
    if body is not None and hands_y is not None:
        yi = np.clip(np.rint(y).astype(int), 0, len(body) - 1)
        bh = body[yi]
        # pad 0.5px at the waist, 1px by the hands
        span = max(1.0, float(hands_y) - s.T)
        pad = 0.5 + 0.5 * np.clip((y - s.T) / span, 0, 1)
        # track the body on the upper garment (not the bottom cuff): at least body+0.5, at most body+pad
        track = (bh > 0) & (h >= 0) & (y <= hands_y + 2) & (y <= s.T + 16) & (s.B > y + 6)
        lo = bh + 0.5
        hi = bh + pad
        h = np.where(track, np.clip(h, lo, hi), h)
        # below that, still never wider than body+pad through the hands
        cap = np.where((bh > 0) & (y <= hands_y + 2), bh + pad, np.inf)
        h = np.where(np.isfinite(cap) & (h >= 0), np.minimum(h, cap), h)
    # hard cap: never past body+1px through the hands (keeps the idle hands clear)
    if getattr(s, "safe", None) is not None:
        yi = np.clip(np.rint(y).astype(int), 0, len(s.safe) - 1)
        cap = s.safe[yi]
        h = np.where(np.isfinite(cap) & (h >= 0), np.minimum(h, cap), h)
    return h


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
    tone -= (10 + 14 * s.sag) * smoothstep(0.45, 1.0, t) * (s.sag > 0)
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
                    # stay on or inside the edge so tapes cannot cover the hands
                    x = xe - side * k
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
    if s.overflow:
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
        briefs_path = os.path.join(ROOT, "imagepacks", pack, "clothes/under-lower/briefs/full.png")
        size = Image.open(briefs_path).size
        H = size[1]
        briefs = bbox(load_alpha(briefs_path))
        hands_y = hand_bottom(pack)
        safe = safe_half(half, hands_y, pad=1.0)
        print(f"{pack}: body centre x={cx:.1f}, briefs waist y={briefs[1]}, hands y={hands_y}, feet y={int(np.nonzero(half > 0)[0].max())}")
        count = 0
        tables = size_tables()
        feet = float(np.nonzero(half > 0)[0].max())
        ctx = {"cx": cx, "half": half, "feet": feet, "T": {}, "d0": {}, "safe": safe, "hands_y": hands_y}
        # waistband sits on the pack waist (the briefs), with a small diaper rise
        for cat, reg in REGULAR.items():
            rise = {"dp": 1.5, "cd": 1.5, "pu": 1.0}[cat]
            ctx["T"][cat] = briefs[1] - rise
        # one length scale for every category: a size-N pull-up is as long as a size-N diaper
        d0 = ymap(bbox(load_alpha(os.path.join(BASE, REGULAR["dp"], "full.png")))[3]) - 0.5  # regular (size 3) bottom
        ctx["d0"] = {cat: d0 for cat in REGULAR}
        cache = {}

        def frame_for(cat, key, state):
            k = (cat, key, state)
            if k not in cache:
                sp = size_spec(cat, int(key[4:]), state, key.startswith("leak"), ctx)
                if sp.state == "penis":
                    sp.state = "full"
                cache[k] = draw(sp, H, H)
            return cache[k]

        for d in diaper_dirs():
            cat = category(d)
            row = tables[LEGACY_MODEL.get(d, d)]
            # folders: size<N> for every size the model can show, leak<N> for its overflowing size;
            # the root and sag1-5 (paths the base game uses) get the matching size picture, so even
            # the base-tier fallback fits the pack doll
            folders = {"": f"size{row['sizes'][0]}"}
            for n in row["sizes"]:
                folders[f"size{n}"] = f"size{n}"
            folders[f"leak{row['overflow']}"] = f"leak{row['overflow']}"
            for t in range(1, 5):
                folders[f"sag{t}"] = f"size{row['tiers'][t]}"
            folders["sag5"] = f"leak{row['overflow']}"
            for sub, key in folders.items():
                for state in STATES:
                    frame = frame_for(cat, key, state)
                    out = np.concatenate([frame, frame], axis=1)
                    dest = os.path.join(ROOT, "imagepacks", pack, "clothes/under-lower", d, sub, state + ".png")
                    os.makedirs(os.path.dirname(dest), exist_ok=True)
                    Image.fromarray(out, "RGBA").save(dest, optimize=True)
                    count += 1
        print(f"{pack}: wrote {count} sprites")


OUTLINE_TONE = 48


def _frame_split(arr):
    """Yield (x0, frame) for each  square-ish frame in a possibly two-frame strip."""
    h, w = arr.shape[0], arr.shape[1]
    if w >= int(h * 1.8):
        return [(0, arr[:, :h]), (h, arr[:, h:h * 2] if w >= h * 2 else None)]
    return [(0, arr)]


def tighten_base_waistbands():
    """If a base (no-pack) diaper's waistband is wider than the base body waist, trim it to
    body + 1px. Only the waistband and the very top of the hips are touched; sag below is kept."""
    body_path = os.path.join(ROOT, "img/body/base-classic.png")
    body = np.asarray(Image.open(body_path).convert("RGBA"))
    body_a = body[..., 3] > 127
    n = 0
    for d in diaper_dirs():
        base = os.path.join(BASE, d)
        for dirpath, _, files in os.walk(base):
            # skip generated overlays
            for fn in files:
                if not fn.endswith(".png") or fn.startswith("acc-") or fn.startswith("soil-"):
                    continue
                path = os.path.join(dirpath, fn)
                im = Image.open(path)
                arr = np.asarray(im.convert("RGBA")).copy()
                changed = False
                frames = _frame_split(arr)
                for x0, fr in frames:
                    if fr is None:
                        continue
                    # matching body frame
                    bf = body_a[:, x0:x0 + fr.shape[1]] if body_a.shape[1] >= x0 + fr.shape[1] else body_a[:, :fr.shape[1]]
                    if bf.shape[1] != fr.shape[1] or bf.shape[0] != fr.shape[0]:
                        # body and garment should both be 128 tall in frame space
                        if bf.shape[0] != fr.shape[0]:
                            continue
                    mask = fr[..., 3] > 127
                    ys = np.nonzero(mask.any(axis=1))[0]
                    if not len(ys):
                        continue
                    y0 = int(ys[0])
                    # waistband region: first ~5 rows with a real width
                    waist_rows = []
                    for y in range(y0, min(y0 + 8, mask.shape[0])):
                        xs = np.nonzero(mask[y])[0]
                        if len(xs) >= 8:
                            waist_rows.append(y)
                        if len(waist_rows) >= 5:
                            break
                    if not waist_rows:
                        continue
                    for i, y in enumerate(waist_rows):
                        bxs = np.nonzero(bf[y])[0]
                        xs = np.nonzero(mask[y])[0]
                        if not len(bxs) or not len(xs):
                            continue
                        bl, br = int(bxs[0]), int(bxs[-1]) + 1
                        # 1px pad at the top, easing to 2px on the last waist row
                        pad = 1 + int(round(i / max(1, len(waist_rows) - 1)))
                        lo, hi = bl - pad, br + pad
                        extra = (int(xs[0]) < lo) or (int(xs[-1]) + 1 > hi)
                        if not extra:
                            continue
                        # drop pixels outside the cap
                        for x in list(xs):
                            if x < lo or x >= hi:
                                fr[y, x] = 0
                                mask[y, x] = False
                                changed = True
                    if changed:
                        # rebuild a 1px outline on the touched rows and fill newly interior outline
                        ylo, yhi = waist_rows[0], waist_rows[-1]
                        for y in range(max(0, ylo - 1), min(mask.shape[0], yhi + 2)):
                            xs = np.nonzero(mask[y])[0]
                            if not len(xs):
                                continue
                            for x in xs:
                                edge = False
                                for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                                    if not (0 <= ny < mask.shape[0] and 0 <= nx < mask.shape[1] and mask[ny, nx]):
                                        edge = True
                                        break
                                if edge:
                                    fr[y, x, :3] = OUTLINE_TONE
                                    fr[y, x, 3] = 255
                                elif fr[y, x, 3] > 127 and int(fr[y, x, 0]) <= OUTLINE_TONE + 8:
                                    # old outline now inside: use a nearby padding tone
                                    fr[y, x, :3] = 150
                    if changed:
                        arr[:, x0:x0 + fr.shape[1]] = fr
                if changed:
                    Image.fromarray(arr, "RGBA").save(path, optimize=True)
                    n += 1
    print(f"base: tightened waistband on {n} sprites")


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if a != "--no-base"]
    do_base = "--no-base" not in sys.argv[1:]
    main(args or ["au", "aumasc"])
    if do_base:
        tighten_base_waistbands()
