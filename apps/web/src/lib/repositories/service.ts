// Service repository. Thin delegation for service getters.

import { adapter } from '$lib/adapters';
import type { PreviewContext, Service } from '$lib/types';

// getAllServices — pruned in slice-28.3 (#117, zero consumers; routes use
// getVisibleServices). adapter.services.all stays for the slice-26 oracle.

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
