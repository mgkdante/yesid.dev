// Service repository. Thin delegation for service getters.

import { adapter } from '$lib/adapters';
import type { Service } from '$lib/types';

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
