import { z } from 'zod';
import type { RouteSeoOverride } from '../types/content';
import { LocalizedStringSchema } from './shared';

export const RouteSeoOverrideSchema = z.object({
	path: z.string().regex(/^\//),
	ogImage: z.string().uuid().nullable(),
	title: LocalizedStringSchema.nullable(),
	description: LocalizedStringSchema.nullable(),
});

type _RouteSeoOverrideCheck = z.infer<typeof RouteSeoOverrideSchema> extends RouteSeoOverride
	? RouteSeoOverride extends z.infer<typeof RouteSeoOverrideSchema>
		? true
		: false
	: false;
const _routeSeoOverrideCheck: _RouteSeoOverrideCheck = true;
void _routeSeoOverrideCheck;
