"""Grow a cbonsai tree inside a sized pty and save the raw terminal dump.

Usage:
    python3 capture.py ROWS COLS SEED LIFE MULT OUT.BIN [--cbonsai PATH]

Example (the site recipe):
    python3 capture.py 29 96 26 52 5 dump-seed26.bin

The pty geometry is part of the recipe: cbonsai sizes growth to the
terminal, so the same seed in a different-sized pty yields a different
tree. A short pty (e.g. 22 rows) forces wide, low growth; a tall one
(29 rows) lets the trunk run up into a crown.
"""

import fcntl
import os
import pty
import select
import struct
import sys
import termios
import time

DEFAULT_CBonsai = "./cbonsai"


def capture_tree(cbonsai_bin, seed, life, mult, rows=29, cols=96,
                 timeout=30):
    """Run cbonsai --print in a rows x cols pty; return raw output bytes."""
    pid, master = pty.fork()
    if pid == 0:
        # Child: size the tty, then exec. cbonsai reads the size via the
        # tty itself, so COLUMNS/LINES env are belt and suspenders.
        fcntl.ioctl(
            1, termios.TIOCSWINSZ,
            struct.pack("HHHH", rows, cols, 0, 0),
        )
        env = dict(os.environ)
        env["TERM"] = "xterm-256color"
        env["LINES"] = str(rows)
        env["COLUMNS"] = str(cols)
        os.execvpe(cbonsai_bin, [cbonsai_bin, "--print",
                                 "--life", str(life),
                                 "--multiplier", str(mult),
                                 "--seed", str(seed)], env)
    out = b""
    end = time.time() + timeout
    while time.time() < end:
        r, _, _ = select.select([master], [], [], 1.0)
        if r:
            try:
                chunk = os.read(master, 65536)
            except OSError:
                break
            if not chunk:
                break
            out += chunk
        else:
            done_pid, _ = os.waitpid(pid, os.WNOHANG)
            if done_pid == pid:
                try:
                    while True:
                        chunk = os.read(master, 65536)
                        if not chunk:
                            break
                        out += chunk
                except OSError:
                    pass
                break
    try:
        os.waitpid(pid, 0)
    except (ChildProcessError, OSError):
        pass
    os.close(master)
    return out


def main(argv):
    if len(argv) < 7:
        print(__doc__)
        return 2
    rows, cols, seed, life, mult, out = (
        int(argv[1]), int(argv[2]), argv[3], argv[4], argv[5], argv[6])
    cbonsai = DEFAULT_CBonsai
    if "--cbonsai" in argv:
        cbonsai = argv[argv.index("--cbonsai") + 1]
    raw = capture_tree(cbonsai, seed, life, mult, rows, cols)
    with open(out, "wb") as f:
        f.write(raw)
    print(f"grew seed={seed} life={life} mult={mult} in {rows}x{cols}: "
          f"{len(raw)} bytes -> {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
