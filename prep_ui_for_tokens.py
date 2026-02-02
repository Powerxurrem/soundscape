from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(".")
EXTS = {".tsx", ".ts", ".jsx", ".js"}
SKIP_DIRS = {"node_modules", ".next", "dist", "build", ".git"}

DRY_RUN = False  # set False to write changes


def should_process(p: Path) -> bool:
    if p.suffix not in EXTS:
        return False
    if any(part in SKIP_DIRS for part in p.parts):
        return False
    return True


# --------- normalization helpers ---------

def collapse_opacity_token(s: str, prefix: str) -> str:
    """
    border-white/15151515 -> border-white/15
    divide-white/10101010 -> divide-white/10
    """
    pat = re.compile(rf"\b{re.escape(prefix)}/(\d{{4,}})\b")

    def repl(m: re.Match) -> str:
        digits = m.group(1)
        return f"{prefix}/{digits[-2:]}"

    return pat.sub(repl, s)


def normalize_blur(classes: list[str]) -> list[str]:
    if any(c in classes for c in ("backdrop-blur", "backdrop-blur-sm", "backdrop-blur-lg")):
        return [
            ("backdrop-blur-md" if c in {"backdrop-blur", "backdrop-blur-sm", "backdrop-blur-lg"} else c)
            for c in classes
        ]
    return classes


def add_default_border_opacity(classes: list[str]) -> list[str]:
    """
    If 'border' exists but there's NO border color/opacity token, add border-white/15.
    Safe default so tokenizers can recognize and unify.
    """
    s = set(classes)

    # has any explicit border color/opacity already?
    if any(c.startswith("border-white/") for c in s):
        return classes
    if any(c.startswith("border-") and not c.startswith("border-0") for c in s):
        # border-emerald..., border-zinc..., etc -> leave it
        # NOTE: also leaves border-dashed/border-t etc alone; we'll handle dashed separately below
        if any(c.startswith("border-emerald") or c.startswith("border-zinc") or c.startswith("border-sky")
               or c.startswith("border-amber") or c.startswith("border-fuchsia") for c in s):
            return classes

    if "border" in s:
        # If it's dashed or subtle separators, keep same opacity token anyway.
        # Insert near the border keyword for readability.
        out = []
        inserted = False
        for c in classes:
            out.append(c)
            if c == "border" and not inserted:
                out.append("border-white/15")
                inserted = True
        return out

    # Also handle dashed borders that sometimes appear without plain 'border'
    if "border-dashed" in s and not any(c.startswith("border-white/") for c in s):
        return ["border-white/15"] + classes

    return classes


def normalize_typos(text: str) -> str:
    text = re.sub(r"\bbg-transparant\b", "bg-transparent", text)
    return text


def normalize_class_string(class_str: str) -> str:
    class_str = normalize_typos(class_str)
    class_str = collapse_opacity_token(class_str, "border-white")
    class_str = collapse_opacity_token(class_str, "divide-white")

    classes = class_str.split()
    classes = normalize_blur(classes)
    classes = add_default_border_opacity(classes)

    return " ".join(classes)


# --------- className patterns ---------

# className="..."
RE_DOUBLE = re.compile(r'className="([^"]+)"')

# className={`...`} including with ${...}
RE_TEMPLATE = re.compile(r"className=\{`([^`]*)`\}")

# className={[ ... ].join(' ')}
RE_ARRAY_JOIN = re.compile(r"className=\{\[\s*(.*?)\s*\]\.join\((.*?)\)\}", re.S)

# String literals inside array: '...' or "..." or `...`
RE_STR_LIT = re.compile(
    r"""
    (?P<q>["']) (?P<s>[^"']*) (?P=q)
    |
    (`)(?P<t>[^`]*) (`)
    """,
    re.X | re.S,
)

# Split template contents into static chunks and ${...} chunks
RE_TEMPLATE_EXPR = re.compile(r"(\$\{.*?\})", re.S)


def normalize_template_with_expr(content: str) -> str:
    """
    content is the raw inside of backticks. We only normalize the static pieces,
    leaving ${...} chunks untouched.
    """
    parts = RE_TEMPLATE_EXPR.split(content)
    out = []
    for part in parts:
        if part.startswith("${") and part.endswith("}"):
            out.append(part)
        else:
            out.append(normalize_class_string(part))
    return "".join(out)


def process_text(text: str) -> tuple[str, int]:
    ops = 0

    # className="..."
    def repl_double(m: re.Match) -> str:
        nonlocal ops
        original = m.group(1)
        updated = normalize_class_string(original)
        if updated != original:
            ops += 1
        return f'className="{updated}"'

    text = RE_DOUBLE.sub(repl_double, text)

    # className={`...`} (supports ${...})
    def repl_tpl(m: re.Match) -> str:
        nonlocal ops
        original = m.group(1)
        updated = normalize_template_with_expr(original)
        if updated != original:
            ops += 1
        return f"className={{`{updated}`}}"

    text = RE_TEMPLATE.sub(repl_tpl, text)

    # className={[ ... ].join(' ')} -> normalize string literals inside
    def repl_array(m: re.Match) -> str:
        nonlocal ops
        arr = m.group(1)
        join_args = m.group(2)

        def repl_lit(sm: re.Match) -> str:
            nonlocal ops
            if sm.group("s") is not None:
                q = sm.group("q")
                s = sm.group("s")
                updated = normalize_class_string(s)
                if updated != s:
                    ops += 1
                return f"{q}{updated}{q}"
            t = sm.group("t") or ""
            updated = normalize_template_with_expr(t)
            if updated != t:
                ops += 1
            return f"`{updated}`"

        new_arr = RE_STR_LIT.sub(repl_lit, arr)
        return f"className={{[{new_arr}].join({join_args})}}"

    text = RE_ARRAY_JOIN.sub(repl_array, text)

    return text, ops


def main() -> None:
    files_changed = 0
    op_count = 0

    for p in ROOT.rglob("*"):
        if not p.is_file() or not should_process(p):
            continue

        original = p.read_text(encoding="utf-8")
        updated, ops = process_text(original)

        if updated != original:
            files_changed += 1
            op_count += ops
            print(f"\n{'WOULD UPDATE' if DRY_RUN else 'UPDATED'}: {p}")
            print(f"  - prep ops: {ops}")

            if not DRY_RUN:
                p.write_text(updated, encoding="utf-8")

    print(f"\nDone. Files changed: {files_changed} | prep ops: {op_count}")
    if DRY_RUN:
        print("Dry-run only. Set DRY_RUN=False to write changes.")


if __name__ == "__main__":
    main()
