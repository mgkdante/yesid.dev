import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import HeroMetrics from './HeroMetrics.svelte';
import { INITIAL_HERO_DATA } from '$lib/content';
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

  it('renders sub-labels for each metric (CMS templates, EN, {coverage}/{total} filled)', () => {
    render(HeroMetrics, { props: { metrics } });
    expect(screen.getAllByText('STM · LIVE').length).toBeGreaterThan(0);
    // delaySub template '{coverage}% COVERAGE' with coverage=87.6
    expect(screen.getAllByText('87.6% COVERAGE').length).toBeGreaterThan(0);
    // routesSub template 'OF {total} TOTAL' with total=203
    expect(screen.getAllByText('OF 203 TOTAL').length).toBeGreaterThan(0);
    // No unsubstituted placeholders leak through.
    expect(screen.queryByText(/\{coverage\}|\{total\}/)).toBeNull();
  });
});

// Regression: the dashboard card copy is CMS truth (siteLabels.heroDashboard).
// Inside a fr locale provider HeroMetrics must render the French labels/subs,
// with the {coverage}/{total} placeholders still substituted. The locale
// context keys on Symbol.for('yesid.locale') (see $lib/utils/locale-context).
describe('HeroMetrics — fr locale (CMS truth)', () => {
  const metrics = INITIAL_HERO_DATA.metrics;
  const frContext = new Map([[Symbol.for('yesid.locale'), () => 'fr']]);

  it('renders French labels from siteLabels.heroDashboard', () => {
    render(HeroMetrics, { props: { metrics }, context: frContext });
    expect(screen.getAllByText('VÉHICULES SUIVIS').length).toBeGreaterThan(0);
    expect(screen.getAllByText('RETARD MOYEN').length).toBeGreaterThan(0);
    expect(screen.getAllByText('LIGNES EN DIRECT').length).toBeGreaterThan(0);
  });

  it('renders French subs with {coverage}/{total} substituted', () => {
    render(HeroMetrics, { props: { metrics }, context: frContext });
    expect(screen.getAllByText('STM · EN DIRECT').length).toBeGreaterThan(0);
    expect(screen.getAllByText('87.6% DE COUVERTURE').length).toBeGreaterThan(0);
    expect(screen.getAllByText('SUR 203 AU TOTAL').length).toBeGreaterThan(0);
    // The EN copy must NOT leak into the French render.
    expect(screen.queryByText('VEHICLES TRACKED')).toBeNull();
    expect(screen.queryByText('OF 203 TOTAL')).toBeNull();
  });
});
