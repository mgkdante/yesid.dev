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
				heading: 'Blog',
				intro: 'Professional notes from the field.',
				personal_heading: 'Personal Corner',
				personal_intro: 'Off-work notes from the same builder.',
				empty_state: 'No posts found. Try adjusting your filters.',
				empty_state_no_posts: 'Nothing here yet.',
			},
			{
				languages_code: 'fr',
				intro: 'Notes professionnelles du terrain.',
				personal_heading: 'Coin perso',
				empty_state: 'Aucun article trouvé.',
			},
		],
	};

	it('maps heading, intro and no-results text for both listings, merging fr where present', () => {
		const result = toBlogPageContent(fixture);
		expect(result.heading).toEqual({ en: 'Blog' });
		expect(result.intro).toEqual({
			en: 'Professional notes from the field.',
			fr: 'Notes professionnelles du terrain.',
		});
		expect(result.personalHeading).toEqual({ en: 'Personal Corner', fr: 'Coin perso' });
		expect(result.personalIntro).toEqual({ en: 'Off-work notes from the same builder.' });
		expect(result.emptyState).toEqual({
			en: 'No posts found. Try adjusting your filters.',
			fr: 'Aucun article trouvé.',
		});
		expect(result.emptyStateNoPosts).toEqual({ en: 'Nothing here yet.' });
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
