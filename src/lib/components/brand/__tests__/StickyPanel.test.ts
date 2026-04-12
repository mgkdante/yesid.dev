import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import StickyPanelTest from './StickyPanelTest.svelte';

describe('StickyPanel', () => {
  it('renders content', () => {
    render(StickyPanelTest, { props: { text: 'Sidebar' } });
    expect(screen.getByText('Sidebar')).toBeTruthy();
  });

  it('renders as aside element', () => {
    const { container } = render(StickyPanelTest);
    expect(container.querySelector('aside')).toBeTruthy();
  });

  it('has scrollbar-hidden class', () => {
    const { container } = render(StickyPanelTest);
    const panel = container.querySelector('aside')!;
    expect(panel.className).toContain('scrollbar-hidden');
  });

  it('defaults to 6rem top offset', () => {
    const { container } = render(StickyPanelTest);
    const style = container.querySelector('aside')!.getAttribute('style') || container.querySelector('aside')!.style.cssText;
    expect(style).toContain('6rem');
  });

  it('applies custom top offset', () => {
    const { container } = render(StickyPanelTest, { props: { top: '4rem' } });
    const style = container.querySelector('aside')!.getAttribute('style') || container.querySelector('aside')!.style.cssText;
    expect(style).toContain('4rem');
  });
});
