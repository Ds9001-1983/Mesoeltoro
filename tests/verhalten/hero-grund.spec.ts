import { expect, test } from '@playwright/test'

import { lesePng, pixel } from '../hilfen/png.ts'
import { leuchtdichte } from '../../src/lib/kontrast.ts'

/**
 * Der Hero legt Schrift über ein Foto. Das ist die einzige Stelle im Projekt,
 * an der das überhaupt vorkommt — und die Stelle, an der die SUPERBRAND-
 * Vorschau ihren schwersten Barrierefreiheitsfehler hat.
 *
 * Dieser Test prüft NICHT, ob die Fläche „rein“ ist. Er prüft, was zählt:
 * den tatsächlich gerenderten Kontrast. Dazu wird der Text unsichtbar
 * geschaltet, der Hero aufgenommen und für jeden Textknoten der schlechteste
 * Pixel unter seiner Grundfläche gegen die Textfarbe gerechnet.
 *
 * Warum das nötig ist: Über einem Foto liegen hier vier Verläufe. Ob deren
 * Summe an jeder Stelle dunkel genug ist, lässt sich nicht aus dem
 * Stylesheet ableiten — nur messen. Ein Verlauf, den jemand um zehn Prozent
 * verschiebt, oder ein helleres Hero-Bild bricht diesen Test sofort.
 */

/** Feste Elemente liegen als eigene Ebene über dem Inhalt und scrollen weg. */
const FESTE_EBENEN = '.callbar, .kopfzeile, .vorhang, .zeiger'

const TEXTKNOTEN = [
  '.hero__kicker',
  '.hero__titel',
  '.hero__lead',
  '.ruf-block__wort',
  '.ruf-block__nummer',
  '.hero__unten .weiter',
]

test.describe('Hero — Schrift auf tragfähigem Grund', () => {
  test('jeder Textknoten hält 4,5:1 gegen die real gerenderten Pixel', async ({ page }, info) => {
    await page.goto('/')
    // Schriften abwarten: Vor dem Austausch sitzen die Kästen woanders.
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(300)

    interface Kasten {
      readonly s: string
      readonly x: number
      readonly y: number
      readonly breit: number
      readonly hoch: number
      readonly farbe: string
    }

    const knoten: Kasten[] = await page.evaluate((sel) => {
      const hero = document.querySelector('.hero')
      if (!hero) throw new Error('Kein .hero auf der Startseite')
      const rahmen = hero.getBoundingClientRect()
      return sel
        .map((s) => {
          const element = document.querySelector(s)
          if (!element) return null
          const kasten = element.getBoundingClientRect()
          if (kasten.width === 0 || kasten.height === 0) return null
          return {
            s,
            x: Math.round(Math.max(kasten.x, rahmen.x)),
            y: Math.round(Math.max(kasten.y, rahmen.y)),
            breit: Math.round(Math.min(kasten.right, rahmen.right) - Math.max(kasten.x, rahmen.x)),
            hoch: Math.round(Math.min(kasten.bottom, rahmen.bottom) - Math.max(kasten.y, rahmen.y)),
            farbe: getComputedStyle(element).color,
          }
        })
        // Typprädikat statt einfachem filter: Sonst trägt TypeScript das
        // `null` durch die ganze Auswertung mit.
        .filter(
          (eintrag): eintrag is NonNullable<typeof eintrag> =>
            eintrag !== null && eintrag.breit > 0 && eintrag.hoch > 0,
        )
    }, TEXTKNOTEN)

    expect(knoten.length, 'im Hero wurde kein einziger Textknoten gefunden').toBeGreaterThan(3)

    // Text und feste Ebenen ausblenden — übrig bleibt der Grund.
    await page.addStyleTag({
      content:
        `.hero__inhalt, .hero__inhalt * { color: transparent !important; ` +
        `border-color: transparent !important; text-shadow: none !important; }` +
        `${FESTE_EBENEN} { display: none !important; }`,
    })
    await page.waitForTimeout(150)

    const bild = lesePng(await page.screenshot())

    const befunde: string[] = []

    for (const eintrag of knoten) {
      const kanaele = eintrag.farbe.match(/\d+(\.\d+)?/g)?.map(Number) ?? []
      const hell = leuchtdichte({
        r: kanaele[0] ?? 255,
        g: kanaele[1] ?? 255,
        b: kanaele[2] ?? 255,
      })

      let schlimmster = Number.POSITIVE_INFINITY
      let gemessen = 0

      for (let y = eintrag.y; y < Math.min(bild.hoehe, eintrag.y + eintrag.hoch); y += 2) {
        for (let x = eintrag.x; x < Math.min(bild.breite, eintrag.x + eintrag.breit); x += 3) {
          if (x < 0 || y < 0) continue
          const [r, g, b] = pixel(bild, x, y)
          const grund = leuchtdichte({ r, g, b })
          const wert = (Math.max(hell, grund) + 0.05) / (Math.min(hell, grund) + 0.05)
          if (wert < schlimmster) schlimmster = wert
          gemessen += 1
        }
      }

      if (gemessen === 0) continue

      if (schlimmster < 4.5) {
        befunde.push(`${eintrag.s}: ${schlimmster.toFixed(2)}:1 — gefordert sind 4,5:1`)
      }
    }

    expect(
      befunde,
      `Hero-Schrift auf zu hellem Grund (${info.project.name}):\n  ${befunde.join('\n  ')}`,
    ).toEqual([])
  })
})
