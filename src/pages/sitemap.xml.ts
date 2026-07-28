/**
 * Sitemap.
 *
 * Handgeschrieben statt per Integration: Nur so lässt sich sicherstellen,
 * dass gesperrte Routen — etwa /feiern-und-gruppen/, solange der Kunde die
 * Daten nicht geliefert hat — gar nicht erst auftauchen. Eine Integration
 * würde jede vorhandene Seite eintragen.
 */
import type { APIRoute } from 'astro'

import { sitemapRouten } from '../lib/navigation.ts'

export const GET: APIRoute = ({ site }) => {
  const basis = (site ?? new URL('https://meson-el-toro.de')).origin

  const eintraege = sitemapRouten
    .map(
      (route) =>
        `  <url>\n` +
        `    <loc>${basis}${route.pfad}</loc>\n` +
        `    <priority>${route.gewicht.toFixed(1)}</priority>\n` +
        `  </url>`,
    )
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${eintraege}
</urlset>
`

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
}
