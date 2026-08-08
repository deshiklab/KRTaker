#!/usr/bin/env python3
"""bump_v381.py — v3.80 → v3.81 + sw v88 → v89 (absolute /api/* fetch paths in main.js — fixes whitelabel logos on clean-URL pages /building/*, /area/*, blog/*)."""
import glob, re, sys

OLD = 'v=3.80'
NEW = 'v=3.81'
OLD_SW = 'v88'
NEW_SW = 'v89'

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
