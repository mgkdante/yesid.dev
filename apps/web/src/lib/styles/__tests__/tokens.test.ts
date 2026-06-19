import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const tokensCSS = readFileSync(
  resolve(process.cwd(), 'src/lib/styles/tokens.css'),
  'utf-8'
);

const appCSS = readFileSync(
  resolve(process.cwd(), 'src/app.css'),
  'utf-8'
);

describe('Design System Tokens', () => {
  describe('Type scale', () => {
    const requiredTokens = [
      '--text-hero', '--text-display', '--text-title', '--text-heading',
      '--text-subheading', '--text-body',
      '--text-small', '--text-caption', '--text-mono'
    ];

    it.each(requiredTokens)('defines %s in @theme (app.css)', (token) => {
      expect(appCSS).toContain(token);
    });

    it('uses clamp() for fluid headings', () => {
      expect(appCSS).toMatch(/--text-display:\s*clamp\(/);
      expect(appCSS).toMatch(/--text-title:\s*clamp\(/);
      expect(appCSS).toMatch(/--text-heading:\s*clamp\(/);
      expect(appCSS).toMatch(/--text-hero:\s*clamp\(/);
    });
  });

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

  describe('@theme radius naming', () => {
    it('uses unified radius names (not split-brain)', () => {
      expect(appCSS).toContain('--radius-sm');
      expect(appCSS).toContain('--radius-md');
      expect(appCSS).toContain('--radius-lg');
      expect(appCSS).toContain('--radius-pill');
      expect(appCSS).not.toContain('--radius-brand:');
    });
  });

  describe('GO2-W5 INTERLOCKING (taste round 2) — restored dark board + warm light wall + color-scheme', () => {
    const darkBlock = tokensCSS.match(/\[data-theme="dark"\], \.theme-dark \{([\s\S]*?)\n\}/)?.[1] ?? '';
    const lightBlock = tokensCSS.match(/\[data-theme="light"\], \.theme-light \{([\s\S]*?)\n\}/)?.[1] ?? '';

    it('dark neutrals are the RESTORED near-black board (amber/bakelite rejected — operator round 2)', () => {
      expect(darkBlock).toContain('--background: #141414;');
      expect(darkBlock).toContain('--card: #1a1a1a;');
      expect(darkBlock).toContain('--muted: #1E1E1E;');
      expect(darkBlock).toContain('--popover: #2A2A2A;');
      expect(darkBlock).toContain('--manifesto: #0f0d0a;');
      expect(darkBlock).toContain('--foreground: #F5F5F0;');
      expect(darkBlock).toContain('--muted-foreground: #949494;');
      expect(darkBlock).toContain('--secondary-foreground: #999999;');
    });

    it('terminals ARE the site background in both modes (solid; identity = chrome/border/type)', () => {
      expect(darkBlock).toContain('--terminal: #141414;');
      expect(lightBlock).toContain('--terminal: #F3F6FB;');
    });

    it('dark border scale is the restored neutral ladder (subtle < default < strong)', () => {
      expect(darkBlock).toContain('--border: #3A3A3A;');
      expect(darkBlock).toContain('--border-subtle: #2f2f2f;');
      expect(darkBlock).toContain('--border-strong: #4A4A4A;');
    });

    it('light borders are HARDER (round 2) and strong rules are BLACK tape (round 4 doctrine)', () => {
      expect(lightBlock).toContain('--border: #B5BECD;');
      expect(lightBlock).toContain('--border-subtle: #C2CBD8;');
      // Round 4: light strong rules lean true-dark — the #1C1814 signage
      // family draws structure as black tape on paper (was #A08F70).
      expect(lightBlock).toContain('--border-strong: #1C1814;');
    });

    it('dark input boundary conforms to 1.4.11 (was #3A3A3A = 1.8:1)', () => {
      expect(darkBlock).toContain('--input: #75664F;');
    });

    it('light interactive palette is AA-safe on the warm paper', () => {
      expect(lightBlock).toContain('--background: #F3F6FB;');
      expect(lightBlock).toContain('--card: #F9FAFD;');
      expect(lightBlock).toContain('--primary: #A05500;');
      expect(lightBlock).toContain('--primary-hover: #854500;');
      expect(lightBlock).toContain('--primary-rgb: 160 85 0;');
      expect(lightBlock).toContain('--muted-foreground: #545E75;');
      expect(lightBlock).toContain('--destructive: #C62828;');
      expect(lightBlock).toContain('--success: #127336;');
      expect(lightBlock).toContain('--accent-foreground: #1C1813;');
      expect(lightBlock).toContain('--accent-text: #815D00;');
      expect(lightBlock).toContain('--input: #94897A;');
    });

    it('destructive-foreground is mode-split (old single #FAFAF8 failed on #ff5f57)', () => {
      expect(darkBlock).toContain('--destructive-foreground: #1B0F0D;');
      expect(lightBlock).toContain('--destructive-foreground: #FAF6EE;');
    });

    it('dark re-declares brand tokens so .theme-dark pinning works inside light pages', () => {
      expect(darkBlock).toContain('--primary: #E07800;');
      expect(darkBlock).toContain('--primary-rgb: 224 120 0;');
      expect(darkBlock).toContain('--accent-text: #FFB627;');
    });

    it('theme-invariant signal-systems tokens live in :root (real tape/signs do not reskin)', () => {
      for (const t of [
        '--hazard-a: #FFB627;', '--hazard-b: #1C1814;',
        '--signage-bg: #1C1814;', '--signage-text: #FFB627;',
        '--signal-proceed: var(--success);', '--signal-caution: var(--accent);',
        '--signal-stop: var(--destructive);',
      ]) expect(tokensCSS).toContain(t);
    });

    it('round 4: the WHITE reflective voice is a theme-invariant :root token', () => {
      // Four-color doctrine — reflective material doesn't reskin: white-core
      // métro dots, key headline words over photo gradients.
      expect(tokensCSS).toContain('--reflective: #F5F5F0;');
    });

    it('per-mode signal & infrastructure families exist', () => {
      expect(darkBlock).toContain('--terminal-chrome: #0E0E0E;');
      expect(lightBlock).toContain('--terminal-chrome: #EFE5CE;');
      expect(darkBlock).toContain('--terminal-ink: #E9E2D2;');
      expect(lightBlock).toContain('--terminal-ink: #3D362B;');
      expect(darkBlock).toContain('--line-amber: #FFB627;');
      expect(lightBlock).toContain('--line-amber: #B57F00;');
      expect(darkBlock).toContain('--accent-surface: #332812;');
      expect(lightBlock).toContain('--accent-surface: #FAEECC;');
      expect(darkBlock).toContain('--signal-lunar: #DAD2C2;');
      expect(lightBlock).toContain('--signal-lunar: #5E5749;');
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

    it('app.css ships warm light shadow overrides and leaves prose code theme-aware', () => {
      expect(appCSS).toContain('--shadow-nav: 0 4px 24px rgba(28, 24, 19, 0.1)');
      expect(appCSS).toContain('inset 0 1px 0 var(--edge-highlight)');
      expect(appCSS).not.toMatch(/\[data-theme="light"\] \.prose-dark pre/);
      expect(appCSS).not.toMatch(/\.theme-light \.prose-dark pre/);
      expect(appCSS).not.toContain('background: #141414 !important;');
    });

    it('app.css grid recipe is the NX track schematic (block markers + fine grid)', () => {
      expect(appCSS).toContain('var(--grid-block-marker) 0px, transparent 1px, transparent 400px');
      expect(appCSS).toContain('var(--grid-line-major) 0px, transparent 1px, transparent 80px');
      expect(appCSS).toContain('var(--grid-line-minor) 0px, transparent 1px, transparent 16px');
    });

    it('the page grid paints UNDER content as the wrapper background, with NO stacking context', () => {
      // Round-2 solidity intent: solid surfaces occlude the schematic.
      // go2 integration mechanism: the grid is .circuit-grid's own
      // background-image (always below content). The round-2 isolate +
      // z-index:-1 ::before created a stacking context that trapped the
      // fixed Nav (z 70) under the body-portaled MenuOverlay (z 60) — the
      // navbar vanished while the menu sheet was open. Isolation (or any
      // ::before resurrection) on .circuit-grid is a regression.
      const grid = appCSS.match(/\.circuit-grid \{([\s\S]*?)\}/)?.[1] ?? '';
      expect(grid).toContain('background-image:');
      expect(grid).not.toContain('isolation');
      expect(grid).not.toContain('z-index');
      expect(appCSS).not.toMatch(/\.circuit-grid::before/);
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
      const divider = appCSS.match(/\.divider-dashed \{([\s\S]*?)\}/)?.[1] ?? '';
      expect(divider).toContain('border-top: 2px dashed var(--border-rule);');
    });

    it('round 3: light mode strengthens the brand grid (--border-brand 45% → 60% hand override)', () => {
      // Operator: light "still needs more demarcation with its structural
      // lines" — the light page runs a stronger --border-brand mix than the
      // :root 45% so the 2px grid reads slightly more pronounced than dark.
      const lightOverride = appCSS.match(
        /\[data-theme="light"\], \.theme-light \{\s*\n\t--border-brand:([^;]*);/,
      )?.[1] ?? '';
      expect(lightOverride.trim()).toBe('color-mix(in srgb, var(--primary) 60%, transparent)');
    });

    it('station labels speak the wayfinding voice (.label-station = accent-text)', () => {
      const labelStation = appCSS.match(/\.label-station \{([\s\S]*?)\}/)?.[1] ?? '';
      expect(labelStation).toContain('color: var(--accent-text);');
    });
  });

  describe('GO2-W5 final batch (6c) — the asphalt footer (operator: BELOVED; never repave)', () => {
    // The footer paints bg-[var(--muted)] (wiring locked in
    // style-regressions). These pins make the STREET values themselves
    // immovable: dark --muted is the asphalt road surface — #1E1E1E exactly,
    // a NEUTRAL grey (round 1's warm #251E18 repave is the historical
    // failure mode; round 2 restored asphalt). Light --muted stays the
    // approved station paper. Both attribute blocks and the
    // prefers-color-scheme fallbacks must agree.
    const darkBlock = tokensCSS.match(/\[data-theme="dark"\], \.theme-dark \{([\s\S]*?)\n\}/)?.[1] ?? '';
    const lightBlock = tokensCSS.match(/\[data-theme="light"\], \.theme-light \{([\s\S]*?)\n\}/)?.[1] ?? '';
    const mediaDark = tokensCSS.match(/@media \(prefers-color-scheme: dark\) \{([\s\S]*?)\n\}/)?.[1] ?? '';
    const mediaLight = tokensCSS.match(/@media \(prefers-color-scheme: light\) \{([\s\S]*?)\n\}/)?.[1] ?? '';

    it('dark --muted is asphalt: #1E1E1E exactly (the street the footer paints)', () => {
      expect(darkBlock).toContain('--muted: #1E1E1E;');
      expect(mediaDark).toContain('--muted: #1E1E1E;');
    });

    it('the asphalt is a NEUTRAL grey — equal RGB channels, no warm bakelite repave', () => {
      const m = darkBlock.match(/--muted: #([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2});/);
      expect(m).not.toBeNull();
      const [, r, g, b] = m!;
      expect(r.toUpperCase()).toBe(g.toUpperCase());
      expect(g.toUpperCase()).toBe(b.toUpperCase());
    });

    it('light --muted is the cool-concrete tint: #E4E9F3 exactly', () => {
      expect(lightBlock).toContain('--muted: #E4E9F3;');
      expect(mediaLight).toContain('--muted: #E4E9F3;');
    });
  });
});
