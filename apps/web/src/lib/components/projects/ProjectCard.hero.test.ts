import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cwd } from 'node:process';
import ProjectCard from './ProjectCard.svelte';
import { projectFactory } from '../../../tests/factories';
import { themeStore } from '$lib/stores/theme.svelte';

vi.mock('$lib/directus/assets', () => ({
	asset: (id: string, preset?: string) => `/test-assets/${id}${preset ? `?key=${preset}` : ''}`,
	buildSrcSet: () => '',
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

	it('uses a shared media band border for image and fallback project cards', () => {
		const source = readFileSync(
			join(cwd(), 'src/lib/components/projects/ProjectCard.svelte'),
			'utf8',
		);

		expect(source).toContain('project-card-media--listing');
		expect(source).toContain('.project-card-media');
		expect(source).toContain('border-bottom: 2px solid color-mix(in srgb, var(--primary) 78%, transparent);');
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

	it('renders up to three proof metrics in the bottom stripe and marks overflow', () => {
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

		expect(screen.getAllByTestId('proof-metric-item')).toHaveLength(3);
		expect(screen.getAllByTestId('proof-metric-value').map((node) => node.textContent)).toEqual([
			'30s',
			'99.9%',
			'2',
		]);
		expect(screen.getAllByTestId('proof-metric-label').map((node) => node.textContent)).toEqual([
			'refresh cycles',
			'pipeline uptime',
			'languages shipped',
		]);
		expect(screen.queryByText('CMS calls per visit')).toBeNull();
		expect(screen.getByTestId('proof-metric-overflow')).toHaveTextContent('...');
		expect(screen.getByTestId('proof-metric-overflow')).toHaveAttribute('aria-label', 'More metrics');
	});

	it('sources the proof metric overflow aria label from siteLabels', () => {
		const source = readFileSync(
			join(cwd(), 'src/lib/components/projects/ProjectCard.svelte'),
			'utf8',
		);

		expect(source).toContain('siteLabels.a11y.moreMetrics');
		expect(source).not.toContain('aria-label="More metrics"');
	});

	it('keeps the proof reel footprint as a ProjectCard size option', () => {
		const source = readFileSync(
			join(cwd(), 'src/lib/components/projects/ProjectCard.svelte'),
			'utf8',
		);

		expect(source).toContain('.project-card--proof :global(.card-surface)');
		expect(source).toContain('min-height: clamp(30rem, 64dvh, 44rem);');
		expect(source).toContain('.project-card-media--proof');
		expect(source).toContain('height: clamp(15rem, 38dvh, 22rem);');
		expect(source).toContain('min-height: clamp(20rem, 50dvh, 30rem);');
		expect(source).toContain('height: clamp(8rem, 22dvh, 10.5rem);');
	});

	it('keeps the proof metric stripe height stable across cards', () => {
		const source = readFileSync(
			join(cwd(), 'src/lib/components/projects/ProjectCard.svelte'),
			'utf8',
		);

		expect(source).toContain('height: clamp(6.5rem, 12dvh, 7.75rem);');
		expect(source).toContain('grid-template-columns: repeat(3, minmax(0, 1fr));');
		expect(source).toContain('-webkit-line-clamp: 2;');
	});

	it('anchors the proof metric overflow marker to the bottom edge', () => {
		const source = readFileSync(
			join(cwd(), 'src/lib/components/projects/ProjectCard.svelte'),
			'utf8',
		);

		expect(source).toContain('inset-block-end: 0.2rem;');
		expect(source).not.toContain('inset-block-start: -0.35rem;');
	});

	it('uses the shared theme media helper for hero image variants', () => {
		const source = readFileSync(
			join(cwd(), 'src/lib/components/projects/ProjectHeroPreview.svelte'),
			'utf8',
		);

		expect(source).toContain("from '$lib/utils/theme-media'");
		expect(source).not.toContain('new MutationObserver');
	});
});
