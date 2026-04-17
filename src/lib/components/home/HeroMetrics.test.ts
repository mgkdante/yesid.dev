import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import HeroMetrics from './HeroMetrics.svelte';
import { INITIAL_HERO_DATA } from '$lib/data';

// Note: HeroMetrics renders TWO variants — a single-card mobile variant
// (data-testid="metric-card-mobile") and a 3-card desktop variant
// (data-testid="metric-card"). Both are in the DOM at all times; CSS
// hides the inactive one. Tests that look up text therefore use
// getAllByText and assert ≥1 match (the text appears in both variants).

describe('HeroMetrics', () => {
  const metrics = INITIAL_HERO_DATA.metrics;

  it('renders 3 desktop metric cards', () => {
    render(HeroMetrics, { props: { metrics } });
    const cards = screen.getAllByTestId('metric-card');
    expect(cards).toHaveLength(3);
  });

  it('renders 1 mobile metric card wrapper', () => {
    render(HeroMetrics, { props: { metrics } });
    const mobileCards = screen.getAllByTestId('metric-card-mobile');
    expect(mobileCards).toHaveLength(1);
  });

  it('renders vehicle count with comma formatting', () => {
    render(HeroMetrics, { props: { metrics } });
    expect(screen.getAllByText(/1,247/).length).toBeGreaterThan(0);
  });

  it('renders delay with unit suffix', () => {
    render(HeroMetrics, { props: { metrics } });
    expect(screen.getAllByText(/47\.3s/).length).toBeGreaterThan(0);
  });

  it('renders routes count', () => {
    render(HeroMetrics, { props: { metrics } });
    expect(screen.getAllByText(/186/).length).toBeGreaterThan(0);
  });

  it('renders labels for each metric', () => {
    render(HeroMetrics, { props: { metrics } });
    expect(screen.getAllByText('VEHICLES TRACKED').length).toBeGreaterThan(0);
    expect(screen.getAllByText('AVG DELAY').length).toBeGreaterThan(0);
    expect(screen.getAllByText('ROUTES LIVE').length).toBeGreaterThan(0);
  });

  it('renders sub-labels for each metric', () => {
    render(HeroMetrics, { props: { metrics } });
    expect(screen.getAllByText(/STM/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/COVERAGE/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/OF 203 TOTAL/).length).toBeGreaterThan(0);
  });
});
