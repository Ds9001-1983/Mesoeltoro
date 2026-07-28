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
strukturell erledigt statt mühsam gemessen. Der Hero setzt die Mega-Typo auf
reinen Kalk und beginnt den Bildstapel erst darunter — das ist keine
Layoutlaune, sondern die Umsetzung dieser Regel.

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
| `cursor: none` | Der eigene Zeiger ist Zugabe, kein Ersatz. Wer den System-Cursor ausblendet, nimmt Nutzern mit vergrößertem Zeiger oder Bildschirmvergrößerer die Orientierung. Ein Test sucht die Deklaration im ganzen Dokument. |
| Eine Ladeanzeige mit künstlicher Mindestdauer | *Das* wäre der 2.2.1-Verstoß, den man dem Preloader fälschlich pauschal unterstellt. Fertig ist fertig. |
| Alternativtexte aus dem Dateinamen ableiten | Am 28.07.2026 beschrieb der Eintrag `gastraum` einen Gastraum und zeigte ein Steak — die Datei hieß `header_restaurant_steak.jpg`. Alt-Texte werden am geöffneten Bild geschrieben. |
| Deckkraft des Papierkorns über 4 % | Bei 10 % fällt Messing auf Kalk unter 3:1 und die Jahreszahlen wären ein 1.4.3-Verstoß. Die Rechnung steht in `basis.css`. |

## Bewusst nicht gebaut

GSAP · Lenis · Barba.js · Three.js · Ken Burns · Sound · Analytics ·
Consent-Banner · Formulare · jede Form von KI-Bild oder KI-Video.

Jeweils mit Begründung in `docs/adr/`. Wer eines davon wieder einführen will,
liest zuerst die zugehörige Entscheidung — sie nimmt die naheliegenden
Gegenargumente vorweg.

**Custom-Cursor und Preloader standen bis zum 28.07.2026 auf dieser Liste.**
Sie sind jetzt gebaut („Der Zeiger", „Der Vorhang"). Der Grund für die
Streichung war teils falsch: WCAG 2.2.1 zielt auf Fristen, die Inhalt
entziehen, nicht auf Ladeanzeigen. Die Auflagen, unter denen beide zulässig
sind, stehen in `docs/adr/0008-zeiger-und-vorhang.md` und sind im Code
durchgesetzt, nicht bloß dokumentiert.

## Die sechs Signature Moves

| # | Move | Ort |
|---|------|-----|
| 1 | Der Anschnitt — drei Bildebenen, zwei gerissene Masken | Startseite, Hero |
| 2 | Der Temperaturwechsel — `clip-path: inset()` im textfreien Korridor | vor dem Glut-Kapitel |
| 3 | Die Glut — WebGL-Fragment-Shader (OGL) | Glut-Kapitel, genau einmal |
| 4 | Der Küchenpass — echter Öffnungsstatus | Startseite, Kontakt |
| 5 | Der Satz der Karte — Leader-Linie zeichnet sich | Speisekarte |
| 6 | Das Papier — gerechnete Faserkachel + `@view-transition` | global |

Wer einen siebten hinzufügt, streicht einen anderen. Der Skill setzt die
Obergrenze bei sieben, und sie ist gut begründet: Ab da wird Handschrift zu
Lärm.

---

## Sprache

**Code auf Deutsch.** Variablen, Funktionen, Dateinamen, Kommentare,
Fehlermeldungen. Das ist kein Selbstzweck: Der Kunde pflegt die Inhalte selbst
über github.dev, und eine Fehlermeldung wie
`ZodError: invalid_string at [0].varianten[1].preis` ist für ihn wertlos.

**Ansprache auf der Website: Sie.** Bewusst abweichend vom SUPERBRAND-Standard
— der gilt für die Agenturmarke, nicht für Kundenmarken.

**Markenrot ist `#551213`**, ausgelesen aus den Logodateien des Hauses. Der
frühere Wert `#B3372B` war eine Erfindung der Entwurfsphase. Wer die Farbe
anfasst, ändert sie in `src/lib/farben.ts` **und** `tokens.css` — der
Kontrastwächter vergleicht beide und rechnet jeden Kommentar nach.

**Commits und PRs auf Deutsch.** Kein `Co-Authored-By`-Trailer.

---

## Vor jedem Commit

```
pnpm pruefen      Typen, 72 Einheitentests, Inhalte, Kontraste
pnpm build        baut und prüft danach Claims, Bildrechte, Fremdanfragen
pnpm test:e2e     213 Prüfungen im Browser, 4 Projekte
```

Bild geändert? `pnpm bilder` erzeugt die Ableitungen neu.
Papierkorn geändert? `pnpm korn`. Beide Ergebnisse werden eingecheckt.

Neue Seite gebaut? Dann in `tests/routen.ts` eintragen — sonst wird sie
ungeprüft ausgeliefert.

Neue Farbe? Dann in `src/lib/farben.ts` eintragen, nicht nur in `tokens.css`.
Der Kontrastwächter vergleicht beide und rechnet die Kommentare nach.
