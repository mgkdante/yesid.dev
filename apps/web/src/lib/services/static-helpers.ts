import { isEntityAvailable, type AvailabilityOptions } from '#lib/utils/content-availability.ts';
import type { Locale, Service } from '#lib/types.ts';
import { services } from '#lib/content/services.ts';
import { orderServices } from '#lib/utils/station.ts';

export function getServiceById(id: string): Service | undefined {
	return services.find((service) => service.id === id);
}

export function getVisibleServices(locale: Locale = 'en', options: AvailabilityOptions = {}): readonly Service[] {
	return services.filter((service) => isEntityAvailable({ kind: 'service', entity: service }, locale, options));
}

export function getAdjacentServices(id: string, locale: Locale = 'en', options: AvailabilityOptions = {}): { prev?: Service; next?: Service } {
	const visible = services.filter((service) => isEntityAvailable({ kind: 'service', entity: service }, locale, options));
	const sorted = orderServices(visible);
	const index = sorted.findIndex((service) => service.id === id);
	if (index === -1) return {};
	return {
		prev: index > 0 ? sorted[index - 1] : undefined,
		next: index < sorted.length - 1 ? sorted[index + 1] : undefined,
	};
}
