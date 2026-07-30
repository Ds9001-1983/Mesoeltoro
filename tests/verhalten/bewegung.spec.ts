import { expect, test } from '@playwright/test'

import { ROUTEN } from '../routen.ts'

/**
 * Läuft die Bewegung — und sieht man sie?
 *
 * Am 29.07.2026 meldete der Auftraggeber: „warum laufen die animationen nicht
 * da ist sogar ein pause knopf aber es läuft nix". Nachgemessen liefen alle
 * Animationen technisch einwandfrei. Sichtbar war trotzdem keine.
 *
 * Das ist dieselbe Fehlerklasse wie beim Laufband am Vortag, das mit 34 px/s
 * lief: Der bestehende Test wies nach, DASS Bewegung stattfindet. Das war
 * die falsche Frage.
 *
 * Diese Datei stellt die richtige. Sie prüft nicht, ob eine Animation
 * existiert, sondern ob sie über eine Strecke läuft, die ein Mensch
 * durchscrollt, und ob sie dabei tatsächlich einen anderen Wert erreicht.
 */

test.describe('Scroll-getriebene Bewegung ist sichtbar', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'braucht animation-timeline')

  test('die Rubrik-Haarlinie zeichnet sich wirklich', async ({ page }, info) => {
    test.skip(info.project.name !== 'voll-1440', 'einmal in voller Breite genügt')

    await page.goto('/')

    /*
     * Der Kern des Fehlers vom 29.07.2026 war NICHT die Zeitachse, sondern
     * ein doppelt vergebener Keyframe-Name: `linie-zeichnen` existierte in
     * Rubrik.astro und in Gerichtszeile.astro. Bei Namensgleichheit gewinnt
     * die zuletzt geparste Definition für das ganze Dokument — und die der
     * Gerichtszeile hat keinen `from`-Schritt, weil sie ihren Startwert als
     * Basisdeklaration setzt. Die Haarlinie hat keine solche Basis.
     * Ergebnis: Anfang gleich Ende, die Animation lief und veränderte nichts.
     *
     * Deshalb wird hier der ERSTE Keyframe geprüft, nicht nur die Existenz
     * der Animation. Genau daran wäre der Fehler aufgefallen.
     */
    const rahmen = await page.locator('.rubrik__linie').first().evaluate((el) => {
      const anim = el.getAnimations()[0]
      if (!anim) return null
      // getKeyframes() steht nur auf KeyframeEffect, nicht auf AnimationEffect.
      const wirkung = anim.effect as KeyframeEffect | null
      const k = wirkung?.getKeyframes() ?? []
      return { erster: k[0]?.['transform'] ?? null, letzter: k.at(-1)?.['transform'] ?? null }
    })

    expect(rahmen, 'die Haarlinie hat gar keine Animation').not.toBeNull()
    expect(
      rahmen?.erster,
      'Der erste Keyframe ist nicht scaleX(0) — vermutlich hat ein gleichnamiger ' +
        '@keyframes-Block aus einer anderen Komponente ihn überschrieben. ' +
        'Global gültige Keyframes brauchen komponenteneindeutige Namen.',
    ).toBe('scaleX(0)')
    expect(rahmen?.letzter).toBe('scaleX(1)')
  })

  test('die Auslösestrecken sind lang genug, um sie zu bemerken', async ({ page }, info) => {
    test.skip(info.project.name !== 'voll-1440', 'einmal in voller Breite genügt')

    await page.goto('/')

    /*
     * Die Prozente eines `entry`-Bereichs sind Anteile der Höhe des
     * ANIMIERTEN ELEMENTS, nicht der Fensterhöhe. Die Haarlinie ist 1 px
     * hoch — `entry 10%` bis `entry 70%` waren damit 0,6 px Scrollweg.
     * Der Fortschritt sprang zwischen zwei Scrollpositionen von 0 auf 1.
     *
     * Unter 120 px Scrollweg nimmt das niemand als Bewegung wahr. Der Wert
     * ist bewusst niedrig angesetzt: Er soll den Totalausfall fangen, nicht
     * eine Gestaltungsentscheidung erzwingen.
     */
    const MINDESTSTRECKE = 120

    /*
     * Gemessen wird die tatsächliche Strecke, nicht die deklarierten
     * Bereichsgrenzen. `Animation.rangeStart` liefert ein Objekt aus
     * { offset, rangeName } und keine Pixelzahl — ein erster Entwurf dieses
     * Tests hat daraus stillschweigend nichts gemessen und trotzdem bestanden.
     *
     * Wichtig: `behavior: 'instant'`. basis.css setzt `scroll-behavior: smooth`,
     * und ein sanfter Sprung ist nach zwei Frames noch unterwegs — die
     * Messung läge dann bei Scrollposition 1 statt am Ziel. Genau das ist
     * beim Bauen dieses Tests passiert.
     */
    const strecken = await page.evaluate(
      async ({ mindest }) => {
        const ergebnis: { wahl: string; strecke: number | null }[] = []

        for (const wahl of ['.rubrik__linie', '.rubrik__titel', '.anschnitt__ebene--schnitt']) {
          const el = document.querySelector(wahl)
          if (!el) {
            ergebnis.push({ wahl, strecke: null })
            continue
          }
          const oben = el.getBoundingClientRect().top + window.scrollY

          const lies = async (versatz: number): Promise<number> => {
            window.scrollTo({ top: Math.max(0, oben - window.innerHeight + versatz), behavior: 'instant' })
            await new Promise((k) => requestAnimationFrame(() => requestAnimationFrame(k)))
            const anim = el.getAnimations()[0]
            return Number(anim?.effect?.getComputedTiming().progress ?? 0)
          }

          // In Schritten abtasten, bis der Fortschritt 1 erreicht.
          const SCHRITT = 20
          let strecke: number | null = null
          for (let d = 0; d <= mindest * 4; d += SCHRITT) {
            if ((await lies(d)) >= 0.999) {
              strecke = d
              break
            }
          }
          ergebnis.push({ wahl, strecke: strecke ?? mindest * 4 })
        }
        return ergebnis
      },
      { mindest: MINDESTSTRECKE },
    )

    for (const { wahl, strecke } of strecken) {
      expect(strecke, `${wahl} hat gar keine scroll-getriebene Animation`).not.toBeNull()
      expect(
        strecke ?? 0,
        `${wahl} ist nach ${strecke} px Scrollweg schon fertig. Unter ` +
          `${MINDESTSTRECKE} px sieht das niemand. Prozente eines entry-Bereichs ` +
          'beziehen sich auf die ELEMENTHÖHE — für ein 1 px hohes Element ergibt ' +
          'das fast keine Strecke. Das Ende gehört in cover-Prozent.',
      ).toBeGreaterThan(MINDESTSTRECKE)
    }
  })

  test('der Anschnitt ist nicht schon durchgelaufen, bevor man ihn sieht', async ({ page }, info) => {
    test.skip(info.project.name !== 'voll-1440', 'einmal in voller Breite genügt')

    await page.goto('/')

    /*
     * `scroll(root block)` misst absolute Offsets ab Seitenanfang. Solange
     * der Anschnitt im Hero saß, ging das auf. Seit er in Kapitel III liegt,
     * war die Animation 2145 px vor dem ersten Sichtkontakt vollständig
     * abgelaufen — bei jeder geprüften Fensterhöhe.
     *
     * Gemessen wird der Fortschritt in dem Moment, in dem der Rahmen zum
     * ersten Mal die Unterkante des Fensters berührt.
     */
    const fortschritt = await page.evaluate(async () => {
      const rahmen = document.querySelector('.anschnitt__rahmen')
      const ebene = document.querySelector('.anschnitt__ebene--schnitt')
      if (!rahmen || !ebene) return null

      const oben = rahmen.getBoundingClientRect().top + window.scrollY
      // Genau der Moment des Eintritts ins Sichtfeld. `instant`, weil
      // scroll-behavior: smooth den Sprung sonst über mehrere Frames streckt.
      window.scrollTo({ top: Math.max(0, oben - window.innerHeight), behavior: 'instant' })
      await new Promise((k) => requestAnimationFrame(() => requestAnimationFrame(k)))
      const anim = ebene.getAnimations()[0]
      if (!anim) return null
      return Number(anim.effect?.getComputedTiming().progress ?? 0)
    })

    expect(fortschritt, 'keine Anschnitt-Animation gefunden').not.toBeNull()
    expect(
      fortschritt ?? 1,
      `Der Anschnitt steht beim Eintritt ins Sichtfeld schon bei ` +
        `${((fortschritt ?? 1) * 100).toFixed(0)} %. Er muss eine Zeitachse ` +
        'benutzen, die an seiner eigenen Lage hängt (view()), nicht am ' +
        'Seitenfortschritt (scroll(root)) — sonst rechnet ein Umzug im ' +
        'Dokument die Bereiche still kaputt.',
    ).toBeLessThan(0.15)
  })
})

test.describe('Keine Bewegung, die sich nicht anhalten lässt (2.2.2)', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'nur einmal nötig')

  for (const route of ROUTEN) {
    test(`jede endlose Animation hört auf den Schalter: ${route}`, async ({ page }, info) => {
      test.skip(info.project.name !== 'voll-1440', 'einmal genügt')

      await page.goto(route)

      /*
       * Auf /kontakt/ lief der Glutpunkt des Öffnungsstatus endlos und ließ
       * sich durch NICHTS anhalten — dort gibt es keine Pausetaste, und die
       * Regel trug weder ein data-motion-Gate noch eine
       * prefers-reduced-motion-Ausnahme. Auf der Startseite fiel das nicht
       * auf, weil dort drei Pausetasten stehen.
       *
       * Geprüft wird der schärfste Fall: Schalter auf „Aus". Danach darf auf
       * KEINER Route noch eine endlose Animation laufen.
       */
      await page.evaluate(() => {
        document.documentElement.dataset['motion'] = 'off'
      })
      await page.waitForTimeout(150)

      const laufend = await page.evaluate(() =>
        document
          .getAnimations()
          .filter((a) => {
            const t = a.effect?.getComputedTiming()
            return a.playState === 'running' && t?.iterations === Infinity
          })
          .map((a) => {
            const ziel = (a.effect as KeyframeEffect | null)?.target
            return ziel ? `${ziel.tagName.toLowerCase()}.${ziel.className}` : 'unbekannt'
          }),
      )

      expect(
        laufend,
        `Bei data-motion="off" laufen auf ${route} noch endlose Animationen. ` +
          'Jede zeitgesteuerte Bewegung gehört hinter :root[data-motion=\'full\'] ' +
          'und braucht zusätzlich eine prefers-reduced-motion-Ausnahme.',
      ).toEqual([])
    })
  }
})

test.describe('Pausetaste steht nur, wenn es etwas anzuhalten gibt', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'nur einmal nötig')

  test('bei voller Bewegung sichtbar und mit der Maus klickbar', async ({ page }, info) => {
    test.skip(info.project.name !== 'voll-1440', 'einmal genügt')

    await page.goto('/')

    for (const wahl of ['.laufband__pause', '.glut__pause', '.anschnitt__pause']) {
      const taste = page.locator(wahl)
      await expect(taste, `${wahl} fehlt`).toBeVisible()
      // `elementFromPoint` arbeitet in Fensterkoordinaten und liefert für
      // alles außerhalb des Sichtfelds null — erst hinscrollen, dann messen.
      await taste.scrollIntoViewIfNeeded()

      /*
       * Sichtbar heißt nicht bedienbar. `.anschnitt__pause` stand am
       * 29.07.2026 auf `position: static`, saß dadurch oben links im
       * Bildrahmen und lag UNTER den Bildebenen — ein echter Klick lief in
       * den Timeout, die Taste war nur per Tastatur erreichbar.
       *
       * Ursache war die Astro-Bereichszuordnung: Die Regel stand in
       * Anschnitt.astro, der Knopf trägt aber die Kennung von
       * Pausetaste.astro. Derselbe Fehlertyp wie in Bild.astro.
       *
       * Geprüft wird deshalb, was oben liegt — nicht, ob das Element da ist.
       */
      const oben = await taste.evaluate((el) => {
        const r = el.getBoundingClientRect()
        const treffer = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
        return treffer === el || el.contains(treffer) ? 'die Taste' : (treffer?.tagName ?? 'nichts')
      })
      expect(oben, `An der Mitte von ${wahl} liegt ${oben} obenauf`).toBe('die Taste')

      // Und dann tatsächlich klicken — der Beweis, nicht die Rechnung.
      await taste.click({ timeout: 3000 })
      await expect(taste).toHaveAttribute('aria-pressed', 'true')
      await taste.click({ timeout: 3000 })
    }
  })

  test('bei reduzierter Bewegung steht keine Taste ohne Wirkung', async ({ browser }) => {
    const kontext = await browser.newContext({ reducedMotion: 'reduce' })
    const seite = await kontext.newPage()
    await seite.goto('/')
    await seite.waitForTimeout(400)

    // Erst der Nachweis, dass es wirklich nichts anzuhalten gibt.
    const laufend = await seite.evaluate(
      () => document.getAnimations().filter((a) => a.playState === 'running').length,
    )
    expect(laufend, 'bei reduzierter Bewegung läuft noch etwas').toBe(0)

    // Und erst dann darf die Taste weg sein.
    for (const wahl of ['.laufband__pause', '.glut__pause', '.anschnitt__pause']) {
      await expect(seite.locator(wahl), `${wahl} steht ohne Wirkung da`).toBeHidden()
    }

    await kontext.close()
  })
})

test.describe('Pausetaste bleibt im Tritt', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'nur einmal nötig')

  test('nach einem Moduswechsel stimmt aria-pressed weiterhin', async ({ page }, info) => {
    test.skip(info.project.name.startsWith('reduziert'), 'dort läuft nichts zu pausieren')

    await page.goto('/')
    const taste = page.locator('.laufband__pause')
    await expect(taste).toBeVisible()

    await taste.click()
    await expect(taste).toHaveAttribute('aria-pressed', 'true')

    /*
     * setzeModus('off') löschte früher nur data-motion-paused am <html> und
     * ließ aria-pressed samt Beschriftung auf „gedrückt" stehen. Der nächste
     * Klick drehte danach in die falsche Richtung — eine Taste, die
     * „Bewegung fortsetzen" anbot, hielt an.
     */
    await page.evaluate(() => {
      const aus = document.querySelector<HTMLInputElement>('input[value="off"]')
      aus?.click()
    })
    await expect(taste, 'nach dem Wechsel auf „Aus" hängt der Zustand').toHaveAttribute(
      'aria-pressed',
      'false',
    )

    const text = await taste.locator('[data-pausetaste-text]').textContent()
    expect(text?.toLowerCase()).toContain('pausieren')
  })
})
