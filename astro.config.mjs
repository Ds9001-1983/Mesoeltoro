// @ts-check
import { defineConfig } from 'astro/config'

// Grundentscheidungen, die den gesamten Bauplan binden:
//
//  - output 'static'          Es gibt keinen Server, keine Formulare, keine Datenbank.
//  - trailingSlash 'always'   Die Altseite lief unter /speisekarte/ mit Schrägstrich.
//    + build.format           Ein Wechsel auf /speisekarte würde die bestehende Sichtbarkeit
//      'directory'            zerstören, sobald eine einzige Weiterleitung fehlt.
//  - prefetch aus             Prefetch lädt Seiten spekulativ nach; das ist bei sieben
//                             Seiten sinnlos und erzeugt Requests, die niemand ausgelöst hat.
//
// Was hier NICHT steht, ist Absicht: keine Integrationen, die externe Requests
// erzeugen könnten, kein CDN, kein Analytics-Adapter. Siehe docs/adr/0001-astro-statisch.md.

export default defineConfig({
  site: 'https://meson-el-toro.de',
  output: 'static',
  trailingSlash: 'always',
  build: {
    format: 'directory',
    // Styles gebündelt statt inline — hält die CSP ohne 'unsafe-inline' erfüllbar.
    inlineStylesheets: 'never',
  },
  prefetch: false,
  compressHTML: true,
  vite: {
    build: {
      // Kein Inlining — weder von Skripten noch von Assets.
      //
      // Ein inline eingebettetes <script> zwingt die Content-Security-Policy zu
      // 'unsafe-inline' oder zu einem Hash, der sich bei jeder Änderung ändert.
      // Externe Dateien lassen sich mit 'self' abdecken und sind zusätzlich
      // einzeln cachebar. Die paar eingesparten Bytes sind das nicht wert.
      assetsInlineLimit: 0,

      // lightningcss statt esbuild für CSS.
      //
      // Grund ist konkret und nachgemessen: esbuild faltet
      //   animation: name linear both;  +  animation-timeline: view();
      // zu   animation: linear both name view()   zusammen. Die
      // animation-Kurzschreibweise nimmt laut Spezifikation aber keinen
      // Timeline-Wert — die Deklaration wird dadurch als Ganzes ungültig und
      // vom Browser verworfen. Ergebnis: animation-name = none, die
      // scroll-getriebene Bewegung läuft überhaupt nicht.
      // lightningcss lässt die Longhands stehen.
      cssMinify: 'lightningcss',
    },
    css: {
      lightningcss: {
        // Ohne Zielangabe würde lightningcss moderne Syntax zurückbauen und
        // dabei dieselbe Faltung erzeugen, die wir gerade vermeiden wollen.
        targets: { chrome: 120 << 16, firefox: 120 << 16, safari: 17 << 16 },
      },
    },
  },
  image: {
    // Bilder werden ausschließlich über scripts/bilder-aufbereiten.mjs erzeugt und
    // über content/bildnachweise.json freigegeben. Keine Remote-Quellen, niemals.
    remotePatterns: [],
  },
  devToolbar: {
    enabled: false,
  },
})
