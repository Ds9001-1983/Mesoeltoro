# 0009 — Die Seite wird durchgehend dunkel

**Datum:** 29.07.2026
**Status:** angenommen — **ersetzt ADR 0007** („Genau ein Glut-Kapitel")

---

## Anlass

Der Auftraggeber hat die SUPERBRAND-Verkaufsvorschau gezeigt
(`restaurant-meson-el-toro.vorschau.superbrand.marketing`) und entschieden,
dass deren Gestaltung übernommen wird: dunkle Grundfläche `#14110D`, Gold als
Akzent, römische Nummerierung mit spanischen Rubriken.

Das ist genau die Richtung, die am 28.07.2026 unter dem Namen „Carta" zur Wahl
stand und damals gegen „Zwei Temperaturen" verloren hatte. Die Korrektur ist
legitim: An der gebauten hellen Seite ließ sich sehen, was die dunkle besser
kann.

## Was ADR 0007 behauptet hat — und was davon standhält

ADR 0007 nannte drei Gründe gegen eine durchgehend dunkle Seite. Nachgeprüft:

**1. „Die Speisekarte trägt es nicht."**
Der Einwand war, 38 Gerichte mit Preisen, Allergencodes und Kleintext auf
dunklem Grund seien eine Kontrast-Prüffläche, die man bei jeder Änderung neu
absichern muss. Das bleibt als **Wartungsaufwand** richtig — aber es ist ein
Aufwand, kein Hindernis. Der Kontrastwächter rechnet ohnehin jedes Paar bei
jedem Build nach. Creme auf Grund steht bei **14,43:1**, also besser als der
frühere Fließtext auf Kalk (13,20:1).

**2. „Das Markenrot trägt auf Dunkel nicht."**
Das stimmt und ist der teuerste Teil der Entscheidung. `#551213` steht auf
`#14110D` bei **1,07:1** — es ist selbst fast so dunkel wie der Grund. Die
Hausfarbe verschwindet damit als Text- und Linienfarbe vollständig von der
Seite.

Die Vorschau löst das, indem sie die Rolle neu verteilt: **Gold `#C9A24B`**
wird der Akzent (7,85:1), **Bordeaux `#7B2233`** bleibt als Vollfläche für
Mobilmenü und gefüllte Blöcke. Das ist keine Umgehung des Problems, sondern
eine andere Antwort darauf — und sie funktioniert, weil Bordeaux nie Kontur
und nie Schrift auf dunklem Grund ist.

**3. „Ab dem dritten Mal ist Glut ein Muster, keine Dramaturgie."**
Dieser Einwand ist durch die Entscheidung gegenstandslos geworden, aber sein
Kern überlebt in anderer Form: **Der WebGL-Shader läuft weiterhin an genau
einer Stelle** — Kapitel III der Startseite. Die dunkle Fläche ist jetzt
überall, die Glut nicht.

## Entscheidung

| | vorher | jetzt |
|---|---|---|
| Grundfläche | Kalk `#F4EFE6` | **Grund `#14110D`** |
| Fließtext | Espresso, 13,20:1 | **Creme `#ECE0CC`, 14,43:1** |
| Sekundärtext | Espresso-70, 6,85:1 | **Creme-leise `#A09889`, 6,59:1** |
| Akzent | Ochsenblut `#551213`, 12,37:1 | **Gold `#C9A24B`, 7,85:1** |
| Vollfläche | – | **Bordeaux `#7B2233`** |
| Display-Schrift | Instrument Serif 400 | **Archivo 900, Versalien** |
| Mikroschrift | Instrument Sans | **Geist Mono** |
| Kursiv | nicht geladen | **Newsreader kursiv** — trägt die spanischen Begriffe |

Der Korridor („Temperaturwechsel", Move 2) ist **ersatzlos entfallen**. Es gibt
keine Temperatur mehr zu wechseln.

## Was die Umstellung gekostet hat

Drei Dinge sind dabei kaputtgegangen und mussten repariert werden. Sie stehen
hier, weil sie beim nächsten Palettenwechsel wieder auftreten:

**Reflow bei 320 px.** Archivo 900 in Versalien ist rund ein Drittel breiter
als der vorherige Serifenschnitt. „WEINFACHHANDEL" lief aus dem Rahmen. Zwei
Ursachen: zu große Mindestwerte bei `--t-h1`/`--t-h2`, und Rasterzellen mit
dem voreingestellten `min-width: auto`, die nicht unter ihren Mindestinhalt
schrumpfen. Beides behoben, plus `overflow-wrap: break-word` als letzte
Rückfallebene.

**Preise in Monospace.** Geist Mono ist deutlich breiter als Instrument Sans.
Eine Preiszeile mit zwei Varianten („200 g · 22,00 € — 300 g · 33,00 €") mit
`white-space: nowrap` sprengte bei 320 px die Spalte. Der Preis darf dort
jetzt umbrechen.

**Das Druckbild.** Eine dunkle Seite kostet im Ausdruck eine halbe
Tonerpatrone. `druck.css` kehrt jetzt die **Token** um, nicht einzelne Regeln
— damit gilt die Umkehr automatisch auch für Komponenten, die später
dazukommen.

## Was NICHT übernommen wurde

Die Vorschau ist ein Verkaufsstück, kein Produktivstand. Nicht übernommen:

| | Grund |
|---|---|
| Speisekarte ohne Allergenkennzeichnung | Art. 44 LMIV — der Mangel der Altseite |
| Vier Google-Zitate ohne Prüfhinweis | § 5b Abs. 3 UWG — die Zitate kommen, der Hinweis auch |
| Laufband und Glutpuls endlos ohne Bedienelement | **2.2.2** — echter Verstoß. Hier trägt das Laufband eine Pausetaste |
| Schrift auf scroll-skaliertem Bild | 1.4.3. Hier steht das Bild still, und `tests/verhalten/hero-grund.spec.ts` misst den real gerenderten Kontrast hinter jedem Textknoten |
| Lenis | ADR 0002 |
| GSAP + ScrollTrigger | Alle Effekte laufen nativ über `animation-timeline` |
| Cookie-Hinweis | Für rein technisch notwendigen Speicher nicht erforderlich (§ 25 Abs. 2 Nr. 2 TDDDG) |

## Der Hero — der einzige echte Konflikt

Projektregel 2 lautet „Kein Text über bewegtem Bild. Schrift steht immer auf
ruhiger Fläche." Die Vorschau legt die Headline auf ein scroll-skaliertes Foto.

Aufgelöst so, dass die Wirkung bleibt: Das Bild **steht still** (kein
Ken-Burns-Scrub), darüber liegen vier Verläufe, und die Schrift sitzt dort, wo
deren Summe die Fläche nahezu ausgelaufen hat.

Ob das an jeder Stelle reicht, lässt sich aus dem Stylesheet nicht ableiten —
nur messen. Deshalb schaltet `tests/verhalten/hero-grund.spec.ts` den Text
unsichtbar, nimmt den Hero auf und rechnet für jeden Textknoten den
schlechtesten Pixel gegen die Textfarbe. Gemessen wird bei 320, 768 und
1440 px.

Die Gegenprobe ist gelaufen: Ohne die Verlaufsebenen fällt der Test auf
1,00:1 bis 1,76:1 — er kann also rot werden und ist keine Attrappe.

---

## Nachtrag 29.07.2026 — drei Rückmeldungen, drei verschiedene Ursachen

Der Auftraggeber meldete: Hero unscharf, Steak kaum erkennbar, Laufband steht.
Alle drei nachgemessen, keine hatte die vermutete Ursache.

**Das Laufband stand nicht — es lief mit 34 px/s.** Ein Umlauf misst 1280 px
und dauerte 38 s. Der bestehende Test wies korrekt nach, *dass* Bewegung
stattfindet; das war die falsche Frage. Jetzt 22 s (58 px/s, wie die
Vorschau), und ein zweiter Test prüft das Tempo.

**Der Hero war unscharf, weil die Vorlage zu klein ist.**
`meson_el_toro_speisekarte_steak.jpg` hat 1766 px. Ein Vollbild bei 1440
CSS-Pixeln fordert auf einem Retina-Bildschirm 2880 an und bekam 1600 — 55 %.
Behoben durch Hochskalieren auf 2400 px mit Lanczos und Nachschärfen auf der
Zielgröße, bei gleichzeitig niedrigerer AVIF-Qualität. Nachgemessen:

    1600 px @ 58, vom Browser hochgezogen ....  78,8 KB
    2400 px @ 44, Lanczos + geschärft .......   80,9 KB   ← sichtbar schärfer
    2400 px @ 50 ............................  104,2 KB   ← kaum besser

Gleiche Dateigröße, deutlich besseres Bild. Hochskalieren fügt trotzdem keine
Bildinformation hinzu — es entfällt nur das doppelte Umrechnen. Eine Aufnahme
mit 2880 px sähe besser aus.

**Dass das Steak nicht zu erkennen war, hatte ZWEI Gründe.**

Der erste war das Grading: Der Multiply-Verlauf endete bei `#47240e`, also
Faktor 0,28 / 0,14 / 0,05. Zurückgenommen auf `#9c6136`, Vignette schwächer.

Der zweite war ein **Spezifitätsfehler in `Bild.astro`**, und er betraf jede
einzelne Bildfläche des Projekts. Astro hängt an jeden Selektorteil ein
Scope-Attribut; aus `.bild img` wurde `.bild[cid] img[cid]` mit (0,4,1).
Jeder aufrufende Container schreibt `.kasten[cid] .bild img` — nur (0,3,1).
Das `block-size: auto` aus der Komponente gewann also immer.

Folge: `object-fit: cover` hatte nirgends etwas zu beschneiden. Das `img`
behielt seine Eigenhöhe (im Hero 1080 px in einem 629 px hohen Kasten) und
lief unten heraus. Sichtbar war überall der **obere Rand** der Vorlage statt
des gewählten Ausschnitts — im Hero das unscharfe hintere Steak statt des
scharfen vorderen.

Der Fehler war am Ergebnis nicht zu erkennen: Ein oben angeschnittenes Bild
sieht aus wie ein absichtlich so gewähltes. Gefunden erst, als zwei
verschiedene `object-position`-Werte dasselbe Bild ergaben und die berechneten
Werte im Browser gemessen wurden.

Behoben durch `:global(img)` in der Komponente — der Selektor bleibt bei
(0,2,1), die Vorgabe steht, jeder Container kann sie überschreiben.
Zusätzlich nutzt der Reset in `basis.css` jetzt `block-size` statt `height`,
damit nicht zwei verschiedene Eigenschaften auf dasselbe zeigen.

**Spanisch** ist von sechs Stellen auf ein System erweitert: Kategorien der
Speisekarte, Kapitel, Seitenköpfe und Fußzeilenrubriken. Preise, Allergene
und Rechtstexte bleiben deutsch. `tests/verhalten/dekor.spec.ts` prüft, dass
jede spanische Zeichenkette `lang="es"` trägt (3.1.2) — gegengeprüft, der
Test wird rot, wenn eines fehlt.
