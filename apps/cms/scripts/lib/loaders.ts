/**
 * Skeleton-records-then-full-data load pattern for Directus seed scripts (F9).
 *
 * Added in 18c Task 32. Handles M2M + circular-FK collections (services ↔
 * projects, tech_stack self-M2M) where creating rows in one shot fails
 * because sibling rows aren't yet inserted. Two-phase flow:
 *   1. loadSkeletonRecords — create rows with only `id` (+ minimum to
 *      satisfy NOT NULL). Establishes primary keys so foreign refs resolve.
 *   2. loadFullData — update each row with the remaining fields now that
 *      target rows exist.
 *
 * Also ships orphan detection/deletion for reset-mode seeds:
 *   - fetchExistingIds — pull all ids in a collection
 *   - findOrphans — IDs on server ∖ IDs in fixture
 *   - deleteOrphans — batch delete those IDs
 *
 * Pure + client-agnostic: takes a DirectusClient (from ./sdk) and a
 * collection name string; doesn't know about specific schemas.
 */

import { createItem, deleteItem, readItems, updateItem } from '@directus/sdk';
import type { DirectusClient, RestClient, StaticTokenClient } from '@directus/sdk';

type Client<TSchema extends object> = DirectusClient<TSchema> &
	StaticTokenClient<TSchema> &
	RestClient<TSchema>;

export interface RecordWithId {
	id: string;
}

/**
 * Fetch all item IDs in a collection. Uses limit=-1 (no pagination). For
 * very large collections, switch to pagination via `chunkArray` + offsets.
 */
export async function fetchExistingIds<TSchema extends object>(
	client: Client<TSchema>,
	collection: string,
): Promise<readonly string[]> {
	const rows = await client.request(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- SDK generic escape
		readItems(collection as any, { fields: ['id'], limit: -1 }),
	);
	return (rows as readonly RecordWithId[]).map((r) => r.id);
}

/**
 * Compute `existing ∖ desired` — rows present in Directus but not in the
 * local fixture. Candidates for delete in reset-mode seeds.
 */
export function findOrphans(
	existing: readonly string[],
	desired: readonly string[],
): readonly string[] {
	const keep = new Set(desired);
	return existing.filter((id) => !keep.has(id));
}

/**
 * Batch-delete orphans. Errors surface per-row; on failure the caller
 * decides whether to abort or continue.
 */
export async function deleteOrphans<TSchema extends object>(
	client: Client<TSchema>,
	collection: string,
	ids: readonly string[],
): Promise<void> {
	for (const id of ids) {
		await client.request(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			deleteItem(collection as any, id),
		);
	}
}

/**
 * Phase 1: create rows with only `id` (and any other NOT-NULL scalars
 * supplied by the caller). Skips rows already present.
 */
export async function loadSkeletonRecords<
	TSchema extends object,
	TItem extends RecordWithId,
>(
	client: Client<TSchema>,
	collection: string,
	items: readonly TItem[],
	buildSkeleton: (item: TItem) => RecordWithId,
): Promise<void> {
	const existing = new Set(await fetchExistingIds(client, collection));
	for (const item of items) {
		if (existing.has(item.id)) continue;
		await client.request(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			createItem(collection as any, buildSkeleton(item) as any),
		);
	}
}

/**
 * Phase 2: patch each row with full field set now that cross-references
 * resolve. `buildPatch` returns the fields to update; `id` is stripped
 * automatically.
 */
export async function loadFullData<
	TSchema extends object,
	TItem extends RecordWithId,
>(
	client: Client<TSchema>,
	collection: string,
	items: readonly TItem[],
	buildPatch: (item: TItem) => Record<string, unknown>,
): Promise<void> {
	for (const item of items) {
		const { id: _discard, ...patch } = buildPatch(item) as Record<string, unknown> & {
			id?: string;
		};
		void _discard;
		await client.request(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			updateItem(collection as any, item.id, patch as any),
		);
	}
}
