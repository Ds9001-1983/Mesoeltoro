#!/usr/bin/env node
/**
 * Prüft, dass in dist/ kein Bild liegt, für das die Rechte nicht geklärt sind.
 *
 * Zwei Richtungen, beide nötig:
 *   1. Jede ausgelieferte Bilddatei muss einem freigegebenen Registereintrag
 *      entsprechen. Eine Datei, die niemand einträgt, darf nicht mitfahren.
 *   2. Jedes <img> im HTML muss auf eine solche Datei zeigen.
 *
 * Zusätzlich greift die Sperrliste für Dateien aus fremden Projekten, die im
 * Medienverzeichnis der alten WordPress-Installation liegen.
 *
 * Aufruf: node scripts/pruefe-bildrechte.mjs   (nach dem Build)
 */

import { readFileSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { basename, extname, join, relative, sep } from 'node:path'

import { Pruefung, abbruch, lade } from './_ausgabe.mjs'

const { REGISTER, SPERRLISTE, FREIGEGEBEN, OFFEN, istGesperrt } = await lade(
  '../src/lib/bilder.ts',
  'Bildregister',
)

const DIST = 'dist'
const BILDENDUNGEN = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif']

async function dateien(verzeichnis) {
  let eintraege
  try {
    eintraege = await readdir(verzeichnis, { withFileTypes: true })
  } catch {
    abbruch(`${verzeichnis}/ existiert nicht.`, 'Zuerst "pnpm build" ausführen.')
  }
  const gefunden = []
  for (const eintrag of eintraege) {
    const pfad = join(verzeichnis, eintrag.name)
    if (eintrag.isDirectory()) gefunden.push(...(await dateien(pfad)))
    else gefunden.push(pfad)
  }
  return gefunden
}

const pruefung = new Pruefung('Bildrechte')
const alle = await dateien(DIST)

/* --- 1. Ausgelieferte Bilddateien ----------------------------------------- */

// Freigegebene Dateien in allen erzeugten Ableitungen: name-800.avif usw.
const erlaubteStaemme = new Set(
  FREIGEGEBEN.map(([, eintrag]) => eintrag.datei.replace(/\.[a-z0-9]+$/i, '')),
)

// Eigene Grafiken, die nicht aus dem Fotobestand stammen und deshalb keinen
// Registereintrag brauchen. Bewusst kurz gehalten.
//
// `signet.png` ist die Bildmarke des Hauses — kein Foto, sondern das eigene
// Zeichen des Auftraggebers, das er selbst führt. Die Rechtefrage ist damit
// eine andere als bei den Aufnahmen (dort: Nutzungsrecht am fremden Werk),
// und sie gehört nicht in ein Register, das Fotografennachweise führt.
// Vermerk dazu in docs/BILDRECHTE.md.
const EIGENE_GRAFIKEN = [
  'favicon.svg',
  'apple-touch-icon.png',
  'karte-anfahrt.svg',
  'korn.png',
  'glut-standbild.webp',
  'signet.png',
]

for (const datei of alle) {
  const endung = extname(datei).toLowerCase()
  if (!BILDENDUNGEN.includes(endung)) continue

  const name = basename(datei)
  if (EIGENE_GRAFIKEN.includes(name)) continue

  pruefung.zaehlt()

  const gesperrt = istGesperrt(name)
  if (gesperrt) {
    pruefung.fehlt(
      relative(DIST, datei),
      `Die Datei trägt das gesperrte Präfix "${gesperrt}" und stammt aus einem fremden Projekt.`,
      'Aus public/bilder/ entfernen. Diese Bilder gehören nicht zum Mesón el Toro.',
    )
    continue
  }

  // name-1200.avif → name
  const stamm = name.replace(/-(\d{2,4})\.(avif|webp|jpe?g|png)$/i, '').replace(/\.[a-z0-9]+$/i, '')

  if (!erlaubteStaemme.has(stamm)) {
    pruefung.fehlt(
      relative(DIST, datei),
      'Die Bilddatei wird ausgeliefert, hat aber keinen freigegebenen Eintrag im Register.',
      'In content/bildnachweise.json eintragen und freigeben — oder die Datei entfernen.',
    )
  }
}

/* --- 2. Bildverweise im HTML ----------------------------------------------- */

for (const datei of alle.filter((pfad) => pfad.endsWith('.html'))) {
  const html = readFileSync(datei, 'utf8')
  const route = relative(DIST, datei).split(sep).join('/')

  for (const treffer of html.matchAll(/<img\b[^>]*\ssrc="([^"]+)"[^>]*>/gi)) {
    const [tag, quelle] = treffer
    const name = basename(quelle.split('?')[0])

    if (EIGENE_GRAFIKEN.includes(name)) continue

    const stamm = name.replace(/-(\d{2,4})\.(avif|webp|jpe?g|png)$/i, '').replace(/\.[a-z0-9]+$/i, '')

    if (!erlaubteStaemme.has(stamm)) {
      pruefung.fehlt(
        `${route} → <img src="${quelle}">`,
        'Verweist auf eine Datei ohne freigegebenen Registereintrag.',
        'Bild über die Komponente Bild.astro einbinden — sie nimmt nur Registerschlüssel entgegen.',
      )
    }

    // Ein leeres alt ist bei dekorativen Bildern zulässig, muss aber
    // ausdrücklich dastehen. Ein fehlendes alt-Attribut ist immer ein Fehler.
    if (!/\salt=/i.test(tag)) {
      pruefung.fehlt(
        `${route} → <img src="${quelle}">`,
        'Dem Bild fehlt das alt-Attribut vollständig (WCAG 1.1.1).',
        'Alternativtext im Register hinterlegen. Bei reiner Dekoration alt="" setzen.',
      )
    }
  }
}

/* --- 3. Offene Rechtefälle melden ------------------------------------------ */

if (OFFEN.length > 0) {
  pruefung.warnt(
    'content/bildnachweise.json',
    `${OFFEN.length} von ${Object.keys(REGISTER).length} Bildern sind nicht freigegeben: ` +
      OFFEN.map(([schluessel]) => schluessel).join(', '),
    'Sie werden als Platzhalter ausgeliefert. Nachweis anfordern — siehe docs/BILDRECHTE.md.',
  )
}

pruefung.abschliessen(
  `${pruefung.geprueft} Bilddateien, ${FREIGEGEBEN.length} freigegeben, ` +
    `${SPERRLISTE.length} Sperrpräfixe aktiv`,
)
