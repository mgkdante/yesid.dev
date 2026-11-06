import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/svelte';
import type { ProjectsPageContent } from '#lib/types.ts';
import { projectFactory } from '../../../tests/factories';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/state', () => ({
	page: { url: new URL('http://localhost/projects') },
}));
vi.mock('@yesid/motion/utils/blueprintScrub', () => ({ blueprintScrub: () => undefined }));
vi.mock('#lib/motion/utils/flip.ts', () => ({
	captureFlipState: () => null,
	animateFlipTransition: () => undefined,
}));

import ProjectListingPage from './ProjectListingPage.svelte';

const projectsPage: ProjectsPageContent = {
	heading: { en: 'Projects', fr: 'Projets', es: 'Proyectos' },
	intro: { en: 'Selected work', fr: 'Travaux choisis', es: 'Trabajo elegido' },
	emptyState: { en: 'No projects.', fr: 'Aucun projet.', es: 'Sin proyectos.' },
};

afterEach(() => cleanup());

describe('ProjectListingPage cards', () => {
	it('shows each project card without a station number, pulsing dot or vertical line', () => {
		const projects = [
			projectFactory.build({ slug: 'first-project' }),
			projectFactory.build({ slug: 'second-project' }),
		];

		const { container } = render(ProjectListingPage, {
			props: {
				projects,
				serviceIds: [],
				services: [],
				serviceSvgContents: {},
				projectsPage,
			},
		});

		expect(screen.getAllByTestId('project-card')).toHaveLength(2);
		expect(container.querySelector('[data-slot="metro-station"]')).toBeNull();
		expect(container.querySelector('[data-slot="metro-station-pulse"]')).toBeNull();
		expect(container.querySelector('[data-metro-line]')).toBeNull();
		expect(screen.queryByText('01')).toBeNull();
		expect(screen.queryByText('02')).toBeNull();
	});
});
