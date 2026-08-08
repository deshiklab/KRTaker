#!/usr/bin/env python3
"""bump_v382.py — v3.81 → v3.82 + sw v89 → v90 (Web CMS rich-text editor with HTML source toggle in superadmin panel; cms-hydrate renders admin-authored HTML)."""
import glob, sys

OLD = 'v=3.81'
NEW = 'v=3.82'
OLD_SW = 'v89'
NEW_SW = 'v90'

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
