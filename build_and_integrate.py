from pathlib import Path
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parent
FRONTEND = ROOT / "frontend"
BACKEND = ROOT / "backend"
BUILD = FRONTEND / "build"
DEST_STATIC = BACKEND / "static"

subprocess.run(["node", str(FRONTEND / "node_modules" / "react-scripts" / "bin" / "react-scripts.js"), "build"], cwd=FRONTEND, check=True)
if not BUILD.exists():
    raise SystemExit("frontend/build was not produced.")

DEST_STATIC.mkdir(parents=True, exist_ok=True)
for child in BUILD.iterdir():
    if child.name == "index.html":
        shutil.copy2(child, BACKEND / "templates" / "index.html")
    elif child.name == "static" and child.is_dir():
        for asset in child.rglob("*"):
            if asset.is_file():
                dest = DEST_STATIC / asset.relative_to(child)
                dest.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(asset, dest)
    else:
        dest = DEST_STATIC / child.name
        if dest.exists():
            shutil.rmtree(dest) if dest.is_dir() else dest.unlink()
        shutil.copytree(child, dest) if child.is_dir() else shutil.copy2(child, dest)

print("React production build integrated into backend/.")
print("Run: cd backend && python manage.py migrate && python manage.py runserver")
