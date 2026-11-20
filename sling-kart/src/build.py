"""Build Sling Kart.

Combines game.html with three.min.js (three.js r149, bundled so the game works offline)
into ../index.html, and stamps the version label shown on the title screen.

Usage (from this folder):  python3 build.py
Bump VERSION for each published update.
"""
import datetime, os, zoneinfo

VERSION = "2.5"

here = os.path.dirname(os.path.abspath(__file__))
now = datetime.datetime.now(zoneinfo.ZoneInfo("Pacific/Auckland"))
stamp = now.strftime('%-d %b %Y, %-I:%M%p').replace('AM', 'am').replace('PM', 'pm')
label = f"Sling Kart v{VERSION} · {stamp}"

src = open(os.path.join(here, 'game.html'), encoding='utf-8').read()
three = open(os.path.join(here, 'three.min.js'), encoding='utf-8').read()
out = src.replace('/*__THREE__*/', three).replace('__VERSION__', label)
open(os.path.join(here, '..', 'index.html'), 'w', encoding='utf-8').write(out)
print(label, f"({len(out):,} bytes)")
