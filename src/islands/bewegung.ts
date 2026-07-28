/**
 * Bewegungssteuerung — drei Modi, ein Schalter, eine Pausetaste.
 *
 * Modi:
 *   full     alles läuft
 *   reduced  zeitgesteuerte Bewegung aus, scroll-getriebene bleibt
 *   off      auch scroll-getriebene Bewegung aus, Seitenwechsel ohne Blende
 *
 * Vorgabe ist `reduced`, sobald das System `prefers-reduced-motion` meldet.
 * Die bewusste Wahl im Fuß schlägt die Systemeinstellung in BEIDE Richtungen —
 * sonst wäre der Schalter für Nutzer mit gesetztem Systemflag eine Attrappe.
 *
 * Ohne JavaScript bleibt `data-motion="full"` aus dem Markup stehen. Das ist
 * richtig so: Dann läuft nur CSS, und CSS respektiert die Media Query von
 * sich aus. Der Schalter wird gar nicht erst eingeblendet, weil er ohne
 * JavaScript nichts bewirken könnte.
 */

type Modus = 'full' | 'reduced' | 'off'

const SPEICHER = 'meson:bewegung'
const MODI: readonly Modus[] = ['full', 'reduced', 'off']

const wurzel = document.documentElement

function istModus(wert: unknown): wert is Modus {
  return typeof wert === 'string' && (MODI as readonly string[]).includes(wert)
}

function systemVorgabe(): Modus {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'reduced' : 'full'
}

function gespeicherterModus(): Modus | null {
  try {
    const wert = window.localStorage.getItem(SPEICHER)
    return istModus(wert) ? wert : null
  } catch {
    // Privater Modus oder gesperrter Speicher. Kein Grund, die Seite zu brechen.
    return null
  }
}

function merken(modus: Modus): void {
  try {
    window.localStorage.setItem(SPEICHER, modus)
  } catch {
    /* nicht kritisch — die Einstellung gilt dann nur für diese Sitzung */
  }
}

function setzeModus(modus: Modus, speichern: boolean): void {
  wurzel.dataset['motion'] = modus

  // Im Modus „off“ steht ohnehin alles; eine aktive Pause wäre dann sinnlos
  // und würde beim Zurückschalten einen eingefrorenen Zustand hinterlassen.
  if (modus === 'off') {
    delete wurzel.dataset['motionPaused']
  }

  if (speichern) merken(modus)

  // Der Shader hört hierauf, statt selbst am DOM zu lauschen.
  window.dispatchEvent(new CustomEvent<Modus>('meson:bewegung', { detail: modus }))
}

/* --- Start ---------------------------------------------------------------- */

const anfangsmodus = gespeicherterModus() ?? systemVorgabe()
setzeModus(anfangsmodus, false)

/* --- Schalter im Fuß ------------------------------------------------------ */

const schalter = document.querySelector<HTMLFieldSetElement>('[data-bewegungsschalter]')

if (schalter) {
  // Erst jetzt sichtbar: Ab hier funktioniert er auch.
  schalter.hidden = false

  const gewaehlt = schalter.querySelector<HTMLInputElement>(`input[value="${anfangsmodus}"]`)
  if (gewaehlt) gewaehlt.checked = true

  schalter.addEventListener('change', (ereignis) => {
    const ziel = ereignis.target
    if (ziel instanceof HTMLInputElement && istModus(ziel.value)) {
      setzeModus(ziel.value, true)
    }
  })
}

/* --- Pausetaste -----------------------------------------------------------
 * Eigenständig neben dem Modus-Schalter, weil 2.2.2 einen Mechanismus AUF
 * DER SEITE verlangt. Eine Media Query ist kein Mechanismus auf der Seite —
 * das ist der Punkt, an dem die meisten Umsetzungen scheitern.
 */

const pausetasten = document.querySelectorAll<HTMLButtonElement>('[data-pausetaste]')

function setzePause(pausiert: boolean): void {
  if (pausiert) {
    wurzel.dataset['motionPaused'] = 'true'
  } else {
    delete wurzel.dataset['motionPaused']
  }

  for (const taste of pausetasten) {
    taste.setAttribute('aria-pressed', String(pausiert))
    const beschriftung = taste.querySelector<HTMLElement>('[data-pausetaste-text]')
    if (beschriftung) {
      beschriftung.textContent = pausiert ? 'Bewegung fortsetzen' : 'Bewegung pausieren'
    }
  }

  window.dispatchEvent(new CustomEvent<boolean>('meson:pause', { detail: pausiert }))
}

for (const taste of pausetasten) {
  taste.hidden = false
  taste.addEventListener('click', () => {
    setzePause(wurzel.dataset['motionPaused'] !== 'true')
  })
}

/* --- Systemeinstellung ändert sich zur Laufzeit ---------------------------
 * Nur übernehmen, wenn der Nutzer nicht selbst gewählt hat — sonst würde
 * eine Systemänderung eine bewusste Entscheidung überschreiben.
 */
window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (ereignis) => {
  if (gespeicherterModus() === null) {
    setzeModus(ereignis.matches ? 'reduced' : 'full', false)
  }
})

export {}
