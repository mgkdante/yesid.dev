// Legal-pages schema — runtime mirror of LegalPage (OPS1 launch Phase 1).
// One row per legal page (/legal/[slug]); body is a per-locale Block Editor
// doc validated through LocalizedBlockEditorDocSchema (en required).

import { z } from 'zod';
import { LocalizedStringSchema } from './shared';
import { LocalizedBlockEditorDocSchema } from '../types/blocks';
import type { LegalPage } from '../types/content';

export const LegalPageSchema = z.object({
	slug: z.string().min(1),
	title: LocalizedStringSchema,
	body: LocalizedBlockEditorDocSchema,
}) satisfies z.ZodType<LegalPage>;
