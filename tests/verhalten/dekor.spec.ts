import { expect, test } from '@playwright/test'

import { ROUTEN } from '../routen.ts'

/**
 * Prüfungen für die drei Dekorationsschichten, die am 28.07.2026 dazukamen:
 * Vorhang (Ladeanzeige), Zeiger (eigener Mauszeiger) und Papierkorn.
 *
 * Alle drei sind reine Dekoration. Der Zweck dieser Datei ist nachzuweisen,
 * dass sie das auch bleiben — dass also keine von ihnen Inhalt verdeckt,
 * Fokus stiehlt oder ohne JavaScript etwas kaputt lässt.
 */

test.describe('Der Vorhang (Ladeanzeige)', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'nur einmal nötig')

  test('verschwindet und lässt kein Element im DOM zurück', async ({ page }) => {
    await page.goto('/')
    // Notbremse im Modul liegt bei 2 s; danach darf nichts mehr da sein.
    await expect(page.locator('.vorhang')).toHaveCount(0, { timeout: 4000 })
    expect(await page.evaluate(() => document.documentElement.dataset['vorhang'])).not.toBe(
      'laeuft',
    )
  })

  test('erscheint beim zweiten Aufruf derselben Sitzung nicht erneut', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.vorhang')).toHaveCount(0, { timeout: 4000 })

    // Gleiche Sitzung, gleicher Kontext: sessionStorage trägt den Vermerk.
    await page.goto('/speisekarte/')
    expect(await page.evaluate(() => document.documentElement.dataset['vorhang'])).toBeUndefined()
  })

  test('verzögert den größten Inhalt nicht — LCP bleibt unter 2,5 s', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' })

    const lcp = await page.evaluate(
      () =>
        new Promise<number>((fertig) => {
          let letzter = 0
          new PerformanceObserver((liste) => {
            for (const eintrag of liste.getEntries()) letzter = eintrag.startTime
          }).observe({ type: 'largest-contentful-paint', buffered: true })
          // Kurz warten, damit späte Kandidaten noch eintreffen.
          setTimeout(() => fertig(letzter), 800)
        }),
    )

    // Die harte Auflage aus dem Plan: Verschlechtert der Vorhang den LCP
    // messbar, fliegt er raus. 2500 ms ist die Schwelle der Core Web Vitals.
    expect(lcp).toBeGreaterThan(0)
    expect(lcp).toBeLessThan(2500)
  })
})

test.describe('Der Zeiger (eigener Mauszeiger)', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'nur einmal nötig')

  test('blendet den System-Cursor nirgends aus', async ({ page }) => {
    await page.goto('/')
    await page.mouse.move(400, 400)

    // `cursor: none` würde Nutzern mit vergrößertem Systemzeiger oder
    // Bildschirmvergrößerer die Orientierung nehmen. Es darf nirgends stehen.
    const versteckt = await page.evaluate(() =>
      [...document.querySelectorAll('*')].some(
        (element) => getComputedStyle(element).cursor === 'none',
      ),
    )
    expect(versteckt).toBe(false)
  })

  test('nimmt keine Zeigerereignisse an und ist für Hilfsmittel unsichtbar', async ({ page }) => {
    await page.goto('/')
    await page.mouse.move(400, 400)
    const ring = page.locator('.zeiger')

    if ((await ring.count()) === 0) return // kein feines Zeigegerät im Lauf

    await expect(ring).toHaveAttribute('aria-hidden', 'true')
    expect(await ring.evaluate((element) => getComputedStyle(element).pointerEvents)).toBe('none')

    // Er liegt unter der klebenden Kopfzeile — sonst könnte er einen
    // Fokusring überdecken (2.4.11).
    const zRing = await ring.evaluate((element) => Number(getComputedStyle(element).zIndex))
    const zKopf = await page
      .locator('.kopfzeile')
      .evaluate((element) => Number(getComputedStyle(element).zIndex))
    expect(zRing).toBeLessThan(zKopf)
  })

  test('läuft bei reduzierter Bewegung gar nicht', async ({ browser }) => {
    const kontext = await browser.newContext({ reducedMotion: 'reduce' })
    const seite = await kontext.newPage()
    await seite.goto('/')
    await seite.mouse.move(400, 400)
    await seite.waitForTimeout(300)
    await expect(seite.locator('.zeiger')).toHaveCount(0)
    await kontext.close()
  })
})

test.describe('Das Papierkorn', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'nur einmal nötig')

  for (const route of ROUTEN) {
    test(`liegt hinter dem Inhalt und fängt keine Klicks: ${route}`, async ({ page }) => {
      await page.goto(route)
      const korn = await page.evaluate(() => {
        const stil = getComputedStyle(document.body, '::before')
        return {
          zIndex: stil.zIndex,
          zeigerereignisse: stil.pointerEvents,
          deckkraft: Number(stil.opacity),
        }
      })

      expect(korn.zeigerereignisse).toBe('none')
      // Negativer z-index heißt: hinter jedem Inhalt, über der Grundfläche.
      expect(Number(korn.zIndex)).toBeLessThan(0)
      // Über 4 % fällt Messing auf Kalk unter 3:1 — siehe Rechnung in basis.css.
      expect(korn.deckkraft).toBeLessThanOrEqual(0.04)
    })
  }
})

test.describe('Bilder', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'nur einmal nötig')

  for (const route of ROUTEN) {
    test(`kein inhaltstragendes Bild ohne Alternativtext: ${route}`, async ({ page }) => {
      await page.goto(route)

      const bilder = await page.$$eval('img', (elemente) =>
        elemente.map((element) => ({
          quelle: element.getAttribute('src') ?? '',
          alt: element.getAttribute('alt'),
          dekorativ: element.closest('[data-dekor]') !== null,
        })),
      )

      for (const bild of bilder) {
        // Ein fehlendes alt-Attribut ist immer ein Fehler (1.1.1).
        expect(bild.alt, `${bild.quelle} hat kein alt-Attribut`).not.toBeNull()

        // Ein LEERES alt ist nur bei ausdrücklich dekorativen Bildern richtig.
        // Fotos aus dem Register tragen immer einen Text — dass er stimmt,
        // stellt content/bildnachweise.json sicher, nicht dieser Test.
        if (!bild.dekorativ) {
          expect(bild.alt?.length ?? 0, `${bild.quelle} hat ein leeres alt`).toBeGreaterThan(10)
        }
      }
    })
  }
})

test.describe('Spanisch (3.1.2)', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'nur einmal nötig')

  for (const route of ROUTEN) {
    test(`jede spanische Zeile trägt lang="es": ${route}`, async ({ page }) => {
      await page.goto(route)

      /*
       * Ohne `lang="es"` spricht eine deutsche Sprachausgabe „La Parrilla“
       * mit deutschem Lautwert aus. Das ist WCAG 3.1.2 — und es ist der
       * Fehler, der bei zweisprachiger Gestaltung am häufigsten passiert,
       * weil er beim Ansehen nicht auffällt.
       */
      const verdaechtig = await page.evaluate(() => {
        const SPANISCH =
          /\b(La Parrilla|La Carta|La Casa|La Bodega|La Reserva|Los Huéspedes|Sobre la brasa|La Filosofía|El Corazón|El Horario|Entrantes|Postres|Verduras|Guarniciones|Carnes y Pescados|Estancia|Desde|Parrilla Argentina)\b/
        const treffer: string[] = []
        const lauf = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
        let knoten = lauf.nextNode()
        while (knoten) {
          const text = (knoten.textContent ?? '').trim()
          if (text && SPANISCH.test(text)) {
            const element = knoten.parentElement
            const sprache = element?.closest('[lang]')?.getAttribute('lang') ?? 'de'
            if (!sprache.startsWith('es')) treffer.push(text.slice(0, 60))
          }
          knoten = lauf.nextNode()
        }
        return treffer
      })

      expect(verdaechtig, `Spanisch ohne lang="es" auf ${route}`).toEqual([])
    })
  }

  test('keine Information steht ausschließlich auf Spanisch', async ({ page }) => {
    await page.goto('/speisekarte/')

    // Jede spanische Rubrik hat eine deutsche Überschrift unmittelbar daneben.
    const rubriken = page.locator('.kategorie__spanisch')
    const anzahl = await rubriken.count()
    expect(anzahl).toBeGreaterThan(0)

    for (let i = 0; i < anzahl; i += 1) {
      const deutsch = await rubriken
        .nth(i)
        .evaluate((el) => el.nextElementSibling?.textContent?.trim() ?? '')
      expect(deutsch.length, 'spanische Rubrik ohne deutsche Überschrift').toBeGreaterThan(2)
    }
  })
})
