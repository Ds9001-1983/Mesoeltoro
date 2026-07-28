# 0008 — Eigener Zeiger und Ladeanzeige: doch gebaut

**Datum:** 28.07.2026
**Status:** angenommen — ersetzt die Streichung aus der ersten Bauphase

---

## Ausgangslage

Der Skill `premium-10k-web` führt „Custom-Cursor auf gesamter Site" und
„Preloader mit echtem Progress" als Tier-3-Pflicht. Beide waren im ersten
Bauabschnitt gestrichen worden, mit dieser Begründung:

> **Preloader** — Künstliche Mindestdauer ist ein von der Seite gesetztes
> Zeitlimit (2.2.1) und verzögert den LCP ohne a11y-Gewinn.
>
> **Custom-Cursor** — Null Informationsgewinn, dauerhafter a11y-Sonderfall
> (verdeckt Fokusringe, Screen-Magnifier folgen dem Systemcursor),
> Regressionsherd auf Hybridgeräten.

## Was daran falsch war

**Beim Preloader war die Norm falsch angewandt.** WCAG 2.2.1 („Timing
Adjustable") betrifft Zeitlimits, die den Nutzer zur Eile zwingen oder ihm
Inhalt entziehen — Sitzungsablauf, Karussells mit Zwangsweiterschaltung,
Formulare mit Countdown. Eine Ladeanzeige, die endet, sobald geladen ist,
setzt keine Frist. Verboten ist die **künstliche Mindestdauer**, nicht der
Preloader.

**Beim Cursor war die Ablehnung pauschal.** Die genannten Risiken sind real,
aber sie hängen alle an einer einzigen Entscheidung: `cursor: none`. Wer den
System-Cursor stehen lässt und nur einen Ring mitlaufen lässt, hat keines der
Probleme. Fokusringe werden nicht verdeckt, wenn der Ring im z-Stack unter den
Bedienelementen liegt. Bildschirmvergrößerer folgen weiterhin dem
Systemzeiger, weil er noch da ist.

Beide Begründungen waren also nicht falsch **im Ergebnis**, aber zu grob
**in der Herleitung** — und eine zu grobe Begründung ist gefährlicher als
keine, weil sie die nächste Person davon abhält, genauer hinzusehen.

## Entscheidung

Beide werden gebaut, unter Auflagen, die im Code stehen und geprüft werden.

### Der Vorhang — `src/islands/vorhang.ts`

| Auflage | Umsetzung |
|---|---|
| Keine künstliche Mindestdauer | Es gibt keinen Timer, der die Anzeige verlängert. Nur einen, der sie **beendet** (2 s Notbremse) |
| Echter Fortschritt | Zwei Meilensteine, die etwas bedeuten: `document.fonts.ready` und `img.decode()` des größten Bilds. Kein hochzählender Balken ohne Bezug — Fake-Progress steht im Skill selbst auf der Anti-Pattern-Liste |
| Blockiert nichts | Wird zur Laufzeit angelegt und liegt **über** bereits gerendertem Inhalt. Bricht das Skript, ist die Seite trotzdem da |
| Ohne JavaScript nicht vorhanden | Kein Markup, kein Startzustand im HTML — sonst bliebe ohne Skript eine Fläche über der Seite stehen |
| Kein Fokusraub | `aria-hidden` und `inert` |
| Nicht bei reduzierter Bewegung | `prefers-reduced-motion` und `data-motion` ≠ `full` verhindern den Start |
| Nur einmal pro Sitzung | `sessionStorage`. Beim zweiten Aufruf liegt alles im Cache — eine Ladeanzeige wäre dann eine Behauptung |
| **LCP-Schranke** | `tests/verhalten/dekor.spec.ts` misst den LCP. Über 2,5 s fliegt der Vorhang raus. Das ist keine Absichtserklärung, sondern ein rotes Testergebnis |

### Der Zeiger — `src/islands/zeiger.ts`

| Auflage | Umsetzung |
|---|---|
| **Kein `cursor: none`** | Steht auf der Verbotsliste in `CLAUDE.md`. Ein Test durchsucht das gesamte Dokument nach der Deklaration |
| Kann keinen Klick abfangen | `pointer-events: none` |
| Kann keinen Fokusring verdecken | z-index 40, unter der Kopfzeile (100) und unter dem Vorhang (9000). Ein Test vergleicht die Werte |
| Für Hilfsmittel unsichtbar | `aria-hidden` |
| Trägt keine Information | Der einzige Zustand ist „über einem Bedienelement", und der ist redundant — jedes Bedienelement hat zusätzlich einen eigenen Hover-Zustand (1.4.1) |
| Nur bei feinem Zeigegerät | `pointer: fine` und `hover: hover`. Auf Touch lädt nichts |
| Nicht bei reduzierter Bewegung | Startet nicht; ein Test prüft es mit `reducedMotion: 'reduce'` |
| Nicht im Kontrastmodus | `forced-colors: active` blendet ihn aus |

## Folgen

**`/speisekarte/` ist nicht mehr JavaScript-frei.** Der Skill fordert den
Zeiger „auf gesamter Site", und der Auftraggeber hat sich am 28.07.2026 dafür
entschieden. Die Seite trägt jetzt rund 1,3 KB.

Das ist eine echte Einbuße, und sie gehört benannt statt weggeredet: Die
Speisekarte war bewusst die technisch langweiligste Seite des Projekts, weil
sie die meistgesuchte und rechtlich heikelste ist. Was **unverändert** gilt:

- Alle Inhalte, Preise und Kennzeichnungen stehen ohne JavaScript vollständig da.
- Die Sprungnavigation sind reine `<a href="#…">`.
- Keine Kategorie ist zugeklappt.
- Der Test „funktioniert vollständig ohne JavaScript" bleibt bestehen und grün.

Der Zeiger ist dort Zugabe, keine Voraussetzung. Wer die JS-Freiheit
zurückwill, hängt in `Basis.astro` eine Bedingung auf `seite !== 'speisekarte'`
vor das Skript — drei Zeilen.

## Verworfene Alternativen

**Zeiger nur auf der Startseite.** Widerspricht dem Skill („gesamte Site") und
erzeugt einen Bruch beim Seitenwechsel, der auffälliger wäre als der Zeiger
selbst.

**Preloader mit Mindestanzeigedauer**, damit er „nicht flackert". Genau das
wäre der 2.2.1-Verstoß. Wenn nichts zu laden ist, soll nichts angezeigt
werden — deshalb auch die Sitzungsprüfung.
