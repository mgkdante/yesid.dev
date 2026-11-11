import { measurePosition, type ReadingPosition, type SectionBox } from './reading-position-plan';

type Measurement = Parameters<typeof measurePosition>[0];
function isSection(value: unknown): value is SectionBox {
	if (!value || typeof value !== 'object') return false;
	const box = value as SectionBox;
	return [box.top, box.bottom, box.height].every(Number.isFinite) && box.height > 0 &&
		(!box.body || ([box.body.top, box.body.bottom].every(Number.isFinite) && typeof box.body.open === 'boolean'));
}

/** One native navigation only: never replay stale state on refresh or another page. */
export function takeEarlyLocalePosition(getStorage: () => Pick<Storage, 'getItem' | 'removeItem'>, href: string, now: number): ReadingPosition | null {
	try {
		const storage = getStorage();
		const raw = storage.getItem('yesid:early-locale');
		storage.removeItem('yesid:early-locale');
		if (!raw) return null;
		const saved = JSON.parse(raw) as { v?: unknown; to?: unknown; ts?: unknown; measurement?: Measurement };
		if (saved.v !== 1 || saved.to !== href || typeof saved.ts !== 'number' ||
			!Number.isFinite(saved.ts) || now < saved.ts || now - saved.ts > 120_000) return null;
		const input = saved.measurement;
		if (!input || !Array.isArray(input.sections) || !input.sections.every(isSection) ||
			!Number.isFinite(input.y) || input.y < 0 || !Number.isFinite(input.viewportHeight) ||
			input.viewportHeight <= 0 || typeof input.bulkExpanded !== 'boolean') return null;
		return measurePosition(input);
	} catch { return null; }
}
