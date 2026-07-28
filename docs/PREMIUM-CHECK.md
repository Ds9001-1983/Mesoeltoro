# Premium-Check

Abgleich gegen den Skill `premium-10k-web` (V1.1), Stand **28.07.2026**.

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
| 2 · Moodboard | drei Richtungen („Carta" dunkel, „Zwei Temperaturen", „Brasa" material-first), Entscheidung: **B+ „Zwei Temperaturen"** |
| 3 · Komponenten-Raster | 7 Sektionen der Startseite + Grundfläche |
| 4 · Komposition | umgesetzt |
| 5 · Polish | umgesetzt |

---

## Design & Content

| Punkt | Stand | Anmerkung |
|---|---|---|
| Custom-Fonts, kein Inter/Roboto/System | ✓ | Instrument Serif · Newsreader · Instrument Sans, alle OFL, selbst gehostet, 119,4 KB gesamt |
| Primärfarbe < 10 % Fläche | ✓ | Markenrot trägt Links, Telefon-Button und Signet |
| Kein Anti-Pattern aus der Liste | ✓ mit einer bewussten Ausnahme | **#13 „Siezen"** — die Website siezt. Der SUPERBRAND-Duz-Standard gilt für die Agenturmarke, nicht für Kundenmarken. Vom Auftraggeber entschieden. |
| **#14 statische Hero-Images** | ✓ vermieden | Der Hero ist eine scroll-gesteuerte Bildfolge, kein Standbild |
| **#15 kein WebGL** | ✓ vermieden | siehe unten |

**Nachtrag zur Farbe.** Bis zum 28.07.2026 lief das Projekt auf einem
erfundenen „Ochsenblut" `#B3372B` (5,24:1 auf Kalk). Das **echte** Markenrot
wurde aus `Logo-red.png`, `Schriftzug-red.png` und `SchriftzugNEU-red.png`
ausgelesen — drei unabhängige Markendateien, identischer Wert: **`#551213`**,
ein tiefes Burgunder mit **12,37:1 auf Kalk (AAA)**. Es ist jetzt gesetzt.

---

## Signature Moves — 6 von geforderten 5–7

| # | Move | Ort | Technik |
|---|---|---|---|
| 1 | **Der Anschnitt** | Startseite, Hero | Drei Ebenen, zwei gerissene Masken, scroll-getrieben. Glut → Teller → Tisch |
| 2 | **Der Temperaturwechsel** | vor dem dunklen Kapitel | `clip-path: inset()` auf `view()`-Zeitachse, textfreier 40-svh-Korridor |
| 3 | **Die Glut** | dunkles Kapitel | WebGL-Fragment-Shader (OGL ≈ 10 KB gzip) |
| 4 | **Der Küchenpass** | Startseite, Kontakt | Echter Öffnungsstatus, `Intl.DateTimeFormat` auf `Europe/Berlin` |
| 5 | **Der Satz der Karte** | Speisekarte | Leader-Linie zeichnet sich zeilenweise, `scaleX()` auf `view()` |
| 6 | **Das Papier** | global | Gerechnete Faserkachel bei 3,5 % + nativer `@view-transition` |

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
schneidet über zwei Masken drei echte Aufnahmen nacheinander auf —
Glut → Teller → gedeckter Tisch. Nutzergesteuert, kein Autoplay, kein `<video>`,
keine Kennzeichnungsfrage, 0 KB JavaScript.

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
- Papierkorn (Move 6): gerechnet, `scripts/korn-erzeugen.mjs`
- Glut (Move 3): GLSL-Shader, `src/shaders/glut.frag.glsl`

Ein Badge wäre hier eine falsche Aussage.

---

## Performance

| Punkt | Ziel | Stand |
|---|---|---|
| JavaScript auf `/` | ≤ 32 KB gzip | **18,0 KB** |
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
- **Kunden-Pflegetest:** eine Preisänderung über github.dev, absichtlicher
  Formatfehler, Lesen der deutschsprachigen Meldung.
