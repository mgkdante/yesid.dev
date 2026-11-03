/** Snapshot shape is derived from module schemas, never a second field inventory. */
import type { z } from 'zod';
import type { EXPORT_MODULES } from './lib/export-modules';

type UnionToIntersection<T> = (
	T extends unknown ? (value: T) => void : never
) extends (value: infer I) => void
	? I
	: never;
export type CompleteExportData = UnionToIntersection<
	z.output<(typeof EXPORT_MODULES)[number]['schema']>
>;
/** Partial snapshots are accepted by cache readers; validation requires every module. */
export type ExportData = Partial<CompleteExportData>;
