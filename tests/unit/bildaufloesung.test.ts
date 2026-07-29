import { existsSync } from 'node:fs'
import { basename, extname, join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { FREIGEGEBEN, REGISTER } from '../../src/lib/bilder.ts'

/**
 * Am 29.07.2026 war das Hero-Bild sichtbar unscharf, und die Ursache war
 * banal: Es lief vollflächig, die größte Ableitung war 1600 px, und ein
 * Retina-Bildschirm fordert bei 1440 CSS-Pixeln 2880 an. Ausgeliefert wurden
 * damit 55 % der nötigen Auflösung.
 *
 * Der Fehler war nicht zu sehen, weil ihn nichts geprüft hat. Diese Datei
 * prüft ihn — damit er beim nächsten großen Bild nicht wiederkommt.
 *
 * Sie prüft NICHT, ob ein Bild scharf ist. Das kann kein Test. Sie prüft, ob
 * für die vorgesehene Anzeigegröße überhaupt genug Pixel bereitstehen.
 */

const ZIEL = 'public/bilder'

/** Breiten, die scripts/bilder-aufbereiten.mjs erzeugt. */
const NORMAL = [400, 800, 1200, 1600]
const GROSS = [...NORMAL, 2000, 2400]

function ableitung(datei: string, breite: number, endung = 'avif'): string {
  const stamm = basename(datei, extname(datei))
  return join(ZIEL, `${stamm}-${breite}.${endung}`)
}

/** Die größte tatsächlich vorhandene Ableitung. */
function groessteBreite(datei: string): number {
  const vorhanden = GROSS.filter((breite) => existsSync(ableitung(datei, breite)))
  return vorhanden.length > 0 ? Math.max(...vorhanden) : 0
}

describe('Bildableitungen', () => {
  /*
   * Nicht geprüft wird, ob ALLE Breiten vorliegen: Vier Vorlagen sind nur
   * 1500 px breit, für sie darf es gar keine 1600er-Fassung geben — das
   * Skript überspringt sie zu Recht, statt hochzuskalieren.
   *
   * Geprüft wird die Eigenschaft, auf die es ankommt: Reicht die größte
   * vorhandene Fassung für die vorgesehene Anzeigegröße?
   */
  it.each(FREIGEGEBEN)('%s hat eine ausreichend große Fassung', (schluessel, eintrag) => {
    const gefordert = eintrag.grossformat === true ? 2400 : 1200
    const vorhanden = groessteBreite(eintrag.datei)

    expect(
      vorhanden,
      `${schluessel}: größte Ableitung ${vorhanden} px, gefordert sind ${gefordert} px. ` +
        'Entweder "pnpm bilder" ausführen oder das Bild aus dem Großformat nehmen.',
    ).toBeGreaterThanOrEqual(gefordert)
  })

  it('liefert die kleinen Breiten für schmale Schirme immer mit', () => {
    // 400 und 800 kosten fast nichts und sparen auf dem Handy ein Vielfaches.
    for (const [schluessel, eintrag] of FREIGEGEBEN) {
      for (const breite of [400, 800]) {
        expect(
          existsSync(ableitung(eintrag.datei, breite)),
          `${schluessel}: die ${breite}er-Fassung fehlt`,
        ).toBe(true)
      }
    }
  })
})

describe('Register', () => {
  it('führt grossformat nur als echten Wahrheitswert', () => {
    for (const [schluessel, eintrag] of Object.entries(REGISTER)) {
      if (eintrag.grossformat === undefined) continue
      expect(typeof eintrag.grossformat, `${schluessel}`).toBe('boolean')
    }
  })
})
