import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ProjectsStrip from './ProjectsStrip.svelte';
import type { Project } from '$lib/types';
import { projectFactory } from '../../../tests/factories';

const mockProjects: Project[] = [
	projectFactory.build({ slug: 'transit-data-pipeline', title: { en: 'Transit Data Pipeline' } }),
	projectFactory.build({ slug: 'lorem-query-optimizer', title: { en: 'Query Optimizer' } }),
];
const singleProject = [
	projectFactory.build({ slug: 'transit-data-pipeline', title: { en: 'Transit Data Pipeline' } }),
];

describe('ProjectsStrip', () => {
	it('renders with data-testid', () => {
		render(ProjectsStrip, { props: { projects: mockProjects } });
		expect(screen.getByTestId('projects-strip')).toBeTruthy();
	});

	it('renders project links with correct hrefs', () => {
		render(ProjectsStrip, { props: { projects: mockProjects } });
		const links = screen.getAllByRole('link');
		expect(links).toHaveLength(mockProjects.length);
		expect(links[0].getAttribute('href')).toBe('/projects/transit-data-pipeline');
		expect(links[1].getAttribute('href')).toBe('/projects/lorem-query-optimizer');
	});

	it('renders the plural project count for many projects', () => {
		render(ProjectsStrip, { props: { projects: mockProjects } });
		expect(screen.getByText('2 PROJECTS')).toBeTruthy();
	});

	it('renders one project with the singular count', () => {
		render(ProjectsStrip, { props: { projects: singleProject } });
		const link = screen.getByRole('link', { name: 'Transit Data Pipeline' });
		expect(link.getAttribute('href')).toBe('/projects/transit-data-pipeline');
		expect(screen.getAllByRole('link')).toHaveLength(1);
		expect(screen.getByText('1 PROJECT')).toBeTruthy();
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
		expect(screen.queryAllByRole('link')).toHaveLength(0);
	});
});
