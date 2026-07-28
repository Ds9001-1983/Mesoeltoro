# Mesón el Toro — Website

Spanisches Restaurant & Steakhouse, Waldbröl. Seit 1975.

Statische Website ohne Backend, ohne Cookies, ohne Anfragen an fremde Server.

## Loslegen

```bash
pnpm install
pnpm dev            # http://localhost:4321
```

## Befehle

| Befehl | Was passiert |
|--------|--------------|
| `pnpm dev` | Entwicklungsserver |
| `pnpm build` | Baut nach `dist/` und prüft danach Claims, Bildrechte, Fremdanfragen |
| `pnpm preview` | Gebaute Fassung ansehen |
| `pnpm pruefen` | Typen, Einheitentests, Inhalte, Kontraste |
| `pnpm test:e2e` | 117 Prüfungen im Browser über 4 Projekte |
| `pnpm bilder` | Bildableitungen aus `media-src/` erzeugen |

## Inhalte ändern

Alles unter `content/`. Ohne Installation im Browser über **github.dev**
bearbeitbar — Schritt für Schritt erklärt in [docs/UEBERGABE.md](docs/UEBERGABE.md).

## Vor dem Mitarbeiten

[CLAUDE.md](CLAUDE.md) lesen. Dort steht, was hier bewusst **nicht** gebaut ist
und warum — das erspart Diskussionen, die schon geführt wurden.

---

Made with ❤️ by [SUPERBRAND.marketing](https://superbrand.marketing)
