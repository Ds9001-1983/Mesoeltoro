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

**1a. Auftritt ist dunkel, Dokument ist hell.**
Die Seite hat zwei Flächen, und die Zuordnung ist keine Geschmacksfrage:
Hero, Kapitel, Bilder und die Glut stehen auf `--grund`. Speisekarte,
Chronik, Öffnungszeiten, Anfahrt, häufige Fragen und alle Rechtstexte stehen
auf `--kalk`. Wer eine neue Seite baut, fragt nicht „hell oder dunkel",
sondern „wird das gelesen oder angesehen".

Der Anlass war eine Zählung, kein Gefühl: Am 29.07.2026 waren 81 % der
Startseite und 93,5 % der Speisekarte blanke Grundfläche.
`tests/verhalten/flaechen.spec.ts` bricht bei über 70 %.

Umgeschaltet wird **ausschließlich** über `data-flaeche="hell"` bzw.
`"bordeaux"`. Eine Komponente, die `var(--gold)` oder `var(--creme)` direkt
setzt, ist damit kaputt — sie gehört auf `--akzent`, `--text`, `--text-leise`
und `--linie`.

**2. Kein Text über bewegtem Bild.**
Schrift steht immer auf ruhiger Fläche. Damit ist WCAG 1.4.3 über Bewegtbild
strukturell erledigt statt mühsam gemessen. Der Hero setzt die Mega-Typo auf
einfarbigen Grund und lässt den Bildstapel darüber enden — das ist keine
Layoutlaune, sondern die Umsetzung dieser Regel.
`tests/verhalten/hero-grund.spec.ts` misst sie nach.

**3. Über Werbeaussagen entscheidet der Auftraggeber, nicht der Code.**
Die Sperrliste in `content/claims.json` ist seit dem 29.07.2026 **leer** —
so entschieden. Der Wächter läuft weiter und ist mit einem Eintrag sofort
wieder scharf; `blockliste_bewusst_leer` unterscheidet die Entscheidung vom
Versehen. `entscheidungen` bleibt als Akte: was geprüft wurde, auf welcher
Grundlage, wann entschieden.

Bilder laufen unverändert über `content/bildnachweise.json` — dort ist das
Gate hart, weil es um fremde Rechte geht, nicht um eigene Aussagen.

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
| `--bordeaux` als Linie, Rand oder Schrift auf `--grund` | 1,90:1. Bordeaux ist Vollfläche, nie Kontur. Darauf trägt nur Elfenbein (9,20:1) |
| `--gold` als Fließtext auf `--bordeaux` | 4,13:1 — dort nur Großschrift und UI. Auf `--grund` dagegen 7,85:1 und uneingeschränkt |
| `--gold` irgendwo auf `--kalk` | 2,09:1. Auf heller Fläche ist der Akzent `--ochsenblut` (12,37:1) — dort und nur dort kommt das Markenrot vor |
| `--ochsenblut` auf `--grund` | 1,32:1. Umgekehrt genauso: Das Markenrot trägt ausschließlich auf heller Fläche |
| `var(--gold)` oder `var(--creme)` in einer Komponente | Komponenten stehen auf wechselnden Flächen. Immer `--akzent`, `--akzent-gross`, `--text`, `--text-leise`, `--linie` |
| Sekundärtext als Deckkraft statt als eigener Hexwert | Die Vorschau setzt `#ece0cc/50` — das sind 4,37:1 und verfehlt 4,5. Ein fester Ton ist nachrechenbar, eine Alpha-Angabe prüft niemand |
| Rasterzellen ohne `min-inline-size: 0` | Voreingestellt ist `min-width: auto`; eine einzige lange Zeile zieht dann die ganze Seite waagerecht (1.4.10) |
| Endlos laufende Bewegung ohne Pausetaste | 2.2.2. Genau daran scheitert die Vorschau mit Laufband und Glutpuls |
| Laufband unter 45 px/s | Bewegt sich messbar, wird aber als stehend wahrgenommen. Die erste Fassung lief mit 34 px/s und wurde genau so gemeldet |
| Scroll-Bereich unter 120 px Scrollweg | `entry`-Prozente sind Anteile der ELEMENTHÖHE, nicht der Fensterhöhe. Bei einer 1 px hohen Haarlinie ergab `entry 10%`–`entry 70%` genau 0,6 px: Die Animation lief und sprang von 0 auf 1. Das Ende gehört in `cover`-Prozent |
| Ein globaler `@keyframes`-Name ohne Komponentenpräfix | Astro scoped Klassen, aber keine Keyframes in `is:global`. `linie-zeichnen` war zweimal vergeben; die zuletzt geparste Fassung gewann dokumentweit und hatte keinen `from`-Schritt — Anfang gleich Ende, die Rubriklinie zeichnete sich nie. `scripts/pruefe-keyframes.mjs` bricht bei Doppelvergabe ab |
| `overflow` ≠ `visible` über einem Element mit `view()` | Macht den Kasten zum Scrollcontainer, gegen den die Zeitachse misst. Der Anschnitt stand dadurch bei konstant 63,6 % Fortschritt. Zeitachse benannt auf einem Vorfahren ohne overflow setzen |
| `animation-range` in `vh` zusammen mit `scroll(root)` | Absolute Offsets ab Seitenanfang. Der Anschnitt zog um und war danach 3000 px vor dem ersten Sichtkontakt durchgelaufen. Bereiche gehören relativ zum Element (`cover`-Prozent) |
| Zeitgesteuerte Animation ohne `:root[data-motion='full']` | Der Glutpunkt auf `/kontakt/` lief endlos und ließ sich durch nichts anhalten — 2.2.2. Dort gibt es keine Pausetaste, die ihn eingefroren hätte |
| `block-size` in `Bild.astro` ohne `:global()` | Astro hängt an jeden Selektorteil ein Scope-Attribut. `.bild img` wird dadurch (0,4,1) und überstimmt jeden Container. Folge: `object-fit: cover` hatte nichts zu beschneiden, sichtbar war überall der obere Rand der Vorlage |
| Vollbild aus einer Vorlage unter 2400 px, ohne `grossformat: true` | Ein Vollbild bei 1440 CSS-px fordert auf Retina 2880 an. `tests/unit/bildaufloesung.test.ts` bricht sonst |
| Spanisch ohne `lang="es"` | 3.1.2. Eine deutsche Sprachausgabe spricht „La Parrilla" sonst deutsch aus |
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

## Die acht Signature Moves

| # | Move | Ort |
|---|------|-----|
| 1 | Der Anschnitt — gerissene Masken über mehreren Bildebenen | Kapitel III |
| 2 | Die Rubrik — römische Ziffer, spanische Zeile, Überschrift zieht auf | I–VI |
| 3 | Die Glut — WebGL-Fragment-Shader (OGL) | Kapitel III, genau einmal |
| 4 | Der Küchenpass — echter Öffnungsstatus | Kapitel VI, Kontakt |
| 5 | Der Satz der Karte — Leader-Linie zeichnet sich | Speisekarte, Kapitel II |
| 6 | Das Laufband — Begriffsband mit Pausetaste, 58 px/s | zwischen Vorspann und I |
| 7 | Das Papier — gerechnete Faserkachel + `@view-transition` | global |
| 8 | Das Bildband — das einzige Bild über die volle Breite | zwischen IV und V |

Der frühere Move „Der Temperaturwechsel“ hieß so, weil er zwischen zwei
Farbtemperaturen wechselte. Er ist am 29.07.2026 vormittags entfallen, als
die Seite durchgehend dunkel wurde — und nachmittags in anderer Form
zurückgekehrt: **Der Flächenwechsel** trennt jetzt Auftritt von Dokument
(Regel 1a). Er zählt nicht als neunter Move, weil er kein Effekt ist,
sondern die Gliederung der Seite.

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

**Spanisch ist Rubriksprache, nie Information.** Kategorien, Kapitel und
Seitenköpfe tragen eine spanische Zeile über der deutschen. Preise, Allergene,
Öffnungszeiten und Rechtstexte bleiben deutsch — wer die Karte liest, muss sie
verstehen. Jede spanische Zeichenkette bekommt `lang="es"`.

**Die Seite ist dunkel, aber nicht ununterbrochen** (`--grund: #14110D`).
Akzent dort ist Gold `#C9A24B` (7,85:1), Fließtext Creme `#ECE0CC` (14,43:1).

Auf der hellen Fläche `--kalk: #F4EFE6` gilt die gespiegelte Palette:
Fließtext Espresso `#2B2521` (13,20:1), Akzent das echte Markenrot
Ochsenblut `#551213` (12,37:1). Auf dem dunklen Grund stünde es bei 1,32:1 —
die Hausfarbe kommt deshalb genau dort vor, wo sie trägt, und nirgends sonst.
Bordeaux `#7B2233` bleibt Vollfläche, nie Kontur.
Begründung in `docs/adr/0009-dunkle-gestaltung.md`.

Wer eine Farbe anfasst, ändert sie in `src/lib/farben.ts` **und** `tokens.css`
— der Kontrastwächter vergleicht beide und rechnet jeden Kommentar nach.

**Commits und PRs auf Deutsch.** Kein `Co-Authored-By`-Trailer.

---

## Vor jedem Commit

```
pnpm pruefen      Typen, 101 Einheitentests, Inhalte, Kontraste
pnpm build        baut und prüft danach Claims, Bildrechte, Fremdanfragen, Keyframes
pnpm test:e2e     311 Prüfungen im Browser, 4 Projekte
```

Bild geändert? `pnpm bilder` erzeugt die Ableitungen neu.
Papierkorn geändert? `pnpm korn`. Beide Ergebnisse werden eingecheckt.

Am Hero etwas verschoben? `tests/verhalten/hero-grund.spec.ts` misst den
tatsächlich gerenderten Kontrast hinter jedem Textknoten — Bildpixel unter
Schrift brechen den Lauf.

Neue Seite gebaut? Dann in `tests/routen.ts` eintragen — sonst wird sie
ungeprüft ausgeliefert.

Neue Farbe? Dann in `src/lib/farben.ts` eintragen, nicht nur in `tokens.css`.
Der Kontrastwächter vergleicht beide und rechnet die Kommentare nach.
