/**
 * Speisekarte: laden, validieren, aufbereiten.
 *
 * Die Karte ist die rechtlich heikelste Seite des Projekts. Deshalb liegt
 * hier mehr Prüflogik als irgendwo sonst:
 *
 *  - Preise sind Zeichenketten im deutschen Format ("22,00"), nie Zahlen.
 *    22.5 würde als "22,5" gerendert; 22,50 ist aber die einzige zulässige
 *    Schreibweise eines Endpreises.
 *  - Allergen- und Zusatzstoffcodes sind Aufzählungen, kein Freitext.
 *  - kennzeichnung_status unterscheidet "geprüft, nichts enthalten" von
 *    "noch nicht erhoben". Genau diese Zweideutigkeit erzeugt sonst den
 *    Verstoß gegen Art. 44 LMIV.
 */

import { z } from 'astro/zod'

import allergeneRoh from '../../content/kataloge/allergene.json' with { type: 'json' }
import zusatzstoffeRoh from '../../content/kataloge/zusatzstoffe.json' with { type: 'json' }
import metaRoh from '../../content/speisekarte/_meta.json' with { type: 'json' }
import vorspeisen from '../../content/speisekarte/01-vorspeisen.json' with { type: 'json' }
import steaks from '../../content/speisekarte/02-steaks.json' with { type: 'json' }
import fleischFisch from '../../content/speisekarte/03-fleisch-fisch.json' with { type: 'json' }
import vegetarisch from '../../content/speisekarte/04-vegetarisch.json' with { type: 'json' }
import beilagen from '../../content/speisekarte/05-beilagen.json' with { type: 'json' }
import desserts from '../../content/speisekarte/06-desserts.json' with { type: 'json' }

/* --- Kataloge -------------------------------------------------------------- */

const katalogSchema = z.object({
  art: z.string(),
  eintraege: z
    .array(
      z.object({
        code: z.string().min(1),
        kurz: z.string().min(1),
        voll: z.string().min(1),
      }),
    )
    .min(1),
})

export const ALLERGENE = katalogSchema.parse(allergeneRoh).eintraege
export const ZUSATZSTOFFE = katalogSchema.parse(zusatzstoffeRoh).eintraege

const ALLERGEN_CODES = ALLERGENE.map((eintrag) => eintrag.code)
const ZUSATZSTOFF_CODES = ZUSATZSTOFFE.map((eintrag) => eintrag.code)

export type Katalogeintrag = (typeof ALLERGENE)[number]

/* --- Gerichte -------------------------------------------------------------- */

/**
 * Endpreis im deutschen Format. Genau zwei Nachkommastellen, Komma als
 * Trenner, kein Währungszeichen (das setzt die Darstellung).
 */
const preis = z
  .string()
  .regex(
    /^\d{1,3},\d{2}$/,
    'Preis muss im Format "22,00" stehen: Komma, genau zwei Nachkommastellen, ohne Euro-Zeichen.',
  )

const variante = z.object({
  bezeichnung: z.string().min(1).nullable(),
  preis,
})

const gericht = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/, 'Nur Kleinbuchstaben, Ziffern und Bindestriche.'),
    name: z.string().min(1),
    beschreibung: z.string().min(1).nullable(),
    varianten: z.array(variante).min(1, 'Jedes Gericht braucht mindestens einen Preis.'),
    allergene: z.array(
      z.enum(ALLERGEN_CODES as [string, ...string[]], {
        message: `Unbekannter Allergen-Code. Zulässig sind ${ALLERGEN_CODES.join(', ')} — siehe content/kataloge/allergene.json.`,
      }),
    ),
    zusatzstoffe: z.array(
      z.enum(ZUSATZSTOFF_CODES as [string, ...string[]], {
        message: `Unbekannter Zusatzstoff-Code. Zulässig sind ${ZUSATZSTOFF_CODES.join(', ')} — siehe content/kataloge/zusatzstoffe.json.`,
      }),
    ),
    kennzeichnung_status: z.enum(['geprueft', 'ausstehend']),
    kennzeichnung_stand: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .nullable(),
    kennzeichnung_quelle: z.string().min(1).nullable(),
    bestaetigt_von: z.string().min(1).nullable(),
    vegetarisch: z.boolean(),
    vegan: z.boolean(),
    verfuegbar: z.boolean(),
    hinweis: z.string().min(1).nullable(),
  })
  .superRefine((wert, kontext) => {
    // Wer "geprüft" behauptet, muss sagen wer, wann und woher. Ohne das ist
    // die Angabe im Streitfall wertlos.
    if (wert.kennzeichnung_status === 'geprueft') {
      for (const feld of ['kennzeichnung_stand', 'kennzeichnung_quelle', 'bestaetigt_von'] as const) {
        if (!wert[feld]) {
          kontext.addIssue({
            code: z.ZodIssueCode.custom,
            path: [feld],
            message:
              `"${wert.name}" ist als geprüft gekennzeichnet, aber ${feld} fehlt. ` +
              'Eine geprüfte Kennzeichnung braucht Datum, Quelle und verantwortliche Person.',
          })
        }
      }
    }

    // Vegan ohne vegetarisch ist ein Datenfehler, kein Sonderfall.
    if (wert.vegan && !wert.vegetarisch) {
      kontext.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['vegetarisch'],
        message: `"${wert.name}" ist als vegan, aber nicht als vegetarisch markiert.`,
      })
    }

    // Ein als vegetarisch geführtes Gericht darf kein Fisch-Allergen tragen.
    if (wert.vegetarisch && wert.allergene.includes('D')) {
      kontext.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['allergene'],
        message: `"${wert.name}" ist als vegetarisch markiert, enthält aber Fisch (Allergen D).`,
      })
    }
  })

const kategorie = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  titel: z.string().min(1),
  /**
   * Spanische Rubrik über der deutschen Überschrift — „Entrantes“ über
   * „Vorspeisen“. Rein typografisch: Sie trägt nie Information, die nicht
   * auch auf Deutsch dasteht. Wer die Karte liest, muss sie verstehen.
   *
   * Pflichtfeld, damit eine neue Kategorie nicht stumm ohne Rubrik erscheint.
   */
  spanisch: z.string().min(1),
  einleitung: z.string().min(1).nullable(),
  reihenfolge: z.number().int().positive(),
  steuerkategorie: z.enum(['speise', 'getraenk']),
  gerichte: z.array(gericht).min(1),
})

const meta = z.object({
  stand: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  preishinweis: z.string().min(1),
  kennzeichnungshinweis: z.string().min(1),
  rueckfrage: z.string().min(1),
  kreuzkontamination: z.string().min(1),
})

/* --- Zusammenbau ----------------------------------------------------------- */

/** Dateiname mitführen, damit Fehlermeldungen die echte Datei nennen. */
const ROHDATEN: readonly { datei: string; inhalt: unknown }[] = [
  { datei: 'content/speisekarte/01-vorspeisen.json', inhalt: vorspeisen },
  { datei: 'content/speisekarte/02-steaks.json', inhalt: steaks },
  { datei: 'content/speisekarte/03-fleisch-fisch.json', inhalt: fleischFisch },
  { datei: 'content/speisekarte/04-vegetarisch.json', inhalt: vegetarisch },
  { datei: 'content/speisekarte/05-beilagen.json', inhalt: beilagen },
  { datei: 'content/speisekarte/06-desserts.json', inhalt: desserts },
]

function pruefe<T>(schema: z.ZodType<T>, wert: unknown, herkunft: string): T {
  const ergebnis = schema.safeParse(wert)
  if (!ergebnis.success) {
    const meldungen = ergebnis.error.issues
      .map((problem) => `  · ${herkunft} → ${problem.path.join('.')}: ${problem.message}`)
      .join('\n')
    throw new Error(`Die Speisekarte ist ungültig:\n${meldungen}`)
  }
  return ergebnis.data
}

export const KARTE_META = pruefe(meta, metaRoh, 'content/speisekarte/_meta.json')

export const KATEGORIEN = ROHDATEN.map((roh) => pruefe(kategorie, roh.inhalt, roh.datei))
  .filter((kat) => kat.gerichte.some((g) => g.verfuegbar))
  .sort((a, b) => a.reihenfolge - b.reihenfolge)
  .map((kat) => ({ ...kat, gerichte: kat.gerichte.filter((g) => g.verfuegbar) }))

export type Kategorie = (typeof KATEGORIEN)[number]
export type Gericht = Kategorie['gerichte'][number]

/* --- Abgeleitete Zustände -------------------------------------------------- */

/**
 * Solange auch nur ein Gericht "ausstehend" trägt, wird über der Karte ein
 * Hinweisblock eingeblendet. Er ist nicht abschaltbar — das ist der Sinn.
 *
 * Rechtlicher Hintergrund: Art. 44 LMIV verlangt die Information über
 * Allergene bei loser Ware. Zulässig ist auch die mündliche Auskunft, sofern
 * auf sie hingewiesen wird und eine schriftliche Dokumentation im Betrieb
 * vorliegt. Genau das leistet dieser Block — eine Karte, die Vollständigkeit
 * suggeriert und keine hat, leistet es nicht.
 */
export const uebergangshinweisAktiv = KATEGORIEN.some((kat) =>
  kat.gerichte.some((g) => g.kennzeichnung_status === 'ausstehend'),
)

export const anzahlGerichte = KATEGORIEN.reduce((summe, kat) => summe + kat.gerichte.length, 0)

/** Nur die Codes, die tatsächlich auf der Karte vorkommen. */
export function verwendeteCodes(): { allergene: Set<string>; zusatzstoffe: Set<string> } {
  const allergene = new Set<string>()
  const zusatzstoffe = new Set<string>()
  for (const kat of KATEGORIEN) {
    for (const g of kat.gerichte) {
      g.allergene.forEach((code) => allergene.add(code))
      g.zusatzstoffe.forEach((code) => zusatzstoffe.add(code))
    }
  }
  return { allergene, zusatzstoffe }
}

/* --- Darstellung ----------------------------------------------------------- */

/** "200 g · 22,00 € — 300 g · 33,00 €" bzw. "18,00 €" */
export function preiszeile(gericht: Gericht): string {
  return gericht.varianten
    .map((v) => (v.bezeichnung ? `${v.bezeichnung} · ${v.preis} €` : `${v.preis} €`))
    .join(' — ')
}

export function allergenEintrag(code: string): Katalogeintrag | undefined {
  return ALLERGENE.find((eintrag) => eintrag.code === code)
}

export function zusatzstoffEintrag(code: string): Katalogeintrag | undefined {
  return ZUSATZSTOFFE.find((eintrag) => eintrag.code === code)
}
