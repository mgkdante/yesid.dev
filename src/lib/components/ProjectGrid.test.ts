import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ProjectGrid from './ProjectGrid.svelte';

const makeProject = (slug: string, title: string) => ({
	title,
	oneLiner: `${title} one-liner.`,
	slug,
	tags: ['sql'],
	status: 'public' as const
});

describe('ProjectGrid', () => {
	it('renders the correct number of cards', () => {
		const projects = [makeProject('project-a', 'Project A'), makeProject('project-b', 'Project B')];
		render(ProjectGrid, { props: { projects } });
		expect(screen.getAllByTestId('project-card')).toHaveLength(2);
	});

	it('renders each project title', () => {
		const projects = [makeProject('project-a', 'Project A'), makeProject('project-b', 'Project B')];
		render(ProjectGrid, { props: { projects } });
		expect(screen.getByText('Project A')).toBeInTheDocument();
		expect(screen.getByText('Project B')).toBeInTheDocument();
	});

	it('renders nothing when projects array is empty', () => {
		render(ProjectGrid, { props: { projects: [] } });
		expect(screen.queryByTestId('project-grid')).not.toBeInTheDocument();
	});

	it('renders a single project correctly', () => {
		render(ProjectGrid, { props: { projects: [makeProject('solo', 'Solo Project')] } });
		expect(screen.getByTestId('project-grid')).toBeInTheDocument();
		expect(screen.getAllByTestId('project-card')).toHaveLength(1);
		expect(screen.getByText('Solo Project')).toBeInTheDocument();
	});
});
