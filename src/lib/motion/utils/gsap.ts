// GSAP plugin registration.
// Plugins must be registered once before use. Calling registerGsapPlugins() multiple
// times is safe — a flag prevents double-registration. Import gsap-related things from
// here rather than directly from 'gsap' so all consumers share the same registered state.

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { CustomEase } from 'gsap/CustomEase';
import { SplitText } from 'gsap/SplitText';

let registered = false;

export function registerGsapPlugins(): void {
	if (registered) return;
	gsap.registerPlugin(ScrollTrigger, MotionPathPlugin, DrawSVGPlugin, CustomEase, SplitText);
	registered = true;
}

// Re-export for convenience so motion code only needs one import source.
export { gsap, ScrollTrigger, MotionPathPlugin, DrawSVGPlugin, CustomEase, SplitText };
