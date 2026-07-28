# 0002 — Kein GSAP, kein Lenis, kein Custom-Cursor

**Entschieden:** 28.07.2026 · **Status:** angenommen

## Lage

Der Premium-Anspruch legt die üblichen Werkzeuge nahe: GSAP mit ScrollTrigger
für die Choreografie, Lenis für weiches Scrollen, ein eigener Mauszeiger.

## Entscheidung

Keines davon. Die Choreografie läuft über native CSS Scroll-Driven Animations
hinter `@supports`, das weiche Scrollen über `scroll-behavior: smooth`.

## Warum

**ScrollTrigger.pin** arbeitet intern mit `position: fixed` und
Abstandshaltern. Der Browser kennt die tatsächliche Position eines gepinnten
Elements damit nicht mehr und kann ein fokussiertes Element nicht von sich aus
ins Bild holen — der Fokus landet auf Unsichtbarem. Ohne Pinning liefert
ScrollTrigger nur noch Fortschrittswerte, und genau das kann
`animation-timeline` nativ. Ersparnis: rund 34 KB und eine
Fünfjahres-Abhängigkeit.

**Lenis** bricht die Seitensuche des Browsers, die Bild-auf/ab-Tasten, den
Fokus bei Ankersprüngen und `scroll-padding-top`. `scroll-behavior: smooth`
liefert dieselbe Wirkung für 0 KB und ohne diese Nebenwirkungen.

**Der Custom-Cursor** bringt keinen Informationsgewinn, verdeckt
Fokusindikatoren, und Bildschirmlupen folgen dem Systemzeiger — ein
nachgezogener JS-Zeiger erzeugt dort sichtbaren Versatz. Dazu ein dauerhafter
Sonderfall auf Hybridgeräten.

## Nebenwirkung, die den Ausschlag gab

Weil die Choreografie in CSS liegt, wirkt eine einzige Regel als globale
Pause:

```css
:root[data-motion-paused='true'] [data-anim='zeit'] {
  animation-play-state: paused !important;
}
```

Bei einer JS-Timeline muss man daran denken, jede einzelne zu pausieren. Hier
kann man es nicht vergessen. Das erfüllt WCAG 2.2.2 strukturell statt durch
Disziplin — und ist der eigentliche Grund für diese Entscheidung.

## Preis

Keine Effekte, die zwingend eine Timeline brauchen. Bisher wurde keiner
vermisst.
