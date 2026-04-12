import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import StickyPanelTest from './StickyPanelTest.svelte';

describe('StickyPanel', () => {
  it('renders content', () => {
    render(StickyPanelTest, { props: { text: 'Sidebar' } });
    expect(screen.getByText('Sidebar')).toBeTruthy();
  });

  it('renders as div element', () => {
    const { container } = render(StickyPanelTest);
    expect(container.querySelector('.panel')?.tagName).toBe('DIV');
  });

  it('has scrollbar-hidden class', () => {
    const { container } = render(StickyPanelTest);
    const panel = container.querySelector('.panel')!;
    expect(panel.className).toContain('scrollbar-hidden');
  });

  it('defaults to 6rem top offset', () => {
    const { container } = render(StickyPanelTest);
    const el = container.querySelector('.panel') as HTMLElement;
    const style = el.getAttribute('style') || el.style.cssText;
    expect(style).toContain('6rem');
  });

  it('applies custom top offset', () => {
    const { container } = render(StickyPanelTest, { props: { top: '4rem' } });
    const el = container.querySelector('.panel') as HTMLElement;
    const style = el.getAttribute('style') || el.style.cssText;
    expect(style).toContain('4rem');
  });
});
