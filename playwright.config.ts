import { defineConfig, devices } from '@playwright/test'

/**
 * Zwei Bewegungsmodi × drei Breiten × alle Routen.
 *
 * Die 320px-Breite ist kein Sonderfall, sondern die Prüfbedingung für
 * WCAG 1.4.10 (Reflow): Bei 400 % Zoom auf einem 1280px-Fenster bleibt
 * genau diese Breite übrig. Wer nur bei 375px testet, prüft das Kriterium
 * nicht.
 *
 * `reducedMotion: 'reduce'` als eigenes Projekt, weil sonst nie auffällt,
 * dass ein Reveal mit `opacity: 0` startet und bei abgeschalteter Bewegung
 * nie sichtbar wird — Inhalt, der für einen Teil der Nutzer dauerhaft
 * verschwindet.
 */
export default defineConfig({
  testDir: './tests',
  testMatch: ['**/*.spec.ts'],
  fullyParallel: true,
  forbidOnly: Boolean(process.env['CI']),
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? [['github'], ['list']] : [['list']],

  use: {
    baseURL: 'http://localhost:4321',
    trace: 'retain-on-failure',
    locale: 'de-DE',
    timezoneId: 'Europe/Berlin',
  },

  webServer: {
    command: 'pnpm exec astro preview --port 4321',
    url: 'http://localhost:4321/',
    reuseExistingServer: !process.env['CI'],
    timeout: 60_000,
  },

  projects: [
    {
      name: 'voll-1440',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'voll-768',
      use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 900 } },
    },
    {
      name: 'voll-320',
      use: { ...devices['Desktop Chrome'], viewport: { width: 320, height: 640 } },
    },
    {
      name: 'reduziert-1440',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        contextOptions: { reducedMotion: 'reduce' },
      },
    },
  ],
})
