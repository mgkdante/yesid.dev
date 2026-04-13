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
      '--text-subheading', '--text-body', '--text-body-lg',
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
      '--bg-terminal', '--border-subtle', '--text-dim',
      '--bg-manifesto', '--bg-card',
      '--border-strong', '--status-success'
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
});
