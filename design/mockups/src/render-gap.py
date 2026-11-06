"""Render MVP gap screens + Twilight light rebrand pages; check Thai fonts."""
import asyncio, pathlib, json, sys
from playwright.async_api import async_playwright

SRC = pathlib.Path(__file__).resolve().parent
OUT = SRC.parent
JOBS = [l.split() for l in open(SRC/'jobs-gap.txt') if l.strip() and not l.startswith('#')]
only = sys.argv[1:]

async def main():
  report = []
  async with async_playwright() as p:
    b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    for name, url, w, h, full in JOBS:
      if only and not any(o in name for o in only): continue
      pg = await b.new_page(viewport={'width': int(w), 'height': int(h)}, device_scale_factor=1)
      await pg.goto((SRC/url).as_uri())
      await pg.evaluate('document.fonts.ready')
      await pg.wait_for_timeout(400)
      path = OUT/(name+'.png')
      await pg.screenshot(path=str(path), full_page=(full=='1'))
      # Thai font check on a heading or body text
      session = await pg.context.new_cdp_session(pg)
      await session.send('DOM.enable'); await session.send('CSS.enable')
      doc = await session.send('DOM.getDocument')
      for sel in ['.topbar .title', 'h1', '.brand h1', '.hero h1', 'body']:
        node = await session.send('DOM.querySelector', {'nodeId': doc['root']['nodeId'], 'selector': sel})
        if node.get('nodeId'):
          fonts = await session.send('CSS.getPlatformFontsForNode', {'nodeId': node['nodeId']})
          if fonts.get('fonts'):
            ok = all('Sarabun' in f['familyName'] or 'Prompt' in f['familyName'] or 'Noto Sans Thai' in f['familyName'] for f in fonts['fonts'])
            report.append({'mockup': name+'.png', 'selector': sel, 'fonts': fonts['fonts'], 'thai_ok': ok})
            break
      overflow = await pg.evaluate('() => document.documentElement.scrollWidth > innerWidth')
      report[-1]['overflow'] = overflow
      print(name, 'ok' if report[-1].get('thai_ok') and not overflow else 'CHECK', report[-1].get('fonts'))
      await pg.close()
    await b.close()
  (OUT/'src'/'gap-render-checks.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n')
  bad = [r for r in report if not r.get('thai_ok') or r.get('overflow')]
  if bad:
    print('FAILURES', json.dumps(bad, ensure_ascii=False, indent=2))
    raise SystemExit(1)
  print('all ok', len(report))

asyncio.run(main())
