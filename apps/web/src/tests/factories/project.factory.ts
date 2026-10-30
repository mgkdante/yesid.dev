import { Factory } from 'interface-forge';
import { faker } from '@faker-js/faker';
import type { Project } from '#lib/types.ts';
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
