/**
 * Öffnungszeiten-Logik.
 *
 * Ausschließlich reine Funktionen: (Zeitpunkt + Konfiguration) → Status.
 * Kein Zugriff auf `new Date()` ohne Argument, kein DOM, kein Import von
 * Astro-Kram. Nur so lässt sich der Sommerzeitwechsel und die Jahresgrenze
 * der Betriebsruhe überhaupt testen.
 *
 * Die Zeitzone ist immer die des Restaurants (Europe/Berlin), nie die des
 * Besuchers. Ein Gast, der aus Mallorca auf die Seite schaut, will wissen,
 * ob in Waldbröl gerade offen ist — nicht, wie spät es bei ihm ist.
 */

export const WOCHENTAGE = [
  'sonntag',
  'montag',
  'dienstag',
  'mittwoch',
  'donnerstag',
  'freitag',
  'samstag',
] as const

export type Wochentag = (typeof WOCHENTAGE)[number]

/** ["12:00", "14:00"] — Beginn und Ende, beide im 24-Stunden-Format. */
export type Zeitraum = readonly [string, string]

export type Wochenplan = Readonly<Record<Wochentag, readonly Zeitraum[]>>

export interface Schliessung {
  /** "12-24" (wiederkehrend, MM-TT) oder "2026-12-24" (einmalig, JJJJ-MM-TT). */
  readonly von: string
  readonly bis: string
  readonly grund: string
  readonly banner?: boolean
}

export interface ZeitenKonfiguration {
  readonly zeitzone: string
  readonly regulaer: Wochenplan
  readonly schliessungen_wiederkehrend: readonly Schliessung[]
  readonly schliessungen_einmalig: readonly Schliessung[]
}

export type StatusArt =
  /** Gerade geöffnet. */
  | 'geoeffnet'
  /** Heute noch, aber später. */
  | 'spaeter'
  /** Heute nicht mehr oder gar nicht — mit nächstem Termin. */
  | 'geschlossen'
  /** Urlaub, Feiertag, Betriebsruhe. */
  | 'schliessung'

export interface Status {
  readonly art: StatusArt
  /** Fertiger Satz für die Anzeige. Volltext, nie nur eine Farbe (1.4.1). */
  readonly text: string
  /** Schließzeit, wenn gerade geöffnet ist. */
  readonly bis?: string
  /** Öffnungszeit, wenn heute noch geöffnet wird. */
  readonly ab?: string
  /** Grund einer Schließung, z. B. "Betriebsruhe". */
  readonly grund?: string
}

/* ---------------------------------------------------------------------------
   Kalender-Hilfen
   --------------------------------------------------------------------------- */

export interface Kalendertag {
  readonly jahr: number
  /** 1–12, nicht nullbasiert. */
  readonly monat: number
  readonly tag: number
  readonly stunde: number
  readonly minute: number
  readonly wochentag: Wochentag
}

/**
 * Zerlegt einen Zeitpunkt in die Wanduhr-Bestandteile der angegebenen Zeitzone.
 *
 * Intl erledigt hier die gesamte Sommerzeit-Arithmetik. Jede eigene Rechnung
 * mit Stundenoffsets wäre am letzten Sonntag im März falsch.
 */
export function kalendertag(zeitpunkt: Date, zeitzone: string): Kalendertag {
  const teile = new Intl.DateTimeFormat('en-CA', {
    timeZone: zeitzone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    weekday: 'short',
  }).formatToParts(zeitpunkt)

  const hole = (typ: Intl.DateTimeFormatPartTypes): string =>
    teile.find((t) => t.type === typ)?.value ?? '0'

  // Aus dem Kalenderdatum den Wochentag rechnen statt Intl-Kürzel zu parsen —
  // die Kürzel hängen an der Locale, das Datum nicht.
  const jahr = Number(hole('year'))
  const monat = Number(hole('month'))
  const tag = Number(hole('day'))
  const index = new Date(Date.UTC(jahr, monat - 1, tag)).getUTCDay()

  return {
    jahr,
    monat,
    tag,
    stunde: Number(hole('hour')),
    minute: Number(hole('minute')),
    wochentag: WOCHENTAGE[index] as Wochentag,
  }
}

/** "05" statt "5" — für den Vergleich von MM-TT-Zeichenketten. */
function zweistellig(zahl: number): string {
  return String(zahl).padStart(2, '0')
}

/** Kalendertag → "12-24". */
export function alsMonatTag(tag: Pick<Kalendertag, 'monat' | 'tag'>): string {
  return `${zweistellig(tag.monat)}-${zweistellig(tag.tag)}`
}

/** Kalendertag → "2026-12-24". */
export function alsDatum(tag: Pick<Kalendertag, 'jahr' | 'monat' | 'tag'>): string {
  return `${tag.jahr}-${alsMonatTag(tag)}`
}

/** "12:30" → 750 Minuten seit Mitternacht. */
export function alsMinuten(uhrzeit: string): number {
  const [stunde, minute] = uhrzeit.split(':')
  return Number(stunde) * 60 + Number(minute)
}

/**
 * Zählt Kalendertage weiter — rein rechnerisch, ohne Zeitzone.
 *
 * Bewusst über Date.UTC: an einem Zeitzonenwechsel würde eine Rechnung mit
 * lokalen Zeitstempeln einen Tag überspringen oder doppeln.
 */
export function naechsterKalendertag(tag: Kalendertag, schritte = 1): Kalendertag {
  const zeitpunkt = new Date(Date.UTC(tag.jahr, tag.monat - 1, tag.tag + schritte))
  return {
    jahr: zeitpunkt.getUTCFullYear(),
    monat: zeitpunkt.getUTCMonth() + 1,
    tag: zeitpunkt.getUTCDate(),
    stunde: 0,
    minute: 0,
    wochentag: WOCHENTAGE[zeitpunkt.getUTCDay()] as Wochentag,
  }
}

/* ---------------------------------------------------------------------------
   Schließungen
   --------------------------------------------------------------------------- */

/**
 * Prüft, ob ein Kalendertag in einen Schließungszeitraum fällt.
 *
 * Wiederkehrende Zeiträume sind MM-TT und dürfen den Jahreswechsel
 * überspannen ("12-27" bis "01-06"); dann gilt die Oder- statt der
 * Und-Verknüpfung. Einmalige Zeiträume sind volle Datumsangaben.
 */
export function schliessungAn(
  tag: Kalendertag,
  konfiguration: Pick<ZeitenKonfiguration, 'schliessungen_wiederkehrend' | 'schliessungen_einmalig'>,
): Schliessung | null {
  const monatTag = alsMonatTag(tag)
  const datum = alsDatum(tag)

  for (const zeitraum of konfiguration.schliessungen_wiederkehrend) {
    const ueberJahreswechsel = zeitraum.von > zeitraum.bis
    const trifft = ueberJahreswechsel
      ? monatTag >= zeitraum.von || monatTag <= zeitraum.bis
      : monatTag >= zeitraum.von && monatTag <= zeitraum.bis
    if (trifft) return zeitraum
  }

  for (const zeitraum of konfiguration.schliessungen_einmalig) {
    if (datum >= zeitraum.von && datum <= zeitraum.bis) return zeitraum
  }

  return null
}

/* ---------------------------------------------------------------------------
   Statusermittlung
   --------------------------------------------------------------------------- */

const WOCHENTAG_ANZEIGE: Record<Wochentag, string> = {
  sonntag: 'Sonntag',
  montag: 'Montag',
  dienstag: 'Dienstag',
  mittwoch: 'Mittwoch',
  donnerstag: 'Donnerstag',
  freitag: 'Freitag',
  samstag: 'Samstag',
}

/** Findet den nächsten Tag mit Öffnungszeiten. Sucht höchstens 60 Tage weit. */
function naechsteOeffnung(
  ab: Kalendertag,
  konfiguration: ZeitenKonfiguration,
): { tag: Kalendertag; beginn: string; abstand: number } | null {
  for (let abstand = 1; abstand <= 60; abstand += 1) {
    const kandidat = naechsterKalendertag(ab, abstand)
    if (schliessungAn(kandidat, konfiguration)) continue

    const zeiten = konfiguration.regulaer[kandidat.wochentag]
    const ersterZeitraum = zeiten?.[0]
    if (ersterZeitraum) {
      return { tag: kandidat, beginn: ersterZeitraum[0], abstand }
    }
  }
  return null
}

/** "morgen ab 12:00 Uhr" / "am Mittwoch ab 12:00 Uhr" */
function formuliereNaechste(treffer: { tag: Kalendertag; beginn: string; abstand: number }): string {
  const wann =
    treffer.abstand === 1 ? 'morgen' : `am ${WOCHENTAG_ANZEIGE[treffer.tag.wochentag]}`
  return `${wann} ab ${treffer.beginn} Uhr`
}

/**
 * Ermittelt den Öffnungsstatus zu einem Zeitpunkt.
 *
 * Reine Funktion — der Zeitpunkt wird immer übergeben, nie intern gelesen.
 */
export function ermittleStatus(zeitpunkt: Date, konfiguration: ZeitenKonfiguration): Status {
  const heute = kalendertag(zeitpunkt, konfiguration.zeitzone)
  const jetzt = heute.stunde * 60 + heute.minute

  // 1. Schließung schlägt alles.
  const schliessung = schliessungAn(heute, konfiguration)
  if (schliessung) {
    const naechste = naechsteOeffnung(heute, konfiguration)
    return {
      art: 'schliessung',
      grund: schliessung.grund,
      text: naechste
        ? `${schliessung.grund} — wir sind ${formuliereNaechste(naechste)} wieder für Sie da.`
        : `${schliessung.grund}.`,
    }
  }

  const zeiten = konfiguration.regulaer[heute.wochentag] ?? []

  // 2. Läuft gerade ein Zeitraum?
  for (const [beginn, ende] of zeiten) {
    if (jetzt >= alsMinuten(beginn) && jetzt < alsMinuten(ende)) {
      return {
        art: 'geoeffnet',
        bis: ende,
        text: `Jetzt geöffnet — Küche bis ${ende} Uhr.`,
      }
    }
  }

  // 3. Kommt heute noch einer?
  for (const [beginn] of zeiten) {
    if (jetzt < alsMinuten(beginn)) {
      return {
        art: 'spaeter',
        ab: beginn,
        text: `Heute ab ${beginn} Uhr für Sie da.`,
      }
    }
  }

  // 4. Heute nichts mehr.
  const naechste = naechsteOeffnung(heute, konfiguration)
  const ruhetag = zeiten.length === 0

  if (!naechste) {
    return { art: 'geschlossen', text: 'Zurzeit geschlossen.' }
  }

  return {
    art: 'geschlossen',
    ab: naechste.beginn,
    text: ruhetag
      ? `Heute ist Ruhetag — wir sind ${formuliereNaechste(naechste)} wieder für Sie da.`
      : `Für heute haben wir geschlossen — ${formuliereNaechste(naechste)} wieder.`,
  }
}

/* ---------------------------------------------------------------------------
   Darstellung der vollständigen Tabelle
   --------------------------------------------------------------------------- */

export interface Tabellenzeile {
  readonly wochentag: Wochentag
  readonly bezeichnung: string
  /** "12:00–14:00 und 18:00–22:00" oder "Ruhetag". */
  readonly zeiten: string
  readonly ruhetag: boolean
}

/** Montag zuerst — der Kalenderindex beginnt beim Sonntag, die Tabelle nicht. */
const TABELLENREIHENFOLGE: readonly Wochentag[] = [
  'montag',
  'dienstag',
  'mittwoch',
  'donnerstag',
  'freitag',
  'samstag',
  'sonntag',
]

export function alsTabelle(plan: Wochenplan): Tabellenzeile[] {
  return TABELLENREIHENFOLGE.map((wochentag) => {
    const zeiten = plan[wochentag] ?? []
    return {
      wochentag,
      bezeichnung: WOCHENTAG_ANZEIGE[wochentag],
      // Halbgeviertstrich zwischen den Uhrzeiten, nicht Bindestrich.
      zeiten:
        zeiten.length === 0
          ? 'Ruhetag'
          : zeiten.map(([von, bis]) => `${von}–${bis} Uhr`).join(' und '),
      ruhetag: zeiten.length === 0,
    }
  })
}
