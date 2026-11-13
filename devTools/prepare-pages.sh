#!/usr/bin/env bash
# Assemble the GitHub Pages copy of the compiled game (the dol-plus-localStorage-danny-comp repo):
#   devTools/prepare-pages.sh <output-dir> [compiled.html]
# Copies index.html, img/, the selectable image packs (imagepacks/au, aumasc, mysterious) and audio/
# (tracked files only), then refuses to finish if any audio file is missing, a Git LFS pointer or fails its
# SHA-256 check, if the output routes files to LFS, or if the copy is 1 GB or more. Run `bash compile.sh` first.
set -euo pipefail
cd "$(dirname "$0")/.."
out="${1:?usage: devTools/prepare-pages.sh <output-dir> [compiled.html]}"
html="${2:-Degrees of Lewdity.html}"
[ -f "$html" ] || { echo "Compiled HTML not found: $html (run bash compile.sh)" >&2; exit 1; }
grep -q "Storage fallback: localStorage/sessionStorage/indexedDB" "$html" || { echo "Compiled HTML lacks the storage fallback" >&2; exit 1; }
mkdir -p "$out"
packs="imagepacks/au imagepacks/aumasc imagepacks/mysterious"
rm -rf "$out/imagepacks" "$out/audio"
git archive HEAD img $packs audio | tar -x -C "$out"
cp -L "$html" "$out/index.html"
touch "$out/.nojekyll"
if [ -f "$out/.gitattributes" ] && grep -q "filter=lfs" "$out/.gitattributes"; then
	echo "Refusing to publish: $out/.gitattributes routes files to Git LFS" >&2
	exit 1
fi
python3 devTools/check-audio.py "$out"
size=$(du -sm --exclude=.git "$out" | cut -f1)
echo "Pages copy size: ${size} MB"
if [ "$size" -ge 1000 ]; then echo "Refusing to publish: ${size} MB exceeds the 1 GB GitHub Pages limit" >&2; exit 1; fi
echo "Pages copy ready: $out"
