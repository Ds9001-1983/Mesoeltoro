import { describe, expect, it } from 'vitest'

import konfigurationRoh from '../../content/restaurant.json' with { type: 'json' }
import {
  alsMinuten,
  alsTabelle,
  ermittleStatus,
  kalendertag,
  naechsterKalendertag,
  schliessungAn,
  type ZeitenKonfiguration,
} from '../../src/lib/zeiten.ts'

const konfiguration = konfigurationRoh as unknown as ZeitenKonfiguration

/**
 * Berlin-Wanduhrzeit → UTC-Instant.
 *
 * Bewusst mit festen Offsets statt einer Bibliothek: Die Tests sollen die
 * Zeitzonenlogik der Implementierung prüfen, nicht dieselbe Logik noch
 * einmal aufrufen. MESZ = UTC+2 (Ende März bis Ende Oktober), MEZ = UTC+1.
 */
function berlin(datum: string, uhrzeit: string, sommerzeit: boolean): Date {
  const offset = sommerzeit ? '+02:00' : '+01:00'
  return new Date(`${datum}T${uhrzeit}${offset}`)
}

describe('kalendertag', () => {
  it('rechnet unabhängig von der Zeitzone des Rechners nach Berlin um', () => {
    // Die Suite läuft in America/Los_Angeles. Ohne korrekte Zeitzonenbehandlung
    // läge dieser Zeitpunkt neun Stunden daneben und im Vortag.
    const teile = kalendertag(berlin('2026-07-29', '13:00', true), 'Europe/Berlin')
    expect(teile).toMatchObject({ jahr: 2026, monat: 7, tag: 29, stunde: 13, minute: 0 })
    expect(teile.wochentag).toBe('mittwoch')
  })

  it('behandelt den Sommerzeitbeginn korrekt', () => {
    // 29.03.2026, 02:00 MEZ → Uhren springen auf 03:00 MESZ.
    // 01:30 UTC ist damit bereits 03:30 Berliner Zeit.
    const teile = kalendertag(new Date('2026-03-29T01:30:00Z'), 'Europe/Berlin')
    expect(teile.stunde).toBe(3)
    expect(teile.tag).toBe(29)
  })

  it('behandelt das Sommerzeitende korrekt', () => {
    // 25.10.2026: 03:00 MESZ → 02:00 MEZ. 00:30 UTC ist 02:30 MESZ.
    const teile = kalendertag(new Date('2026-10-25T00:30:00Z'), 'Europe/Berlin')
    expect(teile.stunde).toBe(2)
    expect(teile.tag).toBe(25)
  })

  it('ordnet einen Zeitpunkt kurz vor Mitternacht noch dem richtigen Tag zu', () => {
    const teile = kalendertag(berlin('2026-07-29', '23:59', true), 'Europe/Berlin')
    expect(teile.tag).toBe(29)
    expect(teile.wochentag).toBe('mittwoch')
  })
})

describe('naechsterKalendertag', () => {
  it('springt über Monatsgrenzen', () => {
    const tag = { jahr: 2026, monat: 7, tag: 31, stunde: 0, minute: 0, wochentag: 'freitag' as const }
    expect(naechsterKalendertag(tag)).toMatchObject({ jahr: 2026, monat: 8, tag: 1 })
  })

  it('springt über die Jahresgrenze', () => {
    const tag = { jahr: 2026, monat: 12, tag: 31, stunde: 0, minute: 0, wochentag: 'donnerstag' as const }
    expect(naechsterKalendertag(tag)).toMatchObject({ jahr: 2027, monat: 1, tag: 1 })
  })

  it('kennt Schaltjahre', () => {
    const tag = { jahr: 2028, monat: 2, tag: 28, stunde: 0, minute: 0, wochentag: 'montag' as const }
    expect(naechsterKalendertag(tag)).toMatchObject({ monat: 2, tag: 29 })
  })
})

describe('alsMinuten', () => {
  it('rechnet Uhrzeiten in Minuten seit Mitternacht', () => {
    expect(alsMinuten('00:00')).toBe(0)
    expect(alsMinuten('12:30')).toBe(750)
    expect(alsMinuten('22:00')).toBe(1320)
  })
})

describe('schliessungAn', () => {
  const tagAm = (monat: number, tag: number, jahr = 2027) => ({
    jahr,
    monat,
    tag,
    stunde: 12,
    minute: 0,
    wochentag: 'mittwoch' as const,
  })

  it('erkennt den 24. Dezember', () => {
    expect(schliessungAn(tagAm(12, 24), konfiguration)?.grund).toBe('Geschlossen')
  })

  it('erkennt die Betriebsruhe im Januar', () => {
    expect(schliessungAn(tagAm(1, 5), konfiguration)?.grund).toBe('Betriebsruhe')
    expect(schliessungAn(tagAm(1, 13), konfiguration)?.grund).toBe('Betriebsruhe')
  })

  it('lässt den 14. Januar wieder frei', () => {
    expect(schliessungAn(tagAm(1, 14), konfiguration)).toBeNull()
  })

  it('lässt den 25. und 26. Dezember frei — nur 24., 27. und 28. sind geschlossen', () => {
    expect(schliessungAn(tagAm(12, 25), konfiguration)).toBeNull()
    expect(schliessungAn(tagAm(12, 26), konfiguration)).toBeNull()
    expect(schliessungAn(tagAm(12, 27), konfiguration)?.grund).toBe('Geschlossen')
    expect(schliessungAn(tagAm(12, 28), konfiguration)?.grund).toBe('Geschlossen')
  })

  it('behandelt einen Zeitraum über den Jahreswechsel', () => {
    const ueberJahreswechsel = {
      schliessungen_wiederkehrend: [{ von: '12-27', bis: '01-06', grund: 'Winterpause' }],
      schliessungen_einmalig: [],
    }
    expect(schliessungAn(tagAm(12, 30), ueberJahreswechsel)?.grund).toBe('Winterpause')
    expect(schliessungAn(tagAm(1, 3), ueberJahreswechsel)?.grund).toBe('Winterpause')
    expect(schliessungAn(tagAm(7, 1), ueberJahreswechsel)).toBeNull()
  })
})

describe('ermittleStatus', () => {
  it('meldet die Mittagsöffnung', () => {
    // Mittwoch, 13:00 — mitten im Mittagsdienst.
    const status = ermittleStatus(berlin('2026-07-29', '13:00', true), konfiguration)
    expect(status.art).toBe('geoeffnet')
    expect(status.bis).toBe('14:00')
    expect(status.text).toBe('Jetzt geöffnet — Küche bis 14:00 Uhr.')
  })

  it('meldet die Nachmittagslücke als „heute später“', () => {
    // Mittwoch, 15:30 — zwischen Mittag- und Abenddienst.
    const status = ermittleStatus(berlin('2026-07-29', '15:30', true), konfiguration)
    expect(status.art).toBe('spaeter')
    expect(status.ab).toBe('18:00')
  })

  it('meldet vor der ersten Öffnung „heute ab“', () => {
    const status = ermittleStatus(berlin('2026-07-29', '09:00', true), konfiguration)
    expect(status.art).toBe('spaeter')
    expect(status.ab).toBe('12:00')
  })

  it('behandelt die Schließzeit als geschlossen, nicht als offen', () => {
    // Punkt 22:00 ist Feierabend — nicht „noch offen“.
    const status = ermittleStatus(berlin('2026-07-29', '22:00', true), konfiguration)
    expect(status.art).toBe('geschlossen')
  })

  it('verweist nach dem Abenddienst auf den nächsten Tag', () => {
    const status = ermittleStatus(berlin('2026-07-29', '23:00', true), konfiguration)
    expect(status.art).toBe('geschlossen')
    expect(status.text).toContain('morgen ab 12:00 Uhr')
  })

  it('meldet am Montag den Ruhetag und verweist auf Mittwoch', () => {
    // 27.07.2026 ist ein Montag. Dienstag ist ebenfalls Ruhetag,
    // also muss der Verweis den Mittwoch nennen — nicht „morgen“.
    const status = ermittleStatus(berlin('2026-07-27', '19:00', true), konfiguration)
    expect(status.art).toBe('geschlossen')
    expect(status.text).toContain('Ruhetag')
    expect(status.text).toContain('am Mittwoch ab 12:00 Uhr')
  })

  it('sagt am Dienstag „morgen“ statt den Wochentag', () => {
    const status = ermittleStatus(berlin('2026-07-28', '19:00', true), konfiguration)
    expect(status.text).toContain('morgen ab 12:00 Uhr')
  })

  it('meldet an Heiligabend die Schließung', () => {
    const status = ermittleStatus(berlin('2026-12-24', '13:00', false), konfiguration)
    expect(status.art).toBe('schliessung')
    expect(status.grund).toBe('Geschlossen')
  })

  it('meldet in der Betriebsruhe den Wiederbeginn am 14. Januar', () => {
    // 05.01.2027 liegt in der Betriebsruhe; der 14.01.2027 ist ein Donnerstag.
    const status = ermittleStatus(berlin('2027-01-05', '13:00', false), konfiguration)
    expect(status.art).toBe('schliessung')
    expect(status.grund).toBe('Betriebsruhe')
    expect(status.text).toContain('am Donnerstag ab 12:00 Uhr')
  })

  it('ist am 25. Dezember regulär geöffnet', () => {
    // 25.12.2026 ist ein Freitag und ausdrücklich kein Schließtag.
    const status = ermittleStatus(berlin('2026-12-25', '13:00', false), konfiguration)
    expect(status.art).toBe('geoeffnet')
  })

  it('liefert am Sommerzeitwechsel keinen Unsinn', () => {
    // 29.03.2026 ist ein Sonntag; 01:30 UTC = 03:30 MESZ, also vor der Öffnung.
    const status = ermittleStatus(new Date('2026-03-29T01:30:00Z'), konfiguration)
    expect(status.art).toBe('spaeter')
    expect(status.ab).toBe('12:00')
  })
})

describe('alsTabelle', () => {
  const tabelle = alsTabelle(konfiguration.regulaer)

  it('beginnt bei Montag, nicht bei Sonntag', () => {
    expect(tabelle[0]?.wochentag).toBe('montag')
    expect(tabelle[6]?.wochentag).toBe('sonntag')
  })

  it('weist Montag und Dienstag als Ruhetag aus', () => {
    expect(tabelle[0]?.ruhetag).toBe(true)
    expect(tabelle[1]?.ruhetag).toBe(true)
    expect(tabelle[0]?.zeiten).toBe('Ruhetag')
  })

  it('setzt beide Zeiträume mit Halbgeviertstrich', () => {
    expect(tabelle[2]?.zeiten).toBe('12:00–14:00 Uhr und 18:00–22:00 Uhr')
  })
})
