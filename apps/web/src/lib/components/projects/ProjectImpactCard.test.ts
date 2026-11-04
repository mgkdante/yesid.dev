import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { projectFactory } from '../../../tests/factories';
import ProjectImpactCard from './ProjectImpactCard.svelte';

describe('ProjectImpactCard', () => {
	it('renders cited and uncited claims without empty proof links', () => {
		const project = projectFactory.build({ impactMetrics: [
			{ value: { en: '30 s' }, label: { en: 'synthetic cited claim' }, sourceUrl: 'https://example.org/evidence', asOf: '2026-11-04' },
			{ value: { en: '0' }, label: { en: 'synthetic uncited claim' } },
		] });
		render(ProjectImpactCard, { project });
		expect(screen.getByText('30 s')).toBeTruthy();
		expect(screen.getByText('0')).toBeTruthy();
		expect(screen.getAllByTestId('metric-proof')).toHaveLength(1);
		expect(screen.getByRole('link', { name: 'Source: synthetic cited claim' }).getAttribute('href')).toBe('https://example.org/evidence');
	});
});
