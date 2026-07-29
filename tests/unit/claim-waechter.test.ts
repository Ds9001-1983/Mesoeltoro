import { describe, expect, it } from 'vitest'

import claims from '../../content/claims.json'

/**
 * Die Sperrliste ist seit dem 29.07.2026 auf Entscheidung des Auftraggebers
 * LEER. Nichts wird gesperrt.
 *
 * Diese Datei prüft deshalb nicht mehr, WAS gesperrt ist — sondern dass der
 * Mechanismus intakt bleibt. Der Unterschied ist wichtig: Eine leere Liste,
 * die jemand versehentlich geleert hat, sieht genauso aus wie eine, die
 * jemand absichtlich geleert hat. Nur die zweite darf durchgehen, und nur
 * solange die Prüfung selbst noch funktionsfähig ist.
 */

interface Entscheidung {
  readonly aussage: string
  readonly grundlage: string
  readonly entscheidung: string
  readonly entschieden_am: string
}

const akte = claims as unknown as {
  blockliste: string[]
  blockliste_bewusst_leer?: boolean
  blockliste_begruendung?: string
  entscheidungen: Entscheidung[]
  geprueft_am: string
}

describe('Sperrliste', () => {
  it('ist entweder gefüllt oder ausdrücklich als leer erklärt', () => {
    // Genau diese Bedingung setzt scripts/pruefe-claims.mjs im Build durch.
    // Ein stiller Ausfall der Prüfung ist damit ausgeschlossen.
    const inOrdnung = akte.blockliste.length > 0 || akte.blockliste_bewusst_leer === true
    expect(inOrdnung, 'leere Sperrliste ohne ausdrückliche Erklärung').toBe(true)
  })

  it('nennt eine Begründung, wenn sie bewusst leer ist', () => {
    if (akte.blockliste_bewusst_leer !== true) return
    expect(akte.blockliste_begruendung ?? '').not.toHaveLength(0)
    // Wer und wann — sonst ist es keine Entscheidung, sondern ein Zustand.
    expect(akte.blockliste_begruendung).toMatch(/\d{2}\.\d{2}\.\d{4}/)
  })

  it('führt jeden Begriff ohne führende oder folgende Leerzeichen', () => {
    for (const begriff of akte.blockliste) {
      expect(begriff).toBe(begriff.trim())
      expect(begriff.length).toBeGreaterThan(1)
    }
  })
})

describe('Claim-Akte', () => {
  it('hält für jede geprüfte Aussage die Rechtsgrundlage fest', () => {
    expect(akte.entscheidungen.length).toBeGreaterThan(0)
    for (const eintrag of akte.entscheidungen) {
      expect(eintrag.aussage, 'Eintrag ohne Aussage').toBeTruthy()
      expect(
        eintrag.grundlage,
        `„${eintrag.aussage}“ ohne Rechtsgrundlage — dann ist es keine Prüfung, sondern eine Meinung`,
      ).toBeTruthy()
      expect(eintrag.entschieden_am).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('kennt nur die vorgesehenen Entscheidungsarten', () => {
    const erlaubt = new Set(['freigegeben', 'gestrichen', 'gesperrt_bis_beleg'])
    for (const eintrag of akte.entscheidungen) {
      expect(
        erlaubt.has(eintrag.entscheidung),
        `unbekannte Entscheidung „${eintrag.entscheidung}“ bei „${eintrag.aussage}“`,
      ).toBe(true)
    }
  })
})
