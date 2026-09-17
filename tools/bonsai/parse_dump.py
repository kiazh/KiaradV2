"""Turn a cbonsai --print pty dump into ART + PAINT blocks.

Usage:
    python3 parse_dump.py DUMP.BIN

Prints the plain-ASCII tree, then the paint mask, in the exact layout
components/BonsaiGhost.tsx expects (String.raw blocks, '.' = unpainted).

How it works: cbonsai draws via ncurses, then --print dumps the finished
tree cell by cell as `<reset><fg><char>` with \\r\\n row endings. Each cell
carries its own colour, so parsing is stateful per row only.

Colour -> role mapping (cbonsai's default `--color 2,3,10,11` palette,
verified against cbonsai.c: shoots use BOLD|WOOD_BRIGHT or WOOD_DARK,
leaves use LEAF_BRIGHT / LEAF_DARK with or without bold, the planter lip
uses COLOR_TEXT / LEAF_BRIGHT / WOOD_BRIGHT):

    32 (green)        -> l  leaf dark
    92 (bright green) -> L  leaf bright
    33 (yellow)       -> w  wood dark
    93 (bright yellow)-> W  wood bright
    90 (bright black) -> t  planter rim text
    default           -> .  unpainted

Bold is ignored: both tiers of a material map to the same role. Spaces
are always unpainted, even when printed while a colour is active (the
planter interior is colour-8 spaces; the mask records '.' for those).
"""

import re
import sys

# NOTE: `\x1b[3-1m` is not a typo. cbonsai prints `\x1b[3%dm` with -1 for
# the default colour, which terminals ignore (leaving default). We treat
# it as an explicit reset-to-default.
TOKEN = re.compile(
    rb"\x1b\[3-1m|\x1b\[[0-9;?]*[A-Za-z]|\x1b[()][0-9A-Z]|\x1b[=>]")

FG_ROLE = {32: "l", 92: "L", 33: "w", 93: "W", 90: "t"}


def parse_dump(path):
    """Return rows of (char, fg-or-None, bold) for the printed tree."""
    raw = open(path, "rb").read()
    i = raw.find(b"?1049l")
    if i < 0:
        raise ValueError("no altscreen exit (?1049l) in dump; "
                         "was this captured from cbonsai --print in a pty?")
    j = raw.find(b"\x1b>", i)
    stream = raw[j + 2:]
    rows, cur = [], []
    fg, bold = None, False
    k, n = 0, len(stream)
    while k < n:
        b = stream[k]
        if b == 0x1B:
            m = TOKEN.match(stream, k)
            if not m:
                raise ValueError(f"unparseable escape at offset {k}: "
                                 f"{stream[k:k + 12]!r}")
            seq = m.group(0)
            k = m.end()
            if seq == b"\x1b[3-1m":
                fg, bold = None, False
            elif seq.startswith(b"\x1b[") and seq.endswith(b"m"):
                for p in seq[2:-1].decode("ascii", "replace").split(";"):
                    if p in ("", "0"):
                        fg, bold = None, False
                    elif p == "1":
                        bold = True
                    elif p == "39":
                        fg = None
                    elif p.isdigit():
                        fg = int(p)
        elif b == 0x0A:
            rows.append(cur)
            cur = []
            k += 1
        elif b == 0x0D:
            k += 1
        else:
            cur.append((chr(b), fg, bold))
            k += 1
    if cur:
        rows.append(cur)
    return rows


def to_art_paint(rows):
    """Return (art_lines, paint_lines) with trailing blank rows dropped."""
    art, paint = [], []
    for r in rows:
        text = "".join(ch for ch, _, _ in r).rstrip()
        mask = "".join(FG_ROLE.get(fg, ".") if ch != " " else "."
                       for ch, fg, _ in r[:len(text)])
        mask = mask.ljust(len(text), ".")
        art.append(text)
        paint.append(mask)
    while art and not art[-1].strip():
        art.pop()
        paint.pop()
    return art, paint


def main(argv):
    if len(argv) < 2:
        print(__doc__)
        return 2
    art, paint = to_art_paint(parse_dump(argv[1]))
    print("----- ART -----")
    print("\n".join(art))
    print("----- PAINT -----")
    print("\n".join(paint))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
