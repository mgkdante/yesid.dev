import type { ClientInit } from '@sveltejs/kit/hooks';
import { initializeUi } from '#lib/ui/configure.ts';

export const init: ClientInit = () => {
	initializeUi();
};
