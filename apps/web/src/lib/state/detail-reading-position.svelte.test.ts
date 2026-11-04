import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { detailReadingPosition } from './detail-reading-position';
import { lenisAwareScrollTo } from './locale-handoff.svelte';

vi.mock('./locale-handoff.svelte', () => ({ lenisAwareScrollTo: vi.fn() }));

function section(top: number, height: number): HTMLElement {
	const el = document.createElement('section');
	el.className = 'reading-section';
	vi.spyOn(el, 'getBoundingClientRect').mockImplementation(() => ({
		top: top - window.scrollY, bottom: top + height - window.scrollY,
		height, width: 600, left: 0, right: 600, x: 0, y: top - window.scrollY, toJSON() {},
	}));
	document.body.append(el);
	return el;
}

describe('detail reading position', () => {
	const context = detailReadingPosition('.reading-section');
	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubGlobal('innerHeight', 800);
		vi.stubGlobal('scrollY', 800);
	});
	afterEach(() => {
		document.body.replaceChildren();
		vi.unstubAllGlobals();
	});

	it('maps progress through translated sections with different positions and heights', () => {
		section(100, 200);
		section(400, 1200);
		const saved = context.capture(); // reading line is at 1000, halfway through section 2
		document.body.replaceChildren();
		section(100, 400);
		section(600, 1800);
		context.restore(saved);
		expect(lenisAwareScrollTo).toHaveBeenCalledWith(1300);
	});

	it('uses the offset when translated section counts differ', () => {
		section(400, 1200);
		const saved = context.capture();
		section(1700, 200);
		context.restore(saved);
		expect(lenisAwareScrollTo).toHaveBeenCalledWith(800);
	});

	it('keeps the offset outside section content, including above the article', () => {
		section(1400, 1200);
		const saved = context.capture();
		context.restore(saved);
		expect(lenisAwareScrollTo).toHaveBeenCalledWith(800);
	});

	it('does not reveal a closed section while restoring its header position', () => {
		const el = section(980, 40);
		el.innerHTML = '<button aria-expanded="false">Closed</button><div inert>Hidden text</div>';
		const click = vi.fn();
		el.addEventListener('click', click);
		context.restore(context.capture());
		expect(lenisAwareScrollTo).toHaveBeenCalledWith(800);
		expect(click).not.toHaveBeenCalled();
		expect(el.querySelector('button')).toHaveAttribute('aria-expanded', 'false');
	});

	it('degrades old and invalid snapshots to a finite offset', () => {
		section(400, 1200);
		context.restore({ kind: 'heading-index', index: 0, count: 1, y: 700 });
		expect(lenisAwareScrollTo).toHaveBeenLastCalledWith(700);
		context.restore({ kind: 'detail-section', index: 0, count: 1, progress: NaN, y: NaN });
		expect(lenisAwareScrollTo).toHaveBeenLastCalledWith(0);
	});
});
