import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import HeroSqlPanel from './HeroSqlPanel.svelte';
import { INITIAL_HERO_DATA } from '$lib/data';

describe('HeroSqlPanel', () => {
  const props = {
    rows: INITIAL_HERO_DATA.queryRows,
    queryTime: INITIAL_HERO_DATA.queryTime,
    prompt: 'yesid@transit:gold>',
    liveLabel: 'LIVE',
  };

  it('renders the terminal prompt', () => {
    render(HeroSqlPanel, { props });
    expect(screen.getByTestId('sql-prompt').textContent).toContain('yesid@transit');
  });

  it('renders the LIVE indicator', () => {
    render(HeroSqlPanel, { props });
    expect(screen.getByTestId('sql-live')).toBeInTheDocument();
    expect(screen.getByTestId('sql-live').textContent).toContain('LIVE');
  });

  it('renders the SQL query with syntax highlighting', () => {
    render(HeroSqlPanel, { props });
    const query = screen.getByTestId('sql-query');
    expect(query.textContent).toContain('SELECT');
    expect(query.textContent).toContain('gold.latest_trip_delay_snapshot');
    expect(query.textContent).toContain('LIMIT');
  });

  it('renders 5 result rows', () => {
    render(HeroSqlPanel, { props });
    const rows = screen.getAllByTestId('sql-result-row');
    expect(rows).toHaveLength(5);
  });

  it('renders result column headers', () => {
    render(HeroSqlPanel, { props });
    expect(screen.getByText('route')).toBeInTheDocument();
    expect(screen.getByText('avg_delay_s')).toBeInTheDocument();
    // "vehicles" appears in both the SQL query and column header
    const vehiclesElements = screen.getAllByText('vehicles');
    expect(vehiclesElements.length).toBeGreaterThanOrEqual(1);
  });

  it('renders meta line with query time', () => {
    render(HeroSqlPanel, { props });
    const meta = screen.getByTestId('sql-meta');
    expect(meta.textContent).toContain('5 rows');
    expect(meta.textContent).toContain('0.023s');
  });
});
