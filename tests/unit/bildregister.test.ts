import { describe, expect, it } from 'vitest'

import { FREIGEGEBEN, REGISTER, SPERRLISTE, hole, istGesperrt } from '../../src/lib/bilder.ts'

/**
 * Das Bildregister ist das teuerste Gate des Projekts: Hier entscheidet sich,
 * ob ein Foto ohne geklärte Rechte live geht.
 *
 * Am 28.07.2026 hatte die Sperrliste eine Lücke. Die alte WordPress-
 * Installation enthält das komplette Demo-Material des gekauften Themes
 * `latulipe` — `food-menu-1…17`, `top-img-1…10`, `team-1…8`, `blog-1…9` und
 * weitere. Das sind fremde Stockfotos, die aussehen, als gehörten sie zum
 * Haus. Die Liste kannte sie nicht.
 *
 * Diese Datei hält das Loch geschlossen.
 */

describe('Sperrliste', () => {
  const FREMDE_DATEIEN = [
    // Fotos aus anderen Kundenprojekten desselben Fotografen
    'JSchumacher_Theos_004.jpg',
    'Claudios_Pizza_01.jpg',
    'Simerilab_Header.jpg',
    'pexels-photo-1234.jpeg',
    '220519_JS_Aussen.jpg',
    // Demo-Material des Themes `latulipe`
    'food-menu-3.jpg',
    'food-menu-17.jpg',
    'menu-img2.jpg',
    'top-img-8.jpg',
    'team-4.jpg',
    'portfolio-2.jpg',
    'blog-9.jpg',
    'page-p5.jpg',
    'pricing-p1.jpg',
    'video-prev2.jpg',
    'latulipe-logo1.png',
  ]

  it.each(FREMDE_DATEIEN)('sperrt %s', (datei) => {
    expect(istGesperrt(datei)).not.toBeNull()
  })

  it('lässt die echten Aufnahmen des Hauses durch', () => {
    for (const [, eintrag] of Object.entries(REGISTER)) {
      expect(
        istGesperrt(eintrag.datei),
        `${eintrag.datei} steht im Register, wird aber von der Sperrliste gefangen`,
      ).toBeNull()
    }
  })

  it('führt jedes Präfix ohne Leerzeichen und ohne Pfad', () => {
    for (const praefix of SPERRLISTE) {
      expect(praefix).not.toMatch(/[\s/]/)
    }
  })
})

describe('Rechtekette', () => {
  it('gibt kein Bild ohne Urhebernachweis frei', () => {
    for (const [schluessel, eintrag] of FREIGEGEBEN) {
      expect(eintrag.urheber_nachweis, `${schluessel} ist frei ohne Nachweis`).toBe(true)
      expect(eintrag.nachweis_fundstelle, `${schluessel} nennt keine Fundstelle`).toBeTruthy()
      expect(eintrag.freigabe_datum, `${schluessel} ist frei ohne Datum`).toBeTruthy()
    }
  })

  it('gibt kein Bild mit erkennbaren Personen ohne Einwilligung frei', () => {
    for (const [schluessel, eintrag] of FREIGEGEBEN) {
      if (!eintrag.personen_abgebildet) continue
      expect(
        eintrag.personen_einwilligung,
        `${schluessel} zeigt Personen, aber ohne dokumentierte Einwilligung (§ 22 KunstUrhG)`,
      ).toBe(true)
    }
  })

  it('bricht bei einem unbekannten Schlüssel mit einer erklärenden Meldung ab', () => {
    // Der Abbruch ist gewollt: Ein fehlender Registereintrag ist kein
    // Darstellungsproblem, sondern ein ungeklärtes Recht.
    expect(() => hole('gibt-es-nicht')).toThrow(/Kein Bild mit dem Schlüssel/)
  })
})

describe('Alternativtexte', () => {
  it('beschreiben das Motiv, statt es zu benennen', () => {
    for (const [schluessel, eintrag] of Object.entries(REGISTER)) {
      // „Bild von…“ sagt der Screenreader ohnehin selbst.
      expect(eintrag.alt, `${schluessel}`).not.toMatch(/^(bild|foto|grafik|image)\b/i)
      // Ein Alternativtext, der genauso lang ist wie das Motivfeld, ist mit
      // hoher Wahrscheinlichkeit aus dem Dateinamen geraten statt am Bild
      // geschrieben. Genau so ist am 28.07.2026 der Eintrag „gastraum“
      // entstanden — er beschrieb einen Gastraum und zeigte ein Steak.
      expect(eintrag.alt.length, `${schluessel} hat einen zu knappen Alt-Text`).toBeGreaterThan(
        eintrag.motiv.length + 20,
      )
    }
  })
})
