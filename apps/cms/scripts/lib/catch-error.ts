/**
 * Directus error parsing + typed error class (F8).
 *
 * Added in 18c Task 28. Directus REST/SDK errors come in a nested shape:
 *   { errors: [{ message, extensions: { code, ... } }, ...] }
 *
 * parseErrors() normalizes that into readable strings; DirectusError wraps
 * the whole response so catch blocks can `err instanceof DirectusError` and
 * access the original status + messages.
 */

export interface DirectusErrorPayload {
	errors: ReadonlyArray<{
		message: string;
		extensions?: { code?: string; [k: string]: unknown };
	}>;
}

export class DirectusError extends Error {
	readonly status: number;
	readonly payload: DirectusErrorPayload | undefined;

	constructor(
		status: number,
		message: string,
		payload?: DirectusErrorPayload,
	) {
		super(message);
		this.name = 'DirectusError';
		this.status = status;
		this.payload = payload;
	}
}

/**
 * Extract human-readable messages from an arbitrary Directus error value.
 * Safe on non-standard shapes (plain Error, string, undefined) — returns a
 * best-effort string list.
 */
export function parseErrors(err: unknown): readonly string[] {
	if (err == null) return [];
	if (typeof err === 'string') return [err];
	if (err instanceof DirectusError && err.payload) {
		return err.payload.errors.map((e) => {
			const code = e.extensions?.code;
			return code ? `[${code}] ${e.message}` : e.message;
		});
	}
	if (isDirectusPayload(err)) {
		return err.errors.map((e) => {
			const code = e.extensions?.code;
			return code ? `[${code}] ${e.message}` : e.message;
		});
	}
	if (err instanceof Error) return [err.message];
	try {
		return [JSON.stringify(err)];
	} catch {
		return [String(err)];
	}
}

function isDirectusPayload(v: unknown): v is DirectusErrorPayload {
	return (
		typeof v === 'object' &&
		v !== null &&
		'errors' in v &&
		Array.isArray((v as { errors: unknown }).errors)
	);
}
