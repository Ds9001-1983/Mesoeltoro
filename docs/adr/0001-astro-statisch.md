# 0001 — Astro, statisch ausgeliefert

**Entschieden:** 28.07.2026 · **Status:** angenommen

## Lage

Sieben inhaltliche Seiten, kein Shop, keine Anmeldung, kein Backend. Die
Reservierung läuft über das Telefon. Die Vorgängerseite lief auf WordPress mit
Elementor.

## Entscheidung

Astro mit `output: 'static'`. Kein CMS, keine Datenbank, kein Server.

## Warum nicht WordPress behalten

Ein CMS ist eine dauerhafte Angriffs- und Update-Fläche. Die alte Installation
lieferte über Jetpack sämtliche Bilder von einem US-Server aus — ohne
Einwilligung, also entgegen § 25 TDDDG. Solche Nebenwirkungen entstehen bei
einem Plugin-System immer wieder neu, weil ein Plugin-Update Verhalten
mitbringt, das niemand bestellt hat.

Eine statisch ausgelieferte Seite kann das strukturell nicht.

## Warum nicht Next.js

Next.js kann Server Actions, Route Handler, Middleware. Nichts davon wird hier
gebraucht. Astro liefert dagegen standardmäßig 0 KB JavaScript pro Seite und
lädt Skripte nur pro Insel — der direkteste Hebel auf Ladezeit und
Reaktionsfähigkeit. Die Startseite kommt so auf 17,6 KB JavaScript gzip, die
Speisekarte auf 2,2 KB.

## Preis

Der Kunde kann Inhalte nicht über eine Weboberfläche pflegen. Aufgefangen
durch: Inhalte als JSON und Markdown unter `content/`, mit JSON-Schema für
Autovervollständigung, bearbeitbar über github.dev im Browser ohne
Installation. Siehe `docs/UEBERGABE.md`.
