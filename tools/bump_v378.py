#!/usr/bin/env python3
"""bump_v378.py — v3.77 → v3.78 + sw v85 → v86.
Bumps every asset version marker in web/*.html (main ?v=3.77 refs AND the stale
share.css/share.js v=3.68 refs) plus the service-worker version string."""
import glob, re, sys

OLD = 'v=3.77'
NEW = 'v=3.78'
OLD_SW = 'v85'
NEW_SW = 'v86'
OLD_SHARE = 'v=3.68'   # stale share.css/share.js tags never picked up by prior bumps

files = sorted(glob.glob('web/*.html'))
n_old = n_share = 0
for f in files:
    s = open(f, encoding='utf-8').read()
    o = s
    n_old += s.count(OLD)
    s = s.replace(OLD, NEW)
    n_share += s.count(OLD_SHARE)
    s = s.replace(OLD_SHARE, NEW)
    if s != o:
        open(f, 'w', encoding='utf-8').write(s)
        print('bumped', f)

sw = 'web/sw.js'
s = open(sw, encoding='utf-8').read()
n_sw = s.count(OLD_SW)
s = s.replace(OLD_SW, NEW_SW)
open(sw, 'w', encoding='utf-8').write(s)
print(f'sw.js: {n_sw} × {OLD_SW} → {NEW_SW}')

# sanity: no stragglers left
left = 0
for f in files + [sw]:
    s = open(f, encoding='utf-8').read()
    left += s.count(OLD) + s.count(OLD_SW) + s.count(OLD_SHARE)
print(f'main refs bumped: {n_old}, share refs bumped: {n_share}, stragglers left: {left}')
sys.exit(1 if left else 0)
