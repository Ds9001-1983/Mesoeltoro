/**
 * Laden und Validieren der Stammdaten.
 *
 * Grundsatz: Was hier nicht durchkommt, geht nicht live. Die Validierung
 * läuft zur Bauzeit, nicht im Browser — ein Tippfehler in restaurant.json
 * bricht den Build, statt eine falsche Öffnungszeit auszuliefern.
 */

import { z } from 'astro/zod'

import restaurantRoh from '../../content/restaurant.json' with { type: 'json' }
import type { ZeitenKonfiguration } from './zeiten.ts'

const uhrzeit = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Uhrzeit muss im Format HH:MM stehen, z. B. "18:00".')

const zeitraum = z
  .tuple([uhrzeit, uhrzeit])
  .refine(([von, bis]) => von < bis, 'Der Beginn muss vor dem Ende liegen.')

const tagesplan = z.array(zeitraum).refine(
  (zeiten) =>
    zeiten.every((aktuell, index) => index === 0 || (zeiten[index - 1]?.[1] ?? '') <= aktuell[0]),
  'Öffnungszeiträume eines Tages müssen aufsteigend sortiert sein und dürfen sich nicht überlappen.',
)

const schliessung = z.object({
  von: z.string().regex(/^(\d{4}-)?\d{2}-\d{2}$/, 'Format: "12-24" oder "2026-12-24".'),
  bis: z.string().regex(/^(\d{4}-)?\d{2}-\d{2}$/, 'Format: "12-24" oder "2026-12-24".'),
  grund: z.string().min(1),
  banner: z.boolean().optional(),
})

const restaurantSchema = z.object({
  $schema: z.string().optional(),

  name: z.string().min(1),
  name_lang: z.string().min(1),
  beschreibung: z.string().min(1),

  adresse: z.object({
    strasse: z.string().min(1),
    plz: z.string().regex(/^\d{5}$/),
    ort: z.string().min(1),
    land: z.string().length(2),
    geo: z.object({ breite: z.number(), laenge: z.number() }),
  }),

  parken: z.object({
    strasse: z.string().min(1),
    plz: z.string().regex(/^\d{5}$/),
    ort: z.string().min(1),
    hinweis: z.string().min(1),
  }),

  // E.164 für tel:-Links und JSON-LD, Anzeigeform für Menschen.
  telefon_e164: z.string().regex(/^\+\d{7,15}$/, 'Telefonnummer muss im Format +4922914347 stehen.'),
  telefon_anzeige: z.string().min(1),
  email: z.string().email(),

  zeitzone: z.string().min(1),

  regulaer: z.object({
    montag: tagesplan,
    dienstag: tagesplan,
    mittwoch: tagesplan,
    donnerstag: tagesplan,
    freitag: tagesplan,
    samstag: tagesplan,
    sonntag: tagesplan,
  }),
  ruhetage_text: z.string().min(1),

  schliessungen_wiederkehrend: z.array(schliessung),
  schliessungen_einmalig: z.array(schliessung),

  geprueft_bis: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),

  zahlen: z.object({
    gegruendet: z.number().int(),
    mitarbeiter: z.number().int().positive(),
  }),

  // Pflichtangaben nach § 5 DDG. Fehlt eine davon, ist das Impressum
  // unvollständig — deshalb sind es harte Pflichtfelder, keine optionalen.
  rechtsform: z.object({
    firma: z.string().min(1),
    vertreten_durch: z.string().min(1),
    registergericht: z.string().min(1),
    hrb: z.string().min(1),
    ust_id: z.string().min(1),
    bestaetigt_vom_kunden: z.boolean(),
  }),

  // Pflicht nach § 5b Abs. 3 UWG, sobald irgendwo eine Bewertung steht.
  bewertungen_pruefhinweis: z.string().min(1),

  glut_shader_aktiv: z.boolean(),
})

const ergebnis = restaurantSchema.safeParse(restaurantRoh)

if (!ergebnis.success) {
  const meldungen = ergebnis.error.issues
    .map((problem) => `  · content/restaurant.json → ${problem.path.join('.')}: ${problem.message}`)
    .join('\n')
  throw new Error(`Die Stammdaten sind ungültig:\n${meldungen}`)
}

export const restaurant = ergebnis.data
export type Restaurant = typeof restaurant

/** Genau die Teilmenge, die src/lib/zeiten.ts braucht. */
export const zeitenKonfiguration: ZeitenKonfiguration = {
  zeitzone: restaurant.zeitzone,
  regulaer: restaurant.regulaer,
  schliessungen_wiederkehrend: restaurant.schliessungen_wiederkehrend,
  schliessungen_einmalig: restaurant.schliessungen_einmalig,
}

/** "Brölbahnstraße 71, 51545 Waldbröl" */
export const adresseEinzeilig = `${restaurant.adresse.strasse}, ${restaurant.adresse.plz} ${restaurant.adresse.ort}`
