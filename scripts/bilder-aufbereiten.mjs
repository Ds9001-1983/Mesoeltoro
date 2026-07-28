#!/usr/bin/env node
/**
 * Erzeugt aus den Originalen in media-src/ die ausgelieferten Ableitungen
 * in public/bilder/.
 *
 * Läuft NICHT im Build, sondern von Hand nach einer Bildänderung. Die
 * Ergebnisse werden eingecheckt. Grund: Bildverarbeitung im Build macht
 * jede Veröffentlichung um Minuten langsamer, für Dateien, die sich
 * praktisch nie ändern.
 *
 * Verarbeitet werden ausschließlich Bilder, die in content/bildnachweise.json
 * als freigegeben eingetragen sind. Ein Foto ohne dokumentierte Rechtekette
 * kommt hier gar nicht erst durch.
 *
 * Aufruf: node scripts/bilder-aufbereiten.mjs
 */

import { existsSync } from 'node:fs'
import { mkdir, readdir, unlink } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'

import sharp from 'sharp'

import { Pruefung, abbruch, grau, lade } from './_ausgabe.mjs'

const { FREIGEGEBEN, OFFEN, istGesperrt } = await lade('../src/lib/bilder.ts', 'Bildregister')

const QUELLE = 'media-src'
const ZIEL = 'public/bilder'

/**
 * Vier Breiten. Mehr bringt nichts: Zwischen 800 und 1200 liegt bei diesen
 * Motiven kein wahrnehmbarer Unterschied, aber ein weiterer Satz Dateien.
 */
const BREITEN = [400, 800, 1200, 1600]

if (!existsSync(QUELLE)) {
  abbruch(
    `Das Verzeichnis ${QUELLE}/ fehlt.`,
    'Dort liegen die Originalfotos in voller Auflösung. Sie sind bewusst nicht im Git — ' +
      'siehe docs/BILDRECHTE.md.',
  )
}

const pruefung = new Pruefung('Bildaufbereitung')

await mkdir(ZIEL, { recursive: true })

/* --- Alte Ableitungen entfernen, deren Original nicht mehr freigegeben ist */

const freigegebeneStaemme = new Set(
  FREIGEGEBEN.map(([, eintrag]) => eintrag.datei.replace(/\.[a-z0-9]+$/i, '')),
)

for (const name of await readdir(ZIEL).catch(() => [])) {
  const stamm = name.replace(/-(\d{2,4})\.(avif|webp|jpe?g)$/i, '')
  if (!freigegebeneStaemme.has(stamm)) {
    await unlink(join(ZIEL, name))
    console.log(grau(`  entfernt: ${name} (nicht mehr freigegeben)`))
  }
}

/* --- Ableitungen erzeugen -------------------------------------------------- */

let erzeugt = 0
let bytes = 0

for (const [schluessel, eintrag] of FREIGEGEBEN) {
  const gesperrt = istGesperrt(eintrag.datei)
  if (gesperrt) {
    pruefung.fehlt(
      eintrag.datei,
      `Die Datei trägt das gesperrte Präfix "${gesperrt}" und stammt aus einem fremden Projekt.`,
      'Aus dem Register entfernen. Diese Bilder gehören nicht zum Mesón el Toro.',
    )
    continue
  }

  const quelle = join(QUELLE, eintrag.datei)
  if (!existsSync(quelle)) {
    pruefung.fehlt(
      `${schluessel} → ${eintrag.datei}`,
      `Die Datei ist als freigegeben eingetragen, liegt aber nicht in ${QUELLE}/.`,
      'Original dorthin legen oder den Registereintrag korrigieren.',
    )
    continue
  }

  const stamm = basename(eintrag.datei, extname(eintrag.datei))
  const bild = sharp(quelle, { failOn: 'error' })
  const daten = await bild.metadata()

  if ((daten.width ?? 0) < 1600) {
    pruefung.warnt(
      eintrag.datei,
      `Das Original ist nur ${daten.width} px breit — für die 1600er-Ableitung zu klein.`,
      'Höher aufgelöste Fassung beim Fotografen anfordern.',
    )
  }

  for (const breite of BREITEN) {
    if ((daten.width ?? 0) < breite) continue

    const basisBild = sharp(quelle).rotate().resize({ width: breite, withoutEnlargement: true })

    // AVIF zuerst — deutlich kleiner, wird von allen aktuellen Browsern gelesen.
    const avif = await basisBild
      .clone()
      .avif({ quality: 58, effort: 6 })
      .toFile(join(ZIEL, `${stamm}-${breite}.avif`))

    const webp = await basisBild
      .clone()
      .webp({ quality: 76 })
      .toFile(join(ZIEL, `${stamm}-${breite}.webp`))

    // JPEG als letzter Rückfall, nur in der mittleren Breite.
    let jpeg = { size: 0 }
    if (breite === 1200) {
      jpeg = await basisBild
        .clone()
        .jpeg({ quality: 82, progressive: true, mozjpeg: true })
        .toFile(join(ZIEL, `${stamm}-${breite}.jpg`))
    }

    erzeugt += jpeg.size > 0 ? 3 : 2
    bytes += avif.size + webp.size + jpeg.size
  }

  console.log(`  ✓ ${eintrag.datei.padEnd(44)} ${daten.width}×${daten.height}`)
  pruefung.zaehlt()
}

if (FREIGEGEBEN.length === 0) {
  console.log(
    grau(
      `\n  Kein Bild ist freigegeben — ${OFFEN.length} warten auf den Rechtenachweis.\n` +
        '  Solange liefert die Seite gestaltete Platzhalter aus. Siehe docs/BILDRECHTE.md.',
    ),
  )
}

pruefung.abschliessen(
  `${FREIGEGEBEN.length} Motive, ${erzeugt} Dateien, ${(bytes / 1024 / 1024).toFixed(1)} MB`,
)
