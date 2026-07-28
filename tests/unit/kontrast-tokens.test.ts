import { describe, expect, it } from 'vitest'

import { PAARUNGEN, PALETTE } from '../../src/lib/farben.ts'
import { ausHex, bewertung, erfuellt, gerundet, kontrast, SCHWELLE } from '../../src/lib/kontrast.ts'

describe('kontrast', () => {
  it('rechnet die bekannten Extremwerte richtig', () => {
    expect(gerundet(kontrast('#000000', '#FFFFFF'))).toBe(21)
    expect(gerundet(kontrast('#FFFFFF', '#FFFFFF'))).toBe(1)
  })

  it('ist symmetrisch — die Reihenfolge der Farben ändert nichts', () => {
    expect(kontrast('#B3372B', '#F4EFE6')).toBeCloseTo(kontrast('#F4EFE6', '#B3372B'), 10)
  })

  it('versteht Kurzschreibweise und akzeptiert fehlende Raute', () => {
    expect(ausHex('#fff')).toEqual({ r: 255, g: 255, b: 255 })
    expect(ausHex('2B2521')).toEqual({ r: 43, g: 37, b: 33 })
  })

  it('weist ungültige Werte zurück, statt still 0 zu liefern', () => {
    expect(() => ausHex('#GGGGGG')).toThrow(/Kein gültiger Hex-Farbwert/)
    expect(() => ausHex('#12345')).toThrow()
  })

  it('bewertet die Stufen an den richtigen Schwellen', () => {
    expect(bewertung(7)).toBe('AAA')
    expect(bewertung(4.5)).toBe('AA')
    expect(bewertung(3)).toBe('nur Großschrift und UI')
    expect(bewertung(2.99)).toBe('unzureichend')
  })
})

describe('Palette', () => {
  it('enthält ausschließlich gültige Hex-Werte', () => {
    for (const [name, wert] of Object.entries(PALETTE)) {
      expect(() => ausHex(wert), `${name} = ${wert}`).not.toThrow()
      expect(wert, `${name} soll in Großbuchstaben notiert sein`).toBe(wert.toUpperCase())
    }
  })
})

describe('Farbpaarungen', () => {
  const erlaubte = PAARUNGEN.filter((paarung) => !paarung.verboten)
  const verbotene = PAARUNGEN.filter((paarung) => paarung.verboten)

  it.each(erlaubte)(
    '$vordergrund auf $hintergrund erfüllt $verwendung — $einsatz',
    ({ vordergrund, hintergrund, verwendung }) => {
      const verhaeltnis = kontrast(PALETTE[vordergrund], PALETTE[hintergrund])
      expect(
        erfuellt(verhaeltnis, verwendung),
        `${vordergrund} auf ${hintergrund} liegt bei ${gerundet(verhaeltnis)}:1, ` +
          `gefordert sind ${SCHWELLE[verwendung]}:1 für ${verwendung}`,
      ).toBe(true)
    },
  )

  // Ein Verbot, das rechnerisch gar nicht nötig wäre, ist Aberglaube und
  // fliegt beim nächsten Aufräumen raus. Also wird es hier bewiesen.
  it.each(verbotene)(
    '$vordergrund auf $hintergrund ist zu Recht verboten — $einsatz',
    ({ vordergrund, hintergrund, verwendung }) => {
      const verhaeltnis = kontrast(PALETTE[vordergrund], PALETTE[hintergrund])
      expect(
        erfuellt(verhaeltnis, verwendung),
        `${vordergrund} auf ${hintergrund} liegt bei ${gerundet(verhaeltnis)}:1 und ` +
          `würde ${SCHWELLE[verwendung]}:1 erfüllen — das Verbot ist dann unbegründet`,
      ).toBe(false)
    },
  )

  it('hält die dokumentierten Kernwerte ein', () => {
    // Diese vier Zahlen stehen so in tokens.css, im Plan und in der
    // Kundendokumentation. Wenn sich hier etwas ändert, muss es dort auch.
    expect(gerundet(kontrast(PALETTE.espresso, PALETTE.kalk))).toBe(13.2)
    expect(gerundet(kontrast(PALETTE.ochsenblut, PALETTE.kalk))).toBe(5.24)
    expect(gerundet(kontrast(PALETTE.messing, PALETTE.kalk))).toBe(3.93)
    expect(gerundet(kontrast(PALETTE.ochsenblut, PALETTE.espresso))).toBe(2.52)
  })

  it('lässt den Fokusring auf hellem UND dunklem Grund tragen', () => {
    // Der Doppelring funktioniert nur, wenn beide Ringfarben zueinander
    // und jeweils zur Fläche genug Abstand haben.
    const innen = PALETTE.kalk
    const aussen = PALETTE.espresso
    expect(kontrast(innen, aussen)).toBeGreaterThanOrEqual(3)
    expect(kontrast(aussen, PALETTE.kalk)).toBeGreaterThanOrEqual(3)
    expect(kontrast(innen, PALETTE.espresso)).toBeGreaterThanOrEqual(3)
  })
})
