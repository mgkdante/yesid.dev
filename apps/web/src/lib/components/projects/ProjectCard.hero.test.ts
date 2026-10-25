import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cwd } from 'node:process';
import ProjectCard from './ProjectCard.svelte';
import { projectFactory } from '../../../tests/factories';
import { themeStore } from '#lib/stores/theme.svelte.js';

vi.mock('#lib/directus/assets.js', () => ({
	asset: (id: string, preset?: string) => `/test-assets/${id}${preset ? `?key=${preset}` : ''}`,
	buildSrcSet: () => '',
	assetImage: (id: string, preset?: string) => ({
		src: `/test-assets/${id}${preset ? `?key=${preset}` : ''}`,
	}),
}));

describe('ProjectCard hero media', () => {
	afterEach(() => {
		themeStore.set('dark');
		document.documentElement.dataset.theme = 'dark';
	});

	it('renders split primary and secondary hero images in light mode when both are present', () => {
		themeStore.set('light');
		const project = projectFactory.build({
			image: 'desktop-dark-uuid',
			imageLight: 'desktop-light-uuid',
			imageSecondary: 'mobile-dark-uuid',
			imageSecondaryLight: 'mobile-light-uuid',
		} as Partial<ReturnType<typeof projectFactory.build>>);

		const { container } = render(ProjectCard, {
			props: { project, serviceSvgContents: {} },
		});

		const preview = container.querySelector('[data-testid="project-hero-preview"]');
		const images = container.querySelectorAll('[data-testid="project-hero-preview-image"]');

		expect(preview).toBeTruthy();
		expect(preview?.getAttribute('data-split')).toBe('true');
		expect(preview?.getAttribute('data-layout')).toBe('desktop-mobile');
		expect(images).toHaveLength(2);
		expect(images[0]?.getAttribute('src')).toBe('/test-assets/desktop-light-uuid?key=card-600');
		expect(images[1]?.getAttribute('src')).toBe('/test-assets/mobile-light-uuid?key=card-600');
	});

	it('renders a single hero image when the secondary hero is empty', () => {
		themeStore.set('dark');
		const project = projectFactory.build({
			image: 'desktop-dark-uuid',
			imageLight: 'desktop-light-uuid',
		} as Partial<ReturnType<typeof projectFactory.build>>);

		const { container } = render(ProjectCard, {
			props: { project, serviceSvgContents: {} },
		});

		const preview = container.querySelector('[data-testid="project-hero-preview"]');
		const images = container.querySelectorAll('[data-testid="project-hero-preview-image"]');

		expect(preview).toBeTruthy();
		expect(preview?.getAttribute('data-split')).toBe('false');
		expect(preview?.getAttribute('data-layout')).toBe('single');
		expect(images).toHaveLength(1);
		expect(images[0]?.getAttribute('src')).toBe('/test-assets/desktop-dark-uuid?key=card-600');
	});

	it('uses the document theme for hero image variants on first render', () => {
		themeStore.set('dark');
		document.documentElement.dataset.theme = 'light';
		const project = projectFactory.build({
			image: 'desktop-dark-uuid',
			imageLight: 'desktop-light-uuid',
			imageSecondary: 'mobile-dark-uuid',
			imageSecondaryLight: 'mobile-light-uuid',
		} as Partial<ReturnType<typeof projectFactory.build>>);

		const { container } = render(ProjectCard, {
			props: { project, serviceSvgContents: {} },
		});

		const images = container.querySelectorAll('[data-testid="project-hero-preview-image"]');
		expect(images[0]?.getAttribute('src')).toBe('/test-assets/desktop-light-uuid?key=card-600');
		expect(images[1]?.getAttribute('src')).toBe('/test-assets/mobile-light-uuid?key=card-600');
	});

	it('renders the digital-infrastructure blueprint sheet when the project has no image (homework #8b)', () => {
		const project = projectFactory.build();

		const { container } = render(ProjectCard, {
			props: { project, serviceSvgContents: {} },
		});

		expect(container.querySelector('[data-testid="project-hero-preview"]')).toBeNull();
		const media = container.querySelector('[data-testid="project-card-image"]');
		expect(media?.classList.contains('project-card-blueprint')).toBe(true);
		expect(media?.getAttribute('style') ?? '').not.toContain('linear-gradient');
		// Both drawings ship in the DOM; CSS swaps them by viewport (mobile
		// device below md, workstation + mobile duo at md and up).
		expect(screen.getByTestId('project-blueprint-fallback').innerHTML).toContain('DWG DIG-001-A');
		expect(container.querySelectorAll('.blueprint-art')).toHaveLength(2);
	});

	it('renders proof cards with the proof reel media preset and metric strip', () => {
		const project = projectFactory.build({
			image: 'desktop-dark-uuid',
			imageSecondary: 'mobile-dark-uuid',
			impactMetric: {
				before: 'old',
				value: '42%',
				label: { en: 'less waiting' },
			},
		} as Partial<ReturnType<typeof projectFactory.build>>);

		const { container } = render(ProjectCard, {
			props: {
				project,
				serviceSvgContents: {},
				variant: 'proof',
				cardSize: 'proof',
				testId: 'proof-card',
				mediaTestId: 'proof-card-image',
				metricTestPrefix: 'proof',
			},
		});

		expect(screen.getByTestId('proof-card')).toBeInTheDocument();
		expect(screen.getByTestId('proof-card-image')).toBeInTheDocument();
		expect(screen.getByTestId('proof-card-title').textContent).toContain(project.title.en);
		expect(screen.getByTestId('proof-metric-before').textContent).toContain('old');
		expect(screen.getByTestId('proof-metric-value').textContent).toContain('42%');
		expect(screen.getByTestId('proof-metric-label').textContent).toContain('less waiting');

		const images = container.querySelectorAll('[data-testid="project-hero-preview-image"]');
		expect(images[0]?.getAttribute('src')).toBe('/test-assets/desktop-dark-uuid?key=hero-1200');
		expect(images[1]?.getAttribute('src')).toBe('/test-assets/mobile-dark-uuid?key=hero-1200');
	});

	it('renders all supplied proof metrics in preference to the legacy singular metric', () => {
		const project = projectFactory.build({
			impactMetrics: [
				{ value: '30s', label: { en: 'refresh cycles' } },
				{ value: '99.9%', label: { en: 'pipeline uptime' } },
				{ value: '2', label: { en: 'languages shipped' } },
				{ value: '0', label: { en: 'CMS calls per visit' } },
			],
			impactMetric: {
				value: 'legacy',
				label: { en: 'legacy metric' },
			},
		} as Partial<ReturnType<typeof projectFactory.build>>);

		render(ProjectCard, {
			props: {
				project,
				serviceSvgContents: {},
				variant: 'proof',
				cardSize: 'proof',
				testId: 'proof-card',
				mediaTestId: 'proof-card-image',
				metricTestPrefix: 'proof',
			},
		});

		expect(screen.getAllByTestId('proof-metric-item')).toHaveLength(project.impactMetrics!.length);
		expect(screen.getAllByTestId('proof-metric-value').map((node) => node.textContent)).toEqual(project.impactMetrics!.map(metric => metric.value));
		expect(screen.getAllByTestId('proof-metric-label').map((node) => node.textContent)).toEqual(project.impactMetrics!.map(metric => metric.label.en));
		expect(screen.queryByText(project.impactMetric!.value)).toBeNull();
	});

	it('does not invent a proof metric footer when neither metric field is supplied', () => {
		const project = projectFactory.build({ impactMetrics: [], impactMetric: undefined });
		render(ProjectCard, { props: { project, variant: 'proof' } });
		expect(screen.queryByTestId('proof-metric-strip')).toBeNull();
		expect(screen.queryAllByTestId('proof-metric-value')).toEqual([]);
	});

	it('uses the shared theme media helper for hero image variants', () => {
		const source = readFileSync(
			join(cwd(), 'src/lib/components/projects/ProjectHeroPreview.svelte'),
			'utf8',
		);

		expect(source).toContain("from '#lib/utils/theme-media'");
		expect(source).not.toContain('new MutationObserver');
	});

	it('lazy-loads hero media by default (only the first card goes eager)', () => {
		const project = projectFactory.build({
			image: 'desktop-dark-uuid',
		} as Partial<ReturnType<typeof projectFactory.build>>);

		const { container } = render(ProjectCard, {
			props: { project, serviceSvgContents: {} },
		});

		const img = container.querySelector('[data-testid="project-hero-preview-image"]');
		expect(img?.getAttribute('loading')).toBe('lazy');
		expect(img?.hasAttribute('fetchpriority')).toBe(false);
	});

	it('eager + fetchpriority=high on the LCP first card (consolidation-deploy-honesty)', () => {
		const project = projectFactory.build({
			image: 'desktop-dark-uuid',
		} as Partial<ReturnType<typeof projectFactory.build>>);

		const { container } = render(ProjectCard, {
			props: { project, serviceSvgContents: {}, eager: true },
		});

		const img = container.querySelector('[data-testid="project-hero-preview-image"]');
		expect(img?.getAttribute('loading')).toBe('eager');
		expect(img?.getAttribute('fetchpriority')).toBe('high');
	});
});
