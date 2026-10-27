import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const tokensCSS = readFileSync(
  resolve(process.cwd(), 'vendor/design/tokens/tokens.css'),
  'utf-8'
);

const appCSS = readFileSync(
  resolve(process.cwd(), 'src/app.css'),
  'utf-8'
);

const baseCSS = readFileSync(
  resolve(process.cwd(), 'vendor/design/ui/base.css'),
  'utf-8'
);

describe('Design System Tokens', () => {
  describe('Shadow scale', () => {
    const requiredShadows = [
      '--shadow-glow-sm', '--shadow-glow-md', '--shadow-glow-lg',
      '--shadow-card', '--shadow-section', '--shadow-nav'
    ];

    it.each(requiredShadows)('defines %s', (token) => {
      expect(tokensCSS).toContain(token);
    });

    it('uses color-mix() for brand-connected shadows', () => {
      expect(tokensCSS).toMatch(/--shadow-glow-sm:.*color-mix/);
    });
  });

  describe('Z-index scale', () => {
    const requiredZIndex = [
      '--z-base', '--z-content', '--z-rail',
      '--z-sheet', '--z-menu', '--z-nav'
    ];

    it.each(requiredZIndex)('defines %s', (token) => {
      expect(tokensCSS).toContain(token);
    });

    it('has ascending values', () => {
      const values = requiredZIndex.map(token => {
        const match = tokensCSS.match(new RegExp(`${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:\\s*(\\d+)`));
        return match ? parseInt(match[1]) : -1;
      });
      for (let i = 1; i < values.length; i++) {
        expect(values[i]).toBeGreaterThanOrEqual(values[i - 1]);
      }
    });
  });

  describe('Transition tokens', () => {
    it('defines duration tokens', () => {
      expect(tokensCSS).toContain('--duration-fast');
      expect(tokensCSS).toContain('--duration-normal');
      expect(tokensCSS).toContain('--duration-slow');
    });

    it('defines easing tokens', () => {
      expect(tokensCSS).toContain('--ease-bounce');
    });
  });

  describe('Semantic color completeness', () => {
    const themeTokens = [
      '--terminal', '--border-subtle',
      '--manifesto', '--card',
      '--border-strong', '--success'
    ];

    it.each(themeTokens)('defines %s in dark theme', (token) => {
      const darkBlock = tokensCSS.match(
        /\[data-theme="dark"\][\s\S]*?\{([\s\S]*?)\}/
      );
      expect(darkBlock?.[1]).toContain(token);
    });

    it.each(themeTokens)('defines %s in light theme', (token) => {
      const lightBlock = tokensCSS.match(
        /\[data-theme="light"\][\s\S]*?\{([\s\S]*?)\}/
      );
      expect(lightBlock?.[1]).toContain(token);
    });
  });

  describe('GO2-W5 INTERLOCKING (taste round 2) — restored dark board + warm light wall + color-scheme', () => {
    const darkBlock = tokensCSS.match(/\[data-theme="dark"\], \.theme-dark \{([\s\S]*?)\n\}/)?.[1] ?? '';
    const lightBlock = tokensCSS.match(/\[data-theme="light"\], \.theme-light \{([\s\S]*?)\n\}/)?.[1] ?? '';

    it('light theme declares its primary RGB channels', () => {
      expect(lightBlock).toContain('--primary-rgb: 160 85 0;');
    });

    it('dark theme declares its primary RGB channels', () => {
      expect(darkBlock).toContain('--primary-rgb: 224 120 0;');
    });

    it('theme-invariant signal-systems tokens live in :root (real tape/signs do not reskin)', () => {
      for (const t of [
        '--signal-proceed: var(--success);', '--signal-caution: var(--accent);',
        '--signal-stop: var(--destructive);',
      ]) expect(tokensCSS).toContain(t);
    });

    it('per-mode signal & infrastructure families exist', () => {
      expect(darkBlock).toContain('--grid-glow: color-mix(in srgb, var(--primary) 5%, transparent);');
      expect(lightBlock).toContain('--grid-glow: transparent;');
      expect(darkBlock).toContain('--edge-highlight: color-mix(in srgb, var(--foreground) 5%, transparent);');
      expect(lightBlock).toContain('--edge-highlight: rgba(255, 255, 255, 0.6);');
    });

    it('emits color-scheme declarations per theme', () => {
      expect(darkBlock).toContain('color-scheme: dark;');
      expect(lightBlock).toContain('color-scheme: light;');
    });

    it('defines surface + brand-border aliases in :root (surface-1 flipped to card — GO2-W5)', () => {
      for (const t of [
        '--surface-0: var(--terminal);', '--surface-1: var(--card);', '--surface-2: var(--card);',
        '--surface-3: var(--muted);', '--surface-4: var(--popover);', '--surface-hero: var(--manifesto);',
        '--border-brand: color-mix(in srgb, var(--primary) 45%, transparent);',
        '--border-brand-active: color-mix(in srgb, var(--primary) 85%, transparent);',
        '--border-hairline: color-mix(in srgb, var(--foreground) 8%, transparent);',
        '--shadow-sheet: 0 -8px 32px rgb(0 0 0 / 0.4);',
      ]) expect(tokensCSS).toContain(t);
    });

    it('ships the round-2 BOLD structural rules — both voices as solid lines', () => {
      expect(tokensCSS).toContain('--border-rule: var(--primary);');
      expect(tokensCSS).toContain('--border-rule-accent: var(--line-amber);');
    });

    it('shadow.card folds the platform-lamp catch-light into the token', () => {
      expect(tokensCSS).toContain('--shadow-card: 0 0 16px color-mix(in srgb, var(--primary) 8%, transparent), 0 2px 8px rgba(10, 7, 4, 0.35), inset 0 1px 0 var(--edge-highlight);');
    });

    it('base.css ships warm light shadow overrides and app.css leaves prose code theme-aware', () => {
      expect(baseCSS).toContain('--shadow-nav: 0 4px 24px rgba(28, 24, 19, 0.1)');
      expect(baseCSS).toContain('inset 0 1px 0 var(--edge-highlight)');
      expect(appCSS).not.toMatch(/\[data-theme="light"\] \.prose-dark pre/);
      expect(appCSS).not.toMatch(/\.theme-light \.prose-dark pre/);
      expect(appCSS).not.toContain('background: #141414 !important;');
    });

    it('base.css grid recipe is the NX track schematic (block markers + fine grid)', () => {
      expect(baseCSS).toContain('var(--grid-block-marker) 0px, transparent 1px, transparent 400px');
      expect(baseCSS).toContain('var(--grid-line-major) 0px, transparent 1px, transparent 80px');
      expect(baseCSS).toContain('var(--grid-line-minor) 0px, transparent 1px, transparent 16px');
    });

    it('the page grid paints UNDER content as the wrapper background, with NO stacking context', () => {
      // Round-2 solidity intent: solid surfaces occlude the schematic.
      // go2 integration mechanism: the grid is .circuit-grid's own
      // background-image (always below content). The round-2 isolate +
      // z-index:-1 ::before created a stacking context that trapped the
      // fixed Nav (z 70) under the body-portaled MenuOverlay (z 60) — the
      // navbar vanished while the menu sheet was open. Isolation (or any
      // ::before resurrection) on .circuit-grid is a regression.
      const grid = baseCSS.match(/\.circuit-grid \{([\s\S]*?)\}/)?.[1] ?? '';
      expect(grid).toContain('background-image:');
      expect(grid).not.toContain('isolation');
      expect(grid).not.toContain('z-index');
      expect(baseCSS).not.toMatch(/\.circuit-grid::before/);
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

    it('dashed delimitations speak the route-set voice (.divider-dashed = border-rule, round-3 2px)', () => {
      const divider = baseCSS.match(/\.divider-dashed \{([\s\S]*?)\}/)?.[1] ?? '';
      expect(divider).toContain('border-top: 2px dashed var(--border-rule);');
    });

    it('round 3: light mode strengthens the brand grid (--border-brand 45% → 60% hand override)', () => {
      // Operator: light "still needs more demarcation with its structural
      // lines" — the light page runs a stronger --border-brand mix than the
      // :root 45% so the 2px grid reads slightly more pronounced than dark.
      const lightOverride = baseCSS.match(
        /\[data-theme="light"\], \.theme-light \{\s*\n\t--border-brand:([^;]*);/,
      )?.[1] ?? '';
      expect(lightOverride.trim()).toBe('color-mix(in srgb, var(--primary) 60%, transparent)');
    });

    it('station labels speak the wayfinding voice (.label-station = accent-text)', () => {
      const labelStation = baseCSS.match(/\.label-station \{([\s\S]*?)\}/)?.[1] ?? '';
      expect(labelStation).toContain('color: var(--accent-text);');
    });
  });

  describe('GO2-W5 final batch (6c) — the asphalt footer (operator: BELOVED; never repave)', () => {
    const darkBlock = tokensCSS.match(/\[data-theme="dark"\], \.theme-dark \{([\s\S]*?)\n\}/)?.[1] ?? '';

    it('the asphalt is a NEUTRAL grey — equal RGB channels, no warm bakelite repave', () => {
      const m = darkBlock.match(/--muted: #([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2});/);
      expect(m).not.toBeNull();
      const [, r, g, b] = m!;
      expect(r.toUpperCase()).toBe(g.toUpperCase());
      expect(g.toUpperCase()).toBe(b.toUpperCase());
    });

  });
});
