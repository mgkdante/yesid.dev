import { expect, it } from 'vitest';
import { createDetailReading, type DetailReadingPorts } from './detail-reading';

function setup() {
	const state = { y: 800, top: 400, height: 1200, expanded: false,
		departure: undefined as number | undefined };
	const scrolls: number[] = [];
	const followers: { active: boolean; layout(): void; stop(): void }[] = [];
	const section = { revealId: 'section-0', get box() {
		return { top: state.top - state.y, bottom: state.top + state.height - state.y,
			height: state.height, body: { top: state.top + 80 - state.y,
				bottom: state.top + state.height - state.y, open: true } };
	} };
	const ports: DetailReadingPorts = {
		sections: () => [section], viewportHeight: () => 800, scrollY: () => state.y,
		scrollTo: (y) => { state.y = y; scrolls.push(y); }, departureY: () => state.departure,
		bulkExpanded: () => state.expanded,
		follow: (_targets, onLayout) => {
			const follower = { active: true, layout: () => { if (follower.active) onLayout(); },
				stop: () => { follower.active = false; } };
			followers.push(follower);
			return follower.stop;
		},
	};
	return { state, scrolls, followers, ports, reading: createDetailReading(ports) };
}

it('keeps following late layout after a language switch until the reader acts (f90f2a4)', async () => {
	const { reading, state, scrolls, followers } = setup();
	const saved = reading.capture();
	state.top = 600;
	state.height = 1800;
	await reading.restore(saved);
	expect(scrolls).toEqual([1300]);
	state.height = 2400;
	followers.forEach((follower) => follower.layout());
	expect(scrolls).toEqual([1300, 1600]);
	followers.forEach((follower) => follower.stop()); // reader input ends the port's lease
	state.height = 3000;
	followers.forEach((follower) => follower.layout());
	expect(scrolls).toEqual([1300, 1600]);
});

it('stops the previous follow on a newer restore and on disposal', async () => {
	const { reading, state, scrolls, followers } = setup();
	const saved = reading.capture();
	await reading.restore(saved);
	await reading.restore(saved);
	expect(followers[0].active).toBe(false);
	state.height = 2400;
	followers.forEach((follower) => follower.layout());
	expect(scrolls).toEqual([800, 800, 1400]);
	reading.dispose();
	state.height = 3000;
	followers.forEach((follower) => follower.layout());
	expect(scrolls).toEqual([800, 800, 1400]);
});

it('never aligns a reveal superseded by another restore or disposal', async () => {
	for (const cancel of ['restore', 'dispose']) {
		const { reading, ports, scrolls, followers } = setup();
		let finish!: () => void;
		ports.jump = () => new Promise<void>((resolve) => { finish = resolve; });
		const pending = reading.restore(reading.capture());
		if (cancel === 'restore') await reading.restore({ kind: 'offset', y: 99 });
		else reading.dispose();
		finish();
		await pending;
		expect(scrolls).toEqual(cancel === 'restore' ? [99] : []);
		expect(followers).toEqual([]);
	}
});

it('measures the target again after its reveal completes', async () => {
	const { reading, ports, state, scrolls } = setup();
	const saved = reading.capture();
	const jumps: string[] = [];
	ports.jump = async (id) => { jumps.push(id); state.top = 600; state.height = 1800; };
	await reading.restore(saved);
	expect(jumps).toEqual(['section-0']);
	expect(scrolls).toEqual([1300]);
});

it('keeps expanded history offsets and maps collapsed history body progress', async () => {
	const { reading, ports, state, scrolls, followers } = setup();
	state.expanded = true;
	const saved = reading.capture();
	state.top = 600;
	state.height = 1800;
	await reading.restoreHistory(saved);
	expect(scrolls).toEqual([800]);
	expect(followers).toEqual([]);
	state.expanded = false;
	const jumps: string[] = [];
	ports.jump = async (id) => { jumps.push(id); };
	await reading.restoreHistory(saved);
	expect(jumps).toEqual(['section-0']);
	expect(scrolls).toEqual([800, 1300]);
	await reading.restoreHistory({ insideBody: false });
	expect(followers[0].active).toBe(true);
	state.height = 2400;
	followers[0].layout();
	expect(scrolls).toEqual([800, 1300, 1600]);
	state.expanded = true;
	await reading.restoreHistory({ insideBody: true, bulkExpanded: true, y: NaN });
	expect(followers[0].active).toBe(false);
	expect(scrolls).toEqual([800, 1300, 1600]);
});

it('leaves an in-flight reveal alive for non-body history and cancels it for offset restore', async () => {
	const { reading, ports, scrolls } = setup();
	let finish!: () => void;
	ports.jump = () => new Promise<void>((resolve) => { finish = resolve; });
	const pending = reading.restore(reading.capture());
	await reading.restoreHistory({ insideBody: false });
	finish();
	await pending;
	expect(scrolls).toEqual([800]);
	const second = reading.restore(reading.capture());
	await reading.restore({ y: 55 });
	finish();
	await second;
	expect(scrolls).toEqual([800, 55]);
});

it('prefers departureY over the current scroll offset, including zero', () => {
	const { reading, state } = setup();
	state.departure = 42;
	expect(reading.capture()).toMatchObject({ kind: 'detail-section', y: 42, progress: 0.5 });
	state.departure = 0;
	expect(reading.capture()).toMatchObject({ y: 0 });
	state.departure = undefined;
	expect(reading.capture()).toMatchObject({ y: 800 });
});

it('maps a closed section header without revealing its body or changing the bulk choice', async () => {
	const { reading, ports, state, scrolls } = setup();
	ports.sections = () => [{ revealId: 'section-0', get box() {
		return { top: 980 - state.y, bottom: 1020 - state.y, height: 40,
			body: { top: 1020 - state.y, bottom: 1020 - state.y, open: false } };
	} }];
	ports.jump = async () => { throw new Error('closed header must not reveal'); };
	const saved = reading.capture();
	expect(saved).toMatchObject({ insideBody: false, bulkExpanded: false, progress: 0.5 });
	await reading.restore(saved);
	expect(scrolls).toEqual([800]);
	expect(state.expanded).toBe(false);
});
