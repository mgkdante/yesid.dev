import { describe, expect, it } from 'bun:test';
import {
	CONTACT_CHANNEL_SEEDS,
	buildContactChannelsPlan,
	channelRowsFromSeeds,
	parseFlags,
} from '../scripts/setup-contact-channels';

describe('setup-contact-channels plan', () => {
	const plan = buildContactChannelsPlan();

	it('creates normalized contact channel collections', () => {
		const collections = plan.filter((step) => step.kind === 'collection').map((step) => step.target);
		expect(collections).toEqual(['contact_channels', 'contact_channels_translations']);

		const translationsField = plan.find((step) => step.target === 'contact_channels.translations');
		expect(translationsField?.kind).toBe('field');
		expect((translationsField?.payload as { type: string }).type).toBe('alias');

		const parentRelation = plan.find((step) => step.target === 'contact_channels_translations.contact_channels_id');
		expect(parentRelation?.kind).toBe('relation');
		expect((parentRelation?.payload as { related_collection: string }).related_collection).toBe('contact_channels');
	});

	it('seeds the current visible contact channels in terminal order', () => {
		expect(CONTACT_CHANNEL_SEEDS.map((seed) => seed.id)).toEqual(['email', 'github', 'linkedin']);
		expect(CONTACT_CHANNEL_SEEDS.map((seed) => seed.href)).toEqual([
			'mailto:contact@yesid.dev',
			'https://github.com/mgkdante',
			'https://www.linkedin.com/in/otaloray/',
		]);
	});

	it('builds seed rows without the retired socials JSON shape', () => {
		const rows = channelRowsFromSeeds();
		expect(rows).toEqual([
			{
				id: 'email',
				status: 'published',
				sort: 1,
				href: 'mailto:contact@yesid.dev',
				icon: 'email',
				translations: [
					{ languages_code: 'en', label: 'Email' },
					{ languages_code: 'fr', label: 'Courriel' },
				],
			},
			{
				id: 'github',
				status: 'published',
				sort: 2,
				href: 'https://github.com/mgkdante',
				icon: 'github',
				translations: [
					{ languages_code: 'en', label: 'GitHub' },
					{ languages_code: 'fr', label: 'GitHub' },
				],
			},
			{
				id: 'linkedin',
				status: 'published',
				sort: 3,
				href: 'https://www.linkedin.com/in/otaloray/',
				icon: 'linkedin',
				translations: [
					{ languages_code: 'en', label: 'LinkedIn' },
					{ languages_code: 'fr', label: 'LinkedIn' },
				],
			},
		]);
		expect(JSON.stringify(rows)).not.toContain('"socials"');
	});

	it('parseFlags defaults to dry-run', () => {
		expect(parseFlags([])).toEqual({ apply: false, seed: false });
		expect(parseFlags(['--apply', '--seed'])).toEqual({ apply: true, seed: true });
	});
});
