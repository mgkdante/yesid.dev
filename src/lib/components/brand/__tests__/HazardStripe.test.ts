import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import HazardStripe from '../HazardStripe.svelte';

describe('HazardStripe', () => {
  it('renders a stripe bar', () => {
    const { container } = render(HazardStripe);
    const bar = container.querySelector('[aria-hidden="true"]')!;
    expect(bar).toBeTruthy();
    expect(bar.getAttribute('style')).toContain('repeating-linear-gradient');
  });

  it('defaults to md size with 8px stripes', () => {
    const { container } = render(HazardStripe);
    const bar = container.querySelector('[aria-hidden="true"]')!;
    expect(bar.getAttribute('style')).toContain('8px');
    expect(bar.className).toContain('h-1');
  });

  it('applies sm size with 6px stripes', () => {
    const { container } = render(HazardStripe, { props: { size: 'sm' } });
    const bar = container.querySelector('[aria-hidden="true"]')!;
    expect(bar.getAttribute('style')).toContain('6px');
  });

  it('applies lg size with 12px stripes', () => {
    const { container } = render(HazardStripe, { props: { size: 'lg' } });
    const bar = container.querySelector('[aria-hidden="true"]')!;
    expect(bar.getAttribute('style')).toContain('12px');
    expect(bar.className).toContain('h-2');
  });

  it('uses custom angle', () => {
    const { container } = render(HazardStripe, { props: { angle: 90 } });
    const bar = container.querySelector('[aria-hidden="true"]')!;
    expect(bar.getAttribute('style')).toContain('90deg');
  });

  it('defaults to -45deg angle', () => {
    const { container } = render(HazardStripe);
    const bar = container.querySelector('[aria-hidden="true"]')!;
    expect(bar.getAttribute('style')).toContain('-45deg');
  });

  it('renders label between two stripe bars', () => {
    render(HazardStripe, { props: { label: 'SECTION' } });
    expect(screen.getByText('SECTION')).toBeTruthy();
  });

  it('renders two bars when label is provided', () => {
    const { container } = render(HazardStripe, { props: { label: 'TEST' } });
    const bars = container.querySelectorAll('[aria-hidden="true"]');
    expect(bars.length).toBe(2);
  });

  it('uses brand tokens in gradient', () => {
    const { container } = render(HazardStripe);
    const style = container.querySelector('[aria-hidden="true"]')!.getAttribute('style')!;
    expect(style).toContain('var(--accent)');
    expect(style).toContain('var(--background)');
  });
});
