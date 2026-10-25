import type { ClientInit } from '@sveltejs/kit/hooks';
import { initializeUi } from '#lib/ui/configure.js';

export const init: ClientInit = () => {
	initializeUi();
};
