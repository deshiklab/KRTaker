#!/usr/bin/env python3
"""bump_v383.py — v3.82 → v3.83 + sw v90 → v91 (Web CMS realistic preview: loads the real page in a wide iframe with draft values injected, device viewport toggles Desktop/Tablet/Mobile, EN/BN aware; replaces the old generic hero mockup)."""
import glob

OLD = 'v=3.82'
NEW = 'v=3.83'
OLD_SW = 'v90'
NEW_SW = 'v91'

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
import sys
sys.exit(1 if left else 0)
