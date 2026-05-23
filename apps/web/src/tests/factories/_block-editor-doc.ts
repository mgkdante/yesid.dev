// _block-editor-doc.ts — minimal valid BlockEditorDoc + LocalizedBlockEditorDoc.
//
// Underscore prefix marks this as a factory HELPER (not consumed directly by
// component tests). Reused by project, blog-post, and tech-stack factories
// where Zod schemas reference BlockEditorDoc or LocalizedBlockEditorDoc.
//
// Phase 0 finding: ZodFactory auto-gen cannot satisfy the BlockEditorBlock
// discriminated union. Hand-rolling a single paragraph block is the simplest
// path to a schema-valid default.

import { faker } from '@faker-js/faker';
import type { BlockEditorDoc } from '@repo/shared';
import type { LocalizedBlockEditorDoc } from '$lib/types';

/**
 * Build a minimal valid BlockEditorDoc: one paragraph block.
 * Pass `text` to override the paragraph content.
 */
export function blockEditorDoc(text = faker.lorem.sentence()): BlockEditorDoc {
	return {
		time: faker.date.recent().getTime(),
		blocks: [
			{
				id: faker.string.alphanumeric(10),
				type: 'paragraph',
				data: { text },
			},
		],
		version: '2.31.2',
	};
}

/**
 * Build a LocalizedBlockEditorDoc with `en` populated and `fr`/`es` optional.
 * Each locale's text is independent for variety.
 */
export function localizedBlockEditorDoc(): LocalizedBlockEditorDoc {
	return {
		en: blockEditorDoc(faker.lorem.sentence()),
		fr: blockEditorDoc(faker.lorem.sentence()),
		es: blockEditorDoc(faker.lorem.sentence()),
	};
}
