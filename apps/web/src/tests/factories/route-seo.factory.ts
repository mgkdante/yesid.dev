// Use explicit defaults because automatic factories cannot satisfy path regexes and block-editor unions.

import { Factory } from 'interface-forge';
import type { RouteSeoOverride } from '#lib/types.ts';

export const routeSeoFactory = new Factory<RouteSeoOverride>(() => ({
	path: '/',
	ogImage: null,
	title: null,
	description: null,
}));
