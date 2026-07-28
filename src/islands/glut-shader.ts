/**
 * „Die Glut“ — der einzige WebGL-Effekt des Projekts.
 *
 * Rund 3 KB plus OGL (~10 KB gzip). Three.js wäre mit 150–200 KB das
 * Zehnfache für dieselbe Sache: ein Fullscreen-Fragment-Shader auf einer
 * Fläche. Echte Geometrie gibt es hier nicht.
 *
 * Der Shader startet NUR, wenn alle Bedingungen erfüllt sind:
 *   · Bewegungsmodus „voll“
 *   · WebGL-Kontext vorhanden
 *   · mehr als zwei Prozessorkerne
 *   · kein Save-Data-Hinweis des Browsers
 *   · Fenster mindestens 640px breit
 *   · Sektion tatsächlich im Bild (IntersectionObserver)
 *
 * Fällt eine Bedingung weg, bleibt es beim dunklen Grund. Der Canvas liegt
 * ohnehin hinter dem Inhalt und trägt keine Information — es fehlt also
 * nichts, es sieht nur ruhiger aus.
 */

import { Mesh, Program, Renderer, Triangle } from 'ogl'

import fragment from '../shaders/glut.frag.glsl?raw'

const canvas = document.querySelector<HTMLCanvasElement>('[data-glut-canvas]')
if (!canvas) throw new Error('kein Glut-Canvas auf dieser Seite')

const gefundenerAbschnitt = canvas.closest('section')
if (!gefundenerAbschnitt) throw new Error('Glut-Canvas ohne umgebende Sektion')

// Eigene Konstante statt der verengten: TypeScript trägt die Verengung nicht
// über Funktionsgrenzen hinweg, und baueAuf() greift mehrfach darauf zu.
const abschnitt: HTMLElement = gefundenerAbschnitt

/* --- Startbedingungen ------------------------------------------------------ */

function darfLaufen(): boolean {
  if (document.documentElement.dataset['motion'] !== 'full') return false
  if (window.innerWidth < 640) return false
  if ((navigator.hardwareConcurrency ?? 0) <= 2) return false

  const verbindung = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  if (verbindung?.saveData) return false

  return true
}

/* --- Farben aus den Design-Token ------------------------------------------
 * Nicht im Shader hart verdrahtet: Ändert jemand die Palette in tokens.css,
 * zieht die Glut mit. Sonst hätten wir eine zweite Farbwahrheit.
 */

function alsRgb(variable: string, ersatz: [number, number, number]): [number, number, number] {
  const wert = getComputedStyle(document.documentElement).getPropertyValue(variable).trim()
  const treffer = /^#([0-9a-f]{6})$/i.exec(wert)
  if (!treffer) return ersatz
  const zahl = Number.parseInt(treffer[1] as string, 16)
  return [((zahl >> 16) & 255) / 255, ((zahl >> 8) & 255) / 255, (zahl & 255) / 255]
}

/* --- Aufbau ---------------------------------------------------------------- */

let renderer: Renderer | null = null
let laeuft = false
let bildschleife = 0
let startzeit = 0
let pausiertBei = 0

const vertex = /* glsl */ `
  attribute vec2 uv;
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`

function baueAuf(): boolean {
  try {
    renderer = new Renderer({
      canvas: canvas as HTMLCanvasElement,
      alpha: false,
      antialias: false,
      // Über 1.5 kostet der Shader spürbar Leistung, ohne sichtbar besser
      // zu werden — es sind weiche Partikel, keine harten Kanten.
      dpr: Math.min(window.devicePixelRatio, 1.5),
    })
  } catch {
    return false
  }

  const gl = renderer.gl
  gl.clearColor(0, 0, 0, 1)

  const programm = new Program(gl, {
    vertex,
    fragment,
    uniforms: {
      uZeit: { value: 0 },
      uAufloesung: { value: [1, 1] },
      uGlut: { value: alsRgb('--ember', [0.757, 0.267, 0.055]) },
      uGrund: { value: alsRgb('--espresso', [0.169, 0.145, 0.129]) },
    },
  })

  const flaeche = new Mesh(gl, { geometry: new Triangle(gl), program: programm })

  const messen = () => {
    if (!renderer) return
    const kasten = abschnitt.getBoundingClientRect()
    renderer.setSize(kasten.width, kasten.height)
    programm.uniforms['uAufloesung'].value = [gl.canvas.width, gl.canvas.height]
  }

  messen()
  new ResizeObserver(messen).observe(abschnitt)

  // 30 Bilder pro Sekunde reichen für aufsteigende Glut vollkommen und
  // halbieren die Last auf schwächeren Geräten.
  const bildabstand = 1000 / 30
  let letztes = 0

  const zeichne = (jetzt: number) => {
    if (!laeuft) return
    bildschleife = requestAnimationFrame(zeichne)

    if (jetzt - letztes < bildabstand) return
    letztes = jetzt

    programm.uniforms['uZeit'].value = (jetzt - startzeit) / 1000
    renderer?.render({ scene: flaeche })
  }

  const starte = () => {
    if (laeuft) return
    laeuft = true
    // Zeit fortsetzen statt zurückspringen — sonst zuckt das Bild.
    startzeit = performance.now() - pausiertBei
    bildschleife = requestAnimationFrame(zeichne)
  }

  const halte = () => {
    if (!laeuft) return
    laeuft = false
    pausiertBei = performance.now() - startzeit
    cancelAnimationFrame(bildschleife)
  }

  /* --- Nur rechnen, wenn sichtbar ---------------------------------------- */

  const beobachter = new IntersectionObserver(
    (eintraege) => {
      const sichtbar = eintraege.some((eintrag) => eintrag.isIntersecting)
      if (sichtbar && document.documentElement.dataset['motionPaused'] !== 'true') starte()
      else halte()
    },
    { rootMargin: '120px' },
  )
  beobachter.observe(abschnitt)

  /* --- Pausetaste und Bewegungsschalter ---------------------------------- */

  window.addEventListener('meson:pause', (ereignis) => {
    const pausiert = (ereignis as CustomEvent<boolean>).detail
    if (pausiert) halte()
    else starte()
  })

  window.addEventListener('meson:bewegung', (ereignis) => {
    const modus = (ereignis as CustomEvent<string>).detail
    if (modus === 'full') starte()
    else halte()
  })

  // Im Hintergrund nichts rechnen — schont Akku und Lüfter.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') halte()
  })

  return true
}

if (darfLaufen()) {
  // Erst nach dem LCP aufbauen. Der Shader darf niemals das größte
  // Inhaltselement verzögern — er ist Dekor, kein Inhalt.
  const spaeter = () => {
    if (!baueAuf()) canvas.remove()
  }

  // Nicht `'requestIdleCallback' in window` — das verengt den Typ von window
  // im else-Zweig auf never, weil die Eigenschaft im Lib-Typ immer existiert.
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(spaeter, { timeout: 2500 })
  } else {
    window.setTimeout(spaeter, 900)
  }
} else {
  // Kein Canvas, kein Kontextverlust, keine Leiche im DOM.
  canvas.remove()
}

export {}
