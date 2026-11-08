import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Window } from 'happy-dom';
import { afterAll, describe, expect, it } from 'vitest';
import fixture from '../../../../../packages/shared/fixtures/export-data.json';

const blogDir = fileURLToPath(new URL('../assets/blog-icons/', import.meta.url));
const serviceDir = fileURLToPath(new URL('../../../static/svg/services/', import.meta.url));
const blogIds = readdirSync(blogDir).filter((name) => name.endsWith('.svg')).map((name) => name.slice(0, -4));
const topics = [
	'pipeline', 'database', 'code', 'chart', 'website', 'compute', 'stack', 'shop',
	'ai', 'assistant', 'social', 'train', 'rocket', 'asteroid', 'telescope',
	'globe', 'canada', 'quebec', 'colombia', 'manga', 'food',
];
const allowed = new Set(['svg', 'path', 'circle', 'ellipse', 'rect', 'line', 'polyline', 'polygon']);
const color = /^(?:none|var\(--(?:primary|accent-text), #[0-9a-fA-F]{6}\))$/;
const window = new Window();
afterAll(() => window.close());

describe('animated topic and service icon assets', () => {
	it('offers the complete topic library and resolves every fixture post icon', () => {
		expect([...blogIds].sort()).toEqual([...topics].sort());
		for (const post of fixture.data.blogPosts) expect(blogIds, post.svg).toContain(post.svg);
	});

	for (const directory of [blogDir, serviceDir]) {
		for (const name of readdirSync(directory).filter((name) => name.endsWith('.svg'))) {
			it(`${name} supports theme colors and shape animations`, () => {
				const source = readFileSync(`${directory}/${name}`, 'utf8');
				const doc = new window.DOMParser().parseFromString(source, 'image/svg+xml');
				const root = doc.documentElement;
				expect(root.localName).toBe('svg');
				expect(root.getAttribute('viewBox')).toBe('0 0 48 48');
				expect(root.hasAttribute('width') || root.hasAttribute('height')).toBe(false);
				const elements = [root, ...root.querySelectorAll('*')];
				expect(elements.length - 1).toBeGreaterThan(0);
				expect(elements.length - 1).toBeLessThanOrEqual(14);
				for (const element of elements) {
					expect(allowed.has(element.localName), element.localName).toBe(true);
					for (const attribute of element.attributes) {
						if (['stroke', 'fill'].includes(attribute.name)) expect(attribute.value).toMatch(color);
						expect(['style', 'id', 'class'].includes(attribute.name)).toBe(false);
					}
				}
			});
		}
	}
});
