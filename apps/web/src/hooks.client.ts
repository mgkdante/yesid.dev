import type { ClientInit } from '@sveltejs/kit';
import { initializeUi } from '$lib/ui/configure';

export const init: ClientInit = () => {
	initializeUi();
};
