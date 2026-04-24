import { describe, it, expect } from 'vitest';
import { navLinks, menuItems, errorPageContent } from './nav.js';

describe('navLinks', () => {
	it('contains Services, Projects, Stack as primary links', () => {
		expect(navLinks).toHaveLength(3);
		expect(navLinks[0].label.en).toBe('Services');
		expect(navLinks[1].label.en).toBe('Projects');
		expect(navLinks[2].label.en).toBe('Stack');
	});

	it('has correct hrefs', () => {
		expect(navLinks[0].href).toBe('/services');
		expect(navLinks[1].href).toBe('/projects');
		expect(navLinks[2].href).toBe('/tech-stack');
	});

	it('marks each link with a priority for adaptive display', () => {
		expect(navLinks[0].priority).toBe(1);
		expect(navLinks[1].priority).toBe(1);
		expect(navLinks[2].priority).toBe(2);
	});
});

describe('menuItems', () => {
	it('contains all 6 navigation items', () => {
		expect(menuItems).toHaveLength(6);
	});

	it('has subtitles for all items', () => {
		for (const item of menuItems) {
			expect(item.subtitle.en).toBeTruthy();
		}
	});

	it('includes Services with subtitle "what I build"', () => {
		const services = menuItems.find(i => i.href === '/services');
		expect(services?.subtitle.en).toBe('what I build');
	});

	it('includes Contact with subtitle "open channel"', () => {
		const contact = menuItems.find(i => i.href === '/contact');
		expect(contact?.subtitle.en).toBe('open channel');
	});
});

describe('errorPageContent', () => {
	it('has a heading', () => {
		expect(errorPageContent.heading.en).toBeTruthy();
	});

	it('has a description', () => {
		expect(errorPageContent.description.en).toBeTruthy();
	});

	it('has a label', () => {
		expect(errorPageContent.label.en).toBe('ROUTE NOT FOUND');
	});

	it('has route suggestions', () => {
		expect(errorPageContent.suggestions.length).toBeGreaterThanOrEqual(3);
	});
});
