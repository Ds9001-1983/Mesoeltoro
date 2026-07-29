import { expect, test } from '@playwright/test'

import { lesePng } from '../hilfen/png.ts'
import { ROUTEN } from '../routen.ts'

/**
 * Wie viel blanke dunkle Fläche verträgt eine Seite?
 *
 * Am 29.07.2026 meldete der Auftraggeber „zu dunkel das ganze“. Nachgezählt
 * war der Befund eindeutig — und er hatte nichts mit dem Farbwert zu tun,
 * sondern mit dem Anteil:
 *
 *     Startseite      81,0 % blanke Grundfläche
 *     Speisekarte     93,5 %
 *     Philosophie     88,0 %
 *     Kontakt         86,6 %
 *
 * Eine dunkle Seite wirkt nicht dunkel, weil ihr Grundton dunkel ist. Sie
 * wirkt dunkel, wenn nichts darauf steht.
 *
 * Gemessen wird deshalb genau das: der Anteil der Pixel, die die nackte
 * dunkle Grundfläche sind — kein Bild, keine helle Fläche, kein Bordeaux,
 * keine Schrift.
 *
 * Der erste Entwurf dieser Prüfung maß stattdessen den Anteil der jeweils
 * VORHERRSCHENDEN Fläche. Der war falsch: Die Speisekarte fiel damit mit
 * 96 % durch, obwohl sie inzwischen hell ist — eine Karte besteht nun einmal
 * fast nur aus Papier, und das ist kein Mangel. Die Prüfung muss dasselbe
 * messen, was gemeldet wurde.
 */

/** Über diesem Anteil gilt eine Route als schwarze Wand. */
const HOECHSTANTEIL = 0.7

/** Wie weit ein Pixel von der Grundfläche abweichen darf, um als „leer“ zu gelten. */
const TOLERANZ = 6

/** Leuchtdichte von --grund (#14110D) nach derselben groben Gewichtung. */
const GRUND = 0.2126 * 0x14 + 0.7152 * 0x11 + 0.0722 * 0x0d

/**
 * Relative Leuchtdichte, grob gewichtet.
 *
 * Bewusst NICHT die WCAG-Formel: Hier geht es nicht um Kontrast, sondern um
 * die Frage, ob zwei Pixel dieselbe Fläche sind. Dafür reicht der lineare
 * Helligkeitsanteil, und er ist über Millionen Pixel deutlich billiger.
 */
function helligkeit(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

test.describe('Flächenhaushalt', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'einmal je Breite genügt')

  for (const route of ROUTEN) {
    test(`ist nicht überwiegend leere Fläche: ${route}`, async ({ page }, info) => {
      // Die Messung gilt für den Desktop-Auftritt. Bei 320px ist eine Seite
      // naturgemäß textlastiger, und das ist kein Mangel.
      test.skip(info.project.name !== 'voll-1440', 'nur in voller Breite aussagekräftig')

      await page.goto(route)

      /*
       * Erst durchscrollen. Ohne das bleiben lazy geladene Bilder leer, und
       * die Aufnahme meldet Fläche, die in Wahrheit ein Foto ist — am
       * 29.07.2026 wären dadurch zwei Kapitelbilder als fehlend gezählt
       * worden.
       */
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 600) {
          window.scrollTo(0, y)
          await new Promise((r) => setTimeout(r, 80))
        }
        window.scrollTo(0, 0)
      })
      await page.waitForTimeout(600)

      const aufnahme = await page.screenshot({ fullPage: true, type: 'png' })
      const bild = lesePng(aufnahme)

      // lesePng liefert RGB, drei Bytes je Pixel.
      let leer = 0
      const pixel = bild.breite * bild.hoehe
      for (let i = 0; i < bild.daten.length; i += 3) {
        const l = helligkeit(bild.daten[i]!, bild.daten[i + 1]!, bild.daten[i + 2]!)
        if (Math.abs(l - GRUND) < TOLERANZ) leer += 1
      }
      const anteil = leer / pixel

      expect(
        anteil,
        `${route}: ${(anteil * 100).toFixed(1)} % der Seite sind blanke dunkle ` +
          `Grundfläche. Erlaubt sind ${HOECHSTANTEIL * 100} %. Die Seite braucht ` +
          'Bilder, einen Flächenwechsel oder weniger Leerraum — nicht einen ' +
          'anderen Grundton.',
      ).toBeLessThan(HOECHSTANTEIL)
    })
  }
})

test.describe('Flächenwechsel', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'nur einmal nötig')

  test('die Startseite trägt beide Flächen und den Bordeaux-Block', async ({ page }) => {
    await page.goto('/')

    // Ein Kapitelwechsel ist eine Kante: Wenn eine dieser Flächen fehlt,
    // läuft die Seite wieder als ein einziger schwarzer Block durch.
    await expect(page.locator('[data-flaeche="hell"]')).toHaveCount(2)
    await expect(page.locator('[data-flaeche="bordeaux"]')).toHaveCount(1)
  })

  test('auf heller Fläche steht nirgends Gold als Schrift', async ({ page }) => {
    await page.goto('/speisekarte/')

    /*
     * Gold auf Kalk sind 2,09:1 — der Wert steht als ausdrückliches Verbot in
     * src/lib/farben.ts. Der Fehler passiert nicht durch Absicht, sondern
     * durch ein vergessenes var(--gold) in einer Komponente, die vorher nur
     * auf dunklem Grund stand. Deshalb wird er hier am gerenderten Ergebnis
     * gesucht und nicht im Quelltext.
     */
    const treffer = await page.evaluate(() => {
      const blatt = document.querySelector('[data-flaeche="hell"]')
      if (!blatt) return ['kein helles Blatt auf der Speisekarte gefunden']

      const schlimm: string[] = []
      for (const element of blatt.querySelectorAll('*')) {
        if (!element.textContent?.trim()) continue
        const farbe = getComputedStyle(element).color
        const [r, g, b] = farbe.match(/\d+/g)!.map(Number) as [number, number, number]
        // Gold ist #C9A24B. Ein enger Radius genügt — es geht um genau
        // diesen einen Ton, nicht um „irgendetwas Gelbliches“.
        if (Math.abs(r - 201) < 12 && Math.abs(g - 162) < 12 && Math.abs(b - 75) < 12) {
          schlimm.push(`${element.tagName.toLowerCase()}.${element.className}`)
        }
      }
      return schlimm
    })

    expect(treffer, 'Gold auf Kalk = 2,09:1').toEqual([])
  })
})
