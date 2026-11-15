import asyncio, pathlib, json
from playwright.async_api import async_playwright
D=pathlib.Path(__file__).resolve().parents[2]
async def main():
 report=[]
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
  for source,name in [('home-twilight.html','home'),('read-novel-twilight.html','read-novel')]:
   for theme in ['light','dark']:
    pg=await b.new_page(viewport={'width':390,'height':844},device_scale_factor=1)
    await pg.goto((D/'mockups/src'/source).as_uri()+'?theme='+theme)
    await pg.evaluate('document.fonts.ready')
    await pg.screenshot(path=str(D/'mockups'/f'{name}-mobile-{theme}.png'))
    # Verify actual font selection for Thai via Chrome DevTools; no fallback tofu.
    session=await pg.context.new_cdp_session(pg); await session.send('DOM.enable'); await session.send('CSS.enable')
    doc=await session.send('DOM.getDocument')
    selector='.article p' if name=='read-novel' else '.hero h1'
    node=await session.send('DOM.querySelector',{'nodeId':doc['root']['nodeId'],'selector':selector})
    fonts=await session.send('CSS.getPlatformFontsForNode',{'nodeId':node['nodeId']})
    vals=await pg.evaluate('''() => {const b=getComputedStyle(document.body); const a=document.querySelector('.article');return {bg:b.getPropertyValue('--bg').trim(),text:b.getPropertyValue('--text').trim(),readerLineHeight:a?getComputedStyle(a).lineHeight:null,readerFontSize:a?getComputedStyle(a).fontSize:null,overflow:document.documentElement.scrollWidth>innerWidth}}''')
    assert not vals['overflow']; assert all('Sarabun' in f['familyName'] or 'Prompt' in f['familyName'] for f in fonts['fonts']), fonts
    report.append({'mockup':f'{name}-mobile-{theme}.png',**vals,'thai_platform_fonts':fonts['fonts']})
    await pg.close()
  pg=await b.new_page(viewport={'width':1100,'height':900},device_scale_factor=1)
  await pg.goto((D/'tokens/preview.html').as_uri()); await pg.evaluate('document.fonts.ready'); await pg.screenshot(path=str(D/'tokens/tokens-preview.png'),full_page=True)
  await b.close()
 (D/'tokens/render-checks.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(report,ensure_ascii=False,indent=2))
asyncio.run(main())
