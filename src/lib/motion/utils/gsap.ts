// GSAP plugin registration — ScrollTrigger eager; all other plugins lazy.
//
// 17e-5 (D269) completes the migration: registerGsapPlugins() becomes
// initScrollTriggerConfig() — a thin function whose only side-effect is
// ScrollTrigger.config({ ignoreMobileResize: true }). Plugins are loaded
// per-consumer via load*() at mount.
//
// During the migration window (this commit): both APIs exist so consumers
// can move one at a time without breakage. registerGsapPlugins() is a
// deprecated thin wrapper that calls initScrollTriggerConfig() then
// registers every plugin eagerly for backward compatibility. The final
// D269 commit deletes registerGsapPlugins + the eager imports (except
// ScrollTrigger and SplitText — SplitText stays eager until wordmarkHover's
// sync-action shape can be refactored).
//
// Route expectations AFTER full migration:
//   /                     -> loadDrawSVG() + loadCustomEase() at route setup
//   /blog, /projects,     -> loadMorphSVG() on first hover,
//   /services                loadFlip() on first filter change
//   /tech-stack              loadMotionPathPlugin() at StackConnections mount
//   Other routes          -> nothing beyond ScrollTrigger (always eager)

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'; // consumed by StackConnections tech-stack dots
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { CustomEase } from 'gsap/CustomEase';
// SplitText stays eager: wordmarkHover's `new SplitText(node, ...)` sync-coupling
// blocks async migration. Revisit when the action contract supports async init.
import { SplitText } from 'gsap/SplitText';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
// @ts-ignore — Windows casing conflict between gsap/types/flip.d.ts and gsap/Flip.js
import { Flip } from 'gsap/Flip';

let configured = false;
let registered = false;
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
 * @deprecated Use `initScrollTriggerConfig()` plus the appropriate
 * `loadX()` lazy loaders at consumer mount. Kept during the D269
 * migration window so in-flight consumers don't break; removed in the
 * closing D269 commit once every caller has moved to the lazy path.
 */
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
	ScrollTrigger.config({ ignoreMobileResize: true });
	configured = true;
	registered = true;
	// Mark all eagerly-registered plugins so lazy loaders no-op.
	['DrawSVG', 'MorphSVG', 'Flip', 'CustomEase', 'MotionPath', 'SplitText'].forEach(
		(p) => loadedPlugins.add(p),
	);
}

// Lazy loaders — idempotent, safe to call even if registerGsapPlugins()
// already loaded the plugin eagerly.

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

export async function loadMotionPathPlugin(): Promise<void> {
	if (loadedPlugins.has('MotionPath')) return;
	const mod = await import('gsap/MotionPathPlugin');
	gsap.registerPlugin(mod.MotionPathPlugin);
	loadedPlugins.add('MotionPath');
}

export async function loadSplitText(): Promise<void> {
	if (loadedPlugins.has('SplitText')) return;
	const mod = await import('gsap/SplitText');
	gsap.registerPlugin(mod.SplitText);
	loadedPlugins.add('SplitText');
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
