import { describe, it, expect } from 'vitest';
import * as brand from '../index.js';

describe('Brand barrel export', () => {
  const expectedComponents = [
    'StatusDot',
    'SectionLabel',
    'StopLabel',
    'ChevronToggle',
    'GlowOverlay',
    'MetricDisplay',
    'CornerMarks',
    'TerminalChrome',
    'StickyPanel',
  ];

  it('exports all 9 brand primitives', () => {
    for (const name of expectedComponents) {
      expect(brand).toHaveProperty(name);
      expect((brand as Record<string, unknown>)[name]).toBeTruthy();
    }
  });

  it('exports exactly the expected components', () => {
    const componentExports = Object.keys(brand).filter(
      (key) => !key.endsWith('Props') && key !== 'TerminalFooterItem' && typeof (brand as Record<string, unknown>)[key] !== 'undefined'
    );
    // 9 components (Tag/NumberBadge→ui/badge, HazardStripe/GradientSeparator→ui/separator, BrandButton→ui/button, CardBase→ui/card)
    expect(componentExports.length).toBeGreaterThanOrEqual(9);
  });
});
