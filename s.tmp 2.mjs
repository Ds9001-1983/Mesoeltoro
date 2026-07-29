import { chromium } from '@playwright/test'
const S = process.argv[2]
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1440, height: 950 }, deviceScaleFactor: 2 })
await p.goto('http://localhost:4321/', { waitUntil: 'networkidle' }); await p.waitForTimeout(1500)
const m = await p.evaluate(() => {
  const i = document.querySelector('.hero__bild img').getBoundingClientRect()
  return { h: Math.round(i.height), w: Math.round(i.width) }
})
console.log('img jetzt', JSON.stringify(m))
await p.screenshot({ path: `${S}/x4-hero.png`, clip: { x: 0, y: 90, width: 1440, height: 560 } })
await b.close()
