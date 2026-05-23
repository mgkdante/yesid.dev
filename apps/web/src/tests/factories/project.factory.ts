// projectFactory — test data for Project.
//
// Mirrors ProjectSchema in $lib/schemas/project. Uses the
// `localizedBlockEditorDoc()` helper for the description + section content
// fields (Phase 0 finding: ZodFactory auto-gen fails on BlockEditorDoc
// discriminated union).

import { Factory } from 'interface-forge';
import { faker } from '@faker-js/faker';
import type { Project } from '$lib/types';
import { localizedBlockEditorDoc } from './_block-editor-doc';

const localizedString = () => ({
	en: faker.lorem.sentence(),
	fr: faker.lorem.sentence(),
	es: faker.lorem.sentence(),
});

export const projectFactory = new Factory<Project>(() => ({
	slug: faker.lorem.slug(),
	title: localizedString(),
	oneLiner: localizedString(),
	description: localizedBlockEditorDoc(),
	stack: ['TypeScript', 'SvelteKit'],
	tags: [faker.lorem.word(), faker.lorem.word()],
	status: 'public',
	featured: false,
	relatedServices: [],
	sections: [
		{
			title: localizedString(),
			content: localizedBlockEditorDoc(),
		},
	],
}));
