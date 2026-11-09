export const READING_LINE = 0.25;

export interface SectionBox {
	top: number;
	bottom: number;
	height: number;
	body?: { top: number; bottom: number; open: boolean };
}

interface DetailPosition {
	kind: 'detail-section';
	index: number;
	count: number;
	progress: number;
	y: number;
	insideBody: boolean;
	bulkExpanded: boolean;
}

export type ReadingPosition = { kind: 'offset'; y: number } | DetailPosition;
export type RestorePlan =
	| { kind: 'native' }
	| { kind: 'stay' }
	| { kind: 'offset'; y: number }
	| { kind: 'section'; index: number; progress: number; reveal: boolean };

export function measurePosition(input: {
	sections: SectionBox[]; viewportHeight: number; y: number; bulkExpanded: boolean;
}): ReadingPosition {
	const { sections, viewportHeight, y, bulkExpanded } = input;
	const line = viewportHeight * READING_LINE;
	const index = sections.findIndex((box) => box.top <= line && box.bottom > line);
	if (index < 0) return { kind: 'offset', y };
	const { top, height, body } = sections[index];
	return {
		kind: 'detail-section', index, count: sections.length,
		progress: (line - top) / height, y,
		insideBody: !!body && body.open && body.top <= line && body.bottom > line,
		bulkExpanded,
	};
}

export function planRestore(
	snapshot: unknown,
	current: { sectionCount: number; bulkExpanded: boolean; canReveal: boolean },
	reason: 'history' | 'locale',
): RestorePlan {
	const saved = snapshot as Partial<DetailPosition> | null;
	const finiteY = typeof saved?.y === 'number' && Number.isFinite(saved.y);
	if (reason === 'history') {
		if (!saved?.insideBody) return { kind: 'native' };
		if (saved.bulkExpanded === true && current.bulkExpanded) {
			return finiteY ? { kind: 'offset', y: Math.max(0, saved.y!) } : { kind: 'stay' };
		}
	}
	// Ordinal mapping is safe only when the translated structure agrees.
	if (saved?.kind === 'detail-section' && saved.count === current.sectionCount &&
		typeof saved.index === 'number' && Number.isInteger(saved.index) &&
		saved.index >= 0 && saved.index < current.sectionCount &&
		typeof saved.progress === 'number' && Number.isFinite(saved.progress)) {
		return {
			kind: 'section', index: saved.index,
			progress: Math.max(0, Math.min(1, saved.progress)),
			reveal: !!saved.insideBody && current.canReveal,
		};
	}
	return { kind: 'offset', y: finiteY ? Math.max(0, saved!.y!) : 0 };
}

export function alignTarget(
	section: { top: number; height: number }, progress: number, scrollY: number, viewportHeight: number,
): number {
	return Math.max(0, scrollY + section.top + section.height * progress - viewportHeight * READING_LINE);
}

