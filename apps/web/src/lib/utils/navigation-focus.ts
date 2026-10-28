import { goto, type GotoOptions } from '$app/navigation';
import { resetFocusAfterNavigation } from '@yesid/ui/brand';

export async function gotoPreservingScroll(url: string | URL, options: Omit<GotoOptions, 'reset'> = {}) {
	const resetFocus = resetFocusAfterNavigation();
	await goto(url, { ...options, reset: false });
	resetFocus();
}
