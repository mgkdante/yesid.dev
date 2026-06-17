import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/svelte';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cwd } from 'node:process';
import type { BlockEditorDoc } from '@repo/shared';
import ProjectDetailPage from './ProjectDetailPage.svelte';
import { projectFactory } from '../../../tests/factories';
import { themeStore } from '$lib/stores/theme.svelte';

vi.mock('$lib/directus/assets', () => ({
	asset: (id: string, preset?: string) => `/test-assets/${id}${preset ? `?key=${preset}` : ''}`,
	buildSrcSet: () => '',
}));

const doc = (text: string): BlockEditorDoc => ({
	time: 1700000000000,
	version: '2.31.2',
	blocks: [{ id: 'p1', type: 'paragraph', data: { text } }],
});

const technicalDoc = (): BlockEditorDoc => ({
	time: 1700000000000,
	version: '2.31.2',
	blocks: [
		{ id: 'p1', type: 'paragraph', data: { text: 'Technical body' } },
		{
			id: 'guarantees',
			type: 'nestedlist',
			data: {
				style: 'unordered',
				items: [
					{ content: 'Generated cache contract', items: [] },
					{ content: 'Zero CMS calls per visit', items: [] },
				],
			},
		},
		{
			id: 'diagram',
			type: 'code',
			data: {
				code: [
					'mermaid',
					'flowchart LR',
					'  directus["Directus CMS"] --> export["export-fallbacks.ts"]',
					'  export --> cache["generated TypeScript cache"]',
				].join('\n'),
			},
		},
		{
			id: 'regen-script',
			type: 'code',
			data: {
				code: [
					'```sh',
					'export OP_SERVICE_ACCOUNT_TOKEN="$(grep ^OP_TOKEN= .env | cut -d= -f2-)"',
					'op run --env-file=apps/cms/.env -- env PUBLIC_DIRECTUS_URL=https://cms.dev.yesid.dev bun apps/cms/scripts/export-fallbacks.ts --module=projects',
					'```',
				].join('\n'),
			},
		},
		{
			id: 'cache-contract',
			type: 'code',
			data: {
				code: [
					'```ts',
					'export const projects = [...] satisfies Project[];',
					'```',
				].join('\n'),
			},
		},
	],
});

describe('ProjectDetailPage image placement', () => {
	afterEach(() => {
		themeStore.set('dark');
		document.documentElement.dataset.theme = 'dark';
	});

	it('renders image-only sections under the TOC with an image icon and closes the viewer on backdrop click', async () => {
		const project = projectFactory.build({
			title: { en: 'yesid.dev' },
			oneLiner: {
				en: 'A bilingual CMS portfolio that edits in Directus and serves visitors from generated edge-ready content.',
			},
			image: 'hero-image-uuid',
			liveUrl: 'https://yesid.dev',
			repoUrl: 'https://github.com/mgkdante/yesid.dev',
			stack: ['SvelteKit'],
			description: { en: doc('Overview text') },
			sections: [
				{
					title: { en: 'Images' },
					content: {
						en: {
							time: 1700000000000,
							version: '2.31.2',
							blocks: [
								{
									id: 'desktop',
									type: 'image',
									data: {
										file: { fileId: 'desktop-uuid', fileURL: '/files/desktop-uuid', url: '/assets/desktop-uuid' },
										caption: 'Desktop showcase',
										withBorder: true,
										withBackground: false,
										stretched: true,
									},
								},
								{
									id: 'mobile',
									type: 'image',
									data: {
										file: { fileId: 'mobile-uuid', fileURL: '/files/mobile-uuid', url: '/assets/mobile-uuid' },
										caption: 'Mobile showcase',
										withBorder: true,
										withBackground: false,
										stretched: true,
									},
								},
							],
						},
					},
				},
				{ title: { en: 'Second section' }, content: { en: doc('Second body') } },
				{ title: { en: 'Technical proof' }, content: { en: technicalDoc() } },
			],
		});

		const { container } = render(ProjectDetailPage, {
			props: {
				project,
				services: [],
				serviceSvgContents: {},
			},
		});

		expect(
			screen.getByText(
				'A bilingual CMS portfolio that edits in Directus and serves visitors from generated edge-ready content.',
			),
		).toBeInTheDocument();

		const firstSection = container.querySelector('[data-section-index="0"]');
		const mobileGalleryStack = screen.getByTestId('project-image-gallery-mobile');

		expect(firstSection).toBeTruthy();
		expect(within(firstSection as HTMLElement).getByText('01')).toBeInTheDocument();
		expect(within(firstSection as HTMLElement).getByText('Second section')).toBeInTheDocument();
		expect(firstSection?.querySelector('[data-testid="project-image-gallery"]')).toBeNull();
		expect(
			Boolean(
				firstSection &&
					mobileGalleryStack &&
					firstSection.compareDocumentPosition(mobileGalleryStack) &
						Node.DOCUMENT_POSITION_FOLLOWING,
			),
		).toBe(true);
		expect(screen.getByTestId('mermaid-diagram')).toBeInTheDocument();
		expect(screen.getByText(/Directus CMS/)).toBeInTheDocument();
		expect(screen.getAllByText(/export-fallbacks\.ts/).length).toBeGreaterThanOrEqual(2);
		expect(screen.getByText(/generated TypeScript cache/)).toBeInTheDocument();
		expect(screen.getByText('Generated cache contract')).toBeInTheDocument();
		expect(screen.getByText('Zero CMS calls per visit')).toBeInTheDocument();
		const codePayloads = [...container.querySelectorAll<HTMLElement>('[data-code-copy]')]
			.map((node) => node.getAttribute('data-code-copy') ?? '');
		expect(codePayloads.some((payload) => payload.includes('op run --env-file=apps/cms/.env'))).toBe(true);
		expect(codePayloads).toContain('export const projects = [...] satisfies Project[];');
		expect(screen.getAllByTestId('code-block-language').map((node) => node.textContent)).toEqual(['sh', 'ts']);

		const tocCard = container.querySelector('.toc-column [data-slot="card"]');
		expect(tocCard).toBeTruthy();
		expect(within(tocCard as HTMLElement).getByTestId('section-toc-icon')).toBeInTheDocument();
		expect(within(tocCard as HTMLElement).queryByText('Images')).not.toBeInTheDocument();

		const galleryRail = screen.getByTestId('project-image-gallery-rail');
		expect(within(galleryRail).getByTestId('section-image-icon')).toBeInTheDocument();
		expect(within(galleryRail).queryByText('yesid.')).not.toBeInTheDocument();
		expect(within(galleryRail).queryByText('01')).not.toBeInTheDocument();

		const leftRail = container.querySelector('.toc-column');
		expect(leftRail).toBeTruthy();
		const leftRailGallery = within(leftRail as HTMLElement).getByTestId('project-image-gallery-rail');
		const leftRailLinks = within(leftRail as HTMLElement).getByTestId('project-links-card');
		expect(
			Boolean(
				leftRailGallery.compareDocumentPosition(leftRailLinks) &
					Node.DOCUMENT_POSITION_FOLLOWING,
			),
		).toBe(true);
		expect(within(screen.getByTestId('project-glance-panel')).queryByTestId('project-links-card')).not.toBeInTheDocument();
		expect(within(screen.getByTestId('project-glance-panel-mobile')).getByTestId('project-links-card')).toBeInTheDocument();

		const mobileToc = screen.getByTestId('toc-pill');
		await fireEvent.click(within(mobileToc).getByRole('button'));
		expect(within(mobileToc).getAllByText('Images').length).toBeGreaterThanOrEqual(1);
		const mobileDrawerLabels = [...mobileToc.querySelectorAll<HTMLElement>('.toc-drawer-item .toc-drawer-label')]
			.map((node) => node.textContent?.trim())
			.filter(Boolean);
		expect(mobileDrawerLabels.slice(0, 3)).toEqual(['Second section', 'Images', 'Technical proof']);

		const gallery = within(galleryRail).getByTestId('project-image-gallery');
		const triggers = within(gallery).getAllByTestId('project-image-gallery-trigger');
		expect(triggers).toHaveLength(2);
		expect(within(gallery).getByText('Desktop showcase')).toBeInTheDocument();
		expect(within(gallery).getByText('Mobile showcase')).toBeInTheDocument();

		await fireEvent.click(triggers[1] as HTMLElement);

		const dialog = screen.getByRole('dialog');
		expect(dialog).toHaveAttribute('aria-modal', 'true');
		expect(screen.getByTestId('project-image-gallery-lightbox-image')).toHaveAttribute(
			'src',
			'/test-assets/mobile-uuid?key=hero-1200',
		);

		await fireEvent.click(screen.getByTestId('project-image-gallery-backdrop'));
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});

	it('uses theme-aware mats for contained project images', () => {
		const source = readFileSync(
			join(cwd(), 'src/lib/components/projects/ProjectImageGallery.svelte'),
			'utf8',
		);

		expect(source).toContain('--project-image-gallery-mat');
		expect(source).toContain('[data-theme="light"]');
		expect(source).toContain('#fff');
		expect(source).toContain("from '$lib/utils/theme-media'");
		expect(source).not.toContain('new MutationObserver');
		expect(source).not.toContain('background: #050505;');
	});

	it('uses CMS light image variants for thumbnails and expanded images from the document theme', async () => {
		themeStore.set('dark');
		document.documentElement.dataset.theme = 'light';
		const project = projectFactory.build({
			title: { en: 'yesid.dev' },
			sections: [
				{
					title: { en: 'Images' },
					content: {
						en: {
							time: 1700000000000,
							version: '2.31.2',
							blocks: [
								{
									id: 'desktop',
									type: 'image',
									data: {
										file: { fileId: 'desktop-dark-uuid', fileURL: '/files/desktop-dark-uuid', url: '/assets/desktop-dark-uuid' },
										variants: {
											light: { fileId: 'desktop-light-uuid', fileURL: '/files/desktop-light-uuid', url: '/assets/desktop-light-uuid' },
										},
										caption: 'Desktop showcase',
										withBorder: true,
										withBackground: false,
										stretched: true,
									},
								},
							],
						},
					},
				},
			],
		});

		render(ProjectDetailPage, {
			props: {
				project,
				services: [],
				serviceSvgContents: {},
			},
		});

		const gallery = screen.getAllByTestId('project-image-gallery')[0]!;
		const trigger = within(gallery).getByTestId('project-image-gallery-trigger');
		expect(within(gallery).getByRole('img')).toHaveAttribute(
			'src',
			'/test-assets/desktop-light-uuid?key=hero-1200',
		);

		await fireEvent.click(trigger);

		expect(screen.getByTestId('project-image-gallery-lightbox-image')).toHaveAttribute(
			'src',
			'/test-assets/desktop-light-uuid?key=hero-1200',
		);
	});
});
