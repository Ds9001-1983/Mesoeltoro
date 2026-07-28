#!/usr/bin/env node
/**
 * Erzeugt die Papierfaser-Kachel für Signature Move 6 („Das Papier“).
 *
 * Warum gerechnet statt gemalt oder generiert:
 *
 *  · Ein KI-Bild wäre ein weiteres Asset ohne nachweisbare Herkunft. Für eine
 *    abstrakte Textur bestünde zwar keine Kennzeichnungspflicht nach Art. 50
 *    AI Act — aber auch kein Gewinn.
 *  · Ein SVG-feTurbulence-Filter würde bei jedem Bildaufbau neu gerastert.
 *    Auf ganzflächigem Einsatz kostet das messbar Leistung.
 *  · Eine gerechnete Kachel ist reproduzierbar. Wer die Textur ändern will,
 *    ändert hier eine Zahl und sieht sofort, was passiert.
 *
 * Der PNG-Schreiber ist von Hand gebaut, weil das Ergebnis eine
 * 8-Bit-Graustufendatei ohne Farbprofil sein soll — sharp legt sonst
 * Metadaten an, die bei 6 KB Nutzlast ins Gewicht fallen.
 *
 * Aufruf: node scripts/korn-erzeugen.mjs
 */

import { writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'

import { Pruefung } from './_ausgabe.mjs'

const ZIEL = 'public/marke/korn.png'

/* --- Stellschrauben --------------------------------------------------------
 * KANTE     Kachelgröße in Pixeln. Wird per background-size auf 96px gelegt.
 * GROB/FEIN Rasterweiten der beiden Oktaven. Höher = feinere Struktur.
 *           Die erste Fassung lief mit GROB = 16 und las sich bei 4 %
 *           Deckkraft als Fleckenmuster statt als Faser.
 * KONTRAST  Spreizung um die Mitte. Über 1,2 wird aus Papier eine Wolke.
 * SAAT      Festgelegt, damit dieselbe Datei wieder herauskommt.
 */
const KANTE = 128
const GROB = 32
const FEIN = 64
const KONTRAST = 0.9
const SAAT = 1975

/* --- Reproduzierbarer Zufall ----------------------------------------------
 * Math.random() wäre hier falsch: Die Datei liegt im Git, und ein Lauf, der
 * jedes Mal ein anderes Ergebnis erzeugt, produziert bei jedem Aufruf einen
 * Diff über 6 KB Binärdaten. Deshalb ein kleiner LCG mit fester Saat.
 */
function zufallsfolge(saat) {
  let zustand = saat >>> 0
  return () => {
    zustand = (Math.imul(zustand, 1664525) + 1013904223) >>> 0
    return zustand / 4294967296
  }
}

const naechste = zufallsfolge(SAAT)

/** Zufallsgitter, das sich am Rand wiederholt — damit die Kachel nahtlos ist. */
function gitter(weite) {
  return Array.from({ length: weite }, () =>
    Array.from({ length: weite }, () => naechste()),
  )
}

const felder = { [GROB]: gitter(GROB), [FEIN]: gitter(FEIN) }

const glaetten = (t) => t * t * (3 - 2 * t)

/** Bilinear interpoliertes Wertrauschen auf dem Torus. */
function rauschen(x, y, weite) {
  const feld = felder[weite]
  const gx = (x * weite) / KANTE
  const gy = (y * weite) / KANTE
  const x0 = Math.floor(gx) % weite
  const y0 = Math.floor(gy) % weite
  const x1 = (x0 + 1) % weite
  const y1 = (y0 + 1) % weite
  const tx = glaetten(gx - Math.floor(gx))
  const ty = glaetten(gy - Math.floor(gy))
  const oben = feld[y0][x0] * (1 - tx) + feld[y0][x1] * tx
  const unten = feld[y1][x0] * (1 - tx) + feld[y1][x1] * tx
  return oben * (1 - ty) + unten * ty
}

/* --- Bilddaten -------------------------------------------------------------
 * Je Zeile ein Filterbyte (0 = kein Filter), dann ein Byte pro Pixel.
 * Die Werte werden auf 16 Stufen gequantelt: Bei 3,5 % Deckkraft ist der
 * Unterschied unsichtbar, die Datei schrumpft aber um rund ein Drittel.
 */
const zeilen = Buffer.alloc(KANTE * (KANTE + 1))
let zeiger = 0

for (let y = 0; y < KANTE; y += 1) {
  zeilen[zeiger] = 0
  zeiger += 1
  for (let x = 0; x < KANTE; x += 1) {
    const wert = 0.45 * rauschen(x, y, GROB) + 0.55 * rauschen(x, y, FEIN)
    const hell = Math.min(1, Math.max(0, 0.5 + (wert - 0.5) * KONTRAST))
    zeilen[zeiger] = Math.round(hell * 15) * 17
    zeiger += 1
  }
}

/* --- PNG schreiben --------------------------------------------------------- */

function block(typ, daten) {
  const laenge = Buffer.alloc(4)
  laenge.writeUInt32BE(daten.length)
  const koerper = Buffer.concat([Buffer.from(typ, 'ascii'), daten])
  const pruefsumme = Buffer.alloc(4)
  pruefsumme.writeUInt32BE(crc32(koerper) >>> 0)
  return Buffer.concat([laenge, koerper, pruefsumme])
}

const CRC_TABELLE = Array.from({ length: 256 }, (_, index) => {
  let wert = index
  for (let bit = 0; bit < 8; bit += 1) {
    wert = wert & 1 ? 0xedb88320 ^ (wert >>> 1) : wert >>> 1
  }
  return wert >>> 0
})

function crc32(puffer) {
  let wert = 0xffffffff
  for (const byte of puffer) wert = CRC_TABELLE[(wert ^ byte) & 0xff] ^ (wert >>> 8)
  return (wert ^ 0xffffffff) >>> 0
}

const kopf = Buffer.alloc(13)
kopf.writeUInt32BE(KANTE, 0)
kopf.writeUInt32BE(KANTE, 4)
kopf[8] = 8 // Bittiefe
kopf[9] = 0 // Farbtyp 0 = Graustufe
kopf[10] = 0 // Kompression
kopf[11] = 0 // Filter
kopf[12] = 0 // kein Interlacing

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  block('IHDR', kopf),
  block('IDAT', deflateSync(zeilen, { level: 9 })),
  block('IEND', Buffer.alloc(0)),
])

writeFileSync(ZIEL, png)

const pruefung = new Pruefung('Papierkorn')
pruefung.zaehlt()
pruefung.abschliessen(`${ZIEL} — ${KANTE}×${KANTE}, ${(png.length / 1024).toFixed(1)} KB`)
