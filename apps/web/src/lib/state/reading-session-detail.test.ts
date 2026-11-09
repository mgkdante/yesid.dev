import { expect, it } from 'vitest';
import { createDetailReading } from './detail-reading';
import { createReadingSession, type SessionPorts } from './reading-session';

function setup() {
	const state = { y: 800, top: 400, height: 1200, following: false };
	const scrolls: number[] = [];
	const values = new Map<string, string>();
	let painted!: () => void;
	const paint = new Promise<void>((resolve) => { painted = resolve; });
	let layout = () => {};
	const ports: SessionPorts = {
		history: { suppressAnchoring: () => () => {}, pendingDiagrams: () => false,
			onLayoutChange: () => () => {}, onReaderInput: () => () => {}, frame: () => () => {} },
		scrollY: () => state.y, scrollTo: () => { throw new Error('detail context required'); },
		store: { get: (key) => values.get(key) ?? null,
			set: (key, value) => { values.set(key, value); }, remove: (key) => { values.delete(key); } },
		focus: { capture: () => null, restore: () => {} }, afterPaint: () => paint,
		now: () => 123, stableIdentity: () => 'project:one', setRestoring: () => {},
		routing: { key: () => 'project:one', isHandoff: () => true, isSwitch: () => true },
	};
	const session = createReadingSession(ports);
	const detail = createDetailReading({
		sections: () => [{ get box() { return { top: state.top - state.y,
			bottom: state.top + state.height - state.y, height: state.height }; } }],
		viewportHeight: () => 800, scrollY: () => state.y, departureY: () => session.departureY(),
		scrollTo: (y) => { state.y = y; scrolls.push(y); }, bulkExpanded: () => false,
		follow: (_targets, onLayout) => {
			state.following = true;
			layout = () => { if (state.following) onLayout(); };
			return () => { state.following = false; };
		},
	});
	return { state, values, painted, session, detail, scrolls,
		layout: () => layout(), readerInput: () => { state.following = false; } };
}

it('carries detail progress through locale paint and late layout until reader input', async () => {
	const { state, values, painted, session, detail, scrolls, layout, readerInput } = setup();
	const nav = { type: 'link', fromPath: '/projects/one', toPath: '/fr/projects/un',
		shallow: false, willUnload: false };
	session.register(detail);
	session.before(nav);
	expect(JSON.parse(values.get('yesid:lstate:project:one')!).scroll).toEqual({
		kind: 'detail-section', index: 0, count: 1, progress: 0.5, y: 800,
		insideBody: false, bulkExpanded: false,
	});
	const restored = session.after(nav);
	await Promise.resolve();
	expect(scrolls).toEqual([]);
	state.top = 600;
	state.height = 1800;
	painted();
	await restored;
	expect(scrolls).toEqual([1300]);
	expect(values.size).toBe(0);
	expect(session.restoring).toBe(false);
	state.height = 2400;
	layout();
	expect(scrolls).toEqual([1300, 1600]);
	readerInput();
	state.height = 3000;
	layout();
	expect(scrolls).toEqual([1300, 1600]);
	detail.dispose();
	session.dispose();
});
