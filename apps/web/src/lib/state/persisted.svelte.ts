/**
 * One-line opt-in for a piece of component state to survive a language switch.
 *
 *   const q = persisted('blog-q', '');
 *   <input bind:value={q.value} />
 *
 * Session-scoped (slice-34): the value is registered with the locale-handoff
 * orchestrator, which snapshots it before a switch and restores it on the
 * remounted page. The stored value MUST be a locale-free primitive — an
 * id/slug/bool/number/array, never a translated string — so the same value is
 * valid in any locale. That invariant is what makes a new locale (ES) free, and
 * it is enforced here by the `LocaleFree` type bound.
 *
 * Keep the binding plain: `bind:value={q.value}` works because `.value` reads/
 * writes a real `$state` underneath. Do not wrap the rune object in another bind.
 */
import { browser } from '$app/environment';
import { registerSession, pendingRestore } from './locale-handoff.svelte';

export type LocaleFree = string | number | boolean | null | LocaleFree[];

/**
 * Widen inferred literal types so `persisted('q', '')` is a `string` rune (not a
 * `''` rune that can't be reassigned) and `persisted('n', 0)` a `number` rune.
 * Union/nullable values can't be inferred from the seed — pass them explicitly,
 * e.g. `persisted<Locale | null>('blog-lang', null)`.
 */
// Non-distributive ([T] extends [string]) on purpose: a bare literal seed widens
// to its base ('' -> string), but an explicit UNION is preserved — distribution
// would widen `Locale | null` to `string | null` (each 'en'|'fr'|'es' literal -> string).
type Widen<T> = [T] extends [string]
	? string
	: [T] extends [number]
		? number
		: [T] extends [boolean]
			? boolean
			: T;

export interface Persisted<T extends LocaleFree> {
	value: T;
}

export function persisted<T extends LocaleFree>(key: string, initial: T): Persisted<Widen<T>> {
	type V = Widen<T>;
	// Seed from an in-flight switch-restore (covers a consumer that mounts during
	// the orchestrator's post-paint await window). For the common synchronous
	// consumer this is undefined at call time and the restore lands via the
	// registered setter once afterNavigate runs.
	const seeded = browser ? (pendingRestore(key) as V | undefined) : undefined;
	let current = $state<V>(seeded !== undefined ? seeded : (initial as unknown as V));

	if (browser) {
		$effect(() => {
			const unregister = registerSession(key, {
				get: () => current,
				set: (value) => {
					current = value as V;
				},
			});
			return unregister;
		});
	}

	return {
		get value() {
			return current;
		},
		set value(next: V) {
			current = next;
		},
	};
}
