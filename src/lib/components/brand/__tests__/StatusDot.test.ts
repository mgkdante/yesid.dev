import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import StatusDot from '../StatusDot.svelte';

describe('StatusDot', () => {
  it('renders without crashing', () => {
    const { container } = render(StatusDot);
    expect(container.querySelector('span')).toBeTruthy();
  });

  it('defaults to orange, no pulse, sm size', () => {
    const { container } = render(StatusDot);
    const dot = container.querySelector('span')!;
    expect(dot.className).toContain('size-1.5');
    expect(dot.className).not.toContain('led-pulse');
  });

  it('applies green color class', () => {
    const { container } = render(StatusDot, { props: { color: 'green' } });
    const dot = container.querySelector('span')!;
    expect(dot.classList.contains('bg-[var(--success)]')).toBe(true);
  });

  it('applies pulse animation class', () => {
    const { container } = render(StatusDot, { props: { pulse: true } });
    const dot = container.querySelector('span')!;
    expect(dot.className).toContain('led-pulse');
  });

  it('applies md size', () => {
    const { container } = render(StatusDot, { props: { size: 'md' } });
    const dot = container.querySelector('span')!;
    expect(dot.className).toContain('size-2.5');
  });

  it('is hidden from assistive tech', () => {
    const { container } = render(StatusDot);
    const dot = container.querySelector('span')!;
    expect(dot.getAttribute('aria-hidden')).toBe('true');
  });
});
