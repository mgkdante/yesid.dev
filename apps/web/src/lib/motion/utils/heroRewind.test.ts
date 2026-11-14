import { describe,it,expect } from 'vitest';
import { heroRewindEase } from './heroRewind';
describe('hero rewind pacing',()=>{
	it('stays continuous, monotone and bounded throughout the rewind',()=>{
		let previous=heroRewindEase(0);expect(previous).toBe(0);
		for(let frame=1;frame<=10000;frame++) {
			const current=heroRewindEase(frame/10000);
			expect(Number.isFinite(current)).toBe(true);
			expect(current).toBeGreaterThanOrEqual(previous-1e-12);
			expect(current).toBeLessThanOrEqual(1);
			expect(current-previous).toBeLessThan(.01);
			previous=current;
		}
		expect(previous).toBe(1);
	});
	it('clamps clock values outside the animation interval',()=>{
		expect(heroRewindEase(-1)).toBe(0);expect(heroRewindEase(2)).toBe(1);
	});
});
