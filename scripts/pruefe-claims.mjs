#!/usr/bin/env node
/**
 * Sperrt beanstandete Werbeaussagen und Rechtsaltlasten.
 *
 * Der entscheidende Punkt: Geprüft wird das GEBAUTE HTML in dist/, nicht die
 * Quelldateien. Damit greift die Sperre auch dann noch, wenn in drei Jahren
 * jemand den alten Philosophie-Text zurückkopiert, ihn über eine andere Datei
 * einschleust oder ihn in einer Komponente hart verdrahtet.
 *
 * Gesucht wird mit Wortgrenzen und umlautnormalisiert, damit weder
 * "Nachhaltigkeitsbericht" durchrutscht noch "unnachhaltig" fälschlich
 * anschlägt.
 *
 * Aufruf: node scripts/pruefe-claims.mjs   (nach dem Build)
 */

import { readFileSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'

import claims from '../content/claims.json' with { type: 'json' }
import { Pruefung, abbruch, grau } from './_ausgabe.mjs'

const DIST = 'dist'

/* --- HTML-Dateien einsammeln ---------------------------------------------- */

async function htmlDateien(verzeichnis) {
  let eintraege
  try {
    eintraege = await readdir(verzeichnis, { withFileTypes: true })
  } catch {
    abbruch(
      `Das Verzeichnis ${verzeichnis}/ existiert nicht.`,
      'Erst "pnpm build" ausführen — dieser Wächter prüft das gebaute HTML, nicht die Quellen.',
    )
  }

  const gefunden = []
  for (const eintrag of eintraege) {
    const pfad = join(verzeichnis, eintrag.name)
    if (eintrag.isDirectory()) gefunden.push(...(await htmlDateien(pfad)))
    else if (eintrag.name.endsWith('.html')) gefunden.push(pfad)
  }
  return gefunden
}

/* --- Text aus HTML lösen ---------------------------------------------------
 * Skripte, Stile und Attributwerte werden ausgeblendet: In einem
 * data-Attribut oder einem JSON-LD-Block steht kein Werbetext, den ein
 * Gast liest — dort würde die Suche nur Fehlalarme erzeugen.
 * Der sichtbare Text bleibt, ebenso href-Werte (wegen des ODR-Links).
 */

function sichtbarerText(html) {
  const ohneSkripte = html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
  const hrefs = [...ohneSkripte.matchAll(/href="([^"]*)"/gi)].map((treffer) => treffer[1]).join(' ')
  const ohneTags = ohneSkripte.replace(/<[^>]+>/g, ' ')
  const entschluesselt = ohneTags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
  return `${entschluesselt} ${hrefs}`.replace(/\s+/g, ' ')
}

/* --- Suche ------------------------------------------------------------------ */

function maskiere(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Wortgrenzen, die mit Umlauten UND mit deutscher Beugung funktionieren.
 *
 * Zwei Fallen, die eine naive Lösung übersieht:
 *
 *  1. \b versagt bei „Nachhaltigkeit“, weil \w keine Umlaute kennt —
 *     deshalb eigene Zeichenklasse mit Lookaround.
 *
 *  2. Deutsche Adjektive werden gebeugt. „nachhaltig“ als reines Wort zu
 *     suchen findet weder „nachhaltige Fischerei“ noch „aus nachhaltiger
 *     Weidehaltung“ — also genau die Formen, in denen der Claim real
 *     auftaucht. Deshalb ist eine Endung zugelassen.
 *     Nachgewiesen am 28.07.2026: ohne diese Regel rutschte
 *     „nachhaltiger“ durch.
 */
const BEUGUNG = '(?:e|er|es|en|em|ere|erer|eres|eren|erem|ste|ster|stes|sten|stem)?'

function musterFuer(begriff) {
  const maskiert = maskiere(begriff).replace(/\s+/g, '[\\s\\u00a0]+')
  const wortzeichen = 'A-Za-zÄÖÜäöüß0-9'
  // Endungen nur bei einzelnen Wörtern anhängen; bei Wortgruppen und URLs
  // wäre das sinnlos und würde die Fehlersuche erschweren.
  const mitBeugung = /^[A-Za-zÄÖÜäöüß]+$/.test(begriff) ? `${maskiert}${BEUGUNG}` : maskiert
  return new RegExp(`(?<![${wortzeichen}])${mitBeugung}(?![${wortzeichen}])`, 'i')
}

const muster = claims.blockliste.map((begriff) => ({ begriff, regex: musterFuer(begriff) }))

/** dist/speisekarte/index.html → /speisekarte/ */
function alsRoute(datei) {
  const relativ = relative(DIST, datei).split(sep).join('/')
  if (relativ === 'index.html') return '/'
  if (relativ.endsWith('/index.html')) return `/${relativ.slice(0, -'index.html'.length)}`
  return `/${relativ}`
}

const pruefung = new Pruefung('Gesperrte Aussagen und Rechtsaltlasten')
const dateien = await htmlDateien(DIST)

if (dateien.length === 0) {
  abbruch('In dist/ liegt keine einzige HTML-Datei.', 'Zuerst "pnpm build" ausführen.')
}

for (const datei of dateien) {
  const route = alsRoute(datei)
  if (claims.ausnahmen.includes(route)) continue

  const text = sichtbarerText(readFileSync(datei, 'utf8'))
  pruefung.zaehlt()

  for (const { begriff, regex } of muster) {
    const treffer = regex.exec(text)
    if (!treffer) continue

    const von = Math.max(0, treffer.index - 60)
    const umgebung = text.slice(von, treffer.index + begriff.length + 60).trim()

    const entscheidung = claims.entscheidungen.find((eintrag) =>
      eintrag.aussage.toLowerCase().includes(begriff.toLowerCase()),
    )

    pruefung.fehlt(
      `${route} — „${begriff}“`,
      `Gefunden im ausgelieferten Text: …${umgebung}…\n    ` +
        (entscheidung
          ? `Grundlage: ${entscheidung.grundlage}`
          : 'Der Begriff steht auf der Sperrliste in content/claims.json.'),
      entscheidung?.entscheidung === 'gesperrt_bis_beleg'
        ? 'Aussage entfernen — oder den Nachweis in content/claims.json eintragen und den Eintrag auf "belegt" setzen.'
        : 'Aussage ersatzlos entfernen. Sie ist rechtlich nicht haltbar.',
    )
  }
}

/* --- Gegenprobe: Ist die Sperrliste überhaupt scharf? ---------------------- */

if (muster.length === 0) {
  pruefung.fehlt(
    'content/claims.json → blockliste',
    'Die Sperrliste ist leer — der Wächter prüft damit nichts.',
    'Beanstandete Begriffe eintragen. Eine leere Liste ist gefährlicher als keine Prüfung.',
  )
}

const offeneBelege = claims.entscheidungen.filter(
  (eintrag) => eintrag.entscheidung === 'gesperrt_bis_beleg' && !eintrag.beleg,
)

for (const eintrag of offeneBelege) {
  pruefung.warnt(
    `Claim „${eintrag.aussage}“`,
    'Gesperrt, bis ein Nachweis vorliegt. Solange darf die Aussage nirgends stehen.',
    'Lieferanten- oder Zertifikatsnachweis beim Kunden anfordern, dann in content/claims.json eintragen.',
  )
}

if (!claims.anwaltliche_abnahme) {
  console.log(
    grau('           Hinweis: Die anwaltliche Endabnahme der Claim-Matrix steht noch aus.'),
  )
}

pruefung.abschliessen(
  `${dateien.length} Seiten gegen ${muster.length} gesperrte Begriffe geprüft`,
)
