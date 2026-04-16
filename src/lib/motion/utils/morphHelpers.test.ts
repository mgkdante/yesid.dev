import { describe, it, expect, vi } from 'vitest';
import { convertSvgToMorphPaths } from './morphHelpers.js';

describe('convertSvgToMorphPaths', () => {
	it('returns empty arrays when container has no shape elements', () => {
		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		const result = convertSvgToMorphPaths(svg);
		expect(result.paths).toEqual([]);
		expect(result.originals).toEqual([]);
	});

	it('converts path elements and stores originals', () => {
		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		path.setAttribute('d', 'M0 0 L10 10');
		svg.appendChild(path);

		const result = convertSvgToMorphPaths(svg);

		// MorphSVGPlugin.convertToPath is mocked in setup — returns the element wrapped
		expect(result.paths).toHaveLength(1);
		expect(result.originals).toHaveLength(1);
	});

	it('handles multiple shape types', () => {
		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		path.setAttribute('d', 'M0 0');
		const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
		const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
		svg.appendChild(path);
		svg.appendChild(circle);
		svg.appendChild(rect);

		const result = convertSvgToMorphPaths(svg);
		expect(result.paths).toHaveLength(3);
		expect(result.originals).toHaveLength(3);
	});
});
