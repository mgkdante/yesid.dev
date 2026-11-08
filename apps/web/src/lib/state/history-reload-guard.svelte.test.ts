import { afterEach, describe, expect, it, vi } from 'vitest';
import { guardHistoryDuringTransitions } from './history-reload-guard';

// SvelteKit's router registers its own popstate listener before the layout mounts.
// That listener moves Kit's history index to the traversal target synchronously, so
// a reload after it would persist the departing page's snapshots over the target's.
describe('history reload guard', () => {
	const disposers: Array<() => void> = [];
	const router = vi.fn();
	afterEach(() => {
		for (const dispose of disposers.splice(0)) dispose();
		window.removeEventListener('popstate', router);
		router.mockClear();
	});

	function install(pending: boolean) {
		window.addEventListener('popstate', router);
		const reload = vi.fn();
		disposers.push(guardHistoryDuringTransitions(window, () => pending, reload));
		return reload;
	}

	it('reloads a traversal during a pending transition before the router sees it', () => {
		const reload = install(true);
		window.dispatchEvent(new PopStateEvent('popstate'));
		expect(reload).toHaveBeenCalledOnce();
		expect(router).not.toHaveBeenCalled();
	});

	it('leaves ordinary traversals to the router', () => {
		const reload = install(false);
		window.dispatchEvent(new PopStateEvent('popstate'));
		expect(reload).not.toHaveBeenCalled();
		expect(router).toHaveBeenCalledOnce();
	});

	it('stops guarding once disposed', () => {
		const reload = install(true);
		disposers.pop()!();
		window.dispatchEvent(new PopStateEvent('popstate'));
		expect(reload).not.toHaveBeenCalled();
		expect(router).toHaveBeenCalledOnce();
	});
});
