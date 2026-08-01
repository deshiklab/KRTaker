#!/usr/bin/env python3
"""Assemble KRTaker design-prototype.html from parts."""
import re

shell = open('/root/KRTaker/build/part1_shell.html').read()
css = open('/tmp/rem_style.css').read()
seed = open('/root/KRTaker/build/part2_seed.js').read()
app = ''
for f in ['part3_core.js','part4_ops.js','part5_app.js']:
    app += open('/root/KRTaker/build/'+f).read() + '\n'

out = shell.replace('{{CSS}}', css).replace('{{SEED}}', seed).replace('{{APP}}', app)
open('/root/KRTaker/docs/design-prototype.html','w').write(out)
print("Wrote docs/design-prototype.html:", len(out)//1024, "KB")

# extract JS for syntax check
js = seed + '\n' + app
open('/tmp/krtaker_app.js','w').write(js)
print("JS extracted for node --check:", len(js)//1024, "KB")
