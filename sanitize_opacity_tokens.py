from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(".")
EXTS = {".tsx", ".ts", ".jsx", ".js"}
SKIP_DIRS = {"node_modules", ".next", "dist", "build", ".git"}

DRY_RUN = False  # set False to write


def should_process(p: Path) -> bool:
    if p.suffix not in EXTS:
        return False
    if any(part in SKIP_DIRS for part in p.parts):
        return False
    return True


def squash_tailwind_opacity(text: str, prefix: str) -> tuple[str, int]:
    """
    Turns border-white/151515 -> border-white/15
          border-white/151510 -> border-white/10
    by keeping the last two digits.
    """
    pat = re.compile(rf"\b{re.escape(prefix)}/(1515\d{{2}})\b")

    count = 0

    def repl(m: re.Match) -> str:
        nonlocal count
        digits = m.group(1)
        count += 1
        return f"{prefix}/{digits[-2:]}"

    return pat.sub(repl, text), count


def main() -> None:
    files_changed = 0
    op_count = 0

    for p in ROOT.rglob("*"):
        if not p.is_file() or not should_process(p):
            continue

        original = p.read_text(encoding="utf-8")
        updated = original
        ops_here = 0

        # Fix corrupted opacity tokens anywhere in the file
        updated, c = squash_tailwind_opacity(updated, "border-white")
        ops_here += c

        updated, c = squash_tailwind_opacity(updated, "divide-white")
        ops_here += c

        # OPTIONAL: uncomment if you ever see text-white/101010 etc
        # updated, c = squash_tailwind_opacity(updated, "text-white")
        # ops_here += c

        if updated != original:
            files_changed += 1
            op_count += ops_here
            print(f"\n{'WOULD UPDATE' if DRY_RUN else 'UPDATED'}: {p}")
            print(f"  - opacity fixes: {ops_here}")

            if not DRY_RUN:
                p.write_text(updated, encoding="utf-8")

    print(f"\nDone. Files changed: {files_changed} | opacity ops: {op_count}")
    if DRY_RUN:
        print("Dry-run only. Set DRY_RUN=False to write changes.")


if __name__ == "__main__":
    main()
