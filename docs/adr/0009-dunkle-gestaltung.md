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
`#14110D` bei **1,32:1** — es ist selbst fast so dunkel wie der Grund. Die
Hausfarbe verschwindet damit als Text- und Linienfarbe vollständig von der
Seite.

> **Korrektur vom 29.07.2026:** Hier stand bis dahin 1,07:1. Nachgerechnet
> mit `src/lib/kontrast.ts` sind es 1,32:1. An der Schlussfolgerung ändert
> das nichts — beide Werte liegen weit unter 3:1 —, aber eine Zahl, die als
> gemessen ausgegeben wird und es nicht war, gehört in diesem Projekt
> korrigiert. Der Grund, warum sie so lange stehenblieb, steht unten im
> Nachtrag: Der Kontrastwächter hat die Kommentare der dunklen Palette gar
> nicht geprüft.

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

---

## Nachtrag 29.07.2026, zweite Rückmeldung — „zu dunkel das ganze"

Der Auftraggeber hat die umgebaute Seite gesehen und drei Worte geschrieben.
Vor jeder Änderung wurde ausgezählt, was daran wörtlich zutrifft.

### Der Befund: es ist keine Farbfrage

Bildschirmaufnahme jeder Route in voller Länge, dann Pixel gezählt. Als
„blanke Grundfläche" gilt ein Pixel, dessen Leuchtdichte um weniger als 6
von `--grund` abweicht — also kein Bild, keine Schrift, keine Linie:

| Route | blanke Grundfläche | heller als 60/255 |
|---|---|---|
| Startseite | **81,0 %** | 7,0 % |
| Speisekarte | **93,5 %** | 5,0 % |
| Philosophie | 88,0 % | 7,6 % |
| Kontakt | 86,6 % | 11,2 % |

Das Steakbild in Kapitel I maß 465 × 620 px in einem 1440er-Fenster — **5 %
der Fensterfläche**. Zwischen zwei Kapiteln standen bis zu 288 px leerer
Grund; über die zwölf Kanten der Startseite summierte sich das auf rund
1700 px, ein knappes Fünftel der Seitenhöhe.

Eine dunkle Seite wirkt nicht dunkel, weil ihr Grundton dunkel ist. Sie wirkt
dunkel, wenn nichts darauf steht. Ein anderer Hexwert hätte daran nichts
geändert — 81 % wären 81 % geblieben, nur etwas heller.

### Die Entscheidung

Der Auftraggeber hat aus drei Wegen gewählt: **„Licht in die dunkle Seite"**.
Der Grundton bleibt `#14110D`. Nicht gewählt wurden die Umkehrung auf einen
hellen Grund und das bloße Anheben des Grundtons.

### Die Regel, die daraus folgt

Sie trennt nicht nach Geschmack, sondern nach Gebrauch:

| | Fläche |
|---|---|
| **Auftritt** — Hero, Kapitel, Bilder, Glut | dunkel `#14110D` |
| **Dokument** — Karte, Chronik, Zeiten, Anfahrt, Recht | Kalk `#F4EFE6` |
| **Schluss** — Kontaktblock der Startseite | Bordeaux `#7B2233` |

Der Vorteil dieser Formulierung: Sie beantwortet die nächste Frage von
selbst. Wer eine neue Seite baut, muss nicht raten, sondern nur wissen, ob
sie gelesen oder angesehen wird.

Umgesetzt über `[data-flaeche='hell']` in `tokens.css`, gebaut wie der
Bordeaux-Umschalter: Der Block setzt `--text`, `--text-leise`, `--akzent`,
`--linie` und den Fokusring um. **Komponenten merken davon nichts** — sie
benutzen die semantischen Namen und stehen deshalb auf jeder Fläche richtig.

### Das Markenrot kommt zurück

Der teuerste Teil des Umbaus vom Vormittag war, dass `#551213` von der Seite
verschwand. Auf Kalk steht es bei **12,37:1** — besser, als Gold es auf
Dunkel je war (7,85:1). Es trägt dort Rubriken, Ziffern, Preise und Links.

Damit ist die Farbverteilung spiegelbildlich, und beide Hälften des Spiegels
sind als Verbot in `src/lib/farben.ts` hinterlegt, samt Beweis, dass sie
scheitern:

    Gold auf Kalk .......... 2,09:1   verboten
    Ochsenblut auf Grund ... 1,32:1   verboten
    Creme auf Kalk ......... 1,14:1   verboten

### Was sonst geändert wurde

**Bildspalte von 0,62fr auf 0,92fr**, Hochformat von 3/4 auf 4/5. Das Bild
trägt jetzt knapp die Hälfte der Zeile statt eines Drittels.

**Sektionsabstand `--raum-9`** von `clamp(4.5rem, …, 9rem)` auf
`clamp(3.5rem, …, 6.5rem)`.

**Der Hero** von 92svh auf 100svh, Sockel-Innenabstand kleiner. Vorher trug
der Textblock 674 von 828 px; für das Bild blieb ein Streifen.

**Bordeaux** stand seit dem Umbau definiert in `tokens.css` und wurde
nirgends benutzt. Es trägt jetzt Kapitel VI.

### Ergebnis

Mittlere Leuchtdichte der ganzen Seite, 0 = schwarz, 255 = weiß:

| Route | vorher | nachher |
|---|---|---|
| Startseite | 26,5 | **90,8** |
| Speisekarte | 25,3 | **194,4** |
| Philosophie | 28,1 | **117,0** |
| Kontakt | 37,1 | **129,5** |
| Weinfachhandel | 44,6 | **70,6** |
| Impressum | — | **175,0** |

### Zwei Fehlerquellen, die beim Messen aufgefallen sind

**Der Kontrastwächter prüfte die Kommentare gar nicht.** In
`pruefe-kontraste.mjs` stand eine feste Liste der zulässigen Gründe:
`/auf (Kalk|Espresso|Ochsenblut|Leinen)/`. Nach dem Umbau auf Dunkel hieß der
Grund „Grund" und die Vollfläche „Bordeaux" — keiner dieser Namen kam darin
vor. Die Prüfung sprang für **jeden** Kommentar der dunklen Palette ab, ohne
etwas zu melden. Fünf zugesagte Verhältnisse liefen ungeprüft mit; sie
stimmten, aber das war Glück, und die falsche 1,07 oben zeigt, wie schnell es
anders ausgeht. Die Namen kommen jetzt aus der Palette selbst. Gegengeprüft:
Ein absichtlich falscher Kommentar bricht den Lauf.

**Zwei Messartefakte, die keine Fehler waren.** In der Ganzseitenaufnahme
fehlten alle sechs Kapitelüberschriften und zwei Kapitelbilder. Ersteres ist
die scroll-getriebene `clip-path`-Animation, die außerhalb ihres Bereichs
korrekt zugeschnitten steht; letzteres lazy geladene Bilder. Beides am
laufenden Browser gegengeprüft, bevor etwas „repariert" wurde. Das Messskript
scrollt jetzt erst durch.

### Die neue Prüfung

`tests/verhalten/flaechen.spec.ts` nimmt jede Route in voller Länge auf und
zählt den Anteil blanker dunkler Grundfläche. Über **70 %** bricht der Lauf.

Der erste Entwurf maß den Anteil der jeweils *vorherrschenden* Fläche und war
damit falsch: Die Speisekarte fiel mit 96 % durch, obwohl sie inzwischen hell
ist — eine Karte besteht nun einmal fast nur aus Papier. Eine Prüfung muss
messen, was gemeldet wurde.

Gegengeprüft: Ohne die helle Fläche steht das Impressum bei 94,6 % und der
Lauf bricht.

Dazu zwei kleinere Prüfungen: Die Startseite muss beide Flächen und den
Bordeaux-Block tragen, und auf keiner hellen Fläche darf Gold als Schriftfarbe
stehen — gesucht wird am gerenderten Ergebnis, nicht im Quelltext, weil genau
so der Fehler entsteht: durch ein vergessenes `var(--gold)` in einer
Komponente, die vorher nur auf dunklem Grund stand.
