import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

import { ROUTEN } from '../routen.ts'

/**
 * Automatisierte Barrierefreiheitsprüfung je Route.
 *
 * Wichtige Einschränkung, die in der Abnahmedokumentation stehen muss:
 * axe prüft eine Momentaufnahme des DOM. Scroll-Zustände, laufende
 * Animationen, Fokusverläufe und Video-Einzelbilder sieht es nicht.
 * Zusammen finden automatische Werkzeuge erfahrungsgemäß nur 30 bis 40
 * Prozent der tatsächlichen Verstöße.
 *
 * Deshalb ergänzen die Tests in tests/verhalten/ das Verhalten, und die
 * manuellen Prüfungen in docs/A11Y-KONFORMITAET.md den Rest.
 */

const REGELSATZ = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']

for (const route of ROUTEN) {
  test(`axe-core ohne Verstöße: ${route}`, async ({ page }) => {
    await page.goto(route)

    // Der Shader baut sich per requestIdleCallback auf — erst danach messen,
    // sonst prüft axe einen Zustand, den kein Nutzer je sieht.
    await page.waitForLoadState('networkidle')

    const ergebnis = await new AxeBuilder({ page }).withTags(REGELSATZ).analyze()

    const schwerwiegend = ergebnis.violations.filter((verstoss) =>
      ['serious', 'critical'].includes(verstoss.impact ?? ''),
    )

    // Aussagekräftige Fehlermeldung statt „expected 3 to be 0“.
    const bericht = ergebnis.violations
      .map(
        (verstoss) =>
          `\n  [${verstoss.impact}] ${verstoss.id}: ${verstoss.help}\n` +
          `    ${verstoss.helpUrl}\n` +
          verstoss.nodes
            .slice(0, 3)
            .map((knoten) => `    → ${knoten.target.join(' ')}`)
            .join('\n'),
      )
      .join('\n')

    expect(schwerwiegend, `Schwerwiegende Verstöße auf ${route}:${bericht}`).toHaveLength(0)
    expect(ergebnis.violations, `Verstöße auf ${route}:${bericht}`).toHaveLength(0)
  })
}
