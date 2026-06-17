import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/svelte';
import ServiceDetailPage from './ServiceDetailPage.svelte';
import { projectFactory, serviceFactory } from '../../../tests/factories';

const text = (en: string) => ({ en });

describe('ServiceDetailPage TOC badges', () => {
	it('uses the shared icon registry for service cards and matching TOC badges', () => {
		const service = serviceFactory.build({
			id: 'database-work',
			station: 1,
			title: text('Database Work'),
			description: text('Reliable database systems.'),
			valueProposition: text('Make the database boring.'),
			deliverables: [text('Schema review')],
			stack: ['Postgres'],
			relatedProjects: ['yesid-dev'],
		});
		const relatedProject = projectFactory.build({
			slug: 'yesid-dev',
			title: text('yesid.dev'),
		});

		const { container } = render(ServiceDetailPage, {
			props: {
				service,
				services: [service],
				relatedProjects: [relatedProject],
				serviceSvgContents: {},
			},
		});

		const toc = container.querySelector('.impact-toc');
		expect(toc).toBeTruthy();
		expect(within(toc as HTMLElement).getByTestId('section-toc-icon')).toBeInTheDocument();
		expect(within(toc as HTMLElement).getByTestId('section-eye-icon')).toBeInTheDocument();
		expect(within(toc as HTMLElement).getByTestId('section-list-icon')).toBeInTheDocument();

		expect(screen.getAllByTestId('section-eye-icon')).toHaveLength(2);
		expect(screen.getAllByTestId('section-list-icon')).toHaveLength(2);
		expect(screen.getAllByTestId('section-layers-icon').length).toBeGreaterThanOrEqual(2);
		expect(screen.getAllByTestId('section-briefcase-icon').length).toBeGreaterThanOrEqual(2);
	});
});
