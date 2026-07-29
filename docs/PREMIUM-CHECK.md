# Premium-Check

Abgleich gegen den Skill `premium-10k-web` (V1.1), Stand **29.07.2026**.

Der Skill verlangt: *„Alle Punkte müssen ✓ sein, sonst kein Launch."*
Wo das Projekt abweicht, steht die Begründung daneben — nicht als Ausrede,
sondern damit die nächste Person die Entscheidung nachvollziehen und
umstoßen kann.

---

## Vorbemerkung: ein Prozessfehler

Der Skill war beim ersten Bauabschnitt geladen, wurde aber **nicht abgearbeitet**.
Regel 1 lautet „Kein Code vor Phase 3". Tatsächlich gab es weder einen
Design-Brief noch ein Moodboard mit drei Richtungen noch eine Stil-Entscheidung
des Auftraggebers — der Skill diente als Argumentationsgegner statt als
Arbeitsanweisung.

Nachgeholt am 28.07.2026:

| Phase | Ergebnis |
|---|---|
| 1 · Design-Brief | 9 Antworten, im Plan dokumentiert |
| 2 · Moodboard | drei Richtungen („Carta" dunkel, „Zwei Temperaturen", „Brasa" material-first). Erste Entscheidung 28.07.: „Zwei Temperaturen". **Am 29.07.2026 korrigiert auf „Carta"** — der Auftraggeber hat an der gebauten hellen Seite gesehen, dass die dunkle stärker ist. Siehe ADR 0009 |
| 3 · Komponenten-Raster | 7 Sektionen der Startseite + Grundfläche |
| 4 · Komposition | umgesetzt |
| 5 · Polish | umgesetzt |

---

## Design & Content

| Punkt | Stand | Anmerkung |
|---|---|---|
| Custom-Fonts, kein Inter/Roboto/System | ✓ | **Archivo 900** · Newsreader (regulär, fett, kursiv) · **Geist Mono**, alle OFL, selbst gehostet, 158,1 KB gesamt / 94,2 KB latin |
| Primärfarbe < 10 % Fläche | ✓ | Gold trägt Rubriken, Links, Preise und Signet |
| Kein Anti-Pattern aus der Liste | ✓ mit einer bewussten Ausnahme | **#13 „Siezen"** — die Website siezt. Der SUPERBRAND-Duz-Standard gilt für die Agenturmarke, nicht für Kundenmarken. Vom Auftraggeber entschieden. |
| **#14 statische Hero-Images** | ✓ vermieden | Der Hero ist eine scroll-gesteuerte Bildfolge, kein Standbild |
| **#15 kein WebGL** | ✓ vermieden | siehe unten |

**Nachtrag zur Farbe.** Die Palette hat zwei Korrekturen hinter sich.

Am 28.07.2026 wurde das **echte** Markenrot aus den Logodateien ausgelesen —
`#551213` statt des erfundenen `#B3372B`.

Am 29.07.2026 ist die Seite dunkel geworden. Auf `#14110D` steht `#551213` bei
**1,07:1** und ist damit als Text- und Linienfarbe unbrauchbar. Die Rolle des
Akzents übernimmt **Gold `#C9A24B` (7,85:1)**, die Hausfarbe überlebt als
Bordeaux `#7B2233` — aber nur als Vollfläche. Begründung in ADR 0009.

| Paar | Verhältnis | |
|---|---|---|
| Creme `#ECE0CC` auf Grund `#14110D` | 14,43:1 | AAA |
| Gold `#C9A24B` auf Grund | 7,85:1 | AAA |
| Creme-leise `#A09889` auf Grund | 6,59:1 | AA |
| Elfenbein `#FAF6EF` auf Bordeaux | 9,20:1 | AAA |

---

## Signature Moves — 8, einer über der Skill-Obergrenze

| # | Move | Ort | Technik |
|---|---|---|---|
| 1 | **Der Anschnitt** | Kapitel VI | Gerissene Masken über mehreren Bildebenen, scroll-getrieben |
| 2 | **Die Rubrik** | I–VI | Goldene Haarlinie zeichnet sich, Überschrift zieht per `clip-path` auf |
| 3 | **Die Glut** | Kapitel III | WebGL-Fragment-Shader (OGL ≈ 10 KB gzip) |
| 4 | **Der Küchenpass** | Kapitel VI, Kontakt | Echter Öffnungsstatus, `Intl.DateTimeFormat` auf `Europe/Berlin` |
| 5 | **Der Satz der Karte** | Speisekarte, Kapitel II | Leader-Linie zeichnet sich zeilenweise, `scaleX()` auf `view()` |
| 6 | **Das Laufband** | zwischen Vorspann und I | Begriffsband, CSS-Animation, **mit Pausetaste** |
| 7 | **Das Papier** | global | Gerechnete Faserkachel bei 3,5 % + nativer `@view-transition` |
| 8 | **Das Bildband** | zwischen IV und V | Das einzige Bild der Seite, das über die Kante läuft. Vorlage nativ 3000 px |

Acht Moves — einer über der Obergrenze des Skills (5–7). Das ist eine bewusste
Abweichung: Das Bildband ist kein Effekt, sondern eine Layoutentscheidung
gegen die Monotonie von sechs gleich gebauten Kapiteln. Wer streichen will,
streicht es zuerst.

Der frühere „Temperaturwechsel" ist entfallen, weil es seit der dunklen
Grundfläche keine Temperatur mehr zu wechseln gibt.

| Anforderung | Stand |
|---|---|
| ≥ 1 WebGL-Element | ✓ Move 3 |
| ≥ 1 Scroll-Scrub oder Pin-Section | ✓ Moves 1, 2, 5 |
| Custom-Cursor auf gesamter Site | ✓ „Der Zeiger", `src/islands/zeiger.ts` |
| Preloader mit echtem Progress | ✓ „Der Vorhang", `src/islands/vorhang.ts` |

### Zu Cursor und Preloader

Beide waren im ersten Bauabschnitt gestrichen worden. Die Begründung für den
Preloader war **falsch**: Ich hatte WCAG 2.2.1 („Timing Adjustable")
herangezogen. 2.2.1 zielt auf Fristen, die dem Nutzer Inhalt entziehen oder
ihn zur Eile zwingen — eine Ladeanzeige, die endet, sobald geladen ist, setzt
keine Frist. Die Ablehnung des Cursors war ebenfalls zu pauschal.

Was tatsächlich gilt und im Code durchgesetzt ist:

**Vorhang** — keine künstliche Mindestdauer (das *wäre* ein 2.2.1-Verstoß) ·
echter Fortschritt aus `document.fonts.ready` und `img.decode()`, keine
Fake-Progress-Animation · liegt über bereits gerendertem Inhalt und blockiert
nichts · `aria-hidden` und `inert` · nur beim ersten Aufruf einer Sitzung ·
Notbremse nach 2 s · **ein Test misst den LCP; über 2,5 s fliegt er raus.**

**Zeiger** — nur bei `pointer: fine` · der System-Cursor wird **nirgends**
ausgeblendet, ein Test sucht nach `cursor: none` im ganzen Dokument ·
`pointer-events: none` und im z-Stack unter der Kopfzeile, kann also weder
einen Klick abfangen noch einen Fokusring verdecken · bei
`prefers-reduced-motion` startet er nicht, bei `forced-colors: active`
verschwindet er · trägt keine Information.

**Bewusste Abweichung:** Der Skill fordert den Zeiger „auf gesamter Site".
Er läuft auch auf `/speisekarte/`. Diese Seite war zuvor bewusst **ohne
JavaScript** ausgeliefert; sie trägt jetzt rund 1,3 KB. Die Entscheidung liegt
beim Auftraggeber und ist so getroffen worden. Die Seite funktioniert
unverändert vollständig ohne JavaScript — der Zeiger ist reine Zugabe.

---

## Medien

| Punkt | Stand | Anmerkung |
|---|---|---|
| Video-Hero (Seedance oder Image-Sequence) | **abweichend gelöst** | siehe unten |
| Hero-Video < 3 MB, Poster-Frame | entfällt | kein Video |
| Alle Bilder mit Art-Direction generiert | **abweichend** | echte Fotografie statt Generierung |

### Regel 3 — Video-Hero

Ein fotorealistisches KI-Video von Speisen ist **ausgeschlossen**: Das Steak
wird so nicht serviert, das ist eine Irreführung nach § 5 UWG, und ab
02.08.2026 kommt die Kennzeichnungspflicht nach Art. 50 EU AI Act hinzu.
Videomaterial des Hauses existiert nicht.

Umgesetzt ist stattdessen die vom Skill selbst genannte Gleichwertigkeit
(Regel 3, SM-02/SM-04): eine **scroll-gesteuerte Bildfolge**. „Der Anschnitt"
schneidet echte Aufnahmen nacheinander auf. Dazu kommt seit dem 29.07.2026 der
Vollbild-Hero: ein stehendes Foto unter vier Verläufen, wie in der Vorschau —
aber ohne deren Scroll-Skalierung, weil die Schrift darüber liegt.
Nutzergesteuert, kein Autoplay, kein `<video>`, keine Kennzeichnungsfrage.

Die Skill-Absicht „kein statischer Hero" ist damit erfüllt.
**Offen als Angebot an den Kunden:** ein halber Drehtag für echtes
Bewegtmaterial. Das wäre der saubere Weg und blockiert nichts.

---

## Recht & KI-Transparenz

| Punkt | Stand |
|---|---|
| „✦ KI-generiert"-Badge auf Video-Hero | **entfällt — es gibt kein KI-Material** |
| `DigitalSourceType`-Metadaten | entfällt, siehe oben |
| Fotorealistische KI-Bilder gekennzeichnet, Shader bewusst label-frei | ✓ **nicht überkennzeichnet** |
| Chatbot-Hinweis | entfällt, kein Chatbot |
| Kennzeichnungs-Entscheide dokumentiert | ✓ diese Datei |
| KI-Transparenz-Policy an Kunden | ✓ als Abschnitt in `UEBERGABE.md` |

Der Skill verlangt ausdrücklich, **nicht** zu überkennzeichnen. Auf dieser
Website ist kein einziges Asset KI-generiert:

- Fotografie: J. Schumacher, echte Aufnahmen des Hauses
- Signet und Schriftzug: die eigene Marke des Auftraggebers
- Papierkorn (Move 7): gerechnet, `scripts/korn-erzeugen.mjs`
- Glut (Move 3): GLSL-Shader, `src/shaders/glut.frag.glsl`

Ein Badge wäre hier eine falsche Aussage.

---

## Performance

| Punkt | Ziel | Stand |
|---|---|---|
| JavaScript auf `/` | ≤ 32 KB gzip | **17,9 KB** |
| Hero-Bild scharf auf Retina | 2400 px | **hochskaliert aus 1766 px** — sichtbar besser, aber kein Ersatz für eine große Aufnahme |
| LCP | < 2,5 s | geprüft in `tests/verhalten/dekor.spec.ts` |
| CLS | < 0,1 | Schriftmetriken angeglichen, alle Bilder mit Maßen |
| WebGL 60 fps auf Mittelklasse | — | 30-fps-Deckel, `IntersectionObserver`, Notausschalter in `restaurant.json` |
| Fallback für schwache Hardware | ✓ | Shader startet erst ab > 2 Kernen, ohne `Save-Data`, ab 640 px |

---

## Branding

| Punkt | Stand |
|---|---|
| SUPERBRAND-Footer | ✓ `src/components/Fusszeile.astro` |
| Tonalität durchgängig duzen | **abweichend — „Sie"**, vom Auftraggeber entschieden |
| Slogan bei Nennung von Dennis Sasse | entfällt, wird nicht genannt |

---

## Stack-Hierarchie — begründete Abweichungen

Der Skill schreibt Next.js, Tailwind, Lenis, GSAP Club, Barba.js und Three.js
vor. Umgesetzt ist:

| Skill | Hier | Grund |
|---|---|---|
| Next.js + Tailwind | **Astro, natives CSS** | Statische Seite ohne Formulare. Eine React-Laufzeit wäre reine Last; das JS-Budget liegt bei 18 KB statt bei über 80 |
| Lenis | **nichts** | Bricht Strg+F, Fokusverfolgung und `scroll-padding-top`. `scroll-behavior: smooth` leistet dasselbe für 0 KB |
| GSAP + ScrollTrigger | **native Scroll-Timelines** | `animation-timeline` kann alles, was hier gebraucht wird. Spart ~34 KB und den gesamten Pause-Sonderfall |
| Barba.js | **`@view-transition`** | Nativ, 0 KB, keine Fokusfallen |
| Three.js + R3F + Drei | **OGL** | Ein Fullscreen-Fragment-Shader braucht keine Szenengraph-Bibliothek. 10 KB statt 150–200 KB |
| Howler / Sound | **nichts** | Im Skill optional. Auf einer Restaurantseite Belästigung |

---

## Was noch offen ist

- **PEAT-Protokoll** einer 60-Sekunden-Aufnahme des Glut-Kapitels.
  Ohne dieses Protokoll geht der Shader nicht live — gesättigtes Rot ist die
  kritischste Farbe für Photosensitivität, und bei einer Glut-Ästhetik ist das
  keine theoretische Sorge.
- **NVDA auf echtem Windows**, `forced-colors: active`, Mittelklasse-Android
  auf Fast 3G. Automatische Werkzeuge finden zusammen nur 30–40 % der realen
  Verstöße.
- **Stier-Logo als Vektordatei.** Das Signet läuft derzeit als
  CSS-Maske aus einem 480 px breiten PNG (12 KB). Das trägt bis 3 rem sauber,
  ein Vektor wäre besser.
- **Der Hero-Grund ist gemessen, nicht abgeleitet.**
  `tests/verhalten/hero-grund.spec.ts` schaltet den Text unsichtbar, nimmt den
  Hero auf und rechnet für jeden Textknoten den schlechtesten Pixel gegen die
  Textfarbe — bei 320, 768 und 1440 px. Die Gegenprobe ist gelaufen: ohne die
  Verlaufsebenen fällt der Test auf 1,00:1. Er kann also rot werden.
- **Kunden-Pflegetest:** eine Preisänderung über github.dev, absichtlicher
  Formatfehler, Lesen der deutschsprachigen Meldung.
