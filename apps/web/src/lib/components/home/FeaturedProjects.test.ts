import { siteLabels } from '#lib/content/site-labels.ts';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/svelte';
import FeaturedProjects from './FeaturedProjects.svelte';
import { proofReelContent } from '#lib/content/site-content.ts';
import { getFeaturedProjects } from '#lib/projects/static-helpers.ts';
import { getVisibleServices } from '#lib/services/static-helpers.ts';
import { projectMetrics } from '#lib/utils/project-metrics.ts';
import { resolveLocale } from '#lib/utils/locale.ts';
import type { Project } from '#lib/types.ts';
import { projectFactory } from '../../../tests/factories';

vi.mock('#lib/directus/assets.ts', () => ({
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

	it('renders the section with correct testid', () => {
		render(FeaturedProjects, { props: renderProps });
		expect(screen.getByTestId('proof-reel-section')).toBeInTheDocument();
	});

	it('renders one shared ProjectCard per featured project row', () => {
		render(FeaturedProjects, { props: renderProps });
		const cards = screen.getAllByTestId('proof-card');
		expect(cards).toHaveLength(expectedCount);
	});

	it('renders a metric strip only for cards with authored metrics', () => {
		render(FeaturedProjects, { props: renderProps });
		const metrics = screen.queryAllByTestId('proof-metric-strip');
		expect(metrics).toHaveLength(resolvedProjects.filter(project => projectMetrics(project).length > 0).length);
	});

	it('renders every supplied proof metric while leaving an unmeasured project empty', () => {
		const authoredMetrics = Array.from({ length: 5 }, (_, index) => ({
			value: String(index + 1),
			label: { en: `Fixture outcome ${index + 1}` },
		}));
		const projects = [
			projectFactory.build({ slug: 'without-metrics', impactMetrics: [], impactMetric: undefined }),
			projectFactory.build({ slug: 'with-metrics', impactMetrics: authoredMetrics, impactMetric: undefined }),
		];
		render(FeaturedProjects, { props: { ...renderProps, projects } });
		const cards = screen.getAllByTestId('proof-card');
		expect(cards[0].querySelector('[data-testid="proof-metric-strip"]')).toBeNull();
		const values = cards[1].querySelectorAll('[data-testid="proof-metric-value"]');
		const labels = cards[1].querySelectorAll('[data-testid="proof-metric-label"]');
		expect(Array.from(values, element => element.textContent)).toEqual(authoredMetrics.map(metric => metric.value));
		expect(Array.from(labels, element => element.textContent)).toEqual(authoredMetrics.map(metric => metric.label.en));
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
			expect(within(cards[i]!).getByRole('link').getAttribute('href')).toBe(`/projects/${project.slug}`);
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
		expect(screen.getByTestId('proof-prev')).toHaveAttribute('aria-label', siteLabels.a11y.carouselPrev.en);
		expect(screen.getByTestId('proof-next')).toHaveTextContent('→');
		expect(screen.getByTestId('proof-next')).not.toHaveTextContent('02');
		expect(screen.getByTestId('proof-next')).toHaveAttribute('aria-label', siteLabels.a11y.carouselNext.en);
	});

});
