import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ProofStrip from './ProofStrip.svelte';

const mockProjects = [
	{
		slug: 'transit-data-pipeline',
		title: { en: 'Transit Data Pipeline' },
		oneLiner: { en: 'ELT for transit' },
		description: { en: '' },
		stack: [],
		tags: [],
		status: 'public' as const,
		featured: false,
		relatedServices: [],
		sections: []
	},
	{
		slug: 'lorem-query-optimizer',
		title: { en: 'Query Optimizer' },
		oneLiner: { en: 'SQL analysis' },
		description: { en: '' },
		stack: [],
		tags: [],
		status: 'public' as const,
		featured: false,
		relatedServices: [],
		sections: []
	}
];

describe('ProofStrip', () => {
	it('renders project count', () => {
		render(ProofStrip, { props: { projects: mockProjects } });
		expect(screen.getByText('2 projects')).toBeTruthy();
	});

	it('renders project titles', () => {
		render(ProofStrip, { props: { projects: mockProjects } });
		expect(screen.getByText('Transit Data Pipeline')).toBeTruthy();
		expect(screen.getByText('Query Optimizer')).toBeTruthy();
	});

	it('links projects to /work/[slug]', () => {
		render(ProofStrip, { props: { projects: mockProjects } });
		const links = screen.getAllByRole('link');
		expect(links[0].getAttribute('href')).toBe('/work/transit-data-pipeline');
	});

	it('renders label text', () => {
		render(ProofStrip, { props: { projects: mockProjects } });
		expect(screen.getByText('Built with this')).toBeTruthy();
	});
});
