import { createHash } from "node:crypto";
import {
  ASSET_DELIVERY_MODES,
  ASSET_KINDS,
  ASSET_ROLES,
  parseAssetSemanticKey,
  type AssetDeliveryMode,
  type AssetKind,
  type AssetRole,
  type AssetSemanticKey,
  type Sha256Hex,
} from "@repo/shared";
import { readAllPages } from "../read-all-pages";

export type CmsEnvironment = "dev" | "prod";
export type CmsContentLocale = "en" | "fr" | "es";
export type AssetLifecycleStatus =
  | "draft"
  | "candidate"
  | "ready"
  | "approved"
  | "live"
  | "superseded"
  | "deprecated"
  | "quarantined";
export type AssetOwnerType =
  | "site"
  | "route"
  | "service"
  | "project"
  | "blog"
  | "page-block"
  | "component";
export type AssetLocalePolicy = "global" | "localized" | "usage-supplied";
export type AssetAltMode = "decorative" | "informative" | "usage-supplied";
export type AssetAspectRatioMode = "any" | "exact";
export type AssetBrandStatus =
  | "unreviewed"
  | "approved"
  | "third-party-original"
  | "restricted"
  | "deprecated";
export type AssetVersionSourceMode =
  "upload" | "generated" | "migrated" | "code-component";
export type AssetVersionApprovalStatus =
  | "uploaded"
  | "validating"
  | "valid"
  | "rejected"
  | "approved"
  | "promoted"
  | "superseded";
export type StoredUsageConfidence =
  "exact-static" | "resolved-generated" | "declared-dynamic" | "unknown";
export type RegistryAvailability =
  "available" | "missing" | "forbidden" | "unknown";

export const DIRECTUS_PAGE_SIZE = 100;

export const ASSET_REGISTRY_READ_COLLECTIONS = Object.freeze([
  "asset_records",
  "asset_records_translations",
  "asset_versions",
  "asset_usages",
] as const);

export const DIRECTUS_READ_SURFACES = Object.freeze([
  "asset_records",
  "asset_records_translations",
  "asset_versions",
  "asset_usages",
  "directus_folders",
  "directus_files",
  "directus_settings.storage_asset_presets",
  "site_meta",
  "route_seo",
  "about_languages",
  "blog_posts",
  "icons",
  "illustrations",
  "projects",
  "projects_translations",
  "projects_sections",
  "projects_sections_translations",
  "services",
  "legal_pages",
  "legal_pages_translations",
  "tech_stack",
  "tech_stack_translations",
  "block_about_content",
  "block_about_content_translations",
  "nav_links",
  "contact_channels",
  "stack_archetypes",
  "site_pages",
  "site_pages_translations",
] as const);

export type DirectusReadSurface = (typeof DIRECTUS_READ_SURFACES)[number];
type SingletonSurface =
  | "directus_settings.storage_asset_presets"
  | "site_meta"
  | "block_about_content";
type PageSurface = Exclude<DirectusReadSurface, SingletonSurface>;

export interface DirectusPageSurfaceSpec {
  readonly mode: "page";
  readonly fields: readonly string[];
  readonly sort: readonly ["id"];
}

export interface DirectusSingletonSurfaceSpec {
  readonly mode: "singleton";
  readonly fields: readonly string[];
}

const pageSpec = (fields: readonly string[]): DirectusPageSurfaceSpec =>
  Object.freeze({
    mode: "page" as const,
    fields: Object.freeze([...fields]),
    sort: Object.freeze(["id"] as const),
  });
const singletonSpec = (
  fields: readonly string[],
): DirectusSingletonSurfaceSpec =>
  Object.freeze({
    mode: "singleton" as const,
    fields: Object.freeze([...fields]),
  });

export const DIRECTUS_SURFACE_SPECS = Object.freeze({
  asset_records: pageSpec([
    "id",
    "semantic_key",
    "title",
    "meaning",
    "kind",
    "role",
    "lifecycle_status",
    "code_component_key",
    "owner_type",
    "owner_key",
    "locale_policy",
    "alt_mode",
    "aspect_ratio_mode",
    "aspect_ratio_width",
    "aspect_ratio_height",
    "allowed_mime_families",
    "transform_profile",
    "delivery_mode",
    "focal_point_x",
    "focal_point_y",
    "max_bytes",
    "brand_status",
    "approved_token_slots",
    "candidate_version",
    "approved_version",
    "date_created",
    "date_updated",
    "user_created",
    "user_updated",
  ]),
  asset_records_translations: pageSpec([
    "id",
    "asset_records_id",
    "languages_code",
    "alt_text",
    "caption",
    "credit",
    "og_image_alt",
  ]),
  asset_versions: pageSpec([
    "id",
    "asset_record",
    "version_number",
    "source_mode",
    "directus_file",
    "component_key",
    "sha256",
    "mime_type",
    "format",
    "bytes",
    "width",
    "height",
    "duration_ms",
    "orientation",
    "color_profile",
    "is_animated",
    "source_hash",
    "dependency_hashes",
    "transform_profile",
    "transform_signature",
    "sanitizer_signature",
    "generator_signature",
    "toolchain_signature",
    "approval_status",
    "approved_by",
    "approved_at",
    "replaces_version",
    "replacement_reason",
    "promotion_request_id",
    "quarantine_reason",
    "sanitized_output_sha256",
    "input_hash",
    "brand_slots",
    "svg_id_prefix",
    "template_version",
    "safety_report",
    "date_created",
    "user_created",
  ]),
  asset_usages: pageSpec([
    "id",
    "asset_record",
    "resolved_version",
    "unresolved_ref",
    "scan_run_id",
    "last_seen_manifest_sha256",
    "confidence",
    "consumer_type",
    "consumer_key",
    "source_kind",
    "source_file",
    "cms_field",
    "source_line",
    "route",
    "locale",
    "slot",
    "required",
    "delivery_mode",
    "alt_text_override",
    "alt_source",
    "active",
    "first_seen",
    "last_seen",
    "date_updated",
  ]),
  directus_folders: pageSpec(["id", "name", "parent"]),
  directus_files: pageSpec([
    "id",
    "storage",
    "filename_disk",
    "filename_download",
    "title",
    "type",
    "folder",
    "legacy_path",
    "filesize",
    "width",
    "height",
    "duration",
    "description",
    "tags",
    "metadata",
  ]),
  "directus_settings.storage_asset_presets": singletonSpec([
    "storage_asset_presets",
  ]),
  site_meta: singletonSpec(["id", "default_og_image"]),
  route_seo: pageSpec(["id", "path", "status", "og_image"]),
  about_languages: pageSpec([
    "id",
    "status",
    "image",
    "translations.id",
    "translations.languages_code",
    "translations.label",
  ]),
  blog_posts: pageSpec([
    "id",
    "translation_key",
    "status",
    "lang",
    "category",
    "external",
    "url",
    "title",
    "cover_image",
    "svg_illustration",
    "body",
  ]),
  icons: pageSpec(["id", "status", "name", "iconify_id", "svg_override"]),
  illustrations: pageSpec(["id", "label", "file"]),
  projects: pageSpec([
    "id",
    "status",
    "hero_image",
    "hero_image_light",
    "hero_image_secondary",
    "hero_image_secondary_light",
    "svg_illustration",
  ]),
  projects_translations: pageSpec([
    "id",
    "projects_id",
    "languages_code",
    "title",
    "description",
  ]),
  projects_sections: pageSpec(["id", "projects_id"]),
  projects_sections_translations: pageSpec([
    "id",
    "projects_sections_id",
    "languages_code",
    "content",
  ]),
  services: pageSpec(["id", "visible", "svg"]),
  legal_pages: pageSpec(["id", "status"]),
  legal_pages_translations: pageSpec([
    "id",
    "legal_pages_id",
    "languages_code",
    "body",
  ]),
  tech_stack: pageSpec(["id", "name", "status", "icon_id"]),
  tech_stack_translations: pageSpec([
    "id",
    "tech_stack_id",
    "languages_code",
    "what_it_is",
    "what_i_use_it_for",
    "why_i_use_it_instead",
  ]),
  block_about_content: singletonSpec([
    "id",
    "status",
    "headshot",
    "client_logos",
  ]),
  block_about_content_translations: pageSpec([
    "id",
    "block_about_content_id",
    "languages_code",
    "identity_name",
    "polaroids",
    "interests",
    "testimonials",
  ]),
  nav_links: pageSpec(["id", "status", "placement", "href", "page", "icon"]),
  contact_channels: pageSpec(["id", "status", "href", "icon"]),
  stack_archetypes: pageSpec([
    "id",
    "status",
    "slug",
    "icon",
    "tech.id",
    "tech.tech_stack_id",
  ]),
  site_pages: pageSpec(["id", "status", "path", "type"]),
  site_pages_translations: pageSpec(["id", "site_pages_id", "languages_code"]),
} satisfies Record<
  DirectusReadSurface,
  DirectusPageSurfaceSpec | DirectusSingletonSurfaceSpec
>);

export interface CmsReadResponse {
  status: number;
  data: unknown;
}

export interface CmsAssetReadResponse {
  status: number;
  bytes: ArrayBuffer | null;
}

export interface CmsReadClient {
  readRegistryCollections?(): Promise<CmsReadResponse>;
  readPage(input: {
    surface: PageSurface;
    fields: readonly unknown[];
    sort: readonly string[];
    limit: typeof DIRECTUS_PAGE_SIZE;
    offset: number;
  }): Promise<CmsReadResponse>;
  readSingleton(input: {
    surface: SingletonSurface;
    fields: readonly unknown[];
  }): Promise<CmsReadResponse>;
  readAsset(fileId: string, maxBytes: number): Promise<CmsAssetReadResponse>;
}

export interface DirectusReadLimits {
  maxRowsPerCollection: number;
  maxFiles: number;
  maxFileBytes: number;
  maxTotalFileBytes: number;
  maxConcurrentDownloads: number;
}

export const DEFAULT_DIRECTUS_READ_LIMITS = Object.freeze({
  maxRowsPerCollection: 10_000,
  maxFiles: 1_000,
  maxFileBytes: 20_971_520,
  maxTotalFileBytes: 536_870_912,
  maxConcurrentDownloads: 4,
} as const);

export interface DirectusScanOptions {
  environment: CmsEnvironment;
  client: CmsReadClient;
  limits?: Partial<DirectusReadLimits>;
}

export interface DirectusReadIssue {
  code:
    | "collection-missing"
    | "collection-forbidden"
    | "request-failed"
    | "response-invalid"
    | "pagination-limit"
    | "download-failed"
    | "download-file-count-limit"
    | "download-file-size-limit"
    | "download-total-size-limit"
    | "download-size-mismatch";
  environment: CmsEnvironment;
  operation: string;
  status: number | null;
  entityKey: string | null;
}

export type DirectusReadAvailability =
  "available" | "missing" | "forbidden" | "failed";

export interface DirectusReadReceipt {
  surface: DirectusReadSurface;
  availability: DirectusReadAvailability;
  complete: boolean;
  rowCount: number | null;
}

export interface NormalizedCmsFolder {
  environment: CmsEnvironment;
  id: string;
  name: string;
  parentId: string | null;
  path: string | null;
}

export interface NormalizedCmsFile {
  id: string;
  environment: CmsEnvironment;
  fileId: string;
  storage: string;
  filenameDisk: string | null;
  filenameDownload: string;
  title: string | null;
  mimeType: string | null;
  folderId: string | null;
  folderPath: string | null;
  legacyPath: string | null;
  declaredBytes: number | null;
  observedBytes: number | null;
  width: number | null;
  height: number | null;
  durationMs: number | null;
  description: string | null;
  tags: readonly string[];
  metadata: Readonly<Record<string, unknown>> | null;
  sha256: Sha256Hex | null;
  hashState:
    | "verified"
    | "forbidden"
    | "failed"
    | "skipped-file-count-limit"
    | "skipped-file-size-limit"
    | "skipped-total-size-limit";
}

export interface NormalizedAssetRecord {
  id: string;
  environment: CmsEnvironment;
  semantic_key: AssetSemanticKey;
  title: string;
  meaning: string | null;
  kind: AssetKind;
  role: AssetRole;
  lifecycle_status: AssetLifecycleStatus;
  code_component_key: string | null;
  owner_type: AssetOwnerType;
  owner_key: string;
  locale_policy: AssetLocalePolicy;
  alt_mode: AssetAltMode;
  aspect_ratio_mode: AssetAspectRatioMode;
  aspect_ratio_width: number | null;
  aspect_ratio_height: number | null;
  allowed_mime_families: readonly string[] | null;
  transform_profile: string | null;
  delivery_mode: AssetDeliveryMode;
  focal_point_x: number | null;
  focal_point_y: number | null;
  max_bytes: number | null;
  brand_status: AssetBrandStatus;
  approved_token_slots: readonly string[] | null;
  candidate_version: string | null;
  approved_version: string | null;
  date_created: string | null;
  date_updated: string | null;
  user_created: string | null;
  user_updated: string | null;
}

export interface NormalizedAssetTranslation {
  id: string;
  environment: CmsEnvironment;
  asset_records_id: string;
  languages_code: string;
  alt_text: string | null;
  caption: string | null;
  credit: string | null;
  og_image_alt: string | null;
}

export interface NormalizedSvgSafetyReport {
  state: "not-applicable" | "unknown" | "declared-safe" | "rejected";
  reasons: readonly string[];
  policy: string | null;
  sourceSha256: Sha256Hex | null;
  sanitizerSignature: Sha256Hex | null;
  sanitizedOutputSha256: Sha256Hex | null;
  transformSignature: Sha256Hex | null;
}

export interface NormalizedAssetVersion {
  id: string;
  environment: CmsEnvironment;
  asset_record: string;
  version_number: number;
  source_mode: AssetVersionSourceMode;
  directus_file: string | null;
  component_key: string | null;
  sha256: Sha256Hex;
  mime_type: string | null;
  format: string | null;
  bytes: number | null;
  width: number | null;
  height: number | null;
  duration_ms: number | null;
  orientation: string | null;
  color_profile: string | null;
  is_animated: boolean | null;
  source_hash: Sha256Hex | null;
  dependency_hashes: Readonly<Record<string, Sha256Hex>> | null;
  transform_profile: string | null;
  transform_signature: Sha256Hex | null;
  sanitizer_signature: Sha256Hex | null;
  generator_signature: Sha256Hex | null;
  toolchain_signature: Sha256Hex | null;
  approval_status: AssetVersionApprovalStatus;
  approved_by: string | null;
  approved_at: string | null;
  replaces_version: string | null;
  replacement_reason: string | null;
  promotion_request_id: string | null;
  quarantine_reason: string | null;
  sanitized_output_sha256: Sha256Hex | null;
  input_hash: Sha256Hex | null;
  brand_slots: readonly string[] | null;
  svg_id_prefix: string | null;
  template_version: string | null;
  safety_report: NormalizedSvgSafetyReport;
  date_created: string | null;
  user_created: string | null;
}

export interface NormalizedStoredUsage {
  id: string;
  environment: CmsEnvironment;
  asset_record: string | null;
  resolved_version: string | null;
  unresolved_ref: string | null;
  scan_run_id: string;
  last_seen_manifest_sha256: Sha256Hex;
  confidence: StoredUsageConfidence;
  consumer_type:
    | "site"
    | "route"
    | "service"
    | "project"
    | "blog"
    | "page-block"
    | "component"
    | "style"
    | "system";
  consumer_key: string;
  source_kind: "repository" | "generated" | "cms" | "route" | "declaration";
  source_file: string;
  cms_field: string | null;
  source_line: number | null;
  route: string | null;
  locale: CmsContentLocale | null;
  slot: string;
  required: boolean;
  delivery_mode: AssetDeliveryMode;
  alt_text_override: string | null;
  alt_source: string | null;
  active: boolean;
  first_seen: string;
  last_seen: string;
  date_updated: string | null;
}

export interface NormalizedCmsReference {
  id: string;
  environment: CmsEnvironment;
  collection: string;
  itemKey: string;
  field: string;
  ordinal: number;
  ownerType:
    | "site"
    | "route"
    | "service"
    | "project"
    | "blog"
    | "page-block"
    | "component";
  ownerKey: string;
  route: string | null;
  locale: string | null;
  active: boolean | null;
  consumption: "rendered" | "cms-intent-only" | "non-asset-token";
  slot: string;
  required: boolean;
  deliveryMode: AssetDeliveryMode;
  referenceKind:
    | "typed-file-relation"
    | "block-file-id"
    | "embedded-asset-url"
    | "repository-path"
    | "related-icon"
    | "related-illustration"
    | "external-provider"
    | "external-url"
    | "unresolved-media";
  fileId: string | null;
  rawRef: string | null;
  contextualAlt: string | null;
  altSource: string | null;
}

export interface NormalizedTransformPreset {
  key: string;
  fit: string | null;
  width: number | null;
  height: number | null;
  quality: number | null;
  format: string | null;
  withoutEnlargement: boolean | null;
}

export interface DirectusAssetSnapshot {
  schemaVersion: 1;
  environment: CmsEnvironment;
  registryAvailability: RegistryAvailability;
  folders: readonly NormalizedCmsFolder[];
  files: readonly NormalizedCmsFile[];
  records: readonly NormalizedAssetRecord[];
  translations: readonly NormalizedAssetTranslation[];
  versions: readonly NormalizedAssetVersion[];
  storedUsages: readonly NormalizedStoredUsage[];
  references: readonly NormalizedCmsReference[];
  transformPresets: readonly NormalizedTransformPreset[];
  readReceipts: readonly DirectusReadReceipt[];
  readIssues: readonly DirectusReadIssue[];
}

type UnknownRow = Record<string, unknown>;
type RawSurfaceData = Partial<Record<DirectusReadSurface, unknown>>;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const ICONIFY_PATTERN = /^[a-z0-9][a-z0-9-]*:[a-z0-9][a-z0-9._-]*$/;
const ASSET_DELIVERY_MODE_SET = new Set<string>(ASSET_DELIVERY_MODES);
const ASSET_KIND_SET = new Set<string>(ASSET_KINDS);
const ASSET_ROLE_SET = new Set<string>(ASSET_ROLES);
const ASSET_LIFECYCLE_STATUS_SET = new Set<string>([
  "draft",
  "candidate",
  "ready",
  "approved",
  "live",
  "superseded",
  "deprecated",
  "quarantined",
]);
const ASSET_OWNER_TYPE_SET = new Set<string>([
  "site",
  "route",
  "service",
  "project",
  "blog",
  "page-block",
  "component",
]);
const ASSET_LOCALE_POLICY_SET = new Set<string>([
  "global",
  "localized",
  "usage-supplied",
]);
const ASSET_ALT_MODE_SET = new Set<string>([
  "decorative",
  "informative",
  "usage-supplied",
]);
const ASSET_ASPECT_RATIO_MODE_SET = new Set<string>(["any", "exact"]);
const ASSET_BRAND_STATUS_SET = new Set<string>([
  "unreviewed",
  "approved",
  "third-party-original",
  "restricted",
  "deprecated",
]);
const ASSET_VERSION_SOURCE_MODE_SET = new Set<string>([
  "upload",
  "generated",
  "migrated",
  "code-component",
]);
const ASSET_VERSION_APPROVAL_STATUS_SET = new Set<string>([
  "uploaded",
  "validating",
  "valid",
  "rejected",
  "approved",
  "promoted",
  "superseded",
]);
const STORED_USAGE_CONFIDENCE_SET = new Set<string>([
  "exact-static",
  "resolved-generated",
  "declared-dynamic",
  "unknown",
]);
const CMS_CONTENT_LOCALE_SET = new Set<string>(["en", "fr", "es"]);
const TOP_LEVEL_ARRAY_KEYS = [
  "folders",
  "files",
  "records",
  "translations",
  "versions",
  "storedUsages",
  "references",
  "transformPresets",
  "readReceipts",
  "readIssues",
] as const;

function compareUtf8(left: string, right: string): number {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));
}

function normalizeText(value: string): string {
  return value.replace(/\r\n?/g, "\n").normalize("NFC");
}

function isObject(value: unknown): value is UnknownRow {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(value: unknown, label: string): string {
  if (typeof value !== "string")
    throw new TypeError(`${label} must be a string`);
  const normalized = normalizeText(value);
  if (!normalized) throw new TypeError(`${label} must not be empty`);
  return normalized;
}

function nullableString(value: unknown, label: string): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string")
    throw new TypeError(`${label} must be a string or null`);
  return normalizeText(value);
}

function requiredBoolean(value: unknown, label: string): boolean {
  if (typeof value !== "boolean")
    throw new TypeError(`${label} must be a boolean`);
  return value;
}

function nullableBoolean(value: unknown, label: string): boolean | null {
  if (value === null || value === undefined) return null;
  return requiredBoolean(value, label);
}

function requiredNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError(`${label} must be a finite number`);
  }
  return value;
}

function nullableNumber(value: unknown, label: string): number | null {
  if (value === null || value === undefined) return null;
  return requiredNumber(value, label);
}

function requiredInteger(value: unknown, label: string): number {
  const number = requiredNumber(value, label);
  if (!Number.isSafeInteger(number))
    throw new TypeError(`${label} must be a safe integer`);
  return number;
}

function nullableInteger(value: unknown, label: string): number | null {
  if (value === null || value === undefined) return null;
  return requiredInteger(value, label);
}

function rowKey(value: unknown, label = "id"): string {
  if (typeof value === "string" && value.length > 0)
    return normalizeText(value);
  if (typeof value === "number" && Number.isSafeInteger(value))
    return String(value);
  throw new TypeError(`${label} must be a non-empty string or safe integer`);
}

function relationId(value: unknown, label: string): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" || typeof value === "number")
    return rowKey(value, label);
  if (isObject(value)) return rowKey(value.id, `${label}.id`);
  throw new TypeError(`${label} must be an ID, relation object, or null`);
}

function normalizeHash(
  value: unknown,
  label: string,
  nullable = false,
): Sha256Hex | null {
  if (value === null || value === undefined) {
    if (nullable) return null;
    throw new TypeError(`${label} must be a SHA-256 value`);
  }
  const normalized = requiredString(value, label);
  if (!SHA256_PATTERN.test(normalized))
    throw new TypeError(`${label} must be SHA-256 hex`);
  return normalized as Sha256Hex;
}

function normalizeStringSet(
  value: unknown,
  label: string,
  nullable = true,
): readonly string[] | null {
  if (value === null || value === undefined) return nullable ? null : [];
  if (!Array.isArray(value))
    throw new TypeError(`${label} must be an array or null`);
  const values = value.map((entry, index) =>
    requiredString(entry, `${label}[${index}]`).trim(),
  );
  if (values.some((entry) => !entry))
    throw new TypeError(`${label} entries must not be blank`);
  return [...new Set(values)].sort(compareUtf8);
}

function normalizeStringList(value: unknown, label: string): readonly string[] {
  if (value === null || value === undefined) return [];
  if (!Array.isArray(value))
    throw new TypeError(`${label} must be an array or null`);
  return value.map((entry, index) =>
    requiredString(entry, `${label}[${index}]`),
  );
}

function normalizeJson(value: unknown, label: string): unknown {
  if (value === null || typeof value === "boolean") return value;
  if (typeof value === "string") return normalizeText(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value))
      throw new TypeError(`${label} has a non-finite number`);
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((entry, index) =>
      normalizeJson(entry, `${label}[${index}]`),
    );
  }
  if (isObject(value)) {
    const normalized: Record<string, unknown> = {};
    for (const key of Object.keys(value).sort(compareUtf8)) {
      normalized[normalizeText(key)] = normalizeJson(
        value[key],
        `${label}.${key}`,
      );
    }
    return normalized;
  }
  throw new TypeError(`${label} is not JSON-serializable`);
}

function nullableJsonObject(
  value: unknown,
  label: string,
): Readonly<Record<string, unknown>> | null {
  if (value === null || value === undefined) return null;
  const normalized = normalizeJson(value, label);
  if (!isObject(normalized))
    throw new TypeError(`${label} must be an object or null`);
  return normalized;
}

function normalizedEnum<T extends string>(
  value: unknown,
  allowed: ReadonlySet<string>,
  label: string,
): T {
  const normalized = requiredString(value, label);
  if (!allowed.has(normalized))
    throw new TypeError(`${label} has an unsupported value`);
  return normalized as T;
}

function issue(
  environment: CmsEnvironment,
  code: DirectusReadIssue["code"],
  operation: string,
  status: number | null,
  entityKey: string | null,
): DirectusReadIssue {
  return { code, environment, operation, status, entityKey };
}

function validatedLimits(
  overrides: Partial<DirectusReadLimits> | undefined,
): DirectusReadLimits {
  const limits = { ...DEFAULT_DIRECTUS_READ_LIMITS, ...overrides };
  for (const [key, value] of Object.entries(limits)) {
    if (!Number.isSafeInteger(value) || value <= 0) {
      throw new TypeError(`${key} must be a positive safe integer`);
    }
  }
  if (limits.maxConcurrentDownloads > 4) {
    throw new TypeError("maxConcurrentDownloads must not exceed four");
  }
  return limits;
}

function statusIssueCode(status: number): DirectusReadIssue["code"] {
  if (status === 404) return "collection-missing";
  if (status === 401 || status === 403) return "collection-forbidden";
  return "request-failed";
}

function statusAvailability(status: number): DirectusReadAvailability {
  if (status === 404) return "missing";
  if (status === 401 || status === 403) return "forbidden";
  return "failed";
}

interface ReadAllResult {
  data: RawSurfaceData;
  receipts: DirectusReadReceipt[];
  issues: DirectusReadIssue[];
}

type RegistrySchemaState = "available" | "missing" | "partial" | "unavailable";

async function registrySchemaState(client: CmsReadClient): Promise<RegistrySchemaState> {
  if (!client.readRegistryCollections) return "unavailable";
  let response: CmsReadResponse;
  try {
    response = await client.readRegistryCollections();
  } catch {
    return "unavailable";
  }
  if (
    !Number.isInteger(response.status) ||
    response.status < 200 ||
    response.status >= 300 ||
    !Array.isArray(response.data) ||
    response.data.some(
      (row) =>
        !row ||
        typeof row !== "object" ||
        typeof (row as { collection?: unknown }).collection !== "string",
    )
  ) {
    return "unavailable";
  }
  const available = new Set(
    response.data.map((row) => (row as { collection: string }).collection),
  );
  const present = ASSET_REGISTRY_READ_COLLECTIONS.filter((collection) =>
    available.has(collection),
  ).length;
  if (present === 0) return "missing";
  if (present === ASSET_REGISTRY_READ_COLLECTIONS.length) return "available";
  return "partial";
}

async function readAllSurfaces(
  environment: CmsEnvironment,
  client: CmsReadClient,
  limits: DirectusReadLimits,
  registryState: RegistrySchemaState,
): Promise<ReadAllResult> {
  const data: RawSurfaceData = {};
  const receipts: DirectusReadReceipt[] = [];
  const issues: DirectusReadIssue[] = [];

  for (const surface of DIRECTUS_READ_SURFACES) {
    if (
      registryState === "missing" &&
      (ASSET_REGISTRY_READ_COLLECTIONS as readonly string[]).includes(surface)
    ) {
      data[surface] = [];
      receipts.push({
        surface,
        availability: "missing",
        complete: false,
        rowCount: null,
      });
      issues.push(
        issue(
          environment,
          "collection-missing",
          `readPage:${surface}`,
          404,
          surface,
        ),
      );
      continue;
    }
    const spec = DIRECTUS_SURFACE_SPECS[surface];
    if (spec.mode === "singleton") {
      const operation = `readSingleton:${surface}`;
      try {
        const response = await client.readSingleton({
          surface: surface as SingletonSurface,
          fields: spec.fields,
        });
        if (
          !Number.isInteger(response.status) ||
          response.status < 200 ||
          response.status >= 300
        ) {
          const status = Number.isInteger(response.status)
            ? response.status
            : null;
          receipts.push({
            surface,
            availability:
              status === null ? "failed" : statusAvailability(status),
            complete: false,
            rowCount: null,
          });
          issues.push(
            issue(
              environment,
              status === null ? "response-invalid" : statusIssueCode(status),
              operation,
              status,
              surface,
            ),
          );
          continue;
        }
        if (!isObject(response.data)) {
          receipts.push({
            surface,
            availability: "failed",
            complete: false,
            rowCount: null,
          });
          issues.push(
            issue(
              environment,
              "response-invalid",
              operation,
              response.status,
              surface,
            ),
          );
          continue;
        }
        data[surface] = response.data;
        receipts.push({
          surface,
          availability: "available",
          complete: true,
          rowCount: 1,
        });
      } catch {
        receipts.push({
          surface,
          availability: "failed",
          complete: false,
          rowCount: null,
        });
        issues.push(
          issue(environment, "request-failed", operation, null, surface),
        );
      }
      continue;
    }

    const operation = `readPage:${surface}`;
    const rows: unknown[] = [];
    const seen = new Set<string>();
    let complete = true;
    let availability: DirectusReadAvailability = "available";
    let rowCount: number | null = 0;
    await readAllPages({
      pageSize: DIRECTUS_PAGE_SIZE,
      readPage: async ({ limit, offset }): Promise<CmsReadResponse | null> => {
        try {
          return await client.readPage({
            surface: surface as PageSurface,
            fields: spec.fields,
            sort: spec.sort,
            limit,
            offset,
          });
        } catch {
          complete = false;
          availability = "failed";
          rowCount = null;
          issues.push(
            issue(environment, "request-failed", operation, null, surface),
          );
          return null;
        }
      },
      visitPage: (response) => {
        if (response === null) return "stop";
        if (
          !Number.isInteger(response.status) ||
          response.status < 200 ||
          response.status >= 300
        ) {
          const status = Number.isInteger(response.status)
            ? response.status
            : null;
          complete = false;
          availability =
            status === null ? "failed" : statusAvailability(status);
          rowCount = null;
          issues.push(
            issue(
              environment,
              status === null ? "response-invalid" : statusIssueCode(status),
              operation,
              status,
              surface,
            ),
          );
          return "stop";
        }
        if (!Array.isArray(response.data)) {
          complete = false;
          availability = "failed";
          rowCount = null;
          issues.push(
            issue(
              environment,
              "response-invalid",
              operation,
              response.status,
              surface,
            ),
          );
          return "stop";
        }
        if (response.data.length > DIRECTUS_PAGE_SIZE) {
          complete = false;
          availability = "failed";
          rowCount = rows.length;
          issues.push(
            issue(
              environment,
              "response-invalid",
              operation,
              response.status,
              surface,
            ),
          );
          return "stop";
        }
        const remainingCapacity = limits.maxRowsPerCollection - rows.length;
        const pageRows = response.data.slice(0, Math.max(remainingCapacity, 0));
        let invalid = false;
        for (const rawRow of pageRows) {
          if (!isObject(rawRow)) {
            invalid = true;
            issues.push(
              issue(
                environment,
                "response-invalid",
                operation,
                response.status,
                surface,
              ),
            );
            break;
          }
          let id: string;
          try {
            id = rowKey(rawRow.id, `${surface}.id`);
          } catch {
            invalid = true;
            issues.push(
              issue(
                environment,
                "response-invalid",
                operation,
                response.status,
                surface,
              ),
            );
            break;
          }
          if (seen.has(id)) {
            invalid = true;
            issues.push(
              issue(
                environment,
                "response-invalid",
                operation,
                response.status,
                id,
              ),
            );
            break;
          }
          seen.add(id);
          rows.push(rawRow);
        }
        if (invalid) {
          complete = false;
          availability = "failed";
          rowCount = rows.length;
          return "stop";
        }
        rowCount = rows.length;
        if (response.data.length > remainingCapacity) {
          complete = false;
          issues.push(
            issue(
              environment,
              "pagination-limit",
              operation,
              response.status,
              surface,
            ),
          );
          return "stop";
        }
        if (response.data.length < DIRECTUS_PAGE_SIZE) return "stop";
        if (rows.length >= limits.maxRowsPerCollection) {
          complete = false;
          issues.push(
            issue(
              environment,
              "pagination-limit",
              operation,
              response.status,
              surface,
            ),
          );
          return "stop";
        }
        return "continue";
      },
    });
    data[surface] = rows;
    receipts.push({ surface, availability, complete, rowCount });
  }

  return { data, receipts, issues };
}

function rowsFor(data: RawSurfaceData, surface: PageSurface): UnknownRow[] {
  const value = data[surface];
  return Array.isArray(value) ? (value.filter(isObject) as UnknownRow[]) : [];
}

function singletonFor(
  data: RawSurfaceData,
  surface: SingletonSurface,
): UnknownRow | null {
  const value = data[surface];
  return isObject(value) ? value : null;
}

function markNormalizationFailure(
  issues: DirectusReadIssue[],
  environment: CmsEnvironment,
  surface: DirectusReadSurface,
  raw: UnknownRow,
): void {
  let entityKey: string = surface;
  try {
    entityKey = rowKey(raw.id);
  } catch {
    // The issue schema deliberately carries no rejected row content.
  }
  issues.push(
    issue(
      environment,
      "response-invalid",
      `normalize:${surface}`,
      200,
      entityKey,
    ),
  );
}

function normalizeSafetyReport(value: unknown): NormalizedSvgSafetyReport {
  if (value === null || value === undefined) {
    return {
      state: "unknown",
      reasons: [],
      policy: null,
      sourceSha256: null,
      sanitizerSignature: null,
      sanitizedOutputSha256: null,
      transformSignature: null,
    };
  }
  if (!isObject(value)) throw new TypeError("safety_report must be an object");
  const state = requiredString(value.state, "safety_report.state");
  if (
    !["not-applicable", "unknown", "declared-safe", "rejected"].includes(state)
  ) {
    throw new TypeError("safety_report.state is invalid");
  }
  return {
    state: state as NormalizedSvgSafetyReport["state"],
    reasons:
      normalizeStringSet(value.reasons, "safety_report.reasons", false) ?? [],
    policy: nullableString(value.policy, "safety_report.policy"),
    sourceSha256: normalizeHash(
      value.sourceSha256,
      "safety_report.sourceSha256",
      true,
    ),
    sanitizerSignature: normalizeHash(
      value.sanitizerSignature,
      "safety_report.sanitizerSignature",
      true,
    ),
    sanitizedOutputSha256: normalizeHash(
      value.sanitizedOutputSha256,
      "safety_report.sanitizedOutputSha256",
      true,
    ),
    transformSignature: normalizeHash(
      value.transformSignature,
      "safety_report.transformSignature",
      true,
    ),
  };
}

function normalizeDependencyHashes(
  value: unknown,
): Readonly<Record<string, Sha256Hex>> | null {
  if (value === null || value === undefined) return null;
  if (!isObject(value))
    throw new TypeError("dependency_hashes must be an object or null");
  const result: Record<string, Sha256Hex> = {};
  for (const key of Object.keys(value).sort(compareUtf8)) {
    const normalizedKey = requiredString(key, "dependency_hashes key");
    const dependencyHash = requiredString(
      value[key],
      `dependency_hashes.${key}`,
    );
    result[normalizedKey] = normalizeHash(
      dependencyHash,
      `dependency_hashes.${key}`,
    ) as Sha256Hex;
  }
  return result;
}

function normalizeRecords(
  rows: UnknownRow[],
  environment: CmsEnvironment,
  issues: DirectusReadIssue[],
): NormalizedAssetRecord[] {
  const output: NormalizedAssetRecord[] = [];
  for (const raw of rows) {
    try {
      const kind = normalizedEnum<AssetKind>(raw.kind, ASSET_KIND_SET, "kind");
      const role = normalizedEnum<AssetRole>(raw.role, ASSET_ROLE_SET, "role");
      const deliveryMode = normalizedEnum<AssetDeliveryMode>(
        raw.delivery_mode,
        ASSET_DELIVERY_MODE_SET,
        "delivery_mode",
      );
      const allowed = normalizeStringSet(
        raw.allowed_mime_families,
        "allowed_mime_families",
      );
      if (
        allowed?.some(
          (value) =>
            !/^[a-z0-9!#$&^_.+-]+\/(?:[a-z0-9!#$&^_.+-]+|\*)$/i.test(value),
        )
      ) {
        throw new TypeError(
          "allowed_mime_families contains an invalid MIME family",
        );
      }
      output.push({
        id: rowKey(raw.id),
        environment,
        semantic_key: parseAssetSemanticKey(
          requiredString(raw.semantic_key, "semantic_key"),
        ),
        title: requiredString(raw.title, "title"),
        meaning: nullableString(raw.meaning, "meaning"),
        kind,
        role,
        lifecycle_status: normalizedEnum<AssetLifecycleStatus>(
          raw.lifecycle_status,
          ASSET_LIFECYCLE_STATUS_SET,
          "lifecycle_status",
        ),
        code_component_key: nullableString(
          raw.code_component_key,
          "code_component_key",
        ),
        owner_type: normalizedEnum<AssetOwnerType>(
          raw.owner_type,
          ASSET_OWNER_TYPE_SET,
          "owner_type",
        ),
        owner_key: requiredString(raw.owner_key, "owner_key"),
        locale_policy: normalizedEnum<AssetLocalePolicy>(
          raw.locale_policy,
          ASSET_LOCALE_POLICY_SET,
          "locale_policy",
        ),
        alt_mode: normalizedEnum<AssetAltMode>(
          raw.alt_mode,
          ASSET_ALT_MODE_SET,
          "alt_mode",
        ),
        aspect_ratio_mode: normalizedEnum<AssetAspectRatioMode>(
          raw.aspect_ratio_mode,
          ASSET_ASPECT_RATIO_MODE_SET,
          "aspect_ratio_mode",
        ),
        aspect_ratio_width: nullableNumber(
          raw.aspect_ratio_width,
          "aspect_ratio_width",
        ),
        aspect_ratio_height: nullableNumber(
          raw.aspect_ratio_height,
          "aspect_ratio_height",
        ),
        allowed_mime_families: allowed,
        transform_profile: nullableString(
          raw.transform_profile,
          "transform_profile",
        ),
        delivery_mode: deliveryMode,
        focal_point_x: nullableNumber(raw.focal_point_x, "focal_point_x"),
        focal_point_y: nullableNumber(raw.focal_point_y, "focal_point_y"),
        max_bytes: nullableInteger(raw.max_bytes, "max_bytes"),
        brand_status: normalizedEnum<AssetBrandStatus>(
          raw.brand_status,
          ASSET_BRAND_STATUS_SET,
          "brand_status",
        ),
        approved_token_slots: normalizeStringSet(
          raw.approved_token_slots,
          "approved_token_slots",
        ),
        candidate_version: relationId(
          raw.candidate_version,
          "candidate_version",
        ),
        approved_version: relationId(raw.approved_version, "approved_version"),
        date_created: nullableString(raw.date_created, "date_created"),
        date_updated: nullableString(raw.date_updated, "date_updated"),
        user_created: relationId(raw.user_created, "user_created"),
        user_updated: relationId(raw.user_updated, "user_updated"),
      });
    } catch {
      markNormalizationFailure(issues, environment, "asset_records", raw);
    }
  }
  return output;
}

function normalizeTranslations(
  rows: UnknownRow[],
  environment: CmsEnvironment,
  issues: DirectusReadIssue[],
): NormalizedAssetTranslation[] {
  const output: NormalizedAssetTranslation[] = [];
  for (const raw of rows) {
    try {
      output.push({
        id: rowKey(raw.id),
        environment,
        asset_records_id: relationId(raw.asset_records_id, "asset_records_id")!,
        languages_code: requiredString(raw.languages_code, "languages_code"),
        alt_text: nullableString(raw.alt_text, "alt_text"),
        caption: nullableString(raw.caption, "caption"),
        credit: nullableString(raw.credit, "credit"),
        og_image_alt: nullableString(raw.og_image_alt, "og_image_alt"),
      });
      if (!output.at(-1)?.asset_records_id)
        throw new TypeError("asset_records_id required");
    } catch {
      output.pop();
      markNormalizationFailure(
        issues,
        environment,
        "asset_records_translations",
        raw,
      );
    }
  }
  return output;
}

function normalizeVersions(
  rows: UnknownRow[],
  environment: CmsEnvironment,
  issues: DirectusReadIssue[],
): NormalizedAssetVersion[] {
  const output: NormalizedAssetVersion[] = [];
  for (const raw of rows) {
    try {
      const assetRecord = relationId(raw.asset_record, "asset_record");
      if (!assetRecord) throw new TypeError("asset_record is required");
      output.push({
        id: rowKey(raw.id),
        environment,
        asset_record: assetRecord,
        version_number: requiredInteger(raw.version_number, "version_number"),
        source_mode: normalizedEnum<AssetVersionSourceMode>(
          raw.source_mode,
          ASSET_VERSION_SOURCE_MODE_SET,
          "source_mode",
        ),
        directus_file: relationId(raw.directus_file, "directus_file"),
        component_key: nullableString(raw.component_key, "component_key"),
        sha256: normalizeHash(raw.sha256, "sha256") as Sha256Hex,
        mime_type: nullableString(raw.mime_type, "mime_type"),
        format: nullableString(raw.format, "format"),
        bytes: nullableInteger(raw.bytes, "bytes"),
        width: nullableInteger(raw.width, "width"),
        height: nullableInteger(raw.height, "height"),
        duration_ms: nullableInteger(raw.duration_ms, "duration_ms"),
        orientation: nullableString(raw.orientation, "orientation"),
        color_profile: nullableString(raw.color_profile, "color_profile"),
        is_animated: nullableBoolean(raw.is_animated, "is_animated"),
        source_hash: normalizeHash(raw.source_hash, "source_hash", true),
        dependency_hashes: normalizeDependencyHashes(raw.dependency_hashes),
        transform_profile: nullableString(
          raw.transform_profile,
          "transform_profile",
        ),
        transform_signature: normalizeHash(
          raw.transform_signature,
          "transform_signature",
          true,
        ),
        sanitizer_signature: normalizeHash(
          raw.sanitizer_signature,
          "sanitizer_signature",
          true,
        ),
        generator_signature: normalizeHash(
          raw.generator_signature,
          "generator_signature",
          true,
        ),
        toolchain_signature: normalizeHash(
          raw.toolchain_signature,
          "toolchain_signature",
          true,
        ),
        approval_status: normalizedEnum<AssetVersionApprovalStatus>(
          raw.approval_status,
          ASSET_VERSION_APPROVAL_STATUS_SET,
          "approval_status",
        ),
        approved_by: relationId(raw.approved_by, "approved_by"),
        approved_at: nullableString(raw.approved_at, "approved_at"),
        replaces_version: relationId(raw.replaces_version, "replaces_version"),
        replacement_reason: nullableString(
          raw.replacement_reason,
          "replacement_reason",
        ),
        promotion_request_id: nullableString(
          raw.promotion_request_id,
          "promotion_request_id",
        ),
        quarantine_reason: nullableString(
          raw.quarantine_reason,
          "quarantine_reason",
        ),
        sanitized_output_sha256: normalizeHash(
          raw.sanitized_output_sha256,
          "sanitized_output_sha256",
          true,
        ),
        input_hash: normalizeHash(raw.input_hash, "input_hash", true),
        brand_slots: normalizeStringSet(raw.brand_slots, "brand_slots"),
        svg_id_prefix: nullableString(raw.svg_id_prefix, "svg_id_prefix"),
        template_version: nullableString(
          raw.template_version,
          "template_version",
        ),
        safety_report: normalizeSafetyReport(raw.safety_report),
        date_created: nullableString(raw.date_created, "date_created"),
        user_created: relationId(raw.user_created, "user_created"),
      });
    } catch {
      markNormalizationFailure(issues, environment, "asset_versions", raw);
    }
  }
  return output;
}

function normalizeStoredUsages(
  rows: UnknownRow[],
  environment: CmsEnvironment,
  issues: DirectusReadIssue[],
): NormalizedStoredUsage[] {
  const consumerTypes = new Set([
    "site",
    "route",
    "service",
    "project",
    "blog",
    "page-block",
    "component",
    "style",
    "system",
  ]);
  const sourceKinds = new Set([
    "repository",
    "generated",
    "cms",
    "route",
    "declaration",
  ]);
  const output: NormalizedStoredUsage[] = [];
  for (const raw of rows) {
    try {
      const consumerType = requiredString(raw.consumer_type, "consumer_type");
      const sourceKind = requiredString(raw.source_kind, "source_kind");
      const confidence = normalizedEnum<StoredUsageConfidence>(
        raw.confidence,
        STORED_USAGE_CONFIDENCE_SET,
        "confidence",
      );
      const locale =
        raw.locale === null || raw.locale === undefined
          ? null
          : normalizedEnum<CmsContentLocale>(
              raw.locale,
              CMS_CONTENT_LOCALE_SET,
              "locale",
            );
      if (!consumerTypes.has(consumerType) || !sourceKinds.has(sourceKind)) {
        throw new TypeError("usage enum is invalid");
      }
      const deliveryMode = normalizedEnum<AssetDeliveryMode>(
        raw.delivery_mode,
        ASSET_DELIVERY_MODE_SET,
        "delivery_mode",
      );
      output.push({
        id: requiredString(raw.id, "id"),
        environment,
        asset_record: relationId(raw.asset_record, "asset_record"),
        resolved_version: relationId(raw.resolved_version, "resolved_version"),
        unresolved_ref: nullableString(raw.unresolved_ref, "unresolved_ref"),
        scan_run_id: requiredString(raw.scan_run_id, "scan_run_id"),
        last_seen_manifest_sha256: normalizeHash(
          raw.last_seen_manifest_sha256,
          "last_seen_manifest_sha256",
        ) as Sha256Hex,
        confidence,
        consumer_type: consumerType as NormalizedStoredUsage["consumer_type"],
        consumer_key: requiredString(raw.consumer_key, "consumer_key"),
        source_kind: sourceKind as NormalizedStoredUsage["source_kind"],
        source_file: requiredString(raw.source_file, "source_file"),
        cms_field: nullableString(raw.cms_field, "cms_field"),
        source_line: nullableInteger(raw.source_line, "source_line"),
        route: nullableString(raw.route, "route"),
        locale,
        slot: requiredString(raw.slot, "slot"),
        required: requiredBoolean(raw.required, "required"),
        delivery_mode: deliveryMode,
        alt_text_override: nullableString(
          raw.alt_text_override,
          "alt_text_override",
        ),
        alt_source: nullableString(raw.alt_source, "alt_source"),
        active: requiredBoolean(raw.active, "active"),
        first_seen: requiredString(raw.first_seen, "first_seen"),
        last_seen: requiredString(raw.last_seen, "last_seen"),
        date_updated: nullableString(raw.date_updated, "date_updated"),
      });
    } catch {
      markNormalizationFailure(issues, environment, "asset_usages", raw);
    }
  }
  return output;
}

function normalizePresets(
  singleton: UnknownRow | null,
  environment: CmsEnvironment,
  issues: DirectusReadIssue[],
): NormalizedTransformPreset[] {
  if (!singleton || singleton.storage_asset_presets === null) return [];
  if (!Array.isArray(singleton.storage_asset_presets)) {
    issues.push(
      issue(
        environment,
        "response-invalid",
        "normalize:directus_settings.storage_asset_presets",
        200,
        "directus_settings.storage_asset_presets",
      ),
    );
    return [];
  }
  const output: NormalizedTransformPreset[] = [];
  const seen = new Set<string>();
  for (const raw of singleton.storage_asset_presets) {
    try {
      if (!isObject(raw)) throw new TypeError("preset must be an object");
      const key = requiredString(raw.key, "preset.key");
      if (seen.has(key)) throw new TypeError("duplicate preset key");
      seen.add(key);
      output.push({
        key,
        fit: nullableString(raw.fit, "preset.fit"),
        width: nullableInteger(raw.width, "preset.width"),
        height: nullableInteger(raw.height, "preset.height"),
        quality: nullableInteger(raw.quality, "preset.quality"),
        format: nullableString(raw.format, "preset.format"),
        withoutEnlargement: nullableBoolean(
          raw.withoutEnlargement,
          "preset.withoutEnlargement",
        ),
      });
    } catch {
      issues.push(
        issue(
          environment,
          "response-invalid",
          "normalize:directus_settings.storage_asset_presets",
          200,
          "directus_settings.storage_asset_presets",
        ),
      );
    }
  }
  return output;
}

function normalizeFolders(
  rows: UnknownRow[],
  environment: CmsEnvironment,
  issues: DirectusReadIssue[],
): NormalizedCmsFolder[] {
  const pending: Array<Omit<NormalizedCmsFolder, "path">> = [];
  for (const raw of rows) {
    try {
      pending.push({
        environment,
        id: rowKey(raw.id),
        name: requiredString(raw.name, "folder.name"),
        parentId: relationId(raw.parent, "folder.parent"),
      });
    } catch {
      markNormalizationFailure(issues, environment, "directus_folders", raw);
    }
  }
  const byId = new Map(pending.map((folder) => [folder.id, folder]));
  const cache = new Map<string, string | null>();
  const invalid = new Set<string>();
  const pathFor = (id: string, visiting: Set<string>): string | null => {
    if (cache.has(id)) return cache.get(id) ?? null;
    const folder = byId.get(id);
    if (!folder) return null;
    if (visiting.has(id)) {
      for (const cycleId of visiting) invalid.add(cycleId);
      return null;
    }
    const next = new Set(visiting);
    next.add(id);
    if (
      folder.name.includes("/") ||
      folder.name === "." ||
      folder.name === ".."
    ) {
      invalid.add(id);
      cache.set(id, null);
      return null;
    }
    if (folder.parentId === null) {
      cache.set(id, folder.name);
      return folder.name;
    }
    if (!byId.has(folder.parentId)) {
      invalid.add(id);
      cache.set(id, null);
      return null;
    }
    const parentPath = pathFor(folder.parentId, next);
    if (parentPath === null) {
      invalid.add(id);
      cache.set(id, null);
      return null;
    }
    const path = `${parentPath}/${folder.name}`;
    cache.set(id, path);
    return path;
  };
  const output = pending.map((folder) => ({
    ...folder,
    path: pathFor(folder.id, new Set()),
  }));
  for (const folder of output) {
    if (folder.path === null) invalid.add(folder.id);
  }
  for (const id of invalid) {
    issues.push(
      issue(
        environment,
        "response-invalid",
        "normalize:directus_folders",
        200,
        id,
      ),
    );
  }
  return output;
}

function parseDeclaredBytes(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string" || !/^(?:0|[1-9][0-9]*)$/.test(value)) {
    throw new TypeError("filesize must be a non-negative integer string");
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed))
    throw new TypeError("filesize exceeds safe integer range");
  return parsed;
}

interface PendingFile extends Omit<NormalizedCmsFile, "sha256" | "hashState"> {
  sha256: Sha256Hex | null;
  hashState: NormalizedCmsFile["hashState"];
}

function normalizeFileRows(
  rows: UnknownRow[],
  folders: readonly NormalizedCmsFolder[],
  environment: CmsEnvironment,
  issues: DirectusReadIssue[],
): PendingFile[] {
  const folderPaths = new Map(
    folders.map((folder) => [folder.id, folder.path]),
  );
  const output: PendingFile[] = [];
  for (const raw of rows) {
    try {
      const fileId = rowKey(raw.id);
      const folderId = relationId(raw.folder, "file.folder");
      const tags = normalizeStringList(raw.tags, "file.tags");
      const metadata = nullableJsonObject(raw.metadata, "file.metadata");
      output.push({
        id: `directus-file:${environment}:${fileId}`,
        environment,
        fileId,
        storage: requiredString(raw.storage, "file.storage"),
        filenameDisk: nullableString(raw.filename_disk, "file.filename_disk"),
        filenameDownload: requiredString(
          raw.filename_download,
          "file.filename_download",
        ),
        title: nullableString(raw.title, "file.title"),
        mimeType: nullableString(raw.type, "file.type"),
        folderId,
        folderPath:
          folderId === null ? null : (folderPaths.get(folderId) ?? null),
        legacyPath: nullableString(raw.legacy_path, "file.legacy_path"),
        declaredBytes: parseDeclaredBytes(raw.filesize),
        observedBytes: null,
        width: nullableInteger(raw.width, "file.width"),
        height: nullableInteger(raw.height, "file.height"),
        durationMs: nullableInteger(raw.duration, "file.duration"),
        description: nullableString(raw.description, "file.description"),
        tags,
        metadata,
        sha256: null,
        hashState: "failed",
      });
    } catch {
      markNormalizationFailure(issues, environment, "directus_files", raw);
    }
  }
  return output;
}

interface DownloadResult {
  fileId: string;
  status: number | null;
  bytes: ArrayBuffer | null;
}

async function downloadFiles(
  files: PendingFile[],
  environment: CmsEnvironment,
  client: CmsReadClient,
  limits: DirectusReadLimits,
  issues: DirectusReadIssue[],
): Promise<NormalizedCmsFile[]> {
  const sorted = [...files].sort((left, right) =>
    compareUtf8(left.fileId, right.fileId),
  );
  const eligible: PendingFile[] = [];
  for (const file of sorted) {
    if (
      file.declaredBytes !== null &&
      file.declaredBytes > limits.maxFileBytes
    ) {
      file.hashState = "skipped-file-size-limit";
      issues.push(
        issue(
          environment,
          "download-file-size-limit",
          "readAsset",
          null,
          file.fileId,
        ),
      );
    } else {
      eligible.push(file);
    }
  }
  const attempted = eligible.slice(0, limits.maxFiles);
  for (const file of eligible.slice(limits.maxFiles)) {
    file.hashState = "skipped-file-count-limit";
    issues.push(
      issue(
        environment,
        "download-file-count-limit",
        "readAsset",
        null,
        file.fileId,
      ),
    );
  }

  const readFile = async (file: PendingFile): Promise<DownloadResult> => {
    try {
      const response = await client.readAsset(file.fileId, limits.maxFileBytes);
      return {
        fileId: file.fileId,
        status: Number.isInteger(response.status) ? response.status : null,
        bytes: response.bytes instanceof ArrayBuffer ? response.bytes : null,
      };
    } catch {
      return { fileId: file.fileId, status: null, bytes: null };
    }
  };
  const inFlight = new Map<number, Promise<DownloadResult>>();
  const windowSize = Math.min(limits.maxConcurrentDownloads, attempted.length);
  let nextToStart = 0;
  const startNext = (): void => {
    if (nextToStart >= attempted.length) return;
    const index = nextToStart++;
    inFlight.set(index, readFile(attempted[index]!));
  };
  for (let index = 0; index < windowSize; index += 1) startNext();

  let totalHashedBytes = 0;
  for (let index = 0; index < attempted.length; index += 1) {
    const file = attempted[index]!;
    const pending = inFlight.get(index);
    const result = pending ? await pending : null;
    inFlight.delete(index);
    if (
      !result ||
      result.status === null ||
      result.status < 200 ||
      result.status >= 300 ||
      !result.bytes
    ) {
      file.hashState =
        result?.status === 401 || result?.status === 403
          ? "forbidden"
          : "failed";
      issues.push(
        issue(
          environment,
          "download-failed",
          "readAsset",
          result?.status ?? null,
          file.fileId,
        ),
      );
      if (result) result.bytes = null;
      startNext();
      continue;
    }
    const observedBytes = result.bytes.byteLength;
    file.observedBytes = observedBytes;
    if (file.declaredBytes !== null && file.declaredBytes !== observedBytes) {
      issues.push(
        issue(
          environment,
          "download-size-mismatch",
          "readAsset",
          result.status,
          file.fileId,
        ),
      );
    }
    if (observedBytes > limits.maxFileBytes) {
      file.hashState = "skipped-file-size-limit";
      issues.push(
        issue(
          environment,
          "download-file-size-limit",
          "readAsset",
          result.status,
          file.fileId,
        ),
      );
      result.bytes = null;
      startNext();
      continue;
    }
    if (totalHashedBytes + observedBytes > limits.maxTotalFileBytes) {
      file.hashState = "skipped-total-size-limit";
      issues.push(
        issue(
          environment,
          "download-total-size-limit",
          "readAsset",
          result.status,
          file.fileId,
        ),
      );
      result.bytes = null;
      startNext();
      continue;
    }
    totalHashedBytes += observedBytes;
    file.sha256 = createHash("sha256")
      .update(new Uint8Array(result.bytes))
      .digest("hex") as Sha256Hex;
    file.hashState = "verified";
    result.bytes = null;
    startNext();
  }
  return files;
}

interface ReferenceContext {
  environment: CmsEnvironment;
  collection: string;
  itemKey: string;
  field: string;
  ordinal?: number;
  ownerType: NormalizedCmsReference["ownerType"];
  ownerKey: string;
  route: string | null;
  locale?: string | null;
  active: boolean | null;
  consumption?: NormalizedCmsReference["consumption"];
  slot: string;
  required: boolean;
  deliveryMode: AssetDeliveryMode;
  contextualAlt?: string | null;
  altSource?: string | null;
}

interface ClassifiedMedia {
  referenceKind: NormalizedCmsReference["referenceKind"];
  fileId: string | null;
  rawRef: string;
}

function classifyMediaString(value: string): ClassifiedMedia {
  const rawRef = normalizeText(value);
  if (UUID_PATTERN.test(rawRef)) {
    return { referenceKind: "embedded-asset-url", fileId: rawRef, rawRef };
  }
  const assetMatch = rawRef.match(/^\/assets\/([0-9a-f-]{36})(?:[?#].*)?$/);
  if (assetMatch?.[1] && UUID_PATTERN.test(assetMatch[1])) {
    return {
      referenceKind: "embedded-asset-url",
      fileId: assetMatch[1],
      rawRef,
    };
  }
  if (
    /^(?:\/(?:images|svg|og|brand)\/|\/favicon(?:\.|$)|apps\/web\/static\/|apps\/cms\/brand\/|\$lib\/)/.test(
      rawRef,
    )
  ) {
    return { referenceKind: "repository-path", fileId: null, rawRef };
  }
  if (/^https?:\/\//i.test(rawRef)) {
    return { referenceKind: "external-url", fileId: null, rawRef };
  }
  return { referenceKind: "unresolved-media", fileId: null, rawRef };
}

function referenceId(
  context: ReferenceContext,
  kind: NormalizedCmsReference["referenceKind"],
): string {
  return [
    "cms",
    context.environment,
    context.collection,
    context.itemKey,
    context.field,
    String(context.ordinal ?? 0),
    context.slot,
    kind,
  ].join(":");
}

function pushReference(
  references: NormalizedCmsReference[],
  context: ReferenceContext,
  evidence: Omit<ClassifiedMedia, "rawRef"> & { rawRef: string | null },
): void {
  references.push({
    id: referenceId(context, evidence.referenceKind),
    environment: context.environment,
    collection: context.collection,
    itemKey: context.itemKey,
    field: context.field,
    ordinal: context.ordinal ?? 0,
    ownerType: context.ownerType,
    ownerKey: context.ownerKey,
    route: context.route,
    locale: context.locale ?? null,
    active: context.active,
    consumption: context.consumption ?? "rendered",
    slot: context.slot,
    required: context.required,
    deliveryMode: context.deliveryMode,
    referenceKind: evidence.referenceKind,
    fileId: evidence.fileId,
    rawRef: evidence.rawRef,
    contextualAlt: context.contextualAlt ?? null,
    altSource: context.altSource ?? null,
  });
}

function pushTypedReference(
  references: NormalizedCmsReference[],
  context: ReferenceContext,
  value: unknown,
  kind: "typed-file-relation" | "block-file-id" = "typed-file-relation",
  emitMissing = false,
): void {
  const fileId = relationId(value, `${context.collection}.${context.field}`);
  if (fileId === null) {
    if (emitMissing) {
      pushReference(references, context, {
        referenceKind: "unresolved-media",
        fileId: null,
        rawRef: null,
      });
    }
    return;
  }
  pushReference(references, context, {
    referenceKind: kind,
    fileId,
    rawRef: null,
  });
}

function pushStringReference(
  references: NormalizedCmsReference[],
  context: ReferenceContext,
  value: unknown,
  emitMissing = false,
): void {
  if (value === null || value === undefined || value === "") {
    if (emitMissing) {
      pushReference(references, context, {
        referenceKind: "unresolved-media",
        fileId: null,
        rawRef: null,
      });
    }
    return;
  }
  const raw = requiredString(value, `${context.collection}.${context.field}`);
  pushReference(references, context, classifyMediaString(raw));
}

function pushRelatedReference(
  references: NormalizedCmsReference[],
  context: ReferenceContext,
  value: unknown,
  kind: "related-icon" | "related-illustration",
): string | null {
  const id = relationId(value, `${context.collection}.${context.field}`);
  if (id === null) return null;
  pushReference(references, context, {
    referenceKind: kind,
    fileId: null,
    rawRef: id,
  });
  return id;
}

function unknownBlockRawRef(block: UnknownRow): string {
  if (isObject(block.data)) {
    for (const key of ["url", "src", "fileId"] as const) {
      const value = block.data[key];
      if (typeof value === "string" && value) return normalizeText(value);
    }
  }
  return `block:${rowKey(block.id, "block.id")}:${requiredString(block.type, "block.type")}`;
}

function walkBlockEditor(
  references: NormalizedCmsReference[],
  context: Omit<ReferenceContext, "ordinal" | "slot"> & { field: string },
  value: unknown,
): void {
  if (value === null || value === undefined) return;
  if (!isObject(value) || !Array.isArray(value.blocks)) {
    throw new TypeError(
      `${context.collection}.${context.field} must be a Block Editor document`,
    );
  }
  value.blocks.forEach((rawBlock, blockIndex) => {
    if (!isObject(rawBlock))
      throw new TypeError("Block Editor block must be an object");
    const blockId = rowKey(rawBlock.id, "block.id");
    const type = requiredString(rawBlock.type, "block.type");
    if (type === "image") {
      if (!isObject(rawBlock.data) || !isObject(rawBlock.data.file)) {
        throw new TypeError("image block file must be an object");
      }
      nullableString(rawBlock.data.caption, "image.caption");
      const base = {
        ...context,
        ordinal: blockIndex,
        contextualAlt: null,
        altSource: null,
      };
      pushTypedReference(
        references,
        { ...base, slot: `${context.field}:${blockId}:main` },
        rawBlock.data.file.fileId,
        "block-file-id",
      );
      const mainUrl = rawBlock.data.file.url;
      if (typeof mainUrl === "string" && /^\/assets\//.test(mainUrl)) {
        pushStringReference(
          references,
          { ...base, slot: `${context.field}:${blockId}:main` },
          mainUrl,
        );
      }
      if (
        isObject(rawBlock.data.variants) &&
        isObject(rawBlock.data.variants.light)
      ) {
        const light = rawBlock.data.variants.light;
        pushTypedReference(
          references,
          { ...base, slot: `${context.field}:${blockId}:light` },
          light.fileId,
          "block-file-id",
        );
        if (typeof light.url === "string" && /^\/assets\//.test(light.url)) {
          pushStringReference(
            references,
            { ...base, slot: `${context.field}:${blockId}:light` },
            light.url,
          );
        }
      }
      return;
    }
    if (type === "media" || type === "embed") {
      const blockContext: ReferenceContext = {
        ...context,
        ordinal: blockIndex,
        slot: `${context.field}:${blockId}:main`,
      };
      pushReference(references, blockContext, {
        referenceKind: "unresolved-media",
        fileId: null,
        rawRef: unknownBlockRawRef(rawBlock),
      });
    }
  });
}

function publicPageMaps(sitePageRows: UnknownRow[]): {
  byId: Map<string, { path: string; active: boolean }>;
  isPublic: (path: string) => boolean;
} {
  const byId = new Map<string, { path: string; active: boolean }>();
  const byPath = new Map<string, boolean>();
  for (const row of sitePageRows) {
    try {
      const id = rowKey(row.id);
      const path = requiredString(row.path, "site_pages.path");
      const active = row.status === "published";
      byId.set(id, { path, active });
      byPath.set(path, active);
    } catch {
      // Structural errors are already represented by normalization issues later.
    }
  }
  return { byId, isPublic: (path: string) => byPath.get(path) === true };
}

function normalizeContentReferences(
  data: RawSurfaceData,
  environment: CmsEnvironment,
  issues: DirectusReadIssue[],
): NormalizedCmsReference[] {
  const references: NormalizedCmsReference[] = [];
  const pageMaps = publicPageMaps(rowsFor(data, "site_pages"));
  const pagePublic = pageMaps.isPublic;
  const iconActivity = new Map<string, boolean>();
  const illustrationActivity = new Map<string, boolean>();
  const markActivity = (
    map: Map<string, boolean>,
    id: string | null,
    active: boolean,
  ) => {
    if (id !== null) map.set(id, (map.get(id) ?? false) || active);
  };
  const protect = (
    surface: DirectusReadSurface,
    row: UnknownRow,
    operation: () => void,
  ) => {
    try {
      operation();
    } catch {
      markNormalizationFailure(issues, environment, surface, row);
    }
  };

  const siteMeta = singletonFor(data, "site_meta");
  if (siteMeta) {
    protect("site_meta", siteMeta, () => {
      pushTypedReference(
        references,
        {
          environment,
          collection: "site_meta",
          itemKey: rowKey(siteMeta.id),
          field: "default_og_image",
          ownerType: "site",
          ownerKey: "site",
          route: "/",
          active: true,
          slot: "og-image",
          required: true,
          deliveryMode: "og-meta",
        },
        siteMeta.default_og_image,
        "typed-file-relation",
        true,
      );
    });
  }

  for (const row of rowsFor(data, "route_seo")) {
    protect("route_seo", row, () => {
      const itemKey = rowKey(row.id);
      const path = requiredString(row.path, "route_seo.path");
      pushTypedReference(
        references,
        {
          environment,
          collection: "route_seo",
          itemKey,
          field: "og_image",
          ownerType: "route",
          ownerKey: path,
          route: path,
          active: row.status === "published" && pagePublic(path),
          slot: "og-image",
          required: false,
          deliveryMode: "og-meta",
        },
        row.og_image,
      );
    });
  }

  for (const row of rowsFor(data, "about_languages")) {
    protect("about_languages", row, () => {
      const id = rowKey(row.id);
      if (!Array.isArray(row.translations)) {
        throw new TypeError("about_languages.translations must be an array");
      }
      row.translations.forEach((translation, index) => {
        if (!isObject(translation))
          throw new TypeError("translation must be an object");
        const locale = requiredString(
          translation.languages_code,
          "languages_code",
        );
        const label = requiredString(translation.label, "label");
        pushTypedReference(
          references,
          {
            environment,
            collection: "about_languages",
            itemKey: id,
            field: "image",
            ordinal: index,
            ownerType: "page-block",
            ownerKey: `about-language:${id}`,
            route: "/about",
            locale,
            active: row.status === "published" && pagePublic("/about"),
            slot: "language-flag",
            required: true,
            deliveryMode: "local-img",
            contextualAlt: label,
            altSource: `about_languages.translations[${index}].label`,
          },
          row.image,
          "typed-file-relation",
          true,
        );
      });
    });
  }

  for (const row of rowsFor(data, "blog_posts")) {
    protect("blog_posts", row, () => {
      const id = rowKey(row.id);
      const ownerKey =
        nullableString(row.translation_key, "translation_key") || id;
      const locale = nullableString(row.lang, "lang");
      const external = row.external === true;
      const externalUrl = nullableString(row.url, "url");
      const route = external && externalUrl ? externalUrl : `/blog/${id}`;
      const active = row.status === "published" && pagePublic("/blog");
      pushTypedReference(
        references,
        {
          environment,
          collection: "blog_posts",
          itemKey: id,
          field: "cover_image",
          ownerType: "blog",
          ownerKey,
          route,
          locale,
          active,
          slot: "og-image",
          required: false,
          deliveryMode: "og-meta",
        },
        row.cover_image,
      );
      const illustrationId = pushRelatedReference(
        references,
        {
          environment,
          collection: "blog_posts",
          itemKey: id,
          field: "svg_illustration",
          ownerType: "blog",
          ownerKey,
          route,
          locale,
          active,
          slot: "illustration",
          required: false,
          deliveryMode: "code-component",
        },
        row.svg_illustration,
        "related-illustration",
      );
      markActivity(illustrationActivity, illustrationId, active);
      walkBlockEditor(
        references,
        {
          environment,
          collection: "blog_posts",
          itemKey: id,
          field: "body",
          ownerType: "blog",
          ownerKey,
          route,
          locale,
          active,
          required: false,
          deliveryMode: "local-img",
        },
        row.body,
      );
    });
  }

  const projectRows = rowsFor(data, "projects");
  const projectTranslations = rowsFor(data, "projects_translations");
  const projectById = new Map<string, { active: boolean; route: string }>();
  const projectTranslationByParent = new Map<
    string,
    Array<{ locale: string; title: string; ordinal: number }>
  >();
  projectTranslations.forEach((row, ordinal) => {
    try {
      const parentId = relationId(row.projects_id, "projects_id");
      if (!parentId) return;
      const values = projectTranslationByParent.get(parentId) ?? [];
      values.push({
        locale: requiredString(row.languages_code, "languages_code"),
        title: requiredString(row.title, "title"),
        ordinal,
      });
      projectTranslationByParent.set(parentId, values);
    } catch {
      markNormalizationFailure(
        issues,
        environment,
        "projects_translations",
        row,
      );
    }
  });
  for (const row of projectRows) {
    protect("projects", row, () => {
      const id = rowKey(row.id);
      const route = `/projects/${id}`;
      const active = row.status === "published" && pagePublic("/projects");
      projectById.set(id, { active, route });
      const translations = projectTranslationByParent.get(id) ?? [
        { locale: null, title: null, ordinal: 0 },
      ];
      const fieldPolicies = [
        ["hero_image", "hero-primary", true],
        ["hero_image_light", "hero-primary-light", true],
        ["hero_image_secondary", "hero-secondary", false],
        ["hero_image_secondary_light", "hero-secondary-light", false],
      ] as const;
      for (const [field, slot, required] of fieldPolicies) {
        translations.forEach((translation, localeOrdinal) => {
          pushTypedReference(
            references,
            {
              environment,
              collection: "projects",
              itemKey: id,
              field,
              ordinal: localeOrdinal,
              ownerType: "project",
              ownerKey: id,
              route,
              locale: translation.locale,
              active,
              slot,
              required,
              deliveryMode: "local-img",
              contextualAlt: translation.title,
              altSource:
                translation.title === null
                  ? null
                  : `projects_translations.title:${translation.locale}`,
            },
            row[field],
          );
        });
      }
      pushRelatedReference(
        references,
        {
          environment,
          collection: "projects",
          itemKey: id,
          field: "svg_illustration",
          ownerType: "project",
          ownerKey: id,
          route,
          active: false,
          consumption: "cms-intent-only",
          slot: "illustration",
          required: false,
          deliveryMode: "code-component",
        },
        row.svg_illustration,
        "related-illustration",
      );
    });
  }
  for (const row of projectTranslations) {
    protect("projects_translations", row, () => {
      const id = rowKey(row.id);
      const parentId = relationId(row.projects_id, "projects_id");
      if (!parentId) throw new TypeError("projects_id required");
      const parent = projectById.get(parentId);
      if (!parent) throw new TypeError("project parent missing");
      walkBlockEditor(
        references,
        {
          environment,
          collection: "projects_translations",
          itemKey: id,
          field: "description",
          ownerType: "project",
          ownerKey: parentId,
          route: parent.route,
          locale: requiredString(row.languages_code, "languages_code"),
          active: parent.active,
          required: false,
          deliveryMode: "local-img",
        },
        row.description,
      );
    });
  }

  const sectionParents = new Map<string, string>();
  for (const row of rowsFor(data, "projects_sections")) {
    protect("projects_sections", row, () => {
      const projectId = relationId(row.projects_id, "projects_id");
      if (!projectId) throw new TypeError("projects_id required");
      sectionParents.set(rowKey(row.id), projectId);
    });
  }
  for (const row of rowsFor(data, "projects_sections_translations")) {
    protect("projects_sections_translations", row, () => {
      const id = rowKey(row.id);
      const sectionId = relationId(
        row.projects_sections_id,
        "projects_sections_id",
      );
      if (!sectionId) throw new TypeError("projects_sections_id required");
      const projectId = sectionParents.get(sectionId);
      const parent = projectId ? projectById.get(projectId) : null;
      if (!projectId || !parent) throw new TypeError("section parent missing");
      walkBlockEditor(
        references,
        {
          environment,
          collection: "projects_sections_translations",
          itemKey: id,
          field: "content",
          ownerType: "project",
          ownerKey: projectId,
          route: parent.route,
          locale: requiredString(row.languages_code, "languages_code"),
          active: parent.active,
          required: false,
          deliveryMode: "local-img",
        },
        row.content,
      );
    });
  }

  for (const row of rowsFor(data, "services")) {
    protect("services", row, () => {
      const id = rowKey(row.id);
      const value = nullableString(row.svg, "services.svg");
      if (!value) return;
      if (value.includes("/") || value.includes("\\")) {
        throw new TypeError("services.svg must be a filename");
      }
      const context: ReferenceContext = {
        environment,
        collection: "services",
        itemKey: id,
        field: "svg",
        ownerType: "service",
        ownerKey: id,
        route: `/services/${id}`,
        active: row.visible === true && pagePublic("/services"),
        slot: "illustration",
        required: true,
        deliveryMode: "inline-svg",
      };
      pushReference(references, context, {
        referenceKind: "repository-path",
        fileId: null,
        rawRef: `apps/web/static/svg/services/${value}`,
      });
    });
  }

  const legalParents = new Map<string, { active: boolean; route: string }>();
  for (const row of rowsFor(data, "legal_pages")) {
    protect("legal_pages", row, () => {
      const id = rowKey(row.id);
      const route = `/legal/${id}`;
      legalParents.set(id, {
        route,
        active: row.status === "published" && pagePublic(route),
      });
    });
  }
  for (const row of rowsFor(data, "legal_pages_translations")) {
    protect("legal_pages_translations", row, () => {
      const id = rowKey(row.id);
      const parentId = relationId(row.legal_pages_id, "legal_pages_id");
      const parent = parentId ? legalParents.get(parentId) : null;
      if (!parentId || !parent) throw new TypeError("legal parent missing");
      walkBlockEditor(
        references,
        {
          environment,
          collection: "legal_pages_translations",
          itemKey: id,
          field: "body",
          ownerType: "route",
          ownerKey: `legal:${parentId}`,
          route: parent.route,
          locale: requiredString(row.languages_code, "languages_code"),
          active: parent.active,
          required: false,
          deliveryMode: "local-img",
        },
        row.body,
      );
    });
  }

  const archetypeActiveTech = new Set<string>();
  for (const row of rowsFor(data, "stack_archetypes")) {
    protect("stack_archetypes", row, () => {
      nullableString(row.icon, "stack_archetypes.icon");
      const active = row.status === "published" && pagePublic("/tech-stack");
      if (!Array.isArray(row.tech))
        throw new TypeError("stack_archetypes.tech must be an array");
      if (active) {
        for (const link of row.tech) {
          if (!isObject(link))
            throw new TypeError("stack archetype tech link invalid");
          const techId = relationId(link.tech_stack_id, "tech.tech_stack_id");
          if (techId) archetypeActiveTech.add(techId);
        }
      }
    });
  }
  const techParents = new Map<string, { active: boolean; route: string }>();
  for (const row of rowsFor(data, "tech_stack")) {
    protect("tech_stack", row, () => {
      const id = rowKey(row.id);
      const active =
        (row.status === "published" && pagePublic("/tech-stack")) ||
        archetypeActiveTech.has(id);
      techParents.set(id, { active, route: "/tech-stack" });
      const iconId = pushRelatedReference(
        references,
        {
          environment,
          collection: "tech_stack",
          itemKey: id,
          field: "icon_id",
          ownerType: "component",
          ownerKey: `tech:${id}`,
          route: "/tech-stack",
          active,
          slot: "icon",
          required: false,
          deliveryMode: "code-component",
        },
        row.icon_id,
        "related-icon",
      );
      markActivity(iconActivity, iconId, active);
    });
  }
  for (const row of rowsFor(data, "tech_stack_translations")) {
    protect("tech_stack_translations", row, () => {
      const id = rowKey(row.id);
      const parentId = relationId(row.tech_stack_id, "tech_stack_id");
      const parent = parentId ? techParents.get(parentId) : null;
      if (!parentId || !parent) throw new TypeError("tech parent missing");
      const locale = requiredString(row.languages_code, "languages_code");
      for (const field of [
        "what_it_is",
        "what_i_use_it_for",
        "why_i_use_it_instead",
      ] as const) {
        walkBlockEditor(
          references,
          {
            environment,
            collection: "tech_stack_translations",
            itemKey: id,
            field,
            ownerType: "component",
            ownerKey: `tech:${parentId}`,
            route: parent.route,
            locale,
            active: parent.active,
            required: false,
            deliveryMode: "local-img",
          },
          row[field],
        );
      }
    });
  }

  const about = singletonFor(data, "block_about_content");
  const aboutTranslations = rowsFor(data, "block_about_content_translations");
  const aboutTranslationData: Array<{
    row: UnknownRow;
    id: string;
    locale: string;
    name: string;
  }> = [];
  for (const row of aboutTranslations) {
    protect("block_about_content_translations", row, () => {
      aboutTranslationData.push({
        row,
        id: rowKey(row.id),
        locale: requiredString(row.languages_code, "languages_code"),
        name: requiredString(row.identity_name, "identity_name"),
      });
    });
  }
  if (about) {
    protect("block_about_content", about, () => {
      const itemKey = rowKey(about.id);
      const active = about.status === "published" && pagePublic("/about");
      const translations = aboutTranslationData.length
        ? aboutTranslationData
        : [{ row: {}, id: "default", locale: null, name: null }];
      translations.forEach((translation, ordinal) => {
        pushStringReference(
          references,
          {
            environment,
            collection: "block_about_content",
            itemKey,
            field: "headshot",
            ordinal,
            ownerType: "page-block",
            ownerKey: "about",
            route: "/about",
            locale: translation.locale,
            active,
            slot: "headshot",
            required: true,
            deliveryMode: "local-img",
            contextualAlt: translation.name,
            altSource:
              translation.name === null
                ? null
                : `block_about_content_translations.identity_name:${translation.locale}`,
          },
          about.headshot,
          true,
        );
      });
      if (about.client_logos !== null && about.client_logos !== undefined) {
        if (!Array.isArray(about.client_logos))
          throw new TypeError("client_logos must be an array");
        about.client_logos.forEach((logo, ordinal) => {
          if (!isObject(logo))
            throw new TypeError("client logo must be an object");
          pushStringReference(
            references,
            {
              environment,
              collection: "block_about_content",
              itemKey,
              field: "client_logos",
              ordinal,
              ownerType: "page-block",
              ownerKey: "about",
              route: "/about",
              active: false,
              consumption: "cms-intent-only",
              slot: `client-logo:${ordinal}`,
              required: false,
              deliveryMode: "local-img",
              contextualAlt: nullableString(logo.name, "client logo name"),
              altSource: `block_about_content.client_logos[${ordinal}].name`,
            },
            logo.src,
          );
        });
      }
    });
  }

  for (const translation of aboutTranslationData) {
    const row = translation.row;
    protect("block_about_content_translations", row, () => {
      const active = about?.status === "published" && pagePublic("/about");
      if (row.polaroids !== null && row.polaroids !== undefined) {
        if (!Array.isArray(row.polaroids))
          throw new TypeError("polaroids must be an array");
        row.polaroids.forEach((polaroid, ordinal) => {
          if (!isObject(polaroid))
            throw new TypeError("polaroid must be an object");
          const alt = nullableString(polaroid.alt, "polaroid.alt");
          nullableString(polaroid.caption, "polaroid.caption");
          pushStringReference(
            references,
            {
              environment,
              collection: "block_about_content_translations",
              itemKey: translation.id,
              field: "polaroids",
              ordinal,
              ownerType: "page-block",
              ownerKey: "about",
              route: "/about",
              locale: translation.locale,
              active,
              slot: `polaroid:${ordinal}`,
              required: true,
              deliveryMode: "local-img",
              contextualAlt: alt,
              altSource:
                alt === null
                  ? null
                  : `block_about_content_translations.polaroids[${ordinal}].alt`,
            },
            polaroid.src,
            true,
          );
        });
      }
      if (row.interests !== null && row.interests !== undefined) {
        if (!Array.isArray(row.interests))
          throw new TypeError("interests must be an array");
        row.interests.forEach((interest, ordinal) => {
          if (!isObject(interest))
            throw new TypeError("interest must be an object");
          pushStringReference(
            references,
            {
              environment,
              collection: "block_about_content_translations",
              itemKey: translation.id,
              field: "interests",
              ordinal,
              ownerType: "page-block",
              ownerKey: "about",
              route: "/about",
              locale: translation.locale,
              active,
              slot: `interest:${rowKey(interest.id, "interest.id")}`,
              required: true,
              deliveryMode: "css-background",
              contextualAlt: null,
              altSource: null,
            },
            interest.image,
            true,
          );
        });
      }
      if (row.testimonials !== null && row.testimonials !== undefined) {
        if (!Array.isArray(row.testimonials))
          throw new TypeError("testimonials must be an array");
        row.testimonials.forEach((testimonial, ordinal) => {
          if (!isObject(testimonial))
            throw new TypeError("testimonial must be an object");
          pushStringReference(
            references,
            {
              environment,
              collection: "block_about_content_translations",
              itemKey: translation.id,
              field: "testimonials",
              ordinal,
              ownerType: "page-block",
              ownerKey: "about",
              route: "/about",
              locale: translation.locale,
              active: false,
              consumption: "cms-intent-only",
              slot: `testimonial-logo:${ordinal}`,
              required: false,
              deliveryMode: "local-img",
              contextualAlt: nullableString(
                testimonial.company,
                "testimonial.company",
              ),
              altSource: `block_about_content_translations.testimonials[${ordinal}].company`,
            },
            testimonial.logo,
          );
        });
      }
    });
  }

  for (const row of rowsFor(data, "nav_links")) {
    protect("nav_links", row, () => {
      const id = rowKey(row.id);
      const placement = requiredString(row.placement, "nav_links.placement");
      const pageId = relationId(row.page, "nav_links.page");
      const linkedPage = pageId ? pageMaps.byId.get(pageId) : null;
      const href = nullableString(row.href, "nav_links.href");
      const route = linkedPage?.path ?? href;
      pushRelatedReference(
        references,
        {
          environment,
          collection: "nav_links",
          itemKey: id,
          field: "icon",
          ownerType: "component",
          ownerKey: `nav:${placement}:${id}`,
          route,
          active: false,
          consumption: "cms-intent-only",
          slot: "icon",
          required: false,
          deliveryMode: "code-component",
        },
        row.icon,
        "related-icon",
      );
      // Validate activity inputs even though the current icon field is CMS intent only.
      void (row.status === "published" && (linkedPage?.active ?? true));
    });
  }
  for (const row of rowsFor(data, "contact_channels")) {
    protect("contact_channels", row, () => {
      rowKey(row.id);
      nullableString(row.href, "contact_channels.href");
      nullableString(row.icon, "contact_channels.icon");
    });
  }

  for (const row of rowsFor(data, "icons")) {
    protect("icons", row, () => {
      const id = rowKey(row.id);
      const active = iconActivity.get(id) ?? false;
      pushTypedReference(
        references,
        {
          environment,
          collection: "icons",
          itemKey: id,
          field: "svg_override",
          ownerType: "component",
          ownerKey: `icon:${id}`,
          route: null,
          active,
          slot: "icon",
          required: false,
          deliveryMode: "local-img",
        },
        row.svg_override,
      );
      const providerKey = nullableString(row.iconify_id, "icons.iconify_id");
      if (providerKey) {
        const context: ReferenceContext = {
          environment,
          collection: "icons",
          itemKey: id,
          field: "iconify_id",
          ownerType: "component",
          ownerKey: `icon:${id}`,
          route: null,
          active,
          slot: "icon",
          required: false,
          deliveryMode: "external-url",
        };
        pushReference(references, context, {
          referenceKind: ICONIFY_PATTERN.test(providerKey)
            ? "external-provider"
            : "unresolved-media",
          fileId: null,
          rawRef: providerKey,
        });
      }
    });
  }
  for (const row of rowsFor(data, "illustrations")) {
    protect("illustrations", row, () => {
      const id = rowKey(row.id);
      // Activity is retained for related illustration rows, but their own file is
      // deliberately CMS intent only until the runtime consumes it directly.
      void illustrationActivity.get(id);
      pushTypedReference(
        references,
        {
          environment,
          collection: "illustrations",
          itemKey: id,
          field: "file",
          ownerType: "component",
          ownerKey: `illustration:${id}`,
          route: null,
          active: false,
          consumption: "cms-intent-only",
          slot: "illustration-file",
          required: false,
          deliveryMode: "local-img",
        },
        row.file,
      );
    });
  }

  return references;
}

function registryAvailability(
  receipts: readonly DirectusReadReceipt[],
): RegistryAvailability {
  const registry = new Set<DirectusReadSurface>([
    "asset_records",
    "asset_records_translations",
    "asset_versions",
    "asset_usages",
  ]);
  const values = receipts.filter((receipt) => registry.has(receipt.surface));
  if (
    values.some(
      (receipt) =>
        receipt.availability === "failed" ||
        (receipt.availability === "available" && !receipt.complete),
    )
  ) {
    return "unknown";
  }
  if (values.some((receipt) => receipt.availability === "forbidden"))
    return "forbidden";
  if (values.some((receipt) => receipt.availability === "missing"))
    return "missing";
  return "available";
}

function markReceiptIncomplete(
  receipts: DirectusReadReceipt[],
  surface: DirectusReadSurface,
): void {
  const index = receipts.findIndex((receipt) => receipt.surface === surface);
  const current = receipts[index];
  if (!current) return;
  receipts[index] = { ...current, complete: false };
}

export async function scanDirectusAssets(
  options: DirectusScanOptions,
): Promise<DirectusAssetSnapshot> {
  if (options.environment !== "dev" && options.environment !== "prod") {
    throw new TypeError("environment must be dev or prod");
  }
  const limits = validatedLimits(options.limits);
  const registryState = await registrySchemaState(options.client);
  const read = await readAllSurfaces(
    options.environment,
    options.client,
    limits,
    registryState,
  );
  const issues = [...read.issues];
  const folders = normalizeFolders(
    rowsFor(read.data, "directus_folders"),
    options.environment,
    issues,
  );
  const pendingFiles = normalizeFileRows(
    rowsFor(read.data, "directus_files"),
    folders,
    options.environment,
    issues,
  );
  const files = await downloadFiles(
    pendingFiles,
    options.environment,
    options.client,
    limits,
    issues,
  );
  const records = normalizeRecords(
    rowsFor(read.data, "asset_records"),
    options.environment,
    issues,
  );
  const translations = normalizeTranslations(
    rowsFor(read.data, "asset_records_translations"),
    options.environment,
    issues,
  );
  const versions = normalizeVersions(
    rowsFor(read.data, "asset_versions"),
    options.environment,
    issues,
  );
  const storedUsages = normalizeStoredUsages(
    rowsFor(read.data, "asset_usages"),
    options.environment,
    issues,
  );
  const transformPresets = normalizePresets(
    singletonFor(read.data, "directus_settings.storage_asset_presets"),
    options.environment,
    issues,
  );
  const references = normalizeContentReferences(
    read.data,
    options.environment,
    issues,
  );

  const normalizationSurfaces = new Set(
    issues
      .filter(
        (entry) =>
          entry.code === "response-invalid" &&
          entry.operation.startsWith("normalize:"),
      )
      .map(
        (entry) =>
          entry.operation.slice("normalize:".length) as DirectusReadSurface,
      ),
  );
  for (const surface of normalizationSurfaces)
    markReceiptIncomplete(read.receipts, surface);
  if (
    issues.some((entry) =>
      [
        "download-failed",
        "download-file-count-limit",
        "download-file-size-limit",
        "download-total-size-limit",
      ].includes(entry.code),
    )
  ) {
    markReceiptIncomplete(read.receipts, "directus_files");
  }

  return {
    schemaVersion: 1,
    environment: options.environment,
    registryAvailability:
      registryState === "missing"
        ? "missing"
        : registryState === "partial"
          ? "unknown"
          : registryAvailability(read.receipts),
    folders,
    files,
    records,
    translations,
    versions,
    storedUsages,
    references,
    transformPresets,
    readReceipts: read.receipts,
    readIssues: issues,
  };
}

function canonicalValue(value: unknown): unknown {
  if (typeof value === "string") return normalizeText(value);
  if (value === null || typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError("Snapshot contains a non-finite number");
    }
    return value;
  }
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (!isObject(value)) {
    throw new TypeError("Snapshot contains a non-JSON value");
  }
  const output: Record<string, unknown> = {};
  for (const key of Object.keys(value).sort(compareUtf8)) {
    output[normalizeText(key)] = canonicalValue(value[key]);
  }
  return output;
}

export function canonicalizeDirectusAssetSnapshot(
  snapshot: DirectusAssetSnapshot,
): string {
  if (!isObject(snapshot) || snapshot.schemaVersion !== 1) {
    throw new TypeError("Directus snapshot schemaVersion must be 1");
  }
  const prepared = structuredClone(snapshot) as unknown as Record<
    string,
    unknown
  >;
  for (const key of TOP_LEVEL_ARRAY_KEYS) {
    const array = prepared[key];
    if (!Array.isArray(array)) throw new TypeError(`${key} must be an array`);
    array.sort((left, right) =>
      compareUtf8(
        JSON.stringify(canonicalValue(left)),
        JSON.stringify(canonicalValue(right)),
      ),
    );
  }
  return `${JSON.stringify(canonicalValue(prepared), null, "\t")}\n`;
}

export function hashDirectusAssetSnapshot(
  snapshot: DirectusAssetSnapshot,
): Sha256Hex {
  return createHash("sha256")
    .update(canonicalizeDirectusAssetSnapshot(snapshot), "utf8")
    .digest("hex") as Sha256Hex;
}
