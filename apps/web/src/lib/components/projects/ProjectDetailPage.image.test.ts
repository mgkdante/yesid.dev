import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/svelte';



import type { BlockEditorDoc, ImageBlock } from '@repo/shared';
import ProjectDetailPage from './ProjectDetailPage.svelte';
import { projectFactory } from '../../../tests/factories';
import { theme } from '@yesid/ui/state';

vi.mock('#lib/directus/assets.ts', () => ({
	asset: (id: string, preset?: string) => `/test-assets/${id}${preset ? `?key=${preset}` : ''}`,
	buildSrcSet: () => '',
	assetImage: (id: string, preset?: string) => ({
		src: `/test-assets/${id}${preset ? `?key=${preset}` : ''}`,
	}),
}));

const doc = (text: string): BlockEditorDoc => ({
	time: 1700000000000,
	version: '2.31.2',
	blocks: [{ id: 'p1', type: 'paragraph', data: { text } }],
});

const storyImage = (id: string, fileId: string, caption: string): ImageBlock => ({
	id,
	type: 'image',
	data: {
		file: { fileId, fileURL: `/files/${fileId}`, url: `/assets/${fileId}` },
		variants: { light: { fileId: `${fileId}-light`, fileURL: '', url: `/assets/${fileId}-light` } },
		caption,
		withBorder: true,
		withBackground: false,
		stretched: false,
	},
});

const storyDoc = (...blocks: BlockEditorDoc['blocks']): BlockEditorDoc => ({
	time: 1700000000000,
	version: '2.31.2',
	blocks,
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
		theme.set('dark');
		document.documentElement.dataset.theme = 'dark';
	});

	it('collects description and mixed story images without requiring an image-only section', () => {
		const project = projectFactory.build({
			description: { en: storyDoc(storyImage('overview-image', 'overview-state', 'Overview state')) },
			sections: [{
				title: { en: 'Story' },
				content: { en: storyDoc(
					...doc('A story with a real inline image.').blocks,
					storyImage('story-image', 'story-state', 'Story state'),
				) },
			}],
		});
		const { container } = render(ProjectDetailPage, { props: { project, services: [], serviceSvgContents: {} } });
		const article = container.querySelector('.sections-column')!;
		expect(within(article as HTMLElement).getByRole('img', { name: 'Story state' })).toBeInTheDocument();
		const gallery = screen.getByTestId('project-image-gallery-mobile');
		expect(within(gallery).getAllByTestId('project-image-gallery-trigger')).toHaveLength(2);
		expect(within(gallery).getByRole('img', { name: 'Overview state' })).toBeInTheDocument();
		expect(within(gallery).getByRole('img', { name: 'Story state' })).toBeInTheDocument();
	});

	it.each(['fr', 'es'] as const)('reuses one image set in inline %s prose and the final gallery, retaining Shiki and theme variants', async (locale) => {
		document.documentElement.dataset.theme = 'light';
		const caption = locale === 'fr' ? 'État du produit' : 'Estado del producto';
		const overview = storyImage('shared-block-id', 'overview-state', caption);
		const articleImage = storyImage('shared-block-id', 'article-state', `${caption} 2`);
		const repeatedOverview = { ...overview, id: 'another-editor-block-id' };
		const story = storyDoc(
			...doc('Story before the code and image.').blocks,
			{ id: 'story-code', type: 'code', data: { code: '```ts\nconst source = "fixture";\n```' } },
			articleImage,
			repeatedOverview,
		);
		const project = projectFactory.build({
			description: { en: doc('English overview'), [locale]: storyDoc(overview) },
			sections: [
				{ title: { en: 'Story', [locale]: 'Récit / Relato' }, content: { en: doc('English story'), [locale]: story } },
				{ title: { en: 'Images', [locale]: 'Images / Imágenes' }, content: { en: doc('English images'), [locale]: storyDoc(repeatedOverview) } },
				{ title: { en: 'More images', [locale]: 'Autres / Más' }, content: { en: doc('English images'), [locale]: storyDoc(articleImage) } },
			],
		});
		const { container } = render(ProjectDetailPage, {
			props: { project, services: [], serviceSvgContents: {}, codeHighlights: { 'story-code': '<span data-story-highlight>const source = "fixture";</span>' } },
			context: new Map([[Symbol.for('@yesid/ui/locale'), () => locale]]),
		});
		const article = container.querySelector('.sections-column .section-block .article-body')!;
		expect(within(article as HTMLElement).getByRole('img', { name: `${caption} 2` })).toHaveAttribute('src', '/test-assets/article-state-light?key=card-600');
		expect(container.querySelector('[data-story-highlight]')).toHaveTextContent('const source = "fixture";');
		const mobileGallery = screen.getByTestId('project-image-gallery-mobile');
		expect(within(mobileGallery).getAllByTestId('project-image-gallery')).toHaveLength(1);
		expect(within(mobileGallery).getAllByTestId('project-image-gallery-trigger')).toHaveLength(2);
		expect(within(mobileGallery).getByRole('img', { name: caption })).toHaveAttribute('src', '/test-assets/overview-state-light?key=hero-1200');
		expect(within(mobileGallery).queryByText('English story')).not.toBeInTheDocument();
		const glance = screen.getByTestId('project-glance-panel-mobile');
		expect(Boolean(glance.compareDocumentPosition(mobileGallery) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
		const trigger = within(mobileGallery).getAllByTestId('project-image-gallery-trigger')[0]!;
		await fireEvent.click(trigger);
		expect(screen.getByTestId('project-image-gallery-lightbox-image')).toHaveAttribute('src', '/test-assets/overview-state-light?key=hero-1200');
		await fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
	});

	it.each([0, 1, 3])('keeps %i supplied articles mounted with only the first initially open', (count) => {
		const project = projectFactory.build({
			sections: Array.from({ length: count }, (_, index) => ({
				title: { en: `Article ${index}` }, content: { en: doc(`Body ${index}`) },
			})),
		});
		const { container } = render(ProjectDetailPage, {
			props: { project, services: [], serviceSvgContents: {} },
		});
		const sections = [...container.querySelectorAll('.sections-column > .section-block')];
		expect(sections).toHaveLength(count);
		for (const [index, section] of sections.entries()) {
			expect(section.id).toBe(`section-${index}`);
			expect(section).toHaveAttribute('data-section-index', String(index));
			expect(section).toHaveTextContent(`Body ${index}`);
			expect(section.querySelector('button.section-header')).toHaveAttribute('aria-expanded', String(index === 0));
			expect(section.querySelector('[data-slot="collapsible-content"]')?.hasAttribute('inert')).toBe(index !== 0);
		}
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
				readme: [{ html: '<h2>Project README</h2><p>Read before browsing images.</p>' }],
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
		const overviewTrigger = firstSection?.querySelector('button.section-header')!;
		const optionalSection = container.querySelector('[data-section-index="1"]')!;
		const optionalTrigger = optionalSection.querySelector('button.section-header')!;
		expect(overviewTrigger.getAttribute('aria-expanded')).toBe('true');
		expect(optionalTrigger.getAttribute('aria-expanded')).toBe('false');
		expect(optionalSection.id).toBe('section-1');
		expect(optionalSection.querySelector('[inert]')).toBeTruthy();
		await fireEvent.click(optionalTrigger);
		expect(optionalTrigger.getAttribute('aria-expanded')).toBe('true');
		expect(screen.getByTestId('mermaid-diagram')).toBeInTheDocument();
		expect(screen.getByText(/Directus CMS/)).toBeInTheDocument();
		expect(screen.getAllByText(/export-fallbacks\.ts/).length).toBeGreaterThanOrEqual(2);
		expect(screen.getByText(/generated TypeScript cache/)).toBeInTheDocument();
		expect(screen.getByText('Generated cache contract')).toBeInTheDocument();
		expect(screen.getByText('Zero CMS calls per visit')).toBeInTheDocument();
		expect(container.textContent).toContain('op run --env-file=apps/cms/.env');
		expect(container.textContent).toContain('export const projects = [...] satisfies Project[];');
		expect(screen.getAllByText('sh').length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByText('ts').length).toBeGreaterThanOrEqual(1);

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
				leftRailLinks.compareDocumentPosition(leftRailGallery) &
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
		expect(mobileDrawerLabels.slice(0, 2)).toEqual(['Second section', 'Technical proof']);
		expect(mobileDrawerLabels.at(-1)).toBe('Images');
		const glance = screen.getByTestId('project-glance-panel-mobile');
		expect(Boolean(glance.compareDocumentPosition(mobileGalleryStack) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
		expect(mobileGalleryStack.parentElement?.lastElementChild).toBe(mobileGalleryStack);
		expect(Boolean(screen.getByRole('heading', { name: /Project README/ }).compareDocumentPosition(mobileGalleryStack) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);

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
		const galleryHeader = within(galleryRail).getByRole('button', { name: 'Images' });
		await fireEvent.click(screen.getByTestId('project-image-gallery-lightbox-image'));
		expect(galleryHeader).toHaveAttribute('aria-expanded', 'true');
		expect(dialog.closest('[inert]')).toBeNull();
		await fireEvent.click(within(dialog).getByText('Mobile showcase'));
		expect(galleryHeader).toHaveAttribute('aria-expanded', 'true');

		await fireEvent.click(screen.getByTestId('project-image-gallery-backdrop'));
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});

	it('uses CMS light image variants for thumbnails and expanded images from the document theme', async () => {
		theme.set('dark');
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
