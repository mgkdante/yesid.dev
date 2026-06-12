import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import StopLabel from '../StopLabel.svelte';

describe('StopLabel', () => {
  it('renders stop number and label', () => {
    const { container } = render(StopLabel, { props: { stop: '03', label: 'STACK' } });
    expect(container.querySelector('.stop-label')?.textContent).toBe('STOP 03 — STACK');
  });

  it('renders with different stop values', () => {
    const { container } = render(StopLabel, { props: { stop: '07', label: 'CONTACT' } });
    expect(container.querySelector('.stop-label')?.textContent).toBe('STOP 07 — CONTACT');
  });

  it('uses the stop-label class', () => {
    const { container } = render(StopLabel, { props: { stop: '01', label: 'TEST' } });
    const div = container.querySelector('.stop-label');
    expect(div).toBeTruthy();
  });

  // GO2-W5 wayfinding plate: the digits speak the yellow voice.
  it('wraps the stop digits in the accent-text wayfinding span', () => {
    const { container } = render(StopLabel, { props: { stop: '05', label: 'ABOUT' } });
    const num = container.querySelector('.stop-label-num');
    expect(num?.textContent).toBe('STOP 05');
    expect(screen.getByText('STOP 05')).toBeTruthy();
  });
});
