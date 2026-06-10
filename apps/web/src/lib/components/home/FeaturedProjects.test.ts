import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import FeaturedProjects from './FeaturedProjects.svelte';
// slice-18i Phase 7C: FeaturedProjects now requires proofReel prop.
import { proofReelContent } from '$lib/content/site-content';
import { getProjectBySlug } from '$lib/content';
import { resolveLocale } from '$lib/utils';
import type { Project } from '$lib/types';

// These tests validate the SHAPE / behaviour of the proof-reel carousel, not
// the specific CMS values inside it. Both `proofReelContent.slugs` and the
// `projects` collection are generated from live Directus state (see the
// "GENERATED FILE" headers in site-content.ts / projects.ts) and change when
// the operator edits the CMS — hardcoding slugs, titles, or a fixed card count
// makes the suite break on every content edit. Precedent: slice-16 commit
// 8259c6b "decouple test assertions from CMS-controlled copy".
//
// The component renders one card per slug that resolves to a real project and
// silently drops slugs whose project row no longer exists. Expectations are
// therefore DERIVED from the same data the component consumes.
const resolvedProjects: Project[] = proofReelContent.slugs
	.map((slug) => getProjectBySlug(slug))
	.filter((p): p is Project => Boolean(p));

const expectedCount = resolvedProjects.length;

// slice-28.5 (#124): the component no longer resolves slugs itself — the home
// +page.server.ts does (repository layer) and passes the filtered array as the
// `projects` prop. The stub below mirrors that load output exactly.
const renderProps = { proofReel: proofReelContent, projects: resolvedProjects };

describe('FeaturedProjects', () => {
	// Guard: the carousel is meaningless with zero cards. If this trips, the
	// CMS proof-reel block references no existing projects — a data-quality
	// issue for the operator, surfaced here rather than as silent empty render.
	it('renders at least one resolvable project (CMS data-integrity guard)', () => {
		expect(expectedCount).toBeGreaterThan(0);
	});

	it('renders the section with correct testid', () => {
		render(FeaturedProjects, { props: renderProps });
		expect(screen.getByTestId('proof-reel-section')).toBeInTheDocument();
	});

	it('renders one card per resolvable featured slug', () => {
		render(FeaturedProjects, { props: renderProps });
		const cards = screen.getAllByTestId('proof-card');
		expect(cards).toHaveLength(expectedCount);
	});

	it('renders a metric-value span for every card', () => {
		render(FeaturedProjects, { props: renderProps });
		// Every card renders the metric-value span (empty when the project has
		// no impactMetric in Directus). Count, not content — the words are CMS.
		const metrics = screen.getAllByTestId('proof-metric-value');
		expect(metrics).toHaveLength(expectedCount);
	});

	it('renders a strikethrough before-value for cards whose metric has one', () => {
		render(FeaturedProjects, { props: renderProps });
		// Derive how many resolved projects carry a metric `before` value — the
		// component only renders proof-metric-before when present.
		const withBefore = resolvedProjects.filter((p) => p.impactMetric?.before);
		const beforeEls = screen.queryAllByTestId('proof-metric-before');
		expect(beforeEls).toHaveLength(withBefore.length);
		// When at least one exists, its text must match the CMS value (contract:
		// the component renders the raw `before` string).
		for (let i = 0; i < withBefore.length; i++) {
			expect(beforeEls[i]?.textContent).toContain(withBefore[i]!.impactMetric!.before!);
		}
	});

	it('renders project titles matching the resolved CMS data', () => {
		render(FeaturedProjects, { props: renderProps });
		const titles = screen.getAllByTestId('proof-card-title');
		expect(titles).toHaveLength(expectedCount);
		resolvedProjects.forEach((project, i) => {
			expect(titles[i]?.textContent).toContain(resolveLocale(project.title, 'en'));
		});
	});

	it('renders tech stack tags for cards that have a stack', () => {
		render(FeaturedProjects, { props: renderProps });
		const expectedTags = resolvedProjects.reduce((sum, p) => sum + p.stack.length, 0);
		const tags = screen.queryAllByTestId('proof-tag');
		expect(tags).toHaveLength(expectedTags);
	});

	it('cards link to /projects/[slug] for each resolved project (URL contract)', () => {
		render(FeaturedProjects, { props: renderProps });
		const cards = screen.getAllByTestId('proof-card');
		resolvedProjects.forEach((project, i) => {
			expect(cards[i]?.closest('a')?.getAttribute('href')).toBe(`/projects/${project.slug}`);
		});
	});

	it('renders view-all link to /projects', () => {
		render(FeaturedProjects, { props: renderProps });
		const link = screen.getByTestId('proof-view-all');
		expect(link).toBeInTheDocument();
		// URL contract — the View all link must reach the listing page. The href
		// is engineering's concern; the label text is CMS-owned, so assert it
		// renders the configured label rather than a hardcoded phrase.
		expect(link.getAttribute('href')).toBe('/projects');
		expect(link.textContent).toContain(resolveLocale(proofReelContent.viewAllLabel, 'en'));
	});

	it('renders one image button per card', () => {
		render(FeaturedProjects, { props: renderProps });
		const images = screen.getAllByTestId('proof-card-image');
		expect(images).toHaveLength(expectedCount);
	});
});
