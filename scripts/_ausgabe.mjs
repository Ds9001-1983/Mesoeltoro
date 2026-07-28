/**
 * Gemeinsame Ausgabe der Prüfskripte.
 *
 * Alle Meldungen sind deutschsprachig und nennen Datei, Ursache und die
 * konkrete Abhilfe. Der Kunde pflegt die Inhalte selbst über github.dev —
 * eine Fehlermeldung wie "ZodError: invalid_string at [0].varianten[1].preis"
 * ist für ihn wertlos.
 */

const FARBEN = process.stdout.isTTY && !process.env['NO_COLOR']

const einfaerben = (code, text) => (FARBEN ? `[${code}m${text}[0m` : text)

export const rot = (text) => einfaerben('31', text)
export const gruen = (text) => einfaerben('32', text)
export const gelb = (text) => einfaerben('33', text)
export const grau = (text) => einfaerben('90', text)
export const fett = (text) => einfaerben('1', text)

export class Pruefung {
  /** @param {string} name Was geprüft wird, z. B. "Speisekarte" */
  constructor(name) {
    this.name = name
    /** @type {{ort: string, problem: string, abhilfe: string}[]} */
    this.fehler = []
    /** @type {{ort: string, problem: string, abhilfe: string}[]} */
    this.warnungen = []
    this.geprueft = 0
  }

  /**
   * Harter Fehler — bricht den Build ab.
   * @param {string} ort      Datei und Stelle, z. B. "02-steaks.json → Rumpsteak"
   * @param {string} problem  Was falsch ist, in einem Satz
   * @param {string} abhilfe  Was konkret zu tun ist
   */
  fehlt(ort, problem, abhilfe) {
    this.fehler.push({ ort, problem, abhilfe })
  }

  /** Weiche Warnung — wird gemeldet, bricht aber nicht ab. */
  warnt(ort, problem, abhilfe) {
    this.warnungen.push({ ort, problem, abhilfe })
  }

  zaehlt(anzahl = 1) {
    this.geprueft += anzahl
  }

  /**
   * Gibt das Ergebnis aus und beendet den Prozess bei Fehlern mit Code 1.
   * @param {string} [erfolgsmeldung]
   */
  abschliessen(erfolgsmeldung) {
    const kopf = `${this.name}`

    for (const warnung of this.warnungen) {
      console.warn(`\n${gelb('  HINWEIS')}  ${fett(warnung.ort)}`)
      console.warn(`           ${warnung.problem}`)
      console.warn(`           ${grau(`→ ${warnung.abhilfe}`)}`)
    }

    if (this.fehler.length === 0) {
      const zusatz = erfolgsmeldung ?? `${this.geprueft} geprüft`
      console.log(`${gruen('  ✓')} ${kopf.padEnd(34)} ${grau(zusatz)}`)
      return
    }

    console.error(`\n${rot(`  ✗ ${kopf} — ${this.fehler.length} Fehler`)}\n`)
    for (const fehler of this.fehler) {
      console.error(`  ${rot('•')} ${fett(fehler.ort)}`)
      console.error(`    ${fehler.problem}`)
      console.error(`    ${grau(`→ ${fehler.abhilfe}`)}\n`)
    }
    console.error(rot(`  Der Build wurde abgebrochen. Bis zur Behebung bleibt die alte Seite online.\n`))
    process.exit(1)
  }
}

/** Bricht sofort mit einer erklärenden Meldung ab (z. B. fehlende Datei). */
export function abbruch(meldung, abhilfe) {
  console.error(`\n${rot('  ✗ ' + meldung)}`)
  if (abhilfe) console.error(`    ${grau(`→ ${abhilfe}`)}`)
  console.error('')
  process.exit(1)
}

/**
 * Lädt ein Modul, das seine Daten beim Import validiert.
 *
 * Die Validierung in src/lib/*.ts wirft beim Laden — das ist richtig, denn
 * so kann kein ungültiger Datensatz je in eine Seite gelangen. Als
 * Node-Stacktrace ist die Meldung aber wertlos für jemanden, der die Karte
 * über github.dev pflegt. Deshalb hier abfangen und lesbar ausgeben.
 *
 * @param {string} pfad     Modulpfad, z. B. '../src/lib/karte.ts'
 * @param {string} betreff  Was geladen wird, z. B. 'Speisekarte'
 */
export async function lade(pfad, betreff) {
  try {
    return await import(pfad)
  } catch (fehler) {
    const meldung = fehler instanceof Error ? fehler.message : String(fehler)

    console.error(`\n${rot(`  ✗ ${betreff} — die Daten sind ungültig`)}\n`)
    for (const zeile of meldung.split('\n')) {
      const bereinigt = zeile.replace(/^\s*·\s*/, '')
      if (!bereinigt.trim() || bereinigt.startsWith('Die ')) continue
      console.error(`  ${rot('•')} ${bereinigt.trim()}`)
    }
    console.error(
      `\n${grau('  Die Datei liegt unter content/. Korrigieren, speichern, erneut prüfen.')}`,
    )
    console.error(
      grau('  Schritt für Schritt erklärt: docs/PFLEGE-SPEISEKARTE.md\n'),
    )
    process.exit(1)
  }
}
