// factories.test.ts — coverage for all slice-17f L1 test data factories.
//
// Each factory describe block follows the same 3-test shape:
//   1. produces a value that satisfies its Zod schema
//   2. respects overrides
//   3. batch() produces N valid instances
//
// The schema-parse-on-build check is the drift guard: if a schema changes
// (e.g., new required field added), the factory test fails immediately,
// forcing the factory defaults to be updated alongside the schema.

import { describe, it, expect } from 'vitest';

// Schemas
import { RouteSeoOverrideSchema } from '$lib/schemas/route-seo';
import { ServiceSchema } from '$lib/schemas/service';
import { ProjectSchema } from '$lib/schemas/project';
import { BlogPostSchema } from '$lib/schemas/blog';
import { SiteMetaSchema } from '$lib/schemas/meta';
import { NavLinkSchema, ErrorPageContentSchema } from '$lib/schemas/nav';
import { PageSeoSchema } from '$lib/schemas/seo';
import { MorphShapeSchema } from '$lib/schemas/morph-shape';
import { HeroDataSchema } from '$lib/schemas/hero-data';
import { TechStackItemSchema } from '$lib/schemas/tech-stack';
import { PersonSchema } from '$lib/schemas/jsonld';
import { SiteSeoDefaultsSchema } from '$lib/schemas/site-seo-defaults';
import { IconRecordSchema } from '$lib/schemas/icon';

// Factories
import { routeSeoFactory } from './route-seo.factory';
import { serviceFactory } from './service.factory';
import { projectFactory } from './project.factory';
import { blogPostFactory } from './blog-post.factory';
import { siteMetaFactory } from './site-meta.factory';
import { navLinkFactory } from './nav-link.factory';
import { errorPageFactory } from './error-page.factory';
import { pageSeoFactory } from './page-seo.factory';
import { morphShapeFactory } from './morph-shape.factory';
import { heroDataFactory } from './hero-data.factory';
import { techStackFactory } from './tech-stack.factory';
import { jsonldFactory } from './jsonld.factory';
import { siteSeoDefaultsFactory } from './site-seo-defaults.factory';
import { iconRecordFactory } from './icon-record.factory';

describe('routeSeoFactory', () => {
	it('produces a value that satisfies RouteSeoOverrideSchema', () => {
		expect(() => RouteSeoOverrideSchema.parse(routeSeoFactory.build())).not.toThrow();
	});
	it('respects overrides', () => {
		const seo = routeSeoFactory.build({ path: '/about' });
		expect(seo.path).toBe('/about');
		expect(() => RouteSeoOverrideSchema.parse(seo)).not.toThrow();
	});
	it('batch produces N valid instances', () => {
		const ten = routeSeoFactory.batch(10);
		expect(ten).toHaveLength(10);
		ten.forEach((s) => expect(() => RouteSeoOverrideSchema.parse(s)).not.toThrow());
	});
});

describe('serviceFactory', () => {
	it('produces a value that satisfies ServiceSchema', () => {
		expect(() => ServiceSchema.parse(serviceFactory.build())).not.toThrow();
	});
	it('respects overrides', () => {
		const svc = serviceFactory.build({ station: 7 });
		expect(svc.station).toBe(7);
		expect(() => ServiceSchema.parse(svc)).not.toThrow();
	});
	it('batch produces N valid instances', () => {
		const five = serviceFactory.batch(5);
		expect(five).toHaveLength(5);
		five.forEach((s) => expect(() => ServiceSchema.parse(s)).not.toThrow());
	});
});

describe('projectFactory', () => {
	it('produces a value that satisfies ProjectSchema', () => {
		expect(() => ProjectSchema.parse(projectFactory.build())).not.toThrow();
	});
	it('respects overrides', () => {
		const proj = projectFactory.build({ status: 'private', featured: true });
		expect(proj.status).toBe('private');
		expect(proj.featured).toBe(true);
		expect(() => ProjectSchema.parse(proj)).not.toThrow();
	});
	it('batch produces N valid instances', () => {
		const three = projectFactory.batch(3);
		expect(three).toHaveLength(3);
		three.forEach((p) => expect(() => ProjectSchema.parse(p)).not.toThrow());
	});
});

describe('blogPostFactory', () => {
	it('produces a value that satisfies BlogPostSchema', () => {
		expect(() => BlogPostSchema.parse(blogPostFactory.build())).not.toThrow();
	});
	it('respects overrides', () => {
		const post = blogPostFactory.build({ category: 'personal' });
		expect(post.category).toBe('personal');
		expect(() => BlogPostSchema.parse(post)).not.toThrow();
	});
	it('batch produces N valid instances', () => {
		const five = blogPostFactory.batch(5);
		expect(five).toHaveLength(5);
		five.forEach((p) => expect(() => BlogPostSchema.parse(p)).not.toThrow());
	});
});

describe('siteMetaFactory', () => {
	it('produces a value that satisfies SiteMetaSchema', () => {
		expect(() => SiteMetaSchema.parse(siteMetaFactory.build())).not.toThrow();
	});
	it('respects overrides', () => {
		const meta = siteMetaFactory.build({ name: 'Yesid' });
		expect(meta.name).toBe('Yesid');
		expect(() => SiteMetaSchema.parse(meta)).not.toThrow();
	});
	it('batch produces N valid instances', () => {
		const three = siteMetaFactory.batch(3);
		expect(three).toHaveLength(3);
		three.forEach((m) => expect(() => SiteMetaSchema.parse(m)).not.toThrow());
	});
});

describe('navLinkFactory', () => {
	it('produces a value that satisfies NavLinkSchema', () => {
		expect(() => NavLinkSchema.parse(navLinkFactory.build())).not.toThrow();
	});
	it('respects overrides', () => {
		const link = navLinkFactory.build({ href: '/work', priority: 2 });
		expect(link.href).toBe('/work');
		expect(link.priority).toBe(2);
		expect(() => NavLinkSchema.parse(link)).not.toThrow();
	});
	it('batch produces N valid instances', () => {
		const five = navLinkFactory.batch(5);
		expect(five).toHaveLength(5);
		five.forEach((l) => expect(() => NavLinkSchema.parse(l)).not.toThrow());
	});
});

describe('errorPageFactory', () => {
	it('produces a value that satisfies ErrorPageContentSchema', () => {
		expect(() => ErrorPageContentSchema.parse(errorPageFactory.build())).not.toThrow();
	});
	it('respects overrides', () => {
		const page = errorPageFactory.build({ terminalLine: '$ status: 500' });
		expect(page.terminalLine).toBe('$ status: 500');
		expect(() => ErrorPageContentSchema.parse(page)).not.toThrow();
	});
	it('batch produces N valid instances', () => {
		const three = errorPageFactory.batch(3);
		expect(three).toHaveLength(3);
		three.forEach((p) => expect(() => ErrorPageContentSchema.parse(p)).not.toThrow());
	});
});

describe('pageSeoFactory', () => {
	it('produces a value that satisfies PageSeoSchema', () => {
		expect(() => PageSeoSchema.parse(pageSeoFactory.build())).not.toThrow();
	});
	it('respects overrides', () => {
		const seo = pageSeoFactory.build({ noIndex: true });
		expect(seo.noIndex).toBe(true);
		expect(() => PageSeoSchema.parse(seo)).not.toThrow();
	});
	it('batch produces N valid instances', () => {
		const three = pageSeoFactory.batch(3);
		expect(three).toHaveLength(3);
		three.forEach((s) => expect(() => PageSeoSchema.parse(s)).not.toThrow());
	});
});

describe('morphShapeFactory', () => {
	it('produces a value that satisfies MorphShapeSchema', () => {
		expect(() => MorphShapeSchema.parse(morphShapeFactory.build())).not.toThrow();
	});
	it('respects overrides', () => {
		const shape = morphShapeFactory.build({ label: 'overridden' });
		expect(shape.label).toBe('overridden');
		expect(() => MorphShapeSchema.parse(shape)).not.toThrow();
	});
	it('batch produces N valid instances', () => {
		const five = morphShapeFactory.batch(5);
		expect(five).toHaveLength(5);
		five.forEach((s) => expect(() => MorphShapeSchema.parse(s)).not.toThrow());
	});
});

describe('heroDataFactory', () => {
	it('produces a value that satisfies HeroDataSchema', () => {
		expect(() => HeroDataSchema.parse(heroDataFactory.build())).not.toThrow();
	});
	it('respects overrides', () => {
		const data = heroDataFactory.build({ queryTime: 100 });
		expect(data.queryTime).toBe(100);
		expect(() => HeroDataSchema.parse(data)).not.toThrow();
	});
	it('batch produces N valid instances', () => {
		const three = heroDataFactory.batch(3);
		expect(three).toHaveLength(3);
		three.forEach((d) => expect(() => HeroDataSchema.parse(d)).not.toThrow());
	});
});

describe('techStackFactory', () => {
	it('produces a value that satisfies TechStackItemSchema', () => {
		expect(() => TechStackItemSchema.parse(techStackFactory.build())).not.toThrow();
	});
	it('respects overrides', () => {
		const item = techStackFactory.build({ name: 'Postgres' });
		expect(item.name).toBe('Postgres');
		expect(() => TechStackItemSchema.parse(item)).not.toThrow();
	});
	it('batch produces N valid instances', () => {
		const three = techStackFactory.batch(3);
		expect(three).toHaveLength(3);
		three.forEach((t) => expect(() => TechStackItemSchema.parse(t)).not.toThrow());
	});
});

describe('jsonldFactory (Person variant)', () => {
	it('produces a value that satisfies PersonSchema', () => {
		expect(() => PersonSchema.parse(jsonldFactory.build())).not.toThrow();
	});
	it('respects overrides', () => {
		const person = jsonldFactory.build({ name: 'Yesid' });
		expect(person.name).toBe('Yesid');
		expect(() => PersonSchema.parse(person)).not.toThrow();
	});
	it('batch produces N valid instances', () => {
		const three = jsonldFactory.batch(3);
		expect(three).toHaveLength(3);
		three.forEach((p) => expect(() => PersonSchema.parse(p)).not.toThrow());
	});
});

describe('siteSeoDefaultsFactory', () => {
	it('produces a value that satisfies SiteSeoDefaultsSchema', () => {
		expect(() => SiteSeoDefaultsSchema.parse(siteSeoDefaultsFactory.build())).not.toThrow();
	});
	it('respects overrides', () => {
		const defaults = siteSeoDefaultsFactory.build({ themeColor: '#ff0000' });
		expect(defaults.themeColor).toBe('#ff0000');
		expect(() => SiteSeoDefaultsSchema.parse(defaults)).not.toThrow();
	});
	it('batch produces N valid instances', () => {
		const three = siteSeoDefaultsFactory.batch(3);
		expect(three).toHaveLength(3);
		three.forEach((d) => expect(() => SiteSeoDefaultsSchema.parse(d)).not.toThrow());
	});
});

describe('iconRecordFactory', () => {
	it('produces a value that satisfies IconRecordSchema', () => {
		expect(() => IconRecordSchema.parse(iconRecordFactory.build())).not.toThrow();
	});
	it('respects overrides', () => {
		const icon = iconRecordFactory.build({ name: 'database' });
		expect(icon.name).toBe('database');
		expect(() => IconRecordSchema.parse(icon)).not.toThrow();
	});
	it('batch produces N valid instances', () => {
		const five = iconRecordFactory.batch(5);
		expect(five).toHaveLength(5);
		five.forEach((i) => expect(() => IconRecordSchema.parse(i)).not.toThrow());
	});
});
