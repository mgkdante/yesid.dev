export const CAROUSEL_DRAG_IGNORE_SELECTOR = '[data-carousel-drag-ignore="true"]';

export function shouldCarouselHandleDragTarget(target: EventTarget | null): boolean {
	if (typeof Element === 'undefined' || !(target instanceof Element)) return true;

	return !target.closest(CAROUSEL_DRAG_IGNORE_SELECTOR);
}

export function allowCarouselDrag(_emblaApi: unknown, event: Event): boolean {
	return shouldCarouselHandleDragTarget(event.target);
}
