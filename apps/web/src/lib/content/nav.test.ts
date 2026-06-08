import { describe, it, expect } from 'vitest';
import { navLinks, menuItems, footerLinks, mobileLinks, errorPageContent } from './nav.js';

describe('navLinks', () => {
	// slice-18m: nav links are CMS-derived. Order + copy are editor-controlled,
	// so tests assert structural validity instead of specific text/order.
	it('contains the 3 primary nav links (Services, Projects, Stack)', () => {
		expect(navLinks).toHaveLength(3);
		const hrefs = navLinks.map((l) => l.href).sort();
		expect(hrefs).toEqual(['/projects', '/services', '/tech-stack']);
	});

	it('every link has a non-empty English label', () => {
		for (const link of navLinks) {
			expect(link.label.en.trim()).not.toBe('');
		}
	});

	it('marks each link with priority 1 or 2 for adaptive display', () => {
		for (const link of navLinks) {
			expect([1, 2]).toContain(link.priority);
		}
	});
});

describe('menuItems', () => {
	it('contains all 6 navigation items', () => {
		expect(menuItems).toHaveLength(6);
	});

	it('has subtitles for all items', () => {
		for (const item of menuItems) {
			// subtitle is optional on NavLink; static menuItems always carry it
			expect(item.subtitle!.en).toBeTruthy();
		}
	});

	it('includes Services with subtitle "what I build"', () => {
		const services = menuItems.find(i => i.href === '/services');
		expect(services?.subtitle!.en).toBe('what I build');
	});

	it('includes Contact with subtitle "open channel"', () => {
		const contact = menuItems.find(i => i.href === '/contact');
		expect(contact?.subtitle!.en).toBe('open channel');
	});
});

describe('footerLinks', () => {
	it('is non-empty (3 rows from dev CMS)', () => {
		expect(footerLinks.length).toBeGreaterThan(0);
	});

	it('every link has a non-empty English label and a valid href', () => {
		for (const link of footerLinks) {
			expect(link.label.en.trim()).not.toBe('');
			expect(link.href.startsWith('/')).toBe(true);
		}
	});

	it('marks each link with priority 1 or 2', () => {
		for (const link of footerLinks) {
			expect([1, 2]).toContain(link.priority);
		}
	});
});

describe('mobileLinks', () => {
	it('is non-empty (3 rows from dev CMS)', () => {
		expect(mobileLinks.length).toBeGreaterThan(0);
	});

	it('every link has a non-empty English label and a valid href', () => {
		for (const link of mobileLinks) {
			expect(link.label.en.trim()).not.toBe('');
			expect(link.href.startsWith('/')).toBe(true);
		}
	});

	it('marks each link with priority 1 or 2', () => {
		for (const link of mobileLinks) {
			expect([1, 2]).toContain(link.priority);
		}
	});
});

describe('errorPageContent', () => {
	it('has a heading', () => {
		expect(errorPageContent.heading.en).toBeTruthy();
	});

	it('has a description', () => {
		expect(errorPageContent.description.en).toBeTruthy();
	});

	it('has a non-empty label', () => {
		// slice-18m: label text is CMS-controlled (was hand-written 'ROUTE NOT FOUND').
		expect(errorPageContent.label.en.trim()).not.toBe('');
	});

	it('has at least one route suggestion', () => {
		// slice-18m: editor decides how many suggestions (was hand-written 3).
		expect(errorPageContent.suggestions.length).toBeGreaterThanOrEqual(1);
		for (const s of errorPageContent.suggestions) {
			expect(s.label.en.trim()).not.toBe('');
			expect(s.href.trim()).not.toBe('');
		}
	});
});
