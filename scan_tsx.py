from pathlib import Path

root = Path(".")
exts = {".tsx", ".ts", ".jsx", ".js"}

count = 0
samples = []
for p in root.rglob("*"):
    if p.is_file() and p.suffix in exts and "node_modules" not in p.parts and ".next" not in p.parts:
        count += 1
        if len(samples) < 20:
            samples.append(str(p))

print("files found:", count)
print("sample:")
print("\n".join(samples))
