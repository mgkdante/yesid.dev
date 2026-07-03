import { describe, it, expect } from 'bun:test';
import { HeroContentSchema } from './hero';
import { HeroAnimContentSchema } from './hero-anim';
import { ManifestoContentSchema } from './manifesto';
import { ProofReelContentSchema } from './proof-reel';
import { ServicesGridContentSchema } from './services-grid';
import { CtaContentSchema } from './cta';
import { CloserContentSchema } from './closer';
import { AboutIntroContentSchema } from './about-intro';

// Minimal valid LocalizedString for test fixtures.
const ls = (en: string) => ({ en });

// ---- HeroContentSchema ----

describe('HeroContentSchema', () => {
	const valid = {
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
			columns: {
				route: ls('Route'),
				avgDelayS: ls('Avg'),
				vehicles: ls('Vehicles'),
			},
			metaTemplate: ls('{n} rows'),
		},
		refreshButton: { label: ls('Refresh'), helper: ls('helper'), helperLive: ls('helperLive') },
		heroAnim: { scrollDown: ls('scroll') },
	};

	it('parses a minimal valid HeroContent', () => {
		expect(() => HeroContentSchema.parse(valid)).not.toThrow();
	});

	it('rejects missing required field', () => {
		const { subtitle: _omit, ...bad } = valid;
		expect(() => HeroContentSchema.parse(bad)).toThrow();
	});
});

// ---- HeroAnimContentSchema ----

describe('HeroAnimContentSchema', () => {
	it('parses a minimal valid HeroAnimContent', () => {
		expect(() => HeroAnimContentSchema.parse({ scrollDown: ls('Scroll') })).not.toThrow();
	});

	it('rejects empty object', () => {
		expect(() => HeroAnimContentSchema.parse({})).toThrow();
	});
});

// ---- ManifestoContentSchema ----

describe('ManifestoContentSchema', () => {
	const valid = {
		statement: {
			line1: ls('L1'), lineHuge: ls('huge'), line3Part1: ls('p1'),
			line3Highlight: ls('hl'), line3Part2: ls('p2'),
		},
		terminal: { user: ls('user'), command: ls('cmd') },
		pills: [{ label: ls('Web'), serviceId: 'web-dev' }],
		edgeLeft: { sectionNumber: ls('01'), sectionName: ls('Manifesto'), location: ls('MTL') },
		edgeRight: {
			lat: ls('45'), lng: ls('-73'), src: ls('src'), via: ls('via'),
			dst: ls('dst'), node: ls('node'), status: ls('OK'),
		},
		edgeBottom: {
			connected: ls('Connected'), line: ls('Orange'), url: ls('yesid.dev'),
			version: ls('v1'), scrollHint: ls('Scroll'),
		},
		transit: {
			arrivalLabel: ls('Arriving'), platformBadge: ls('P1'), directionBadge: ls('North'),
		},
		ticks: ['a', 'b'],
		hiddenTransitLines: [{ name: ls('Green'), color: '#00ff00' }],
	};

	it('parses a minimal valid ManifestoContent', () => {
		expect(() => ManifestoContentSchema.parse(valid)).not.toThrow();
	});
});

// ---- ProofReelContentSchema ----

describe('ProofReelContentSchema', () => {
	const valid = {
		heading: ls('Work'),
		headingDot: ls('.'),
		subheading: ls('sub'),
		sectionLabel: ls('section'),
		viewAllLabel: ls('All'),
		viewAllHref: '/work',
		toggleColorAria: ls('Toggle'),
	};

	it('parses a minimal valid ProofReelContent', () => {
		expect(() => ProofReelContentSchema.parse(valid)).not.toThrow();
	});
});

// ---- ServicesGridContentSchema ----

describe('ServicesGridContentSchema', () => {
	const valid = {
		heading: ls('Services'),
		headingDot: ls('.'),
		subheading: ls('sub'),
		viewIllustrationAria: ls('View {title}'),
		viewAllLink: ls('All services'),
	};

	it('parses a minimal valid ServicesGridContent', () => {
		expect(() => ServicesGridContentSchema.parse(valid)).not.toThrow();
	});
});

// ---- CtaContentSchema ----

describe('CtaContentSchema', () => {
	const valid = {
		heading: ls('Let’s talk'),
		subtitle: ls('sub'),
		ctaContact: ls('Contact'),
		ctaGithub: ls('GitHub'),
	};

	it('parses a minimal valid CtaContent', () => {
		expect(() => CtaContentSchema.parse(valid)).not.toThrow();
	});
});

// ---- CloserContentSchema ----

describe('CloserContentSchema', () => {
	const valid = {
		heading: ls('TERMINUS'),
		headingDot: ls('.'),
		subheading: ls('sub'),
		cta: { label: ls('Get in touch'), href: '/contact' },
		rows: {
			stack: { label: ls('Stack'), description: ls('desc'), action: ls('Open') },
			contact: { label: ls('Contact'), description: ls('desc'), action: ls('Send') },
			connect: { label: ls('Connect'), description: ls('desc'), action: ls('Link') },
			read: { label: ls('Read'), description: ls('desc'), action: ls('Blog') },
			about: { label: ls('About'), description: ls('desc'), action: ls('More') },
		},
		attribution: { text: ls('Built with'), url: 'https://sveltekit.dev' },
		terminal: {
			title: ls('DEPART'),
			city: ls('Montreal'),
			encoding: ls('UTF-8'),
			destinationsLabel: ls('{count} destinations'),
			prompt: ls('# routes'),
		},
	};

	it('parses a minimal valid CloserContent', () => {
		expect(() => CloserContentSchema.parse(valid)).not.toThrow();
	});
});

// ---- AboutIntroContentSchema ----

describe('AboutIntroContentSchema', () => {
	const valid = {
		name: ls('Yesid'),
		title: ls('Engineer'),
		bio: ls('bio text'),
		moreLink: ls('More'),
		stackLabel: ls('Stack'),
		stackItems: ['TypeScript', 'Svelte'],
		locationLabel: ls('Location'),
		location: { city: ls('Montreal'), region: ls('QC') },
		interestsLabel: ls('Interests'),
		interests: ls('music, transit'),
	};

	it('parses a minimal valid AboutIntroContent', () => {
		expect(() => AboutIntroContentSchema.parse(valid)).not.toThrow();
	});
});
