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

  describe('GO-day W2 Track 2 — AA palette + surfaces + color-scheme', () => {
    const darkBlock = tokensCSS.match(/\[data-theme="dark"\], \.theme-dark \{([\s\S]*?)\n\}/)?.[1] ?? '';
    const lightBlock = tokensCSS.match(/\[data-theme="light"\], \.theme-light \{([\s\S]*?)\n\}/)?.[1] ?? '';

    it('dark muted-foreground passes AA (#949494)', () => {
      expect(darkBlock).toContain('--muted-foreground: #949494;');
    });

    it('dark border scale is not inverted (strong #4A4A4A > default #3A3A3A > subtle #2f2f2f)', () => {
      expect(darkBlock).toContain('--border: #3A3A3A;');
      expect(darkBlock).toContain('--border-subtle: #2f2f2f;');
      expect(darkBlock).toContain('--border-strong: #4A4A4A;');
    });

    it('light interactive orange is AA-safe', () => {
      expect(lightBlock).toContain('--primary: #A65600;');
      expect(lightBlock).toContain('--primary-hover: #8F4A00;');
      expect(lightBlock).toContain('--primary-rgb: 166 86 0;');
      expect(lightBlock).toContain('--muted-foreground: #6F6F6F;');
      expect(lightBlock).toContain('--destructive: #C62828;');
      expect(lightBlock).toContain('--success: #15803D;');
      expect(lightBlock).toContain('--accent-foreground: #111111;');
      expect(lightBlock).toContain('--accent-text: #8A6400;');
      expect(lightBlock).toContain('--input: #949083;');
    });

    it('dark re-declares brand tokens so .theme-dark pinning works inside light pages', () => {
      expect(darkBlock).toContain('--primary: #E07800;');
      expect(darkBlock).toContain('--primary-rgb: 224 120 0;');
      expect(darkBlock).toContain('--accent-text: #FFB627;');
    });

    it('emits color-scheme declarations per theme', () => {
      expect(darkBlock).toContain('color-scheme: dark;');
      expect(lightBlock).toContain('color-scheme: light;');
    });

    it('defines surface + brand-border aliases in :root', () => {
      for (const t of [
        '--surface-0: var(--terminal);', '--surface-1: var(--background);', '--surface-2: var(--card);',
        '--surface-3: var(--muted);', '--surface-4: var(--popover);', '--surface-hero: var(--manifesto);',
        '--border-brand: color-mix(in srgb, var(--primary) 25%, transparent);',
        '--border-brand-active: color-mix(in srgb, var(--primary) 60%, transparent);',
        '--border-hairline: color-mix(in srgb, var(--foreground) 8%, transparent);',
        '--shadow-sheet: 0 -8px 32px rgb(0 0 0 / 0.4);',
      ]) expect(tokensCSS).toContain(t);
    });

    it('app.css ships light shadow overrides + pinned-dark code blocks (hand region)', () => {
      expect(appCSS).toContain('--shadow-nav: 0 4px 24px rgba(20, 20, 20, 0.1)');
      expect(appCSS).toMatch(/\[data-theme="light"\] \.prose-dark pre/);
    });
  });
});
