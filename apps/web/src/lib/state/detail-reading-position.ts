import { lenisAwareScrollTo, registerScrollContext, type ScrollContext } from './locale-handoff.svelte';
import type { SectionJump } from '@yesid/ui/brand';
import { snapshot } from '$app/navigation';
import { onMount } from 'svelte';

interface DetailPosition {
	kind: 'detail-section';
	index: number;
	count: number;
	progress: number;
	y: number;
	insideBody: boolean;
}

// Match the detail TOC's reading line, but measure geometry rather than its
// asynchronously updated active ID. Blog heading slugs change with the locale.
const READING_LINE = 0.25;

/** Locale and history restoration reveal the reading target without changing the bulk preference. */
export function detailReadingPosition(selector: string, navigation?: Pick<SectionJump, 'jump'>): ScrollContext & { dispose(): void } {
	let dispose = () => {};
	let request = 0;
	const sections = () => [...document.querySelectorAll<HTMLElement>(selector)]
		.filter((el) => {
			const box = el.getBoundingClientRect();
			return box.height > 0 && box.width > 0;
		});

	return {
		dispose: () => { request++; dispose(); },
		capture() {
			const elements = sections();
			const line = window.innerHeight * READING_LINE;
			const index = elements.findIndex((el) => {
				const box = el.getBoundingClientRect();
				return box.top <= line && box.bottom > line;
			});
			if (index < 0) return { kind: 'offset', y: window.scrollY };
			const box = elements[index].getBoundingClientRect();
			const body = elements[index].querySelector<HTMLElement>('[data-slot="collapsible-content"]');
			const bodyBox = body?.getBoundingClientRect();
			return {
				kind: 'detail-section', index, count: elements.length,
				progress: (line - box.top) / box.height, y: window.scrollY,
				insideBody: !!bodyBox && !body?.hasAttribute('inert') && bodyBox.top <= line && bodyBox.bottom > line,
			} satisfies DetailPosition;
		},
		async restore(snapshot) {
			dispose();
			const current = ++request;
			const saved = snapshot as Partial<DetailPosition> | null;
			const elements = sections();
			let y = typeof saved?.y === 'number' && Number.isFinite(saved.y) ? saved.y : 0;
			// Ordinal mapping is safe only when the translated structure agrees.
			if (saved?.kind === 'detail-section' && saved.count === elements.length &&
				typeof saved.index === 'number' && Number.isInteger(saved.index) &&
				typeof saved.progress === 'number' && Number.isFinite(saved.progress)) {
				const target = elements[saved.index];
				if (target) {
					if (saved.insideBody && navigation) {
						const marked = target.matches('[data-toc]') ? target : target.querySelector<HTMLElement>('[data-toc]');
						const id = target.dataset.sectionIndex !== undefined ? `section-${target.dataset.sectionIndex}` : marked?.dataset.toc || target.id;
						if (id) await navigation.jump(id, { behavior: 'auto' });
						if (current !== request) return;
					}
					const progress = Math.max(0, Math.min(1, saved.progress));
					const align = () => {
						const box = target.getBoundingClientRect();
						lenisAwareScrollTo(Math.max(0, window.scrollY + box.top + box.height * progress
							- window.innerHeight * READING_LINE));
					};
					align();
					// Fonts, images and asynchronous diagrams can resize after the two
					// navigation frames. Follow that layout only until the reader acts.
					if (typeof ResizeObserver !== 'undefined') {
						let active = true;
						const observer = new ResizeObserver(() => { if (active) align(); });
						const inputs = ['wheel', 'touchstart', 'pointerdown', 'keydown'];
						dispose = () => {
							active = false;
							observer.disconnect();
							for (const event of inputs) window.removeEventListener(event, dispose, true);
						};
						observer.observe(document.body);
						for (const el of elements) observer.observe(el);
						for (const event of inputs) window.addEventListener(event, dispose, { capture: true, passive: true });
					}
					return;
				}
			}
			lenisAwareScrollTo(Math.max(0, y));
		},
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
			if ((saved as Partial<DetailPosition> | null)?.insideBody) void context.restore(saved);
		},
	});
	onMount(() => {
		const unregister = registerScrollContext(context);
		return () => { unregister(); context.dispose(); };
	});
}
