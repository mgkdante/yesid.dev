/**
 * Per-module emit configs. One entry per generated `.ts` file under
 * apps/web/src/lib/content/.
 *
 * Each config maps an `ExportData` slot (filled by the P3 fetchers) to a
 * concrete output file with header + type imports + export declarations.
 *
 * Files marked "NEW" did not exist in the hand-written content layer; the
 * shape audit (slice-18m P1) introduced them so block_blog_page_content,
 * block_projects_page_content, and morph_shapes have first-class fallback
 * modules instead of being inlined as static.ts fallbacks.
 */

import { resolve } from 'node:path';
import type { ExportData } from '../../export-data';
import type { ModuleEmitConfig } from './emit-module';

/**
 * Builds the emit configs for all generated modules. Skips a config if the
 * required `ExportData` slot is undefined — useful for `--module=<name>`
 * partial runs where only one fetcher populated its slot.
 */
export function buildEmitConfigs(data: ExportData, contentDir: string): readonly ModuleEmitConfig[] {
	const out: ModuleEmitConfig[] = [];

	const path = (file: string) => resolve(contentDir, file);

	if (data.siteMeta) {
		out.push({
			filePath: path('site-meta.ts'),
			description: 'Site-wide brand identity (name, tagline, description, links, owner).',
			imports: [{ symbols: ['SiteMeta'], from: '$lib/types', typeOnly: true }],
			exports: [{ name: 'siteMeta', typeName: 'SiteMeta', value: data.siteMeta }],
		});
	}

	if (data.aboutPage) {
		out.push({
			filePath: path('about-page.ts'),
			description: '/about page content (identity, metrics, methodology, testimonials, etc.).',
			imports: [{ symbols: ['AboutContent'], from: '$lib/types', typeOnly: true }],
			exports: [{ name: 'aboutPageContent', typeName: 'AboutContent', value: data.aboutPage }],
		});
	}

	if (data.contactPage) {
		out.push({
			filePath: path('contact-page.ts'),
			description: '/contact page content (terminals, validation, success states).',
			imports: [{ symbols: ['ContactContent'], from: '$lib/types', typeOnly: true }],
			exports: [{ name: 'contactContent', typeName: 'ContactContent', value: data.contactPage }],
			reExportFromCompanion: './contact-page.companion',
		});
	}

	// site-content.ts collects all home-page block content under one barrel module.
	// Each export's type is precise so consumers can import them individually.
	const siteContentExports = [
		{ key: 'hero', name: 'heroContent', typeName: 'HeroContent' },
		{ key: 'manifesto', name: 'manifestoContent', typeName: 'ManifestoContent' },
		{ key: 'proofReel', name: 'proofReelContent', typeName: 'ProofReelContent' },
		{ key: 'servicesGrid', name: 'servicesGridContent', typeName: 'ServicesGridContent' },
		{ key: 'aboutIntro', name: 'aboutContent', typeName: 'AboutIntroContent' },
		{ key: 'cta', name: 'ctaContent', typeName: 'CtaContent' },
		{ key: 'closer', name: 'closerContent', typeName: 'CloserContent' },
	] as const;
	const presentSiteContent = siteContentExports.filter((e) => data[e.key as keyof ExportData] !== undefined);
	if (presentSiteContent.length > 0) {
		// heroAnimContent is destructured from heroContent.heroAnim — emit it as a
		// separate export so the existing import sites (e.g. `import { heroAnimContent }`)
		// keep resolving without changes.
		const heroAnim = data.hero?.heroAnim;
		const heroAnimExports = heroAnim
			? [{ name: 'heroAnimContent', typeName: 'HeroAnimContent', value: heroAnim }]
			: [];
		out.push({
			filePath: path('site-content.ts'),
			description: 'Home-page block content (hero, manifesto, proof reel, services grid, about teaser, CTA, closer).',
			imports: [
				{
					symbols: [
						...new Set([
							...(heroAnim ? ['HeroAnimContent'] : []),
							...presentSiteContent.map((e) => e.typeName),
						]),
					],
					from: '$lib/types',
					typeOnly: true,
				},
			],
			exports: [
				...heroAnimExports,
				...presentSiteContent.map((e) => ({
					name: e.name,
					typeName: e.typeName,
					value: data[e.key as keyof ExportData],
				})),
			],
			reExportFromCompanion: './site-content.companion',
		});
	}

	if (data.techStackPage || data.techStack) {
		// slice-18m follow-up (GH #63 + #64): tech-stack.ts emits BOTH the page
		// chrome (techStackPageContent from block_tech_stack_page_content) AND the
		// items array (techStackItems from tech_stack collection). The static
		// adapter sources from these directly — no more MD-glob parser, no more
		// companion module. apps/web/src/content/stack/*.md became orphans and
		// were deleted alongside this change.
		const items: { name: string; typeName: string; value: unknown }[] = [];
		const typeImports = new Set<string>();
		if (data.techStackPage) {
			items.push({
				name: 'techStackPageContent',
				typeName: 'TechStackPageContent',
				value: data.techStackPage,
			});
			typeImports.add('TechStackPageContent');
		}
		if (data.techStack) {
			items.push({
				name: 'techStackItems',
				typeName: 'readonly TechStackItem[]',
				value: data.techStack,
			});
			typeImports.add('TechStackItem');
		}
		out.push({
			filePath: path('tech-stack.ts'),
			description: '/tech-stack page chrome + tech-stack items array, both CMS-derived.',
			imports: [
				{ symbols: [...typeImports], from: '$lib/types', typeOnly: true },
			],
			exports: items,
		});
	}

	if (data.blogPosts) {
		out.push({
			filePath: path('blog.ts'),
			description: 'Blog posts (slugs, titles, excerpts, dates, tags, SVG illustration refs). Helpers + chrome live in blog.companion.ts.',
			imports: [{ symbols: ['BlogPost'], from: '$lib/types', typeOnly: true }],
			exports: [{ name: 'blogPosts', typeName: 'readonly BlogPost[]', value: data.blogPosts }],
			reExportFromCompanion: './blog.companion',
		});
	}

	if (data.services) {
		out.push({
			filePath: path('services.ts'),
			description: 'Services array (id, title, station, deliverables, sections, related projects). Chrome + helpers live in services.companion.ts.',
			imports: [{ symbols: ['Service'], from: '$lib/types', typeOnly: true }],
			exports: [{ name: 'services', typeName: 'readonly Service[]', value: data.services }],
			reExportFromCompanion: './services.companion',
		});
	}

	if (data.projects) {
		// projects.ts in the hand-written code uses RawProject (description + sections
		// as plain LocalizedString); the static adapter calls rawProjectToProject to
		// wrap into BlockEditorDoc at the port boundary. The CMS-derived fetcher already
		// returns full Project shape (description as LocalizedBlockEditorDoc), so we emit
		// against the Project type directly.
		out.push({
			filePath: path('projects.ts'),
			description: 'Projects array (slugs, titles, oneLiners, descriptions, sections, impact metrics, stack, tags, related services). Helpers live in projects.companion.ts.',
			imports: [{ symbols: ['Project'], from: '$lib/types', typeOnly: true }],
			exports: [{ name: 'projects', typeName: 'readonly Project[]', value: data.projects }],
			reExportFromCompanion: './projects.companion',
		});
	}

	if (data.nav || data.errorPageFallback) {
		const navExports: { name: string; typeName: string; value: unknown }[] = [];
		if (data.nav) {
			navExports.push({ name: 'navLinks', typeName: 'readonly NavLink[]', value: data.nav.navLinks });
			navExports.push({ name: 'menuItems', typeName: 'readonly MenuItem[]', value: data.nav.menuItems });
		}
		if (data.errorPageFallback) {
			navExports.push({
				name: 'errorPageContent',
				typeName: 'ErrorPageContent',
				value: data.errorPageFallback,
			});
		}
		out.push({
			filePath: path('nav.ts'),
			description: 'Navigation links (header + menu placements) + error page fallback. Interfaces, navDirections, sharedChromeContent live in nav.companion.ts.',
			imports: [
				{
					symbols: ['NavLink', 'MenuItem', 'ErrorPageContent'],
					from: './nav.companion',
					typeOnly: true,
				},
			],
			exports: navExports,
			reExportFromCompanion: './nav.companion',
		});
	}

	if (data.blogPage) {
		out.push({
			filePath: path('blog-page.ts'),
			description: '/blog page chrome (intro, heading, back-nav labels). NEW in slice-18m — was previously inlined as a static fallback in adapters/static.ts.',
			imports: [{ symbols: ['BlogPageContent'], from: '@repo/shared', typeOnly: true }],
			exports: [{ name: 'blogPageContent', typeName: 'BlogPageContent', value: data.blogPage }],
		});
	}

	if (data.projectsPage) {
		out.push({
			filePath: path('projects-page.ts'),
			description: '/projects page chrome (intro). NEW in slice-18m — was previously inlined as a static fallback in adapters/static.ts.',
			imports: [{ symbols: ['ProjectsPageContent'], from: '@repo/shared', typeOnly: true }],
			exports: [
				{ name: 'projectsPageContent', typeName: 'ProjectsPageContent', value: data.projectsPage },
			],
		});
	}

	if (data.morphShapes) {
		out.push({
			filePath: path('morph-shapes.ts'),
			description: 'Geometric morph-target library (id, label, path, viewbox, sort). NEW in slice-18m — was previously derived from utils/shapes.ts SHAPES const.',
			imports: [{ symbols: ['MorphShape'], from: '$lib/types', typeOnly: true }],
			exports: [
				{ name: 'morphShapes', typeName: 'readonly MorphShape[]', value: data.morphShapes },
			],
		});
	}

	return out;
}
