import { describe, expect, it } from 'vitest'

import { PAARUNGEN, PALETTE } from '../../src/lib/farben.ts'
import { ausHex, bewertung, erfuellt, gerundet, kontrast, SCHWELLE } from '../../src/lib/kontrast.ts'

describe('kontrast', () => {
  it('rechnet die bekannten Extremwerte richtig', () => {
    expect(gerundet(kontrast('#000000', '#FFFFFF'))).toBe(21)
    expect(gerundet(kontrast('#FFFFFF', '#FFFFFF'))).toBe(1)
  })

  it('ist symmetrisch — die Reihenfolge der Farben ändert nichts', () => {
    expect(kontrast('#C9A24B', '#14110D')).toBeCloseTo(kontrast('#14110D', '#C9A24B'), 10)
  })

  it('versteht Kurzschreibweise und akzeptiert fehlende Raute', () => {
    expect(ausHex('#fff')).toEqual({ r: 255, g: 255, b: 255 })
    expect(ausHex('14110D')).toEqual({ r: 20, g: 17, b: 13 })
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
    expect(gerundet(kontrast(PALETTE.creme, PALETTE.grund))).toBe(14.43)
    expect(gerundet(kontrast(PALETTE.gold, PALETTE.grund))).toBe(7.85)
    expect(gerundet(kontrast(PALETTE['creme-leise'], PALETTE.grund))).toBe(6.59)
    expect(gerundet(kontrast(PALETTE.elfenbein, PALETTE.bordeaux))).toBe(9.2)
    expect(gerundet(kontrast(PALETTE.gold, PALETTE.bordeaux))).toBe(4.13)
    expect(gerundet(kontrast(PALETTE.glut, PALETTE.grund))).toBe(3.68)
  })

  it('lässt den Fokusring auf hellem UND dunklem Grund tragen', () => {
    // Der Doppelring funktioniert nur, wenn beide Ringfarben zueinander
    // und jeweils zur Fläche genug Abstand haben.
    const innen = PALETTE.elfenbein
    const aussen = PALETTE.grund
    expect(kontrast(innen, aussen)).toBeGreaterThanOrEqual(3)
    // Auf der dunklen Grundfläche trägt der innere Ring …
    expect(kontrast(innen, PALETTE.grund)).toBeGreaterThanOrEqual(3)
    // … auf Bordeaux ebenfalls, und der äußere gegen helle Bildstellen.
    expect(kontrast(innen, PALETTE.bordeaux)).toBeGreaterThanOrEqual(3)
  })
})
