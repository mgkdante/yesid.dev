import { describe, expect, it } from 'bun:test';
import {
	toBlogPageContent,
	toProjectsPageContent,
} from './page-blocks-simple';
import { BlogPageContentSchema, ProjectsPageContentSchema } from '@repo/shared';

describe('blog-page transform', () => {
	const fixture = {
		id: 1,
		translations: [
			{
				languages_code: 'en',
				intro: 'Professional dispatches from the field.',
				heading: 'Blog',
				back_to_dispatches: 'back to dispatches',
				back_to_personal: 'back to personal',
			},
			{ languages_code: 'fr', intro: 'Dispatches professionnelles du terrain.' },
		],
	};

	it('produces LocalizedString fields with fr/es merged where present', () => {
		const result = toBlogPageContent(fixture);
		expect(result.intro).toEqual({
			en: 'Professional dispatches from the field.',
			fr: 'Dispatches professionnelles du terrain.',
		});
		expect(result.heading).toEqual({ en: 'Blog' });
	});

	it('output parses through BlogPageContentSchema', () => {
		const result = toBlogPageContent(fixture);
		expect(() => BlogPageContentSchema.parse(result)).not.toThrow();
	});
});

describe('projects-page transform', () => {
	it('produces LocalizedString intro/heading/emptyState from translations', () => {
		const result = toProjectsPageContent({
			id: 1,
			translations: [
				{
					languages_code: 'en',
					intro: 'Selected work.',
					heading: 'Projects',
					empty_state: 'No projects match the selected filters.',
				},
			],
		});
		expect(result.intro).toEqual({ en: 'Selected work.' });
		expect(result.heading).toEqual({ en: 'Projects' });
		expect(result.emptyState).toEqual({ en: 'No projects match the selected filters.' });
		expect(() => ProjectsPageContentSchema.parse(result)).not.toThrow();
	});
});
