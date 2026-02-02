from __future__ import annotations

import re
from pathlib import Path

# -------- config --------
ROOTS = [Path("./app")]  # add Path("./components") if you want
EXTS = {".tsx", ".ts", ".jsx", ".js"}
SKIP_DIRS = {"node_modules", ".next", "dist", "build", ".git"}

DRY_RUN = True  # set False to write

# Tailwind blur classes we want to eliminate everywhere in UI strings.
BLUR_CLASSES = {
    "backdrop-blur",
    "backdrop-blur-sm",
    "backdrop-blur-md",
    "backdrop-blur-lg",
    "backdrop-blur-xl",
    "backdrop-blur-2xl",
    "backdrop-blur-3xl",
}

# Match string literals: "..." or '...'
# (We only edit literals that *look like class strings*, see is_classy_literal()).
STRING_LIT_RE = re.compile(r'(?P<q>["\'])(?P<body>.*?)(?P=q)', re.DOTALL)

def should_process(p: Path) -> bool:
    if p.suffix not in EXTS:
        return False
    if any(part in SKIP_DIRS for part in p.parts):
        return False
    return True

def is_classy_literal(s: str) -> bool:
    """
    Heuristic: Only treat as a Tailwind-ish class string if it contains typical class separators
    and at least one dash/colon/bracket pattern.
    This avoids mangling normal text.
    """
    if " " not in s:
        return False
    tailwindy = ("-" in s) or (":" in s) or ("[" in s) or ("/" in s)
    return tailwindy

def remove_blur_tokens(class_string: str) -> tuple[str, int]:
    parts = class_string.split()
    before = len(parts)
    parts = [c for c in parts if c not in BLUR_CLASSES]
    removed = before - len(parts)
    return " ".join(parts), removed

def sanitize_text(text: str) -> tuple[str, int]:
    ops = 0

    def repl(m: re.Match) -> str:
        nonlocal ops
        q = m.group("q")
        body = m.group("body")

        # Fast reject unless it even mentions backdrop-blur
        if "backdrop-blur" not in body:
            return m.group(0)

        # Only edit things that look like class lists
        if not is_classy_literal(body):
            return m.group(0)

        updated, removed = remove_blur_tokens(body)
        if removed:
            ops += 1
            return f"{q}{updated}{q}"
        return m.group(0)

    new_text = STRING_LIT_RE.sub(repl, text)
    return new_text, ops

def iter_files():
    for root in ROOTS:
        if not root.exists():
            continue
        for p in root.rglob("*"):
            if p.is_file() and should_process(p):
                yield p

def main() -> None:
    files_changed = 0
    op_count = 0

    for p in iter_files():
        original = p.read_text(encoding="utf-8")
        updated, ops = sanitize_text(original)

        if updated != original:
            files_changed += 1
            op_count += ops
            print(f"\n{'WOULD UPDATE' if DRY_RUN else 'UPDATED'}: {p}")
            print("  - removed: backdrop-blur*")

            if not DRY_RUN:
                p.write_text(updated, encoding="utf-8")

    print(f"\nDone. Files changed: {files_changed} | token ops: {op_count}")
    if DRY_RUN:
        print("Dry-run only. Set DRY_RUN=False to write changes.")

if __name__ == "__main__":
    main()
