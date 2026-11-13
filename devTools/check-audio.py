#!/usr/bin/env python3
"""Guard the game's audio before publishing.

  check-audio.py [audio_root]      (default: the repo root, i.e. ./audio)

Fails (exit 1) if any file listed in devTools/audio-files.sha256 is missing, is a Git LFS pointer, is empty,
or does not match its SHA-256 and size, or if game/03-JavaScript/game-audio.js refers to an audio file that
is not listed. GitHub Pages serves LFS-tracked files as pointers, so audio must be committed as plain files.
"""
import hashlib
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
POINTER_MAGIC = b"version https://git-lfs"


def manifest():
    entries = {}
    with open(os.path.join(ROOT, "devTools", "audio-files.sha256"), encoding="utf-8") as fh:
        for line in fh:
            if not line.strip() or line.startswith("#"):
                continue
            sha, size, path = line.rstrip("\n").split("  ", 2)
            entries[path] = (sha, int(size))
    return entries


def referenced():
    src = open(os.path.join(ROOT, "game", "03-JavaScript", "game-audio.js"), encoding="utf-8").read()
    body = src[src.index("const BGM = {") : src.index("};", src.index("const BGM = {"))]
    paths = {"audio/bgm/" + p for p in re.findall(r'"([^"]+\.mp3)"', body)}
    weather = src[src.index("const WEATHER = {") : src.index("const tracks")]
    for folder in ("rain", "snow"):
        block = weather[weather.index(f"{folder}: {{") :]
        block = block[: block.index("}")]
        for name in set(re.findall(r'"([^"]+)"', block)):
            paths.add(f"audio/sfx/ambience/{folder}/{name}.mp3")
    for name in ("lightning", "lightning2", "lightning3"):
        paths.add(f"audio/sfx/ambience/rain/{name}.mp3")
    for name in ("money", "meds"):
        paths.add(f"audio/sfx/ambience/{name}.mp3")
    return paths


def main(argv):
    base = os.path.abspath(argv[1]) if len(argv) > 1 else ROOT
    entries = manifest()
    problems = []
    for path in sorted(referenced() - set(entries)):
        problems.append(f"game-audio.js uses {path}, which is not in devTools/audio-files.sha256")
    for path, (sha, size) in sorted(entries.items()):
        full = os.path.join(base, path)
        if not os.path.isfile(full):
            problems.append(f"missing: {path}")
            continue
        data = open(full, "rb").read()
        if not data:
            problems.append(f"empty: {path}")
        elif data.startswith(POINTER_MAGIC):
            problems.append(f"Git LFS pointer, not audio: {path}")
        elif len(data) != size or hashlib.sha256(data).hexdigest() != sha:
            problems.append(f"hash/size mismatch: {path}")
    if problems:
        print("Audio check failed:\n  " + "\n  ".join(problems), file=sys.stderr)
        return 1
    print(f"Audio OK: {len(entries)} files")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
