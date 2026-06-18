import { describe, expect, it } from 'bun:test';
import {
	orderRouteSeoRows,
	toRouteSeoOverride,
	type DirectusRouteSeoRow,
} from './route-seo';

const baseRows: DirectusRouteSeoRow[] = [
	{
		id: 1,
		path: '/services',
		status: 'published',
		sort: 4,
		og_image: null,
		translations: [
			{
				languages_code: 'en',
				title: 'Services from CMS',
				description:
					'CMS authored services description that is long enough to satisfy the SEO band.',
			},
			{
				languages_code: 'fr',
				title: 'Services depuis le CMS',
				description:
					'Description CMS des services assez longue pour satisfaire la bande SEO.',
			},
		],
	},
	{
		id: 2,
		path: '/blog',
		status: 'published',
		sort: 6,
		og_image: '74b62762-8d8d-4301-8635-f236bc23f739',
		translations: [
			{
				languages_code: 'en',
				title: null,
				description: null,
			},
		],
	},
];

describe('route-seo fetcher transform', () => {
	it('maps published route_seo rows into route override shape', () => {
		const override = toRouteSeoOverride(baseRows[0]!);

		expect(override).toEqual({
			path: '/services',
			ogImage: null,
			title: {
				en: 'Services from CMS',
				fr: 'Services depuis le CMS',
			},
			description: {
				en: 'CMS authored services description that is long enough to satisfy the SEO band.',
				fr: 'Description CMS des services assez longue pour satisfaire la bande SEO.',
			},
		});
	});

	it('keeps null title and description as absent overrides', () => {
		const override = toRouteSeoOverride(baseRows[1]!);

		expect(override.title).toBeNull();
		expect(override.description).toBeNull();
		expect(override.ogImage).toBe('74b62762-8d8d-4301-8635-f236bc23f739');
	});

	it('orders rows by sort, then path for byte-stable output', () => {
		const rows: DirectusRouteSeoRow[] = [
			{ ...baseRows[1]!, sort: null, path: '/z-last' },
			{ ...baseRows[0]!, sort: 2, path: '/b' },
			{ ...baseRows[0]!, sort: 2, path: '/a' },
		];

		expect(orderRouteSeoRows(rows).map((row) => row.path)).toEqual(['/a', '/b', '/z-last']);
	});
});
