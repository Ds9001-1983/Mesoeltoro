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
