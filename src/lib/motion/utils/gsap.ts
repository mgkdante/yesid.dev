// GSAP plugin registration — ScrollTrigger + SplitText + MorphSVGPlugin eager;
// all other plugins lazy-loaded per consumer via load*().
//
// Eager:
//   - ScrollTrigger  — used site-wide; config applied via initScrollTriggerConfig().
//   - SplitText      — wordmarkHover's action contract runs `new SplitText(...)`
//                       synchronously, so it can't await a dynamic import.
//   - MorphSVGPlugin — morphHelpers.ts calls MorphSVGPlugin.convertToPath() as a
//                       static method; shipped eagerly because it's consumed from
//                       SvgIcon (present on every major route) and HomeServices.
//
// Lazy (per-consumer at mount):
//   /                     -> loadDrawSVG() + loadCustomEase() in HeroBanner,
//                            loadDrawSVG() in DataFlowDiagram/HomeCloser
//   /blog, /projects      -> loadDrawSVG() + loadFlip()
//   /tech-stack           -> loadMotionPathPlugin() + loadDrawSVG() in StackConnections
//   any route with SvgIcon -> loadDrawSVG() + loadMorphSVG() (morph path is lazy
//                            since SvgIcon does its own Promise.all at mount)

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';

let configured = false;
const loadedPlugins = new Set<string>();

/**
 * Register ScrollTrigger and apply its site-wide config. The config
 * ignores viewport height changes < 25% (mobile address bar show/hide)
 * so ScrollTrigger doesn't recalculate pin positions when browser
 * chrome appears/disappears. Compatible with Lenis (unlike normalizeScroll).
 *
 * Idempotent — safe to call from any route/consumer mount. Every consumer
 * that creates a ScrollTrigger must call this first.
 */
export function initScrollTriggerConfig(): void {
	if (configured) return;
	gsap.registerPlugin(ScrollTrigger);
	ScrollTrigger.config({ ignoreMobileResize: true });
	configured = true;
}

/**
 * Sync SplitText registration — for wordmarkHover, whose action contract
 * requires `new SplitText(node, ...)` to run synchronously at mount.
 * Uses the eagerly-imported SplitText symbol (no dynamic import).
 * Idempotent.
 */
export function ensureSplitTextRegistered(): void {
	if (loadedPlugins.has('SplitText')) return;
	gsap.registerPlugin(SplitText);
	loadedPlugins.add('SplitText');
}

// Lazy loaders — idempotent.

export async function loadDrawSVG(): Promise<void> {
	if (loadedPlugins.has('DrawSVG')) return;
	const mod = await import('gsap/DrawSVGPlugin');
	gsap.registerPlugin(mod.DrawSVGPlugin);
	loadedPlugins.add('DrawSVG');
}

export async function loadMorphSVG(): Promise<void> {
	if (loadedPlugins.has('MorphSVG')) return;
	// MorphSVGPlugin is eagerly imported above for morphHelpers' static
	// convertToPath call; register it with gsap for {morphSVG:} tween syntax.
	gsap.registerPlugin(MorphSVGPlugin);
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

export async function loadMotionPathPlugin(): Promise<void> {
	if (loadedPlugins.has('MotionPath')) return;
	const mod = await import('gsap/MotionPathPlugin');
	gsap.registerPlugin(mod.MotionPathPlugin);
	loadedPlugins.add('MotionPath');
}

export async function loadSplitText(): Promise<void> {
	if (loadedPlugins.has('SplitText')) return;
	gsap.registerPlugin(SplitText);
	loadedPlugins.add('SplitText');
}

// Re-export for motion code that needs a direct symbol reference.
// gsap       — every consumer
// ScrollTrigger — scrubs + HeroBanner + SvgIcon (trigger Vars)
// SplitText  — wordmarkHover
// MorphSVGPlugin — morphHelpers.ts (convertToPath static call)
export { gsap, ScrollTrigger, SplitText, MorphSVGPlugin };
