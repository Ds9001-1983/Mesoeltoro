import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
    // Die Zeitlogik muss unabhängig von der Zeitzone des Rechners stimmen.
    // Deshalb läuft die Testsuite bewusst NICHT in Europe/Berlin — sonst
    // würde ein Fehler in der Zeitzonenbehandlung hier nie auffallen.
    env: { TZ: 'America/Los_Angeles' },
  },
})
