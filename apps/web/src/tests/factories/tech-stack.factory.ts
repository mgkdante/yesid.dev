// techStackFactory — test data for TechStackItem.
//
// Mirrors TechStackItemSchema in $lib/schemas/tech-stack. THREE
// LocalizedBlockEditorDoc fields (what_it_is, what_i_use_it_for,
// why_i_use_it_instead) plus an icon (IconRecord | null).

import { Factory } from 'interface-forge';
import { faker } from '@faker-js/faker';
import type { TechStackItem } from '$lib/types';
import { localizedBlockEditorDoc } from './_block-editor-doc';

export const techStackFactory = new Factory<TechStackItem>(() => ({
	id: faker.lorem.slug(),
	name: faker.helpers.arrayElement(['TypeScript', 'SvelteKit', 'Bun', 'Vite']),
	icon: null,
	what_it_is: localizedBlockEditorDoc(),
	what_i_use_it_for: localizedBlockEditorDoc(),
	why_i_use_it_instead: localizedBlockEditorDoc(),
	relatedServices: [],
	relatedProjects: [],
}));
