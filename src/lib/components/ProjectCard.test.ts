import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ProjectCard from './ProjectCard.svelte';

const baseProps = {
	title: 'Transit Data Pipeline',
	oneLiner: 'Real-time transit data processing at scale.',
	slug: 'transit-data-pipeline',
	tags: ['python', 'postgresql'],
	status: 'public' as const
};

describe('ProjectCard', () => {
	it('renders title and one-liner', () => {
		render(ProjectCard, { props: baseProps });
		expect(screen.getByText('Transit Data Pipeline')).toBeInTheDocument();
		expect(screen.getByText('Real-time transit data processing at scale.')).toBeInTheDocument();
	});

	it('links to /work/[slug]', () => {
		render(ProjectCard, { props: baseProps });
		const link = screen.getByTestId('project-card');
		expect(link.tagName).toBe('A');
		expect(link).toHaveAttribute('href', '/work/transit-data-pipeline');
	});

	it('renders tags via TagList', () => {
		render(ProjectCard, { props: baseProps });
		expect(screen.getByText('python')).toBeInTheDocument();
		expect(screen.getByText('postgresql')).toBeInTheDocument();
	});

	it('renders no status badge for public projects', () => {
		render(ProjectCard, { props: { ...baseProps, status: 'public' } });
		expect(screen.queryByTestId('status-badge')).not.toBeInTheDocument();
	});

	it('renders WIP badge for wip status', () => {
		render(ProjectCard, { props: { ...baseProps, status: 'wip' } });
		const badge = screen.getByTestId('status-badge');
		expect(badge).toBeInTheDocument();
		expect(badge).toHaveTextContent('WIP');
	});

	it('renders Private badge for private status', () => {
		render(ProjectCard, { props: { ...baseProps, status: 'private' } });
		const badge = screen.getByTestId('status-badge');
		expect(badge).toBeInTheDocument();
		expect(badge).toHaveTextContent('Private');
	});

	it('renders correctly with empty tags array', () => {
		render(ProjectCard, { props: { ...baseProps, tags: [] } });
		// TagList should not be in DOM when tags is empty
		expect(screen.queryByTestId('tag-list')).not.toBeInTheDocument();
	});

	it('handles a long title without error', () => {
		const longTitle = 'Very Long Project Name '.repeat(5).trim();
		render(ProjectCard, { props: { ...baseProps, title: longTitle } });
		expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
	});
});
