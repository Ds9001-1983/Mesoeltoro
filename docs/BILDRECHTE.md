# Bildrechte

**Stand:** 28.07.2026 · **Status:** **freigegeben** — 16 Motive live

---

## Freigabe vom 28.07.2026

Der Auftraggeber hat gegenüber SUPERBRAND.marketing erklärt, dass

* die Nutzungsrechte an den Aufnahmen von **J. Schumacher** vorliegen und auf
  die heutige Meson el Toro GmbH übergegangen sind (§ 34 UrhG), und
* die **Einwilligungen der abgebildeten Personen** vorliegen
  (§ 22 KunstUrhG, Art. 6 Abs. 1 lit. a DSGVO).

Auf dieser Erklärung beruht jede Freigabe in `content/bildnachweise.json`;
sie steht dort in jedem Eintrag unter `nachweis_fundstelle`.

> **Was noch fehlt und nachgereicht werden sollte:** das zugrunde liegende
> Dokument selbst — Vertrag, Rechnung oder schriftliche Bestätigung des
> Fotografen. Die Erklärung des Auftraggebers trägt die Entscheidung, aber im
> Streitfall ist der Beleg das, was zählt. Er gehört in die Ablage Recht, und
> die Fundstelle gehört dann in jeden Registereintrag.

**16 Motive** sind kuratiert und freigegeben. Ausgewählt wurden sie am
geöffneten Bild, nicht nach Dateinamen — mit Folgen: Die vier Dateien
`IMG_6596_1`, `IMG_6611`, `IMG_6897_2_1` und `IMG_7401`, die dem Namen nach
wie Handyaufnahmen aussehen, sind die stärksten Aufnahmen des ganzen
Bestands. Sie sind allerdings nur 1500 px breit; eine höher aufgelöste Fassung
wäre beim Fotografen zu erfragen.

---

## Worum es ursprünglich ging

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

Zusätzlich gilt eine **Sperrliste**. Im Medienverzeichnis der alten
WordPress-Installation liegen zwei Sorten Fremdmaterial:

1. **Fotos aus anderen Kundenprojekten** desselben Fotografen —
   `JSchumacher_Theos_*`, `Claudios*`, `Simerilab*`, `pexels-*`, `220519_JS_*`.
2. **Das komplette Demo-Material des gekauften Themes `latulipe`** —
   `food-menu-1…17`, `top-img-1…10`, `team-1…8`, `portfolio-1…5`, `blog-1…9`,
   `menu-img*`, `page-p*`, `pricing-*`, `video-prev*`. Fremde Stockfotos, die
   aussehen, als gehörten sie zum Haus.

**Gruppe 2 stand bis zum 28.07.2026 nicht auf der Liste.** Der Guard hätte
`food-menu-3.jpg` anstandslos durchgelassen. Die Lücke fiel bei der
vollständigen Auswertung der Medienbibliothek auf (173 Dateien) und ist
geschlossen; `tests/unit/bildregister.test.ts` hält sie geschlossen.

Jeder Versuch, eine gesperrte Datei einzubinden, bricht den Build ab — auf
zwei Ebenen, in der Komponente und in der Nachprüfung.

---

## Hochskalierte Fassungen

Drei Bilder tragen im Register `grossformat: true` und bekommen dadurch
Ableitungen bis 2400 px — bei zwei davon durch **Hochskalieren**, weil die
Vorlage kleiner ist:

| Schlüssel | Vorlage | Zweck |
|---|---|---|
| `glut-grill` | 1766 px | Hero, vollflächig |
| `steak-teller` | 2000 px | obere Ebene des Anschnitts |
| `gastraum-band` | 3000 px | Bildband — nativ groß genug |

Das Verfahren ist Lanczos plus Nachschärfen, **kein KI-Upscaling**.
Real-ESRGAN und Verwandte erfinden Textur, die es nie gab; bei einem Foto von
echtem Essen wäre das eine Manipulation am Produktbild und ab 02.08.2026 ein
Fall für Art. 50 EU AI Act. Ein Lanczos-Resample ist keines von beidem und
braucht deshalb auch keine Kennzeichnung.

Hochskalieren fügt keine Bildinformation hinzu. Für ein wirklich scharfes
Vollbild braucht es eine Aufnahme ab 2400 px — das ist das konkrete Argument
für einen eigenen Drehtag.

## Die Bildmarke

`public/marke/signet.png` ist **kein Foto**, sondern das eigene Zeichen des
Auftraggebers. Es steht deshalb nicht im Fotoregister, sondern in der Liste
`EIGENE_GRAFIKEN` in `scripts/pruefe-bildrechte.mjs`. Die Rechtefrage ist eine
andere: nicht „dürfen wir ein fremdes Werk nutzen", sondern „führt der
Auftraggeber sein eigenes Zeichen". Offen bleibt, wer das Logo gestaltet hat
und ob dafür eine Vektordatei existiert.

Das Markenrot ist mit **`#551213`** belegt — ausgelesen aus `Logo-red.png`,
`Schriftzug-red.png` und `SchriftzugNEU-red.png`, drei unabhängige Dateien mit
identischem Wert.

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
