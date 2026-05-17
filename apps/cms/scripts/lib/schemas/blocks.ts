/**
 * Block Editor doc + per-locale doc schemas.
 *
 * Defined locally (not imported from @repo/shared) because @repo/shared uses
 * Zod 4.x while apps/cms is on Zod 3.x; sharing schema instances across major
 * versions fails at runtime (keyValidator._parse mismatch). This permissive
 * structural check is enough for the export-fallbacks gate — the strict
 * discriminated-union schema in @repo/shared still runs at the apps/web
 * runtime boundary.
 */

import { z } from 'zod';
import type { BlockEditorDoc } from '@repo/shared';

const BlockEditorBlockSchema = z
	.object({
		id: z.string(),
		type: z.string(),
		data: z.unknown(),
	})
	.passthrough();

export const BlockEditorDocSchema: z.ZodType<BlockEditorDoc> = z.object({
	time: z.number(),
	blocks: z.array(BlockEditorBlockSchema as unknown as z.ZodType<BlockEditorDoc['blocks'][number]>),
	version: z.string(),
});

export const LocalizedBlockEditorDocSchema = z.object({
	en: BlockEditorDocSchema,
	fr: BlockEditorDocSchema.optional(),
	es: BlockEditorDocSchema.optional(),
});

export type LocalizedBlockEditorDoc = z.infer<typeof LocalizedBlockEditorDocSchema>;
