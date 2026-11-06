import { beforeEach, describe, expect, it, vi } from 'vitest';
import { gsap } from '@yesid/motion/utils/gsap';
import { playSvgEntrance } from './svgEntrance.js';

const targets = () => [document.createElementNS('http://www.w3.org/2000/svg', 'path')];

describe('playSvgEntrance', () => {
	beforeEach(() => vi.clearAllMocks());

	it.each(['draw', 'draw-fill', 'morph'] as const)('reports completion of the whole %s entrance', (animation) => {
		const onComplete = vi.fn();

		playSvgEntrance(targets(), { animation, onComplete });

		expect(gsap.timeline).toHaveBeenCalledWith(expect.objectContaining({ onComplete }));
	});

	it('forwards the scroll trigger and start delay to the timeline', () => {
		const scrollTrigger = { start: 'top 80%', once: true };

		playSvgEntrance(targets(), { animation: 'draw', scrollTrigger, delay: 0.24 });

		expect(gsap.timeline).toHaveBeenCalledWith(expect.objectContaining({ scrollTrigger, delay: 0.24 }));
	});

	it('hides draw targets immediately and lets callers override draw timing', () => {
		const paths = targets();

		playSvgEntrance(paths, { animation: 'draw', duration: 1.1, stagger: 0.04 });

		expect(gsap.set).toHaveBeenCalledWith(paths, { drawSVG: '0%' });
		const timeline = vi.mocked(gsap.timeline).mock.results[0]!.value as gsap.core.Timeline;
		expect(timeline.to).toHaveBeenCalledWith(
			paths,
			expect.objectContaining({ drawSVG: '100%', duration: 1.1, stagger: 0.04 }),
		);
	});
});
