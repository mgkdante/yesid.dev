// ProjectSchema and friends moved to @repo/shared/schemas (site-hardening-a-plus).
// Re-exported here so existing $lib/schemas/project importers keep resolving.
export {
	ProjectStatusSchema,
	ProjectSectionSchema,
	ImpactMetricSchema,
	ProjectSchema,
} from '@repo/shared/schemas';

// LocalizedBlockEditorDocSchema relocated to @repo/shared (slice-28.3 #82);
// re-exported so existing `$lib/schemas/project` consumers keep working.
export { LocalizedBlockEditorDocSchema } from '@repo/shared';
