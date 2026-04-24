<!--
  SVG connection overlay for the Control Room diagram.
  Draws cubic bezier paths between connected tech nodes, positioned
  over the CSS Grid layout. Animates entrance with DrawSVG + MotionPath.
  Desktop only — rendered inside the lg:block container.
-->
<script lang="ts">
	import { onMount, tick, onDestroy } from 'svelte';
	import type { TechStackItem } from '$lib/types';
	import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';
	import {
		initScrollTriggerConfig,
		loadMotionPathPlugin,
		loadDrawSVG,
		gsap,
	} from '$lib/motion/utils/gsap.js';

	let {
		items,
		containerEl,
		highlightedIds = null,
		filteredIds = null,
	}: {
		items: readonly TechStackItem[];
		containerEl: HTMLElement | null;
		highlightedIds?: Set<string> | null;
		filteredIds?: Set<string> | null;
	} = $props();

	let svgEl: SVGSVGElement;

	interface PathData {
		id: string;
		d: string;
		sourceId: string;
		targetId: string;
	}

	let paths = $state<ReadonlyArray<PathData>>([]);

	// Animation cleanup refs
	let masterTl: gsap.core.Timeline | null = null;
	let dotTweens: gsap.core.Tween[] = [];
	let observer: ResizeObserver | null = null;
	let resizeTimer: ReturnType<typeof setTimeout>;

	// Deduplicated connections — one path per unique pair
	const connections = $derived.by(() => {
		const seen = new Set<string>();
		const result: Array<{ source: string; target: string }> = [];
		const ids = new Set(items.map((i) => i.id));

		for (const item of items) {
			for (const tid of item.connectsTo) {
				if (!ids.has(tid)) continue;
				const key = [item.id, tid].sort().join('--');
				if (seen.has(key)) continue;
				seen.add(key);
				result.push({ source: item.id, target: tid });
			}
		}

		return result;
	});

	/** Get pixel center of a node relative to the container. */
	function nodeCenter(id: string): { x: number; y: number } | null {
		if (!containerEl) return null;
		const el = containerEl.querySelector<HTMLElement>(
			`[data-testid="stack-node-${id}"]`,
		);
		if (!el || el.offsetParent === null) return null;

		const cr = containerEl.getBoundingClientRect();
		const nr = el.getBoundingClientRect();

		return {
			x: nr.left + nr.width / 2 - cr.left,
			y: nr.top + nr.height / 2 - cr.top,
		};
	}

	/** Build a cubic bezier curve between two points. */
	function buildCurve(
		s: { x: number; y: number },
		t: { x: number; y: number },
	): string {
		const dy = Math.abs(t.y - s.y);

		if (dy < 10) {
			// Same row — gentle arc above
			const arc = Math.abs(t.x - s.x) * 0.3;
			const dx = t.x - s.x;
			return [
				`M${s.x},${s.y}`,
				`C${s.x + dx * 0.3},${s.y - arc}`,
				`${s.x + dx * 0.7},${t.y - arc}`,
				`${t.x},${t.y}`,
			].join(' ');
		}

		// Cross-layer — smooth S-curve through midpoint
		const my = (s.y + t.y) / 2;
		return `M${s.x},${s.y} C${s.x},${my} ${t.x},${my} ${t.x},${t.y}`;
	}

	/** Recalculate all path positions from current DOM layout. */
	function recalculate(): void {
		if (!containerEl) return;

		paths = connections
			.map((c, i) => {
				const sp = nodeCenter(c.source);
				const tp = nodeCenter(c.target);
				if (!sp || !tp) return null;
				return {
					id: String(i),
					d: buildCurve(sp, tp),
					sourceId: c.source,
					targetId: c.target,
				};
			})
			.filter((p): p is NonNullable<typeof p> => p !== null);
	}

	/** Determine if a connection path is completely outside the active filter (hide entirely). */
	function isPathHidden(path: PathData): boolean {
		if (!filteredIds) return false;
		return !filteredIds.has(path.sourceId) || !filteredIds.has(path.targetId);
	}

	/** Determine if a connection path should be highlighted. */
	function isPathHighlighted(path: PathData): boolean {
		if (!highlightedIds) return false;
		return highlightedIds.has(path.sourceId) && highlightedIds.has(path.targetId);
	}

	/** Determine if a connection path should be dimmed (not highlighted when some are). */
	function isPathDimmed(path: PathData): boolean {
		if (!highlightedIds) return false;
		return !isPathHighlighted(path);
	}

	function killAnimations(): void {
		masterTl?.kill();
		masterTl = null;
		dotTweens.forEach((t) => t.kill());
		dotTweens = [];
	}

	/** Start continuous MotionPath dot animations along each path.
	 *  Precondition: loadMotionPathPlugin() + initScrollTriggerConfig() already
	 *  awaited in onMount — both plugins are registered by the time this runs. */
	function startDots(): void {
		if (!svgEl) return;

		const dots = svgEl.querySelectorAll<SVGCircleElement>('.data-dot');
		const pEls = svgEl.querySelectorAll<SVGPathElement>('.connection-path');

		dots.forEach((dot, i) => {
			const pathEl = pEls[i];
			if (!pathEl) return;

			// Don't set opacity here — dot is at SVG origin (0,0) until
			// MotionPath positions it. Show only after first render.
			let shown = false;
			const tw = gsap.to(dot, {
				motionPath: {
					path: pathEl,
					align: pathEl,
					alignOrigin: [0.5, 0.5],
				},
				duration: 5 + Math.random() * 3,
				repeat: -1,
				ease: 'none',
				delay: i * 0.06,
				onUpdate() {
					if (!shown) {
						shown = true;
						gsap.set(dot, { opacity: 0.85 });
					}
				},
			});
			dotTweens.push(tw);
		});
	}

	/** Entrance timeline: DrawSVG paths → data dots.
	 *  Tier rows are static (no entrance animation).
	 *  Precondition: plugins preloaded in onMount. */
	async function animate(): Promise<void> {
		if (!containerEl || !svgEl) return;

		const tl = gsap.timeline({
			scrollTrigger: {
				trigger: containerEl,
				start: 'top 80%',
				once: true,
			},
		});
		masterTl = tl;

		// SVG starts hidden until scroll trigger fires
		gsap.set(svgEl, { opacity: 0 });

		// 1. DrawSVG connection paths
		const pEls = svgEl.querySelectorAll<SVGPathElement>('.connection-path');
		if (pEls.length > 0) {
			tl.to(svgEl, { opacity: 1, duration: 0.15 });
			tl.from(
				pEls,
				{
					drawSVG: '0%',
					duration: 0.6,
					stagger: 0.04,
					ease: 'power1.inOut',
				},
				'<',
			);
		}

		// 2. Data packet dots start flowing after draw completes
		tl.call(() => startDots());
	}

	/** Debounced resize: recalculate paths, restart dots. */
	function handleResize(): void {
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout(async () => {
			// Kill only dot animations (entrance already played)
			dotTweens.forEach((t) => t.kill());
			dotTweens = [];

			recalculate();
			await tick();

			if (!isPrefersReducedMotion()) {
				startDots();
			}
		}, 150);
	}

	onMount(async () => {
		// Preload plugins: MotionPath for the dot-along-path animation,
		// DrawSVG for the connection-path stroke reveals inside animate().
		// ScrollTrigger config must also be set before the entrance timeline.
		await Promise.all([loadMotionPathPlugin(), loadDrawSVG()]);
		initScrollTriggerConfig();

		await tick();
		recalculate();
		await tick(); // Wait for SVG paths to render

		if (!isPrefersReducedMotion()) {
			await animate();
		}

		// Resize observer for both motion modes (paths need recalculation)
		if (containerEl) {
			observer = new ResizeObserver(handleResize);
			observer.observe(containerEl);
		}
	});

	onDestroy(() => {
		killAnimations();
		observer?.disconnect();
		clearTimeout(resizeTimer);
	});
</script>

<svg bind:this={svgEl} class="connections-svg" aria-hidden="true">
	{#each paths as path (path.id)}
		<path
			class="connection-path"
			class:path-hidden={isPathHidden(path)}
			class:path-highlighted={isPathHighlighted(path)}
			class:path-dimmed={isPathDimmed(path)}
			d={path.d}
			fill="none"
		/>
	{/each}

	{#each paths as path (path.id)}
		<circle
			class="data-dot"
			class:dot-hidden={isPathHidden(path)}
			class:dot-dimmed={isPathDimmed(path)}
			r="3"
		/>
	{/each}
</svg>

<style>
	.connections-svg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: var(--z-content);
		overflow: visible;
	}

	.connection-path {
		stroke: color-mix(in srgb, var(--primary) 25%, transparent);
		stroke-width: 1.5;
		transition: stroke var(--duration-slow) var(--ease-default), stroke-width var(--duration-slow) var(--ease-default), opacity var(--duration-slow) var(--ease-default);
	}

	.connection-path.path-highlighted {
		stroke: var(--primary);
		stroke-width: 2;
	}

	.connection-path.path-hidden {
		opacity: 0;
	}

	.connection-path.path-dimmed {
		stroke: color-mix(in srgb, var(--primary) 8%, transparent);
	}

	.data-dot {
		fill: var(--accent);
		opacity: 0;
		transition: opacity var(--duration-slow) var(--ease-default);
	}

	.data-dot.dot-hidden {
		opacity: 0 !important;
	}

	.data-dot.dot-dimmed {
		opacity: 0 !important;
	}

	@media (prefers-reduced-motion: reduce) {
		.connection-path {
			stroke-dasharray: 4 4;
			stroke: color-mix(in srgb, var(--muted-foreground) 30%, transparent);
		}

		.data-dot {
			display: none;
		}
	}
</style>
