import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import ChevronToggle from '../ChevronToggle.svelte';

describe('ChevronToggle', () => {
  it('renders an SVG', () => {
    const { container } = render(ChevronToggle, { props: { open: false } });
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('defaults to md size and right direction', () => {
    const { container } = render(ChevronToggle, { props: { open: false } });
    const cls = container.querySelector('svg')!.getAttribute('class')!;
    expect(cls).toContain('size-5');
    expect(cls).toContain('chevron-right');
  });

  it('applies open class when open', () => {
    const { container } = render(ChevronToggle, { props: { open: true } });
    const cls = container.querySelector('svg')!.getAttribute('class')!;
    expect(cls).toContain('chevron-open');
  });

  it('does not apply open class when closed', () => {
    const { container } = render(ChevronToggle, { props: { open: false } });
    const cls = container.querySelector('svg')!.getAttribute('class')!;
    expect(cls).not.toContain('chevron-open');
  });

  it('applies sm size', () => {
    const { container } = render(ChevronToggle, { props: { open: false, size: 'sm' } });
    const cls = container.querySelector('svg')!.getAttribute('class')!;
    expect(cls).toContain('size-4');
  });

  it('applies down direction', () => {
    const { container } = render(ChevronToggle, { props: { open: false, direction: 'down' } });
    const cls = container.querySelector('svg')!.getAttribute('class')!;
    expect(cls).toContain('chevron-down');
  });

  it('is hidden from assistive tech', () => {
    const { container } = render(ChevronToggle, { props: { open: false } });
    expect(container.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true');
  });
});
