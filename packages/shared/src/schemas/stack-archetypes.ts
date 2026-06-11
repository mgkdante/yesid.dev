// StackArchetypeSchema — one row of the `stack_archetypes` collection (slice-29).
//
// An archetype is a goal-shaped stack recipe ("a data dashboard") that the
// Tech Stack Engine renders as a living blueprint: each linked tech carries a
// `layer` that drives the blueprint row it lands on — layout is derived from
// data, never hand-coordinated.
//
// Shared between apps/cms (export-fallbacks fetcher validation) and apps/web
// (emitted $lib/content/stack-archetypes.ts + the client-side engine) so the
// two sides cannot drift.

import { z } from 'zod';
import { LocalizedStringSchema } from './shared';

/** Canonical blueprint layers in render order — interface on top, infra at the bottom. */
export const STACK_LAYERS = ['interface', 'logic', 'data', 'infra'] as const;

export const StackLayerSchema = z.enum(STACK_LAYERS);

/** One tech linked into an archetype: which tech, which blueprint row, and its order within that row. */
export const ArchetypeTechLinkSchema = z.object({
	/** tech_stack PK (string id, e.g. 'sveltekit'). */
	id: z.string().min(1),
	layer: StackLayerSchema,
	/** Order within the layer row. */
	sort: z.number().int(),
});

export const StackArchetypeSchema = z.object({
	slug: z.string().min(1),
	/** Card title, e.g. "A data dashboard" (en required; fr/es filled from CMS translations). */
	title: LocalizedStringSchema,
	/** One-liner on the card, e.g. "See your numbers move." */
	hook: LocalizedStringSchema,
	description: LocalizedStringSchema,
	/** Slug of the real project that proves this archetype. */
	proofProjectSlug: z.string().min(1).optional(),
	/** Id of the service that delivers this outcome. */
	serviceId: z.string().min(1).optional(),
	/** Stack composition — layer drives the blueprint row. Never empty. */
	tech: z.array(ArchetypeTechLinkSchema).min(1),
});

export type StackLayer = z.infer<typeof StackLayerSchema>;
export type ArchetypeTechLink = z.infer<typeof ArchetypeTechLinkSchema>;
export type StackArchetype = z.infer<typeof StackArchetypeSchema>;
