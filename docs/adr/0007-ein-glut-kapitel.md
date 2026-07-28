# 0007 — Genau ein dunkles Kapitel

**Entschieden:** 28.07.2026 · **Status:** angenommen

## Entscheidung

Die gesamte Website ist hell (Kalk `#F4EFE6`). Es gibt **genau eine** dunkle
Fläche: das Kapitel „La Morocha“ auf der Startseite. Die Weinseite bleibt
hell, die Philosophie-Seite bleibt hell.

## Warum nicht durchgehend dunkel

Der naheliegende Steakhouse-Reflex ist ein durchgehend dunkler Auftritt. Drei
Gründe sprechen dagegen:

1. **Die Speisekarte trägt es nicht.** 38 Gerichte mit Preisen,
   Allergencodes und Kleintext auf dunklem Grund sind eine Kontrast-Prüffläche,
   die man bei jeder Änderung neu absichern muss. Auf Kalk steht der Fließtext
   bei 13,20 : 1 — da kann nichts kippen.

2. **Das Markenrot trägt auf Dunkel nicht.** Das echte Ochsenblut des Hauses,
   `#551213`, erreicht auf Espresso nur 1,07 : 1 — es ist selbst fast so dunkel
   wie der Grund. Eine durchgehend dunkle Seite müsste die Marke überall durch
   einen aufgehellten Ersatzton vertreten; die Marke wäre dann nirgends im
   Original zu sehen. Auf Kalk steht dieselbe Farbe dagegen bei 12,37 : 1.

   *(Nachtrag 28.07.2026: Diese Entscheidung wurde ursprünglich mit dem Wert
   `#B3372B` begründet — einer Erfindung aus der Entwurfsphase. Die Prüfung
   des echten Logos hat den Befund nicht widerlegt, sondern verschärft.)*

3. **Ab dem dritten Mal ist Glut ein Muster, keine Dramaturgie.** Der Wechsel
   wirkt genau deshalb, weil er einmal passiert.

## Umsetzung

Der Übergang läuft über einen 40 svh hohen Korridor, der **per Layoutregel
textfrei** ist. Das ist der entscheidende Punkt: Eine Farbinterpolation unter
laufendem Text erzeugt Zwischenzustände, in denen der Kontrast messbar unter
4,5 : 1 fällt. Wo kein Text steht, kann auch keiner unlesbar werden.

`tests/visuell/` prüft, dass kein Textknoten in den Korridor gerät.

Das dunkle Kapitel trägt ein eigenes Token-Set (`[data-flaeche='glut']`) mit
aufgehellten Geschwistern: Ember-hell 7,08 : 1, Messing-hell 6,25 : 1.
Kein Alpha-Trick, keine Interpolation — zwei getrennte, jeweils geprüfte
Paletten.
