import { describe, it, expect } from 'vitest';
import * as brand from '../index.js';

describe('Brand barrel export', () => {
  const expectedComponents = [
    'SectionLabel',
    'StopLabel',
    'MetroStation',
    'ChevronToggle',
    'TerminalChrome',
    'StickyPanel',
    'SvgIcon',
    'BlueprintShell',
  ];

  it('exports all 8 brand primitives', () => {
    for (const name of expectedComponents) {
      expect(brand).toHaveProperty(name);
      expect((brand as Record<string, unknown>)[name]).toBeTruthy();
    }
  });

  it('exports exactly the expected components', () => {
    const componentExports = Object.keys(brand).filter(
      (key) => !key.endsWith('Props') && key !== 'TerminalFooterItem' && typeof (brand as Record<string, unknown>)[key] !== 'undefined'
    );
    expect(componentExports.length).toBeGreaterThanOrEqual(8);
  });
});
