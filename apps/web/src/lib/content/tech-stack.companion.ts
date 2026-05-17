// Hand-written companion to the CMS-derived `tech-stack.ts` (slice-18m).
//
// Holds the deprecated static markdown-glob parser that produced TechStackItem[]
// from `apps/web/src/content/stack/*.md` before slice-18g moved the source-of-
// truth to the Directus `tech_stack` collection. The CMS-derived `tech-stack.ts`
// (generated) now only exports `techStackPageContent`; the data array comes from
// the adapter `techStack.all()` port.
//
// This module + the static MD files are deferred to slice-18k for deletion
// (per GH #63 + #64 — depends on honeycomb redesign #62 landing first).

import type { TechStackItem } from '$lib/types';
import { wrapPlainText } from '@repo/shared';

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
			if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
				value = (value as string).slice(1, -1);
			}
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

	const iconSlug = (data.icon as string) ?? (data.id as string);
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
 * @deprecated Use `adapter.techStack.all()` instead. Static fallback for tests + 18k deletion.
 */
export function getAllTechItems(): readonly TechStackItem[] {
	return techItems;
}

/**
 * @deprecated Use `adapter.techStack.byId(id)` instead. Static fallback for tests + 18k deletion.
 */
export function getTechItemById(id: string): TechStackItem | undefined {
	return itemsById.get(id);
}

/**
 * @deprecated Use `adapter.techStack.content(id)` instead. Static fallback for tests + 18k deletion.
 */
export function getTechItemContent(id: string): string {
	return contentByIdMap.get(id) ?? '';
}

/** @deprecated Validates the static-path fallback data only. Use adapter in production. */
export function validateTechItems(): string[] {
	const errors: string[] = [];
	const ids = new Set<string>();

	for (const item of techItems) {
		if (ids.has(item.id)) errors.push(`Duplicate ID: ${item.id}`);
		ids.add(item.id);
		if (!item.name) errors.push(`${item.id}: missing name`);
		if (!item.icon) errors.push(`${item.id}: missing icon`);
	}

	return errors;
}
