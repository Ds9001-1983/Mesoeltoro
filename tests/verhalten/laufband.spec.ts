import { expect, test } from '@playwright/test'

/**
 * Das Laufband ist die Stelle, an der die SUPERBRAND-Vorschau WCAG 2.2.2
 * verfehlt: Dort läuft es über GSAP mit `repeat: -1` und ohne jedes
 * Bedienelement. Automatisch startende Bewegung über fünf Sekunden braucht
 * einen Mechanismus zum Anhalten AUF DER SEITE.
 *
 * Diese Datei hält fest, dass die Umsetzung hier das leistet — und dass der
 * Inhalt dabei nicht verloren geht.
 */

test.describe('Laufband (2.2.2 Pause, Stop, Hide)', () => {
  test('trägt eine Pausetaste, die die Bewegung tatsächlich anhält', async ({ page }, info) => {
    test.skip(info.project.name.startsWith('reduziert'), 'Dort läuft es gar nicht erst')

    await page.goto('/')
    const band = page.locator('.laufband__reihe').first()
    await expect(band).toBeVisible()

    const taste = page.locator('.laufband__pause')
    await expect(taste, 'ohne Pausetaste wäre das ein 2.2.2-Verstoß').toBeVisible()
    await expect(taste).toHaveAttribute('aria-pressed', 'false')

    /*
     * Läuft es überhaupt?
     *
     * Nicht zwei Einzelmessungen mit festem Abstand: Unter Last kann die
     * Animation beim ersten Blick noch gar nicht angelaufen sein, und der
     * Test wäre dann grundlos rot. Stattdessen wird gewartet, bis sich der
     * Wert nachweislich ändert — mit großzügigem Fenster.
     */
    const laeuft = await band.evaluate(
      (el) =>
        new Promise<boolean>((fertig) => {
          const start = getComputedStyle(el).transform
          const bis = performance.now() + 3000
          const schauen = () => {
            if (getComputedStyle(el).transform !== start) return fertig(true)
            if (performance.now() > bis) return fertig(false)
            requestAnimationFrame(schauen)
          }
          requestAnimationFrame(schauen)
        }),
    )
    expect(laeuft, 'das Band bewegt sich gar nicht').toBe(true)

    await taste.click()
    await expect(taste).toHaveAttribute('aria-pressed', 'true')

    /*
     * Erst der Mechanismus, dann die Wirkung.
     *
     * `aria-pressed` steht sofort, aber die CSS-Regel
     * `[data-motion-paused] [data-anim=zeit] { animation-play-state: paused }`
     * greift erst beim nächsten Stilabgleich. Wer direkt danach die
     * Verschiebung misst, erwischt noch ein oder zwei laufende Bilder und
     * bekommt ein falsches Rot. Am 29.07.2026 genau so beobachtet.
     */
    await expect
      .poll(() => band.evaluate((el) => getComputedStyle(el).animationPlayState), {
        timeout: 2000,
      })
      .toBe('paused')

    // Erst jetzt die Wirkung: über eine volle Sekunde darf sich nichts ändern.
    const stillGeblieben = await band.evaluate(
      (el) =>
        new Promise<boolean>((fertig) => {
          const start = getComputedStyle(el).transform
          const bis = performance.now() + 1000
          const schauen = () => {
            if (getComputedStyle(el).transform !== start) return fertig(false)
            if (performance.now() > bis) return fertig(true)
            requestAnimationFrame(schauen)
          }
          requestAnimationFrame(schauen)
        }),
    )
    expect(stillGeblieben, 'die Pausetaste hält das Band nicht an').toBe(true)
  })

  test('steht bei reduzierter Bewegung von Anfang an still', async ({ browser }) => {
    const kontext = await browser.newContext({ reducedMotion: 'reduce' })
    const seite = await kontext.newPage()
    await seite.goto('/')

    const band = seite.locator('.laufband__reihe').first()
    const zustand = await band.evaluate((el) => getComputedStyle(el).animationName)
    expect(zustand, 'bei reduzierter Bewegung darf keine Animation laufen').toBe('none')

    await kontext.close()
  })

  test('die Begriffe stehen als Liste im Text und sind auffindbar', async ({ page }) => {
    await page.goto('/')

    // Echte Liste, nicht eine Reihe von <span>: sonst findet weder Strg+F
    // noch ein Screenreader die Begriffe.
    const eintraege = page.locator('.laufband__reihe').first().locator('li')
    await expect(eintraege).toHaveCount(7)
    await expect(eintraege.first()).toHaveText('La Morocha')

    // Der zweite Durchlauf ist reine Optik und darf nicht doppelt vorgelesen
    // werden.
    const doppelt = page.locator('.laufband__reihe[aria-hidden="true"]')
    await expect(doppelt).toHaveCount(1)

    // Der Trennpunkt gehört nicht in den Text — er steht als ::after im CSS,
    // sonst läge er beim Kopieren in der Zwischenablage.
    const text = await eintraege.first().textContent()
    expect(text).not.toContain('·')
  })
})

test.describe('Gästestimmen (§ 5b Abs. 3 UWG)', () => {
  test('jedes einzelne Zitat trägt den Prüfhinweis bei sich', async ({ page }) => {
    await page.goto('/')

    const stimmen = page.locator('.stimme')
    const anzahl = await stimmen.count()
    expect(anzahl, 'auf der Startseite steht keine Gästestimme').toBeGreaterThan(0)

    for (let i = 0; i < anzahl; i += 1) {
      const hinweis = stimmen.nth(i).locator('.stimme__pruefung')
      await expect(hinweis, `Zitat ${i + 1} ohne Prüfhinweis`).toBeVisible()
      const text = (await hinweis.textContent()) ?? ''
      // Die Angabe muss aussagen, OB geprüft wird — nicht nur, woher es stammt.
      expect(text.toLowerCase()).toContain('prüfen')
    }
  })

  test('kein aggregateRating und kein Review-Markup im JSON-LD', async ({ page }) => {
    await page.goto('/')
    const bloecke = await page.locator('script[type="application/ld+json"]').allTextContents()
    for (const block of bloecke) {
      expect(block).not.toContain('aggregateRating')
      expect(block).not.toContain('"review"')
      expect(block).not.toContain('ratingValue')
    }
  })
})
