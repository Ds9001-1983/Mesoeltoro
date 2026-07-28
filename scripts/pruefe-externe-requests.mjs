#!/usr/bin/env node
/**
 * Stellt sicher, dass die ausgelieferte Seite KEINE Ressource von einem
 * fremden Server nachlädt.
 *
 * Das ist die tragende Architekturentscheidung des ganzen Projekts:
 * Ohne Drittanfragen gibt es keinen Endgerätezugriff im Sinne des
 * § 25 Abs. 1 TDDDG, also keine Einwilligungspflicht, also kein
 * Cookie-Banner — und damit auch nicht den häufigsten Barrierefreiheits-
 * Fehlerherd überhaupt (Fokusfalle im Einwilligungsdialog).
 *
 * Geprüft wird das gebaute HTML und CSS auf Subresourcen. Laufzeitanfragen,
 * die ein Skript erst im Browser auslöst, findet dieser Wächter nicht —
 * dafür gibt es tests/inhalt/keine-externen-requests.spec.ts, das jede
 * Anfrage im echten Browser abfängt. Beide zusammen decken den Fall ab.
 *
 * Aufruf: node scripts/pruefe-externe-requests.mjs   (nach dem Build)
 */

import { readFileSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { extname, join, relative, sep } from 'node:path'

import { Pruefung, abbruch } from './_ausgabe.mjs'

const DIST = 'dist'

/**
 * Attribute, die den Browser zum Laden zwingen — im Gegensatz zu href an
 * einem <a>, das erst ein Klick auslöst. Nur diese sind kritisch.
 */
const LADE_ATTRIBUTE = ['src', 'srcset', 'data-src', 'poster', 'action', 'formaction']

/** Auch <link> lädt — aber nur bei bestimmten rel-Werten. */
const LADENDE_REL = ['stylesheet', 'preload', 'prefetch', 'preconnect', 'dns-prefetch', 'modulepreload', 'icon', 'apple-touch-icon', 'manifest']

async function dateien(verzeichnis, endungen) {
  let eintraege
  try {
    eintraege = await readdir(verzeichnis, { withFileTypes: true })
  } catch {
    abbruch(`${verzeichnis}/ existiert nicht.`, 'Zuerst "pnpm build" ausführen.')
  }
  const gefunden = []
  for (const eintrag of eintraege) {
    const pfad = join(verzeichnis, eintrag.name)
    if (eintrag.isDirectory()) gefunden.push(...(await dateien(pfad, endungen)))
    else if (endungen.includes(extname(eintrag.name))) gefunden.push(pfad)
  }
  return gefunden
}

const istExtern = (wert) => /^(https?:)?\/\//i.test(wert.trim())

const pruefung = new Pruefung('Keine Anfragen an fremde Server')
const gefundene = await dateien(DIST, ['.html', '.css', '.js'])

if (gefundene.length === 0) {
  abbruch('In dist/ liegt nichts Prüfbares.', 'Zuerst "pnpm build" ausführen.')
}

function alsRoute(datei) {
  const relativ = relative(DIST, datei).split(sep).join('/')
  return relativ === 'index.html' ? '/' : `/${relativ}`
}

for (const datei of gefundene) {
  const inhalt = readFileSync(datei, 'utf8')
  const ort = alsRoute(datei)
  pruefung.zaehlt()

  /* --- HTML: ladende Attribute ------------------------------------------ */
  if (datei.endsWith('.html')) {
    for (const attribut of LADE_ATTRIBUTE) {
      const muster = new RegExp(`\\s${attribut}\\s*=\\s*"([^"]*)"`, 'gi')
      for (const treffer of inhalt.matchAll(muster)) {
        // srcset enthält mehrere, kommagetrennte Kandidaten.
        const werte = treffer[1].split(',').map((teil) => teil.trim().split(/\s+/)[0])
        for (const wert of werte) {
          if (wert && istExtern(wert)) {
            pruefung.fehlt(
              `${ort} → ${attribut}`,
              `Lädt von einem fremden Server: ${wert}`,
              'Ressource lokal ablegen und aus /public ausliefern. Ohne Ausnahme — § 25 Abs. 1 TDDDG.',
            )
          }
        }
      }
    }

    /* --- HTML: <link rel="…"> ------------------------------------------- */
    for (const treffer of inhalt.matchAll(/<link\b([^>]*)>/gi)) {
      const attribute = treffer[1]
      const rel = /\brel\s*=\s*"([^"]*)"/i.exec(attribute)?.[1]?.toLowerCase() ?? ''
      const href = /\bhref\s*=\s*"([^"]*)"/i.exec(attribute)?.[1] ?? ''
      const laedt = rel.split(/\s+/).some((wert) => LADENDE_REL.includes(wert))
      if (laedt && istExtern(href)) {
        pruefung.fehlt(
          `${ort} → <link rel="${rel}">`,
          `Verweist auf einen fremden Server: ${href}`,
          'Datei lokal ablegen. Auch preconnect und dns-prefetch bauen eine Verbindung auf.',
        )
      }
    }
  }

  /* --- CSS: url() und @import ------------------------------------------- */
  if (datei.endsWith('.css')) {
    for (const treffer of inhalt.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/gi)) {
      const wert = treffer[1]
      if (istExtern(wert)) {
        pruefung.fehlt(
          `${ort} → url()`,
          `CSS lädt von einem fremden Server: ${wert}`,
          'Schriften und Bilder gehören nach /public. Siehe scripts/schriften-holen.mjs.',
        )
      }
    }
    for (const treffer of inhalt.matchAll(/@import\s+(?:url\()?['"]?([^'")\s;]+)/gi)) {
      if (istExtern(treffer[1])) {
        pruefung.fehlt(
          `${ort} → @import`,
          `CSS importiert von einem fremden Server: ${treffer[1]}`,
          'Import auflösen und die Datei lokal ablegen.',
        )
      }
    }
  }

  /* --- JS: offensichtliche Netzaufrufe ----------------------------------- */
  if (datei.endsWith('.js')) {
    for (const treffer of inhalt.matchAll(
      /(?:fetch|importScripts|XMLHttpRequest[^)]*open)\s*\(\s*["'`](https?:\/\/[^"'`]+)/gi,
    )) {
      pruefung.fehlt(
        `${ort} → Netzaufruf`,
        `Skript ruft einen fremden Server auf: ${treffer[1]}`,
        'Entfernen. Diese Seite braucht keinen einzigen Netzaufruf zur Laufzeit.',
      )
    }
  }
}

/* --- Gegenprobe: Sind die Schriften wirklich lokal? ----------------------- */

const verboteneHosts = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'use.typekit.net',
  'cdn.jsdelivr.net',
  'unpkg.com',
  'cdnjs.cloudflare.com',
  'www.google.com/recaptcha',
  'maps.googleapis.com',
  'www.googletagmanager.com',
  'connect.facebook.net',
  'i0.wp.com',
  'stats.wp.com',
]

for (const datei of gefundene) {
  const inhalt = readFileSync(datei, 'utf8')
  for (const host of verboteneHosts) {
    if (inhalt.includes(host)) {
      pruefung.fehlt(
        `${alsRoute(datei)} → ${host}`,
        `Der Host taucht in der ausgelieferten Datei auf.`,
        'Ersatzlos entfernen. Genau diese Einbindung war der Hauptmangel der alten Seite.',
      )
    }
  }
}

pruefung.abschliessen(`${gefundene.length} Dateien, 0 Anfragen an fremde Server`)
