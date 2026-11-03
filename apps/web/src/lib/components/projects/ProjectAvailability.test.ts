import { describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/svelte';
import { projects } from '#lib/content/projects.ts';
import ProjectCard from './ProjectCard.svelte';
import ProjectDetailPage from './ProjectDetailPage.svelte';

describe('wip project labels', () => {
	it.each([
		['en', 'Work in progress'],
		['fr', 'Travail en cours'],
		['es', 'Trabajo en curso'],
	] as const)('labels both card variants and the page in %s, even without proof links', (locale, label) => {
		const project = { ...projects[0]!, status: 'wip' as const, liveUrl: undefined, repoUrl: undefined, docsUrl: undefined, repoPrivate: false, image: undefined, sections: [] };
		const context = new Map([[Symbol.for('@yesid/ui/locale'), () => locale]]);
		for (const variant of ['listing', 'proof'] as const) {
			const { getByText } = render(ProjectCard, { props: { project, variant }, context });
			expect(getByText(label)).toBeVisible();
			cleanup();
		}
		const { getByText } = render(ProjectDetailPage, { props: { project, services: [], serviceSvgContents: {} }, context });
		expect(getByText(label)).toBeVisible();
	});
	it('does not label a public project as in progress', () => {
		const { queryByText } = render(ProjectCard, { project: { ...projects[0]!, status: 'public' } });
		expect(queryByText('Work in progress')).toBeNull();
	});
});
