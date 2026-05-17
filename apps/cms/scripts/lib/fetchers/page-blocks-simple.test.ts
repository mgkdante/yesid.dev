import { describe, expect, it } from 'bun:test';
import {
	toBlogPageContent,
	toProjectsPageContent,
} from './page-blocks-simple';
import { BlogPageContentSchema, ProjectsPageContentSchema } from '../schemas/page-blocks';

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
	it('produces a LocalizedString intro from translations', () => {
		const result = toProjectsPageContent({
			id: 1,
			translations: [{ languages_code: 'en', intro: 'Selected work.' }],
		});
		expect(result.intro).toEqual({ en: 'Selected work.' });
		expect(() => ProjectsPageContentSchema.parse(result)).not.toThrow();
	});
});
