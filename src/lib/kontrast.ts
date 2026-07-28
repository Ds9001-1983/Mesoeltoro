/**
 * Kontrastrechnung nach WCAG 2.x.
 *
 * Wird an drei Stellen benutzt:
 *   1. tests/unit/kontrast-tokens.test.ts — prüft die Palette
 *   2. scripts/pruefe-kontraste.mjs      — prüft tokens.css gegen die Palette
 *   3. Entwurfsarbeit                    — statt im Browser zu pipettieren
 *
 * Bewusst ohne Abhängigkeit: Die Formel ist zwölf Zeilen lang und seit 2008
 * unverändert. Eine Bibliothek dafür wäre eine Fünfjahres-Verbindlichkeit
 * für nichts.
 */

export interface Farbe {
  readonly r: number
  readonly g: number
  readonly b: number
}

/** "#B3372B" oder "b3372b" → Kanäle 0–255. */
export function ausHex(hex: string): Farbe {
  const bereinigt = hex.trim().replace(/^#/, '')
  const voll =
    bereinigt.length === 3
      ? bereinigt
          .split('')
          .map((zeichen) => zeichen + zeichen)
          .join('')
      : bereinigt

  if (!/^[0-9a-fA-F]{6}$/.test(voll)) {
    throw new Error(`Kein gültiger Hex-Farbwert: "${hex}"`)
  }

  return {
    r: Number.parseInt(voll.slice(0, 2), 16),
    g: Number.parseInt(voll.slice(2, 4), 16),
    b: Number.parseInt(voll.slice(4, 6), 16),
  }
}

/** Gammakorrektur eines einzelnen Kanals. */
function linear(kanal: number): number {
  const anteil = kanal / 255
  return anteil <= 0.04045 ? anteil / 12.92 : ((anteil + 0.055) / 1.055) ** 2.4
}

/** Relative Leuchtdichte, 0 (Schwarz) bis 1 (Weiß). */
export function leuchtdichte(farbe: Farbe): number {
  return 0.2126 * linear(farbe.r) + 0.7152 * linear(farbe.g) + 0.0722 * linear(farbe.b)
}

/** Kontrastverhältnis zweier Farben, 1:1 bis 21:1. Reihenfolge egal. */
export function kontrast(vordergrund: string | Farbe, hintergrund: string | Farbe): number {
  const a = leuchtdichte(typeof vordergrund === 'string' ? ausHex(vordergrund) : vordergrund)
  const b = leuchtdichte(typeof hintergrund === 'string' ? ausHex(hintergrund) : hintergrund)
  const hell = Math.max(a, b)
  const dunkel = Math.min(a, b)
  return (hell + 0.05) / (dunkel + 0.05)
}

/** Auf zwei Nachkommastellen, wie in der Dokumentation notiert. */
export function gerundet(wert: number): number {
  return Math.round(wert * 100) / 100
}

/* ---------------------------------------------------------------------------
   Bewertung
   --------------------------------------------------------------------------- */

export type Verwendung =
  /** Fließtext unter 18,66px bzw. unter 24px nicht fett → 4,5:1 (1.4.3) */
  | 'fliesstext'
  /** Große Schrift ab 24px oder ab 18,66px fett → 3:1 (1.4.3) */
  | 'grossschrift'
  /** Bedienelemente, Ränder, Zustandsanzeigen → 3:1 (1.4.11) */
  | 'ui'
  /** Rein dekorativ → keine Anforderung (1.4.3 Ausnahme) */
  | 'dekor'

export const SCHWELLE: Record<Verwendung, number> = {
  fliesstext: 4.5,
  grossschrift: 3,
  ui: 3,
  dekor: 0,
}

export function erfuellt(verhaeltnis: number, verwendung: Verwendung): boolean {
  return verhaeltnis >= SCHWELLE[verwendung]
}

/** "AAA" ab 7:1, "AA" ab 4,5:1, sonst die Einschränkung im Klartext. */
export function bewertung(verhaeltnis: number): string {
  if (verhaeltnis >= 7) return 'AAA'
  if (verhaeltnis >= 4.5) return 'AA'
  if (verhaeltnis >= 3) return 'nur Großschrift und UI'
  return 'unzureichend'
}
