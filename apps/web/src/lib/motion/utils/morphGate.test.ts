import { describe, expect, it, vi } from 'vitest';
import { createMorphGate } from './morphGate.js';

/** A play function that finishes only when the test says so. */
function controlledPlay() {
	const finishers: Array<() => void> = [];
	const play = vi.fn((_target: boolean, done: () => void) => {
		finishers.push(done);
	});
	return { play, finish: () => finishers.shift()?.() };
}

describe('createMorphGate', () => {
	it('plays toward the requested state', () => {
		const { play } = controlledPlay();
		const gate = createMorphGate({ play });

		gate.set(true);

		expect(play).toHaveBeenCalledTimes(1);
		expect(play).toHaveBeenLastCalledWith(true, expect.any(Function));
	});

	it('does nothing when the state is already settled', () => {
		const { play } = controlledPlay();
		const gate = createMorphGate({ play });

		gate.set(false);

		expect(play).not.toHaveBeenCalled();
	});

	it('never starts a second animation while one is running', () => {
		const { play } = controlledPlay();
		const gate = createMorphGate({ play });

		gate.set(true);
		gate.set(false);
		gate.set(true);
		gate.toggle();

		expect(play).toHaveBeenCalledTimes(1);
	});

	it('plays toward the latest request once the running animation finishes', () => {
		const { play, finish } = controlledPlay();
		const gate = createMorphGate({ play });

		gate.set(true);
		gate.set(false);
		finish();

		expect(play).toHaveBeenCalledTimes(2);
		expect(play).toHaveBeenLastCalledWith(false, expect.any(Function));
	});

	it('settles without another animation when the request returns to the running target', () => {
		const { play, finish } = controlledPlay();
		const gate = createMorphGate({ play });

		gate.set(true);
		gate.set(false);
		gate.set(true);
		finish();

		expect(play).toHaveBeenCalledTimes(1);
	});

	it('holds requests until ready, then plays the latest one', () => {
		const { play } = controlledPlay();
		const gate = createMorphGate({ play, ready: false });

		gate.set(true);
		expect(play).not.toHaveBeenCalled();

		gate.setReady(true);
		expect(play).toHaveBeenCalledTimes(1);
		expect(play).toHaveBeenLastCalledWith(true, expect.any(Function));
	});

	it('does not play a request cancelled before the gate became ready', () => {
		const { play } = controlledPlay();
		const gate = createMorphGate({ play, ready: false });

		gate.set(true);
		gate.set(false);
		gate.setReady(true);

		expect(play).not.toHaveBeenCalled();
	});

	it('toggle flips the latest request, not the settled state', () => {
		const { play, finish } = controlledPlay();
		const gate = createMorphGate({ play });

		gate.toggle();
		gate.toggle();
		finish();

		expect(play).toHaveBeenLastCalledWith(false, expect.any(Function));
	});

	it('handles animations that finish immediately', () => {
		const targets: boolean[] = [];
		const gate = createMorphGate({
			play: (target, done) => {
				targets.push(target);
				done();
			},
		});

		gate.set(true);
		gate.set(false);

		expect(targets).toEqual([true, false]);
	});

	it('ignores a repeated finish call', () => {
		const finishers: Array<() => void> = [];
		const play = vi.fn((_target: boolean, done: () => void) => {
			finishers.push(done);
		});
		const gate = createMorphGate({ play });

		gate.set(true);
		gate.set(false);
		finishers[0]!();
		finishers[0]!();

		expect(play).toHaveBeenCalledTimes(2);
	});

	it('starts nothing after destroy', () => {
		const { play, finish } = controlledPlay();
		const gate = createMorphGate({ play });

		gate.set(true);
		gate.set(false);
		gate.destroy();
		finish();
		gate.set(true);

		expect(play).toHaveBeenCalledTimes(1);
	});
});
