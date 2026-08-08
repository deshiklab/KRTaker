#!/usr/bin/env python3
"""bump_v384.py — v3.83 → v3.84 + sw v91 → v92 (Web CMS advanced Add-field builder: type picker text/long/image/color/url/number/toggle with live type-match validation + 🔧 Fix key, key suggestions per type, section picker + new-section, clone-from-existing, optional EN+বাংলা _bn twin creation, type-matched value editor incl. media picker insert; new bool field type renders as checkbox)."""
import glob, sys

OLD = 'v=3.83'
NEW = 'v=3.84'
OLD_SW = 'v91'
NEW_SW = 'v92'

files = sorted(glob.glob('web/*.html'))
n_old = 0
for f in files:
    s = open(f, encoding='utf-8').read()
    o = s
    n_old += s.count(OLD)
    s = s.replace(OLD, NEW)
    if s != o:
        open(f, 'w', encoding='utf-8').write(s)
        print('bumped', f)

sw = 'web/sw.js'
s = open(sw, encoding='utf-8').read()
n_sw = s.count(OLD_SW)
s = s.replace(OLD_SW, NEW_SW)
open(sw, 'w', encoding='utf-8').write(s)
print(f'sw.js: {n_sw} x {OLD_SW} -> {NEW_SW}')

left = 0
for f in files + [sw]:
    s = open(f, encoding='utf-8').read()
    left += s.count(OLD) + s.count(OLD_SW)
print(f'main refs bumped: {n_old}, stragglers left: {left}')
sys.exit(1 if left else 0)
