import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import HeroMetrics from './HeroMetrics.svelte';
import { INITIAL_HERO_DATA } from '$lib/data';

describe('HeroMetrics', () => {
  const metrics = INITIAL_HERO_DATA.metrics;

  it('renders 3 metric cards', () => {
    render(HeroMetrics, { props: { metrics } });
    const cards = screen.getAllByTestId('metric-card');
    expect(cards).toHaveLength(3);
  });

  it('renders vehicle count with comma formatting', () => {
    render(HeroMetrics, { props: { metrics } });
    expect(screen.getByTestId('metric-value-vehicles').textContent).toContain('1,247');
  });

  it('renders delay with unit suffix', () => {
    render(HeroMetrics, { props: { metrics } });
    expect(screen.getByTestId('metric-value-delay').textContent).toContain('47.3');
    expect(screen.getByTestId('metric-value-delay').textContent).toContain('s');
  });

  it('renders routes count', () => {
    render(HeroMetrics, { props: { metrics } });
    expect(screen.getByTestId('metric-value-routes').textContent).toContain('186');
  });

  it('renders labels for each card', () => {
    render(HeroMetrics, { props: { metrics } });
    expect(screen.getByText('VEHICLES TRACKED')).toBeInTheDocument();
    expect(screen.getByText('AVG DELAY')).toBeInTheDocument();
    expect(screen.getByText('ROUTES LIVE')).toBeInTheDocument();
  });

  it('renders sub-labels for each card', () => {
    render(HeroMetrics, { props: { metrics } });
    expect(screen.getByText(/STM/)).toBeInTheDocument();
    expect(screen.getByText(/COVERAGE/)).toBeInTheDocument();
    expect(screen.getByText(/OF 203 TOTAL/)).toBeInTheDocument();
  });
});
