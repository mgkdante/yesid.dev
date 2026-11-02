import type { Service } from '#lib/types.ts';
import { services } from '#lib/content/services.ts';
import { orderServices } from '#lib/utils/station.ts';

export function getServiceById(id: string): Service | undefined {
	return services.find((service) => service.id === id);
}

export function getVisibleServices(): readonly Service[] {
	return services.filter((service) => service.visible !== false);
}

export function getAdjacentServices(id: string): { prev?: Service; next?: Service } {
	const visible = services.filter((service) => service.visible !== false);
	const sorted = orderServices(visible);
	const index = sorted.findIndex((service) => service.id === id);
	if (index === -1) return {};
	return {
		prev: index > 0 ? sorted[index - 1] : undefined,
		next: index < sorted.length - 1 ? sorted[index + 1] : undefined,
	};
}
