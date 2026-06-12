import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import FeaturedProjects from './FeaturedProjects.svelte';
// slice-18i Phase 7C: FeaturedProjects now requires proofReel prop.
import { proofReelContent } from '$lib/content/site-content';
import { getProjectBySlug, getVisibleServices } from '$lib/content';
import { resolveLocale } from '$lib/utils';
import type { Project } from '$lib/types';
import { projectFactory } from '../../../tests/factories';

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
// go2/home-cards: services join the props (same array the home load passes to
// HomeServices) so each card can render its station signage chip.
const services = getVisibleServices();
const renderProps = { proofReel: proofReelContent, projects: resolvedProjects, services };

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

	// ── go2/home-cards: story-first recompose render lock ──────────────────
	// Operator verdict: the cards "don't say nothing". Each card must now
	// carry the excerpt (one-liner), the station signage chip, the metric and
	// the exploration line. Counts/derivations follow the CMS-decoupling
	// precedent above — content words are CMS-owned, presence is engineering.

	it('renders the one-liner excerpt as the story line on every card', () => {
		render(FeaturedProjects, { props: renderProps });
		const excerpts = screen.getAllByTestId('proof-excerpt');
		expect(excerpts).toHaveLength(expectedCount);
		resolvedProjects.forEach((project, i) => {
			expect(excerpts[i]?.textContent).toContain(resolveLocale(project.oneLiner, 'en'));
			// Visibility grade (unit tier): real text, not an empty shell — the
			// computed-size grade runs in the home-cards e2e spec.
			expect(excerpts[i]?.textContent?.trim().length).toBeGreaterThan(0);
		});
	});

	it('renders a station signage chip naming the primary service per card', () => {
		render(FeaturedProjects, { props: renderProps });
		// Round 7: stations are MANY-TO-MANY — one chip per resolvable
		// service per card, station-number sorted (archived ids drop out,
		// never a crash). Titles render only when a card has ≤2 stations;
		// 3+ stations compress to numbers + the 'one system' caption.
		const expected = resolvedProjects.flatMap((p) =>
			p.relatedServices
				.map((id) => services.find((s) => s.id === id))
				.filter((s): s is NonNullable<typeof s> => Boolean(s)),
		);
		const chips = screen.queryAllByTestId('proof-station-chip');
		expect(chips).toHaveLength(expected.length);
		const allText = chips.map((c) => c.textContent).join(' ');
		for (const svc of expected) {
			expect(allText).toContain(String(svc.station).padStart(2, '0'));
		}
	});

	it('renders the quiet exploration line on every card', () => {
		render(FeaturedProjects, { props: renderProps });
		const lines = screen.getAllByTestId('proof-see-build');
		expect(lines).toHaveLength(expectedCount);
		for (const line of lines) {
			expect(line.textContent).toContain('see the build');
			expect(line.textContent).toContain('→');
		}
	});

	it('falls back to the gradient + service-SVG panel for imageless projects', () => {
		// cafe-arona case: a featured project with no proof-reel image entry
		// must render the fallback panel (ProjectCard parity), not a broken
		// <img>. Synthetic project via factory; service derived from CMS data.
		const svc = services.find((s) => s.svg);
		expect(svc, 'CMS must expose at least one visible service with an svg').toBeTruthy();
		const project = projectFactory.build({
			slug: 'synthetic-imageless',
			relatedServices: [svc!.id],
		});
		render(FeaturedProjects, {
			props: {
				proofReel: { ...proofReelContent, slugs: [project.slug], images: {} },
				projects: [project],
				services,
			},
		});
		expect(screen.getByTestId('proof-image-fallback')).toBeInTheDocument();
		// No photo element — the band is the gradient panel + service art.
		expect(document.querySelector('.proof-img')).toBeNull();
		expect(
			screen.getByTestId('proof-image-fallback').querySelector('img')?.getAttribute('src'),
		).toBe(`/svg/services/${svc!.svg}`);
		// Title drops the reflective voice off-photo — foreground ink class.
		expect(screen.getByTestId('proof-card-title').classList.contains('proof-title--ink')).toBe(
			true,
		);
		// The chip still names the station on fallback cards.
		expect(screen.getByTestId('proof-station-chip').textContent).toContain(
			String(svc!.station).padStart(2, '0'),
		);
	});

	it('renders no signage chips when every service id is unresolvable', () => {
		const project = projectFactory.build({
			slug: 'synthetic-orphan',
			relatedServices: ['archived-station-id'],
		});
		render(FeaturedProjects, {
			props: {
				proofReel: { ...proofReelContent, slugs: [project.slug], images: {} },
				projects: [project],
				services,
			},
		});
		expect(screen.queryAllByTestId('proof-station-chip')).toHaveLength(0);
		// The rest of the card still composes.
		expect(screen.getByTestId('proof-excerpt')).toBeInTheDocument();
		expect(screen.getByTestId('proof-see-build')).toBeInTheDocument();
	});
});
