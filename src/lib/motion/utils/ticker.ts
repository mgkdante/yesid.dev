// Shared gsap.ticker wrapper.
// One gsap.ticker.add callback fans out to all subscribers — avoids multiple
// RAF loops from ManifestoCanvas, AboutTrain, typewriter, and any other
// idle animation. Subscribers identified by string ID; subscribing with
// an existing ID replaces the previous callback (idempotent).

import { gsap } from 'gsap';

type Callback = (time: number, deltaTime: number) => void;

const subscribers = new Map<string, Callback>();
let internalSubscription: ((time: number, deltaTime: number) => void) | null = null;

function ensureTickerSubscription(): void {
	if (internalSubscription) return;
	internalSubscription = (time: number, deltaTime: number) => {
		subscribers.forEach((fn) => fn(time, deltaTime));
	};
	gsap.ticker.add(internalSubscription);
}

/**
 * Subscribe a callback to every frame tick.
 * @param id Unique identifier. Subscribing with an existing id replaces the previous callback.
 * @param fn Callback invoked per frame with `(time, deltaTime)` in seconds.
 * @returns Unsubscribe function.
 */
export function subscribe(id: string, fn: Callback): () => void {
	ensureTickerSubscription();
	subscribers.set(id, fn);
	return () => unsubscribe(id);
}

/**
 * Remove a subscribed callback by id. No-op if id is not subscribed.
 */
export function unsubscribe(id: string): void {
	subscribers.delete(id);
}

/**
 * Test-only helper — resets module state so each test starts fresh.
 * @internal
 */
export function _resetForTests(): void {
	if (internalSubscription) {
		gsap.ticker.remove(internalSubscription);
		internalSubscription = null;
	}
	subscribers.clear();
}
