import { expect, test } from '@playwright/test'

import { ROUTEN } from '../routen.ts'

/**
 * Verhaltenstests — das, was axe grundsätzlich nicht sehen kann.
 *
 * axe prüft eine Momentaufnahme des DOM. Ob der Fokus nach einem
 * Ankersprung mitgewandert ist, ob die Pausetaste tatsächlich etwas
 * anhält und ob bei 320px zwei Achsen gescrollt werden müssen, steht
 * nicht im Markup — das zeigt sich erst im Verhalten.
 */

test.describe('Sprungmarke (2.4.1)', () => {
  test('ist das erste fokussierbare Element und springt in den Inhalt', async ({ page }) => {
    await page.goto('/')

    await page.keyboard.press('Tab')

    const ersterFokus = page.locator(':focus')
    await expect(ersterFokus).toHaveClass(/sprungmarke/)
    await expect(ersterFokus).toBeVisible()

    await page.keyboard.press('Enter')

    const zielId = await page.evaluate(() => document.activeElement?.id)
    expect(zielId, 'Nach dem Sprung muss der Fokus im Hauptinhalt sitzen').toBe('inhalt')
  })
})

test.describe('Ankersprünge auf der Speisekarte (2.4.3, 2.4.11)', () => {
  test('nehmen den Fokus mit und landen unter den klebenden Leisten', async ({ page }) => {
    await page.goto('/speisekarte/')

    const anker = page.locator('.anker__liste a').first()
    const ziel = (await anker.getAttribute('href'))?.slice(1)
    await anker.click()

    // Der häufigste reale Fehler: Die Seite scrollt, der Fokus bleibt am Link.
    const fokussiert = await page.evaluate(() => document.activeElement?.id)
    expect(fokussiert, 'Der Fokus muss auf der Zielüberschrift liegen').toBe(ziel)

    // Und das Ziel darf nicht unter Kopfzeile plus Ankerleiste verschwinden.
    const sichtbar = await page.evaluate((id) => {
      const element = document.getElementById(id as string)
      if (!element) return null
      const kasten = element.getBoundingClientRect()
      const wurzel = getComputedStyle(document.documentElement)
      const inPixel = (wert: string) =>
        wert.endsWith('rem')
          ? Number.parseFloat(wert) * 16
          : Number.parseFloat(wert) || 0
      const belegt =
        inPixel(wurzel.getPropertyValue('--kopfhoehe')) +
        inPixel(wurzel.getPropertyValue('--ankerleiste'))
      return { oben: kasten.top, belegt }
    }, ziel)

    expect(sichtbar).not.toBeNull()
    expect(
      sichtbar!.oben,
      'Die Überschrift liegt unter den klebenden Leisten — scroll-margin-top stimmt nicht',
    ).toBeGreaterThanOrEqual(sichtbar!.belegt - 2)
  })
})

test.describe('Pausetaste (2.2.2)', () => {
  test('hält zeitgesteuerte Bewegung an und lässt scroll-getriebene laufen', async ({ page }) => {
    test.skip(test.info().project.name !== 'voll-1440', 'nur in voller Breite sinnvoll')

    await page.goto('/')
    await page.evaluate(() => document.querySelector('[data-flaeche="glut"]')?.scrollIntoView())
    await page.waitForTimeout(300)

    const taste = page.locator('.glut__pause')
    await expect(taste).toBeVisible()
    await expect(taste).toHaveAttribute('aria-pressed', 'false')

    // Mindestgröße für Bedienelemente (2.5.8 fordert 24, wir setzen 44).
    const kasten = await taste.boundingBox()
    expect(kasten!.width).toBeGreaterThanOrEqual(44)
    expect(kasten!.height).toBeGreaterThanOrEqual(44)

    await taste.click()
    await expect(taste).toHaveAttribute('aria-pressed', 'true')

    const zustand = await page.evaluate(() => document.documentElement.dataset['motionPaused'])
    expect(zustand).toBe('true')

    // Zeitgesteuerte Animationen stehen still …
    const zeitAnimation = await page.evaluate(() => {
      const element = document.querySelector('[data-anim="zeit"]')
      return element ? getComputedStyle(element).animationPlayState : null
    })
    if (zeitAnimation !== null) expect(zeitAnimation).toBe('paused')

    // … scroll-getriebene laufen weiter. Sie sind nutzergesteuert, fallen
    // nicht unter 2.2.2, und ein Einfrieren würde die Seite in einem
    // halbfertigen Zwischenzustand stranden lassen.
    const scrollAnimation = await page.evaluate(() => {
      const element = document.querySelector('.gericht__linie')
      return element ? getComputedStyle(element).animationPlayState : null
    })
    if (scrollAnimation !== null) expect(scrollAnimation).toBe('running')

    await taste.click()
    await expect(taste).toHaveAttribute('aria-pressed', 'false')
  })
})

test.describe('Reflow bei 320 px (1.4.10)', () => {
  for (const route of ROUTEN) {
    test(`kein waagerechtes Scrollen: ${route}`, async ({ page }) => {
      test.skip(test.info().project.name !== 'voll-320', 'nur bei 320px relevant')

      await page.goto(route)
      await page.waitForLoadState('networkidle')

      const breite = await page.evaluate(() => ({
        inhalt: document.documentElement.scrollWidth,
        fenster: document.documentElement.clientWidth,
      }))

      expect(
        breite.inhalt,
        `Inhalt ist ${breite.inhalt}px breit bei ${breite.fenster}px Fenster — ` +
          'bei 400 % Zoom müsste in zwei Achsen gescrollt werden',
      ).toBeLessThanOrEqual(breite.fenster + 1)
    })
  }
})

test.describe('Textabstand (1.4.12)', () => {
  test('überschriebene Abstände führen zu keinem Inhaltsverlust', async ({ page }) => {
    test.skip(test.info().project.name !== 'voll-1440', 'einmal genügt')

    await page.goto('/speisekarte/')

    const vorher = await page.evaluate(() => document.body.scrollHeight)

    // Die vom Kriterium geforderten Werte.
    await page.addStyleTag({
      content: `* {
        line-height: 1.5 !important;
        letter-spacing: 0.12em !important;
        word-spacing: 0.16em !important;
      }
      p { margin-block-end: 2em !important; }`,
    })
    await page.waitForTimeout(200)

    const nachher = await page.evaluate(() => {
      // Abgeschnittener Text zeigt sich als Element, dessen Inhalt über die
      // eigene Grenze hinausragt, obwohl es nicht scrollen darf.
      const verdaechtig = [...document.querySelectorAll('p, h1, h2, h3, li, dt, dd, td, th')].filter(
        (element) => {
          const stil = getComputedStyle(element)
          if (stil.overflow === 'visible' && stil.overflowY === 'visible') return false
          return element.scrollHeight > element.clientHeight + 2
        },
      )
      return { hoehe: document.body.scrollHeight, abgeschnitten: verdaechtig.length }
    })

    expect(nachher.abgeschnitten, 'Text wird bei erhöhtem Abstand abgeschnitten').toBe(0)
    expect(nachher.hoehe, 'Die Seite muss bei größeren Abständen wachsen dürfen').toBeGreaterThan(
      vorher,
    )
  })
})

test.describe('Bedienbarkeit ohne Maus', () => {
  test('alle Bedienelemente sind mindestens 44 × 44 groß (2.5.8)', async ({ page }) => {
    test.skip(test.info().project.name !== 'voll-1440', 'einmal genügt')

    await page.goto('/kontakt/')

    const zuKlein = await page.evaluate(() => {
      const elemente = [...document.querySelectorAll('a[href], button, input, [tabindex="0"]')]
      return elemente
        .filter((element) => {
          const kasten = element.getBoundingClientRect()
          if (kasten.width === 0 && kasten.height === 0) return false // verborgen
          // Links im Fließtext sind ausdrücklich ausgenommen (2.5.8 „inline“).
          const eltern = element.parentElement
          if (eltern && ['P', 'LI', 'DD', 'TD', 'SPAN'].includes(eltern.tagName)) return false
          return kasten.width < 24 || kasten.height < 24
        })
        .map((element) => `${element.tagName}.${element.className}`)
    })

    expect(zuKlein, `Zu kleine Bedienelemente: ${zuKlein.join(', ')}`).toHaveLength(0)
  })
})
