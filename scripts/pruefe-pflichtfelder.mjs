#!/usr/bin/env node
/**
 * Prüft die Pflichtangaben nach § 5 DDG und die Stammdaten.
 *
 * Was hier fehlt, macht das Impressum unvollständig — und ein
 * unvollständiges Impressum ist der klassische Abmahngrund. Deshalb bricht
 * dieser Wächter den Build ab, statt zu warnen.
 *
 * Aufruf: node scripts/pruefe-pflichtfelder.mjs
 */

import { Pruefung, lade } from './_ausgabe.mjs'

const { restaurant } = await lade('../src/lib/daten.ts', 'Stammdaten')

const pruefung = new Pruefung('Pflichtangaben nach § 5 DDG')

/* --- Anbieterkennzeichnung ------------------------------------------------- */

const PFLICHT = [
  ['firma', 'Vollständige Firma einschließlich Rechtsformzusatz', '§ 5 Abs. 1 Nr. 1 DDG'],
  ['vertreten_durch', 'Vertretungsberechtigte Person', '§ 5 Abs. 1 Nr. 1 DDG'],
  ['registergericht', 'Registergericht', '§ 5 Abs. 1 Nr. 4 DDG'],
  ['hrb', 'Handelsregisternummer', '§ 5 Abs. 1 Nr. 4 DDG'],
  ['ust_id', 'Umsatzsteuer-Identifikationsnummer', '§ 5 Abs. 1 Nr. 6 DDG i.V.m. § 27a UStG'],
]

for (const [feld, bezeichnung, norm] of PFLICHT) {
  const wert = restaurant.rechtsform[feld]
  if (!wert || String(wert).trim().length === 0) {
    pruefung.fehlt(
      `content/restaurant.json → rechtsform.${feld}`,
      `${bezeichnung} fehlt. Vorgeschrieben nach ${norm}.`,
      'Wert beim Kunden erfragen und eintragen. Ohne ihn ist das Impressum unvollständig.',
    )
  }
  pruefung.zaehlt()
}

/* --- Erreichbarkeit --------------------------------------------------------
 * Der EuGH hat entschieden, dass ein Kontaktformular die Pflicht zur Angabe
 * einer E-Mail-Adresse nicht ersetzt (C-298/07). Die Adresse muss im
 * Klartext dastehen — verschleierte Schreibweisen wie "info (at) …" genügen
 * nicht, weil sie die unmittelbare Kommunikation erschweren.
 */

if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(restaurant.email)) {
  pruefung.fehlt(
    'content/restaurant.json → email',
    `"${restaurant.email}" ist keine unmittelbar nutzbare E-Mail-Adresse.`,
    'Adresse im Klartext eintragen (EuGH C-298/07). Keine Umschreibung mit (at) oder [dot].',
  )
}

if (!/^\+\d{7,15}$/.test(restaurant.telefon_e164)) {
  pruefung.fehlt(
    'content/restaurant.json → telefon_e164',
    'Die Telefonnummer steht nicht im internationalen Format.',
    'Format +4922914347 — sie speist die tel:-Links und die strukturierten Daten.',
  )
}

/* --- Bestätigung durch den Kunden ------------------------------------------
 * Die Registerdaten stammen aus dem Impressum der alten Seite. Sie sind
 * plausibel, aber nicht gegengeprüft. Solange der Kunde sie nicht bestätigt
 * hat, ist das eine Warnung — kein Fehler, sonst ließe sich nie bauen.
 */

if (!restaurant.rechtsform.bestaetigt_vom_kunden) {
  pruefung.warnt(
    'content/restaurant.json → rechtsform.bestaetigt_vom_kunden',
    'Die Registerangaben stammen aus dem Impressum der alten Seite und sind noch nicht gegengeprüft.',
    'Von Christian Böhmer bestätigen lassen, dann auf true setzen. Siehe docs/UEBERGABE.md.',
  )
}

/* --- Bewertungen ------------------------------------------------------------
 * § 5b Abs. 3 UWG: Wer Verbraucherbewertungen zugänglich macht, muss
 * angeben, ob und wie sichergestellt wird, dass sie von echten Gästen
 * stammen. Der Hinweis muss also existieren, bevor irgendwo ein Zitat steht.
 */

if (restaurant.bewertungen_pruefhinweis.trim().length < 40) {
  pruefung.fehlt(
    'content/restaurant.json → bewertungen_pruefhinweis',
    'Der Prüfhinweis zu Gästebewertungen ist zu kurz, um die Pflicht zu erfüllen.',
    'Nach § 5b Abs. 3 UWG muss stehen, OB und WIE die Echtheit geprüft wird — auch ein "wir prüfen nicht" ist zulässig.',
  )
}

/* --- Geokoordinaten --------------------------------------------------------- */

const { breite, laenge } = restaurant.adresse.geo
if (breite < 47 || breite > 55.5 || laenge < 5.5 || laenge > 15.5) {
  pruefung.fehlt(
    'content/restaurant.json → adresse.geo',
    `Die Koordinaten ${breite}/${laenge} liegen außerhalb Deutschlands.`,
    'Breiten- und Längengrad prüfen — sie landen in den strukturierten Daten und im Routenlink.',
  )
}

pruefung.abschliessen(`${PFLICHT.length} Pflichtangaben, Kontakt und Geodaten geprüft`)
