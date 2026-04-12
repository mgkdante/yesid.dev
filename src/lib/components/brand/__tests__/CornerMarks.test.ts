import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import CornerMarks from '../CornerMarks.svelte';

describe('CornerMarks', () => {
  it('renders four corner marks', () => {
    const { container } = render(CornerMarks);
    const marks = container.querySelectorAll('.mark');
    expect(marks.length).toBe(4);
  });

  it('has all four corner positions', () => {
    const { container } = render(CornerMarks);
    expect(container.querySelector('.mark-tl')).toBeTruthy();
    expect(container.querySelector('.mark-tr')).toBeTruthy();
    expect(container.querySelector('.mark-bl')).toBeTruthy();
    expect(container.querySelector('.mark-br')).toBeTruthy();
  });

  it('is hidden from assistive tech', () => {
    const { container } = render(CornerMarks);
    const wrapper = container.querySelector('.corner-marks')!;
    expect(wrapper.getAttribute('aria-hidden')).toBe('true');
  });

  it('defaults to sm size (12px arms)', () => {
    const { container } = render(CornerMarks);
    const style = container.querySelector('.corner-marks')!.getAttribute('style')!;
    expect(style).toContain('--arm: 12px');
  });

  it('applies md size (32px arms)', () => {
    const { container } = render(CornerMarks, { props: { size: 'md' } });
    const style = container.querySelector('.corner-marks')!.getAttribute('style')!;
    expect(style).toContain('--arm: 32px');
  });

  it('applies custom opacity', () => {
    const { container } = render(CornerMarks, { props: { opacity: 0.8 } });
    const style = container.querySelector('.corner-marks')!.getAttribute('style')!;
    expect(style).toContain('--mark-opacity: 0.8');
  });
});
