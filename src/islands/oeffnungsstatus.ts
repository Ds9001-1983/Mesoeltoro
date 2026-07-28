/**
 * „Der Küchenpass“ — zeigt den echten Öffnungszustand.
 *
 * Rund 1 KB. Der Zustand wird im Browser gerechnet, nicht beim Bauen: Eine
 * statisch erzeugte Seite kennt nur den Zeitpunkt ihres Deployments.
 *
 * Drei Dinge, die hier bewusst so gelöst sind:
 *
 *  1. Die Pille ist im Markup `hidden` und bekommt trotzdem ihre Höhe
 *     reserviert. Ohne JavaScript erscheint sie nie — und behauptet damit
 *     auch nichts Falsches. Mit JavaScript springt nichts (kein CLS).
 *
 *  2. Kein `aria-live`. Der Zustand ändert sich nicht, während jemand liest;
 *     eine Live-Region würde beim Seitenaufbau ins Wort fallen. Die
 *     vollständige Zeitentabelle steht ohnehin daneben.
 *
 *  3. Plausibilitätsprüfung: Liegt die Uhr des Geräts VOR dem Bauzeitpunkt,
 *     ist sie falsch gestellt. Dann bleibt die Pille verborgen, statt eine
 *     Öffnungszeit zu raten. Lieber keine Auskunft als eine falsche.
 */

import { ermittleStatus, type Status, type ZeitenKonfiguration } from '../lib/zeiten.ts'

const behaelter = document.querySelectorAll<HTMLElement>('[data-oeffnungsstatus]')
if (behaelter.length === 0) throw new Error('kein Statusband auf dieser Seite')

const konfigurationsknoten = document.querySelector<HTMLScriptElement>('#zeiten-konfiguration')
if (!konfigurationsknoten?.textContent) {
  throw new Error('Zeitkonfiguration fehlt im Markup')
}

const konfiguration = JSON.parse(konfigurationsknoten.textContent) as ZeitenKonfiguration

/** Aus <meta name="build-time"> — der früheste plausible Zeitpunkt. */
function bauzeitpunkt(): Date | null {
  const wert = document
    .querySelector<HTMLMetaElement>('meta[name="build-time"]')
    ?.getAttribute('content')
  if (!wert) return null
  const zeitpunkt = new Date(wert)
  return Number.isNaN(zeitpunkt.getTime()) ? null : zeitpunkt
}

function zeichne(status: Status): void {
  for (const knoten of behaelter) {
    const textknoten = knoten.querySelector<HTMLElement>('[data-oeffnungsstatus-text]')
    if (textknoten) textknoten.textContent = status.text
    knoten.dataset['zustand'] = status.art
    knoten.hidden = false
  }
}

function aktualisiere(): void {
  const jetzt = new Date()
  const gebaut = bauzeitpunkt()

  // Uhr des Geräts liegt vor dem Bauzeitpunkt → unbrauchbar.
  if (gebaut && jetzt.getTime() < gebaut.getTime() - 60_000) {
    for (const knoten of behaelter) knoten.hidden = true
    return
  }

  zeichne(ermittleStatus(jetzt, konfiguration))
}

aktualisiere()

// Einmal pro Minute nachziehen. Wer die Seite über einen Öffnungswechsel
// hinweg offen lässt, soll nicht die alte Auskunft sehen.
window.setInterval(aktualisiere, 60_000)

// Rückkehr aus dem Hintergrund: Zwischenzeitlich kann eine Stunde vergangen sein.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') aktualisiere()
})

export {}
