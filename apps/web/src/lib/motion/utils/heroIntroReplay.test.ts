import { describe, it, expect, beforeEach } from 'vitest';
import {
	forgetHeroIntroCompleted,
	heroIntroDayKey,
	isHeroIntroCompletedToday,
	markHeroIntroCompleted,
	HERO_INTRO_STORAGE_KEY,
} from './heroIntroReplay.js';

describe('motion/utils/heroIntroReplay — day-key math', () => {
	it('formats the LOCAL calendar day as YYYY-MM-DD', () => {
		expect(heroIntroDayKey(new Date(2026, 5, 12, 14, 30))).toBe('2026-06-12');
	});

	it('zero-pads month and day', () => {
		expect(heroIntroDayKey(new Date(2026, 0, 3))).toBe('2026-01-03');
	});

	it('uses the local day even just before midnight (first visit of the DAY)', () => {
		expect(heroIntroDayKey(new Date(2026, 5, 12, 23, 59, 59))).toBe('2026-06-12');
		expect(heroIntroDayKey(new Date(2026, 5, 13, 0, 0, 1))).toBe('2026-06-13');
	});
});

describe('motion/utils/heroIntroReplay — storage round-trip', () => {
	beforeEach(() => {
		window.localStorage.clear();
	});

	it('is not completed before anything is stored', () => {
		expect(isHeroIntroCompletedToday()).toBe(false);
	});

	it('mark → completed for the same day', () => {
		const now = new Date(2026, 5, 12, 9, 0);
		markHeroIntroCompleted(now);
		expect(isHeroIntroCompletedToday(now)).toBe(true);
		expect(window.localStorage.getItem(HERO_INTRO_STORAGE_KEY)).toBe('2026-06-12');
	});

	it('yesterday\'s completion does NOT skip today (intro replays each day)', () => {
		markHeroIntroCompleted(new Date(2026, 5, 11, 22, 0));
		expect(isHeroIntroCompletedToday(new Date(2026, 5, 12, 8, 0))).toBe(false);
	});

	it('forget() makes the intro "still to do" again (replay-dot click)', () => {
		const now = new Date(2026, 5, 12, 9, 0);
		markHeroIntroCompleted(now);
		expect(isHeroIntroCompletedToday(now)).toBe(true);
		forgetHeroIntroCompleted();
		expect(isHeroIntroCompletedToday(now)).toBe(false);
		expect(window.localStorage.getItem(HERO_INTRO_STORAGE_KEY)).toBeNull();
	});

	it('a corrupt stored value reads as not completed', () => {
		window.localStorage.setItem(HERO_INTRO_STORAGE_KEY, 'garbage');
		expect(isHeroIntroCompletedToday()).toBe(false);
	});

	it('survives a throwing storage (Safari private mode) without throwing', () => {
		const original = Object.getOwnPropertyDescriptor(window, 'localStorage')!;
		Object.defineProperty(window, 'localStorage', {
			configurable: true,
			get() {
				throw new Error('denied');
			},
		});
		try {
			expect(() => markHeroIntroCompleted()).not.toThrow();
			expect(isHeroIntroCompletedToday()).toBe(false);
		} finally {
			Object.defineProperty(window, 'localStorage', original);
		}
	});
});
