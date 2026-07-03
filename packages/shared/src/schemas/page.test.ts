import { describe, it, expect } from 'bun:test';
import { PageSchema } from './page';

// Minimal valid LocalizedString.
const ls = (en: string) => ({ en });

// Minimal valid HeroContent item shape.
// heroAnim was added to HeroContentSchema in slice-18i Phase 4 fix-up (3115cfb).
const minimalHeroItem = {
	headline: { line1: ls('Hello'), line2: ls('World'), ariaSuffix: ls('suffix') },
	subheadline: ls('sub'),
	subtitle: ls('sub2'),
	identity: ls('freelance line'),
	ctaWork: ls('Work'),
	ctaContact: ls('Contact'),
	sqlPanel: {
		prompt: ls('SELECT'),
		liveLabel: ls('live'),
		liveBadge: ls('liveBadge'),
		columns: { route: ls('Route'), avgDelayS: ls('Avg'), vehicles: ls('Vehicles') },
		metaTemplate: ls('{n} rows'),
	},
	refreshButton: { label: ls('Refresh'), helper: ls('helper'), helperLive: ls('helperLive') },
	heroAnim: { scrollDown: ls('Scroll down') },
};

describe('PageSchema', () => {
	it('parses a page with a single block_hero', () => {
		const raw = {
			id: 'p1',
			slug: 'home',
			status: 'published',
			title: 'Home',
			blocks: [{ collection: 'block_hero', item: minimalHeroItem }],
		};
		const result = PageSchema.parse(raw);
		expect(result.blocks).toHaveLength(1);
		expect(result.blocks[0].collection).toBe('block_hero');
	});

	it('rejects unknown block collection', () => {
		const raw = {
			id: 'p1',
			slug: 'home',
			status: 'published',
			title: 'Home',
			blocks: [{ collection: 'block_unknown', item: {} }],
		};
		expect(() => PageSchema.parse(raw)).toThrow();
	});

	it('rejects mismatched item shape for known collection', () => {
		const raw = {
			id: 'p1',
			slug: 'home',
			status: 'published',
			title: 'Home',
			blocks: [{ collection: 'block_hero', item: { wrongField: 'x' } }],
		};
		expect(() => PageSchema.parse(raw)).toThrow();
	});

	it('parses a page with no blocks', () => {
		const raw = {
			id: 'p2',
			slug: 'about',
			status: 'draft',
			title: 'About',
			blocks: [],
		};
		const result = PageSchema.parse(raw);
		expect(result.blocks).toHaveLength(0);
	});

	it('rejects invalid status value', () => {
		const raw = {
			id: 'p1',
			slug: 'home',
			status: 'active', // not 'draft' | 'published'
			title: 'Home',
			blocks: [],
		};
		expect(() => PageSchema.parse(raw)).toThrow();
	});
});
