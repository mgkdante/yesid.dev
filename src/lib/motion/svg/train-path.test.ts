import { describe, it, expect } from 'vitest';
import { getTrainMotionPath } from './train-path';

describe('getTrainMotionPath', () => {
	it('returns a string starting with M (valid SVG path)', () => {
		const path = getTrainMotionPath(4);
		expect(path).toMatch(/^M /);
	});

	it('works for 4 stations (default)', () => {
		const path = getTrainMotionPath(4);
		// Should contain cubic bezier commands
		expect(path).toContain('C ');
		expect(path).toContain('S ');
	});

	it('works for 1 station', () => {
		const path = getTrainMotionPath(1);
		expect(path).toMatch(/^M /);
		expect(path).toContain('C ');
	});

	it('works for 8 stations', () => {
		const path = getTrainMotionPath(8);
		expect(path).toMatch(/^M /);
		// More stations = more S commands (smooth continuation)
		const sCount = (path.match(/ S /g) || []).length;
		// 8 stations + 2 (start/end) = 10 nodes, first uses C, rest use S = 9 segments - 1 C = 8 S
		expect(sCount).toBe(8);
	});

	it('starts off-screen top (negative y)', () => {
		const path = getTrainMotionPath(4);
		const firstCoord = path.match(/^M (-?\d+),(-?\d+)/);
		expect(firstCoord).not.toBeNull();
		expect(Number(firstCoord![2])).toBeLessThan(0);
	});

	it('ends off-screen bottom (y > height)', () => {
		const height = 1080;
		const path = getTrainMotionPath(4, 1920, height);
		// Extract the last coordinate pair
		const allCoords = path.match(/(-?\d+),(-?\d+)/g);
		expect(allCoords).not.toBeNull();
		const lastCoord = allCoords![allCoords!.length - 1];
		const lastY = Number(lastCoord.split(',')[1]);
		expect(lastY).toBeGreaterThan(height);
	});

	it('x coordinates stay near right edge', () => {
		const width = 1920;
		const path = getTrainMotionPath(4, width);
		const allCoords = path.match(/(-?\d+),(-?\d+)/g);
		expect(allCoords).not.toBeNull();
		for (const coord of allCoords!) {
			const x = Number(coord.split(',')[0]);
			// All x values should be within 80% to 100% of width
			expect(x).toBeGreaterThanOrEqual(width * 0.8);
			expect(x).toBeLessThanOrEqual(width);
		}
	});

	it('accepts custom dimensions', () => {
		const path = getTrainMotionPath(4, 1000, 500);
		expect(path).toMatch(/^M /);
	});

	it('handles 0 stations (just start and end)', () => {
		const path = getTrainMotionPath(0);
		expect(path).toMatch(/^M /);
		// With only 2 points, should be a simple line
		expect(path).toContain('L ');
	});
});
