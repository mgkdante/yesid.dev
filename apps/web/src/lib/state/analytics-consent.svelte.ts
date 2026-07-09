import { browser } from '$app/environment';
import { writable, type Readable } from 'svelte/store';

export const ANALYTICS_CONSENT_KEY = 'yesid:analytics-consent:v1';

export type AnalyticsConsentChoice = 'unknown' | 'granted' | 'denied';
type DurableAnalyticsConsentChoice = Exclude<AnalyticsConsentChoice, 'unknown'>;

export interface AnalyticsConsentState {
	choice: AnalyticsConsentChoice;
	ready: boolean;
	available: boolean;
}

export interface AnalyticsConsentDependencies {
	hostname: () => string;
	read: () => string | null;
	write: (value: DurableAnalyticsConsentChoice) => void;
	remove: () => void;
	reload: () => void;
}

export interface AnalyticsConsentStore extends Readable<AnalyticsConsentState> {
	init: () => () => void;
	grant: () => void;
	deny: () => void;
	openPreferences: () => void;
}

const INITIAL_STATE: AnalyticsConsentState = {
	choice: 'unknown',
	ready: false,
	available: false,
};

function isDurableChoice(value: string | null): value is DurableAnalyticsConsentChoice {
	return value === 'granted' || value === 'denied';
}

export function createAnalyticsConsentStore(
	dependencies: AnalyticsConsentDependencies,
): AnalyticsConsentStore {
	const { subscribe, set } = writable<AnalyticsConsentState>(INITIAL_STATE);
	let current = INITIAL_STATE;

	function commit(next: AnalyticsConsentState): void {
		current = next;
		set(next);
	}

	function choose(choice: DurableAnalyticsConsentChoice): void {
		try {
			dependencies.write(choice);
		} catch {
			// The page may keep the choice in memory, but the next load must read storage again.
		}
		commit({ ...current, choice });
	}

	return {
		subscribe,
		init(): () => void {
			const available = dependencies.hostname() === 'yesid.dev';
			if (!available) {
				commit({ choice: 'unknown', ready: true, available: false });
				return () => {};
			}

			let stored: string | null = null;
			try {
				stored = dependencies.read();
			} catch {
				stored = null;
			}
			commit({
				choice: isDurableChoice(stored) ? stored : 'unknown',
				ready: true,
				available: true,
			});
			return () => {};
		},
		grant(): void {
			choose('granted');
		},
		deny(): void {
			choose('denied');
		},
		openPreferences(): void {
			const previousChoice = current.choice;
			let durablyRevoked = false;
			try {
				dependencies.remove();
				durablyRevoked = true;
			} catch {
				try {
					dependencies.write('denied');
					durablyRevoked = true;
				} catch {
					// Keep unknown in memory and avoid reloading a grant that may have survived.
				}
			}
			commit({ ...current, choice: 'unknown' });
			if (previousChoice === 'granted' && durablyRevoked) {
				try {
					dependencies.reload();
				} catch {
					// Reload can be unavailable in embedded browsers; unknown remains in memory.
				}
			}
		},
	};
}

export const analyticsConsentStore = createAnalyticsConsentStore({
	hostname: () => (browser ? window.location.hostname : ''),
	read: () => (browser ? window.localStorage.getItem(ANALYTICS_CONSENT_KEY) : null),
	write: (value) => {
		if (browser) window.localStorage.setItem(ANALYTICS_CONSENT_KEY, value);
	},
	remove: () => {
		if (browser) window.localStorage.removeItem(ANALYTICS_CONSENT_KEY);
	},
	reload: () => {
		if (browser) window.location.reload();
	},
});
