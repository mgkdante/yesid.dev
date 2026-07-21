import { browser } from '$app/environment';
import { isPrefersReducedMotion } from '@yesid/motion/stores/reducedMotion';
import { isViewportAtMost } from '@yesid/motion/utils/device';
import { loadDrawSVG, loadFlip, initScrollTriggerConfig } from '$lib/motion/utils/gsap.js';
import { createDrawScrub } from '$lib/motion/scrubs/index.js';

export async function startListingBlueprintScrub(
	blueprintWrapEl: HTMLElement | undefined,
	listingSectionEl: HTMLElement | undefined,
): Promise<(() => void) | undefined> {
	if (!browser) return undefined;

	await loadFlip();

	if (isPrefersReducedMotion() || isViewportAtMost(1023)) return undefined;
	if (!blueprintWrapEl || !listingSectionEl) return undefined;

	await loadDrawSVG();
	initScrollTriggerConfig();

	return createDrawScrub(blueprintWrapEl, {
		section: listingSectionEl,
		pathSelector: 'svg path',
	});
}
