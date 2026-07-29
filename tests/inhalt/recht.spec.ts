import { expect, test } from '@playwright/test'

import { ROUTEN } from '../routen.ts'

/**
 * Rechtliche Abnahmekriterien im echten Browser.
 *
 * Die Skripte in scripts/ prüfen das gebaute HTML statisch. Hier läuft
 * dieselbe Frage gegen die laufende Seite — das fängt zusätzlich
 * Laufzeitanfragen, die ein Grep über Dateien nicht sehen kann.
 */

test.describe('Keine Anfragen an fremde Server (§ 25 TDDDG)', () => {
  for (const route of ROUTEN) {
    test(`kein Fremdaufruf: ${route}`, async ({ page, baseURL }) => {
      const fremde: string[] = []

      // route() fängt JEDE Anfrage ab, auch die, die erst ein Skript auslöst.
      await page.route('**', async (anfrage) => {
        const ziel = new URL(anfrage.request().url())
        const eigen = new URL(baseURL ?? 'http://localhost:4321')
        if (ziel.origin !== eigen.origin && ziel.protocol !== 'data:') {
          fremde.push(`${anfrage.request().resourceType()}: ${ziel.href}`)
        }
        await anfrage.continue()
      })

      await page.goto(route)
      await page.waitForLoadState('networkidle')

      // Auch nach etwas Interaktion darf nichts nachgeladen werden.
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await page.waitForTimeout(500)

      expect(
        fremde,
        `${route} lädt von fremden Servern:\n  ${fremde.join('\n  ')}\n` +
          'Das löst die Einwilligungspflicht aus und macht ein Banner nötig.',
      ).toHaveLength(0)
    })
  }
})

test.describe('Keine Rechtsaltlasten', () => {
  test('nirgends ein Verweis auf die abgeschaltete ODR-Plattform', async ({ page }) => {
    for (const route of ROUTEN) {
      await page.goto(route)
      const text = await page.evaluate(() => document.documentElement.outerHTML)

      expect(text, `${route} verweist auf die ODR-Plattform`).not.toContain('consumers/odr')
      expect(text, `${route} nennt die Online-Streitbeilegung`).not.toContain(
        'Online-Streitbeilegung',
      )
    }
  })

  test('das Impressum nennt § 5 DDG, nicht das TMG', async ({ page }) => {
    await page.goto('/impressum/')
    const text = await page.locator('main').innerText()

    expect(text).toContain('§ 5 DDG')
    expect(text, 'Das TMG ist seit 14.05.2024 abgelöst').not.toContain('TMG')

    // Pflichtangaben nach § 5 DDG
    for (const pflicht of ['HRB 16767', 'Amtsgericht Siegburg', 'DE 348118893', 'Christian Böhmer']) {
      expect(text, `Pflichtangabe fehlt: ${pflicht}`).toContain(pflicht)
    }

    // Die E-Mail muss im Klartext dastehen (EuGH C-298/07).
    await expect(page.locator('main a[href^="mailto:"]').first()).toBeVisible()
  })
})

test.describe('Speisekarte', () => {
  test('nennt Endpreise ohne Steuersatz und weist die Kennzeichnung aus', async ({ page }) => {
    await page.goto('/speisekarte/')
    const text = await page.locator('main').innerText()

    expect(text).toContain('inklusive gesetzlicher Mehrwertsteuer')

    // Kein ausgeschriebener Prozentsatz: Seit 01.01.2026 gelten 7 % auf
    // Speisen und 19 % auf Getränke — eine einzelne Zahl wäre für die
    // halbe Karte falsch und bei der nächsten Änderung ganz.
    expect(text, 'Ein Steuersatz im Sichttext ist reine Haftungsfläche').not.toMatch(
      /\b\d{1,2}\s*(%|Prozent)\s*(MwSt|Mehrwertsteuer|Umsatzsteuer)/i,
    )

    // Preise im deutschen Format mit Komma.
    expect(text).toMatch(/\d{1,3},\d{2}\s*€/)
  })

  test('funktioniert vollständig ohne JavaScript', async ({ browser }) => {
    test.skip(test.info().project.name !== 'voll-1440', 'einmal genügt')

    const kontext = await browser.newContext({ javaScriptEnabled: false })
    const seite = await kontext.newPage()
    await seite.goto('http://localhost:4321/speisekarte/')

    // Ohne Gross-/Kleinschreibung: Die Überschriften laufen seit dem
    // 29.07.2026 in Versalien, und `innerText` gibt text-transform mit aus.
    // Geprüft wird der INHALT, nicht seine Darstellung.
    const text = await seite.locator('main').innerText()
    expect(text).toMatch(/speisekarte/i)
    expect(text).toMatch(/rumpsteak/i)
    expect(text).toMatch(/inklusive gesetzlicher mehrwertsteuer/i)

    // Die Sprungnavigation ist reines HTML und muss auch hier stehen.
    await expect(seite.locator('.anker__liste a').first()).toBeVisible()

    await kontext.close()
  })
})

test.describe('Bewertungen (§ 5b Abs. 3 UWG)', () => {
  test('das Zitat trägt den Prüfhinweis unmittelbar bei sich', async ({ page }) => {
    await page.goto('/')

    // Seit dem 29.07.2026 stehen VIER Stimmen auf der Startseite. Der Hinweis
    // hängt am einzelnen Zitat, nicht an der Sektion — deshalb wird hier auch
    // jedes einzeln geprüft und nicht nur das erste.
    const stimmen = page.locator('.stimme')
    const anzahl = await stimmen.count()
    expect(anzahl).toBeGreaterThan(0)

    for (let i = 0; i < anzahl; i += 1) {
      await expect(stimmen.nth(i)).toBeVisible()
      expect(
        await stimmen.nth(i).innerText(),
        'Wer Bewertungen zeigt, muss angeben, ob und wie deren Echtheit geprüft wird',
      ).toContain('Echtheitsprüfung')
    }
  })

  test('kein aggregateRating und kein Review-Markup', async ({ page }) => {
    for (const route of ['/', '/speisekarte/', '/kontakt/']) {
      await page.goto(route)
      const bloecke = await page.evaluate(() =>
        [...document.querySelectorAll('script[type="application/ld+json"]')].map(
          (element) => element.textContent ?? '',
        ),
      )
      const alles = bloecke.join(' ')
      expect(alles, `${route} enthält aggregateRating`).not.toContain('aggregateRating')
      expect(alles, `${route} enthält Review-Markup`).not.toContain('"review"')
    }
  })
})

test.describe('Strukturierte Daten', () => {
  test('sind gültiges JSON und beschreiben das Restaurant', async ({ page }) => {
    await page.goto('/')

    const daten = await page.evaluate(() =>
      [...document.querySelectorAll('script[type="application/ld+json"]')].map((element) =>
        JSON.parse(element.textContent ?? '{}'),
      ),
    )

    const restaurant = daten.find((eintrag) => eintrag['@type'] === 'Restaurant')
    expect(restaurant, 'Kein Restaurant-Block gefunden').toBeTruthy()
    expect(restaurant.telephone).toBe('+4922914347')
    expect(restaurant.address.postalCode).toBe('51545')
    // Mittag und Abend sind zwei getrennte Zeiträume je Tag, kein Durchlauf.
    expect(restaurant.openingHoursSpecification).toHaveLength(10)
  })
})
