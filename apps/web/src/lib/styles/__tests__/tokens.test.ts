import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const appCSS = readFileSync(
  resolve(process.cwd(), 'src/app.css'),
  'utf-8'
);

describe('Design System Tokens', () => {
  describe('GO2-W5 INTERLOCKING (taste round 2) — restored dark board + warm light wall + color-scheme', () => {
    it('app.css leaves prose code theme-aware', () => {
      expect(appCSS).not.toMatch(/\[data-theme="light"\] \.prose-dark pre/);
      expect(appCSS).not.toMatch(/\.theme-light \.prose-dark pre/);
      expect(appCSS).not.toContain('background: #141414 !important;');
    });

    it('the sodium lamp belongs to the intro animation ONLY — never to page chrome', () => {
      // History: the glow was (1) a %-sized radial on .circuit-grid — the
      // hero track collapse re-scaled it mid-frame (tint glitch #1) — then
      // (2) a viewport-glued sticky .grid-lamp — operator: "super glitchy",
      // rejected. Final doctrine: the lamp lives INSIDE the hero's metro
      // wrapper, so it exists exactly as long as the map animation does
      // (zooms away with the art; absent on settled hero, same-day
      // reloads, and reduced motion). app.css must stay glow-free.
      expect(appCSS).not.toContain('var(--grid-glow)');
      expect(appCSS).not.toContain('.grid-lamp');
      const heroBanner = readFileSync(
        new URL('../../components/home/HeroBanner.svelte', import.meta.url),
        'utf-8',
      );
      const lamp = heroBanner.match(/\.hero-lamp \{([\s\S]*?)\}/)?.[1] ?? '';
      // The lamp rides the theme-invariant --glow (not --grid-glow, which is
      // off in daylight): the operator wants the sodium-lamp cast visible in
      // BOTH themes, so it uses the vivid glow token at a fixed opacity.
      expect(lamp).toContain('var(--glow)');
      expect(lamp).toContain('pointer-events: none');
      // Sized by the pin (100%), never by the document or viewport units —
      // geometry flips (collapse, replay re-enlarge) must not touch it.
      expect(lamp).toContain('120vw 100% at 50% 0%');
    });
  });
});
