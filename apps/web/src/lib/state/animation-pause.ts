import { writable } from 'svelte/store';

const key = 'yesid-animation-paused';
export const animationPaused = writable(false);

export function restoreAnimationPause(): void {
 try { animationPaused.set(sessionStorage.getItem(key) === 'true'); } catch { /* Storage can be unavailable. */ }
}

export function setAnimationPaused(paused: boolean): void {
 animationPaused.set(paused);
 try { sessionStorage.setItem(key, String(paused)); } catch { /* Keep the in-memory choice. */ }
}
