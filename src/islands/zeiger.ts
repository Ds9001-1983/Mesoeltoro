/**
 * „Der Zeiger“ — eigener Mauszeiger.
 *
 * Der Skill führt ihn als Pflicht auf der gesamten Site. Meine erste
 * Ablehnung war zu pauschal: Als reine Dekorationsschicht ist er zulässig.
 * Die Auflagen, die ihn zulässig machen, stehen unten und sind alle im Code
 * durchgesetzt, nicht bloß dokumentiert.
 *
 *  · Nur bei feinem Zeigegerät. Auf Touch gibt es keinen Cursor, den man
 *    ersetzen könnte — dort lädt das Modul gar nichts.
 *  · Der System-Cursor wird NICHT ausgeblendet. Ein Ring läuft mit, das
 *    Original bleibt sichtbar. Wer den Systemzeiger vergrößert hat oder
 *    einen Bildschirmvergrößerer benutzt, verliert dadurch nichts.
 *  · `pointer-events: none`, und der Ring liegt unter jedem Bedienelement.
 *    Er kann weder einen Klick abfangen noch einen Fokusring verdecken.
 *  · Bei `prefers-reduced-motion` oder Bewegungsmodus ≠ „voll“ startet er
 *    nicht. Bei `forced-colors: active` blendet ihn das Stylesheet aus.
 *  · Er trägt keine Information. Fällt er aus, fehlt nichts.
 *
 * Rund 1 KB. Die Nachlaufbewegung läuft über requestAnimationFrame statt
 * über eine CSS-Transition, weil eine Transition auf `translate` bei jedem
 * Mausereignis neu startet und dadurch ruckelt.
 */

const wurzel = document.documentElement

const feinerZeiger = window.matchMedia('(pointer: fine) and (hover: hover)')
const wenigerBewegung = window.matchMedia('(prefers-reduced-motion: reduce)')

function darfLaufen(): boolean {
  return feinerZeiger.matches && !wenigerBewegung.matches && wurzel.dataset['motion'] === 'full'
}

let ring: HTMLElement | null = null
let schleife = 0

/** Zielposition (Maus) und gezeichnete Position (Ring). */
let zielX = -100
let zielY = -100
let istX = -100
let istY = -100

function beiBewegung(ereignis: PointerEvent): void {
  zielX = ereignis.clientX
  zielY = ereignis.clientY
  if (ring && ring.dataset['sichtbar'] !== 'ja') ring.dataset['sichtbar'] = 'ja'
}

function beiVerlassen(): void {
  if (ring) ring.dataset['sichtbar'] = 'nein'
}

/**
 * Über Bedienelementen wächst der Ring. Das ist der einzige „Zustand“, den
 * er kennt — und er ist redundant: Jedes Bedienelement hat zusätzlich einen
 * eigenen Hover-Zustand. Der Ring allein trägt nie eine Aussage (1.4.1).
 */
function beiZielwechsel(ereignis: PointerEvent): void {
  if (!ring) return
  const ziel = ereignis.target
  const aktiv = ziel instanceof Element && ziel.closest('a, button, [role="button"], summary')
  ring.dataset['gross'] = aktiv ? 'ja' : 'nein'
}

function zeichne(): void {
  schleife = requestAnimationFrame(zeichne)
  // Nachlauf: 0,18 pro Bild ergibt eine ruhige, nicht schwammige Bewegung.
  istX += (zielX - istX) * 0.18
  istY += (zielY - istY) * 0.18
  if (ring) ring.style.translate = `${istX}px ${istY}px`
}

function starte(): void {
  if (ring) return
  ring = document.createElement('div')
  ring.className = 'zeiger'
  ring.setAttribute('aria-hidden', 'true')
  ring.dataset['sichtbar'] = 'nein'
  document.body.append(ring)

  window.addEventListener('pointermove', beiBewegung, { passive: true })
  window.addEventListener('pointerover', beiZielwechsel, { passive: true })
  document.addEventListener('pointerleave', beiVerlassen)
  schleife = requestAnimationFrame(zeichne)
}

function halte(): void {
  if (!ring) return
  cancelAnimationFrame(schleife)
  window.removeEventListener('pointermove', beiBewegung)
  window.removeEventListener('pointerover', beiZielwechsel)
  document.removeEventListener('pointerleave', beiVerlassen)
  ring.remove()
  ring = null
}

function pruefe(): void {
  if (darfLaufen()) starte()
  else halte()
}

pruefe()

feinerZeiger.addEventListener('change', pruefe)
wenigerBewegung.addEventListener('change', pruefe)
// Der Schalter in der Fußzeile meldet jeden Moduswechsel — der Zeiger folgt.
window.addEventListener('meson:bewegung', pruefe)

export {}
