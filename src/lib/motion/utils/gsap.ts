// GSAP plugin registration — hybrid eager + lazy.
//
// 17e-1 scope: all existing plugins remain eagerly registered via
// registerGsapPlugins() so no consumer breaks. Lazy loaders are added
// alongside as the migration path. Subsequent sub-slices migrate
// consumers, then 17e-6 closing removes the eager imports that are
// no longer referenced.
//
// Route expectations AFTER consumer migration (not this PR):
//   /                     -> loadDrawSVG() + loadCustomEase() at route setup
//   /blog, /projects,     -> loadMorphSVG() on first hover,
//   /services, /tech-stack   loadFlip() on first filter change
//   Other routes          -> nothing beyond ScrollTrigger

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'; // consumed by StackConnections tech-stack dots
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { CustomEase } from 'gsap/CustomEase';
import { SplitText } from 'gsap/SplitText'; // DELETE in 17e-3 (crescendo replaces char-stagger)
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
// @ts-ignore — Windows casing conflict between gsap/types/flip.d.ts and gsap/Flip.js
import { Flip } from 'gsap/Flip';

let registered = false;
const loadedPlugins = new Set<string>();

export function registerGsapPlugins(): void {
	if (registered) return;
	gsap.registerPlugin(
		ScrollTrigger,
		MotionPathPlugin,
		DrawSVGPlugin,
		CustomEase,
		SplitText,
		MorphSVGPlugin,
		Flip,
	);
	// Ignore viewport height changes < 25% (mobile address bar show/hide).
	// Prevents ScrollTrigger from recalculating pin positions when browser
	// chrome appears/disappears. Compatible with Lenis (unlike normalizeScroll).
	ScrollTrigger.config({ ignoreMobileResize: true });
	registered = true;
	// Mark all eagerly-registered plugins so lazy loaders no-op.
	['DrawSVG', 'MorphSVG', 'Flip', 'CustomEase'].forEach((p) => loadedPlugins.add(p));
}

// Lazy loaders — idempotent, safe to call even if registerGsapPlugins()
// already loaded the plugin eagerly. Subsequent sub-slices will remove
// the eager import above and rely solely on these.

export async function loadDrawSVG(): Promise<void> {
	if (loadedPlugins.has('DrawSVG')) return;
	const mod = await import('gsap/DrawSVGPlugin');
	gsap.registerPlugin(mod.DrawSVGPlugin);
	loadedPlugins.add('DrawSVG');
}

export async function loadMorphSVG(): Promise<void> {
	if (loadedPlugins.has('MorphSVG')) return;
	const mod = await import('gsap/MorphSVGPlugin');
	gsap.registerPlugin(mod.MorphSVGPlugin);
	loadedPlugins.add('MorphSVG');
}

export async function loadFlip(): Promise<void> {
	if (loadedPlugins.has('Flip')) return;
	// @ts-ignore — Windows casing conflict
	const mod = await import('gsap/Flip');
	gsap.registerPlugin(mod.Flip);
	loadedPlugins.add('Flip');
}

export async function loadCustomEase(): Promise<void> {
	if (loadedPlugins.has('CustomEase')) return;
	const mod = await import('gsap/CustomEase');
	gsap.registerPlugin(mod.CustomEase);
	loadedPlugins.add('CustomEase');
}

// Re-export so motion code only needs one import source.
export {
	gsap,
	ScrollTrigger,
	MotionPathPlugin,
	DrawSVGPlugin,
	CustomEase,
	SplitText,
	MorphSVGPlugin,
	Flip,
};
