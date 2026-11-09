import { expect, it } from 'vitest';
import { createReadingSession, type NavigationIntent, type SessionPorts } from './reading-session';

const back: NavigationIntent = {
	type: 'popstate', fromPath: '/projects', toPath: '/projects/one', shallow: false, willUnload: false,
};
function setup() {
	const frames = new Set<() => void>();
	const layouts = new Set<() => void>();
	const inputs = new Set<() => void>();
	const state = { pending: true, suppressed: false, restores: 0, suppressions: 0 };
	const subscribe = (set: Set<() => void>, cb: () => void) => { set.add(cb); return () => { set.delete(cb); }; };
	const history = {
		suppressAnchoring: () => {
			state.suppressed = true; state.suppressions++;
			return () => { state.suppressed = false; state.restores++; };
		},
		pendingDiagrams: () => state.pending,
		onLayoutChange: (cb: () => void) => subscribe(layouts, cb),
		onReaderInput: (cb: () => void) => subscribe(inputs, cb),
		frame: (cb: () => void) => subscribe(frames, cb),
	};
	const ports: SessionPorts = {
		history, scrollY: () => 1400, scrollTo: () => {},
		store: { get: () => null, set: () => {}, remove: () => {} },
		focus: { capture: () => null, restore: () => {} },
		afterPaint: async () => {}, now: () => 123, stableIdentity: () => undefined,
		setRestoring: () => {},
		routing: { key: (path) => path, isHandoff: () => false, isSwitch: () => false },
	};
	const frame = () => { const ready = [...frames]; frames.clear(); ready.forEach((cb) => cb()); };
	return { session: createReadingSession(ports), ports, state, frames, layouts, inputs, frame,
		layout: () => [...layouts].forEach((cb) => cb()), input: () => [...inputs].forEach((cb) => cb()) };
}

it('Back keeps anchoring off until late diagrams settle (d00e4cbc)', async () => {
	const { session, state, frame, layout } = setup();
	session.before(back);
	expect(state.suppressed).toBe(true);
	await session.after(back);
	frame(); frame();
	expect(state.suppressed).toBe(true);
	state.pending = false;
	layout(); frame();
	expect(state.suppressed).toBe(true);
	state.pending = true;
	frame();
	expect(state.suppressed).toBe(true);
	state.pending = false;
	layout(); frame();
	expect(state.suppressed).toBe(true);
	frame();
	expect(state.suppressed).toBe(false);
	expect(state.restores).toBe(1);
});

it('reader input releases once and removes every lease resource', async () => {
	const { session, state, frames, layouts, inputs, input, frame, layout } = setup();
	state.pending = false;
	session.before(back);
	await session.after(back);
	const staleInput = [...inputs][0];
	input(); staleInput(); layout(); frame(); session.dispose();
	expect(state.suppressed).toBe(false);
	expect(state.restores).toBe(1);
	expect([frames.size, layouts.size, inputs.size]).toEqual([0, 0, 0]);
});

it('the next navigation releases the previous lease before suppressing again', () => {
	const { session, state } = setup();
	session.before(back);
	session.before(back);
	expect(state.restores).toBe(1);
	expect(state.suppressed).toBe(true);
	session.before({ ...back, type: 'goto', shallow: true });
	expect(state.suppressed).toBe(false);
	expect(state.restores).toBe(2);
});

it.each(['link', 'goto', 'locale-switch'])('%s never suppresses anchoring', (type) => {
	const { session, state, ports } = setup();
	ports.routing.isHandoff = () => true;
	session.before({ ...back, type });
	expect(state.suppressions).toBe(0);
	expect(session.restoring).toBe(true);
});

it('starts settling synchronously even while the locale branch is already restoring', async () => {
	const { session, ports, state, layouts, frame } = setup();
	let paint!: () => void;
	ports.afterPaint = () => new Promise<void>((resolve) => { paint = resolve; });
	ports.store.get = () => JSON.stringify({ v: 1, path: '/projects', scroll: {}, focus: null, ts: 123 });
	ports.routing.isHandoff = () => true;
	session.before({ ...back, type: 'link' });
	expect(session.restoring).toBe(true);
	session.before(back);
	state.pending = false;
	const restored = session.after(back);
	expect(layouts.size).toBe(1);
	frame(); frame();
	expect(state.suppressed).toBe(false);
	expect(session.restoring).toBe(true);
	paint();
	await restored;
});

it('settles without a registered context or navigation endpoints', async () => {
	const { session, state, layouts, frame } = setup();
	const missing = { ...back, fromPath: undefined, toPath: undefined };
	session.before(missing);
	state.pending = false;
	const done = session.after(missing);
	expect(layouts.size).toBe(1);
	frame();
	expect(state.suppressed).toBe(true);
	frame();
	expect(state.suppressed).toBe(false);
	await done;
});

it.each([false, true])('dispose releases before or after layout observation: %s', async (after) => {
	const { session, state, frames, layouts, inputs } = setup();
	session.before(back);
	if (after) await session.after(back);
	session.dispose(); session.dispose();
	expect(state.suppressed).toBe(false);
	expect(state.restores).toBe(1);
	expect([frames.size, layouts.size, inputs.size]).toEqual([0, 0, 0]);
});

it('ordinary non-switch navigation with no active switch key drops a stuck restoring mask', async () => {
	const { session, ports } = setup();
	// An empty scope leaves the mask raised without an active switch key.
	ports.routing.key = () => '';
	ports.routing.isHandoff = () => true;
	session.before({ ...back, type: 'link' });
	expect(session.restoring).toBe(true);
	ports.routing.isHandoff = () => false;
	await session.after({ ...back, type: 'link', toPath: '/blog' });
	expect(session.restoring).toBe(false);
});

it('layout changes cancel the old frame and restart both settling frames', async () => {
	const { session, state, frame, layout, frames, layouts, inputs } = setup();
	state.pending = false;
	session.before(back);
	await session.after(back);
	frame();
	state.pending = true;
	layout();
	expect(frames.size).toBe(0);
	frame();
	expect(state.suppressed).toBe(true);
	state.pending = false;
	layout(); frame();
	expect(state.suppressed).toBe(true);
	frame();
	expect(state.restores).toBe(1);
	expect([frames.size, layouts.size, inputs.size]).toEqual([0, 0, 0]);
});

it('reader input before after-navigation prevents a released lease from restarting', async () => {
	const { session, state, input, layouts, frames } = setup();
	session.before(back);
	input();
	await session.after(back);
	expect(state.restores).toBe(1);
	expect([layouts.size, frames.size]).toEqual([0, 0]);
});

it('captures departure before releasing the old lease and suppressing the next', () => {
	const { session, ports } = setup();
	const departures: (number | undefined)[] = [];
	let y = 1400;
	ports.scrollY = () => y;
	ports.history.suppressAnchoring = () => {
		departures.push(session.departureY());
		return () => { departures.push(session.departureY()); };
	};
	session.before(back);
	y = 1600;
	session.before(back);
	expect(departures).toEqual([1400, 1600, 1600]);
});
