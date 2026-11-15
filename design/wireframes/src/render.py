import sys, asyncio, pathlib
from playwright.async_api import async_playwright
OUT = pathlib.Path(__file__).resolve().parent.parent
SRC = pathlib.Path(__file__).resolve().parent
JOBS = [l.split() for l in open(SRC/'jobs.txt') if l.strip() and not l.startswith('#')]
only = sys.argv[1:]
async def main():
  async with async_playwright() as p:
    b = await p.chromium.launch(executable_path='/usr/bin/google-chrome')
    for name, url, w, h, full in JOBS:
      if only and not any(o in name for o in only): continue
      pg = await b.new_page(viewport={'width': int(w), 'height': int(h)})
      await pg.goto('file://'+str(SRC/url))
      await pg.evaluate('document.fonts.ready')
      await pg.wait_for_timeout(500)
      await pg.screenshot(path=str(OUT/(name+'.png')), full_page=(full=='1'))
      await pg.close()
      print(name)
    await b.close()
asyncio.run(main())
