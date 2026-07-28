#!/usr/bin/env node
/**
 * Prüft die Speisekarte.
 *
 * Läuft vor jedem Build. Was hier durchfällt, geht nicht live — im Zweifel
 * bleibt die alte Seite online, statt eine falsche Preisangabe oder eine
 * unvollständige Allergenkennzeichnung auszuliefern.
 *
 * Aufruf: node scripts/pruefe-karte.mjs
 */

import { Pruefung, gelb, grau, lade } from './_ausgabe.mjs'

// Dynamisch geladen, damit ein Validierungsfehler beim Import als lesbare
// deutsche Meldung erscheint statt als Node-Stacktrace.
const {
  ALLERGENE,
  KARTE_META,
  KATEGORIEN,
  ZUSATZSTOFFE,
  anzahlGerichte,
  uebergangshinweisAktiv,
  verwendeteCodes,
} = await lade('../src/lib/karte.ts', 'Speisekarte')

const pruefung = new Pruefung('Speisekarte')

/* --- 1. Eindeutigkeit ------------------------------------------------------ */

const gesehenKategorie = new Set()
const gesehenGericht = new Map()

for (const kategorie of KATEGORIEN) {
  if (gesehenKategorie.has(kategorie.id)) {
    pruefung.fehlt(
      `Kategorie "${kategorie.titel}"`,
      `Die Kennung "${kategorie.id}" wird von mehr als einer Kategorie benutzt.`,
      'Kennungen müssen eindeutig sein — sie werden zu Sprungmarken (#steaks) auf der Seite.',
    )
  }
  gesehenKategorie.add(kategorie.id)

  for (const gericht of kategorie.gerichte) {
    if (gesehenGericht.has(gericht.id)) {
      pruefung.fehlt(
        `${kategorie.titel} → ${gericht.name}`,
        `Die Kennung "${gericht.id}" wird bereits in "${gesehenGericht.get(gericht.id)}" benutzt.`,
        'Kennung eindeutig vergeben, zum Beispiel "filetsteak-150" statt "filetsteak".',
      )
    }
    gesehenGericht.set(gericht.id, kategorie.titel)
    pruefung.zaehlt()
  }
}

/* --- 2. Reihenfolge -------------------------------------------------------- */

const reihenfolgen = KATEGORIEN.map((k) => k.reihenfolge)
if (new Set(reihenfolgen).size !== reihenfolgen.length) {
  pruefung.fehlt(
    'Kategoriereihenfolge',
    `Mindestens zwei Kategorien haben dieselbe Reihenfolge: ${reihenfolgen.join(', ')}.`,
    'Jede Kategorie braucht eine eigene Zahl — sonst ist die Sortierung der Karte zufällig.',
  )
}

/* --- 3. Legendenabgleich, beidseitig ---------------------------------------
 * Ein Code am Gericht ohne Eintrag in der Legende ist für den Gast wertlos.
 * Ein Legendeneintrag ohne Verwendung ist bloß Ballast — deshalb Warnung,
 * nicht Fehler: Die vollständige Liste der 14 Allergene darf stehen bleiben.
 */

const { allergene: benutzteAllergene, zusatzstoffe: benutzteZusatzstoffe } = verwendeteCodes()

for (const [art, benutzt, katalog] of [
  ['Allergen', benutzteAllergene, ALLERGENE],
  ['Zusatzstoff', benutzteZusatzstoffe, ZUSATZSTOFFE],
]) {
  const bekannt = new Set(katalog.map((eintrag) => eintrag.code))

  for (const code of benutzt) {
    if (!bekannt.has(code)) {
      pruefung.fehlt(
        `${art}-Code "${code}"`,
        'Der Code steht an einem Gericht, fehlt aber im Katalog.',
        'Code in content/kataloge/ ergänzen oder am Gericht korrigieren.',
      )
    }
  }
}

// Zusatzstoffe sind anders als Allergene keine feste Pflichtliste — ein
// unbenutzter Eintrag in der Legende verwirrt dort eher, als er hilft.
//
// Solange die Kennzeichnung insgesamt noch erhoben wird, ist naturgemäß
// KEIN Code in Gebrauch. Dann dreizehn gleichlautende Warnungen auszugeben
// erzieht nur dazu, Warnungen zu überlesen. Also erst danach prüfen.
if (!uebergangshinweisAktiv) {
  const unbenutzt = ZUSATZSTOFFE.filter((eintrag) => !benutzteZusatzstoffe.has(eintrag.code))

  if (unbenutzt.length > 0) {
    pruefung.warnt(
      'content/kataloge/zusatzstoffe.json',
      `${unbenutzt.length} Einträge stehen im Katalog, werden aber an keinem Gericht verwendet: ` +
        unbenutzt.map((e) => `${e.code} (${e.voll})`).join(', '),
      'Aus der Legende entfernen — sie soll nur auflösen, was auch auf der Karte steht.',
    )
  }
}

/* --- 4. Kennzeichnungsstand ------------------------------------------------ */

const ausstehend = []
const geprueft = []

for (const kategorie of KATEGORIEN) {
  for (const gericht of kategorie.gerichte) {
    if (gericht.kennzeichnung_status === 'ausstehend') {
      ausstehend.push(`${kategorie.titel} → ${gericht.name}`)
    } else {
      geprueft.push(gericht)
    }
  }
}

// Ein als geprüft geführtes Gericht ohne einen einzigen Code ist möglich
// ("keine kennzeichnungspflichtigen Zutaten"), aber selten. Bei einem
// Gericht mit Sauce, Panade oder Beilage ist es fast immer ein Versehen.
for (const gericht of geprueft) {
  if (gericht.allergene.length === 0 && gericht.zusatzstoffe.length === 0) {
    pruefung.warnt(
      gericht.name,
      'Als geprüft gekennzeichnet, trägt aber weder Allergen noch Zusatzstoff.',
      'Das wird als "keine kennzeichnungspflichtigen Zutaten" gerendert. Bitte gegenprüfen.',
    )
  }
}

/* --- 5. Preise ------------------------------------------------------------- */

for (const kategorie of KATEGORIEN) {
  for (const gericht of kategorie.gerichte) {
    const bezeichnungen = gericht.varianten.map((v) => v.bezeichnung)

    // Mehrere Varianten ohne Bezeichnung sind für den Gast nicht unterscheidbar.
    if (gericht.varianten.length > 1 && bezeichnungen.some((b) => b === null)) {
      pruefung.fehlt(
        `${kategorie.titel} → ${gericht.name}`,
        'Das Gericht hat mehrere Preise, aber mindestens eine Variante ohne Bezeichnung.',
        'Jede Variante braucht eine Bezeichnung, zum Beispiel "200 g" oder "kleine Portion".',
      )
    }

    if (new Set(bezeichnungen).size !== bezeichnungen.length) {
      pruefung.fehlt(
        `${kategorie.titel} → ${gericht.name}`,
        'Zwei Varianten tragen dieselbe Bezeichnung.',
        'Bezeichnungen müssen sich unterscheiden, sonst ist der Preis nicht zuordenbar.',
      )
    }

    // 0,00 € ist kein Endpreis, sondern ein vergessenes Feld.
    for (const variante of gericht.varianten) {
      if (variante.preis === '0,00') {
        pruefung.fehlt(
          `${kategorie.titel} → ${gericht.name}`,
          'Der Preis steht auf 0,00 €.',
          'Echten Endpreis eintragen oder das Gericht auf "verfuegbar": false setzen.',
        )
      }
    }
  }
}

/* --- 6. Pflichtangaben im Kopf ---------------------------------------------
 * Die Preisangabenverordnung verlangt den Endpreis, nicht den Steuersatz.
 * Ein ausgeschriebener Prozentsatz ist reine Haftungsfläche: Seit dem
 * 01.01.2026 gelten 7 % auf Speisen und 19 % auf Getränke — eine einzelne
 * Zahl im Fließtext wäre für die halbe Karte falsch.
 */

if (/\d+\s*(%|Prozent)/.test(KARTE_META.preishinweis)) {
  pruefung.fehlt(
    'content/speisekarte/_meta.json → preishinweis',
    'Der Preishinweis nennt einen Mehrwertsteuersatz.',
    'Satz entfernen. "inklusive gesetzlicher Mehrwertsteuer" genügt und bleibt immer richtig.',
  )
}

/* --- 7. Stand nicht älter als ein Jahr ------------------------------------- */

const stand = new Date(`${KARTE_META.stand}T00:00:00Z`)
const alterInTagen = Math.floor((Date.now() - stand.getTime()) / 86_400_000)

if (Number.isNaN(stand.getTime())) {
  pruefung.fehlt(
    'content/speisekarte/_meta.json → stand',
    `"${KARTE_META.stand}" ist kein gültiges Datum.`,
    'Format JJJJ-MM-TT, zum Beispiel "2026-07-28".',
  )
} else if (alterInTagen > 365) {
  pruefung.fehlt(
    'content/speisekarte/_meta.json → stand',
    `Der ausgewiesene Preisstand ist ${alterInTagen} Tage alt.`,
    'Preise gegenprüfen und "stand" aktualisieren. Der Stand steht sichtbar auf der Karte.',
  )
} else if (alterInTagen > 180) {
  pruefung.warnt(
    'content/speisekarte/_meta.json → stand',
    `Der ausgewiesene Preisstand ist ${alterInTagen} Tage alt.`,
    'Bitte demnächst gegenprüfen.',
  )
}

/* --- Abschluss ------------------------------------------------------------- */

if (ausstehend.length > 0) {
  console.log(
    `\n${gelb('  HINWEIS')}  Allergenkennzeichnung: ${ausstehend.length} von ${anzahlGerichte} Gerichten offen`,
  )
  console.log(
    grau(
      '           Der Übergangs-Hinweisblock über der Karte ist deshalb aktiv und\n' +
        '           verweist auf telefonische Auskunft und das Servicepersonal.\n' +
        '           Vorlage zum Erheben: docs/ALLERGEN-ERHEBUNG.md',
    ),
  )
}

pruefung.abschliessen(
  `${KATEGORIEN.length} Kategorien, ${anzahlGerichte} Gerichte, ` +
    `Kennzeichnung ${uebergangshinweisAktiv ? 'in Erhebung' : 'vollständig'}`,
)
