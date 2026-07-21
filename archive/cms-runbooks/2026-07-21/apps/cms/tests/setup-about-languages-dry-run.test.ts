import { describe, expect, it } from 'bun:test';
import {
	LANGUAGE_SEEDS,
	buildAboutLanguagesPlan,
	languageRowsFromSeeds,
	parseFlags,
} from '../scripts/setup-about-languages';

describe('setup-about-languages plan', () => {
	const plan = buildAboutLanguagesPlan();

	it('creates normalized language collections and image relations', () => {
		const collections = plan.filter((step) => step.kind === 'collection').map((step) => step.target);
		expect(collections).toEqual(['about_languages', 'about_languages_translations']);

		const imageField = plan.find((step) => step.target === 'about_languages.image');
		expect(imageField?.kind).toBe('field');
		expect((imageField?.payload as { type: string }).type).toBe('uuid');
		expect((imageField?.payload as { meta: { interface: string } }).meta.interface).toBe('file-image');

		const imageRelation = plan.find((step) => step.target === 'about_languages.image -> directus_files');
		expect(imageRelation?.kind).toBe('relation');
		expect((imageRelation?.payload as { related_collection: string }).related_collection).toBe('directus_files');
	});

	it('uses uploaded SVG assets as the language image source', () => {
		expect(LANGUAGE_SEEDS.map((seed) => seed.assetLegacyPath)).toEqual([
			'images/about/languages/quebec.svg',
			'images/about/languages/canada.svg',
			'images/about/languages/colombia.svg',
		]);
		expect(LANGUAGE_SEEDS.map((seed) => seed.id)).toEqual(['quebec', 'canada', 'colombia']);
	});

	it('builds seed rows without flag variants or JSON switches', () => {
		const rows = languageRowsFromSeeds({
			'images/about/languages/quebec.svg': 'uuid-quebec',
			'images/about/languages/canada.svg': 'uuid-canada',
			'images/about/languages/colombia.svg': 'uuid-colombia',
		});
		expect(rows).toEqual([
			{
				id: 'quebec',
				status: 'published',
				sort: 1,
				image: 'uuid-quebec',
				translations: [
					{ languages_code: 'en', label: 'French' },
					{ languages_code: 'fr', label: 'Français' },
				],
			},
			{
				id: 'canada',
				status: 'published',
				sort: 2,
				image: 'uuid-canada',
				translations: [
					{ languages_code: 'en', label: 'English' },
					{ languages_code: 'fr', label: 'Anglais' },
				],
			},
			{
				id: 'colombia',
				status: 'published',
				sort: 3,
				image: 'uuid-colombia',
				translations: [
					{ languages_code: 'en', label: 'Spanish' },
					{ languages_code: 'fr', label: 'Espagnol' },
				],
			},
		]);
		expect(JSON.stringify(rows)).not.toContain('"flag"');
	});

	it('parseFlags defaults to dry-run', () => {
		expect(parseFlags([])).toEqual({ apply: false, seed: false });
		expect(parseFlags(['--apply', '--seed'])).toEqual({ apply: true, seed: true });
	});
});
