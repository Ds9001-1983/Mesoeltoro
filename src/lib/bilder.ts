/**
 * Bildregister und Rechte-Gate.
 *
 * Das teuerste vorstellbare Projektrisiko ist, dass ein Foto live geht, an
 * dem die Rechte nicht geklärt sind — oder auf dem eine Person zu sehen ist,
 * die nie eingewilligt hat. Beides kostet mehr als die ganze Website.
 *
 * Deshalb ist es hier technisch unmöglich statt organisatorisch
 * unwahrscheinlich gemacht: `Bild.astro` nimmt einen Schlüssel aus dem
 * Register entgegen, niemals einen Dateipfad. Wer kein Register hat, hat
 * kein Bild.
 */

import { z } from 'astro/zod'

import registerRoh from '../../content/bildnachweise.json' with { type: 'json' }

const bildSchema = z
  .object({
    datei: z.string().min(1),
    motiv: z.string().min(1),
    alt: z
      .string()
      .min(15, 'Der Alternativtext ist zu kurz, um das Motiv zu beschreiben.')
      .refine(
        (wert) => !/^(bild|foto|grafik|image)\b/i.test(wert.trim()),
        'Der Alternativtext soll das Motiv beschreiben, nicht mit „Bild“ oder „Foto“ beginnen — das sagt der Screenreader ohnehin.',
      ),
    urheber: z.string().min(1),
    urheber_nachweis: z.boolean(),
    nachweis_fundstelle: z.string().min(1).nullable(),
    personen_abgebildet: z.boolean(),
    personen_einwilligung: z.boolean().nullable(),
    freigabe: z.boolean(),
    freigabe_datum: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .nullable(),
    verwendung: z.array(z.string()),
  })
  .superRefine((wert, kontext) => {
    if (wert.freigabe && !wert.urheber_nachweis) {
      kontext.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['freigabe'],
        message: `"${wert.datei}" ist freigegeben, aber der Rechtenachweis fehlt (urheber_nachweis: false).`,
      })
    }
    if (wert.freigabe && wert.personen_abgebildet && wert.personen_einwilligung !== true) {
      kontext.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['personen_einwilligung'],
        message:
          `"${wert.datei}" zeigt erkennbare Personen und ist freigegeben, aber es liegt keine ` +
          'dokumentierte Einwilligung vor (§ 22 KunstUrhG, Art. 6 Abs. 1 lit. a DSGVO).',
      })
    }
    if (wert.freigabe && !wert.freigabe_datum) {
      kontext.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['freigabe_datum'],
        message: `"${wert.datei}" ist freigegeben, aber ohne Datum. Wann wurde freigegeben?`,
      })
    }
  })

const registerSchema = z.object({
  sperrliste: z.array(z.string().min(1)),
  bilder: z.record(z.string(), bildSchema),
})

const ergebnis = registerSchema.safeParse(registerRoh)

if (!ergebnis.success) {
  const meldungen = ergebnis.error.issues
    .map((problem) => `  · content/bildnachweise.json → ${problem.path.join('.')}: ${problem.message}`)
    .join('\n')
  throw new Error(`Das Bildregister ist ungültig:\n${meldungen}`)
}

export const REGISTER = ergebnis.data.bilder
export const SPERRLISTE = ergebnis.data.sperrliste

export type Bildschluessel = keyof typeof REGISTER
export type Bildeintrag = (typeof REGISTER)[string]

/** Bilder, die tatsächlich ausgeliefert werden dürfen. */
export const FREIGEGEBEN = Object.entries(REGISTER).filter(([, eintrag]) => eintrag.freigabe)

/** Bilder, die auf einen Nachweis warten — Grundlage für docs/BILDRECHTE.md. */
export const OFFEN = Object.entries(REGISTER).filter(([, eintrag]) => !eintrag.freigabe)

/**
 * Holt einen Eintrag oder bricht mit einer erklärenden Meldung ab.
 *
 * Der Abbruch ist gewollt: Ein fehlender Registereintrag ist kein
 * Darstellungsproblem, sondern ein ungeklärtes Recht.
 */
export function hole(schluessel: string): Bildeintrag {
  const eintrag = REGISTER[schluessel]

  if (!eintrag) {
    throw new Error(
      `Kein Bild mit dem Schlüssel "${schluessel}" im Register.\n` +
        `  Bekannt sind: ${Object.keys(REGISTER).join(', ')}\n` +
        '  Neue Bilder werden in content/bildnachweise.json eingetragen — mit Urheber,\n' +
        '  Rechtenachweis und Alternativtext. Ein Dateipfad allein genügt nicht.',
    )
  }

  if (!eintrag.freigabe) {
    throw new Error(
      `Das Bild "${schluessel}" (${eintrag.datei}) ist nicht freigegeben.\n` +
        `  Urheber: ${eintrag.urheber} · Rechtenachweis: ${eintrag.urheber_nachweis ? 'liegt vor' : 'FEHLT'}` +
        (eintrag.personen_abgebildet
          ? ` · Personen abgebildet: ja, Einwilligung ${eintrag.personen_einwilligung ? 'liegt vor' : 'FEHLT'}`
          : '') +
        '\n  Solange die Rechtekette nicht dokumentiert ist, wird das Bild nicht ausgeliefert.\n' +
        '  Siehe docs/BILDRECHTE.md.',
    )
  }

  return eintrag
}

/** Prüft einen Dateinamen gegen die Sperrliste fremder Projekte. */
export function istGesperrt(dateiname: string): string | null {
  return SPERRLISTE.find((praefix) => dateiname.includes(praefix)) ?? null
}
