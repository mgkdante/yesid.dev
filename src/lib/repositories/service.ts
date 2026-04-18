// Service repository. Thin delegation for service getters PLUS the metro-line
// derivation that used to live in `$lib/content/metro.ts`.
//
// Why metro lives here:
//   The metro line is a yesid.dev-specific projection over the services list —
//   not a CMS concept. Payload/Keystatic own services, not the site's numbered
//   stop system. So derivation stays in repository-land, and the adapter only
//   has to supply `services.visible()`.
//
// Labels preserved exactly from the old content/metro.ts so the rendered site
// is bit-identical to pre-17b-3. Future translations are backfilled into the
// LocalizedString objects; Task 17b-6 may move bookend labels into
// content/nav.ts under `metroBookends` — noted there.

import { adapter } from '$lib/adapters';
import { resolveLocale } from '$lib/utils/locale';
import type { LocalizedString, Locale, Service } from '$lib/types';

export async function getAllServices(): Promise<readonly Service[]> {
	return adapter.services.all();
}

export async function getServiceById(id: string): Promise<Service | undefined> {
	return adapter.services.byId(id);
}

export async function getVisibleServices(): Promise<readonly Service[]> {
	return adapter.services.visible();
}

export async function getAdjacentServices(
	id: string
): Promise<{ prev?: Service; next?: Service }> {
	return adapter.services.adjacent(id);
}

// Metro line derivation — preserved bit-for-bit from the old content/metro.ts.
// Do not alter labels or stop order during 17b; visible user-facing copy is
// out of scope for this slice.

export interface MetroStop {
	readonly id: string;
	readonly label: LocalizedString;
	readonly stopNumber: string; // "00", "01", ..., "TERMINAL"
	readonly type: 'hero' | 'service' | 'featured' | 'about' | 'blog' | 'terminal';
}

export async function getMetroStops(): Promise<readonly MetroStop[]> {
	const services = await adapter.services.all();
	const stops: MetroStop[] = [];

	// Stop 00: Hero / Departure
	stops.push({
		id: 'departure',
		label: { en: 'Departure' },
		stopNumber: '00',
		type: 'hero',
	});

	// Stops 01–N: Services (auto-numbered)
	for (let i = 0; i < services.length; i++) {
		stops.push({
			id: services[i].id,
			label: services[i].title,
			stopNumber: String(i + 1).padStart(2, '0'),
			type: 'service',
		});
	}

	// Fixed sections after services — numbers auto-increment
	const nextNum = services.length + 1;

	stops.push({
		id: 'featured-work',
		label: { en: 'Featured Work' },
		stopNumber: String(nextNum).padStart(2, '0'),
		type: 'featured',
	});

	stops.push({
		id: 'about',
		label: { en: "Who's Driving" },
		stopNumber: String(nextNum + 1).padStart(2, '0'),
		type: 'about',
	});

	stops.push({
		id: 'blog',
		label: { en: 'Dispatches' },
		stopNumber: String(nextNum + 2).padStart(2, '0'),
		type: 'blog',
	});

	stops.push({
		id: 'terminal',
		label: { en: 'Final Destination' },
		stopNumber: 'TERMINAL',
		type: 'terminal',
	});

	return Object.freeze(stops);
}

export async function getTotalStops(): Promise<number> {
	const stops = await getMetroStops();
	return stops.length;
}

export async function getStopByType(
	type: MetroStop['type']
): Promise<MetroStop | undefined> {
	const stops = await getMetroStops();
	return stops.find((s) => s.type === type);
}

/**
 * Formats a metro stop into its station divider label.
 * e.g. "STOP 05 — FEATURED WORK" or "TERMINAL — FINAL DESTINATION"
 */
export function formatStopLabel(stop: MetroStop, locale: Locale = 'en'): string {
	const name = resolveLocale(stop.label, locale).toUpperCase();
	if (stop.type === 'terminal') return `TERMINAL — ${name}`;
	return `STOP ${stop.stopNumber} — ${name}`;
}

/**
 * Formats the services group divider label.
 * e.g. "STOPS 01–04 — SERVICES"
 */
export async function formatServicesLabel(): Promise<string> {
	const services = await adapter.services.all();
	const first = '01';
	const last = String(services.length).padStart(2, '0');
	return `STOPS ${first}–${last} — SERVICES`;
}
