// Hero intro replay persistence (go2/w5) — "first visit of the day plays the
// scroll intro; once the visitor scrolls it through, same-day reloads land in
// the completed state" (the pulsing hero dot offers the replay).
//
// SSR guard: every entry point tolerates a missing/throwing localStorage —
// module evaluation never touches `window`, so importing this from code that
// also runs on the server is safe. Reads happen in onMount (browser only).
//
// Day key is the LOCAL calendar day (a visitor's "today", not UTC's): the
// intro re-arms each morning wherever the visitor is.

export const HERO_INTRO_STORAGE_KEY = 'yesid:hero-intro-day';

const DAY_KEY_SHAPE = /^\d{4}-\d{2}-\d{2}$/;

/** Local-timezone YYYY-MM-DD for `now`. */
export function heroIntroDayKey(now: Date = new Date()): string {
	const y = now.getFullYear();
	const m = String(now.getMonth() + 1).padStart(2, '0');
	const d = String(now.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

function safeStorage(): Storage | null {
	if (typeof window === 'undefined') return null;
	try {
		return window.localStorage;
	} catch {
		// Storage access can throw (privacy modes, blocked third-party ctx).
		return null;
	}
}

/** True when the visitor already scrolled the intro through today. */
export function isHeroIntroCompletedToday(now: Date = new Date()): boolean {
	const storage = safeStorage();
	if (!storage) return false;
	try {
		const stored = storage.getItem(HERO_INTRO_STORAGE_KEY);
		return stored !== null && DAY_KEY_SHAPE.test(stored) && stored === heroIntroDayKey(now);
	} catch {
		return false;
	}
}

/** Forget the completion — the intro is "still to do" again. Fired when the
    visitor clicks the replay dot (operator: a refresh after clicking must
    land on the animation, not the collapsed hero). Scrolling the replay
    through to the end re-persists via markHeroIntroCompleted. */
export function forgetHeroIntroCompleted(): void {
	const storage = safeStorage();
	if (!storage) return;
	try {
		storage.removeItem(HERO_INTRO_STORAGE_KEY);
	} catch {
		// Denied — worst case a reload still lands collapsed. Fine.
	}
}

/** Persist "intro completed today". Quietly no-ops when storage is denied. */
export function markHeroIntroCompleted(now: Date = new Date()): void {
	const storage = safeStorage();
	if (!storage) return;
	try {
		storage.setItem(HERO_INTRO_STORAGE_KEY, heroIntroDayKey(now));
	} catch {
		// Quota/denied — the intro will simply replay next load. Fine.
	}
}
