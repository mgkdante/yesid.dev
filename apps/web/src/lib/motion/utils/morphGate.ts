// The one rule every morphing SVG follows: a running animation always finishes.
// Input while busy only updates the latest request, which plays once the animation
// ends. Requests that cancel out collapse, and the art can never stick mid-state.

export interface MorphGateOptions {
	/** Animate toward `target` and call `done` when the whole animation has finished. */
	play: (target: boolean, done: () => void) => void;
	/** False holds requests until `setReady(true)`, e.g. while an entrance plays. Default: true. */
	ready?: boolean;
}

export interface MorphGate {
	/** Request a state. Plays now if idle, otherwise after the running animation. */
	set(active: boolean): void;
	/** Flip the latest request. */
	toggle(): void;
	/** Open or close the gate. Opening plays any request held while closed. */
	setReady(ready: boolean): void;
	/** Stop responding. The caller still owns killing its running animation. */
	destroy(): void;
}

export function createMorphGate({ play, ready = true }: MorphGateOptions): MorphGate {
	let requested = false;
	let settled = false;
	let running = false;
	let open = ready;
	let destroyed = false;

	function advance() {
		if (destroyed || running || !open || requested === settled) return;
		const target = requested;
		let finished = false;
		running = true;
		play(target, () => {
			if (finished) return;
			finished = true;
			running = false;
			settled = target;
			advance();
		});
	}

	return {
		set(active) {
			requested = active;
			advance();
		},
		toggle() {
			requested = !requested;
			advance();
		},
		setReady(next) {
			open = next;
			advance();
		},
		destroy() {
			destroyed = true;
		},
	};
}
