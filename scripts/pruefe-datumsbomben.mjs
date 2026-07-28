#!/usr/bin/env node
/**
 * Sucht nach Angaben, die von selbst veralten.
 *
 * Eine Website, die fünf Jahre laufen soll, hat ein Grundproblem: Sie enthält
 * Aussagen mit Verfallsdatum — Preisstand, geprüfte Öffnungszeiten, das
 * Jahr im Fußzeilen-Copyright, abgelaufene Schließzeiträume. Niemand merkt
 * es, weil die Seite ja weiterhin lädt.
 *
 * Dieser Wächter läuft deshalb nicht nur im Build, sondern zusätzlich als
 * Monatslauf in .github/workflows/wartung.yml und öffnet dort ein Issue.
 *
 * Aufruf: node scripts/pruefe-datumsbomben.mjs
 */

import { Pruefung, lade } from './_ausgabe.mjs'

const { restaurant } = await lade('../src/lib/daten.ts', 'Stammdaten')
const { KARTE_META } = await lade('../src/lib/karte.ts', 'Speisekarte')

const pruefung = new Pruefung('Angaben mit Verfallsdatum')

const heute = new Date()
const alsTage = (datum) => Math.floor((heute.getTime() - datum.getTime()) / 86_400_000)

/* --- 1. Geprüft-bis-Datum der Öffnungszeiten ------------------------------- */

const geprueftBis = new Date(`${restaurant.geprueft_bis}T23:59:59Z`)
const restTage = -alsTage(geprueftBis)

if (restTage < 0) {
  pruefung.fehlt(
    'content/restaurant.json → geprueft_bis',
    `Die Öffnungszeiten sind seit ${Math.abs(restTage)} Tagen nicht mehr als geprüft ausgewiesen.`,
    'Zeiten und Schließtage mit dem Restaurant durchgehen, dann "geprueft_bis" ein Jahr weiterstellen.',
  )
} else if (restTage < 60) {
  pruefung.warnt(
    'content/restaurant.json → geprueft_bis',
    `Die Öffnungszeiten gelten noch ${restTage} Tage als geprüft.`,
    'Demnächst mit dem Restaurant gegenprüfen.',
  )
}
pruefung.zaehlt()

/* --- 2. Preisstand ---------------------------------------------------------- */

const preisAlter = alsTage(new Date(`${KARTE_META.stand}T00:00:00Z`))
if (preisAlter > 365) {
  pruefung.fehlt(
    'content/speisekarte/_meta.json → stand',
    `Der ausgewiesene Preisstand ist ${preisAlter} Tage alt.`,
    'Preise gegenprüfen und den Stand aktualisieren — er steht sichtbar auf der Karte.',
  )
}
pruefung.zaehlt()

/* --- 3. Abgelaufene einmalige Schließzeiträume ------------------------------ */

for (const zeitraum of restaurant.schliessungen_einmalig) {
  // Einmalige Zeiträume tragen ein volles Datum; wiederkehrende nicht.
  if (!/^\d{4}-/.test(zeitraum.bis)) continue

  const ende = new Date(`${zeitraum.bis}T23:59:59Z`)
  const vorbei = alsTage(ende)
  if (vorbei > 30) {
    pruefung.warnt(
      `content/restaurant.json → schliessungen_einmalig "${zeitraum.grund}"`,
      `Der Zeitraum endete vor ${vorbei} Tagen.`,
      'Eintrag entfernen. Abgelaufene Einträge blähen die Datei auf und verstellen den Blick auf die aktuellen.',
    )
  }
  pruefung.zaehlt()
}

/* --- 4. Wiederkehrende Zeiträume auf Plausibilität ------------------------- */

for (const zeitraum of restaurant.schliessungen_wiederkehrend) {
  if (!/^\d{2}-\d{2}$/.test(zeitraum.von) || !/^\d{2}-\d{2}$/.test(zeitraum.bis)) {
    pruefung.fehlt(
      `content/restaurant.json → schliessungen_wiederkehrend "${zeitraum.grund}"`,
      `"${zeitraum.von}" bis "${zeitraum.bis}" ist kein Format MM-TT.`,
      'Wiederkehrende Schließzeiten ohne Jahr eintragen, z. B. "12-24" — sonst verfällt die Datei jährlich.',
    )
  }
  pruefung.zaehlt()
}

/* --- 5. Jahreszahl in der Fußzeile ------------------------------------------
 * Das Copyright-Jahr ist im Layout fest verdrahtet. Bewusst: Ein
 * automatisch mitlaufendes Jahr über new Date() wäre bei einem statischen
 * Build das Jahr des letzten Deployments — also genauso falsch, nur
 * unauffälliger. Lieber hart eintragen und hier daran erinnern.
 */

const jahrJetzt = heute.getUTCFullYear()
const jahrImLayout = 2026

if (jahrImLayout < jahrJetzt) {
  pruefung.warnt(
    'src/components/Fusszeile.astro → jahr',
    `Die Fußzeile nennt ${jahrImLayout}, wir haben ${jahrJetzt}.`,
    `Wert auf ${jahrJetzt} setzen und diesen Wächter mitziehen (scripts/pruefe-datumsbomben.mjs).`,
  )
}
pruefung.zaehlt()

pruefung.abschliessen(
  `${pruefung.geprueft} Angaben, Öffnungszeiten geprüft bis ${restaurant.geprueft_bis}`,
)
