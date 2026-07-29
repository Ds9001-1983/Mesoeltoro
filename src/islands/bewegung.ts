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

/*
 * Muss VOR setzeModus() stehen, nicht erst beim Abschnitt „Pausetaste“.
 *
 * setzeModus('off') ruft setzePause(false) auf, und setzePause() greift auf
 * diese Liste zu. Stünde sie weiter unten, liefe ein gespeichertes „off“
 * beim Start in die temporale Totzone der const-Bindung — ReferenceError,
 * und mit ihm fiele die gesamte Bewegungssteuerung aus. Die Funktionen
 * selbst sind Deklarationen und damit hochgezogen; eine const ist es nicht.
 */
const pausetasten = document.querySelectorAll<HTMLButtonElement>('[data-pausetaste]')

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

  /*
   * Im Modus „off“ steht ohnehin alles; eine aktive Pause wäre dann sinnlos
   * und würde beim Zurückschalten einen eingefrorenen Zustand hinterlassen.
   *
   * Hier stand bis zum 29.07.2026 `delete wurzel.dataset['motionPaused']`.
   * Das setzte nur das Attribut am <html> zurück — aria-pressed und die
   * Beschriftung der Tasten blieben auf „gedrückt“ stehen. Die Umschaltung
   * in Zeile 120 liest danach den geleerten Datensatz und dreht folgerichtig
   * in die falsche Richtung: Der nächste Klick auf eine Taste, die
   * „Bewegung fortsetzen“ anbietet, HÄLT AN. Für Screenreader war der
   * Zustand ab da dauerhaft falsch angesagt.
   */
  if (modus === 'off') {
    setzePause(false)
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
