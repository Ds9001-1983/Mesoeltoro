/**
 * Die Palette als Datensatz — samt der Regeln, wo jede Farbe benutzt werden darf.
 *
 * Diese Datei ist die Quelle für den Test und für scripts/pruefe-kontraste.mjs.
 * tokens.css muss dieselben Hex-Werte tragen; das Skript vergleicht beide und
 * bricht bei Abweichung ab. Damit kann niemand eine Farbe im CSS ändern und
 * den Kommentar daneben stehen lassen.
 *
 * Stand 29.07.2026: Die Seite ist durchgehend dunkel. Vorher lief sie hell
 * („Zwei Temperaturen“) mit genau einem dunklen Kapitel. Der Wechsel kommt
 * aus der SUPERBRAND-Vorschau; die Palette ist von dort übernommen und hier
 * nachgerechnet. Sie trägt mit großem Abstand — Creme auf Grund liegt bei
 * 14,43:1, Gold bei 7,85:1.
 */

import { type Verwendung } from './kontrast.ts'

export const PALETTE = {
  /** Grundfläche der gesamten Website. */
  grund: '#14110D',
  /** Fließtext und Überschriften. */
  creme: '#ECE0CC',
  /**
   * Sekundärtext als eigener Hexwert, nicht als Deckkraft.
   *
   * Die Vorschau setzt Sekundärtext mit `text-[#ece0cc]/50` — das ergibt
   * 4,37:1 und verfehlt 4,5 für Fließtextgröße. Ein fester Ton macht den
   * Wert nachrechenbar, statt ihn von einer Alpha-Angabe abhängig zu machen,
   * die niemand prüft.
   */
  'creme-leise': '#A09889',
  /** Akzent: Links, Rubriken, Ziffern, Haarlinien. */
  gold: '#C9A24B',
  /** Vollfläche für Mobilmenü und gefüllte Schaltflächen. Nie als Linie. */
  bordeaux: '#7B2233',
  /** Text auf Bordeaux. */
  elfenbein: '#FAF6EF',
  /** Ausschließlich Dekor: Glutsaum, Shader-Partikel. Nie Text. */
  glut: '#C1440E',
} as const

export type Farbname = keyof typeof PALETTE

export interface Paarung {
  readonly vordergrund: Farbname
  readonly hintergrund: Farbname
  readonly verwendung: Verwendung
  /** Was die Farbe hier tatsächlich tut — steht so in den Komponenten. */
  readonly einsatz: string
  /**
   * `true`, wenn diese Kombination im Projekt VERBOTEN ist. Der Test prüft
   * dann, dass sie die Anforderung tatsächlich verfehlt — sonst wäre das
   * Verbot willkürlich und würde beim nächsten Aufräumen gestrichen.
   */
  readonly verboten?: true
}

export const PAARUNGEN: readonly Paarung[] = [
  /* --- Auf der dunklen Grundfläche --------------------------------------- */
  {
    vordergrund: 'creme',
    hintergrund: 'grund',
    verwendung: 'fliesstext',
    einsatz: 'Fließtext und Überschriften auf der Grundfläche',
  },
  {
    vordergrund: 'creme-leise',
    hintergrund: 'grund',
    verwendung: 'fliesstext',
    einsatz: 'Sekundärtext, Bildunterschriften, Öffnungszeiten in der Kopfzeile',
  },
  {
    vordergrund: 'gold',
    hintergrund: 'grund',
    verwendung: 'fliesstext',
    einsatz: 'Links, spanische Rubriken, römische Ziffern, Preise',
  },
  {
    vordergrund: 'grund',
    hintergrund: 'gold',
    verwendung: 'fliesstext',
    einsatz: 'Schrift auf der gefüllten Schaltfläche im Hover-Zustand',
  },

  /* --- Bordeaux als Vollfläche ------------------------------------------- */
  {
    vordergrund: 'elfenbein',
    hintergrund: 'bordeaux',
    verwendung: 'fliesstext',
    einsatz: 'Mobilmenü — Navigationseinträge auf voller Bordeaux-Fläche',
  },
  {
    vordergrund: 'creme',
    hintergrund: 'bordeaux',
    verwendung: 'fliesstext',
    einsatz: 'Fließtext auf Bordeaux-Flächen',
  },

  /* --- Fokusring: muss auf BEIDEN Flächen tragen ------------------------- */
  {
    vordergrund: 'elfenbein',
    hintergrund: 'grund',
    verwendung: 'ui',
    einsatz: 'Innerer Fokusring gegen die dunkle Grundfläche',
  },
  {
    vordergrund: 'elfenbein',
    hintergrund: 'bordeaux',
    verwendung: 'ui',
    einsatz: 'Innerer Fokusring gegen Bordeaux',
  },
  {
    vordergrund: 'grund',
    hintergrund: 'elfenbein',
    verwendung: 'ui',
    einsatz: 'Äußerer Fokusring gegen helle Flächen und Bilder',
  },

  /* --- Ausdrücklich verbotene Kombinationen ------------------------------
   * Diese stehen hier, damit der Test beweist, dass das Verbot berechtigt
   * ist. Wer sie doch benutzen will, sieht sofort die Zahl dahinter.       */
  {
    vordergrund: 'gold',
    hintergrund: 'bordeaux',
    verwendung: 'fliesstext',
    einsatz: 'VERBOTEN als Fließtext — 4,13:1. Auf Bordeaux trägt nur Elfenbein oder Creme',
    verboten: true,
  },
  {
    vordergrund: 'bordeaux',
    hintergrund: 'grund',
    verwendung: 'ui',
    einsatz: 'VERBOTEN als Linie oder Rand — 1,90:1. Bordeaux ist Fläche, nie Kontur',
    verboten: true,
  },
  {
    vordergrund: 'glut',
    hintergrund: 'grund',
    verwendung: 'fliesstext',
    einsatz: 'VERBOTEN als Text — 3,68:1. Ausschließlich Glutsaum und Shader',
    verboten: true,
  },
]

/**
 * Mindestgröße für Farben, die 4,5:1 verfehlen, aber 3:1 erreichen.
 * WCAG 1.4.3: „groß“ heißt ab 18,66px fett oder ab 24px regulär.
 */
export const GROSSSCHRIFT_AB_PX = 24
