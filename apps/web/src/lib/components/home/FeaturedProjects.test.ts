import { siteLabels } from '#lib/content/site-labels.ts';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/svelte';
import FeaturedProjects from './FeaturedProjects.svelte';
import { proofReelContent } from '#lib/content/site-content.ts';
import { getFeaturedProjects } from '#lib/catalog/index.ts';
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
const renderProps = { proofReel: proofReelContent, projects: resolvedProjects };

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

	it('renders project titles and one-liners from the shared card', () => {
		render(FeaturedProjects, { props: renderProps });
		const cards = screen.getAllByTestId('proof-card');
		const titles = cards.map((card) => within(card).getByTestId('proof-card-title'));
		const excerpts = cards.map((card) => within(card).getByTestId('proof-excerpt'));
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
			expect(within(cards[i]!).getByRole('link', { name: resolveLocale(project.title, 'en') })).toHaveAttribute('href', `/projects/${project.slug}`);
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
		const images = screen.getAllByTestId('proof-card').flatMap((card) => within(card).queryAllByTestId('proof-card-image'));
		expect(images).toHaveLength(expectedCount);
	});

	it('adds one hidden, untabbable copy of each card so the reel can loop', () => {
		render(FeaturedProjects, { props: renderProps });
		const copies = document.querySelectorAll('[data-loop-copy]');
		expect(copies).toHaveLength(expectedCount);
		for (const copy of copies) {
			expect(copy.getAttribute('aria-hidden')).toBe('true');
			for (const link of copy.querySelectorAll('a, button')) expect(link.getAttribute('tabindex')).toBe('-1');
		}
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

	it('falls back to the shared blueprint media band for imageless projects', () => {
		const project = projectFactory.build({
			slug: 'synthetic-imageless',
			image: undefined,
			imageSecondary: undefined,
		} as Partial<Project>);

		render(FeaturedProjects, {
			props: {
				proofReel: proofReelContent,
				projects: [project],
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
			},
		});

		expect(screen.getByTestId('proof-count')).toHaveAttribute('aria-label', '01 / 03');
		for (const [id, direction, label] of [
			['proof-prev', 'previous', siteLabels.a11y.carouselPrev.en],
			['proof-next', 'next', siteLabels.a11y.carouselNext.en],
		] as const) {
			const control = screen.getByTestId(id);
			expect(control).toHaveTextContent(/^$/);
			expect(control).toHaveAttribute('data-direction', direction);
			expect(control).toHaveAttribute('aria-label', label);
		}
	});

});
