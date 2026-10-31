const glyphs: Record<string, { d: string; width: number; end: [number, number] }> = {
	c: { d: 'M10 6 C0 0 -2 19 10 15', width: 11, end: [10, 15] },
	l: { d: 'M6 0 4 15', width: 8, end: [4, 15] },
	i: { d: 'M6 1 6.1 .5 M5 6 4 15', width: 8, end: [4, 15] },
	k: { d: 'M5 0 3 15 M4 9 11 5 M5 10 11 16', width: 12, end: [11, 16] },
	m: { d: 'M1 15 3 5 2 9 Q10 -2 9 15 M9 8 Q17 -2 16 15', width: 18, end: [16, 15] },
	e: { d: 'M2 10 Q14 9 9 5 C2 1 -3 19 10 15', width: 11, end: [10, 15] },
	q: { d: 'M10 6 C2 1 -3 18 7 15 L11 5 8 23', width: 12, end: [8, 23] },
	u: { d: 'M2 5 C-2 20 9 20 11 5 L9 16', width: 12, end: [9, 16] },
	h: { d: 'M4 0 1 15 M2 10 Q12 0 10 15', width: 12, end: [10, 15] },
	t: { d: 'M6 0 4 13 Q4 18 10 14 M1 6 11 5', width: 12, end: [10, 14] },
	n: { d: 'M1 15 3 5 2 10 Q12 -2 10 15', width: 12, end: [10, 15] },
	d: { d: 'M10 6 C2 0 -3 18 6 15 L12 0 9 16', width: 13, end: [9, 16] },
	f: { d: 'M3 20 6 3 Q8 -3 12 1 M1 8 11 6', width: 12, end: [11, 6] },
	a: { d: 'M9 6 C2 0 -4 17 5 15 L10 5 8 16', width: 12, end: [8, 16] },
	z: { d: 'M1 6 11 5 0 16 11 15', width: 12, end: [11, 15] },
};
export const CLICK_ME = { en: 'click me', fr: 'clique ici', es: 'haz clic' } as const;
export function getLettering(label: string) {
	let width = 0;
	let end = { x: 0, y: 0 };
	const letters = [...label].flatMap((letter, index) => {
		if (letter === ' ') { width += 7; return []; }
		// Keep unexpected content visible as a replacement glyph instead of crashing or dropping it.
		const glyph = glyphs[letter.toLowerCase()] ?? { d: 'M1 0 11 0 11 16 1 16 Z M2 1 10 15 M10 1 2 15', width: 13, end: [11, 16] };
		const path = { d: glyph.d, x: width, y: 0, index };
		end = { x: width + glyph.end[0], y: glyph.end[1] };
		width += glyph.width;
		return [path];
	});
	const scale = 0.85;
	const tilt = -6;
	const angle = tilt * Math.PI / 180;
	const endX = end.x * scale;
	const endY = (end.y - 16) * scale;
	return { label, letters, width: width * scale, scale, tilt,
		end: { x: endX * Math.cos(angle) - endY * Math.sin(angle), y: endX * Math.sin(angle) + endY * Math.cos(angle) } };
}
