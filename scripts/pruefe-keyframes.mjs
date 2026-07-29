#!/usr/bin/env node
/**
 * Sucht doppelt vergebene @keyframes-Namen im gebauten CSS.
 *
 * Anlass: Am 29.07.2026 hieß der Keyframe der Rubrik-Haarlinie
 * `linie-zeichnen` — genauso wie der der Gerichtszeile. Beide stehen in
 * `is:global`-Blöcken und gelten damit dokumentweit. Bei Namensgleichheit
 * gewinnt die zuletzt geparste Definition.
 *
 * Die Fassung der Gerichtszeile hat keinen `from`-Schritt, weil sie ihren
 * Startwert als Basisdeklaration setzt. Die Haarlinie hatte keine solche
 * Basis — ihr Startwert wurde damit der berechnete Wert, also das Ziel
 * selbst. Anfang gleich Ende: Die Animation lief einwandfrei und bewegte
 * nichts.
 *
 * Der Fehler ist am Ergebnis nicht zu erkennen — eine Linie, die sich nicht
 * zeichnet, sieht aus wie eine Linie. Er ist nur zu finden, indem man die
 * berechneten Keyframes im Browser ausliest oder eben hier nachzählt.
 *
 * Astro scoped Klassennamen, aber NICHT @keyframes in `is:global`-Blöcken.
 * Solange das so ist, ist jeder globale Keyframe-Name ein projektweiter
 * Bezeichner und braucht ein Komponentenpräfix.
 *
 * Aufruf: node scripts/pruefe-keyframes.mjs
 */

import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { abbruch, Pruefung } from './_ausgabe.mjs'

const ORDNER = 'dist/_astro'

let dateien
try {
  dateien = readdirSync(ORDNER).filter((name) => name.endsWith('.css'))
} catch {
  abbruch(`${ORDNER} nicht gefunden.`, 'Erst "pnpm build" ausführen.')
}

const pruefung = new Pruefung('Eindeutige Keyframe-Namen')

/** name -> Menge der Dateien, in denen er definiert ist */
const fundorte = new Map()

for (const datei of dateien) {
  const css = readFileSync(join(ORDNER, datei), 'utf8')
  for (const treffer of css.matchAll(/@keyframes\s+([A-Za-z_][\w-]*)/g)) {
    const name = treffer[1]
    if (!fundorte.has(name)) fundorte.set(name, new Set())
    fundorte.get(name).add(datei)
  }
}

for (const [name, dateienMitNamen] of fundorte) {
  pruefung.zaehlt()
  if (dateienMitNamen.size > 1) {
    pruefung.fehlt(
      `@keyframes ${name}`,
      `Der Name ist in ${dateienMitNamen.size} Bündeln definiert: ` +
        `${[...dateienMitNamen].join(', ')}. Global gültige Keyframes ` +
        'überschreiben einander dokumentweit — die zuletzt geparste Fassung ' +
        'gewinnt für ALLE Elemente, die den Namen benutzen.',
      `Einen der beiden umbenennen, etwa auf "<komponente>-${name}".`,
    )
  }
}

pruefung.abschliessen(`${fundorte.size} Keyframe-Namen aus ${dateien.length} Bündeln geprüft`)
