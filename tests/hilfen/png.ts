import { inflateSync } from 'node:zlib'

/**
 * Minimaler PNG-Leser für die Bildschirmaufnahmen aus Playwright.
 *
 * Warum kein Paket: Der Leser braucht genau das, was Playwright liefert —
 * 8 Bit pro Kanal, RGB oder RGBA, kein Interlacing, keine Palette. Das sind
 * sechzig Zeilen. Eine Abhängigkeit dafür wäre eine Fünfjahres-Verbindlichkeit
 * für einen Filteralgorithmus, der sich seit 1996 nicht geändert hat.
 *
 * Das Gegenstück — ein PNG-SCHREIBER — steht aus demselben Grund in
 * scripts/korn-erzeugen.mjs.
 */

export interface Bild {
  readonly breite: number
  readonly hoehe: number
  /** RGB, drei Bytes je Pixel, zeilenweise. */
  readonly daten: Uint8Array
}

export function lesePng(puffer: Buffer): Bild {
  if (puffer.readUInt32BE(0) !== 0x89504e47) {
    throw new Error('Kein PNG: Die Signatur stimmt nicht.')
  }

  let breite = 0
  let hoehe = 0
  let bittiefe = 0
  let farbtyp = 0
  const bloecke: Buffer[] = []

  let zeiger = 8
  while (zeiger < puffer.length) {
    const laenge = puffer.readUInt32BE(zeiger)
    const typ = puffer.toString('ascii', zeiger + 4, zeiger + 8)
    const inhalt = puffer.subarray(zeiger + 8, zeiger + 8 + laenge)

    if (typ === 'IHDR') {
      breite = inhalt.readUInt32BE(0)
      hoehe = inhalt.readUInt32BE(4)
      bittiefe = inhalt[8] as number
      farbtyp = inhalt[9] as number
      if (inhalt[12] !== 0) throw new Error('Interlaced PNG wird nicht unterstützt.')
    } else if (typ === 'IDAT') {
      bloecke.push(inhalt)
    } else if (typ === 'IEND') {
      break
    }

    zeiger += 12 + laenge
  }

  if (bittiefe !== 8 || (farbtyp !== 2 && farbtyp !== 6)) {
    throw new Error(`Nur 8-Bit RGB oder RGBA — bekommen: Tiefe ${bittiefe}, Typ ${farbtyp}.`)
  }

  const kanaele = farbtyp === 6 ? 4 : 3
  const roh = inflateSync(Buffer.concat(bloecke))
  const zeilenbreite = breite * kanaele
  const daten = new Uint8Array(breite * hoehe * 3)

  // Entfiltern nach PNG-Spezifikation, Abschnitt 9.
  const vorher = new Uint8Array(zeilenbreite)
  const jetzt = new Uint8Array(zeilenbreite)

  for (let y = 0; y < hoehe; y += 1) {
    const start = y * (zeilenbreite + 1)
    const filter = roh[start] as number
    jetzt.set(roh.subarray(start + 1, start + 1 + zeilenbreite))

    for (let i = 0; i < zeilenbreite; i += 1) {
      const a = i >= kanaele ? (jetzt[i - kanaele] as number) : 0
      const b = vorher[i] as number
      const c = i >= kanaele ? (vorher[i - kanaele] as number) : 0
      const x = jetzt[i] as number

      let wert: number
      switch (filter) {
        case 0:
          wert = x
          break
        case 1:
          wert = x + a
          break
        case 2:
          wert = x + b
          break
        case 3:
          wert = x + ((a + b) >> 1)
          break
        case 4: {
          const p = a + b - c
          const pa = Math.abs(p - a)
          const pb = Math.abs(p - b)
          const pc = Math.abs(p - c)
          wert = x + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)
          break
        }
        default:
          throw new Error(`Unbekannter Zeilenfilter ${filter} in Zeile ${y}.`)
      }
      jetzt[i] = wert & 0xff
    }

    for (let x = 0; x < breite; x += 1) {
      const q = (y * breite + x) * 3
      const s = x * kanaele
      daten[q] = jetzt[s] as number
      daten[q + 1] = jetzt[s + 1] as number
      daten[q + 2] = jetzt[s + 2] as number
    }

    vorher.set(jetzt)
  }

  return { breite, hoehe, daten }
}

/** Farbe eines Pixels als [r, g, b]. */
export function pixel(bild: Bild, x: number, y: number): [number, number, number] {
  const i = (y * bild.breite + x) * 3
  return [bild.daten[i] as number, bild.daten[i + 1] as number, bild.daten[i + 2] as number]
}
