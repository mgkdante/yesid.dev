import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import SectionLabel from '../SectionLabel.svelte';

describe('SectionLabel', () => {
  it('renders the text', () => {
    render(SectionLabel, { props: { text: 'HELLO' } });
    expect(screen.getByText('HELLO')).toBeTruthy();
  });

  it('defaults to section variant', () => {
    const { container } = render(SectionLabel, { props: { text: 'Test' } });
    const span = container.querySelector('span')!;
    expect(span.className).toContain('label-section');
  });

  it('applies station variant', () => {
    const { container } = render(SectionLabel, { props: { text: 'Test', variant: 'station' } });
    const span = container.querySelector('span')!;
    expect(span.className).toContain('label-station');
  });

  it('applies metric variant', () => {
    const { container } = render(SectionLabel, { props: { text: 'Test', variant: 'metric' } });
    const span = container.querySelector('span')!;
    expect(span.className).toContain('label-metric');
  });

  it('defaults to left alignment', () => {
    const { container } = render(SectionLabel, { props: { text: 'Test' } });
    const span = container.querySelector('span')!;
    expect(span.className).not.toContain('text-center');
  });

  it('applies center alignment', () => {
    const { container } = render(SectionLabel, { props: { text: 'Test', align: 'center' } });
    const span = container.querySelector('span')!;
    expect(span.className).toContain('text-center');
    expect(span.className).toContain('block');
  });
});
