import { getNavigationCaptureY, lenisAwareScrollTo, registerScrollContext, type ScrollContext } from './locale-handoff.svelte';
import type { SectionBox } from './reading-position-plan';
import { createDetailReading, type ReadingSection } from './detail-reading';
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

function revealId(target: HTMLElement): string | undefined {
	const marked = target.matches('[data-toc]') ? target : target.querySelector<HTMLElement>('[data-toc]');
	return target.dataset.sectionIndex !== undefined
		? `section-${target.dataset.sectionIndex}` : marked?.dataset.toc || target.id;
}

/** Browser ports retain each selected element while measuring its current layout. */
export function detailReadingPosition(selector: string, navigation?: Pick<SectionJump, 'jump'>): DetailReadingContext {
	const elements = new WeakMap<ReadingSection, HTMLElement>();
	return createDetailReading({
		sections: () => [...document.querySelectorAll<HTMLElement>(selector)]
			.filter((el) => {
				const box = el.getBoundingClientRect();
				return box.height > 0 && box.width > 0;
			}).map((el) => {
				const section: ReadingSection = {
					get box() { return sectionBox(el); },
					get revealId() { return revealId(el); },
				};
				elements.set(section, el);
				return section;
			}),
		viewportHeight: () => window.innerHeight,
		scrollY: () => window.scrollY,
		scrollTo: lenisAwareScrollTo,
		departureY: getNavigationCaptureY,
		bulkExpanded: () => document.documentElement.dataset.sectionsChoice === 'expanded',
		jump: navigation ? (id) => navigation.jump(id, { behavior: 'auto' }) : undefined,
		follow: (targets, align) => followLayout(targets.map((target) => elements.get(target)!), align),
	});
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
