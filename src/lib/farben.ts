/**
 * Die Palette als Datensatz — samt der Regeln, wo jede Farbe benutzt werden darf.
 *
 * Diese Datei ist die Quelle für den Test und für scripts/pruefe-kontraste.mjs.
 * tokens.css muss dieselben Hex-Werte tragen; das Skript vergleicht beide und
 * bricht bei Abweichung ab. Damit kann niemand eine Farbe im CSS ändern und
 * den Kommentar daneben stehen lassen.
 */

import { type Verwendung } from './kontrast.ts'

export const PALETTE = {
  kalk: '#F4EFE6',
  leinen: '#E3D8C4',
  espresso: '#2B2521',
  'espresso-70': '#5A5049',
  ochsenblut: '#B3372B',
  messing: '#8F7400',
  ember: '#C1440E',
  'kalk-auf-dunkel': '#F4EFE6',
  'ember-hell': '#E9A178',
  'messing-hell': '#C9A227',
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
  /* --- Helle Flächen ----------------------------------------------------- */
  {
    vordergrund: 'espresso',
    hintergrund: 'kalk',
    verwendung: 'fliesstext',
    einsatz: 'Fließtext und Überschriften auf heller Grundfläche',
  },
  {
    vordergrund: 'espresso-70',
    hintergrund: 'kalk',
    verwendung: 'fliesstext',
    einsatz: 'Sekundärtext, Eyebrow, Bildunterschriften',
  },
  {
    vordergrund: 'ochsenblut',
    hintergrund: 'kalk',
    verwendung: 'fliesstext',
    einsatz: 'Links und aktive Navigation auf heller Fläche',
  },
  {
    vordergrund: 'kalk',
    hintergrund: 'ochsenblut',
    verwendung: 'fliesstext',
    einsatz: 'Schrift auf dem Telefon-Button und der Anrufleiste',
  },
  {
    vordergrund: 'messing',
    hintergrund: 'kalk',
    verwendung: 'grossschrift',
    einsatz: 'Jahreszahlen, Linien, Rahmen — nie Fließtext',
  },
  {
    vordergrund: 'ember',
    hintergrund: 'kalk',
    verwendung: 'dekor',
    einsatz: 'Glutsaum an der Schnittkante — nie Text, nie Bedienelement',
  },

  /* --- Dunkles Kapitel und Fußzeile -------------------------------------- */
  {
    vordergrund: 'kalk-auf-dunkel',
    hintergrund: 'espresso',
    verwendung: 'fliesstext',
    einsatz: 'Fließtext im Glut-Kapitel und in der Fußzeile',
  },
  {
    vordergrund: 'ember-hell',
    hintergrund: 'espresso',
    verwendung: 'fliesstext',
    einsatz: 'Links auf dunkler Fläche',
  },
  {
    vordergrund: 'messing-hell',
    hintergrund: 'espresso',
    verwendung: 'fliesstext',
    einsatz: 'Rubriken und Akzente auf dunkler Fläche',
  },

  /* --- Fokusring: muss auf BEIDEN Flächen tragen ------------------------- */
  {
    vordergrund: 'kalk',
    hintergrund: 'espresso',
    verwendung: 'ui',
    einsatz: 'Innerer Fokusring gegen dunklen Untergrund',
  },
  {
    vordergrund: 'espresso',
    hintergrund: 'kalk',
    verwendung: 'ui',
    einsatz: 'Äußerer Fokusring gegen helle Fläche',
  },

  /* --- Ausdrücklich verbotene Kombinationen ------------------------------
   * Diese stehen hier, damit der Test beweist, dass das Verbot berechtigt
   * ist. Wer sie doch benutzen will, sieht sofort die Zahl dahinter.       */
  {
    vordergrund: 'ochsenblut',
    hintergrund: 'espresso',
    verwendung: 'fliesstext',
    einsatz: 'VERBOTEN — Markenrot trägt auf dunkler Fläche nicht',
    verboten: true,
  },
  {
    vordergrund: 'ochsenblut',
    hintergrund: 'leinen',
    verwendung: 'fliesstext',
    einsatz: 'VERBOTEN — Markenrot auf Leinen verfehlt 4,5:1 knapp',
    verboten: true,
  },
  {
    vordergrund: 'ember',
    hintergrund: 'espresso',
    verwendung: 'ui',
    einsatz: 'VERBOTEN als Bedienelement auf dunkler Fläche',
    verboten: true,
  },
  {
    vordergrund: 'messing',
    hintergrund: 'kalk',
    verwendung: 'fliesstext',
    einsatz: 'VERBOTEN als Fließtext — nur Großschrift, Linien, UI',
    verboten: true,
  },
]

/**
 * Mindestgröße für Farben, die 4,5:1 verfehlen, aber 3:1 erreichen.
 * WCAG 1.4.3: „groß“ heißt ab 18,66px fett oder ab 24px regulär.
 */
export const GROSSSCHRIFT_AB_PX = 24
