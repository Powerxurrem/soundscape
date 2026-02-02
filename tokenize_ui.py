from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(".")
EXTS = {".tsx", ".ts", ".jsx", ".js"}
SKIP_DIRS = {"node_modules", ".next", "dist", "build", ".git"}

DRY_RUN = False  # set False to write

# ---- Glass tiers (match your globals tokens intent) ----
SURFACE_BG = {"bg-white/[0.06]", "bg-white/[0.07]", "bg-white/[0.08]", "bg-white/[0.09]", "bg-white/[0.10]"}
PANEL_BG   = {"bg-white/[0.03]", "bg-white/[0.035]", "bg-white/[0.04]", "bg-white/[0.05]"}
INSET_BG   = {"bg-white/[0.03]", "bg-white/[0.04]"}

# Border opacity tiers
SURFACE_BORDER = {"border-white/15", "border-white/20", "border-white/25"}
PANEL_BORDER   = {"border-white/10", "border-white/12", "border-white/15"}
INSET_BORDER   = {"border-white/10", "border-white/12"}

# Button exact recipes (as defined in globals.css)
BTN_GLASS = [
    "rounded-xl", "border", "border-white/20", "bg-white/10", "px-5", "py-2.5", "text-sm", "hover:bg-white/15"
]
BTN_GLASS_SECONDARY = [
    "rounded-xl", "border", "border-white/15", "bg-white/[0.03]", "px-5", "py-2.5", "text-sm", "hover:bg-white/[0.06]"
]

CLASSNAME_RE = re.compile(r'className="([^"]+)"')

def should_process(p: Path) -> bool:
    if p.suffix not in EXTS:
        return False
    if any(part in SKIP_DIRS for part in p.parts):
        return False
    return True

def has_any_prefix(classes: list[str], prefix: str) -> str | None:
    for c in classes:
        if c.startswith(prefix):
            return c
    return None

def ensure_border_keyword(classes: list[str]) -> list[str]:
    s = set(classes)
    has_border_op = any(c.startswith("border-white/") for c in s)
    has_border = "border" in s or any(c.startswith("border-") for c in s)  # border-x/y/2 etc
    if has_border_op and not has_border:
        # insert plain border near the start for readability
        return ["border"] + classes
    return classes


def tokenize_glass(classes: list[str]) -> tuple[list[str], str | None]:
    cls = classes
    s = set(cls)

    # avoid tokenizing interactive button-like elements as glass panels
    if any(c.startswith("px-") for c in s) and any(c.startswith("py-") for c in s) and any(c.startswith("hover:") for c in s):
        return cls, None


    # already tokenized
    if any(c in s for c in ("glass-surface", "glass-panel", "glass-inset")):
        return cls, None

    has_border = "border" in s
    blur_present = any(c in s for c in ("backdrop-blur", "backdrop-blur-sm", "backdrop-blur-md", "backdrop-blur-lg"))

    border_op = has_any_prefix(cls, "border-white/")
    bg = next((c for c in cls if c.startswith("bg-white/[") or c.startswith("bg-white/")), None)

    # normalize blur to md if present
    if blur_present:
        cls = [
            ("backdrop-blur-md" if c in {"backdrop-blur", "backdrop-blur-lg", "backdrop-blur-sm"} else c)
            for c in cls
        ]
        s = set(cls)

    if not (has_border and border_op and bg):
        return cls, None

    # Decide token based on bg bucket
    if bg in SURFACE_BG:
        chosen = "glass-surface"
    elif bg in PANEL_BG:
        chosen = "glass-panel"
    elif bg in INSET_BG:
        chosen = "glass-inset"
    else:
        return cls, None

    # remove ingredients; IMPORTANT: keep blur only if it was already there
    remove = {"border", border_op, bg}
    if blur_present:
        remove.add("backdrop-blur-md")

    new_cls = [c for c in cls if c not in remove]
    new_cls.insert(0, chosen)
    return new_cls, chosen



def tokenize_buttons(classes: list[str]) -> tuple[list[str], str | None]:
    s = set(classes)

    # already tokenized
    if any(c in s for c in ("btn-glass", "btn-glass-secondary")):
        return classes, None

    # Hard match (exact recipes)
    def contains_all(req: list[str]) -> bool:
        return all(r in s for r in req)

    if contains_all(BTN_GLASS):
        new_cls = [c for c in classes if c not in BTN_GLASS]
        new_cls.insert(0, "btn-glass")
        return new_cls, "btn-glass"

    if contains_all(BTN_GLASS_SECONDARY):
        new_cls = [c for c in classes if c not in BTN_GLASS_SECONDARY]
        new_cls.insert(0, "btn-glass-secondary")
        return new_cls, "btn-glass-secondary"

    # Soft match (handles px/py/border/hover variance)
    is_buttonish = any(c.startswith("px-") for c in s) and any(c.startswith("py-") for c in s)
    is_buttonish = is_buttonish and any(c.startswith("hover:") for c in s)
    is_buttonish = is_buttonish and ("rounded-xl" in s or any(c.startswith("rounded-") for c in s))
    is_buttonish = is_buttonish and "border" in s

    if not is_buttonish:
        return classes, None

    # Decide primary vs secondary by background style
    bg = next((c for c in classes if c.startswith("bg-white/") or c.startswith("bg-white/[")), None)
    hover = next((c for c in classes if c.startswith("hover:bg-white")), None)

    if bg in {"bg-white/10", "bg-white/15", "bg-white/[0.10]"} or (hover in {"hover:bg-white/15", "hover:bg-white/20"}):
        return ["btn-glass"], "btn-glass"

    # Default to secondary
    if bg in {"bg-white/[0.03]", "bg-white/[0.04]"} or (hover in {"hover:bg-white/[0.06]", "hover:bg-white/[0.08]"}):
        return ["btn-glass-secondary"], "btn-glass-secondary"

    # Fallback: primary
    return ["btn-glass"], "btn-glass"

def process_class_string(s: str) -> tuple[str, list[str]]:
    classes = ensure_border_keyword(s.split())
    changes: list[str] = []

    # --- STEP 2: normalize blur everywhere (tokens own blur) ---
    before = len(classes)
    classes = [c for c in classes if not c.startswith("backdrop-blur")]
    if len(classes) != before:
        changes.append("removed: backdrop-blur*")

    # buttons first (more specific)
    classes2, btn = tokenize_buttons(classes)
    if btn:
        changes.append(f"token: {btn}")
        classes = classes2

    # glass surfaces/panels
    classes2, tok = tokenize_glass(classes)
    if tok:
        changes.append(f"token: {tok}")
        classes = classes2

    # pill token (common badge style)
    sset = set(classes)
    if "rounded-full" in sset and any(c.startswith("px-") for c in classes) and any(c.startswith("py-") for c in classes):
        if any(c.startswith("bg-white/") or c.startswith("bg-white/[") for c in classes) and any(c.startswith("border-white/") for c in classes):
            return "pill-glass", ["token: pill-glass"]

    return " ".join(classes), changes


def tokenize_file(text: str) -> tuple[str, list[str]]:
    changes: list[str] = []

    def repl(m: re.Match) -> str:
        original = m.group(1)
        updated, ch = process_class_string(original)
        if ch and updated != original:
            changes.extend(ch)
        return f'className="{updated}"'

    new_text = CLASSNAME_RE.sub(repl, text)
    return new_text, changes


def main() -> None:
    files_changed = 0
    op_count = 0

    for p in ROOT.rglob("*"):
        if not p.is_file() or not should_process(p):
            continue

        original = p.read_text(encoding="utf-8")
        updated, changes = tokenize_file(original)

        if updated != original:
            files_changed += 1
            op_count += len(changes)

            print(f"\n{'WOULD UPDATE' if DRY_RUN else 'UPDATED'}: {p}")
            for c in sorted(set(changes)):
                print("  -", c)

            if not DRY_RUN:
                p.write_text(updated, encoding="utf-8")

    print(f"\nDone. Files changed: {files_changed} | token ops: {op_count}")
    if DRY_RUN:
        print("Dry-run only. Set DRY_RUN=False to write changes.")

if __name__ == "__main__":
    main()
