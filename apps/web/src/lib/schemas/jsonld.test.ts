import { describe, expect, it } from 'vitest';
import {
	PersonSchema,
	WebSiteSchema,
	BlogPostingSchema,
	ServiceSchema,
	CreativeWorkSchema,
	BreadcrumbListSchema,
	ProfilePageSchema,
	CollectionPageSchema,
	SchemaOrgNodeSchema,
} from './jsonld';

const PERSON_ID = 'https://yesid.dev/#person';
const WEBSITE_ID = 'https://yesid.dev/#website';

const validPerson = {
	'@type': 'Person' as const,
	'@id': PERSON_ID,
	name: 'Yesid O.',
	jobTitle: 'Digital Infrastructure Consultant',
	url: 'https://yesid.dev',
	email: 'contact@yesid.dev',
	sameAs: ['https://github.com/mgkdante', 'https://www.linkedin.com/in/otaloray/'],
	knowsAbout: ['PostgreSQL', 'dbt'],
	address: {
		'@type': 'PostalAddress' as const,
		addressLocality: 'Montreal',
		addressRegion: 'QC',
		addressCountry: 'CA',
	},
};

describe('PersonSchema', () => {
	it('accepts a minimal valid Person', () => {
		expect(PersonSchema.safeParse(validPerson).success).toBe(true);
	});

	it('rejects a Person missing name', () => {
		const { name: _n, ...bad } = validPerson;
		expect(PersonSchema.safeParse(bad).success).toBe(false);
	});

	it('rejects a Person with a non-URL @id', () => {
		expect(PersonSchema.safeParse({ ...validPerson, '@id': 'not-a-url' }).success).toBe(false);
	});
});

describe('WebSiteSchema', () => {
	const validWebSite = {
		'@type': 'WebSite' as const,
		'@id': WEBSITE_ID,
		name: 'yesid.',
		url: 'https://yesid.dev',
		description: 'Digital infrastructure that moves.',
		publisher: { '@id': PERSON_ID },
	};

	it('accepts a minimal valid WebSite', () => {
		expect(WebSiteSchema.safeParse(validWebSite).success).toBe(true);
	});

	it('rejects WebSite missing publisher @id ref', () => {
		const { publisher: _p, ...bad } = validWebSite;
		expect(WebSiteSchema.safeParse(bad).success).toBe(false);
	});
});

describe('BlogPostingSchema', () => {
	const validBlogPosting = {
		'@type': 'BlogPosting' as const,
		'@id': 'https://yesid.dev/blog/test-post',
		headline: 'Test Post',
		description: 'A'.repeat(120),
		inLanguage: 'en',
		datePublished: '2026-04-20',
		author: { '@id': PERSON_ID },
		publisher: { '@id': PERSON_ID },
		mainEntityOfPage: 'https://yesid.dev/blog/test-post',
	};

	it('accepts a minimal valid BlogPosting', () => {
		expect(BlogPostingSchema.safeParse(validBlogPosting).success).toBe(true);
	});

	it('rejects BlogPosting missing headline', () => {
		const { headline: _h, ...bad } = validBlogPosting;
		expect(BlogPostingSchema.safeParse(bad).success).toBe(false);
	});

	it('accepts optional image field', () => {
		const withImage = {
			...validBlogPosting,
			image: 'https://yesid.dev/og/default.en.png',
		};
		expect(BlogPostingSchema.safeParse(withImage).success).toBe(true);
	});

	it('accepts optional dateModified and keywords fields', () => {
		const richPost = {
			...validBlogPosting,
			dateModified: '2026-04-21',
			keywords: ['sql', 'postgresql', 'performance'],
		};
		expect(BlogPostingSchema.safeParse(richPost).success).toBe(true);
	});
});

describe('ServiceSchema', () => {
	const validService = {
		'@type': 'Service' as const,
		'@id': 'https://yesid.dev/services/sql-consulting',
		name: 'SQL Consulting',
		description: 'PostgreSQL consulting for growing teams.',
		provider: { '@id': PERSON_ID },
	};

	it('accepts a minimal valid Service', () => {
		expect(ServiceSchema.safeParse(validService).success).toBe(true);
	});

	it('accepts optional areaServed field', () => {
		const withArea = { ...validService, areaServed: 'CA' };
		expect(ServiceSchema.safeParse(withArea).success).toBe(true);
	});
});

describe('CreativeWorkSchema', () => {
	const validCreativeWork = {
		'@type': 'CreativeWork' as const,
		'@id': 'https://yesid.dev/projects/test-project',
		name: 'Test Project',
		description: 'A sample project for testing.',
		url: 'https://yesid.dev/projects/test-project',
		author: { '@id': PERSON_ID },
		creator: { '@id': PERSON_ID },
		keywords: ['sql', 'postgresql'],
		about: ['PostgreSQL', 'dbt'],
	};

	it('accepts a minimal valid CreativeWork (no dates, per Q5-A)', () => {
		expect(CreativeWorkSchema.safeParse(validCreativeWork).success).toBe(true);
	});

	it('rejects CreativeWork missing author @id ref', () => {
		const { author: _a, ...bad } = validCreativeWork;
		expect(CreativeWorkSchema.safeParse(bad).success).toBe(false);
	});
});

describe('BreadcrumbListSchema', () => {
	const validBreadcrumb = {
		'@type': 'BreadcrumbList' as const,
		'@id': 'https://yesid.dev/about#breadcrumb',
		itemListElement: [
			{ '@type': 'ListItem' as const, position: 1, name: 'Home', item: 'https://yesid.dev' },
			{ '@type': 'ListItem' as const, position: 2, name: 'About', item: 'https://yesid.dev/about' },
		],
	};

	it('accepts a valid BreadcrumbList with 2 items', () => {
		expect(BreadcrumbListSchema.safeParse(validBreadcrumb).success).toBe(true);
	});

	it('rejects BreadcrumbList with 1 item', () => {
		const bad = { ...validBreadcrumb, itemListElement: [validBreadcrumb.itemListElement[0]] };
		expect(BreadcrumbListSchema.safeParse(bad).success).toBe(false);
	});

	it('rejects BreadcrumbList with 0 items', () => {
		const bad = { ...validBreadcrumb, itemListElement: [] };
		expect(BreadcrumbListSchema.safeParse(bad).success).toBe(false);
	});
});

describe('ProfilePageSchema', () => {
	const validProfilePage = {
		'@type': 'ProfilePage' as const,
		'@id': 'https://yesid.dev/about#profilepage',
		mainEntity: { '@id': PERSON_ID },
	};

	it('accepts a minimal valid ProfilePage', () => {
		expect(ProfilePageSchema.safeParse(validProfilePage).success).toBe(true);
	});

	it('accepts optional dateCreated + dateModified', () => {
		const withDates = {
			...validProfilePage,
			dateCreated: '2024-01-01',
			dateModified: '2026-04-20',
		};
		expect(ProfilePageSchema.safeParse(withDates).success).toBe(true);
	});
});

describe('CollectionPageSchema', () => {
	const validCollectionPage = {
		'@type': 'CollectionPage' as const,
		'@id': 'https://yesid.dev/blog#collectionpage',
		name: 'Blog',
		description: 'Notes on digital infrastructure.',
		url: 'https://yesid.dev/blog',
	};

	it('accepts a minimal valid CollectionPage', () => {
		expect(CollectionPageSchema.safeParse(validCollectionPage).success).toBe(true);
	});
});

describe('SchemaOrgNodeSchema (discriminated union)', () => {
	it('narrows by @type — Person', () => {
		const result = SchemaOrgNodeSchema.parse(validPerson);
		expect(result['@type']).toBe('Person');
	});

	it('rejects an object with unknown @type', () => {
		const bad = { '@type': 'Unicorn', '@id': 'https://yesid.dev/#u', name: 'X' };
		expect(SchemaOrgNodeSchema.safeParse(bad).success).toBe(false);
	});

	it('accepts a valid BreadcrumbList through the union', () => {
		const bc = {
			'@type': 'BreadcrumbList' as const,
			'@id': 'https://yesid.dev/x#b',
			itemListElement: [
				{ '@type': 'ListItem' as const, position: 1, name: 'Home', item: 'https://yesid.dev' },
				{ '@type': 'ListItem' as const, position: 2, name: 'X', item: 'https://yesid.dev/x' },
			],
		};
		expect(SchemaOrgNodeSchema.safeParse(bc).success).toBe(true);
	});
});
