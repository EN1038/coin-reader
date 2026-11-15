"""Recompute stored WCAG 2.x sRGB normal-text contrast pairs; no dependencies."""
import json,pathlib
p=pathlib.Path(__file__).parent
j=json.loads((p/'tokens.json').read_text())
def lum(h):
 s=[int(h[i:i+2],16)/255 for i in (1,3,5)]
 s=[x/12.92 if x<=.04045 else ((x+.055)/1.055)**2.4 for x in s]
 return sum(x*y for x,y in zip(s,[.2126,.7152,.0722]))
for c in j['contrast_AA_checked']:
 t=j['color'][c['theme']];a=t[c['foreground']];b=t[c['background']]
 assert (a,b)==(c['foreground_hex'],c['background_hex'])
 lo,hi=sorted([lum(a),lum(b)]);r=(hi+.05)/(lo+.05)
 assert r>=4.5 and abs(r-c['ratio'])<.00051,c
print(f"PASS: {len(j['contrast_AA_checked'])} actual pairs >= 4.5:1")
