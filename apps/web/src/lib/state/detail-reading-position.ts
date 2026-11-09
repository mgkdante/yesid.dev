import { getNavigationCaptureY, lenisAwareScrollTo, registerScrollContext, type ScrollContext } from './locale-handoff.svelte';
import { alignTarget, measurePosition, planRestore, type RestorePlan, type SectionBox } from './reading-position-plan';
import type { SectionJump } from '@yesid/ui/brand';
import { snapshot } from '$app/navigation';
import { onMount } from 'svelte';

interface DetailReadingContext extends ScrollContext {
	dispose(): void;
	restoreHistory(snapshot: unknown): void | Promise<void>;
}

function sectionBox(element: HTMLElement): SectionBox {
	const box = element.getBoundingClientRect();
	const body = element.querySelector<HTMLElement>('[data-slot="collapsible-content"]');
	const bodyBox = body?.getBoundingClientRect();
	return {
		top: box.top, bottom: box.bottom, height: box.height,
		body: body && bodyBox ? { top: bodyBox.top, bottom: bodyBox.bottom, open: !body.hasAttribute('inert') } : undefined,
	};
}

function followLayout(elements: HTMLElement[], align: () => void): () => void {
	if (typeof ResizeObserver === 'undefined') return () => {};
	let active = true;
	const observer = new ResizeObserver(() => { if (active) align(); });
	const inputs = ['wheel', 'touchstart', 'pointerdown', 'keydown'];
	const dispose = () => {
		active = false;
		observer.disconnect();
		for (const event of inputs) window.removeEventListener(event, dispose, true);
	};
	observer.observe(document.body);
	for (const el of elements) observer.observe(el);
	for (const event of inputs) window.addEventListener(event, dispose, { capture: true, passive: true });
	return dispose;
}

interface FollowState {
	stopFollowing(): void;
	request: number;
}

function cancelFollowing(state: FollowState): void {
	state.request++;
	state.stopFollowing();
}

async function apply(
	plan: RestorePlan, elements: HTMLElement[], navigation: Pick<SectionJump, 'jump'> | undefined,
	state: FollowState,
) {
	if (plan.kind === 'native') return;
	const current = state.request;
	if (plan.kind === 'stay') return;
	if (plan.kind === 'offset') { lenisAwareScrollTo(plan.y); return; }
	const target = elements[plan.index];
	if (plan.reveal && navigation) {
		const marked = target.matches('[data-toc]') ? target : target.querySelector<HTMLElement>('[data-toc]');
		const id = target.dataset.sectionIndex !== undefined ? `section-${target.dataset.sectionIndex}` : marked?.dataset.toc || target.id;
		if (id) await navigation.jump(id, { behavior: 'auto' });
		if (current !== state.request) return;
	}
	const align = () => lenisAwareScrollTo(alignTarget(
		target.getBoundingClientRect(), plan.progress, window.scrollY, window.innerHeight,
	));
	align();
	// Follow late font, image and diagram layout only until the reader acts.
	state.stopFollowing = followLayout(elements, align);
}

/** Locale and history restoration reveal the reading target without changing the bulk preference. */
export function detailReadingPosition(selector: string, navigation?: Pick<SectionJump, 'jump'>): DetailReadingContext {
	const state: FollowState = { stopFollowing: () => {}, request: 0 };
	const sections = () => [...document.querySelectorAll<HTMLElement>(selector)]
		.filter((el) => {
			const box = el.getBoundingClientRect();
			return box.height > 0 && box.width > 0;
		});
	const bulkExpanded = () => document.documentElement.dataset.sectionsChoice === 'expanded';
	const dispose = () => cancelFollowing(state);

	const restore = (saved: unknown, reason: 'history' | 'locale') => {
		const current = { sectionCount: 0, bulkExpanded: bulkExpanded(), canReveal: !!navigation };
		if (reason === 'history' && planRestore(saved, current, reason).kind === 'native') return;
		dispose();
		const elements = sections();
		return apply(planRestore(saved, { ...current, sectionCount: elements.length }, reason),
			elements, navigation, state);
	};
	return {
		dispose,
		capture: () => {
			const y = getNavigationCaptureY() ?? window.scrollY;
			return measurePosition({
				sections: sections().map(sectionBox), viewportHeight: window.innerHeight,
				y, bulkExpanded: bulkExpanded(),
			});
		},
		restore: (saved) => restore(saved, 'locale'),
		restoreHistory: (saved) => restore(saved, 'history'),
	};
}

/** Called during initialization. Kit owns the per-history-entry snapshot lifetime. */
export function registerDetailReadingPosition(selector: string, navigation?: Pick<SectionJump, 'jump'>): void {
	const context = detailReadingPosition(selector, navigation);
	snapshot({
		id: 'detail-reading-position',
		capture: context.capture,
		restore: (saved) => {
			// Native history handles ordinary offsets. Only a body reading target
			// needs its collapsed chain revealed before its position can be measured.
			void context.restoreHistory(saved);
		},
	});
	onMount(() => {
		const unregister = registerScrollContext(context);
		return () => { unregister(); context.dispose(); };
	});
}
