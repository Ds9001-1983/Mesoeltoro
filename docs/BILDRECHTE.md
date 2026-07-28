# Bildrechte

**Stand:** 28.07.2026 · **Status:** ungeklärt — kein Foto ist freigegeben

---

## Worum es geht

Die Fotografien der Vorgängerseite stammen von **J. Schumacher**. Sie sind
handwerklich gut und wären für die neue Seite ideal. Ob sie verwendet werden
dürfen, ist aber offen — und zwar aus zwei unabhängigen Gründen.

### 1. Zweckübertragung und Betreiberwechsel

Nutzungsrechte gehen nur so weit, wie es der Vertragszweck erfordert
(Zweckübertragungslehre, § 31 Abs. 5 UrhG). Wurden die Bilder seinerzeit für
eine bestimmte Website erstellt, deckt das nicht automatisch eine neue.

Hinzu kommt: Das Restaurant wird **seit 2023 unter neuer Geschäftsführung**
geführt. Nutzungsrechte gehen nicht von selbst auf einen Rechtsnachfolger
über — dafür braucht es die Zustimmung des Urhebers (§ 34 UrhG).

### 2. Abgebildete Personen

Auf mindestens einem Motiv ist eine Servicekraft erkennbar. Dafür braucht es
eine Einwilligung nach § 22 KunstUrhG und Art. 6 Abs. 1 lit. a DSGVO.
Einwilligungen ausgeschiedener Mitarbeiter sind praktisch nicht nachholbar.

---

## Was wir brauchen

1. **Fotovertrag oder Rechnung** von J. Schumacher, aus der der Umfang der
   eingeräumten Rechte hervorgeht — insbesondere: zeitlich unbefristet?
   Bearbeitung erlaubt? Nachfolgemedien eingeschlossen?
2. **Schriftliche Bestätigung**, dass die Rechte auf die heutige
   Meson el Toro GmbH übergegangen sind — oder eine Nachlizenzierung.
3. **Einwilligungen** der auf den Fotos erkennbaren Personen.

Liegt eines davon nicht vor, ist eine **Nachlizenzierung** beim Fotografen der
schnellste Weg. Sie ist erfahrungsgemäß unkompliziert und kostet einen
Bruchteil dessen, was eine Abmahnung kostet.

---

## Wie das technisch abgesichert ist

Die Website kann ein Foto **nicht ausliefern**, solange die Rechte nicht
dokumentiert sind. Das ist keine Selbstdisziplin, sondern eine Sperre im Code:

- `Bild.astro` nimmt einen **Registerschlüssel** entgegen, niemals einen
  Dateipfad. Wer kein Register hat, hat kein Bild.
- Ein Eintrag mit `"freigabe": false` erzeugt einen gestalteten Platzhalter
  statt des Fotos.
- `"freigabe": true` ohne `"urheber_nachweis": true` **bricht den Build ab**.
- Ist eine Person abgebildet, verlangt der Build zusätzlich
  `"personen_einwilligung": true`.
- `scripts/pruefe-bildrechte.mjs` prüft nach dem Bauen, dass in `dist/`
  wirklich nur freigegebene Dateien liegen.

Zusätzlich gilt eine **Sperrliste**: Im Medienverzeichnis der alten
WordPress-Installation liegen Fotos aus fremden Projekten
(`JSchumacher_Theos_*`, `Claudios*`, `Simerilab*`, `pexels-*`). Sie gehören
nicht zum Mesón el Toro. Jeder Versuch, eine davon einzubinden, bricht den
Build ab — auf zwei Ebenen, in der Komponente und in der Nachprüfung.

---

## Freigabe eintragen

Sobald der Nachweis vorliegt, in `content/bildnachweise.json`:

```jsonc
"steak-teller": {
  "urheber_nachweis": true,
  "nachweis_fundstelle": "Nutzungsvertrag vom 12.08.2026, Ablage Ordner Recht",
  "personen_abgebildet": false,
  "personen_einwilligung": null,
  "freigabe": true,
  "freigabe_datum": "2026-08-12"
}
```

Danach `pnpm bilder` ausführen — das erzeugt die Ableitungen in AVIF, WebP und
JPEG in vier Breiten. Die Originale gehören nach `media-src/` und liegen
bewusst nicht im Git.

Die Seite `/bildnachweise/` entsteht aus derselben Datei. Register und
öffentliche Urhebernennung können deshalb nicht auseinanderlaufen — was
§ 13 UrhG verlangt, ist damit strukturell erfüllt statt organisatorisch
gehofft.
