precision mediump float;

varying vec2 vUv;

uniform float uZeit;
uniform vec2 uAufloesung;
uniform vec3 uGlut;   // Ember-Ton
uniform vec3 uGrund;  // Espresso

/*
 * Aufsteigende Glut über dunklem Grund.
 *
 * Bewusste Beschränkungen — sie sind nicht kosmetisch, sondern die
 * Voraussetzung dafür, dass dieser Shader WCAG 2.3.1 („Three Flashes“)
 * einhält:
 *
 *   1. KEIN Zufall pro Bild. Alles läuft über eine stetige Zeitbasis, damit
 *      die Helligkeit nie von einem Bild zum nächsten springt. Ein
 *      framerate-abhängiges Flackern wäre bei gesättigtem Rot — der
 *      kritischsten Farbe für Photosensitivität — genau der gefährliche Fall.
 *   2. Die Helligkeit ändert sich langsam und gedeckelt. Ergebnis sind
 *      NULL Helligkeitsereignisse pro Sekunde statt der erlaubten drei.
 *   3. Die Sättigung ist hart begrenzt (siehe mix() am Ende).
 *   4. Kein Vollbild-Aufblitzen, keine Stroboskop-Übergänge.
 */

// Deterministischer Rauschwert aus einer Zellkoordinate.
float rausch(vec2 zelle) {
  return fract(sin(dot(zelle, vec2(127.1, 311.7))) * 43758.5453);
}

// Ein einzelner Partikelstrom.
float partikel(vec2 uv, float zeit, float dichte, float tempo, float versatz) {
  vec2 raster = vec2(dichte, dichte * 0.55);
  vec2 gestreckt = uv * raster;

  // Aufsteigende Bewegung: konstant, damit keine Sprünge entstehen.
  gestreckt.y -= zeit * tempo + versatz;

  vec2 zelle = floor(gestreckt);
  vec2 innen = fract(gestreckt);

  float streuung = rausch(zelle);

  // Partikel horizontal in der Zelle versetzen — sonst entsteht ein Raster.
  vec2 mitte = vec2(0.25 + 0.5 * streuung, 0.5);
  float abstand = length((innen - mitte) * vec2(1.0, 0.62));

  // Weicher Kern. smoothstep statt step: harte Kanten würden beim Scrollen
  // aliasen und als Flackern gelesen.
  float kern = 1.0 - smoothstep(0.0, 0.16 + 0.08 * streuung, abstand);

  // Nicht jede Zelle trägt einen Partikel.
  float vorhanden = step(0.62, streuung);

  // Nach oben hin verglühen.
  float verglimmen = 1.0 - smoothstep(0.05, 0.95, uv.y);

  return kern * vorhanden * verglimmen;
}

void main() {
  vec2 uv = vUv;

  // Seitenverhältnis ausgleichen, damit Partikel rund bleiben.
  float seiten = uAufloesung.x / max(uAufloesung.y, 1.0);
  vec2 korrigiert = vec2(uv.x * seiten, uv.y);

  // Drei Ebenen mit unterschiedlichem Tempo — erzeugt Tiefe ohne Parallaxe.
  float glut = 0.0;
  glut += partikel(korrigiert, uZeit, 14.0, 0.055, 0.0) * 0.55;
  glut += partikel(korrigiert, uZeit, 22.0, 0.038, 3.7) * 0.35;
  glut += partikel(korrigiert, uZeit, 34.0, 0.026, 8.1) * 0.22;

  // Sehr langsames Atmen der Gesamthelligkeit. 0.055 Hz — weit unter jeder
  // Schwelle, die als Blitz zählt.
  float atmen = 0.88 + 0.12 * sin(uZeit * 0.35);
  glut *= atmen;

  // Wärmeschein am unteren Rand, wo die Glut liegt.
  float schein = pow(1.0 - uv.y, 3.5) * 0.16;

  // Feines, statisches Korn. Ohne Zeitanteil — animiertes Korn ist der
  // klassische Weg, versehentlich ein Flackern zu bauen.
  float korn = (rausch(floor(uv * uAufloesung * 0.5)) - 0.5) * 0.014;

  float staerke = clamp(glut + schein + korn, 0.0, 1.0);

  // Sättigung deckeln: nie das volle Ember, immer zum Grund hin gemischt.
  vec3 farbe = mix(uGrund, uGlut, staerke * 0.72);

  gl_FragColor = vec4(farbe, 1.0);
}
