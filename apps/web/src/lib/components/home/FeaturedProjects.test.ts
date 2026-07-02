import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cwd } from 'node:process';
import FeaturedProjects from './FeaturedProjects.svelte';
import { proofReelContent } from '$lib/content/site-content';
import { getFeaturedProjects } from '$lib/projects/static-helpers';
import { getVisibleServices } from '$lib/services/static-helpers';
import { resolveLocale } from '$lib/utils';
import type { Project } from '$lib/types';
import { projectFactory } from '../../../tests/factories';

vi.mock('$lib/directus/assets', () => ({
	asset: (id: string, preset?: string) => `/test-assets/${id}${preset ? `?key=${preset}` : ''}`,
	buildSrcSet: () => '',
	assetImage: (id: string, preset?: string) => ({
		src: `/test-assets/${id}${preset ? `?key=${preset}` : ''}`,
	}),
}));

const resolvedProjects: readonly Project[] = getFeaturedProjects();
const expectedCount = resolvedProjects.length;
const services = getVisibleServices();
const serviceSvgContents = Object.fromEntries(
	services.map((service) => [
		service.id,
		'<svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h10v10H0z"/></svg>',
	]),
);
const renderProps = { proofReel: proofReelContent, projects: resolvedProjects, services, serviceSvgContents };

describe('FeaturedProjects', () => {
	it('renders at least one featured project from CMS data', () => {
		expect(expectedCount).toBeGreaterThan(0);
	});

	it('renders the section with correct testid', () => {
		render(FeaturedProjects, { props: renderProps });
		expect(screen.getByTestId('proof-reel-section')).toBeInTheDocument();
	});

	it('renders one shared ProjectCard per featured project row', () => {
		render(FeaturedProjects, { props: renderProps });
		const cards = screen.getAllByTestId('proof-card');
		expect(cards).toHaveLength(expectedCount);
	});

	it('renders one metric strip for every proof card', () => {
		render(FeaturedProjects, { props: renderProps });
		const metrics = screen.getAllByTestId('proof-metric-strip');
		expect(metrics).toHaveLength(expectedCount);
	});

	it('renders a strikethrough before-value for cards whose metric has one', () => {
		render(FeaturedProjects, { props: renderProps });
		const withBefore = resolvedProjects.filter((p) => p.impactMetric?.before);
		const beforeEls = screen.queryAllByTestId('proof-metric-before');
		expect(beforeEls).toHaveLength(withBefore.length);
		for (let i = 0; i < withBefore.length; i++) {
			expect(beforeEls[i]?.textContent).toContain(withBefore[i]!.impactMetric!.before!);
		}
	});

	it('renders project titles and one-liners from the shared card', () => {
		render(FeaturedProjects, { props: renderProps });
		const titles = screen.getAllByTestId('proof-card-title');
		const excerpts = screen.getAllByTestId('proof-excerpt');
		expect(titles).toHaveLength(expectedCount);
		expect(excerpts).toHaveLength(expectedCount);
		resolvedProjects.forEach((project, i) => {
			expect(titles[i]?.textContent).toContain(resolveLocale(project.title, 'en'));
			expect(excerpts[i]?.textContent).toContain(resolveLocale(project.oneLiner, 'en'));
		});
	});

	it('cards link to /projects/[slug] for each resolved project', () => {
		render(FeaturedProjects, { props: renderProps });
		const cards = screen.getAllByTestId('proof-card');
		resolvedProjects.forEach((project, i) => {
			expect(cards[i]?.closest('a')?.getAttribute('href')).toBe(`/projects/${project.slug}`);
		});
	});

	it('renders view-all link to /projects', () => {
		render(FeaturedProjects, { props: renderProps });
		const link = screen.getByTestId('proof-view-all');
		expect(link.getAttribute('href')).toBe('/projects');
		expect(link.textContent).toContain(resolveLocale(proofReelContent.viewAllLabel, 'en'));
	});

	it('renders one shared media band per card', () => {
		render(FeaturedProjects, { props: renderProps });
		const images = screen.getAllByTestId('proof-card-image');
		expect(images).toHaveLength(expectedCount);
	});

	it('uses project hero media for proof reel images', () => {
		const project = projectFactory.build({
			slug: 'synthetic-featured',
			featured: true,
			image: 'desktop-dark-uuid',
			imageSecondary: 'mobile-dark-uuid',
		} as Partial<Project>);

		render(FeaturedProjects, {
			props: {
				proofReel: proofReelContent,
				projects: [project],
				services,
				serviceSvgContents,
			},
		});

		const preview = screen.getByTestId('project-hero-preview');
		const images = screen.getAllByTestId('project-hero-preview-image');

		expect(preview.getAttribute('data-split')).toBe('true');
		expect(images).toHaveLength(2);
		expect(images[0]?.getAttribute('src')).toBe('/test-assets/desktop-dark-uuid?key=hero-1200');
		expect(images[1]?.getAttribute('src')).toBe('/test-assets/mobile-dark-uuid?key=hero-1200');
		expect(screen.queryByTestId('proof-image-fallback')).toBeNull();
	});

	it('renders shared ProjectCard service badges inside proof cards', () => {
		const service = services[0]!;
		const project = projectFactory.build({
			slug: 'synthetic-service',
			relatedServices: [service.id],
		});

		render(FeaturedProjects, {
			props: {
				proofReel: proofReelContent,
				projects: [project],
				services,
				serviceSvgContents,
			},
		});

		expect(screen.getByTestId('proof-card').textContent).toContain(resolveLocale(service.title, 'en'));
		expect(screen.getByTestId('proof-excerpt')).toBeInTheDocument();
	});

	it('falls back to the shared blueprint media band for imageless projects', () => {
		const service = services[0]!;
		const project = projectFactory.build({
			slug: 'synthetic-imageless',
			image: undefined,
			imageSecondary: undefined,
			relatedServices: [service.id],
		} as Partial<Project>);

		render(FeaturedProjects, {
			props: {
				proofReel: proofReelContent,
				projects: [project],
				services,
				serviceSvgContents,
			},
		});

		expect(screen.getByTestId('proof-card-image')).toBeInTheDocument();
		expect(screen.queryByTestId('project-hero-preview')).toBeNull();
		expect(screen.queryByTestId('proof-image-fallback')).toBeNull();
	});

	it('wires the proof carousel through ProjectCard instead of a second card system', () => {
		const source = readFileSync(
			join(cwd(), 'src/lib/components/home/FeaturedProjects.svelte'),
			'utf8',
		);

		expect(source).toContain("import ProjectCard from '$lib/components/projects/ProjectCard.svelte'");
		expect(source).toContain('variant="proof"');
		expect(source).toContain('cardSize="proof"');
		expect(source).toContain('mediaTestId="proof-card-image"');
		expect(source).not.toContain('ProjectHeroPreview');
		expect(source).not.toContain('class="proof-image');
		expect(source).not.toContain('class="proof-card group');
	});

	it('lets nested stack diagrams keep their own horizontal drag inside the proof carousel', () => {
		const source = readFileSync(
			join(cwd(), 'src/lib/components/home/FeaturedProjects.svelte'),
			'utf8',
		);

		expect(source).toContain("import { allowCarouselDrag } from '$lib/utils/carousel-drag'");
		expect(source).toContain('watchDrag: allowCarouselDrag');
	});

	it('keeps loop controls icon-only while the counter carries the numbers', () => {
		const projects = [
			projectFactory.build({ slug: 'loop-one' }),
			projectFactory.build({ slug: 'loop-two' }),
			projectFactory.build({ slug: 'loop-three' }),
		];

		render(FeaturedProjects, {
			props: {
				proofReel: proofReelContent,
				projects,
				services,
				serviceSvgContents,
			},
		});

		expect(screen.getByTestId('proof-count')).toHaveAttribute('aria-label', '01 / 03');
		expect(screen.getByTestId('proof-prev')).toHaveTextContent('←');
		expect(screen.getByTestId('proof-prev')).not.toHaveTextContent('03');
		expect(screen.getByTestId('proof-prev')).toHaveAttribute('aria-label', 'Previous projects');
		expect(screen.getByTestId('proof-next')).toHaveTextContent('→');
		expect(screen.getByTestId('proof-next')).not.toHaveTextContent('02');
		expect(screen.getByTestId('proof-next')).toHaveAttribute('aria-label', 'Next projects');
	});

	it('keeps the original desktop proof slide width', () => {
		const source = readFileSync(
			join(cwd(), 'src/lib/components/home/FeaturedProjects.svelte'),
			'utf8',
		);

		expect(source).toContain('flex-basis: clamp(340px, 44vw, 720px);');
		expect(source).not.toContain('flex-basis: calc(50% + 0.75rem);');
	});
});
