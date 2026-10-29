import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/svelte';
import { siteLabels } from '#lib/content/index.ts';
import { resolveLocale } from '#lib/utils/locale.ts';
import { projectFactory } from '../../../tests/factories';
import ProjectDetailPage from './ProjectDetailPage.svelte';

const mermaid = vi.hoisted(() => ({
	initialize: vi.fn(),
	render: vi.fn().mockResolvedValue({ svg: '<svg role="img" aria-label="README diagram"></svg>' }),
}));
vi.mock('mermaid', () => ({ default: mermaid }));
vi.mock('#lib/directus/assets.ts', () => ({
	asset: (id: string) => `/test-assets/${id}`,
	buildSrcSet: () => '',
	assetImage: (id: string) => ({ src: `/test-assets/${id}` }),
}));

afterEach(() => {
	cleanup();
	Reflect.deleteProperty(navigator, 'clipboard');
});

describe('ProjectDetailPage README', () => {
	it('anchors headings, copies fences through the CMS code block and draws Mermaid', async () => {
		const writeText = vi.fn().mockResolvedValue(undefined);
		Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
		const project = projectFactory.build({ slug: 'readme-project', sections: [], relatedServices: [] });
		const readme = [
			{ html: '<h2>README heading</h2>' },
			{ fence: '```sh\nbun test\n```', highlighted: 'bun test' },
			{ fence: '```mermaid\nflowchart LR\n  a --> b\n```' },
		];
		render(ProjectDetailPage, { props: { project, services: [], serviceSvgContents: {}, readme } });

		const heading = screen.getByRole('heading', { name: /README heading/ });
		expect(heading).toHaveAttribute('id', 'readme-h-0');
		expect(within(heading).getByRole('link')).toHaveAttribute('href', '#readme-h-0');

		const labels = siteLabels.blogChrome.detail.code;
		const button = screen.getByRole('button', { name: resolveLocale(labels.copyAria, 'en') });
		await fireEvent.click(button);
		expect(writeText).toHaveBeenCalledWith('bun test');
		await vi.waitFor(() =>
			expect(within(button.parentElement!).getByRole('status')).toHaveTextContent(resolveLocale(labels.copiedLabel, 'en')),
		);

		expect(await screen.findByRole('img', { name: 'README diagram' })).toBeInTheDocument();
	});
});
