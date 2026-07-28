# Übergabe

**Website der Meson el Toro GmbH** · Stand 28.07.2026

Dieses Dokument richtet sich an den Kunden und an alle, die diese Website
künftig betreuen. Es beantwortet drei Fragen: Was muss noch geliefert werden,
wie ändert man Inhalte, und was darf man auf keinen Fall tun.

---

## 1. Was noch fehlt — bevor die Seite live gehen kann

Diese sechs Punkte sind **blockierend**. Ohne sie geht die Seite nicht online.

| # | Was | Warum | Wer |
|---|-----|-------|-----|
| 1 | **Allergen- und Zusatzstoffmatrix** für alle 38 Gerichte | Art. 44 LMIV, § 4 LMIDV. Vorlage liegt bei: `docs/ALLERGEN-ERHEBUNG.md` | Küchenleitung |
| 2 | **Fotorechte J. Schumacher** — Vertrag oder Rechnung mit Rechteumfang, und ob die Lizenz beim Betreiberwechsel 2023 auf die heutige GmbH übergegangen ist (§ 34 UrhG) | Ohne Nachweis geht kein Foto live | Geschäftsführung |
| 3 | **Einwilligungen abgebildeter Personen** (§ 22 KunstUrhG) | Betrifft mindestens das Weinregal-Motiv | Geschäftsführung |
| 4 | **Bestätigung der Registerdaten** — HRB 16767, Amtsgericht Siegburg, USt-IdNr. DE 348118893 | Übernommen aus dem alten Impressum, nicht gegengeprüft | Geschäftsführung |
| 5 | **Beleg für „Weidehaltung“** und für die argentinische Herkunft, falls diese Aussagen zurück auf die Seite sollen | § 5 UWG — ohne Beleg gesperrt | Geschäftsführung |
| 6 | **Erhebung „Zugänglichkeit des Hauses“** — Stufen am Eingang, WC, Tischabstände | Damit auf `/kontakt/` keine Behauptung steht, die nicht stimmt | Geschäftsführung |

Nicht blockierend, aber vor dem Livegang zu erledigen:

- **Auftragsverarbeitungsvertrag mit Vercel** abschließen und ablegen
- **Jahresumsatz 2025** dokumentieren — er belegt zusammen mit der
  Mitarbeiterzahl die Kleinstunternehmen-Ausnahme nach § 3 Abs. 3 BFSG
- **Zugang zum Google-Unternehmensprofil** klären
- **Anwaltliche Endabnahme** von Claim-Matrix, Allergenkennzeichnung und
  BFSG-Einordnung

---

## 2. Inhalte ändern — ohne Entwickler

Alle Inhalte liegen im Ordner `content/`. Das sind Textdateien, keine
Programmdateien. Sie lassen sich **direkt im Browser** bearbeiten, ohne dass
etwas installiert werden muss.

### So geht es

1. Das Projekt auf GitHub öffnen.
2. In der Adresszeile `github.com` durch **`github.dev`** ersetzen und Enter
   drücken. Es öffnet sich ein vollwertiger Editor im Browser.
3. Links im Dateibaum den Ordner `content/` aufklappen.
4. Datei anklicken, ändern, links auf den Haken „Commit & Push“ klicken.
5. Fertig. Die Seite baut sich neu und ist nach ein bis zwei Minuten aktuell.

Beim Tippen schlägt der Editor gültige Werte vor und markiert Fehler sofort
rot — dafür sorgen die Schema-Dateien in `content/schema/`.

### Was wo steht

| Datei | Inhalt |
|-------|--------|
| `content/restaurant.json` | Adresse, Telefon, Öffnungszeiten, Schließtage, Registerdaten |
| `content/speisekarte/*.json` | Die Karte, nach Kategorien getrennt |
| `content/kataloge/` | Allergen- und Zusatzstoffliste (ändert sich praktisch nie) |
| `content/wein.json` | Weinfachhandel |
| `content/faq.json` | Häufige Fragen auf der Kontaktseite |
| `content/historie.json` | Die Jahreszahlen |
| `content/texte/*.md` | Impressum, Datenschutz, Barrierefreiheit |
| `content/bildnachweise.json` | Bildregister und Rechtenachweise |
| `content/claims.json` | Gesperrte Werbeaussagen |

### Einen Preis ändern

In `content/speisekarte/` die passende Datei öffnen, das Gericht suchen, den
Preis ändern. **Wichtig:** Immer mit Komma und genau zwei Nachkommastellen,
ohne Euro-Zeichen.

```jsonc
{ "bezeichnung": "200 g", "preis": "23,50" }
```

`"23,5"` oder `"23.50"` bricht den Build ab — mit einer deutschen
Fehlermeldung, die sagt, was zu tun ist. Das ist kein Schikane, sondern
verhindert, dass auf der Seite „23,5 €“ steht.

Nach einer Preisänderung bitte auch `content/speisekarte/_meta.json` anpassen:

```jsonc
"stand": "2026-09-01"
```

Dieses Datum steht sichtbar auf der Karte.

### Ein Gericht vorübergehend herausnehmen

Nicht löschen — auf `"verfuegbar": false` setzen. Dann verschwindet es von der
Seite, die Daten bleiben aber erhalten.

### Öffnungszeiten ändern

In `content/restaurant.json` unter `regulaer`. Ein leeres `[]` bedeutet
Ruhetag. Zwei Zeiträume je Tag sind normal:

```jsonc
"mittwoch": [["12:00", "14:00"], ["18:00", "22:00"]]
```

Wichtig: Auch `geprueft_bis` mitziehen. Läuft das Datum ab, meldet sich die
Wartungsprüfung.

---

## 3. Was auf keinen Fall passieren darf

| Nicht tun | Warum |
|-----------|-------|
| **Eine Schriftart, ein Skript oder ein Bild von einem fremden Server einbinden** | Löst die Einwilligungspflicht nach § 25 TDDDG aus. Dann braucht die Seite ein Cookie-Banner — und verliert einen ihrer größten Vorteile. Der Build bricht ab, wenn es doch passiert. |
| **Google Maps, YouTube, Instagram-Feed oder ein Buchungs-Widget einbetten** | Dasselbe. Für die Karte gibt es das selbst gezeichnete SVG. |
| **Ein Formular einbauen** | Zieht die Seite möglicherweise in den Anwendungsbereich des BFSG und macht einen Auftragsverarbeitungsvertrag nötig. Vorher besprechen. |
| **Werbeaussagen wie „nachhaltig“, „reich an Omega-3“ oder „aus Weidehaltung“ verwenden** | Alle drei sind rechtlich beanstandet. Der Build bricht ab. Details in `content/claims.json`. |
| **Ein Foto ohne Registereintrag einbinden** | Der Build bricht ab. Bilder laufen ausschließlich über `content/bildnachweise.json`. |
| **Einen Mehrwertsteuersatz auf die Karte schreiben** | Seit 01.01.2026 gelten 7 % auf Speisen und 19 % auf Getränke. Eine einzelne Zahl wäre für die halbe Karte falsch. „inklusive gesetzlicher Mehrwertsteuer“ genügt und bleibt immer richtig. |
| **Bewertungen zeigen ohne den Prüfhinweis** | § 5b Abs. 3 UWG. Der Hinweis wird technisch erzwungen — er lässt sich nicht abschalten. |

---

## 4. Wenn etwas schiefgeht

Der Build prüft vor jeder Veröffentlichung:

```
pnpm pruefen        Typen, Zeitlogik, Preisformate, Kontraste, Pflichtangaben
pnpm build          erzeugt die Seite und prüft danach Claims, Bildrechte,
                    Fremdanfragen
pnpm test:e2e       117 Prüfungen im echten Browser
```

**Schlägt eine Prüfung fehl, wird nicht veröffentlicht.** Die alte Fassung
bleibt online. Die Fehlermeldung nennt Datei, Ursache und Abhilfe auf Deutsch.

Rollback: Im Vercel-Dashboard eine frühere Bereitstellung auswählen und
„Promote to Production“ klicken. Das wirkt sofort.

---

## 5. Wiedervorlage

| Wann | Was |
|------|-----|
| **monatlich** | Automatischer Lauf prüft abgelaufene Datumsangaben und öffnet bei Bedarf einen Hinweis |
| **jährlich** | `geprueft_bis` in `restaurant.json` verlängern, Öffnungszeiten und Schließtage gegenprüfen |
| **jährlich** | Mitarbeiterzahl und Jahresumsatz für die BFSG-Einordnung dokumentieren |
| **bei jeder Preisänderung** | `stand` in `_meta.json` mitziehen |
| **bei jeder Rezepturänderung** | Allergenangaben des betroffenen Gerichts prüfen |
| **ab Oktober 2026** | Prüfen, ob EN 301 549 v4.1.1 mit WCAG 2.2 im EU-Amtsblatt steht |

---

## 6. Zur Kenntnis: Wie die Seite rechtlich steht

Diese Website unterliegt dem Barrierefreiheitsstärkungsgesetz **nach unserer
Einschätzung nicht** — sie ist eine reine Informationsseite ohne
Vertragsschluss, und die Meson el Toro GmbH ist mit acht Beschäftigten ein
Kleinstunternehmen nach § 3 Abs. 3 BFSG.

Gebaut wurde trotzdem nach **WCAG 2.2 Stufe AA**, geprüft und dokumentiert.
Zugesagt ist „angestrebt, geprüft und dokumentiert“ — **keine
Konformitätsgarantie**. Eine Prüfung durch eine unabhängige Stelle hat nicht
stattgefunden.

**Die Ausnahme kippt**, sobald zehn Personen beschäftigt sind oder der
Jahresumsatz zwei Millionen Euro übersteigt. Dann gilt die Pflicht für die
gesamte Website, nicht nur für einzelne Funktionen. Bitte jährlich prüfen.

Dieses Dokument ersetzt keine Rechtsberatung.

---

*Made with ❤️ by [SUPERBRAND.marketing](https://superbrand.marketing) – Dein Superheld für deine Werbung.*
