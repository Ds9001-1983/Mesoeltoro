# Arbeitsregeln für dieses Projekt

Website der **Meson el Toro GmbH**, Waldbröl. Astro, statisch, ohne Backend.

Die ausführliche Begründung jeder Entscheidung steht in `docs/adr/`.
Die Kundendokumentation steht in `docs/UEBERGABE.md`.

---

## Die drei Regeln, die alles andere binden

**1. Keine einzige Anfrage an einen fremden Server.**
Keine Google Fonts, kein CDN, kein Maps-Embed, kein YouTube, kein Analytics,
kein Buchungs-Widget. Ohne Drittanfragen gibt es keinen Endgerätezugriff nach
§ 25 Abs. 1 TDDDG, also keine Einwilligungspflicht, also kein Cookie-Banner —
und damit auch nicht den häufigsten Barrierefreiheits-Fehlerherd überhaupt.
`scripts/pruefe-externe-requests.mjs` und `tests/inhalt/recht.spec.ts` setzen
das durch.

**2. Kein Text über bewegtem Bild.**
Schrift steht immer auf ruhiger Fläche. Damit ist WCAG 1.4.3 über Bewegtbild
strukturell erledigt statt mühsam gemessen. Das Passepartout im Hero ist keine
Designlaune, sondern die Umsetzung dieser Regel.

**3. Was nicht belegt ist, steht nicht auf der Seite.**
Werbeaussagen laufen über `content/claims.json`, Bilder über
`content/bildnachweise.json`. Beide sind Build-Gates, keine Dokumentation.

---

## Verbotsliste

| Verboten | Grund |
|----------|-------|
| `outline: none` ohne sichtbaren Ersatz | 2.4.7 |
| `animation`-Kurzschreibweise zusammen mit `animation-timeline` | Minifier falten beides zusammen, die Deklaration wird ungültig und der Effekt läuft gar nicht. Nur Langformen. Nachgemessen am 28.07.2026. |
| `role="group"` oder `role="list"` auf einer `<ol>`/`<ul>` | Überschreibt die implizite Listenrolle, die `<li>` verwaisen (1.3.1). Fokussierbare Scrollregion außen herum, Liste innen. |
| Buchstabenweises Aufteilen von Überschriften, Preisen, Adressen | JAWS liest dann gar nichts vor, Strg+F und Übersetzung brechen |
| Eigenes Scroll-Hijacking mit `position: fixed` + `transform` | Zerstört Tastaturbedienung, Browser-Suche und Fokusverfolgung |
| Akkordeon für Speisekarte oder häufige Fragen | Zugeklappter Text ist für Strg+F und Suchmaschinen unsichtbar |
| Ein Steuersatz im Sichttext der Karte | 7 % auf Speisen, 19 % auf Getränke — eine Zahl wäre für die halbe Karte falsch |
| `aggregateRating` oder Review-Markup | Erzeugt keine Sterne und verschärft § 5b Abs. 3 UWG |
| Bilder per Dateipfad einbinden | Nur über `Bild.astro` mit Registerschlüssel |

## Bewusst nicht gebaut

GSAP · Lenis · Custom-Cursor · Preloader · Barba.js · Ken Burns · Sound ·
Analytics · Consent-Banner · Formulare.

Jeweils mit Begründung in `docs/adr/`. Wer eines davon wieder einführen will,
liest zuerst die zugehörige Entscheidung — sie nimmt die naheliegenden
Gegenargumente vorweg.

---

## Sprache

**Code auf Deutsch.** Variablen, Funktionen, Dateinamen, Kommentare,
Fehlermeldungen. Das ist kein Selbstzweck: Der Kunde pflegt die Inhalte selbst
über github.dev, und eine Fehlermeldung wie
`ZodError: invalid_string at [0].varianten[1].preis` ist für ihn wertlos.

**Ansprache auf der Website: Sie.** Bewusst abweichend vom SUPERBRAND-Standard
— der gilt für die Agenturmarke, nicht für Kundenmarken.

**Commits und PRs auf Deutsch.** Kein `Co-Authored-By`-Trailer.

---

## Vor jedem Commit

```
pnpm pruefen      Typen, Einheitentests, Inhalte, Kontraste
pnpm build        baut und prüft danach Claims, Bildrechte, Fremdanfragen
pnpm test:e2e     117 Prüfungen im Browser, 4 Projekte
```

Neue Seite gebaut? Dann in `tests/routen.ts` eintragen — sonst wird sie
ungeprüft ausgeliefert.

Neue Farbe? Dann in `src/lib/farben.ts` eintragen, nicht nur in `tokens.css`.
Der Kontrastwächter vergleicht beide und rechnet die Kommentare nach.
