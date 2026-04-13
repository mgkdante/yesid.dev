import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import MetricDisplay from '../MetricDisplay.svelte';

describe('MetricDisplay', () => {
  it('renders value and label', () => {
    render(MetricDisplay, { props: { value: '99.9%', label: 'UPTIME' } });
    expect(screen.getByText('99.9%')).toBeTruthy();
    expect(screen.getByText('UPTIME')).toBeTruthy();
  });

  it('renders sublabel when provided', () => {
    render(MetricDisplay, { props: { value: '5+', label: 'YEARS', sublabel: 'and counting' } });
    expect(screen.getByText('and counting')).toBeTruthy();
  });

  it('does not render sublabel when not provided', () => {
    const { container } = render(MetricDisplay, { props: { value: '5+', label: 'YEARS' } });
    const spans = container.querySelectorAll('span');
    // Only value + label spans, no sublabel
    expect(spans.length).toBe(2);
  });

  it('applies label-metric class to label', () => {
    const { container } = render(MetricDisplay, { props: { value: '30+', label: 'DATABASES' } });
    const labelEl = container.querySelector('.label-metric');
    expect(labelEl).toBeTruthy();
    expect(labelEl!.textContent).toBe('DATABASES');
  });

  it('defaults to md size', () => {
    const { container } = render(MetricDisplay, { props: { value: '5+', label: 'TEST' } });
    const valueEl = container.querySelectorAll('span')[1];
    expect(valueEl.className).toContain('text-title');
  });

  it('applies sm size', () => {
    const { container } = render(MetricDisplay, { props: { value: '5+', label: 'TEST', size: 'sm' } });
    const valueEl = container.querySelectorAll('span')[1];
    expect(valueEl.className).toContain('text-heading');
  });

  it('applies lg size', () => {
    const { container } = render(MetricDisplay, { props: { value: '5+', label: 'TEST', size: 'lg' } });
    const valueEl = container.querySelectorAll('span')[1];
    expect(valueEl.className).toContain('text-display');
  });

  it('uses brand-primary for value color', () => {
    const { container } = render(MetricDisplay, { props: { value: '5+', label: 'TEST' } });
    const valueEl = container.querySelectorAll('span')[1];
    expect(valueEl.className).toContain('text-primary');
  });
});
