// Handwritten paragraph defaults satisfy the block-editor discriminated union that automatic factories cannot generate.

import { faker } from '@faker-js/faker';
import type { BlockEditorDoc } from '@repo/shared';
import type { LocalizedBlockEditorDoc } from '#lib/types.ts';

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
