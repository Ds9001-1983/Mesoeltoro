/**
 * Die Routenliste für alle Tests — eine Quelle.
 *
 * Wer eine Seite hinzufügt und sie hier vergisst, hat sie ungeprüft
 * ausgeliefert. Deshalb prüft tests/inhalt/routen-vollstaendig.spec.ts
 * zusätzlich gegen die Sitemap.
 */
export const ROUTEN = [
  '/',
  '/speisekarte/',
  '/philosophie/',
  '/weinfachhandel/',
  '/kontakt/',
  '/impressum/',
  '/datenschutz/',
  '/barrierefreiheit/',
  '/bildnachweise/',
] as const

export type Route = (typeof ROUTEN)[number]
