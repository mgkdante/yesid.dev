import type { Service } from '$lib/types';
import { services } from '$lib/content/services';

export function getServiceById(id: string): Service | undefined {
	return services.find((service) => service.id === id);
}

export function getVisibleServices(): readonly Service[] {
	return services.filter((service) => service.visible !== false);
}

export function getAdjacentServices(id: string): { prev?: Service; next?: Service } {
	const visible = services.filter((service) => service.visible !== false);
	const sorted = [...visible].sort((a, b) => a.station - b.station);
	const index = sorted.findIndex((service) => service.id === id);
	if (index === -1) return {};
	return {
		prev: index > 0 ? sorted[index - 1] : undefined,
		next: index < sorted.length - 1 ? sorted[index + 1] : undefined,
	};
}
