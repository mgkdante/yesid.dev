// Data-driven metro line computation.
// The entire page's stop numbering, rail nodes, and station dividers
// derive from this single source. Adding a service to services.ts
// automatically extends the metro line — zero component changes needed.

import type { LocalizedString } from '$lib/types';
import { resolveLocale } from '$lib/utils/locale';
import { services } from './services.js';

export interface MetroStop {
	readonly id: string;
	readonly label: LocalizedString;
	readonly stopNumber: string; // "00", "01", ..., "TERMINAL"
	readonly type: 'hero' | 'service' | 'featured' | 'about' | 'blog' | 'terminal';
}

function buildMetroLine(): readonly MetroStop[] {
	const stops: MetroStop[] = [];

	// Stop 00: Hero / Departure
	stops.push({
		id: 'departure',
		label: { en: 'Departure' },
		stopNumber: '00',
		type: 'hero'
	});

	// Stops 01–N: Services (auto-numbered from services array)
	for (let i = 0; i < services.length; i++) {
		stops.push({
			id: services[i].id,
			label: services[i].title,
			stopNumber: String(i + 1).padStart(2, '0'),
			type: 'service'
		});
	}

	// Fixed sections after services — numbers auto-increment
	const nextNum = services.length + 1;

	stops.push({
		id: 'featured-work',
		label: { en: 'Featured Work' },
		stopNumber: String(nextNum).padStart(2, '0'),
		type: 'featured'
	});

	stops.push({
		id: 'about',
		label: { en: "Who's Driving" },
		stopNumber: String(nextNum + 1).padStart(2, '0'),
		type: 'about'
	});

	stops.push({
		id: 'blog',
		label: { en: 'Dispatches' },
		stopNumber: String(nextNum + 2).padStart(2, '0'),
		type: 'blog'
	});

	stops.push({
		id: 'terminal',
		label: { en: 'Final Destination' },
		stopNumber: 'TERMINAL',
		type: 'terminal'
	});

	return Object.freeze(stops);
}

export const metroStops = buildMetroLine();
export const TOTAL_STOPS = metroStops.length;

/**
 * Formats a metro stop into its station divider label.
 * e.g. "STOP 05 — FEATURED WORK" or "TERMINAL — FINAL DESTINATION"
 */
export function formatStopLabel(stop: MetroStop, locale: 'en' | 'fr' | 'es' = 'en'): string {
	const name = resolveLocale(stop.label, locale).toUpperCase();
	if (stop.type === 'terminal') return `TERMINAL — ${name}`;
	return `STOP ${stop.stopNumber} — ${name}`;
}

/**
 * Formats the services group divider label.
 * e.g. "STOPS 01–04 — SERVICES"
 */
export function formatServicesLabel(): string {
	const first = '01';
	const last = String(services.length).padStart(2, '0');
	return `STOPS ${first}–${last} — SERVICES`;
}

/**
 * Finds a metro stop by type. Returns the first match.
 */
export function getStopByType(type: MetroStop['type']): MetroStop | undefined {
	return metroStops.find((s) => s.type === type);
}
