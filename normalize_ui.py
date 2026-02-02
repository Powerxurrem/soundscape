from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(".")
EXTS = {".tsx", ".ts", ".jsx", ".js"}

DRY_RUN = False  # set False to write
PRINT_CHANGES = True

SKIP_DIRS = {"node_modules", ".next", "dist", "build", ".git"}

# -----------------------
# 1) Safe literal fixes
# -----------------------
LITERAL = {
    "bg-transparant": "bg-transparent",
    "hover:bg-white/50": "hover:bg-white/15",
    "hover:bg-white/40": "hover:bg-white/15",
    "border-white/50": "border-white/20",
    "border-white/40": "border-white/20",
}

# Fix broken Tailwind opacity classes like "border-white/" or "divide-white/"
BROKEN_OPACITY_FIXES = [
    # border-white/  -> border-white/15
    (re.compile(r"\bborder-white/\b"), "border-white/15"),
    # divide-white/  -> divide-white/10
    (re.compile(r"\bdivide-white/\b"), "divide-white/10"),
]

# Normalize generic blur to md
BLUR_FIXES = [
    (re.compile(r"\bbackdrop-blur\b(?!-)"), "backdrop-blur-md"),
]

# -----------------------
# 2) Tokenization rules
# -----------------------
# We only replace *complete* recognizable glass triplets to avoid surprises.
GLASS_SURFACE_BG = {"bg-white/[0.06]", "bg-white/[0.07]", "bg-white/[0.08]", "bg-white/[0.09]"}
GLASS_PANEL_BG   = {"bg-white/[0.03]", "bg-white/[0.035]", "bg-white/[0.04]"}
GLASS_INSET_BG   = {"bg-white/[0.03]", "bg-white/[0.04]"}

BORDER_LEVELS_SURFACE = {"border-white/15", "border-white/20"}
BORDER_LEVELS_PANEL   = {"border-white/10", "border-white/12", "border-white/15"}
BORDER_LEVELS_INSET   = {"border-white/10", "border-white/12"}

def tokenize_class_string(s: str) -> tuple[str, str | None]:
    """
    Tokenize a Tailwind class string into glass-surface/panel/inset when it contains:
    - 'border'
    - a border-white/xx opacity class
    - a bg-white/[...] glass fill
    - backdrop-blur-md
    Keeps all other classes unchanged.
    Returns (new_string, token_used_or_none)
    """
    classes = s.split()
    cls_set = set(classes)

    # detect candidates
    has_border = "border" in cls_set
    blur = "backdrop-blur-md" in cls_set

    border_op = next((c for c in classes if c.startswith("border-white/")), None)
    bg = next((c for c in classes if c.startswith("bg-white/[")), None)

    if not (has_border and blur and border_op and bg):
        return s, None

    token = None

    if bg in GLASS_SURFACE_BG and border_op in BORDER_LEVELS_SURFACE:
        token = "glass-surface"
    elif bg in GLASS_PANEL_BG and border_op in BORDER_LEVELS_PANEL:
        token = "glass-panel"
    elif bg in GLASS_INSET_BG and border_op in BORDER_LEVELS_INSET:
        token = "glass-inset"

    if not token:
        return s, None

    # remove ingredients and insert token
    remove = {"border", "backdrop-blur-md", border_op, bg}
    new_classes = [c for c in classes if c not in remove]

    # insert token near the front for readability
    new_classes.insert(0, token)

    return " ".join(new_classes), token

CLASSNAME_RE = re.compile(r'className="([^"]+)"')

def tokenize_file(text: str) -> tuple[str, list[str]]:
    changes: list[str] = []

    def repl(m: re.Match) -> str:
        original = m.group(1)
        updated, token = tokenize_class_string(original)
        if token and updated != original:
            changes.append(f"token: {token}")
        return f'className="{updated}"'

    new_text = CLASSNAME_RE.sub(repl, text)
    return new_text, changes


def should_process(p: Path) -> bool:
    if p.suffix not in EXTS:
        return False
    if any(part in SKIP_DIRS for part in p.parts):
        return False
    return True

def apply_all(text: str) -> tuple[str, list[str]]:
    changes: list[str] = []
    out = text

    # literal
    for a, b in LITERAL.items():
        if a in out:
            out2 = out.replace(a, b)
            if out2 != out:
                changes.append(f"literal: {a} -> {b}")
                out = out2

    # broken opacity fixes
    for pat, repl in BROKEN_OPACITY_FIXES:
        if pat.search(out):
            out2 = pat.sub(repl, out)
            if out2 != out:
                changes.append(f"regex: {pat.pattern} -> {repl}")
                out = out2

    # blur normalize
    for pat, repl in BLUR_FIXES:
        if pat.search(out):
            out2 = pat.sub(repl, out)
            if out2 != out:
                changes.append(f"regex: {pat.pattern} -> {repl}")
                out = out2

    # tokenization pass (ingredient-based)
    out2, tok_changes = tokenize_file(out)
    if out2 != out:
        out = out2
        changes.extend(tok_changes)

    return out, changes

def main() -> None:
    files_changed = 0
    total_changes = 0

    for p in ROOT.rglob("*"):
        if not p.is_file() or not should_process(p):
            continue

        original = p.read_text(encoding="utf-8")
        updated, changes = apply_all(original)

        if updated != original:
            files_changed += 1
            total_changes += len(changes)

            print(f"\n{'WOULD UPDATE' if DRY_RUN else 'UPDATED'}: {p}")
            if PRINT_CHANGES:
                # de-dupe change labels
                for c in sorted(set(changes)):
                    print("  -", c)

            if not DRY_RUN:
                p.write_text(updated, encoding="utf-8")

    print(f"\nDone. Files changed: {files_changed} | change ops: {total_changes}")
    if DRY_RUN:
        print("Dry-run only. Set DRY_RUN=False to write changes.")

if __name__ == "__main__":
    main()
