import { writable, type Readable } from 'svelte/store';

export type HomeIntroPhase = 'pending' | 'running' | 'settled';

export interface HomeIntroStore extends Readable<HomeIntroPhase> {
	begin: () => void;
	settle: () => void;
	reset: () => void;
}

export function createHomeIntroStore(): HomeIntroStore {
	const { subscribe, set } = writable<HomeIntroPhase>('pending');

	return {
		subscribe,
		begin: () => set('running'),
		settle: () => set('settled'),
		reset: () => set('pending'),
	};
}

export const homeIntroStore = createHomeIntroStore();
