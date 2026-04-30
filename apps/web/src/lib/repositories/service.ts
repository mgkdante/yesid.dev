// Service repository. Thin delegation for service getters.

import { adapter } from '$lib/adapters';
import type { PreviewContext, Service } from '$lib/types';

export async function getAllServices(ctx?: PreviewContext): Promise<readonly Service[]> {
	return adapter.services.all(ctx);
}

export async function getServiceById(id: string, ctx?: PreviewContext): Promise<Service | undefined> {
	return adapter.services.byId(id, ctx);
}

export async function getVisibleServices(ctx?: PreviewContext): Promise<readonly Service[]> {
	return adapter.services.visible(ctx);
}

export async function getAdjacentServices(
	id: string,
	ctx?: PreviewContext,
): Promise<{ prev?: Service; next?: Service }> {
	return adapter.services.adjacent(id, ctx);
}
