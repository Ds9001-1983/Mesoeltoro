#!/usr/bin/env node
/**
 * Holt die Schriftdateien einmalig und legt sie in public/fonts/ ab.
 *
 * Warum ein Skript und kein „hab ich mal runtergeladen“:
 * Die Herkunft jeder Schriftdatei muss nachvollziehbar sein. Wer in zwei
 * Jahren fragt, woher public/fonts/meson-text-400.woff2 stammt und unter
 * welcher Lizenz, liest diese Datei.
 *
 * WICHTIG: Dieses Skript läuft NICHT im Build. Es wird von Hand aufgerufen,
 * die Ergebnisse werden eingecheckt. Im Betrieb darf die Seite niemals eine
 * Verbindung zu Google aufbauen (§ 25 TDDDG) — deshalb liegen die Dateien
 * lokal und werden von schriften.css lokal eingebunden.
 *
 * Aufruf:  node scripts/schriften-holen.mjs
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const ZIEL = 'public/fonts'

/**
 * Alle drei Familien stehen unter der SIL Open Font License 1.1, die das
 * Selbst-Hosting ausdrücklich erlaubt. Die Lizenztexte liegen daneben.
 */
/*
 * Bewusst STATISCHE Schnitte statt variabler Schriften.
 *
 * Gemessen am 28.07.2026 (nur Teilmenge latin):
 *   Newsreader variabel opsz+wght .... 128,8 KB
 *   Newsreader variabel nur wght .....  56,8 KB
 *   Newsreader statisch 400 ..........  22,0 KB
 *   Newsreader statisch 600 ..........  23,3 KB
 *
 * Die Seite braucht zwei Gewichte, keine stufenlose Achse. Variabel wäre
 * hier fast das Dreifache an Bytes für einen Freiheitsgrad, den niemand nutzt.
 *
 * Kursiv entfällt ganz (weitere ~144 KB): Zitate werden über Einzug und die
 * Display-Schrift ausgezeichnet, nicht über einen eigenen Schnitt.
 */
const SCHRIFTEN = [
  {
    datei: 'meson-display-400',
    rolle: 'Display (Überschriften)',
    familie: 'Instrument Serif',
    lizenz: 'SIL Open Font License 1.1',
    anfrage: 'family=Instrument+Serif:ital@0&display=swap',
  },
  {
    datei: 'meson-text-400',
    rolle: 'Fließtext regulär',
    familie: 'Newsreader',
    lizenz: 'SIL Open Font License 1.1',
    anfrage: 'family=Newsreader:wght@400&display=swap',
  },
  {
    datei: 'meson-text-600',
    rolle: 'Fließtext hervorgehoben',
    familie: 'Newsreader',
    lizenz: 'SIL Open Font License 1.1',
    anfrage: 'family=Newsreader:wght@600&display=swap',
  },
  {
    datei: 'meson-mikro-400',
    rolle: 'Mikrotypografie (Allergencodes, Labels)',
    familie: 'Instrument Sans',
    lizenz: 'SIL Open Font License 1.1',
    anfrage: 'family=Instrument+Sans:wght@400&display=swap',
  },
]

/** Ein moderner Browser-User-Agent, sonst liefert die API veraltete Formate. */
const BROWSER =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

/**
 * Aus dem CSS die Blöcke der gewünschten Zeichensatz-Teilmengen ziehen.
 * Wir brauchen nur latin und latin-ext — Vietnamesisch, Griechisch und
 * Kyrillisch kosten Bytes, die auf dieser Seite niemand liest.
 */
function subsetsAuslesen(css) {
  const treffer = []
  const muster = /\/\*\s*([a-z-]+)\s*\*\/\s*@font-face\s*\{([^}]+)\}/g
  let block
  while ((block = muster.exec(css)) !== null) {
    const [, name, inhalt] = block
    if (name !== 'latin' && name !== 'latin-ext') continue
    const url = /src:\s*url\(([^)]+)\)/.exec(inhalt)?.[1]
    const bereich = /unicode-range:\s*([^;]+);/.exec(inhalt)?.[1]?.trim()
    if (url) treffer.push({ name, url, bereich })
  }
  return treffer
}

async function main() {
  await mkdir(ZIEL, { recursive: true })

  const notizen = []
  let gesamt = 0

  for (const schrift of SCHRIFTEN) {
    const cssAntwort = await fetch(`https://fonts.googleapis.com/css2?${schrift.anfrage}`, {
      headers: { 'User-Agent': BROWSER },
    })
    if (!cssAntwort.ok) {
      throw new Error(`CSS für ${schrift.familie} nicht erreichbar: HTTP ${cssAntwort.status}`)
    }
    const css = await cssAntwort.text()
    const subsets = subsetsAuslesen(css)

    if (subsets.length === 0) {
      throw new Error(`Für ${schrift.familie} wurden keine latin-Teilmengen gefunden.`)
    }

    for (const subset of subsets) {
      const antwort = await fetch(subset.url, { headers: { 'User-Agent': BROWSER } })
      if (!antwort.ok) {
        throw new Error(`${subset.url} nicht erreichbar: HTTP ${antwort.status}`)
      }
      const daten = Buffer.from(await antwort.arrayBuffer())
      const dateiname = `${schrift.datei}${subset.name === 'latin-ext' ? '-ext' : ''}.woff2`
      await writeFile(join(ZIEL, dateiname), daten)
      gesamt += daten.byteLength
      notizen.push({
        datei: dateiname,
        familie: schrift.familie,
        rolle: schrift.rolle,
        lizenz: schrift.lizenz,
        teilmenge: subset.name,
        bereich: subset.bereich,
        groesse: daten.byteLength,
        quelle: subset.url,
      })
      console.log(`  ✓ ${dateiname.padEnd(32)} ${(daten.byteLength / 1024).toFixed(1)} KB`)
    }
  }

  await writeFile(
    join(ZIEL, 'HERKUNFT.json'),
    `${JSON.stringify(
      {
        hinweis:
          'Erzeugt von scripts/schriften-holen.mjs. Alle Dateien stehen unter der SIL Open Font License 1.1, die das Selbst-Hosting ausdrücklich erlaubt. Im Betrieb wird niemals eine Verbindung zu fonts.googleapis.com oder fonts.gstatic.com aufgebaut.',
        abgerufen_am: new Date().toISOString().slice(0, 10),
        dateien: notizen,
      },
      null,
      2,
    )}\n`,
  )

  console.log(`\n  ${notizen.length} Dateien, ${(gesamt / 1024).toFixed(1)} KB gesamt.`)
  console.log('  Herkunft dokumentiert in public/fonts/HERKUNFT.json')
}

main().catch((fehler) => {
  console.error(`\nFEHLER: ${fehler.message}\n`)
  process.exit(1)
})
