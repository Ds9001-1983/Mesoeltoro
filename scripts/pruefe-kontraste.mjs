#!/usr/bin/env node
/**
 * Prüft die Farbpalette gegen tokens.css.
 *
 * Zwei Dinge werden sichergestellt:
 *
 *  1. Jeder Hex-Wert in tokens.css stimmt mit src/lib/farben.ts überein.
 *     Sonst könnte jemand eine Farbe im CSS aufhellen, während Test und
 *     Dokumentation weiter den alten Wert für konform erklären.
 *
 *  2. Jedes Kontrastverhältnis, das als Kommentar in tokens.css steht
 *     ("→ 13,20:1"), wird nachgerechnet. Damit ist der Kommentar keine
 *     Behauptung mehr, sondern eine geprüfte Zusage.
 *
 * Aufruf: node scripts/pruefe-kontraste.mjs
 */

import { readFileSync } from 'node:fs'

import { PAARUNGEN, PALETTE } from '../src/lib/farben.ts'
import { erfuellt, gerundet, kontrast, SCHWELLE } from '../src/lib/kontrast.ts'
import { abbruch, Pruefung } from './_ausgabe.mjs'

const TOKENS = 'src/styles/tokens.css'

let css
try {
  css = readFileSync(TOKENS, 'utf8')
} catch {
  abbruch(`${TOKENS} nicht gefunden.`, 'Wurde die Datei verschoben oder umbenannt?')
}

const pruefung = new Pruefung('Farbpalette und Kontraste')

/* --- 1. Hex-Werte abgleichen ---------------------------------------------- */

for (const [name, erwartet] of Object.entries(PALETTE)) {
  const treffer = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,8})\\s*;`).exec(css)

  if (!treffer) {
    pruefung.fehlt(
      `${TOKENS} → --${name}`,
      `Die Farbe --${name} ist in src/lib/farben.ts definiert, fehlt aber in tokens.css.`,
      `Ergänze "--${name}: ${erwartet};" in tokens.css oder entferne sie aus farben.ts.`,
    )
    continue
  }

  const imCss = treffer[1].toUpperCase()
  if (imCss !== erwartet.toUpperCase()) {
    pruefung.fehlt(
      `${TOKENS} → --${name}`,
      `tokens.css sagt ${imCss}, src/lib/farben.ts sagt ${erwartet}.`,
      'Beide Stellen auf denselben Wert bringen. farben.ts ist die Quelle, an der die Tests hängen.',
    )
  }
  pruefung.zaehlt()
}

/* --- 2. Dokumentierte Verhältnisse nachrechnen ----------------------------
 * Erfasst Kommentare der Form "→ 13,20:1" bzw. "→ 13,2:1" in derselben
 * Zeile wie eine Farbdefinition oder direkt darunter.
 */

const zeilen = css.split('\n')
let letzteFarbe = null

for (const [nummer, zeile] of zeilen.entries()) {
  const farbdefinition = /--([a-z0-9-]+):\s*#[0-9a-fA-F]{3,8}\s*;/.exec(zeile)
  if (farbdefinition) letzteFarbe = farbdefinition[1]

  const behauptung = /→\s*(\d+),(\d+):1/.exec(zeile)
  if (!behauptung || !letzteFarbe) continue

  const behauptet = Number(`${behauptung[1]}.${behauptung[2]}`)

  // Auf welchem Grund? "auf Kalk", "auf Espresso" — sonst überspringen.
  const grund = /auf\s+(Kalk|Espresso|Ochsenblut|Leinen)/i.exec(zeile)
  if (!grund) continue

  const grundname = grund[1].toLowerCase()
  const hintergrund =
    grundname === 'espresso' && letzteFarbe !== 'espresso' ? PALETTE.espresso : PALETTE[grundname]

  const vordergrund = PALETTE[letzteFarbe]
  if (!vordergrund || !hintergrund) continue

  const tatsaechlich = gerundet(kontrast(vordergrund, hintergrund))

  // Toleranz 0,05 — die Kommentare sind auf zwei Stellen gerundet notiert.
  if (Math.abs(tatsaechlich - behauptet) > 0.05) {
    pruefung.fehlt(
      `${TOKENS}:${nummer + 1} → --${letzteFarbe}`,
      `Der Kommentar behauptet ${behauptet.toFixed(2)}:1 auf ${grund[1]}, ` +
        `tatsächlich sind es ${tatsaechlich.toFixed(2)}:1.`,
      'Kommentar auf den tatsächlichen Wert korrigieren — oder die Farbe anpassen.',
    )
  }
  pruefung.zaehlt()
}

/* --- 3. Alle Paarungen aus farben.ts nachrechnen -------------------------- */

for (const paarung of PAARUNGEN) {
  const verhaeltnis = kontrast(PALETTE[paarung.vordergrund], PALETTE[paarung.hintergrund])
  const bestanden = erfuellt(verhaeltnis, paarung.verwendung)

  if (!paarung.verboten && !bestanden) {
    pruefung.fehlt(
      `${paarung.vordergrund} auf ${paarung.hintergrund}`,
      `${gerundet(verhaeltnis).toFixed(2)}:1 — gefordert sind ${SCHWELLE[paarung.verwendung]}:1 ` +
        `für ${paarung.verwendung}. Einsatz: ${paarung.einsatz}`,
      'Farbe abdunkeln bzw. aufhellen oder die Verwendung ändern.',
    )
  }

  if (paarung.verboten && bestanden) {
    pruefung.fehlt(
      `${paarung.vordergrund} auf ${paarung.hintergrund}`,
      `Die Kombination ist als verboten geführt, erfüllt aber mit ` +
        `${gerundet(verhaeltnis).toFixed(2)}:1 die Anforderung.`,
      'Verbot aus src/lib/farben.ts streichen — ein unbegründetes Verbot wird ohnehin ignoriert.',
    )
  }
  pruefung.zaehlt()
}

/* --- 4. Messing darf nie als Fließtextfarbe gesetzt werden ---------------- */

const messingImFliesstext =
  /--text:\s*var\(--messing\)/.test(css) || /--text-leise:\s*var\(--messing\)/.test(css)

if (messingImFliesstext) {
  pruefung.fehlt(
    `${TOKENS} → --text`,
    'Messing (3,93:1 auf Kalk) ist als Textfarbe eingesetzt und verfehlt damit 1.4.3.',
    `Messing nur für Schrift ab ${24}px, Linien und Ränder verwenden.`,
  )
}

pruefung.abschliessen(
  `${Object.keys(PALETTE).length} Farben, ${PAARUNGEN.length} Paarungen nachgerechnet`,
)
