import { glob } from 'astro/loaders'
import { defineCollection, z } from 'astro:content'

/**
 * Die Fließtexte liegen bewusst außerhalb von src/ in content/texte/.
 *
 * Grund: Wer die Website pflegt, soll nicht durch Quellcode navigieren
 * müssen. content/ enthält ausschließlich Inhalte — Markdown und JSON,
 * beides über github.dev im Browser bearbeitbar, ohne Installation.
 *
 * Der glob-Loader des Content Layer holt sie von dort. Ein Import direkt
 * aus src/ würde diese Trennung wieder einreißen.
 */
const texte = defineCollection({
  loader: glob({ pattern: '*.md', base: './content/texte' }),
  schema: z.object({
    titel: z.string().min(1),
    beschreibung: z.string().min(1),
    /** Erscheint als Vorspann über dem Text, optional. */
    vorspann: z.string().min(1).optional(),
    /** Datum der letzten inhaltlichen Prüfung, JJJJ-MM-TT. */
    stand: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
})

export const collections = { texte }
