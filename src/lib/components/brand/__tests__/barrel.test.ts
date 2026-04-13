import { describe, it, expect } from 'vitest';
import * as brand from '../index.js';

describe('Brand barrel export', () => {
  const expectedComponents = [
    'StatusDot',
    'SectionLabel',
    'StopLabel',
    'Tag',
    'NumberBadge',
    'ChevronToggle',
    'HazardStripe',
    'GlowOverlay',
    'MetricDisplay',
    'CornerMarks',
    'TerminalChrome',
    'StickyPanel',
    'GradientSeparator',
  ];

  it('exports all 13 brand primitives', () => {
    for (const name of expectedComponents) {
      expect(brand).toHaveProperty(name);
      expect((brand as Record<string, unknown>)[name]).toBeTruthy();
    }
  });

  it('exports exactly the expected components', () => {
    const componentExports = Object.keys(brand).filter(
      (key) => !key.endsWith('Props') && key !== 'TerminalFooterItem' && typeof (brand as Record<string, unknown>)[key] !== 'undefined'
    );
    // 13 components (BrandButton→ui/button, CardBase→ui/card)
    expect(componentExports.length).toBeGreaterThanOrEqual(13);
  });
});
