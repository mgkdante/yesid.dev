// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { shouldCarouselHandleDragTarget } from './carousel-drag';

describe('carousel drag guard', () => {
	it('allows carousel drags from normal slide content', () => {
		const card = document.createElement('article');
		const title = document.createElement('h2');
		card.append(title);

		expect(shouldCarouselHandleDragTarget(title)).toBe(true);
	});

	it('ignores carousel drags that start inside a nested drag surface', () => {
		const diagram = document.createElement('div');
		diagram.dataset.carouselDragIgnore = 'true';
		const node = document.createElement('span');
		diagram.append(node);

		expect(shouldCarouselHandleDragTarget(node)).toBe(false);
		expect(shouldCarouselHandleDragTarget(diagram)).toBe(false);
	});

	it('allows carousel drags when the event target is not an element', () => {
		expect(shouldCarouselHandleDragTarget(document.createTextNode('x'))).toBe(true);
		expect(shouldCarouselHandleDragTarget(null)).toBe(true);
	});
});
