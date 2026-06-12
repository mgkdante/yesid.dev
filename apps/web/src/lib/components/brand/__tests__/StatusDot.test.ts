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

  it('applies green color class (signal-proceed lamp alias)', () => {
    const { container } = render(StatusDot, { props: { color: 'green' } });
    const dot = container.querySelector('span')!;
    expect(dot.classList.contains('bg-[var(--signal-proceed)]')).toBe(true);
  });

  // GO2-W5 signal aspects: caution (amber), stop (red), lunar (white shunt).
  it.each([
    ['caution', 'bg-[var(--signal-caution)]'],
    ['stop', 'bg-[var(--signal-stop)]'],
    ['lunar', 'bg-[var(--signal-lunar)]'],
  ] as const)('applies %s signal-aspect class', (color, expected) => {
    const { container } = render(StatusDot, { props: { color } });
    const dot = container.querySelector('span')!;
    expect(dot.classList.contains(expected)).toBe(true);
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

  it('applies halo outline when ring=true', () => {
    const { container } = render(StatusDot, { props: { ring: true } });
    const dot = container.querySelector('span')!;
    expect(dot.className).toContain('outline-[3px]');
    expect(dot.className).toContain('outline-[var(--muted)]');
  });

  it('omits outline classes by default', () => {
    const { container } = render(StatusDot);
    const dot = container.querySelector('span')!;
    expect(dot.className).not.toContain('outline-[3px]');
  });

  it('is hidden from assistive tech', () => {
    const { container } = render(StatusDot);
    const dot = container.querySelector('span')!;
    expect(dot.getAttribute('aria-hidden')).toBe('true');
  });
});
