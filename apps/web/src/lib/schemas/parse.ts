import { z } from 'zod';

// Name the adapter port in parse errors so malformed data can be traced to its source.
export function parsePort<T>(label: string, schema: z.ZodType<T>, value: unknown): T {
	const result = schema.safeParse(value);
	if (!result.success) {
		throw new Error(`[adapter.${label}] ${result.error.message}`);
	}
	return result.data;
}
