/**
 * stack-archetypes fetcher — reads `stack_archetypes` (slice-29 Tech Stack
 * Engine) with translations + the layered tech junction, and returns
 * PUBLISHED rows only, ordered by slug so the emitted module is byte-stable.
 *
 * The emitted module (apps/web/src/lib/content/stack-archetypes.ts) feeds the
 * pure client-side engine: tech links arrive pre-sorted by (STACK_LAYERS
 * render order, junction sort) because the blueprint derives its rows from
 * that order — no hand coordinates anywhere.
 *
 * proof_project and service are M2O FKs onto string-slug PKs (verified in
 * directus/snapshot: projects.id + services.id are the slugs), so the raw FK
 * value IS the slug — no expansion round-trip needed.
 */

import { readItems } from '@directus/sdk';
import { z } from 'zod';
import {
	STACK_LAYERS,
	StackArchetypeSchema,
	type StackArchetype,
	type StackLayer,
} from '@repo/shared/schemas';
import { toLocalizedString } from '../locale';
import type { FetcherContext } from './types';

export interface DirectusStackArchetypeTranslation {
	languages_code: string;
	title?: string | null;
	hook?: string | null;
	description?: string | null;
}

export interface DirectusStackArchetypeTechLink {
	tech_stack_id: string;
	layer: StackLayer;
	sort?: number | null;
}

/** M2O value — plain FK string in normal fetches; object form tolerated. */
export type DirectusM2oRef = string | { id: string } | null;

export interface DirectusStackArchetypeRow {
	id: string;
	status: 'published' | 'archived';
	slug: string;
	sort?: number | null;
	icon?: string | null;
	proof_project?: DirectusM2oRef;
	service?: DirectusM2oRef;
	translations?: DirectusStackArchetypeTranslation[];
	tech?: DirectusStackArchetypeTechLink[];
}

function m2oId(ref: DirectusM2oRef | undefined): string | null {
	if (ref == null) return null;
	return typeof ref === 'string' ? ref : ref.id;
}

/**
 * Pure ordering helper — (STACK_LAYERS render order, junction sort asc with
 * nulls last, tech id tiebreak). The blueprint reads rows top-to-bottom from
 * this order, so it must be deterministic.
 */
export function orderArchetypeTechLinks(
	links: readonly DirectusStackArchetypeTechLink[],
): DirectusStackArchetypeTechLink[] {
	return [...links].sort((a, b) => {
		const la = STACK_LAYERS.indexOf(a.layer);
		const lb = STACK_LAYERS.indexOf(b.layer);
		if (la !== lb) return la - lb;
		const sa = a.sort ?? Number.MAX_SAFE_INTEGER;
		const sb = b.sort ?? Number.MAX_SAFE_INTEGER;
		if (sa !== sb) return sa - sb;
		return a.tech_stack_id < b.tech_stack_id ? -1 : a.tech_stack_id > b.tech_stack_id ? 1 : 0;
	});
}

/** Pure transform — DirectusStackArchetypeRow → StackArchetype. Tested standalone. */
export function toStackArchetype(raw: DirectusStackArchetypeRow): StackArchetype {
	const links = raw.tech ?? [];
	if (links.length === 0) {
		throw new Error(
			`[fetchStackArchetypes] published archetype '${raw.slug}' has zero tech links — it cannot draw a blueprint. Link tech rows in Directus or archive the archetype.`,
		);
	}
	const proofProjectSlug = m2oId(raw.proof_project);
	if (!proofProjectSlug) {
		throw new Error(
			`[fetchStackArchetypes] published archetype '${raw.slug}' has no proof_project — the CTA rail needs a real project.`,
		);
	}
	const serviceId = m2oId(raw.service);
	if (!serviceId) {
		throw new Error(
			`[fetchStackArchetypes] published archetype '${raw.slug}' has no service — the CTA rail needs the delivering service.`,
		);
	}
	const tr = raw.translations ?? [];
	return {
		slug: raw.slug,
		title: toLocalizedString(tr, 'title'),
		hook: toLocalizedString(tr, 'hook'),
		description: toLocalizedString(tr, 'description'),
		proofProjectSlug,
		serviceId,
		tech: orderArchetypeTechLinks(links).map((link) => ({
			id: link.tech_stack_id,
			layer: link.layer,
			sort: link.sort ?? 0,
		})),
	};
}

/** Fetch + validate all published stack_archetypes rows, deterministic by slug. */
export async function fetchStackArchetypes({
	client,
}: FetcherContext): Promise<readonly StackArchetype[]> {
	const rows = (await client.request(
		readItems('stack_archetypes', {
			filter: { status: { _eq: 'published' } } as unknown as Record<string, unknown>,
			fields: [
				'id',
				'status',
				'slug',
				'sort',
				'icon',
				'proof_project',
				'service',
				{ translations: ['languages_code', 'title', 'hook', 'description'] } as unknown as string,
				{ tech: ['tech_stack_id', 'layer', 'sort'] } as unknown as string,
			] as unknown as (keyof DirectusStackArchetypeRow)[],
			sort: ['slug'],
			limit: -1,
		}),
	)) as unknown as DirectusStackArchetypeRow[];

	if (rows.length === 0) {
		throw new Error(
			'[fetchStackArchetypes] no published stack_archetypes rows found — the Tech Stack Engine never renders a blank state. Seed/publish the launch archetypes.',
		);
	}

	const ordered = [...rows].sort((a, b) => (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0));
	return z.array(StackArchetypeSchema).parse(ordered.map(toStackArchetype));
}
