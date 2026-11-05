import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Navigation = { type: string; to: { url: URL } | null; willUnload?: boolean; shallow?: boolean };
const hooks = vi.hoisted(() => ({
	before: (_navigation: Navigation) => {},
	after: (_navigation: Navigation) => {},
	on: (_navigation: Navigation): void | (() => void) => {},
	destroy: () => {},
}));
vi.mock('$app/navigation', () => ({
	beforeNavigate: (callback: typeof hooks.before) => { hooks.before = callback; },
	afterNavigate: (callback: typeof hooks.after) => { hooks.after = callback; },
	onNavigate: (callback: typeof hooks.on) => { hooks.on = callback; },
}));
vi.mock('svelte', async (original) => ({
	...await original<typeof import('svelte')>(),
	onDestroy: (callback: () => void) => { hooks.destroy = callback; },
}));

import { attachDiagramHistoryAnchoring } from './diagram-history-anchoring';

const navigation = (type: string, path: string): Navigation => ({
	type, to: { url: new URL(path, 'https://yesid.dev') },
});

describe('diagram history anchoring lifetime', () => {
	let frameId = 0;
	let frames: Map<number, FrameRequestCallback>;
	let changed = () => {};
	const paint = () => {
		const pending = [...frames.values()];
		frames.clear();
		for (const callback of pending) callback(0);
	};
	beforeEach(() => {
		frames = new Map();
		hooks.after = () => {};
		hooks.on = () => {};
		changed = () => {};
		vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
			frames.set(++frameId, callback);
			return frameId;
		});
		vi.stubGlobal('cancelAnimationFrame', (id: number) => { frames.delete(id); });
		vi.stubGlobal('MutationObserver', class {
			observing = false;
			constructor(callback: () => void) { changed = () => { if (this.observing) callback(); }; }
			observe() { this.observing = true; }
			disconnect() { this.observing = false; }
		});
		document.documentElement.style.overflowAnchor = '';
		attachDiagramHistoryAnchoring();
	});
	afterEach(() => {
		hooks.destroy();
		document.body.replaceChildren();
		vi.unstubAllGlobals();
	});

	const begin = (event: Navigation) => {
		hooks.before(event);
		const complete = hooks.on(event);
		return () => { complete?.(); hooks.after(event); };
	};

	it.each(['true', 'false'])('protects departure capture through queued layout with rendering=%s', (pending) => {
		document.body.innerHTML = `<figure class="mermaid-diagram" data-rendering="${pending}"></figure>`;
		const complete = begin(navigation('link', '/projects'));
		expect(document.documentElement.style.overflowAnchor).toBe('none');
		document.querySelector('figure')!.setAttribute('data-rendering', 'false');
		changed();
		paint();
		paint();
		expect(document.documentElement.style.overflowAnchor).toBe('none');
		complete();
		expect(document.documentElement.style.overflowAnchor).toBe('');
	});

	it('keeps a new Back guard through a stale outgoing navigation completion', () => {
		document.body.innerHTML = '<figure class="mermaid-diagram" data-rendering="true"></figure>';
		const outgoing = begin(navigation('link', '/projects'));
		document.body.replaceChildren();
		begin(navigation('popstate', '/projects/yesid-dev'));
		outgoing();
		paint();
		paint();
		expect(document.documentElement.style.overflowAnchor).toBe('none');
	});

	it('releases after the matching Back page finishes its diagram layout', () => {
		const complete = begin(navigation('popstate', '/projects/yesid-dev'));
		document.body.innerHTML = '<figure class="mermaid-diagram" data-rendering="true"></figure>';
		complete();
		paint();
		paint();
		expect(document.documentElement.style.overflowAnchor).toBe('none');
		document.querySelector('figure')!.setAttribute('data-rendering', 'false');
		changed();
		paint();
		paint();
		expect(document.documentElement.style.overflowAnchor).toBe('');
	});

	it.each([{ willUnload: true }, { shallow: true }])('keeps anchoring for a non-page navigation: %j', (flags) => {
		document.body.innerHTML = '<figure class="mermaid-diagram" data-rendering="true"></figure>';
		begin({ ...navigation('link', '/projects'), ...flags });
		expect(document.documentElement.style.overflowAnchor).toBe('');
	});

	it('returns normal anchoring immediately when the reader acts', () => {
		const complete = begin(navigation('popstate', '/projects/yesid-dev'));
		window.dispatchEvent(new Event('wheel'));
		expect(document.documentElement.style.overflowAnchor).toBe('');
		complete();
		paint();
		paint();
		expect(document.documentElement.style.overflowAnchor).toBe('');
	});
});
