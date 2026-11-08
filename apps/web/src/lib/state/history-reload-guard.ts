/**
 * Reloads a history traversal that lands while a view-transition navigation is
 * still pending (#557). SvelteKit skips beforeNavigate during an active
 * navigation, so this listens to the native event.
 *
 * It runs in the capture phase and stops the event so SvelteKit's router never
 * starts the traversal. The router moves its history index to the target entry
 * synchronously, and the reload's beforeunload would then persist the departing
 * page's snapshots over the target's, losing a detail page's reading target.
 */
export function guardHistoryDuringTransitions(
	target: Pick<Window, 'addEventListener' | 'removeEventListener'>,
	isPending: () => boolean,
	reload: () => void = () => location.reload(),
): () => void {
	const onPopState = (event: Event) => {
		if (!isPending()) return;
		event.stopImmediatePropagation();
		reload();
	};
	target.addEventListener('popstate', onPopState, { capture: true });
	return () => target.removeEventListener('popstate', onPopState, { capture: true });
}
