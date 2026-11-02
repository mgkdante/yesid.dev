import type { Service } from '#lib/types.ts';

/** CMS `station` only orders services; the number shown is always the position. */
export function orderServices(services: readonly Service[]): Service[] {
	return [...services].sort((a, b) => a.station - b.station);
}

export function stationNumber(index: number): string {
	return String(index + 1).padStart(2, '0');
}
