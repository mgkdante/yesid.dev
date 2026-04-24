import { z } from 'zod';

// Wrap every adapter-boundary parse call so the thrown error names the port
// that produced bad data. Critical when Payload (Slice 18) starts delivering
// unknown-shaped JSON — the stack trace alone tells us which collection broke.
export function parsePort<T>(label: string, schema: z.ZodType<T>, value: unknown): T {
	const result = schema.safeParse(value);
	if (!result.success) {
		throw new Error(`[adapter.${label}] ${result.error.message}`);
	}
	return result.data;
}
