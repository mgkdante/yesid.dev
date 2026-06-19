/**
 * schema-apply.ts — shared Directus schema-apply primitives.
 *
 * Bucket B DRY extraction (audit consolidation sweep). Six setup-* scripts each
 * carried a byte-identical copy of this low-level machinery:
 *   - the SchemaStep plan-step shape (general form: method 'POST' | 'PATCH'),
 *   - the ApplyContext shape (directusUrl + token),
 *   - rest() — the raw fetch wrapper returning { status, json },
 *   - isAlreadyExists() — the idempotency probe for re-runnable applies.
 *
 * These pieces are behavior-neutral and shared verbatim. The per-script apply
 * loops (applySchemaPlan / applyPermission / applyPlan) are NOT extracted: their
 * log output diverges between scripts (ASCII "ok"/"-" vs "✓"/"—" vs
 * describeStep formatting) and some carry extra steps (flow-trigger), so each
 * script keeps its own loop to preserve exact logging behavior.
 *
 * The general SchemaStep dispatches on step.method, so every step keeps its own
 * verb — POST for creates, PATCH for route-seo archival / flow-trigger updates.
 */

export type SchemaStepKind = 'collection' | 'field' | 'relation' | 'permission';

export interface SchemaStep {
	kind: SchemaStepKind;
	/** Human-readable target, e.g. 'route_seo' or 'route_seo.translations'. */
	target: string;
	method: 'POST' | 'PATCH';
	path: string;
	payload: Record<string, unknown> | null;
	/** permission steps only: policy display names resolved to ids at apply time. */
	policyNames?: readonly string[];
}

export interface ApplyContext {
	directusUrl: string;
	token: string;
}

export async function rest(
	ctx: ApplyContext,
	method: string,
	path: string,
	body?: unknown,
): Promise<{ status: number; json: any }> {
	const res = await fetch(`${ctx.directusUrl}${path}`, {
		method,
		headers: {
			Authorization: `Bearer ${ctx.token}`,
			'Content-Type': 'application/json',
		},
		body: body === undefined ? undefined : JSON.stringify(body),
	});
	const text = await res.text();
	let json: any = null;
	try {
		json = text ? JSON.parse(text) : null;
	} catch {
		json = { raw: text };
	}
	return { status: res.status, json };
}

/** Directus "this already exists" answers — tolerated so re-runs are idempotent. */
export function isAlreadyExists(status: number, json: any): boolean {
	if (status < 400) return false;
	const errors: { message?: string; extensions?: { code?: string } }[] = json?.errors ?? [];
	return errors.some(
		(error) =>
			error.extensions?.code === 'RECORD_NOT_UNIQUE' ||
			/already exists/i.test(error.message ?? '') ||
			/already has an associated relationship/i.test(error.message ?? ''),
	);
}
