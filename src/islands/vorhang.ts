/**
 * „Der Vorhang“ — Ladeanzeige mit echtem Fortschritt.
 *
 * Der Skill fordert einen Preloader mit echtem Progress. Meine erste
 * Ablehnung stützte sich auf WCAG 2.2.1 („Timing Adjustable“) — das war
 * falsch angewandt. 2.2.1 zielt auf Fristen, die dem Nutzer Inhalt entziehen
 * oder ihn zur Eile zwingen. Eine Ladeanzeige, die endet, sobald geladen ist,
 * setzt keine Frist.
 *
 * Kritisch ist etwas anderes, und danach ist dieses Modul gebaut:
 *
 *  1. KEINE künstliche Mindestdauer. Fertig ist fertig. Eine erzwungene
 *     Wartezeit wäre ein von der Seite gesetztes Zeitlimit — und genau das
 *     verbietet 2.2.1 tatsächlich.
 *  2. Der Vorhang darf das Rendering nicht blockieren. Er liegt ÜBER bereits
 *     gerendertem Inhalt. Bricht das Skript, ist die Seite trotzdem da.
 *  3. Kein Fokusraub, kein aria-live, keine Tastaturfalle. Der Vorhang ist
 *     `aria-hidden` und `inert`; für Screenreader existiert er nicht.
 *  4. Bei reduzierter Bewegung erscheint er gar nicht erst.
 *  5. Harte Auflage aus dem Plan: Verschlechtert er den LCP messbar, fliegt
 *     er raus. Deshalb wird er nur bei einem KALTEN Aufruf gezeigt — bei
 *     Folgeaufrufen innerhalb einer Sitzung ist ohnehin alles im Cache und
 *     eine Ladeanzeige wäre reine Behauptung.
 */

const wurzel = document.documentElement

/* --- Startbedingungen ------------------------------------------------------ */

function darfLaufen(): boolean {
  if (wurzel.dataset['motion'] !== 'full') return false
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false

  // Nur beim ersten Aufruf einer Sitzung. Danach liegen Schriften und Bilder
  // im Cache; ein Vorhang würde eine Ladezeit vortäuschen, die es nicht gibt.
  try {
    if (sessionStorage.getItem('meson:vorhang') === 'gesehen') return false
    sessionStorage.setItem('meson:vorhang', 'gesehen')
  } catch {
    // Privater Modus ohne sessionStorage: dann eben jedes Mal. Kein Fehler.
  }

  // Rückwärtsnavigation und Wiederherstellung aus dem bfcache: Der Inhalt war
  // schon da, ein Vorhang wäre ein Rückschritt.
  const [navigation] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
  if (navigation && navigation.type !== 'navigate') return false

  return true
}

if (darfLaufen()) {
  const vorhang = document.createElement('div')
  vorhang.className = 'vorhang'
  vorhang.setAttribute('aria-hidden', 'true')
  vorhang.inert = true
  vorhang.innerHTML =
    '<span class="vorhang__strich"><span class="vorhang__fuellung"></span></span>'

  const fuellung = vorhang.querySelector<HTMLElement>('.vorhang__fuellung')
  document.body.append(vorhang)
  wurzel.dataset['vorhang'] = 'laeuft'

  /* --- Echter Fortschritt --------------------------------------------------
   * Zwei Meilensteine, die tatsächlich etwas bedeuten:
   *   · die Schriften stehen  → der Text springt nicht mehr um
   *   · das Hero-Bild ist dekodiert → das größte Element ist gezeichnet
   * Ein hochzählender Balken ohne Bezug wäre eine Fake-Progress-Animation,
   * und die steht im Skill selbst auf der Anti-Pattern-Liste.
   */

  let erledigt = 0
  const schritte = 2

  const melde = () => {
    erledigt += 1
    if (fuellung) fuellung.style.transform = `scaleX(${erledigt / schritte})`
    if (erledigt >= schritte) beende()
  }

  let beendet = false
  function beende(): void {
    if (beendet) return
    beendet = true
    wurzel.dataset['vorhang'] = 'faellt'
    // Erst nach dem Aufziehen entfernen, sonst springt die Fläche weg.
    vorhang.addEventListener('transitionend', () => vorhang.remove(), { once: true })
    // Falls die Transition nie feuert (Tab im Hintergrund), trotzdem aufräumen.
    window.setTimeout(() => vorhang.remove(), 1200)
  }

  document.fonts.ready.then(melde, melde)

  const held = document.querySelector<HTMLImageElement>('img[fetchpriority="high"], img')
  if (held && !held.complete) {
    held.decode().then(melde, melde)
  } else {
    melde()
  }

  // Notbremse: Hängt eine Ressource, ist der Vorhang nach zwei Sekunden weg.
  // Er darf niemals der Grund sein, warum jemand die Seite nicht sieht.
  window.setTimeout(beende, 2000)
}

export {}
