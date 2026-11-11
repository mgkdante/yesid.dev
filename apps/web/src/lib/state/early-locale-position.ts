import { measurePosition, type ReadingPosition, type SectionBox } from './reading-position-plan';

type Measurement = Parameters<typeof measurePosition>[0];
function isSection(value: unknown): value is SectionBox {
	if (!value || typeof value !== 'object') return false;
	const box = value as SectionBox;
	return [box.top, box.bottom, box.height].every(Number.isFinite) && box.height > 0 &&
		(!box.body || ([box.body.top, box.body.bottom].every(Number.isFinite) && typeof box.body.open === 'boolean'));
}

type EarlyCapture = { v?: unknown; from?: unknown; to?: unknown; ts?: unknown; measurement?: Measurement };

/** Only the destination consumes a valid handoff; late source hydration leaves it intact. */
export function takeEarlyLocalePosition(getStorage: () => Pick<Storage, 'getItem' | 'removeItem'>, href: string, now: number): ReadingPosition | null {
	try {
		const storage = getStorage();
		const raw = storage.getItem('yesid:early-locale');
		if (!raw) return null;
		const discard = () => { storage.removeItem('yesid:early-locale'); return null; };
		let saved: EarlyCapture | null;
		try { saved = JSON.parse(raw) as EarlyCapture | null; }
		catch { return discard(); }
		if (!saved || saved.v !== 1 || typeof saved.to !== 'string' || typeof saved.ts !== 'number' ||
			!Number.isFinite(saved.ts) || now < saved.ts || now - saved.ts > 120_000) return discard();
		const input = saved.measurement;
		if (!input || !Array.isArray(input.sections) || !input.sections.every(isSection) ||
			!Number.isFinite(input.y) || input.y < 0 || !Number.isFinite(input.viewportHeight) ||
			input.viewportHeight <= 0 || typeof input.bulkExpanded !== 'boolean') return discard();
		if (saved.to !== href) return saved.from === href ? null : discard();
		storage.removeItem('yesid:early-locale');
		return measurePosition(input);
	} catch { return null; }
}

/** A later client-side navigation supersedes an abandoned native departure. */
export function clearEarlyLocalePosition(getStorage: () => Pick<Storage, 'removeItem'>): void {
	try { getStorage().removeItem('yesid:early-locale'); }
	catch { /* Storage restrictions must not interrupt navigation. */ }
}
