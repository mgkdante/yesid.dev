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
    expect(screen.getByText(/1,247/)).toBeInTheDocument();
  });

  it('renders delay with unit suffix', () => {
    render(HeroMetrics, { props: { metrics } });
    expect(screen.getByText(/47\.3s/)).toBeInTheDocument();
  });

  it('renders routes count', () => {
    render(HeroMetrics, { props: { metrics } });
    expect(screen.getByText(/186/)).toBeInTheDocument();
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
