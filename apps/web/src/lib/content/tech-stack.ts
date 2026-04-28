// Tech stack data layer — Slice 10 "The Control Room"
// Parses markdown files from src/content/stack/ at build time.
// Slice-18g: layer/domain/proficiency/connectsTo/scenarios fields dropped.
// Static helpers below are deprecated — use adapter.techStack.* instead.
// Full static file deletion deferred to 18k cleanup pass.

import type { TechStackItem, LocalizedString } from '$lib/types';
import { wrapPlainText } from '@repo/shared';

/** `/tech-stack` route chrome copy extracted in Task 17b-7l. Covers the hero
 *  (overline, title lines, terminal aria, stat labels), shared CTA actions
 *  (Get In Touch / View Services — rendered in both hero bottom and CTA zone),
 *  and the footer CTA zone (heading lines, sub, availability).
 *
 *  Decorative punctuation (`.` / `?` trailing the title/heading accent spans)
 *  stays as markup in the template — it's typography, not copy. Terminal
 *  animation flavour strings intentionally left as script literals per audit
 *  edge case #13 (decorative). */
export const techStackPageContent = {
	meta: {
		title: { en: 'Tech Stack — yesid.' } satisfies LocalizedString,
		description: {
			en: '{itemCount}+ technologies — an interactive map of how digital infrastructure gets built.',
		} satisfies LocalizedString,
	},
	hero: {
		overline: { en: 'Infrastructure Map' } satisfies LocalizedString,
		/** H1 line 1 — before the `<br>` break. */
		titleLine1: { en: 'The Control' } satisfies LocalizedString,
		/** H1 line 2 — rendered inside the `.hero-title-accent` span; trailing
		 *  `.` stays as a literal in the template. */
		titleLine2: { en: 'Room' } satisfies LocalizedString,
		terminalAria: { en: 'Infrastructure overview' } satisfies LocalizedString,
		stats: {
			technologies: { en: 'technologies' } satisfies LocalizedString,
		},
	},
	/** Shared CTA button labels — rendered twice (hero bottom + CTA zone). */
	actions: {
		getInTouch: { en: 'Get In Touch' } satisfies LocalizedString,
		viewServices: { en: 'View Services' } satisfies LocalizedString,
	},
	cta: {
		/** H2 line 1 — trailing `?` accent stays as a literal span. */
		headingLine1: { en: 'Found your stack' } satisfies LocalizedString,
		/** H2 line 2 — trailing `.` accent stays as a literal span. */
		headingLine2: { en: "Let's build it" } satisfies LocalizedString,
		sub: {
			en: "Whether it's a data pipeline, a web app, or a mobile product — the infrastructure is ready.",
		} satisfies LocalizedString,
		availability: { en: 'Available for Q2 2026' } satisfies LocalizedString,
	},
} as const;

// --- Frontmatter parsing ---

function parseFrontmatter(raw: string): { data: Record<string, unknown>; content: string } {
	const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
	if (!match) return { data: {}, content: raw };

	const frontmatter = match[1];
	const content = match[2];
	const data: Record<string, unknown> = {};

	for (const line of frontmatter.split('\n')) {
		const colonIdx = line.indexOf(':');
		if (colonIdx === -1) continue;
		const key = line.slice(0, colonIdx).trim();
		let value: unknown = line.slice(colonIdx + 1).trim();

		if (typeof value === 'string') {
			// Strip quotes
			if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
				value = (value as string).slice(1, -1);
			}
			// Parse arrays
			if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
				const inner = (value as string).slice(1, -1).trim();
				value = inner.length === 0 ? [] : inner.split(',').map((s) => s.trim());
			}
		}

		data[key] = value;
	}

	return { data, content };
}

// --- Raw file loading ---

const rawStackFiles = import.meta.glob('/src/content/stack/*.md', {
	query: '?raw',
	import: 'default',
	eager: true,
}) as Record<string, string>;

// --- Empty Block Editor body (static fallback; real bodies come from Directus) ---

const EMPTY_BODY = { en: wrapPlainText('') };

// --- Parse tech items (18g shape: id/name/icon/relatedServices/relatedProjects only) ---

function parseStackItem(raw: string): TechStackItem | null {
	const { data } = parseFrontmatter(raw);
	if (!data.id || !data.name) return null;

	// Legacy static parser: synthesise an IconRecord from the frontmatter slug.
	// The static file path is deprecated (use adapter.techStack.* instead, which
	// expands the real icons collection via icon_id). iconify_id is constructed
	// with the logos: namespace as a best-effort — it may not match exactly.
	// svg_override is always null here (static files have no Directus file UUIDs).
	const iconSlug = ((data.icon as string) ?? (data.id as string));
	const iconRecord = iconSlug
		? {
				id: iconSlug,
				name: data.name as string,
				iconify_id: iconSlug.includes(':') ? iconSlug : `logos:${iconSlug}`,
				svg_override: null,
		  }
		: null;

	return {
		id: data.id as string,
		name: data.name as string,
		icon: iconRecord,
		what_it_is: EMPTY_BODY,
		what_i_use_it_for: EMPTY_BODY,
		why_i_use_it_instead: EMPTY_BODY,
		relatedServices: (data.relatedServices as string[]) ?? [],
		relatedProjects: (data.relatedProjects as string[]) ?? [],
	};
}

// --- Parsed data ---

const techItems: TechStackItem[] = Object.values(rawStackFiles)
	.map(parseStackItem)
	.filter((item): item is TechStackItem => item !== null);

// Index for fast lookups
const itemsById = new Map(techItems.map((item) => [item.id, item]));

// --- Raw content cache (for sidebar markdown) ---

const contentByIdMap = new Map<string, string>();
for (const [path, raw] of Object.entries(rawStackFiles)) {
	const { content } = parseFrontmatter(raw);
	const filename = path.split('/').pop()?.replace('.md', '') ?? '';
	contentByIdMap.set(filename, content);
}

// --- Public API ---

/**
 * All parsed tech stack items.
 * @deprecated Use `adapter.techStack.all()` instead. Static fallback for tests + 18k deletion.
 */
export function getAllTechItems(): readonly TechStackItem[] {
	return techItems;
}

/**
 * Single item by ID, or undefined if not found.
 * @deprecated Use `adapter.techStack.byId(id)` instead. Static fallback for tests + 18k deletion.
 */
export function getTechItemById(id: string): TechStackItem | undefined {
	return itemsById.get(id);
}

/**
 * Raw markdown content body for a tech item (the prose below frontmatter).
 * @deprecated Use `adapter.techStack.content(id)` instead. Static fallback for tests + 18k deletion.
 */
export function getTechItemContent(id: string): string {
	return contentByIdMap.get(id) ?? '';
}

// --- Validation helpers (used by tests) ---

/** @deprecated Validates the static-path fallback data only. Use adapter in production. */
export function validateTechItems(): string[] {
	const errors: string[] = [];
	const ids = new Set<string>();

	for (const item of techItems) {
		// Unique IDs
		if (ids.has(item.id)) errors.push(`Duplicate ID: ${item.id}`);
		ids.add(item.id);

		// Required fields
		if (!item.name) errors.push(`${item.id}: missing name`);
		if (!item.icon) errors.push(`${item.id}: missing icon`);
	}

	return errors;
}
