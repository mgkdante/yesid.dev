import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import StopLabel from '../StopLabel.svelte';

describe('StopLabel', () => {
  it('renders stop number and label', () => {
    render(StopLabel, { props: { stop: '03', label: 'STACK' } });
    expect(screen.getByText('STOP 03 — STACK')).toBeTruthy();
  });

  it('renders with different stop values', () => {
    render(StopLabel, { props: { stop: '07', label: 'CONTACT' } });
    expect(screen.getByText('STOP 07 — CONTACT')).toBeTruthy();
  });

  it('uses the stop-label class', () => {
    const { container } = render(StopLabel, { props: { stop: '01', label: 'TEST' } });
    const div = container.querySelector('.stop-label');
    expect(div).toBeTruthy();
  });
});
