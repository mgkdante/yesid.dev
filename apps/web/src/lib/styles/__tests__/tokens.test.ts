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

  describe('GO2-W5 INTERLOCKING — warm AA palette + surfaces + color-scheme', () => {
    const darkBlock = tokensCSS.match(/\[data-theme="dark"\], \.theme-dark \{([\s\S]*?)\n\}/)?.[1] ?? '';
    const lightBlock = tokensCSS.match(/\[data-theme="light"\], \.theme-light \{([\s\S]*?)\n\}/)?.[1] ?? '';

    it('dark neutrals are the warm bakelite set', () => {
      expect(darkBlock).toContain('--background: #171310;');
      expect(darkBlock).toContain('--card: #1F1915;');
      expect(darkBlock).toContain('--terminal: #0D0A07;');
      expect(darkBlock).toContain('--muted-foreground: #A09686;');
    });

    it('dark border scale is not inverted (strong > default > subtle)', () => {
      expect(darkBlock).toContain('--border: #41382E;');
      expect(darkBlock).toContain('--border-subtle: #322A22;');
      expect(darkBlock).toContain('--border-strong: #52473A;');
    });

    it('dark input boundary conforms to 1.4.11 (was #3A3A3A = 1.8:1)', () => {
      expect(darkBlock).toContain('--input: #75664F;');
    });

    it('light interactive palette is AA-safe on the warm paper', () => {
      expect(lightBlock).toContain('--background: #F7F2E9;');
      expect(lightBlock).toContain('--card: #FFFDF8;');
      expect(lightBlock).toContain('--terminal: #F6EFE2;');
      expect(lightBlock).toContain('--primary: #9D5200;');
      expect(lightBlock).toContain('--primary-hover: #854500;');
      expect(lightBlock).toContain('--primary-rgb: 157 82 0;');
      expect(lightBlock).toContain('--muted-foreground: #6E6557;');
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

    it('per-mode signal & infrastructure families exist', () => {
      expect(darkBlock).toContain('--terminal-chrome: #15100B;');
      expect(lightBlock).toContain('--terminal-chrome: #EDE3CF;');
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
        '--border-brand: color-mix(in srgb, var(--primary) 25%, transparent);',
        '--border-brand-active: color-mix(in srgb, var(--primary) 60%, transparent);',
        '--border-hairline: color-mix(in srgb, var(--foreground) 8%, transparent);',
        '--shadow-sheet: 0 -8px 32px rgb(0 0 0 / 0.4);',
      ]) expect(tokensCSS).toContain(t);
    });

    it('shadow.card folds the platform-lamp catch-light into the token', () => {
      expect(tokensCSS).toContain('--shadow-card: 0 0 16px color-mix(in srgb, var(--primary) 8%, transparent), 0 2px 8px rgba(10, 7, 4, 0.35), inset 0 1px 0 var(--edge-highlight);');
    });

    it('app.css ships warm light shadow overrides + pinned-dark code blocks (hand region)', () => {
      expect(appCSS).toContain('--shadow-nav: 0 4px 24px rgba(28, 24, 19, 0.1)');
      expect(appCSS).toContain('inset 0 1px 0 var(--edge-highlight)');
      expect(appCSS).toMatch(/\[data-theme="light"\] \.prose-dark pre/);
      expect(appCSS).toContain('background: #0D0A07 !important;');
    });

    it('app.css grid recipe is the NX track schematic (block markers + fine grid + glow)', () => {
      expect(appCSS).toContain('var(--grid-glow)');
      expect(appCSS).toContain('var(--grid-block-marker) 0px, transparent 1px, transparent 400px');
      expect(appCSS).toContain('var(--grid-line-major) 0px, transparent 1px, transparent 80px');
      expect(appCSS).toContain('var(--grid-line-minor) 0px, transparent 1px, transparent 16px');
    });

    it('station labels speak the wayfinding voice (.label-station = accent-text)', () => {
      const labelStation = appCSS.match(/\.label-station \{([\s\S]*?)\}/)?.[1] ?? '';
      expect(labelStation).toContain('color: var(--accent-text);');
    });
  });
});
