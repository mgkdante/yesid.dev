import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { projectFactory } from '../../../tests/factories';

const analyticsMocks = vi.hoisted(() => ({
	trackAnalyticsEvent: vi.fn(),
}));

vi.mock('#lib/analytics/client.ts', () => analyticsMocks);

import ProjectLinksCard from './ProjectLinksCard.svelte';

beforeEach(() => {
	analyticsMocks.trackAnalyticsEvent.mockClear();
});

async function clickWithoutNavigating(link: Element): Promise<void> {
	const preventNavigation = (event: Event) => event.preventDefault();
	link.addEventListener('click', preventNavigation);
	try {
		await fireEvent.click(link);
	} finally {
		link.removeEventListener('click', preventNavigation);
	}
}

describe('ProjectLinksCard high-intent analytics', () => {
	it('tracks one project proof event for the live-site link', async () => {
		const project = projectFactory.build({
			liveUrl: 'https://example.com/demo',
		});
		const { container } = render(ProjectLinksCard, {
			props: { project, sectionKey: 'test-links' },
		});
		const link = container.querySelector(
			'a[href="https://example.com/demo"]',
		);
		expect(link).not.toBeNull();

		await clickWithoutNavigating(link!);

		expect(analyticsMocks.trackAnalyticsEvent.mock.calls).toEqual([
			['project_proof_click', { link: 'live' }],
		]);
	});

	it('tracks one project proof event for a public repository link', async () => {
		const project = projectFactory.build({
			repoUrl: 'https://github.com/mgkdante/public-project',
			repoPrivate: false,
		});
		const { container } = render(ProjectLinksCard, {
			props: { project, sectionKey: 'test-links' },
		});
		const link = container.querySelector(
			'a[href="https://github.com/mgkdante/public-project"]',
		);
		expect(link).not.toBeNull();

		await clickWithoutNavigating(link!);

		expect(analyticsMocks.trackAnalyticsEvent.mock.calls).toEqual([
			['project_proof_click', { link: 'repo' }],
		]);
	});

	it('keeps a private repository non-clickable and untracked', async () => {
		const project = projectFactory.build({
			repoUrl: 'https://github.com/mgkdante/private-project',
			repoPrivate: true,
		});
		const { container } = render(ProjectLinksCard, {
			props: { project, sectionKey: 'test-links' },
		});

		expect(
			container.querySelector(
				'a[href="https://github.com/mgkdante/private-project"]',
			),
		).toBeNull();
		await fireEvent.click(screen.getByTestId('project-repo-private'));
		expect(analyticsMocks.trackAnalyticsEvent).not.toHaveBeenCalled();
	});

	it.each(['not a url', 'mailto:contact@yesid.dev'])(
		'does not track an invalid rendered proof URL %s',
		async (liveUrl) => {
			const project = projectFactory.build({ liveUrl });
			const { container } = render(ProjectLinksCard, {
				props: { project, sectionKey: 'test-links' },
			});
			const link = container.querySelector(`a[href="${liveUrl}"]`);
			expect(link).not.toBeNull();

			await clickWithoutNavigating(link!);
			expect(analyticsMocks.trackAnalyticsEvent).not.toHaveBeenCalled();
		},
	);

	it('renders no links card when the project has no proof links', () => {
		const project = projectFactory.build({
			liveUrl: undefined,
			repoUrl: undefined,
			repoPrivate: false,
		});
		render(ProjectLinksCard, {
			props: { project, sectionKey: 'test-links' },
		});

		expect(screen.queryByTestId('project-links-card')).toBeNull();
		expect(analyticsMocks.trackAnalyticsEvent).not.toHaveBeenCalled();
	});
});

describe('ProjectLinksCard documentation link', () => {
	it('renders and tracks the published Documentation link beside the other links', async () => {
		const project = projectFactory.build({
			repoUrl: 'https://github.com/mgkdante/public-project',
			docsUrl: 'https://yesid-dev.notion.site/wiki',
		});
		render(ProjectLinksCard, { props: { project, sectionKey: 'test-links' } });
		const link = screen.getByTestId('project-docs-link');
		expect(link).toHaveAttribute('href', 'https://yesid-dev.notion.site/wiki');
		expect(link).toHaveAttribute('target', '_blank');
		expect(link).toHaveTextContent('Documentation');
		await clickWithoutNavigating(link);
		expect(analyticsMocks.trackAnalyticsEvent.mock.calls).toEqual([
			['project_proof_click', { link: 'docs' }],
		]);
	});

	it('shows the links card for a project that only has documentation', () => {
		const project = projectFactory.build({ docsUrl: 'https://yesid-dev.notion.site/wiki', liveUrl: undefined, repoUrl: undefined, repoPrivate: false });
		render(ProjectLinksCard, { props: { project, sectionKey: 'test-links' } });
		expect(screen.getByTestId('project-links-card')).toBeInTheDocument();
	});
});
