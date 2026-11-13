#!/usr/bin/env python3
"""Generate image-pack versions of the DoL Plus diaper sprites.

The Aoki Utage packs (imagepacks/au, imagepacks/aumasc) draw the paper doll at twice the base
resolution with different proportions (higher hips, longer legs). Their packs have no diaper sprites,
so the game falls back to img/clothes/under-lower/plus*/, which then sits too low and too wide on
the pack body.

This script refits every base diaper sprite to a pack's body:
  * The fit is measured from garments that exist in both img/ and the pack (briefs, boxers,
    boyshorts, swim shorts, long johns): x is a linear fit of their left/right edges, y is a
    piecewise-linear map through their top/bottom edges (so the waistband lands on the pack's
    waistband and the leg openings on the pack's thighs).
  * Each base sprite is resampled through that map with 4x4 supersampling, its alpha hardened and
    its silhouette re-outlined with a 1px (pack-resolution) outline in the base outline grey, which
    matches the packs' thin dark outlines. Sprites stay greyscale so the game's colour tint works.
  * Every state (full/torn/tattered/frayed/penis) and sag level is generated; both animation frames.

Usage: python3 devTools/generate-pack-diapers.py [pack ...]   (default: au aumasc)
Output: imagepacks/<pack>/clothes/under-lower/<diaper>/... (re-run devTools/generate-imagepack-manifest.cjs)
"""
import os
import sys

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = os.path.join(ROOT, "img/clothes/under-lower")
FIT_GARMENTS = ["briefs", "boxers", "boyshorts", "longjohns"]
OUTLINE = 80  # grey of the base diaper outline
SS = 4  # supersampling per axis


def diaper_dirs():
    return sorted(d for d in os.listdir(BASE) if d.startswith("plus") and os.path.isdir(os.path.join(BASE, d)))


def load(path):
    return np.array(Image.open(path).convert("RGBA")).astype(np.float64)


def bbox(a, frame=0):
    h, w = a.shape[:2]
    fw = w // 2
    ys, xs = np.nonzero(a[:, frame * fw : (frame + 1) * fw, 3] > 0)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def measure(pack):
    """Return (x map coefficients, y anchor arrays, size ratio) for base -> pack (frame-local coords)."""
    pairs = []
    for g in FIT_GARMENTS:
        b = os.path.join(BASE, g, "full.png")
        p = os.path.join(ROOT, "imagepacks", pack, "clothes/under-lower", g, "full.png")
        if os.path.exists(b) and os.path.exists(p):
            pairs.append((bbox(load(b)), bbox(load(p))))
    if len(pairs) < 2:
        raise SystemExit(f"{pack}: not enough reference garments to fit")
    xb = [v for b, _ in pairs for v in (b[0], b[2])]
    xp = [v for _, p in pairs for v in (p[0], p[2])]
    sx, ox = np.polyfit(xb, xp, 1)
    yb_pts = [v for b, _ in pairs for v in (b[1], b[3])]
    yp_pts = [v for _, p in pairs for v in (p[1], p[3])]
    coef = np.polyfit(yb_pts, yp_pts, 2)
    # the quadratic is used from row 55 down (the diapers start at row 57); above that, continue
    # linearly with its slope at row 55 so the map stays monotonic
    yb = np.arange(55.0, 129.0, 0.25)
    yp = np.polyval(coef, yb)
    slope = np.polyval(np.polyder(coef), 55.0)
    yb = np.concatenate([[0.0], yb])
    yp = np.concatenate([[yp[0] - 55.0 * slope], yp])
    if np.any(np.diff(yp) <= 0):
        raise SystemExit(f"{pack}: vertical fit is not monotonic: {coef}")
    resid = np.array(yp_pts) - np.polyval(coef, yb_pts)
    print(f"{pack}: y fit {coef.round(4).tolist()}, max residual {np.abs(resid).max():.1f}px")
    return (sx, ox), (yb.astype(float), yp.astype(float)), pairs


def warp(src, out_size, xmap, ymap):
    """Resample a two-frame base sheet into a pack-sized two-frame sheet."""
    sx, ox = xmap
    yb, yp = ymap
    H, W = src.shape[:2]
    fw = W // 2
    OW, OH = out_size
    ofw = OW // 2
    out = np.zeros((OH, OW, 4))
    sub = (np.arange(SS) + 0.5) / SS
    ox_grid = (np.arange(ofw)[:, None] + sub[None, :]).ravel()  # ofw*SS
    oy_grid = (np.arange(OH)[:, None] + sub[None, :]).ravel()
    bx = (ox_grid - ox) / sx  # inverse x map (pixel-centre coords)
    by = np.interp(oy_grid, yp, yb)
    ix = np.floor(bx).astype(int)
    iy = np.floor(by).astype(int)
    vx = (ix >= 0) & (ix < fw)
    vy = (iy >= 0) & (iy < H)
    ixc = np.clip(ix, 0, fw - 1)
    iyc = np.clip(iy, 0, H - 1)
    for f in range(2):
        frame = src[:, f * fw : (f + 1) * fw]
        samp = frame[iyc[:, None], ixc[None, :]]  # (OH*SS, ofw*SS, 4)
        samp = samp * (vy[:, None] & vx[None, :])[..., None]
        a = samp[..., 3:4] / 255.0
        prem = np.concatenate([samp[..., :3] * a, a], axis=-1)
        prem = prem.reshape(OH, SS, ofw, SS, 4).mean(axis=(1, 3))
        cov = prem[..., 3]
        rgb = np.where(cov[..., None] > 0, prem[..., :3] / np.maximum(cov[..., None], 1e-9), 0)
        alpha = (cov >= 0.5).astype(float)
        opaque = alpha > 0
        # 1px outline on the silhouette edge (4-neighbourhood), in the base outline grey
        pad = np.pad(opaque, 1)
        edge = opaque & ~(pad[:-2, 1:-1] & pad[2:, 1:-1] & pad[1:-1, :-2] & pad[1:-1, 2:])
        rgb[edge] = np.minimum(rgb[edge], OUTLINE)
        frame_out = np.concatenate([rgb, alpha[..., None] * 255], axis=-1)
        frame_out[~opaque] = 0
        out[:, f * ofw : (f + 1) * ofw] = frame_out
    return np.clip(np.round(out), 0, 255).astype(np.uint8)


def main(packs):
    for pack in packs:
        ref = Image.open(os.path.join(ROOT, "imagepacks", pack, "clothes/under-lower/briefs/full.png"))
        xmap, ymap, pairs = measure(pack)
        print(f"{pack}: x' = {xmap[0]:.3f}*x + {xmap[1]:.2f}; base rows 57/60/70/81 -> {np.round(np.interp([57, 60, 70, 81], *ymap), 1).tolist()}")
        count = 0
        for d in diaper_dirs():
            for dirpath, _, names in os.walk(os.path.join(BASE, d)):
                for name in sorted(names):
                    if not name.endswith(".png"):
                        continue
                    rel = os.path.relpath(os.path.join(dirpath, name), BASE)
                    src = load(os.path.join(dirpath, name))
                    out = warp(src, ref.size, xmap, ymap)
                    dest = os.path.join(ROOT, "imagepacks", pack, "clothes/under-lower", rel)
                    os.makedirs(os.path.dirname(dest), exist_ok=True)
                    Image.fromarray(out, "RGBA").save(dest, optimize=True)
                    count += 1
        print(f"{pack}: wrote {count} sprites")


if __name__ == "__main__":
    main(sys.argv[1:] or ["au", "aumasc"])
