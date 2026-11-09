import { describe, expect, it } from 'vitest';
import { createReadingSession, type NavigationIntent, type SessionPorts } from './reading-session';

function deferred() {
	let resolve!: () => void;
	let reject!: (reason?: unknown) => void;
	const promise = new Promise<void>((yes, no) => { resolve = yes; reject = no; });
	return { promise, resolve, reject };
}
const switchNav: NavigationIntent = {
	type: 'link', fromPath: '/projects', toPath: '/fr/projects', shallow: false, willUnload: false,
};
function setup() {
	const paint = deferred();
	const values = new Map<string, string>();
	const calls: unknown[] = [];
	const state = { y: 1400, identity: undefined as string | undefined, mask: false };
	const ports: SessionPorts = {
		scrollY: () => state.y, scrollTo: (y) => { calls.push(['scroll', y]); },
		store: { get: (key) => values.get(key) ?? null, set: (key, value) => { values.set(key, value); },
			remove: (key) => { values.delete(key); } },
		focus: { capture: () => ({ key: 'search', start: 1, end: 3 }),
			restore: (focus) => { calls.push(['focus', focus]); } },
		afterPaint: () => paint.promise, now: () => 123, stableIdentity: () => state.identity,
		setRestoring: (value) => { state.mask = value; },
		routing: {
			key: (path, identity) => identity ? `id:${identity}` : path.replace(/^\/fr(?=\/|$)/, '') || '/',
			isHandoff: (from, to, identity) => from !== to && (Boolean(identity) || to === `/fr${from}`),
			isSwitch: (from, to) => to === `/fr${from}`,
		},
	};
	return { paint, values, calls, state, ports, session: createReadingSession(ports) };
}

describe('reading session', () => {
	it('keeps the activation offset when layout moves before navigation (6757fc2)', async () => {
		const { session, state } = setup();
		const event = {};
		session.activate(event);
		state.y = 1442;
		let captured: unknown;
		session.register({ capture: () => { captured = session.departureY(); return captured; }, restore: () => {} });
		const first = deferred();
		session.before({ ...switchNav, event, complete: first.promise });
		expect(session.departureY()).toBe(1400);
		expect(captured).toBe(1400);
		const second = deferred();
		session.before({ ...switchNav, event, complete: second.promise });
		first.resolve();
		await first.promise;
		expect(session.departureY()).toBe(1400);
		second.resolve();
		await second.promise;
		expect(session.departureY()).toBeUndefined();
		const third = deferred();
		session.before({ ...switchNav, event, complete: third.promise });
		third.reject(new Error('cancelled'));
		await third.promise.catch(() => {});
		expect(session.departureY()).toBeUndefined();
	});
});

it('restores a locale switch after paint, scroll before focus, then clears storage and mask', async () => {
	const { session, ports, paint, calls, values, state } = setup();
	const scroll = deferred();
	session.register({ capture: () => ({ heading: 'intro' }), restore: async (value) => {
		calls.push(['context', value]); await scroll.promise;
	} });
	session.before(switchNav);
	expect(JSON.parse(values.get('yesid:lstate:/projects')!)).toEqual({
		v: 1, path: '/projects', scroll: { heading: 'intro' },
		focus: { key: 'search', start: 1, end: 3 }, ts: 123,
	});
	expect(session.restoring).toBe(true);
	expect(state.mask).toBe(true);
	const restored = session.after(switchNav);
	await Promise.resolve();
	expect(calls).toEqual([]);
	paint.resolve();
	await Promise.resolve();
	expect(calls).toEqual([['context', { heading: 'intro' }]]);
	expect(values.size).toBe(1);
	scroll.resolve();
	await restored;
	expect(calls).toEqual([['context', { heading: 'intro' }], ['focus', ports.focus.capture()]]);
	expect(values.size).toBe(0);
	expect(session.restoring).toBe(false);
	expect(state.mask).toBe(false);
});

it('keeps the first blob when a second switch arrives while restoring', () => {
	const { session, state, values } = setup();
	session.before(switchNav);
	const first = values.get('yesid:lstate:/projects');
	state.y = 99;
	session.before(switchNav);
	expect(values.get('yesid:lstate:/projects')).toBe(first);
	expect(session.restoring).toBe(true);
});

it('clears the blob and mask when the stable identity changes', async () => {
	const { session, state, values, calls } = setup();
	state.identity = ' projects:one ';
	session.before(switchNav);
	expect(values.has('yesid:lstate:id:projects:one')).toBe(true);
	state.identity = 'projects:two';
	await session.after(switchNav);
	expect(values.size).toBe(0);
	expect(calls).toEqual([]);
	expect(session.restoring).toBe(false);
	expect(state.mask).toBe(false);
});

it('drops the mask when a blob is missing and tolerates a following non-switch navigation', async () => {
	const { session, values, state, calls } = setup();
	session.before(switchNav);
	values.clear();
	await session.after(switchNav);
	expect(state.mask).toBe(false);
	await session.after({ ...switchNav, toPath: '/blog' });
	expect(session.restoring).toBe(false);
	expect(calls).toEqual([]);
});

it('drops an interrupted switch mask on a non-switch after navigation', async () => {
	const { session, paint, state } = setup();
	session.before(switchNav);
	expect(state.mask).toBe(true);
	const pending = session.after({ ...switchNav, toPath: '/blog' });
	paint.resolve();
	await pending;
	expect(state.mask).toBe(false);
});

it('ignores shallow goto in both hooks and enter after navigation', async () => {
	const { session, values, calls } = setup();
	const shallow = { ...switchNav, shallow: true, type: 'goto' };
	session.before(shallow);
	await session.after(shallow);
	expect(values.size).toBe(0);
	expect(session.departureY()).toBeUndefined();
	session.before(switchNav);
	const first = values.get('yesid:lstate:/projects');
	await session.after({ ...switchNav, type: 'enter' });
	await session.after(shallow);
	expect(values.get('yesid:lstate:/projects')).toBe(first);
	expect(session.restoring).toBe(true);
	expect(calls).toEqual([]);
});

it('guards storage failures and degrades to no handoff', async () => {
	const { ports, calls, state } = setup();
	const fail = () => { throw new Error('private mode'); };
	ports.store = { get: fail, set: fail, remove: fail };
	const session = createReadingSession(ports);
	expect(() => session.before(switchNav)).not.toThrow();
	await expect(session.after(switchNav)).resolves.toBeUndefined();
	expect(calls).toEqual([]);
	expect(state.mask).toBe(false);
	state.identity = 'one';
	session.before(switchNav);
	state.identity = 'two';
	await expect(session.after(switchNav)).resolves.toBeUndefined();
	expect(session.restoring).toBe(false);
});

it('uses the default offset through scrollTo when no context is registered', async () => {
	const { session, paint, calls, state } = setup();
	const unregister = session.register({ capture: () => 'old', restore: () => { throw new Error('old'); } });
	const dispose = session.register({ capture: () => 'current', restore: () => {} });
	unregister();
	dispose();
	session.before(switchNav);
	state.y = 0;
	paint.resolve();
	await session.after(switchNav);
	expect(calls[0]).toEqual(['scroll', 1400]);
});

it('captures departures only for non-shallow, non-unloading navigations', () => {
	const { session } = setup();
	session.before({ ...switchNav, shallow: true });
	expect(session.departureY()).toBeUndefined();
	session.before({ ...switchNav, willUnload: true });
	expect(session.departureY()).toBeUndefined();
	session.before({ ...switchNav, fromPath: undefined });
	expect(session.departureY()).toBe(1400);
});
