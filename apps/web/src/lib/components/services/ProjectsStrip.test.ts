import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ProjectsStrip from './ProjectsStrip.svelte';
import type { Project } from '$lib/types';

const mockProjects: Project[] = [
	{
		slug: 'transit-data-pipeline',
		title: { en: 'Transit Data Pipeline' },
		oneLiner: { en: '' },
		description: { en: '' },
		stack: [],
		tags: [],
		status: 'public',
		featured: false,
		relatedServices: [],
		sections: []
	},
	{
		slug: 'lorem-query-optimizer',
		title: { en: 'Query Optimizer' },
		oneLiner: { en: '' },
		description: { en: '' },
		stack: [],
		tags: [],
		status: 'public',
		featured: false,
		relatedServices: [],
		sections: []
	},
];

describe('ProjectsStrip', () => {
	it('renders with data-testid', () => {
		render(ProjectsStrip, { props: { projects: mockProjects } });
		expect(screen.getByTestId('projects-strip')).toBeTruthy();
	});

	it('renders project links with correct hrefs', () => {
		render(ProjectsStrip, { props: { projects: mockProjects } });
		const links = screen.getAllByRole('link');
		expect(links[0].getAttribute('href')).toBe('/projects/transit-data-pipeline');
		expect(links[1].getAttribute('href')).toBe('/projects/lorem-query-optimizer');
	});

	it('renders project count', () => {
		render(ProjectsStrip, { props: { projects: mockProjects } });
		expect(screen.getByText('2 PROJECTS')).toBeTruthy();
	});

	it('renders contextual label when serviceTitle is provided', () => {
		render(ProjectsStrip, {
			props: { projects: mockProjects, serviceTitle: 'SQL Development' }
		});
		expect(screen.getByText('Built with SQL Development')).toBeTruthy();
	});

	it('renders default label when serviceTitle is omitted', () => {
		render(ProjectsStrip, { props: { projects: mockProjects } });
		expect(screen.getByText('Built with this')).toBeTruthy();
	});

	it('renders empty state when no projects', () => {
		render(ProjectsStrip, { props: { projects: [] } });
		expect(screen.getByText('0 PROJECTS')).toBeTruthy();
	});
});
