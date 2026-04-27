import { describe, it, expect } from 'vitest';
import { generateTokensCss } from '../generators/tokens-css.ts';
import type { TokenTree } from '../types.ts';

const fixture: TokenTree = {
  color: {
    brand: { primary: { $type: 'color', $value: '#E07800' } },
    dark: { background: { $type: 'color', $value: '#141414' } },
    light: { background: { $type: 'color', $value: '#FAFAF8' } },
  },
  radius: {
    sm: { $type: 'dimension', $value: '4px' },
  },
  duration: {
    fast: { $type: 'duration', $value: '150ms' },
  },
};

describe('generateTokensCss', () => {
  const css = generateTokensCss(fixture);

  it('begins with a GENERATED header', () => {
    expect(css.startsWith('/* GENERATED FROM packages/tokens/tokens.json — DO NOT EDIT */')).toBe(true);
  });

  it('emits brand tokens at :root', () => {
    expect(css).toMatch(/:root\s*\{[\s\S]*--primary:\s*#E07800;[\s\S]*\}/);
  });

  it('emits dark tokens under [data-theme="dark"]', () => {
    expect(css).toMatch(/\[data-theme="dark"\][\s\S]*--background:\s*#141414;/);
  });

  it('emits light tokens under [data-theme="light"]', () => {
    expect(css).toMatch(/\[data-theme="light"\][\s\S]*--background:\s*#FAFAF8;/);
  });

  it('emits radius and duration in :root', () => {
    expect(css).toMatch(/--radius-sm:\s*4px;/);
    expect(css).toMatch(/--duration-fast:\s*150ms;/);
  });
});
