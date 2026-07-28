/**
 * Eine Quelle für Navigation, Sitemap und Weiterleitungstabelle.
 *
 * Wer eine Route hinzufügt, ohne sie hier einzutragen, bekommt keinen
 * Navigationseintrag und keinen Sitemap-Eintrag — das ist Absicht, damit
 * halbfertige Seiten nicht versehentlich indexiert werden.
 */

import feiernRohUngetypt from '../../content/feiern.json' with { type: 'json' }

/**
 * Die Gate-Felder stehen in der JSON auf null, solange der Kunde nicht
 * geliefert hat. TypeScript leitet daraus den Typ `null` ab — eine spätere
 * Prüfung auf `.length` wäre dann ein Typfehler, obwohl sie genau der Zweck
 * ist. Deshalb hier die tatsächlich mögliche Form deklarieren.
 */
interface FeiernDaten {
  readonly veroeffentlicht: boolean
  readonly max_personen: number | null
  readonly raum: string | null
  readonly vorlaufzeit: string | null
}

const feiernRoh = feiernRohUngetypt as unknown as FeiernDaten

export interface Route {
  readonly pfad: string
  readonly titel: string
  /** Kurzform für die Kopfzeile, wenn der volle Titel zu lang ist. */
  readonly nav?: string
  readonly inHauptnavigation: boolean
  readonly inFussnavigation: boolean
  readonly inSitemap: boolean
  /** Priorität in der Sitemap, 0.0–1.0. */
  readonly gewicht: number
}

/**
 * Die Feiern-Seite ist gesperrt, bis der Kunde Personenzahl, Raumsituation
 * und Vorlaufzeit geliefert hat. Bis dahin: kein Navigationseintrag, kein
 * Sitemap-Eintrag, keine Seite. Eine Seite, die „Bitte fragen Sie uns“ sagt
 * und sonst nichts, schadet mehr als sie nützt.
 */
export const feiernVeroeffentlicht: boolean =
  feiernRoh.veroeffentlicht === true &&
  typeof feiernRoh.max_personen === 'number' &&
  typeof feiernRoh.raum === 'string' &&
  feiernRoh.raum.length > 0 &&
  typeof feiernRoh.vorlaufzeit === 'string' &&
  feiernRoh.vorlaufzeit.length > 0

export const ROUTEN: readonly Route[] = [
  {
    pfad: '/',
    titel: 'Restaurant',
    inHauptnavigation: true,
    inFussnavigation: false,
    inSitemap: true,
    gewicht: 1.0,
  },
  {
    pfad: '/speisekarte/',
    titel: 'Speisekarte',
    inHauptnavigation: true,
    inFussnavigation: false,
    inSitemap: true,
    gewicht: 0.9,
  },
  {
    pfad: '/philosophie/',
    titel: 'Philosophie',
    inHauptnavigation: true,
    inFussnavigation: false,
    inSitemap: true,
    gewicht: 0.7,
  },
  {
    pfad: '/weinfachhandel/',
    titel: 'Weinfachhandel',
    inHauptnavigation: true,
    inFussnavigation: false,
    inSitemap: true,
    gewicht: 0.7,
  },
  {
    pfad: '/feiern-und-gruppen/',
    titel: 'Feiern & Gruppen',
    nav: 'Feiern',
    inHauptnavigation: feiernVeroeffentlicht,
    inFussnavigation: false,
    inSitemap: feiernVeroeffentlicht,
    gewicht: 0.8,
  },
  {
    pfad: '/kontakt/',
    titel: 'Kontakt & Anfahrt',
    nav: 'Kontakt',
    inHauptnavigation: true,
    inFussnavigation: false,
    inSitemap: true,
    gewicht: 0.8,
  },
  {
    pfad: '/impressum/',
    titel: 'Impressum',
    inHauptnavigation: false,
    inFussnavigation: true,
    inSitemap: true,
    gewicht: 0.3,
  },
  {
    pfad: '/datenschutz/',
    titel: 'Datenschutz',
    inHauptnavigation: false,
    inFussnavigation: true,
    inSitemap: true,
    gewicht: 0.3,
  },
  {
    pfad: '/barrierefreiheit/',
    titel: 'Barrierefreiheit',
    inHauptnavigation: false,
    inFussnavigation: true,
    inSitemap: true,
    gewicht: 0.3,
  },
  {
    pfad: '/bildnachweise/',
    titel: 'Bildnachweise',
    inHauptnavigation: false,
    inFussnavigation: true,
    inSitemap: true,
    gewicht: 0.2,
  },
]

export const hauptnavigation = ROUTEN.filter((route) => route.inHauptnavigation)
export const fussnavigation = ROUTEN.filter((route) => route.inFussnavigation)
export const sitemapRouten = ROUTEN.filter((route) => route.inSitemap)

/** Vergleicht Pfade unabhängig vom abschließenden Schrägstrich. */
export function istAktiv(aktuell: string, ziel: string): boolean {
  const normalisiere = (pfad: string) => (pfad.endsWith('/') ? pfad : `${pfad}/`)
  return normalisiere(aktuell) === normalisiere(ziel)
}
