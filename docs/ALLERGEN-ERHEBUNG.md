# Allergen- und Zusatzstofferhebung

**Für:** Meson el Toro GmbH, Küchenleitung  
**Betrifft:** 38 Gerichte der aktuellen Karte  
**Erstellt:** 28.07.2026 — automatisch aus der Speisekarte erzeugt

---

## Warum das gebraucht wird

Nach Artikel 44 der Lebensmittelinformationsverordnung in Verbindung mit § 4 der
deutschen LMIDV muss ein Restaurant über die 14 Hauptallergene informieren.
Zulässig ist auch die **mündliche Auskunft** — aber nur, wenn darauf hingewiesen
wird **und** im Betrieb eine **schriftliche Dokumentation** vorliegt, die auf
Nachfrage einsehbar ist.

Genau diese Dokumentation entsteht mit dieser Tabelle. Sie erfüllt damit zwei
Zwecke auf einmal: Sie ist die Betriebsdokumentation, und sie ist die
Datengrundlage für die Website.

Solange sie fehlt, zeigt die Speisekarte im Netz einen Hinweisblock, der auf
telefonische Auskunft und das Servicepersonal verweist. Dieser Block verschwindet
automatisch, sobald alle Gerichte erfasst sind — er lässt sich nicht von Hand
abschalten.

## So wird ausgefüllt

Kreuzen Sie pro Gericht an, was **tatsächlich enthalten** ist — nicht, was
enthalten sein könnte. Spuren durch gemeinsame Arbeitsflächen sind über den
allgemeinen Hinweis auf der Karte abgedeckt.

Denken Sie an Beilagen und Saucen: Eine Sauce Béarnaise enthält Ei und Milch,
auch wenn sie nur danebensteht.

Enthält ein Gericht **nichts** Kennzeichnungspflichtiges, lassen Sie die Zeile
leer und setzen ein Häkchen in der Spalte „geprüft“. Das ist etwas anderes als
„noch nicht angeschaut“ — die Website unterscheidet beides ausdrücklich.

## Was danach passiert

Die Angaben wandern in die Dateien unter `content/speisekarte/`:

```jsonc
"allergene": ["A", "G"],
"zusatzstoffe": ["8"],
"kennzeichnung_status": "geprueft",
"kennzeichnung_stand": "2026-08-15",
"kennzeichnung_quelle": "Kuechenleitung, Rezeptur vom 10.08.2026",
"bestaetigt_von": "Christian Boehmer"
```

Der Build lässt `"geprueft"` ohne Datum, Quelle und verantwortliche Person nicht
durch. Das ist Absicht: Eine Kennzeichnung ohne Herkunft ist im Streitfall wertlos.

---

## Erhebungsbogen

### Vorspeisen

| Gericht | A | B | C | D | E | F | G | H | I | J | K | L | M | N | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | geprüft |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Gambas al Ajillo |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |
| Carpaccio vom Rinderfilet |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |
| Bunter Salatteller |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |
| Argentinischer Salat |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |
| Rinderkraftbrühe mit Sherry |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |
| Steinpilzsuppe |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |
| Tomatencremesuppe |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |

### Steaks „La Morocha“ vom Grill

| Gericht | A | B | C | D | E | F | G | H | I | J | K | L | M | N | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | geprüft |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Rumpsteak |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |
| Filetsteak |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |

### Fleisch und Fisch

| Gericht | A | B | C | D | E | F | G | H | I | J | K | L | M | N | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | geprüft |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Grillspieß |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |
| Filetsteak, 150 g |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |
| Gebratene Barbarie-Entenbrust |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |
| Kalbsfiletmedaillons „Florida“ |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |
| Kalbskotelett |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |
| Kalbstagliata |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |
| Lammkoteletts |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |
| Lachs vom Grill |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |
| Steinbuttfilet |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |
| Seezunge „Müllerin“ |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |

### Vegetarisch

| Gericht | A | B | C | D | E | F | G | H | I | J | K | L | M | N | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | geprüft |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Mediterranes Schmorgemüse |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |
| Salatteller mit Champignons |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |

### Beilagen und Saucen

| Gericht | A | B | C | D | E | F | G | H | I | J | K | L | M | N | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | geprüft |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Gemischter Salat |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |
| Pommes frites, Kroketten oder Bratkartoffeln |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |
| Gebackene Folienkartoffel |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |
| Frische Champignons |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |
| Spinat, Rosenkohl oder Brokkoli |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |
| Grillgemüse mediterran |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |
| Gemüse der Saison |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |
| Hausgemachte Kräuterbutter |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |
| Frisch geschlagene Sauce Béarnaise |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |
| Hausgemachte Aioli |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |
| Pfeffersauce |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |

### Desserts

| Gericht | A | B | C | D | E | F | G | H | I | J | K | L | M | N | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | geprüft |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Crema Catalana |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |
| Mousse au Chocolat |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |
| Gemischtes Eis mit Sahne |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |
| Vanilleeis mit heißen Himbeeren |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |
| Kugel Vanilleeis auf Mangosauce |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |
| Geeistes vom Espresso |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |

---

## Legende

### Allergene (Anhang II LMIV)

- **A** — Glutenhaltiges Getreide und daraus gewonnene Erzeugnisse
- **B** — Krebstiere und daraus gewonnene Erzeugnisse
- **C** — Eier und daraus gewonnene Erzeugnisse
- **D** — Fische und daraus gewonnene Erzeugnisse
- **E** — Erdnüsse und daraus gewonnene Erzeugnisse
- **F** — Sojabohnen und daraus gewonnene Erzeugnisse
- **G** — Milch und daraus gewonnene Erzeugnisse, einschließlich Laktose
- **H** — Schalenfrüchte, also Mandeln, Haselnüsse, Walnüsse, Cashewnüsse, Pecannüsse, Paranüsse, Pistazien, Macadamias, und daraus gewonnene Erzeugnisse
- **I** — Sellerie und daraus gewonnene Erzeugnisse
- **J** — Senf und daraus gewonnene Erzeugnisse
- **K** — Sesamsamen und daraus gewonnene Erzeugnisse
- **L** — Schwefeldioxid und Sulphite in Konzentrationen von mehr als 10 mg je Kilogramm oder Liter
- **M** — Lupinen und daraus gewonnene Erzeugnisse
- **N** — Weichtiere und daraus gewonnene Erzeugnisse

### Zusatzstoffe (§ 9 ZZulV)

- **1** — mit Farbstoff
- **2** — mit Konservierungsstoff
- **3** — mit Antioxidationsmittel
- **4** — mit Geschmacksverstärker
- **5** — geschwefelt
- **6** — geschwärzt
- **7** — gewachst
- **8** — mit Phosphat
- **9** — mit Süßungsmittel
- **10** — enthält eine Phenylalaninquelle
- **11** — koffeinhaltig
- **12** — chininhaltig
- **13** — mit Nitritpökelsalz

---

## Bestätigung

Die vorstehenden Angaben entsprechen den tatsächlich verwendeten Zutaten.

Datum: ________________  Name: ______________________  Unterschrift: ______________________
