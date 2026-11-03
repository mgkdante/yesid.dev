import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ProjectCard from './ProjectCard.svelte';
import { projectFactory } from '../../../tests/factories';
import { theme } from '@yesid/ui/state';

vi.mock('#lib/directus/assets.ts', () => ({
	asset: (id: string, preset?: string) => `/test-assets/${id}${preset ? `?key=${preset}` : ''}`,
	buildSrcSet: () => '',
	assetImage: (id: string, preset?: string) => ({
		src: `/test-assets/${id}${preset ? `?key=${preset}` : ''}`,
	}),
}));

describe('ProjectCard hero media', () => {
	afterEach(() => {
		theme.set('dark');
		document.documentElement.dataset.theme = 'dark';
	});

	it('renders split primary and secondary hero images in light mode when both are present', () => {
		theme.set('light');
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
		expect(images[0]).toHaveClass('group-hover:scale-105');
	});

	it('keeps a single package visual unzoomed when the secondary hero is empty, even with an orphan light secondary', () => {
		theme.set('light');
		const project = projectFactory.build({
			image: 'desktop-dark-uuid',
			imageLight: 'desktop-light-uuid',
			imageSecondary: undefined,
			imageSecondaryLight: 'unused-mobile-light-uuid',
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
		expect(images[0]?.getAttribute('src')).toBe('/test-assets/desktop-light-uuid?key=card-600');
		expect(images[0]).not.toHaveClass('group-hover:scale-105', 'group-active:scale-105');
	});

	it('uses the document theme for hero image variants on first render', () => {
		theme.set('dark');
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
		expect(media?.getAttribute('style') ?? '').not.toContain('linear-gradient');
		// Both drawings ship in the DOM; CSS swaps them by viewport (mobile
		// device below md, workstation + mobile duo at md and up).
		expect(screen.getByTestId('project-blueprint-fallback').innerHTML).toContain('DWG DIG-001-A');
		expect(container.querySelectorAll('.blueprint-art')).toHaveLength(2);
	});

	it('renders proof cards like listing cards: media, title, services and links, without metrics or stack', () => {
		const project = projectFactory.build({
			image: 'desktop-dark-uuid',
			imageSecondary: 'mobile-dark-uuid',
			impactMetrics: [{ value: '42%', label: { en: 'less waiting' } }],
			relatedServices: ['service-a'],
			stack: ['Postgres'],
			liveUrl: 'https://example.test',
		} as Partial<ReturnType<typeof projectFactory.build>>);
		const service = { id: 'service-a', title: { en: 'Fixture service' } } as never;

		const { container } = render(ProjectCard, {
			props: { project, services: [service], placement: 'proof' },
		});

		const card = screen.getByTestId('proof-card');
		expect(screen.getByTestId('proof-card-image')).toBeInTheDocument();
		expect(screen.getByTestId('proof-card-title').textContent).toContain(project.title.en);
		expect(card.textContent).not.toContain('42%');
		expect(card.textContent).toContain('Fixture service');
		expect(card.textContent).not.toContain('Postgres');
		expect(screen.getByTestId('proof-card-links').querySelector('a')?.getAttribute('href')).toBe('https://example.test');

		const images = container.querySelectorAll('[data-testid="project-hero-preview-image"]');
		expect(images[0]?.getAttribute('src')).toBe('/test-assets/desktop-dark-uuid?key=hero-1200');
		expect(images[1]?.getAttribute('src')).toBe('/test-assets/mobile-dark-uuid?key=hero-1200');
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

	it.each([
		{ placement: 'listing' as const, cardId: 'project-card', preset: 'card-600', sizes: '(min-width: 1280px) 35vw, (min-width: 1024px) 63vw, (min-width: 768px) 90vw, 82vw' },
		{ placement: 'proof' as const, cardId: 'proof-card', preset: 'hero-1200', sizes: '(min-width: 768px) 50vw, 92vw' },
	])('$placement placement selects image delivery and test ids', ({ placement, cardId, preset, sizes }) => {
		const project = projectFactory.build({ image: 'desktop-dark-uuid' });
		render(ProjectCard, { props: { project, placement } });
		expect(screen.getByTestId(cardId)).toBeInTheDocument();
		const image = screen.getByTestId('project-hero-preview-image');
		expect(image).toHaveAttribute('src', `/test-assets/desktop-dark-uuid?key=${preset}`);
		expect(image).toHaveAttribute('sizes', sizes);
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
