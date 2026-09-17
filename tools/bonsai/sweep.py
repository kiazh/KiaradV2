"""Grow many candidate trees and score them for picking a winner.

Usage:
    python3 sweep.py MULT SEED_FROM SEED_TO ROWS COLS [--cbonsai PATH]

Example:
    python3 sweep.py 3 1 40 22 96

Each run is deterministic for a fixed seed and cbonsai binary, so a
shortlist can be regrown exactly with capture.py + parse_dump.py.

Scores, per tree:
    wood      branch cells (the thing you actually see as limbs)
    exp       share of wood with open air on both sides (like the
              shipped tree's 0.85 exposure: branches you can see,
              not branches buried inside leaf blobs)
    curl      count of '~' cells (cbonsai's curvy branch segments)
    masses    8-connected '&' components of 12+ cells, largest first
              (one mass per foliage clump; a crown of N clumps)
    nmass     number of masses (rough branch count)
    reach     columns from trunk axis to furthest mass centre
    top       first inked row (how tall the tree stands)
    width     inked columns (how wide it spreads)
"""

import sys
from collections import deque

from capture import capture_tree
from parse_dump import parse_dump, FG_ROLE  # noqa: F401  (role reference)

import tempfile
import os


def grid_stats(rows):
    H = len(rows)
    W = max(len(r) for r in rows)
    G = [[(" ", None) for _ in range(W)] for _ in range(H)]
    for y, r in enumerate(rows):
        for x, (ch, fg, _b) in enumerate(r):
            G[y][x] = (ch, fg)
    wood = [(x, y) for y in range(H) for x in range(W)
            if G[y][x][0] != " " and G[y][x][1] in (33, 93)]
    exposed = sum(
        1 for x, y in wood
        if (G[y][x - 1][0] if x > 0 else " ") != "&"
        and (G[y][x + 1][0] if x < W - 1 else " ") != "&")
    curl = sum(1 for y in range(H) for x in range(W)
               if G[y][x][0] == "~")
    leaves = [(x, y) for y in range(H) for x in range(W)
              if G[y][x][0] == "&"]
    seen, masses, S = set(), [], set(leaves)
    for p in leaves:
        if p in seen:
            continue
        seen.add(p)
        q, comp = deque([p]), []
        while q:
            cx, cy = q.popleft()
            comp.append((cx, cy))
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    nb = (cx + dx, cy + dy)
                    if nb in S and nb not in seen:
                        seen.add(nb)
                        q.append(nb)
        if len(comp) >= 12:
            masses.append(comp)
    masses.sort(key=len, reverse=True)
    trunk = None
    for y in range(H):
        line = "".join(ch for ch, _ in G[y])
        if ":___________." in line:
            trunk = line.index(":___________") + 14
            break
    reach = 0.0
    if trunk is not None:
        for comp in masses:
            cx = sum(x for x, _ in comp) / len(comp)
            reach = max(reach, abs(cx - trunk))
    ink = [(x, y) for y in range(H) for x in range(W)
           if G[y][x][0] != " "]
    top = min((y for _, y in ink), default=H)
    width = (max(x for x, _ in ink) - min(x for x, _ in ink)
             if ink else 0)
    planter = any(":___________." in "".join(ch for ch, _ in G[y])
                  for y in range(H))
    return {
        "wood": len(wood),
        "exp": exposed / max(1, len(wood)),
        "curl": curl,
        "masses": sorted((len(c) for c in masses), reverse=True),
        "reach": round(reach, 1),
        "top": top,
        "width": width,
        "planter": planter,
    }


def main(argv):
    if len(argv) < 6:
        print(__doc__)
        return 2
    mult, s0, s1, rows, cols = (
        argv[1], int(argv[2]), int(argv[3]), int(argv[4]), int(argv[5]))
    cbonsai = "./cbonsai"
    if "--cbonsai" in argv:
        cbonsai = argv[argv.index("--cbonsai") + 1]
    for seed in range(s0, s1 + 1):
        raw = capture_tree(cbonsai, seed, 52, mult, rows, cols)
        with tempfile.NamedTemporaryFile(delete=False) as f:
            f.write(raw)
            tmp = f.name
        try:
            st = grid_stats(parse_dump(tmp))
        finally:
            os.unlink(tmp)
        print(f"mult={mult} seed={seed}: wood={st['wood']} "
              f"exp={st['exp']:.2f} curl={st['curl']} "
              f"masses={st['masses']} reach={st['reach']} "
              f"top={st['top']} width={st['width']} "
              f"planter={st['planter']}", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
