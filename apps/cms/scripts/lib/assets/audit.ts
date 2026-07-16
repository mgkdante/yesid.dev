import { createHash } from "node:crypto";
import { URL, URLSearchParams } from "node:url";
import {
  ASSET_DELIVERY_MODES,
  ASSET_KINDS,
  parseAssetSemanticKey,
  type AssetDeliveryMode,
  type AssetSemanticKey,
  type Sha256Hex,
} from "@repo/shared";
import {
  hashDirectusAssetSnapshot,
  type CmsEnvironment,
  type DirectusAssetSnapshot,
  type DirectusReadIssue,
  type NormalizedAssetRecord,
  type NormalizedAssetTranslation,
  type NormalizedAssetVersion,
  type NormalizedCmsFile,
  type NormalizedCmsReference,
  type NormalizedStoredUsage,
} from "./directus-scan";
import {
  hashRepositoryScan,
  type RepositoryAsset,
  type RepositoryScan,
  type RepositoryUsage,
} from "./repository-scan";

export interface GeneratedOutputExpectation {
  outputAssetId: string;
  semanticKey: AssetSemanticKey | null;
  generator: string;
  expectedOutputSha256: Sha256Hex | null;
  expectedInputHash: Sha256Hex | null;
  observedMetadataState: "observed" | "not-applicable" | "missing";
  observedMimeType: string | null;
  observedWidth: number | null;
  observedHeight: number | null;
  expectedMimeType: string | null;
  expectedWidth: number | null;
  expectedHeight: number | null;
  required: boolean;
}

export type OgCurrentRef =
  | { kind: "repository-path"; repoPath: string }
  | { kind: "runtime-route"; route: string }
  | { kind: "directus-file"; environment: CmsEnvironment; fileId: string }
  | { kind: "semantic-key"; semanticKey: AssetSemanticKey };

export interface OgCoverageRequirement {
  usageKey: string;
  route: string;
  locale: "en" | "fr" | "es";
  ownerType: "site" | "route" | "service" | "project" | "blog";
  ownerKey: string;
  semanticCandidates: readonly AssetSemanticKey[];
  currentRef: OgCurrentRef | null;
  proofUsageId: string | null;
  fallbackUsageKey: string | null;
  expectedInputHash: Sha256Hex | null;
  required: boolean;
  exclusionReason: string | null;
}

export interface AssetAuditInput {
  repository: RepositoryScan;
  dev?: DirectusAssetSnapshot;
  prod?: DirectusAssetSnapshot;
  generatedOutputs: readonly GeneratedOutputExpectation[];
  ogCoverage: readonly OgCoverageRequirement[];
  repositoryRevision?: string;
}

export type AssetAuditScope =
  | "repository"
  | "dev-registry"
  | "dev-files"
  | "dev-content"
  | "prod-registry"
  | "prod-files"
  | "prod-content"
  | "generated-outputs"
  | "og-coverage"
  | "svg-safety";

export interface AssetAuditScopeReceipt {
  scope: AssetAuditScope;
  status: "evaluated" | "not-evaluated";
  reason:
    | "complete"
    | "input-absent"
    | "registry-missing"
    | "registry-forbidden"
    | "request-failed"
    | "response-invalid"
    | "supplemental-evidence-missing";
}

export interface DiscoveredAssetUsage {
  id: Sha256Hex;
  evidenceUsageId: string;
  environment: CmsEnvironment;
  syncEligible: boolean;
  assetRecordId: string | null;
  resolvedVersionId: string | null;
  semanticKey: AssetSemanticKey | null;
  unresolvedRef: string | null;
  confidence:
    "exact-static" | "resolved-generated" | "declared-dynamic" | "unknown";
  consumerType: NormalizedStoredUsage["consumer_type"];
  consumerKey: string;
  sourceKind: NormalizedStoredUsage["source_kind"];
  sourceFile: string;
  sourceLine: number | null;
  cmsField: string | null;
  route: string | null;
  locale: string | null;
  slot: string;
  required: boolean;
  deliveryMode: AssetDeliveryMode;
  altTextOverride: string | null;
  altSource: string | null;
}

export const ASSET_FINDING_CODES = Object.freeze([
  "missing-record",
  "missing-version",
  "untracked-repo-asset",
  "unused-record",
  "orphaned-directus-file",
  "duplicate-content",
  "hardcoded-file-id",
  "unresolved-dynamic-usage",
  "stale-generated-output",
  "environment-drift",
  "missing-alt-text",
  "invalid-dimensions",
  "invalid-format",
  "unsafe-svg",
  "missing-og-coverage",
] as const);

export type AssetFindingCode = (typeof ASSET_FINDING_CODES)[number];

export interface AssetFindingFingerprintInput {
  schemaVersion: 1;
  code: AssetFindingCode;
  identity: string;
  evidence: Readonly<Record<string, unknown>>;
}

export interface AssetFinding {
  id: Sha256Hex;
  fingerprint: Sha256Hex;
  code: AssetFindingCode;
  severity: "error" | "warning" | "info";
  identity: string;
  message: string;
  evidence: Readonly<Record<string, unknown>>;
  requiredScopes: readonly AssetAuditScope[];
}

export interface AssetFindingCount {
  error: number;
  warning: number;
  info: number;
  total: number;
}

export interface AssetLogicalSource {
  id: string;
  kind:
    | RepositoryAsset["origin"]
    | "directus-file"
    | "asset-record"
    | "asset-version";
  environment: CmsEnvironment | null;
  logicalPath: string | null;
  fileId: string | null;
  sha256: Sha256Hex | null;
  bytes: number | null;
  mimeType: string | null;
  width: number | null;
  height: number | null;
}

export interface AssetLogicalRow {
  id: string;
  semanticKey: AssetSemanticKey | null;
  legacyPath: string | null;
  sha256: Sha256Hex | null;
  sources: readonly AssetLogicalSource[];
  usageIds: readonly Sha256Hex[];
}

export interface AssetAuditInputReceipts {
  repositorySha256: Sha256Hex;
  devSnapshotSha256: Sha256Hex | null;
  prodSnapshotSha256: Sha256Hex | null;
  generatedOutputsSha256: Sha256Hex;
  ogCoverageSha256: Sha256Hex;
  repositoryRevision: string | null;
}

export interface AssetAuditReport {
  schemaVersion: 1;
  inputReceipts: AssetAuditInputReceipts;
  scopeReceipts: readonly AssetAuditScopeReceipt[];
  summary: Readonly<Record<AssetFindingCode, AssetFindingCount>>;
  rows: readonly AssetLogicalRow[];
  discoveredUsages: readonly DiscoveredAssetUsage[];
  findings: readonly AssetFinding[];
}

const SCOPE_ORDER = Object.freeze([
  "repository",
  "dev-registry",
  "dev-files",
  "dev-content",
  "prod-registry",
  "prod-files",
  "prod-content",
  "generated-outputs",
  "og-coverage",
  "svg-safety",
] as const satisfies readonly AssetAuditScope[]);

const SEVERITY_ORDER = { error: 0, warning: 1, info: 2 } as const;
const CODE_ORDER = new Map(
  ASSET_FINDING_CODES.map((code, index) => [code, index]),
);
export interface AssetFindingEvidencePolicy {
  keys: readonly string[];
  orderedArrays: readonly string[];
}

export const ASSET_FINDING_EVIDENCE_POLICY: Readonly<
  Record<AssetFindingCode, AssetFindingEvidencePolicy>
> = Object.freeze({
  "missing-record": {
    keys: ["semanticKey", "consumer", "route", "locale", "slot", "required"],
    orderedArrays: [],
  },
  "missing-version": {
    keys: ["lifecycle", "selectedPointerKind", "invalidInvariants"],
    orderedArrays: [],
  },
  "untracked-repo-asset": {
    keys: ["origin", "sha256", "completeChainState"],
    orderedArrays: [],
  },
  "unused-record": {
    keys: ["lifecycle", "ownerType", "ownerKey"],
    orderedArrays: [],
  },
  "orphaned-directus-file": {
    keys: ["hashState", "relationPresent", "versionPresent", "mirrorPresent"],
    orderedArrays: [],
  },
  "duplicate-content": { keys: ["authoredIdentities"], orderedArrays: [] },
  "hardcoded-file-id": {
    keys: ["sourceKind", "sourceFile", "cmsField", "route", "locale", "slot"],
    orderedArrays: [],
  },
  "unresolved-dynamic-usage": {
    keys: ["unresolvedRef", "confidence", "declarationState"],
    orderedArrays: [],
  },
  "stale-generated-output": {
    keys: [
      "expectedOutputSha256",
      "observedOutputSha256",
      "expectedInputHash",
      "observedInputHash",
      "required",
    ],
    orderedArrays: [],
  },
  "environment-drift": {
    keys: ["differingFields", "dev", "prod"],
    orderedArrays: [],
  },
  "missing-alt-text": {
    keys: [
      "altMode",
      "localePolicy",
      "locale",
      "overrideState",
      "contextState",
    ],
    orderedArrays: [],
  },
  "invalid-dimensions": {
    keys: [
      "expectedWidth",
      "expectedHeight",
      "observedWidth",
      "observedHeight",
      "expectedRatioWidth",
      "expectedRatioHeight",
    ],
    orderedArrays: [],
  },
  "invalid-format": {
    keys: [
      "kind",
      "sourceMode",
      "mimeType",
      "format",
      "delivery",
      "violatedInvariant",
      "violatedInvariants",
    ],
    orderedArrays: [],
  },
  "unsafe-svg": {
    keys: ["delivery", "safetyState", "missingOrMismatchedProofs"],
    orderedArrays: [],
  },
  "missing-og-coverage": {
    keys: [
      "route",
      "locale",
      "owner",
      "orderedCandidates",
      "proofState",
      "fallbackState",
    ],
    orderedArrays: ["orderedCandidates"],
  },
});
const CONFIDENCE_ORDER = {
  "exact-static": 0,
  "resolved-generated": 1,
  "declared-dynamic": 2,
  unknown: 3,
} as const;
const REGISTRY_SURFACES = new Set([
  "asset_records",
  "asset_records_translations",
  "asset_versions",
  "asset_usages",
]);
const FILE_SURFACES = new Set([
  "directus_folders",
  "directus_files",
  "directus_settings.storage_asset_presets",
]);
const ACTIVE_LIFECYCLES = new Set([
  "draft",
  "candidate",
  "ready",
  "approved",
  "live",
]);
const PUBLIC_LIFECYCLES = new Set(["approved", "live"]);
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const SHA_PATTERN = /^[0-9a-f]{64}$/;
const ASSET_URL_PATTERN = /^\/assets\/([0-9a-f-]{36})(?:[?#].*)?$/;
const ASSET_EXTENSION_PATTERN =
  /\.(?:avif|gif|jpe?g|png|webp|svg|ttf|otf|woff2?|mp4|webm|mov|m4v|pdf)(?:[?#].*)?$/i;
const RUNTIME_BLOG_PATTERN = /^\/og\/blog\/([a-z0-9]+(?:-[a-z0-9]+)*)\.png$/;
const RUNTIME_PROJECT_PATTERN =
  /^\/og\/project\/([a-z0-9]+(?:-[a-z0-9]+)*)\.png(?:\?locale=(en|fr|es))?$/;
const PUBLIC_CREDENTIAL_REDACTION = "[redacted:credential]";
const PUBLIC_ABSOLUTE_PATH_REDACTION = "[redacted:absolute-path]";
const SENSITIVE_QUERY_PARAMETER_PATTERN =
  /^(?:access[-_]?token|api[-_]?key|apikey|auth|authorization|bearer|client[-_]?secret|credential(?:s)?|jwt|password|passwd|secret|session(?:id)?|signature|sig|token|x[-_]?amz[-_]?(?:credential|signature|security[-_]?token)|googleaccessid|key[-_]?pair[-_]?id)$/i;
const EXTERNAL_URL_PATTERN =
  /(?:\b[a-z][a-z\d+.-]*:)?\/\/[^\s<>"'`()\[\]{};,]+/gi;
const EMBEDDED_LOCAL_REFERENCE_PATTERN =
  /(^|[\s("'=:;,])((?:(?:\/(?!\/)|\.{1,2}\/)[^\s<>"'`()\[\]{};,]+|[a-z\d._~-]+(?:\/[^\s<>"'`()\[\]{};,]+)+[?#][^\s<>"'`()\[\]{};,]*))/gi;
const AUTHORIZATION_CREDENTIAL_PATTERN =
  /\b((?:proxy-)?authorization\s*[:=]\s*)(?:bearer|basic)\s+[^\s,;]+/gi;
const WINDOWS_ABSOLUTE_PATH_PATTERN =
  /(^|[\s("'=:])(?:[a-z]:[\\/]|\\\\[^\\/\s]+[\\/])[^\s,;)"']*/gi;
const POSIX_ABSOLUTE_PATH_PATTERN =
  /(^|[\s("'=:])\/(?:home\/[^/\s]+|Users\/[^/\s]+|root|tmp|private|var|etc|opt|mnt|srv|usr|workspace)(?:\/[^\s,;)"']*)?/g;

function compareUtf8(left: string, right: string): number {
  return Buffer.compare(Buffer.from(left), Buffer.from(right));
}

function normalizeString(value: string): string {
  return value.normalize("NFC").replace(/\r\n?/g, "\n");
}

function sourceIdentity(sourceFile: string): {
  sourceModule: string;
  anchor: string | null;
} {
  const normalized = normalizeString(sourceFile);
  const fragmentIndex = normalized.indexOf("#");
  if (fragmentIndex < 0) {
    return { sourceModule: normalized, anchor: null };
  }
  return {
    sourceModule: normalized.slice(0, fragmentIndex),
    anchor: normalized.slice(fragmentIndex + 1) || null,
  };
}

function sameSourceModule(left: string, right: string): boolean {
  return (
    sourceIdentity(left).sourceModule === sourceIdentity(right).sourceModule
  );
}

function sensitiveQueryParameter(name: string): boolean {
  return SENSITIVE_QUERY_PARAMETER_PATTERN.test(name);
}

function removeSensitiveQueryParameters(parameters: URLSearchParams): boolean {
  const sensitiveNames = [
    ...new Set(
      [...parameters.keys()].filter((name) => sensitiveQueryParameter(name)),
    ),
  ];
  for (const name of sensitiveNames) parameters.delete(name);
  if (sensitiveNames.length > 0) parameters.sort();
  return sensitiveNames.length > 0;
}

function sanitizeExternalUrl(candidate: string): string {
  const protocolRelative = candidate.startsWith("//");
  let parsed: URL;
  try {
    parsed = new URL(protocolRelative ? `https:${candidate}` : candidate);
  } catch {
    return candidate;
  }

  if (parsed.protocol === "file:") return PUBLIC_ABSOLUTE_PATH_REDACTION;

  const hadCredentials =
    parsed.username.length > 0 || parsed.password.length > 0;
  const hadFragment = parsed.hash.length > 0;
  const removedQuerySecret = removeSensitiveQueryParameters(
    parsed.searchParams,
  );
  if (!hadCredentials && !hadFragment && !removedQuerySecret) return candidate;

  parsed.username = "";
  parsed.password = "";
  parsed.hash = "";
  const sanitized = parsed.toString();
  return protocolRelative ? sanitized.slice("https:".length) : sanitized;
}

function localReferenceShaped(value: string): boolean {
  if (/\s/.test(value) || /^[a-z][a-z\d+.-]*:\/\//i.test(value)) return false;
  if (/^(?:\/(?!\/)|\.\.?\/)/.test(value)) return true;
  const marker = value.search(/[?#]/);
  return marker >= 0 && value.slice(0, marker).includes("/");
}

function repositoryMediaAnchor(value: string): {
  sourceModule: string;
  physicalSlot: string;
  expression: string;
} | null {
  const match =
    /^(.*)#((?:img|source|picture|video|audio)-(?:src|srcset|poster)):(.+)$/s.exec(
      value,
    );
  if (!match) return null;
  const sourceModule = match[1]!;
  const validRoot =
    sourceModule.startsWith("apps/") ||
    sourceModule.startsWith("packages/") ||
    sourceModule.startsWith("gbp-assets/");
  const validSegments = sourceModule
    .split("/")
    .every((segment) => segment !== "" && segment !== "." && segment !== "..");
  if (
    !validRoot ||
    !validSegments ||
    sourceModule.includes("\\") ||
    !/\.(?:svelte|html)$/i.test(sourceModule)
  ) {
    return null;
  }
  return {
    sourceModule,
    physicalSlot: match[2]!,
    expression: match[3]!,
  };
}

function canonicalRepositoryComponentAssetId(value: string): boolean {
  const match =
    /^repo-component:((?:apps|packages|gbp-assets)\/[^#?\\\s]+\.svelte)#svg:([1-9]\d*)$/.exec(
      value,
    );
  if (!match) return false;
  return match[1]!
    .split("/")
    .every((segment) => segment !== "" && segment !== "." && segment !== "..");
}

function sanitizeUnanchoredLocalReference(value: string): string {
  if (!localReferenceShaped(value)) return value;
  const fragmentIndex = value.indexOf("#");
  const withoutFragment =
    fragmentIndex < 0 ? value : value.slice(0, fragmentIndex);
  const queryIndex = withoutFragment.indexOf("?");
  if (queryIndex < 0) return withoutFragment;

  const path = withoutFragment.slice(0, queryIndex);
  const parameters = new URLSearchParams(withoutFragment.slice(queryIndex + 1));
  const removedQuerySecret = removeSensitiveQueryParameters(parameters);
  if (fragmentIndex < 0 && !removedQuerySecret) return value;
  const query = parameters.toString();
  return query.length > 0 ? `${path}?${query}` : path;
}

function sanitizeLocalReference(value: string): string {
  const anchor = repositoryMediaAnchor(value);
  if (!anchor) return sanitizeUnanchoredLocalReference(value);
  return `${anchor.sourceModule}#${anchor.physicalSlot}:${sanitizeUnanchoredLocalReference(anchor.expression)}`;
}

/**
 * Project arbitrary audit text into a deterministic, publication-safe value.
 * Safe semantic values remain byte-stable after NFC/LF normalization.
 */
export function sanitizeAssetAuditPublicText(value: string): string {
  const normalized = normalizeString(value);
  if (canonicalRepositoryComponentAssetId(normalized)) return normalized;
  let sanitized = normalized.replace(EXTERNAL_URL_PATTERN, (candidate) =>
    sanitizeExternalUrl(candidate),
  );
  sanitized = sanitized.replace(
    EMBEDDED_LOCAL_REFERENCE_PATTERN,
    (_match, prefix: string, candidate: string) =>
      `${prefix}${sanitizeLocalReference(candidate)}`,
  );
  sanitized = sanitized.replace(
    AUTHORIZATION_CREDENTIAL_PATTERN,
    (_match, prefix: string) => `${prefix}${PUBLIC_CREDENTIAL_REDACTION}`,
  );
  sanitized = sanitized.replace(
    WINDOWS_ABSOLUTE_PATH_PATTERN,
    (_match, prefix: string) => `${prefix}${PUBLIC_ABSOLUTE_PATH_REDACTION}`,
  );
  return sanitized.replace(
    POSIX_ABSOLUTE_PATH_PATTERN,
    (_match, prefix: string) => `${prefix}${PUBLIC_ABSOLUTE_PATH_REDACTION}`,
  );
}

function normalizeCanonical(
  value: unknown,
  options: { sortArrays: boolean; sanitizeStrings?: boolean },
): unknown {
  if (typeof value === "string") {
    return options.sanitizeStrings
      ? sanitizeAssetAuditPublicText(value)
      : normalizeString(value);
  }
  if (
    value === null ||
    typeof value === "boolean" ||
    typeof value === "number"
  ) {
    return value;
  }
  if (Array.isArray(value)) {
    const values = value.map((entry) => normalizeCanonical(entry, options));
    if (!options.sortArrays) return values;
    const byCanonical = new Map<string, unknown>();
    for (const entry of values) byCanonical.set(JSON.stringify(entry), entry);
    return [...byCanonical.entries()]
      .sort(([left], [right]) => compareUtf8(left, right))
      .map(([, entry]) => entry);
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    const entries = Object.keys(record)
      .map((originalKey) => ({
        originalKey,
        key: options.sanitizeStrings
          ? sanitizeAssetAuditPublicText(originalKey)
          : normalizeString(originalKey),
      }))
      .sort(
        (left, right) =>
          compareUtf8(left.key, right.key) ||
          compareUtf8(left.originalKey, right.originalKey),
      );
    for (const entry of entries) {
      if (Object.hasOwn(result, entry.key)) {
        throw new TypeError(
          `Canonical asset audit key collision: ${JSON.stringify(entry.key)}`,
        );
      }
      result[entry.key] = normalizeCanonical(
        record[entry.originalKey],
        options,
      );
    }
    return result;
  }
  throw new TypeError("Audit canonical values must be JSON serializable");
}

function compactCanonical(value: unknown, sortArrays = false): string {
  return `${JSON.stringify(normalizeCanonical(value, { sortArrays }))}\n`;
}

function sha256(value: string): Sha256Hex {
  return createHash("sha256").update(value, "utf8").digest("hex") as Sha256Hex;
}

function hashDomainRows<T>(
  rows: readonly T[],
  key: (row: T) => string,
): Sha256Hex {
  const ordered = [...rows].sort((left, right) =>
    compareUtf8(key(left), key(right)),
  );
  return sha256(compactCanonical(ordered));
}

export function fingerprintAssetFinding(
  input: AssetFindingFingerprintInput,
): Sha256Hex {
  if (input.schemaVersion !== 1 || !ASSET_FINDING_CODES.includes(input.code)) {
    throw new TypeError("Invalid asset finding fingerprint input");
  }
  const evidence = projectAssetFindingEvidence(input.code, input.evidence);
  return sha256(
    compactCanonical(
      {
        schemaVersion: 1,
        code: input.code,
        identity: sanitizeAssetAuditPublicText(input.identity),
        evidence,
      },
      false,
    ),
  );
}

export function projectAssetFindingEvidence(
  code: AssetFindingCode,
  evidence: Readonly<Record<string, unknown>>,
): Readonly<Record<string, unknown>> {
  const policy = ASSET_FINDING_EVIDENCE_POLICY[code];
  if (!policy) throw new TypeError(`Unknown asset finding code: ${code}`);
  const projected: Record<string, unknown> = {};
  for (const key of policy.keys) {
    if (!Object.prototype.hasOwnProperty.call(evidence, key)) continue;
    const value = evidence[key];
    if (policy.orderedArrays.includes(key) && Array.isArray(value)) {
      projected[key] = value.map((entry) =>
        normalizeCanonical(entry, { sortArrays: true, sanitizeStrings: true }),
      );
    } else {
      projected[key] = normalizeCanonical(value, {
        sortArrays: true,
        sanitizeStrings: true,
      });
    }
  }
  return normalizeCanonical(projected, {
    sortArrays: false,
    sanitizeStrings: true,
  }) as Readonly<Record<string, unknown>>;
}

function scopes(...values: AssetAuditScope[]): readonly AssetAuditScope[] {
  const selected = new Set(values);
  return SCOPE_ORDER.filter((scope) => selected.has(scope));
}

function makeFinding(input: {
  code: AssetFindingCode;
  severity: AssetFinding["severity"];
  identity: string;
  message: string;
  evidence: Readonly<Record<string, unknown>>;
  requiredScopes: readonly AssetAuditScope[];
}): AssetFinding {
  const evidence = projectAssetFindingEvidence(input.code, input.evidence);
  const fingerprint = fingerprintAssetFinding({
    schemaVersion: 1,
    code: input.code,
    identity: sanitizeAssetAuditPublicText(input.identity),
    evidence,
  });
  return {
    id: fingerprint,
    fingerprint,
    code: input.code,
    severity: input.severity,
    identity: sanitizeAssetAuditPublicText(input.identity),
    message: sanitizeAssetAuditPublicText(input.message),
    evidence,
    requiredScopes: scopes(...input.requiredScopes),
  };
}

export function repositoryLegacyPath(repoPath: string): string | null {
  const normalized = normalizeString(repoPath);
  if (normalized.startsWith("apps/web/static/")) {
    return normalized.slice("apps/web/static/".length);
  }
  if (normalized.startsWith("apps/cms/brand/")) {
    return `brand/${normalized.slice("apps/cms/brand/".length)}`;
  }
  return null;
}

function validLegacyPath(value: string | null): string | null {
  if (value === null) return null;
  const normalized = normalizeString(value);
  if (
    normalized.length === 0 ||
    normalized.startsWith("/") ||
    normalized.includes("\\") ||
    normalized
      .split("/")
      .some((segment) => segment === "" || segment === "." || segment === "..")
  ) {
    return null;
  }
  return normalized;
}

function recordSemantic(record: NormalizedAssetRecord): AssetSemanticKey {
  return record.semantic_key;
}

function relationId(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (
    value &&
    typeof value === "object" &&
    typeof (value as { id?: unknown }).id === "string"
  ) {
    return (value as { id: string }).id;
  }
  return null;
}

function selectedVersion(
  record: NormalizedAssetRecord,
  versionsById: ReadonlyMap<string, NormalizedAssetVersion>,
): {
  pointerKind: "approved_version" | "candidate_version";
  pointerId: string | null;
  version: NormalizedAssetVersion | null;
  invalid: string[];
} {
  const lifecycle = record.lifecycle_status;
  const pointerKind = PUBLIC_LIFECYCLES.has(lifecycle)
    ? "approved_version"
    : "candidate_version";
  let pointerId = relationId(record[pointerKind]);
  if (!pointerId && pointerKind === "candidate_version") {
    pointerId = relationId(record.approved_version);
  }
  const invalid: string[] = [];
  if (!pointerId) invalid.push("selected-pointer-missing");
  const version = pointerId ? (versionsById.get(pointerId) ?? null) : null;
  if (pointerId && !version) invalid.push("selected-version-missing");
  if (version && relationId(version.asset_record) !== record.id) {
    invalid.push("selected-version-wrong-record");
  }
  return { pointerKind, pointerId, version, invalid };
}

function validateGeneratedOutputs(
  outputs: readonly GeneratedOutputExpectation[],
): void {
  const ids = new Set<string>();
  for (const output of outputs) {
    if (
      !output ||
      typeof output !== "object" ||
      !output.outputAssetId ||
      !output.generator
    ) {
      throw new TypeError("Invalid generated-output expectation");
    }
    const identity = `${normalizeString(output.outputAssetId)}\0${normalizeString(output.generator)}`;
    if (ids.has(identity))
      throw new TypeError("Duplicate generated-output expectation");
    ids.add(identity);
    for (const hash of [
      output.expectedOutputSha256,
      output.expectedInputHash,
    ]) {
      if (hash !== null && !SHA_PATTERN.test(hash)) {
        throw new TypeError(
          "Generated-output hashes must be lowercase SHA-256 values",
        );
      }
    }
    if (
      !(["observed", "not-applicable", "missing"] as const).includes(
        output.observedMetadataState,
      )
    ) {
      throw new TypeError("Invalid generated-output metadata state");
    }
    const observedPair = [output.observedWidth, output.observedHeight];
    const expectedPair = [output.expectedWidth, output.expectedHeight];
    if ((observedPair[0] === null) !== (observedPair[1] === null)) {
      throw new TypeError("Observed generated dimensions must be a pair");
    }
    if ((expectedPair[0] === null) !== (expectedPair[1] === null)) {
      throw new TypeError("Expected generated dimensions must be a pair");
    }
  }
}

function validateOgCoverage(rows: readonly OgCoverageRequirement[]): void {
  if (!Array.isArray(rows) || rows.length !== 75) {
    throw new TypeError("OG coverage must contain exactly 75 rows");
  }
  const byUsageKey = new Map<string, OgCoverageRequirement>();
  const groups = new Map<string, Map<string, string>>();
  for (const row of rows) {
    if (
      !row ||
      typeof row !== "object" ||
      typeof row.usageKey !== "string" ||
      row.usageKey.length === 0 ||
      typeof row.route !== "string" ||
      !row.route.startsWith("/") ||
      !(["en", "fr", "es"] as const).includes(row.locale) ||
      !(["site", "route", "service", "project", "blog"] as const).includes(
        row.ownerType,
      ) ||
      typeof row.ownerKey !== "string" ||
      row.ownerKey.length === 0 ||
      !Array.isArray(row.semanticCandidates) ||
      row.semanticCandidates.length === 0
    ) {
      throw new TypeError("Invalid OG coverage row");
    }
    if (byUsageKey.has(row.usageKey))
      throw new TypeError("Duplicate OG usageKey");
    byUsageKey.set(row.usageKey, row);
    const candidates = new Set<string>();
    for (const candidate of row.semanticCandidates) {
      parseAssetSemanticKey(candidate);
      if (candidates.has(candidate))
        throw new TypeError("Duplicate OG semantic candidate");
      candidates.add(candidate);
    }
    if (row.required && row.exclusionReason !== null) {
      throw new TypeError("A required OG row cannot have an exclusion reason");
    }
    if (
      !row.required &&
      row.exclusionReason !== null &&
      row.exclusionReason.trim() === ""
    ) {
      throw new TypeError("An OG exclusion reason cannot be empty");
    }
    if (row.fallbackUsageKey === row.usageKey)
      throw new TypeError("OG fallback cannot reference itself");
    if (
      row.expectedInputHash !== null &&
      !SHA_PATTERN.test(row.expectedInputHash)
    ) {
      throw new TypeError("Invalid OG expected input hash");
    }
    if (row.currentRef) {
      if (row.currentRef.kind === "repository-path") {
        const path = normalizeString(row.currentRef.repoPath);
        if (
          path.startsWith("/") ||
          path.includes("\\") ||
          path.includes("..")
        ) {
          throw new TypeError("Invalid OG repository path");
        }
      } else if (row.currentRef.kind === "runtime-route") {
        if (!row.currentRef.route.startsWith("/og/")) {
          throw new TypeError("Invalid OG runtime route");
        }
      } else if (row.currentRef.kind === "directus-file") {
        if (!UUID_PATTERN.test(row.currentRef.fileId)) {
          throw new TypeError("Invalid OG Directus file ID");
        }
      } else if (row.currentRef.kind === "semantic-key") {
        parseAssetSemanticKey(row.currentRef.semanticKey);
      } else {
        throw new TypeError("Invalid OG current reference");
      }
    }
    const groupKey = compactCanonical({
      ownerType: row.ownerType,
      ownerKey: row.ownerKey,
    });
    const localeRoutes = groups.get(groupKey) ?? new Map<string, string>();
    if (localeRoutes.has(row.locale)) {
      throw new TypeError("Every OG group must contain one row per locale");
    }
    localeRoutes.set(row.locale, row.route);
    groups.set(groupKey, localeRoutes);
  }
  if (groups.size !== 25)
    throw new TypeError("OG coverage must contain exactly 25 groups");
  for (const localeRoutes of groups.values()) {
    const locales = new Set(localeRoutes.keys());
    if (
      locales.size !== 3 ||
      !["en", "fr", "es"].every((locale) => locales.has(locale))
    ) {
      throw new TypeError("Every OG group must contain EN, FR, and ES");
    }
    if (new Set(localeRoutes.values()).size !== 3) {
      throw new TypeError(
        "Every OG locale row must preserve its distinct public route",
      );
    }
    for (const [locale, route] of localeRoutes) {
      const hasFrenchPrefix = route === "/fr" || route.startsWith("/fr/");
      const hasSpanishPrefix = route === "/es" || route.startsWith("/es/");
      if (
        (locale === "en" && (hasFrenchPrefix || hasSpanishPrefix)) ||
        (locale === "fr" && !hasFrenchPrefix) ||
        (locale === "es" && !hasSpanishPrefix)
      ) {
        throw new TypeError("OG locale does not match its public route prefix");
      }
    }
  }
  for (const row of rows) {
    if (!row.fallbackUsageKey) continue;
    const fallback = byUsageKey.get(row.fallbackUsageKey);
    if (!fallback) throw new TypeError("OG fallback target is missing");
    if (fallback.locale !== row.locale)
      throw new TypeError("OG fallback cannot cross locale");
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (key: string) => {
    if (visiting.has(key)) throw new TypeError("OG fallback cycle");
    if (visited.has(key)) return;
    visiting.add(key);
    const fallback = byUsageKey.get(key)?.fallbackUsageKey;
    if (fallback) visit(fallback);
    visiting.delete(key);
    visited.add(key);
  };
  for (const key of byUsageKey.keys()) visit(key);
}

function issueReason(
  issues: readonly DirectusReadIssue[],
): AssetAuditScopeReceipt["reason"] {
  if (issues.some((issue) => issue.code === "response-invalid"))
    return "response-invalid";
  return "request-failed";
}

function categoryIssues(
  snapshot: DirectusAssetSnapshot,
  category: "registry" | "files" | "content",
): DirectusReadIssue[] {
  return snapshot.readIssues.filter((issue) => {
    const surface = issue.operation.split(":").at(-1) ?? "";
    if (category === "registry") return REGISTRY_SURFACES.has(surface);
    if (category === "files") {
      return (
        FILE_SURFACES.has(surface) || issue.operation.startsWith("readAsset")
      );
    }
    return (
      !issue.operation.startsWith("readAsset") &&
      !REGISTRY_SURFACES.has(surface) &&
      !FILE_SURFACES.has(surface)
    );
  });
}

function categoryReceipts(
  snapshot: DirectusAssetSnapshot,
  category: "registry" | "files" | "content",
) {
  return snapshot.readReceipts.filter((receipt) => {
    if (category === "registry") return REGISTRY_SURFACES.has(receipt.surface);
    if (category === "files") return FILE_SURFACES.has(receipt.surface);
    return (
      !REGISTRY_SURFACES.has(receipt.surface) &&
      !FILE_SURFACES.has(receipt.surface)
    );
  });
}

function environmentScopeReceipts(
  environment: CmsEnvironment,
  snapshotValue: DirectusAssetSnapshot | undefined,
): AssetAuditScopeReceipt[] {
  const names = {
    registry: `${environment}-registry` as AssetAuditScope,
    files: `${environment}-files` as AssetAuditScope,
    content: `${environment}-content` as AssetAuditScope,
  };
  if (!snapshotValue) {
    return (Object.values(names) as AssetAuditScope[]).map((scope) => ({
      scope,
      status: "not-evaluated",
      reason: "input-absent",
    }));
  }
  const result: AssetAuditScopeReceipt[] = [];
  if (snapshotValue.registryAvailability === "available") {
    const receipts = categoryReceipts(snapshotValue, "registry");
    const issues = categoryIssues(snapshotValue, "registry");
    result.push(
      receipts.length === REGISTRY_SURFACES.size &&
        receipts.every(
          (receipt) => receipt.complete && receipt.availability === "available",
        ) &&
        issues.length === 0
        ? { scope: names.registry, status: "evaluated", reason: "complete" }
        : {
            scope: names.registry,
            status: "not-evaluated",
            reason: issues.length ? issueReason(issues) : "response-invalid",
          },
    );
  } else if (snapshotValue.registryAvailability === "missing") {
    result.push({
      scope: names.registry,
      status: "not-evaluated",
      reason: "registry-missing",
    });
  } else if (snapshotValue.registryAvailability === "forbidden") {
    result.push({
      scope: names.registry,
      status: "not-evaluated",
      reason: "registry-forbidden",
    });
  } else {
    const issues = categoryIssues(snapshotValue, "registry");
    result.push({
      scope: names.registry,
      status: "not-evaluated",
      reason: issues.length ? issueReason(issues) : "request-failed",
    });
  }
  for (const category of ["files", "content"] as const) {
    const receipts = categoryReceipts(snapshotValue, category);
    const issues = categoryIssues(snapshotValue, category);
    const complete =
      receipts.length > 0 &&
      receipts.every(
        (receipt) => receipt.complete && receipt.availability === "available",
      ) &&
      issues.length === 0;
    result.push(
      complete
        ? { scope: names[category], status: "evaluated", reason: "complete" }
        : {
            scope: names[category],
            status: "not-evaluated",
            reason: issues.length ? issueReason(issues) : "response-invalid",
          },
    );
  }
  return result;
}

function buildScopeReceipts(input: AssetAuditInput): AssetAuditScopeReceipt[] {
  const generatedComplete = input.generatedOutputs.every(
    (output) => output.observedMetadataState !== "missing",
  );
  const environmentReceipts = [
    ...environmentScopeReceipts("dev", input.dev),
    ...environmentScopeReceipts("prod", input.prod),
  ];
  const hasRepositorySvgEvidence =
    input.repository.assets.some((asset) =>
      ["svg", "code-component"].includes(asset.kind),
    ) ||
    input.repository.usages.some((usage) =>
      [
        "inline-svg",
        "sanitized-svg-img",
        "tokenized-inline-svg",
        "code-component",
      ].includes(usage.deliveryMode),
    );
  const requiredSvgScopes = new Set<AssetAuditScope>();
  for (const environment of ["dev", "prod"] as const) {
    if (!input[environment]) continue;
    requiredSvgScopes.add(`${environment}-registry`);
    requiredSvgScopes.add(`${environment}-files`);
    requiredSvgScopes.add(`${environment}-content`);
  }
  if (hasRepositorySvgEvidence) {
    requiredSvgScopes.add("dev-registry");
    requiredSvgScopes.add("dev-files");
    requiredSvgScopes.add("dev-content");
  }
  for (const environment of ["dev", "prod"] as const) {
    const snapshotValue = input[environment];
    const hasEnvironmentSvgEvidence = Boolean(
      snapshotValue?.records.some((record) =>
        ["svg", "code-component"].includes(record.kind),
      ) ||
      snapshotValue?.references.some((reference) =>
        [
          "inline-svg",
          "sanitized-svg-img",
          "tokenized-inline-svg",
          "code-component",
        ].includes(reference.deliveryMode),
      ),
    );
    if (hasEnvironmentSvgEvidence) {
      requiredSvgScopes.add(`${environment}-registry`);
      requiredSvgScopes.add(`${environment}-files`);
      requiredSvgScopes.add(`${environment}-content`);
    }
  }
  const incompleteSvgReceipt = SCOPE_ORDER.map((scope) =>
    environmentReceipts.find((receipt) => receipt.scope === scope),
  ).find(
    (receipt) =>
      receipt &&
      requiredSvgScopes.has(receipt.scope) &&
      receipt.status === "not-evaluated",
  );
  const svgInputsPresent = Boolean(input.dev || input.prod);
  return [
    { scope: "repository", status: "evaluated", reason: "complete" },
    ...environmentReceipts,
    {
      scope: "generated-outputs",
      status: generatedComplete ? "evaluated" : "not-evaluated",
      reason: generatedComplete ? "complete" : "supplemental-evidence-missing",
    },
    { scope: "og-coverage", status: "evaluated", reason: "complete" },
    {
      scope: "svg-safety",
      status:
        svgInputsPresent && !incompleteSvgReceipt
          ? "evaluated"
          : "not-evaluated",
      reason: !svgInputsPresent
        ? "supplemental-evidence-missing"
        : (incompleteSvgReceipt?.reason ?? "complete"),
    },
  ];
}

function scopeEvaluated(
  receipts: readonly AssetAuditScopeReceipt[],
  scope: AssetAuditScope,
): boolean {
  return (
    receipts.find((receipt) => receipt.scope === scope)?.status === "evaluated"
  );
}

interface UsageEvidence {
  evidenceUsageId: string;
  environment: CmsEnvironment;
  semanticKey: AssetSemanticKey | null;
  assetId: string | null;
  fileId: string | null;
  unresolvedRef: string | null;
  confidence: DiscoveredAssetUsage["confidence"];
  consumerType: DiscoveredAssetUsage["consumerType"];
  consumerKey: string;
  sourceKind: DiscoveredAssetUsage["sourceKind"];
  sourceFile: string;
  sourceLine: number | null;
  cmsField: string | null;
  route: string | null;
  locale: string | null;
  slot: string;
  required: boolean;
  deliveryMode: AssetDeliveryMode;
  altTextOverride: string | null;
  altSource: string | null;
}

interface UsageBuildIssue {
  kind: "identity-conflict" | "delivery-conflict" | "alt-conflict";
  usageId: Sha256Hex;
  candidates: readonly string[];
}

function repositoryEvidence(usage: RepositoryUsage): UsageEvidence {
  return {
    evidenceUsageId: usage.id,
    environment: "dev",
    semanticKey: usage.semanticKey,
    assetId: usage.assetId,
    fileId: null,
    unresolvedRef: usage.unresolvedRef,
    confidence: usage.confidence,
    consumerType: usage.consumerType,
    consumerKey: usage.consumerKey,
    sourceKind: usage.sourceKind,
    sourceFile: usage.sourceFile,
    sourceLine: usage.sourceLine,
    cmsField: usage.cmsField,
    route: usage.route,
    locale: usage.locale,
    slot: usage.slot,
    required: usage.required,
    deliveryMode: usage.deliveryMode,
    altTextOverride: usage.altTextOverride,
    altSource: usage.altSource,
  };
}

function cmsEvidence(reference: NormalizedCmsReference): UsageEvidence {
  return {
    evidenceUsageId: reference.id,
    environment: reference.environment,
    semanticKey: null,
    assetId: null,
    fileId: reference.fileId,
    unresolvedRef: reference.rawRef,
    confidence: reference.fileId ? "resolved-generated" : "unknown",
    consumerType: reference.ownerType,
    consumerKey: reference.ownerKey,
    sourceKind: "cms",
    sourceFile: `cms:${reference.collection}/${reference.itemKey}`,
    sourceLine: null,
    cmsField: reference.field,
    route: reference.route,
    locale: reference.locale,
    slot: reference.slot,
    required: reference.required,
    deliveryMode: reference.deliveryMode,
    altTextOverride: reference.contextualAlt,
    altSource: reference.altSource,
  };
}

interface ReconciliationIndexes {
  repositoryAssets: Map<string, RepositoryAsset>;
  recordsByEnvironment: Map<CmsEnvironment, Map<string, NormalizedAssetRecord>>;
  recordsBySemantic: Map<CmsEnvironment, Map<string, NormalizedAssetRecord>>;
  versionsByEnvironment: Map<
    CmsEnvironment,
    Map<string, NormalizedAssetVersion>
  >;
  filesByEnvironment: Map<CmsEnvironment, Map<string, NormalizedCmsFile>>;
  recordByFile: Map<CmsEnvironment, Map<string, NormalizedAssetRecord>>;
  recordByLegacy: Map<CmsEnvironment, Map<string, NormalizedAssetRecord>>;
  recordByComponent: Map<CmsEnvironment, Map<string, NormalizedAssetRecord>>;
}

function buildIndexes(input: AssetAuditInput): ReconciliationIndexes {
  const recordsByEnvironment = new Map<
    CmsEnvironment,
    Map<string, NormalizedAssetRecord>
  >();
  const recordsBySemantic = new Map<
    CmsEnvironment,
    Map<string, NormalizedAssetRecord>
  >();
  const versionsByEnvironment = new Map<
    CmsEnvironment,
    Map<string, NormalizedAssetVersion>
  >();
  const filesByEnvironment = new Map<
    CmsEnvironment,
    Map<string, NormalizedCmsFile>
  >();
  const recordByFile = new Map<
    CmsEnvironment,
    Map<string, NormalizedAssetRecord>
  >();
  const recordByLegacy = new Map<
    CmsEnvironment,
    Map<string, NormalizedAssetRecord>
  >();
  const recordByComponent = new Map<
    CmsEnvironment,
    Map<string, NormalizedAssetRecord>
  >();
  for (const environment of ["dev", "prod"] as const) {
    const snapshotValue = input[environment];
    const records = new Map(
      (snapshotValue?.records ?? []).map((record) => [record.id, record]),
    );
    const semantics = new Map(
      (snapshotValue?.records ?? []).map((record) => [
        recordSemantic(record),
        record,
      ]),
    );
    const versions = new Map(
      (snapshotValue?.versions ?? []).map((version) => [version.id, version]),
    );
    const files = new Map(
      (snapshotValue?.files ?? []).map((file) => [file.fileId, file]),
    );
    const byFile = new Map<string, NormalizedAssetRecord>();
    const byLegacy = new Map<string, NormalizedAssetRecord>();
    const byComponent = new Map<string, NormalizedAssetRecord>();
    for (const record of records.values()) {
      const selected = selectedVersion(record, versions);
      const fileId = selected.version
        ? relationId(selected.version.directus_file)
        : null;
      if (fileId) {
        byFile.set(fileId, record);
        const legacy = validLegacyPath(files.get(fileId)?.legacyPath ?? null);
        if (legacy) byLegacy.set(legacy, record);
      }
      if (record.code_component_key)
        byComponent.set(record.code_component_key, record);
    }
    recordsByEnvironment.set(environment, records);
    recordsBySemantic.set(environment, semantics);
    versionsByEnvironment.set(environment, versions);
    filesByEnvironment.set(environment, files);
    recordByFile.set(environment, byFile);
    recordByLegacy.set(environment, byLegacy);
    recordByComponent.set(environment, byComponent);
  }
  return {
    repositoryAssets: new Map(
      input.repository.assets.map((asset) => [asset.id, asset]),
    ),
    recordsByEnvironment,
    recordsBySemantic,
    versionsByEnvironment,
    filesByEnvironment,
    recordByFile,
    recordByLegacy,
    recordByComponent,
  };
}

function recordForEvidence(
  evidence: UsageEvidence,
  indexes: ReconciliationIndexes,
): NormalizedAssetRecord | null {
  const semantics = indexes.recordsBySemantic.get(evidence.environment)!;
  if (evidence.semanticKey && semantics.has(evidence.semanticKey)) {
    return semantics.get(evidence.semanticKey)!;
  }
  if (evidence.fileId) {
    const byFile = indexes.recordByFile.get(evidence.environment)!;
    if (byFile.has(evidence.fileId)) return byFile.get(evidence.fileId)!;
  }
  const assetMatch = evidence.unresolvedRef?.match(ASSET_URL_PATTERN);
  if (assetMatch) {
    const byFile = indexes.recordByFile.get(evidence.environment)!;
    if (byFile.has(assetMatch[1]!)) return byFile.get(assetMatch[1]!)!;
  }
  if (evidence.assetId) {
    const asset = indexes.repositoryAssets.get(evidence.assetId);
    if (asset?.repoPath) {
      const legacy = repositoryLegacyPath(asset.repoPath);
      if (legacy) {
        const byLegacy = indexes.recordByLegacy.get(evidence.environment)!;
        if (byLegacy.has(legacy)) return byLegacy.get(legacy)!;
      }
      if (asset.origin === "code-component") {
        const componentKey = asset.repoPath.split("/").at(-1) ?? asset.repoPath;
        const byComponent = indexes.recordByComponent.get(
          evidence.environment,
        )!;
        if (byComponent.has(componentKey))
          return byComponent.get(componentKey)!;
      }
    }
  }
  return null;
}

function boundedRepositoryReference(path: string): string {
  const exact = `repository:${normalizeString(path)}`;
  return exact.length <= 255
    ? exact
    : `repository-sha256:${sha256(`${normalizeString(path)}\n`)}`;
}

function evidenceIdentity(
  evidence: UsageEvidence,
  indexes: ReconciliationIndexes,
): {
  identity: string;
  semanticKey: AssetSemanticKey | null;
  record: NormalizedAssetRecord | null;
} {
  const record = recordForEvidence(evidence, indexes);
  if (record) {
    return {
      identity: recordSemantic(record),
      semanticKey: recordSemantic(record),
      record,
    };
  }
  if (evidence.semanticKey) {
    return {
      identity: evidence.semanticKey,
      semanticKey: evidence.semanticKey,
      record: null,
    };
  }
  if (evidence.assetId) {
    const asset = indexes.repositoryAssets.get(evidence.assetId);
    if (asset?.origin === "external-provider") {
      return { identity: asset.id, semanticKey: null, record: null };
    }
    if (asset?.repoPath) {
      const unresolved = boundedRepositoryReference(asset.repoPath);
      return { identity: unresolved, semanticKey: null, record: null };
    }
  }
  if (evidence.fileId) {
    return {
      identity: `directus-file:${evidence.environment}:${evidence.fileId}`,
      semanticKey: null,
      record: null,
    };
  }
  if (evidence.unresolvedRef) {
    return {
      identity: normalizeString(evidence.unresolvedRef),
      semanticKey: null,
      record: null,
    };
  }
  return {
    identity: evidence.evidenceUsageId,
    semanticKey: null,
    record: null,
  };
}

function usageGroupKey(evidence: UsageEvidence): Sha256Hex {
  return sha256(
    compactCanonical({
      schemaVersion: 1,
      environment: evidence.environment,
      consumerType: evidence.consumerType,
      consumerKey: evidence.consumerKey,
      sourceKind: evidence.sourceKind,
      sourceFile: evidence.sourceFile,
      cmsField: evidence.cmsField,
      route: evidence.route,
      locale: evidence.locale,
      slot: evidence.slot,
    }),
  );
}

function syncFieldsValid(usage: DiscoveredAssetUsage): boolean {
  return (
    usage.consumerKey.length > 0 &&
    usage.consumerKey.length <= 255 &&
    usage.sourceFile.length > 0 &&
    usage.sourceFile.length <= 1024 &&
    (usage.cmsField === null || usage.cmsField.length <= 512) &&
    usage.slot.length > 0 &&
    usage.slot.length <= 255 &&
    (usage.unresolvedRef === null || usage.unresolvedRef.length <= 255) &&
    (ASSET_DELIVERY_MODES as readonly string[]).includes(usage.deliveryMode)
  );
}

function discoverUsages(
  input: AssetAuditInput,
  indexes: ReconciliationIndexes,
): { usages: DiscoveredAssetUsage[]; issues: UsageBuildIssue[] } {
  const evidence: UsageEvidence[] =
    input.repository.usages.map(repositoryEvidence);
  for (const snapshotValue of [input.dev, input.prod]) {
    for (const reference of snapshotValue?.references ?? []) {
      if (reference.active === true && reference.consumption === "rendered") {
        evidence.push(cmsEvidence(reference));
      }
    }
  }
  const groups = new Map<Sha256Hex, UsageEvidence[]>();
  for (const item of evidence) {
    const key = usageGroupKey(item);
    const group = groups.get(key) ?? [];
    group.push(item);
    groups.set(key, group);
  }
  const usages: DiscoveredAssetUsage[] = [];
  const issues: UsageBuildIssue[] = [];
  for (const [groupKey, group] of groups) {
    group.sort((left, right) =>
      compareUtf8(left.evidenceUsageId, right.evidenceUsageId),
    );
    const resolved = group.map((item) => evidenceIdentity(item, indexes));
    const candidateIdentities = [
      ...new Set(resolved.map((item) => item.identity)),
    ].sort(compareUtf8);
    const semanticCandidates = [
      ...new Set(
        resolved
          .map((item) => item.semanticKey)
          .filter((value) => value !== null),
      ),
    ].sort(compareUtf8) as AssetSemanticKey[];
    const records = [
      ...new Map(
        resolved
          .filter((item) => item.record)
          .map((item) => [item.record!.id, item.record!]),
      ).values(),
    ];
    const identityConflict =
      candidateIdentities.length > 1 || semanticCandidates.length > 1;
    let semanticKey: AssetSemanticKey | null =
      semanticCandidates.length === 1 ? semanticCandidates[0]! : null;
    let record = records.length === 1 ? records[0]! : null;
    let unresolvedRef: string | null = null;
    let assetIdentity: string;
    if (identityConflict) {
      const conflictHash = sha256(compactCanonical(candidateIdentities));
      unresolvedRef = `conflict-sha256:${conflictHash}`;
      assetIdentity = unresolvedRef;
      semanticKey = null;
      record = null;
    } else if (semanticKey) {
      assetIdentity = semanticKey;
      if (!record) unresolvedRef = `semantic:${semanticKey}`;
    } else {
      assetIdentity = candidateIdentities[0] ?? group[0]!.evidenceUsageId;
      unresolvedRef = record ? null : assetIdentity;
    }
    const versions = indexes.versionsByEnvironment.get(group[0]!.environment)!;
    const selection = record ? selectedVersion(record, versions) : null;
    const deliveryModes = [
      ...new Set(group.map((item) => item.deliveryMode)),
    ].sort(compareUtf8);
    const deliveryMode =
      deliveryModes.length === 1
        ? deliveryModes[0]!
        : record
          ? record.delivery_mode
          : deliveryModes[0]!;
    const altOverrides = [
      ...new Set(
        group
          .map((item) => item.altTextOverride)
          .filter((value) => value !== null),
      ),
    ].sort(compareUtf8) as string[];
    const altSources = [
      ...new Set(
        group.map((item) => item.altSource).filter((value) => value !== null),
      ),
    ].sort(compareUtf8) as string[];
    const finalId = sha256(
      compactCanonical({
        schemaVersion: 1,
        environment: group[0]!.environment,
        consumerType: group[0]!.consumerType,
        consumerKey: group[0]!.consumerKey,
        sourceKind: group[0]!.sourceKind,
        sourceFile: group[0]!.sourceFile,
        cmsField: group[0]!.cmsField,
        route: group[0]!.route,
        locale: group[0]!.locale,
        slot: group[0]!.slot,
        assetIdentity,
      }),
    );
    const usage: DiscoveredAssetUsage = {
      id: finalId,
      evidenceUsageId: group[0]!.evidenceUsageId,
      environment: group[0]!.environment,
      syncEligible: false,
      assetRecordId: record?.id ?? null,
      resolvedVersionId: selection?.version?.id ?? null,
      semanticKey,
      unresolvedRef,
      confidence: group
        .map((item) => item.confidence)
        .sort(
          (left, right) => CONFIDENCE_ORDER[left] - CONFIDENCE_ORDER[right],
        )[0]!,
      consumerType: group[0]!.consumerType,
      consumerKey: group[0]!.consumerKey,
      sourceKind: group[0]!.sourceKind,
      sourceFile: group[0]!.sourceFile,
      sourceLine:
        group
          .map((item) => item.sourceLine)
          .filter((value) => value !== null)
          .sort((left, right) => left - right)[0] ?? null,
      cmsField: group[0]!.cmsField,
      route: group[0]!.route,
      locale: group[0]!.locale,
      slot: group[0]!.slot,
      required: group.some((item) => item.required),
      deliveryMode,
      altTextOverride: altOverrides.length === 1 ? altOverrides[0]! : null,
      altSource: altSources.length === 1 ? altSources[0]! : null,
    };
    const snapshotValue = input[usage.environment];
    usage.syncEligible =
      usage.environment === "dev" &&
      snapshotValue?.registryAvailability === "available" &&
      !identityConflict &&
      Number(usage.assetRecordId !== null) +
        Number(usage.unresolvedRef !== null) ===
        1 &&
      syncFieldsValid(usage);
    if (identityConflict) {
      issues.push({
        kind: "identity-conflict",
        usageId: finalId,
        candidates: candidateIdentities,
      });
    }
    if (deliveryModes.length > 1) {
      issues.push({
        kind: "delivery-conflict",
        usageId: finalId,
        candidates: deliveryModes,
      });
    }
    if (altOverrides.length > 1 || altSources.length > 1) {
      issues.push({
        kind: "alt-conflict",
        usageId: finalId,
        candidates: [...altOverrides, ...altSources].sort(compareUtf8),
      });
    }
    usages.push(usage);
  }
  usages.sort((left, right) => compareUtf8(left.id, right.id));
  return { usages, issues };
}

interface SourceNode {
  source: AssetLogicalSource;
  semanticKey: AssetSemanticKey | null;
  legacyPath: string | null;
}

class DisjointSet {
  private readonly parent: number[];

  constructor(size: number) {
    this.parent = Array.from({ length: size }, (_, index) => index);
  }

  find(index: number): number {
    const parent = this.parent[index]!;
    if (parent === index) return index;
    const root = this.find(parent);
    this.parent[index] = root;
    return root;
  }

  union(left: number, right: number): void {
    const leftRoot = this.find(left);
    const rightRoot = this.find(right);
    if (leftRoot !== rightRoot) this.parent[rightRoot] = leftRoot;
  }
}

function sourceSort(
  left: AssetLogicalSource,
  right: AssetLogicalSource,
): number {
  return (
    compareUtf8(left.kind, right.kind) ||
    compareUtf8(left.environment ?? "", right.environment ?? "") ||
    compareUtf8(left.logicalPath ?? "", right.logicalPath ?? "") ||
    compareUtf8(left.fileId ?? "", right.fileId ?? "") ||
    compareUtf8(left.id, right.id)
  );
}

function buildLogicalRows(
  input: AssetAuditInput,
  indexes: ReconciliationIndexes,
  usages: readonly DiscoveredAssetUsage[],
): AssetLogicalRow[] {
  const nodes: SourceNode[] = [];
  const nodeById = new Map<string, number>();
  const add = (node: SourceNode) => {
    nodeById.set(node.source.id, nodes.length);
    nodes.push(node);
  };
  for (const asset of input.repository.assets) {
    add({
      source: {
        id: asset.id,
        kind: asset.origin,
        environment: null,
        logicalPath: asset.repoPath,
        fileId: null,
        sha256: SHA_PATTERN.test(asset.sha256 ?? "")
          ? (asset.sha256 as Sha256Hex)
          : null,
        bytes: asset.bytes,
        mimeType: null,
        width: null,
        height: null,
      },
      semanticKey: null,
      legacyPath: asset.repoPath ? repositoryLegacyPath(asset.repoPath) : null,
    });
  }
  for (const environment of ["dev", "prod"] as const) {
    const snapshotValue = input[environment];
    for (const file of snapshotValue?.files ?? []) {
      add({
        source: {
          id: file.id,
          kind: "directus-file",
          environment,
          logicalPath: validLegacyPath(file.legacyPath),
          fileId: file.fileId,
          sha256: file.sha256,
          bytes: file.observedBytes ?? file.declaredBytes,
          mimeType: file.mimeType,
          width: file.width,
          height: file.height,
        },
        semanticKey: null,
        legacyPath: validLegacyPath(file.legacyPath),
      });
    }
    for (const record of snapshotValue?.records ?? []) {
      add({
        source: {
          id: `asset-record:${environment}:${record.id}`,
          kind: "asset-record",
          environment,
          logicalPath: null,
          fileId: null,
          sha256: null,
          bytes: null,
          mimeType: null,
          width: null,
          height: null,
        },
        semanticKey: recordSemantic(record),
        legacyPath: null,
      });
    }
    for (const version of snapshotValue?.versions ?? []) {
      const record = indexes.recordsByEnvironment
        .get(environment)!
        .get(relationId(version.asset_record) ?? "");
      const file = indexes.filesByEnvironment
        .get(environment)!
        .get(relationId(version.directus_file) ?? "");
      add({
        source: {
          id: `asset-version:${environment}:${version.id}`,
          kind: "asset-version",
          environment,
          logicalPath: file ? validLegacyPath(file.legacyPath) : null,
          fileId: file?.fileId ?? null,
          sha256: version.sha256,
          bytes: version.bytes,
          mimeType: version.mime_type,
          width: version.width,
          height: version.height,
        },
        semanticKey: record ? recordSemantic(record) : null,
        legacyPath: file ? validLegacyPath(file.legacyPath) : null,
      });
    }
  }
  const sets = new DisjointSet(nodes.length);
  const semanticFirst = new Map<string, number>();
  const legacyFirst = new Map<string, number>();
  const shaFirst = new Map<string, number>();
  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index]!;
    if (node.semanticKey) {
      const existing = semanticFirst.get(node.semanticKey);
      if (existing !== undefined) sets.union(existing, index);
      else semanticFirst.set(node.semanticKey, index);
    }
    if (node.legacyPath) {
      const existing = legacyFirst.get(node.legacyPath);
      if (existing !== undefined) sets.union(existing, index);
      else legacyFirst.set(node.legacyPath, index);
    }
  }
  for (const environment of ["dev", "prod"] as const) {
    for (const version of input[environment]?.versions ?? []) {
      const versionNode = nodeById.get(
        `asset-version:${environment}:${version.id}`,
      );
      const recordNode = nodeById.get(
        `asset-record:${environment}:${relationId(version.asset_record) ?? ""}`,
      );
      const fileNode = nodeById.get(
        `directus-file:${environment}:${relationId(version.directus_file) ?? ""}`,
      );
      if (versionNode !== undefined && recordNode !== undefined)
        sets.union(versionNode, recordNode);
      if (versionNode !== undefined && fileNode !== undefined)
        sets.union(versionNode, fileNode);
    }
  }
  for (const repositoryUsage of input.repository.usages) {
    if (!repositoryUsage.assetId || !repositoryUsage.semanticKey) continue;
    const assetNode = nodeById.get(repositoryUsage.assetId);
    const recordNode = semanticFirst.get(repositoryUsage.semanticKey);
    if (assetNode !== undefined && recordNode !== undefined)
      sets.union(assetNode, recordNode);
  }
  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index]!;
    if (node.semanticKey || node.legacyPath || !node.source.sha256) continue;
    const existing = shaFirst.get(node.source.sha256);
    if (existing !== undefined) sets.union(existing, index);
    else shaFirst.set(node.source.sha256, index);
  }
  const grouped = new Map<number, SourceNode[]>();
  for (let index = 0; index < nodes.length; index += 1) {
    const root = sets.find(index);
    const group = grouped.get(root) ?? [];
    group.push(nodes[index]!);
    grouped.set(root, group);
  }
  const usageByRoot = new Map<number, Sha256Hex[]>();
  for (const usage of usages) {
    let nodeIndex: number | undefined;
    if (usage.assetRecordId) {
      nodeIndex = nodeById.get(
        `asset-record:${usage.environment}:${usage.assetRecordId}`,
      );
    }
    if (nodeIndex === undefined && usage.semanticKey) {
      nodeIndex = semanticFirst.get(usage.semanticKey);
    }
    if (
      nodeIndex === undefined &&
      usage.unresolvedRef?.startsWith("repository:")
    ) {
      const path = usage.unresolvedRef.slice("repository:".length);
      nodeIndex = nodeById.get(`repo:${path}`);
    }
    if (nodeIndex === undefined) continue;
    const root = sets.find(nodeIndex);
    const list = usageByRoot.get(root) ?? [];
    list.push(usage.id);
    usageByRoot.set(root, list);
  }
  const rows: AssetLogicalRow[] = [];
  for (const [root, group] of grouped) {
    const semanticKeys = [
      ...new Set(
        group
          .map((node) => node.semanticKey)
          .filter((value): value is AssetSemanticKey => value !== null),
      ),
    ].sort(compareUtf8);
    const legacyPaths = [
      ...new Set(
        group
          .map((node) => node.legacyPath)
          .filter((value): value is string => value !== null),
      ),
    ].sort(compareUtf8);
    const hashes = [
      ...new Set(
        group
          .map((node) => node.source.sha256)
          .filter((value) => value !== null),
      ),
    ].sort(compareUtf8) as Sha256Hex[];
    const sourceIds = group.map((node) => node.source.id).sort(compareUtf8);
    const descriptor = semanticKeys[0]
      ? { kind: "semantic-key", value: semanticKeys[0] }
      : legacyPaths[0]
        ? { kind: "legacy-path", value: legacyPaths[0] }
        : hashes[0]
          ? { kind: "sha256", value: hashes[0] }
          : { kind: "source-id", value: sourceIds[0]! };
    rows.push({
      id: sha256(compactCanonical({ schemaVersion: 1, ...descriptor })),
      semanticKey: semanticKeys[0] ?? null,
      legacyPath: legacyPaths[0] ?? null,
      sha256: hashes.length === 1 ? hashes[0]! : null,
      sources: group.map((node) => node.source).sort(sourceSort),
      usageIds: [...new Set(usageByRoot.get(root) ?? [])].sort(compareUtf8),
    });
  }
  rows.sort((left, right) => compareUtf8(left.id, right.id));
  return rows;
}

function usageIsPublic(usage: DiscoveredAssetUsage): boolean {
  return (
    usage.required ||
    usage.sourceFile.startsWith("apps/web/src/") ||
    usage.sourceKind === "generated" ||
    usage.sourceKind === "route" ||
    usage.sourceKind === "cms" ||
    usage.sourceKind === "declaration"
  );
}

function severityForRequired(required: boolean): AssetFinding["severity"] {
  return required ? "error" : "warning";
}

function selectedFile(
  record: NormalizedAssetRecord,
  environment: CmsEnvironment,
  indexes: ReconciliationIndexes,
): {
  version: NormalizedAssetVersion | null;
  file: NormalizedCmsFile | null;
  invalid: string[];
} {
  const selection = selectedVersion(
    record,
    indexes.versionsByEnvironment.get(environment)!,
  );
  const invalid = [...selection.invalid];
  const version = selection.version;
  const fileId = version ? relationId(version.directus_file) : null;
  const file = fileId
    ? (indexes.filesByEnvironment.get(environment)!.get(fileId) ?? null)
    : null;
  if (version) {
    if (record.kind === "code-component") {
      if (version.source_mode !== "code-component")
        invalid.push("code-component-source-mode");
      if (fileId !== null) invalid.push("code-component-directus-file");
      if (!version.component_key) invalid.push("code-component-key-missing");
      if (version.component_key !== record.code_component_key) {
        invalid.push("code-component-key-mismatch");
      }
      const component = [...indexes.repositoryAssets.values()].find(
        (asset) =>
          asset.origin === "code-component" &&
          (asset.repoPath?.endsWith(`/${version.component_key}`) ||
            asset.id === version.component_key),
      );
      if (!component) invalid.push("code-component-source-missing");
      else if (component.sha256 !== version.sha256)
        invalid.push("code-component-sha256-mismatch");
    } else {
      if (
        !(["upload", "generated", "migrated"] as const).includes(
          version.source_mode as never,
        )
      ) {
        invalid.push("file-source-mode");
      }
      if (!fileId) invalid.push("directus-file-missing");
      if (version.component_key !== null) invalid.push("component-key-present");
      if (fileId && !file) invalid.push("directus-file-not-found");
      if (file?.sha256 && version.sha256 !== file.sha256)
        invalid.push("file-sha256-mismatch");
      if (
        file?.observedBytes !== null &&
        version.bytes !== null &&
        file?.observedBytes !== version.bytes
      ) {
        invalid.push("file-bytes-mismatch");
      }
      if (
        version.source_mode === "generated" &&
        (!version.generator_signature || !version.input_hash)
      ) {
        invalid.push("generated-fingerprint-missing");
      }
    }
  }
  return { version, file, invalid: [...new Set(invalid)].sort(compareUtf8) };
}

function buildMissingAndUsageFindings(
  input: AssetAuditInput,
  indexes: ReconciliationIndexes,
  receipts: readonly AssetAuditScopeReceipt[],
  discovered: readonly DiscoveredAssetUsage[],
  usageIssues: readonly UsageBuildIssue[],
): AssetFinding[] {
  const findings: AssetFinding[] = [];
  for (const usage of discovered) {
    const sourceScope: AssetAuditScope =
      usage.sourceKind === "cms"
        ? `${usage.environment}-content`
        : "repository";
    const registryScope = `${usage.environment}-registry` as AssetAuditScope;
    const record = usage.semanticKey
      ? indexes.recordsBySemantic.get(usage.environment)!.get(usage.semanticKey)
      : usage.assetRecordId
        ? indexes.recordsByEnvironment
            .get(usage.environment)!
            .get(usage.assetRecordId)
        : null;
    if (
      usage.semanticKey &&
      !record &&
      scopeEvaluated(receipts, registryScope)
    ) {
      findings.push(
        makeFinding({
          code: "missing-record",
          severity: severityForRequired(usage.required || usageIsPublic(usage)),
          identity: `${usage.semanticKey}|${usage.id}`,
          message: `No ${usage.environment.toUpperCase()} asset record tracks ${usage.semanticKey}.`,
          evidence: {
            semanticKey: usage.semanticKey,
            consumer: `${usage.consumerType}:${usage.consumerKey}`,
            route: usage.route,
            locale: usage.locale,
            slot: usage.slot,
            required: usage.required,
          },
          requiredScopes: scopes(sourceScope, registryScope),
        }),
      );
    }
    if (record && scopeEvaluated(receipts, registryScope)) {
      const selected = selectedFile(record, usage.environment, indexes);
      if (selected.invalid.length > 0) {
        const selection = selectedVersion(
          record,
          indexes.versionsByEnvironment.get(usage.environment)!,
        );
        findings.push(
          makeFinding({
            code: "missing-version",
            severity: severityForRequired(
              usage.required || usageIsPublic(usage),
            ),
            identity: recordSemantic(record),
            message: `The selected version for ${recordSemantic(record)} is missing or invalid.`,
            evidence: {
              lifecycle: record.lifecycle_status,
              selectedPointerKind: selection.pointerKind,
              invalidInvariants: selected.invalid,
            },
            requiredScopes: scopes(sourceScope, registryScope),
          }),
        );
      }
    }
    if (
      usage.confidence === "unknown" &&
      usage.unresolvedRef &&
      !usage.unresolvedRef.startsWith("conflict-sha256:")
    ) {
      const rawUsage = input.repository.usages.find(
        (candidate) => candidate.id === usage.evidenceUsageId,
      );
      const declarationCandidates = rawUsage
        ? input.repository.usages.filter(
            (candidate) =>
              candidate.id !== rawUsage.id &&
              candidate.confidence === "declared-dynamic" &&
              candidate.sourceKind === "declaration" &&
              normalizeString(candidate.sourceFile) ===
                normalizeString(rawUsage.sourceFile) &&
              candidate.deliveryMode === rawUsage.deliveryMode,
          )
        : [];
      const unknownCandidates = rawUsage
        ? input.repository.usages.filter(
            (candidate) =>
              candidate.confidence === "unknown" &&
              normalizeString(candidate.sourceFile) ===
                normalizeString(rawUsage.sourceFile) &&
              candidate.deliveryMode === rawUsage.deliveryMode,
          )
        : [];
      const declared =
        declarationCandidates.length === 1 && unknownCandidates.length === 1;
      if (!declared) {
        findings.push(
          makeFinding({
            code: "unresolved-dynamic-usage",
            severity: severityForRequired(
              usage.required && usageIsPublic(usage),
            ),
            identity: usage.id,
            message: `Asset usage ${usage.evidenceUsageId} could not be resolved.`,
            evidence: {
              unresolvedRef: usage.unresolvedRef,
              confidence: usage.confidence,
              declarationState: "missing",
            },
            requiredScopes: scopes(sourceScope),
          }),
        );
      }
    }
  }
  for (const issue of usageIssues) {
    const usage = discovered.find(
      (candidate) => candidate.id === issue.usageId,
    )!;
    if (issue.kind === "alt-conflict") {
      findings.push(
        makeFinding({
          code: "missing-alt-text",
          severity: severityForRequired(usage.required),
          identity: `${usage.semanticKey ?? usage.id}|${usage.locale ?? "global"}`,
          message: `Conflicting alt evidence exists for ${usage.evidenceUsageId}.`,
          evidence: {
            altMode: "usage-supplied",
            localePolicy: "usage-supplied",
            overrideState: "conflict",
            contextState: "conflict",
          },
          requiredScopes: scopes(
            usage.sourceKind === "cms"
              ? `${usage.environment}-content`
              : "repository",
          ),
        }),
      );
    } else {
      findings.push(
        makeFinding({
          code: "invalid-format",
          severity: severityForRequired(usage.required),
          identity: usage.id,
          message: `Conflicting ${issue.kind === "identity-conflict" ? "asset identity" : "delivery"} evidence exists.`,
          evidence: {
            kind: null,
            sourceMode: null,
            mimeType: null,
            format: null,
            delivery: usage.deliveryMode,
            violatedInvariant: issue.kind,
          },
          requiredScopes: scopes(
            usage.sourceKind === "cms"
              ? `${usage.environment}-content`
              : "repository",
          ),
        }),
      );
    }
  }
  return findings;
}

function generatedChainComplete(
  assetId: string,
  input: AssetAuditInput,
  tracked: ReadonlySet<string>,
  visiting = new Set<string>(),
): boolean {
  if (tracked.has(assetId)) return true;
  if (visiting.has(assetId)) return false;
  visiting.add(assetId);
  try {
    const links = input.repository.generatedFrom.filter(
      (link) => link.outputAssetId === assetId,
    );
    if (links.length === 0) return false;
    return links.every((link) => {
      const directMatches = input.repository.assets.filter(
        (asset) => asset.id === link.inputRef,
      );
      const fragmentIndex = link.inputRef.indexOf("#");
      const repoPath =
        fragmentIndex < 0
          ? link.inputRef
          : link.inputRef.slice(0, fragmentIndex);
      const pathMatches =
        directMatches.length === 0 && repoPath
          ? input.repository.assets.filter(
              (asset) => asset.repoPath === repoPath,
            )
          : [];
      const direct =
        directMatches.length === 1
          ? directMatches[0]
          : pathMatches.length === 1
            ? pathMatches[0]
            : undefined;
      return direct
        ? generatedChainComplete(direct.id, input, tracked, visiting)
        : false;
    });
  } finally {
    visiting.delete(assetId);
  }
}

function buildInventoryFindings(
  input: AssetAuditInput,
  indexes: ReconciliationIndexes,
  receipts: readonly AssetAuditScopeReceipt[],
  discovered: readonly DiscoveredAssetUsage[],
): AssetFinding[] {
  const findings: AssetFinding[] = [];
  const trackedAssetIds = new Set<string>();
  for (const usage of input.repository.usages) {
    if (!usage.assetId) continue;
    if (
      usage.semanticKey &&
      indexes.recordsBySemantic.get("dev")!.has(usage.semanticKey)
    ) {
      trackedAssetIds.add(usage.assetId);
      continue;
    }
    const evidence = repositoryEvidence(usage);
    if (recordForEvidence(evidence, indexes))
      trackedAssetIds.add(usage.assetId);
  }
  for (const asset of input.repository.assets) {
    if (asset.repoPath) {
      const legacy = repositoryLegacyPath(asset.repoPath);
      if (legacy && indexes.recordByLegacy.get("dev")!.has(legacy))
        trackedAssetIds.add(asset.id);
    }
    if (asset.origin === "code-component" && asset.repoPath) {
      const key = asset.repoPath.split("/").at(-1)!;
      if (indexes.recordByComponent.get("dev")!.has(key))
        trackedAssetIds.add(asset.id);
    }
  }
  if (scopeEvaluated(receipts, "dev-registry")) {
    for (const asset of input.repository.assets) {
      if (asset.origin === "external-provider" || asset.origin === "cms-mirror")
        continue;
      if (trackedAssetIds.has(asset.id)) continue;
      if (
        asset.origin === "generated-file" &&
        generatedChainComplete(asset.id, input, trackedAssetIds)
      ) {
        continue;
      }
      const authored = [
        "repository-file",
        "external-publication",
        "code-component",
      ].includes(asset.origin);
      const required = input.repository.usages.some(
        (usage) => usage.assetId === asset.id && usage.required,
      );
      if (authored || asset.origin === "generated-file") {
        findings.push(
          makeFinding({
            code: "untracked-repo-asset",
            severity: severityForRequired(required),
            identity: asset.repoPath ?? asset.id,
            message: `${asset.repoPath ?? asset.id} has no governed DEV record/version.`,
            evidence: {
              origin: asset.origin,
              sha256: asset.sha256,
              completeChainState:
                asset.origin === "generated-file"
                  ? "incomplete"
                  : "not-applicable",
            },
            requiredScopes: scopes("repository", "dev-registry"),
          }),
        );
      }
    }
  }
  const usedRecordIds = new Set(
    discovered
      .filter((usage) => usage.environment === "dev")
      .map((usage) => usage.assetRecordId)
      .filter((value) => value !== null),
  );
  if (
    scopeEvaluated(receipts, "dev-registry") &&
    scopeEvaluated(receipts, "dev-content") &&
    scopeEvaluated(receipts, "repository")
  ) {
    for (const record of input.dev?.records ?? []) {
      if (
        ACTIVE_LIFECYCLES.has(record.lifecycle_status) &&
        !usedRecordIds.has(record.id)
      ) {
        findings.push(
          makeFinding({
            code: "unused-record",
            severity: "warning",
            identity: recordSemantic(record),
            message: `${recordSemantic(record)} has no current rendered usage.`,
            evidence: {
              lifecycle: record.lifecycle_status,
              ownerType: record.owner_type,
              ownerKey: record.owner_key,
            },
            requiredScopes: scopes("repository", "dev-registry", "dev-content"),
          }),
        );
      }
    }
  }
  for (const environment of ["dev", "prod"] as const) {
    const filesScope = `${environment}-files` as AssetAuditScope;
    const contentScope = `${environment}-content` as AssetAuditScope;
    const registryScope = `${environment}-registry` as AssetAuditScope;
    if (
      !scopeEvaluated(receipts, filesScope) ||
      !scopeEvaluated(receipts, contentScope) ||
      !scopeEvaluated(receipts, registryScope)
    ) {
      continue;
    }
    const snapshotValue = input[environment]!;
    const versionFiles = new Set(
      snapshotValue.versions
        .map((version) => relationId(version.directus_file))
        .filter(Boolean),
    );
    const renderedFiles = new Set(
      snapshotValue.references
        .filter(
          (reference) =>
            reference.active === true && reference.consumption === "rendered",
        )
        .map((reference) => reference.fileId)
        .filter(Boolean),
    );
    const mirrors = new Set(
      input.repository.assets
        .filter((asset) => asset.origin === "cms-mirror" && asset.repoPath)
        .map((asset) => repositoryLegacyPath(asset.repoPath!))
        .filter(Boolean),
    );
    for (const file of snapshotValue.files) {
      const relationPresent = renderedFiles.has(file.fileId);
      const versionPresent = versionFiles.has(file.fileId);
      const mirrorPresent = Boolean(
        file.legacyPath && mirrors.has(validLegacyPath(file.legacyPath)),
      );
      if (!relationPresent && !versionPresent && !mirrorPresent) {
        findings.push(
          makeFinding({
            code: "orphaned-directus-file",
            severity: "warning",
            identity: `${environment}:${validLegacyPath(file.legacyPath) ?? file.sha256 ?? file.fileId}`,
            message: `${file.fileId} is unreachable in ${environment}.`,
            evidence: {
              hashState: file.hashState,
              relationPresent,
              versionPresent,
              mirrorPresent,
            },
            requiredScopes: scopes(
              "repository",
              registryScope,
              filesScope,
              contentScope,
            ),
          }),
        );
      }
    }
  }
  return findings;
}

function buildDuplicateAndHardcodedFindings(
  input: AssetAuditInput,
  discovered: readonly DiscoveredAssetUsage[],
): AssetFinding[] {
  const findings: AssetFinding[] = [];
  const authoredByHash = new Map<string, RepositoryAsset[]>();
  for (const asset of input.repository.assets) {
    if (
      !asset.sha256 ||
      !["repository-file", "external-publication", "code-component"].includes(
        asset.origin,
      )
    ) {
      continue;
    }
    const group = authoredByHash.get(asset.sha256) ?? [];
    group.push(asset);
    authoredByHash.set(asset.sha256, group);
  }
  for (const [hash, group] of authoredByHash) {
    const identities = group
      .filter((asset, index) => {
        if (
          asset.origin !== "code-component" ||
          asset.inlineSvgOrdinal === null
        )
          return true;
        return !group.some(
          (other, otherIndex) =>
            otherIndex < index &&
            other.origin === "code-component" &&
            other.repoPath === asset.repoPath &&
            other.inlineSvgOrdinal !== null,
        );
      })
      .map((asset) => asset.id)
      .sort(compareUtf8);
    if (identities.length > 1) {
      findings.push(
        makeFinding({
          code: "duplicate-content",
          severity: "warning",
          identity: hash,
          message: `Independent authored assets share SHA-256 ${hash}.`,
          evidence: { authoredIdentities: identities },
          requiredScopes: scopes("repository"),
        }),
      );
    }
  }
  for (const usage of input.repository.usages) {
    const subject = usage.unresolvedRef;
    if (
      !subject ||
      (!ASSET_URL_PATTERN.test(subject) && !UUID_PATTERN.test(subject))
    )
      continue;
    const discoveredUsage = discovered.find(
      (candidate) => candidate.evidenceUsageId === usage.id,
    );
    findings.push(
      makeFinding({
        code: "hardcoded-file-id",
        severity: severityForRequired(
          usage.required &&
            usageIsPublic(
              discoveredUsage ??
                ({
                  ...usage,
                  environment: "dev",
                } as unknown as DiscoveredAssetUsage),
            ),
        ),
        identity: `${usage.id}|${subject}`,
        message: `${usage.sourceFile} contains a hardcoded Directus file reference.`,
        evidence: {
          sourceKind: usage.sourceKind,
          sourceFile: usage.sourceFile,
          cmsField: usage.cmsField,
          route: usage.route,
          locale: usage.locale,
          slot: usage.slot,
        },
        requiredScopes: scopes("repository"),
      }),
    );
  }
  for (const snapshotValue of [input.dev, input.prod]) {
    for (const reference of snapshotValue?.references ?? []) {
      if (
        reference.referenceKind !== "embedded-asset-url" &&
        !(reference.rawRef && UUID_PATTERN.test(reference.rawRef))
      ) {
        continue;
      }
      findings.push(
        makeFinding({
          code: "hardcoded-file-id",
          severity: severityForRequired(
            reference.required && reference.active === true,
          ),
          identity: `${reference.id}|${reference.rawRef ?? reference.fileId}`,
          message: `${reference.collection}.${reference.field} contains a hardcoded file reference.`,
          evidence: {
            sourceKind: "cms",
            sourceFile: `cms:${reference.collection}/${reference.itemKey}`,
            cmsField: reference.field,
            route: reference.route,
            locale: reference.locale,
            slot: reference.slot,
          },
          requiredScopes: scopes(`${reference.environment}-content`),
        }),
      );
    }
  }
  return findings;
}

function buildRepositoryScanFindingFindings(
  input: AssetAuditInput,
): AssetFinding[] {
  const findings: AssetFinding[] = [];
  for (const scanFinding of input.repository.findings) {
    if (scanFinding.code === "duplicate-identity") continue;
    const rawRef = normalizeString(scanFinding.rawRef);
    const hardcoded =
      ASSET_URL_PATTERN.test(rawRef) || UUID_PATTERN.test(rawRef);
    if (hardcoded) {
      findings.push(
        makeFinding({
          code: "hardcoded-file-id",
          severity: scanFinding.sourceFile.startsWith("apps/web/src/")
            ? "error"
            : "warning",
          identity: `${scanFinding.sourceFile}|${rawRef}`,
          message: `${scanFinding.sourceFile} contains a hardcoded Directus file reference.`,
          evidence: {
            sourceKind: "repository",
            sourceFile: scanFinding.sourceFile,
            cmsField: null,
            route: null,
            locale: null,
            slot: "unresolved",
          },
          requiredScopes: scopes("repository"),
        }),
      );
      continue;
    }
    const unresolvedCandidate =
      scanFinding.code === "dynamic-reference" ||
      scanFinding.code === "missing-target" ||
      scanFinding.code === "undeclared-external" ||
      (scanFinding.code === "unsupported-pattern" &&
        ASSET_EXTENSION_PATTERN.test(rawRef));
    if (!unresolvedCandidate) continue;
    const matched = input.repository.usages.some((usage) => {
      if (
        !sameSourceModule(usage.sourceFile, scanFinding.sourceFile) ||
        usage.sourceLine !== scanFinding.sourceLine
      ) {
        return false;
      }
      const identities = new Set<string>();
      if (usage.unresolvedRef !== null) {
        identities.add(normalizeString(usage.unresolvedRef));
      }
      if (usage.assetId !== null) {
        identities.add(normalizeString(usage.assetId));
        const asset = input.repository.assets.find(
          (candidate) => candidate.id === usage.assetId,
        );
        if (asset?.repoPath) {
          identities.add(normalizeString(asset.repoPath));
          identities.add(normalizeString(`repository:${asset.repoPath}`));
        }
      }
      return identities.has(rawRef);
    });
    if (matched) continue;
    const identity = sha256(
      compactCanonical({
        schemaVersion: 1,
        sourceFile: scanFinding.sourceFile,
        rawRef,
      }),
    );
    findings.push(
      makeFinding({
        code: "unresolved-dynamic-usage",
        severity: scanFinding.sourceFile.startsWith("apps/web/src/")
          ? "error"
          : "warning",
        identity,
        message: `${scanFinding.sourceFile} contains unmatched asset evidence.`,
        evidence: {
          unresolvedRef: rawRef,
          confidence: "unknown",
          declarationState: "missing",
        },
        requiredScopes: scopes("repository"),
      }),
    );
  }
  return findings;
}

function buildGeneratedFindings(
  input: AssetAuditInput,
  indexes: ReconciliationIndexes,
): AssetFinding[] {
  const findings: AssetFinding[] = [];
  for (const expectation of input.generatedOutputs) {
    const asset = indexes.repositoryAssets.get(expectation.outputAssetId);
    const record = expectation.semanticKey
      ? indexes.recordsBySemantic.get("dev")!.get(expectation.semanticKey)
      : null;
    const selection = record
      ? selectedVersion(record, indexes.versionsByEnvironment.get("dev")!)
      : null;
    const observedOutputSha256 = asset?.sha256 ?? null;
    const observedInputHash = selection?.version?.input_hash ?? null;
    const outputMismatch =
      expectation.expectedOutputSha256 !== null &&
      observedOutputSha256 !== expectation.expectedOutputSha256;
    const inputMismatch =
      expectation.expectedInputHash !== null &&
      observedInputHash !== expectation.expectedInputHash;
    const fingerprintMissing =
      expectation.expectedOutputSha256 === null ||
      expectation.expectedInputHash === null;
    const metadataMissing = expectation.observedMetadataState === "missing";
    if (
      outputMismatch ||
      inputMismatch ||
      fingerprintMissing ||
      metadataMissing
    ) {
      findings.push(
        makeFinding({
          code: "stale-generated-output",
          severity: severityForRequired(
            expectation.required &&
              (outputMismatch || inputMismatch || metadataMissing),
          ),
          identity: expectation.outputAssetId,
          message: `${expectation.outputAssetId} lacks current reproducible generation evidence.`,
          evidence: {
            expectedOutputSha256: expectation.expectedOutputSha256,
            observedOutputSha256,
            expectedInputHash: expectation.expectedInputHash,
            observedInputHash,
            required: expectation.required,
          },
          requiredScopes: scopes("repository", "generated-outputs"),
        }),
      );
    }
    if (expectation.observedMetadataState === "observed") {
      if (
        expectation.expectedMimeType !== null &&
        expectation.observedMimeType !== expectation.expectedMimeType
      ) {
        findings.push(
          makeFinding({
            code: "invalid-format",
            severity: severityForRequired(expectation.required),
            identity: expectation.outputAssetId,
            message: `${expectation.outputAssetId} has unexpected generated MIME type.`,
            evidence: {
              kind: "generated-output",
              sourceMode: "generated",
              mimeType: expectation.observedMimeType,
              format: expectation.expectedMimeType,
              delivery: "og-meta",
              violatedInvariant: "generated-mime-mismatch",
            },
            requiredScopes: scopes("generated-outputs"),
          }),
        );
      }
      if (
        expectation.expectedWidth !== null &&
        expectation.expectedHeight !== null &&
        (expectation.observedWidth !== expectation.expectedWidth ||
          expectation.observedHeight !== expectation.expectedHeight)
      ) {
        findings.push(
          makeFinding({
            code: "invalid-dimensions",
            severity: severityForRequired(expectation.required),
            identity: expectation.outputAssetId,
            message: `${expectation.outputAssetId} has unexpected generated dimensions.`,
            evidence: {
              expectedWidth: expectation.expectedWidth,
              expectedHeight: expectation.expectedHeight,
              observedWidth: expectation.observedWidth,
              observedHeight: expectation.observedHeight,
            },
            requiredScopes: scopes("generated-outputs"),
          }),
        );
      }
    }
  }
  return findings;
}

function logicalFileKey(
  environment: CmsEnvironment,
  file: NormalizedCmsFile,
  indexes: ReconciliationIndexes,
): string {
  const record = indexes.recordByFile.get(environment)!.get(file.fileId);
  if (record) return `semantic:${recordSemantic(record)}`;
  const legacy = validLegacyPath(file.legacyPath);
  if (legacy) return `legacy:${legacy}`;
  return `file-id:${file.fileId}`;
}

function buildEnvironmentFindings(
  input: AssetAuditInput,
  indexes: ReconciliationIndexes,
  receipts: readonly AssetAuditScopeReceipt[],
  rows: readonly AssetLogicalRow[],
  discovered: readonly DiscoveredAssetUsage[],
): AssetFinding[] {
  const findings: AssetFinding[] = [];
  if (!input.dev || !input.prod) return findings;
  if (
    scopeEvaluated(receipts, "dev-registry") &&
    scopeEvaluated(receipts, "prod-registry")
  ) {
    const devRecords = new Map(
      input.dev.records.map((record) => [recordSemantic(record), record]),
    );
    const prodRecords = new Map(
      input.prod.records.map((record) => [recordSemantic(record), record]),
    );
    const semanticKeys = [
      ...new Set([...devRecords.keys(), ...prodRecords.keys()]),
    ].sort(compareUtf8);
    for (const semanticKey of semanticKeys) {
      const devRecord = devRecords.get(semanticKey);
      const prodRecord = prodRecords.get(semanticKey);
      if (
        devRecord &&
        prodRecord &&
        !ACTIVE_LIFECYCLES.has(devRecord.lifecycle_status) &&
        !ACTIVE_LIFECYCLES.has(prodRecord.lifecycle_status)
      ) {
        continue;
      }
      const errorFields: string[] = [];
      const warningFields: string[] = [];
      const devError: Record<string, unknown> = {};
      const prodError: Record<string, unknown> = {};
      const devWarning: Record<string, unknown> = {};
      const prodWarning: Record<string, unknown> = {};
      const compareField = (
        field: string,
        left: unknown,
        right: unknown,
        severity: "error" | "warning",
      ) => {
        if (compactCanonical(left) === compactCanonical(right)) return;
        const fields = severity === "error" ? errorFields : warningFields;
        const devEvidence = severity === "error" ? devError : devWarning;
        const prodEvidence = severity === "error" ? prodError : prodWarning;
        fields.push(field);
        devEvidence[field] = left;
        prodEvidence[field] = right;
      };
      if (!devRecord || !prodRecord) {
        compareField(
          "record.presence",
          Boolean(devRecord),
          Boolean(prodRecord),
          "error",
        );
      } else {
        for (const field of [
          "lifecycle_status",
          "kind",
          "role",
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
          "max_bytes",
          "brand_status",
          "approved_token_slots",
        ] as const) {
          compareField(
            `record.${field}`,
            devRecord[field],
            prodRecord[field],
            "error",
          );
        }
        for (const field of [
          "title",
          "meaning",
          "focal_point_x",
          "focal_point_y",
        ] as const) {
          compareField(
            `record.${field}`,
            devRecord[field],
            prodRecord[field],
            "warning",
          );
        }
        const devSelection = selectedVersion(
          devRecord,
          indexes.versionsByEnvironment.get("dev")!,
        );
        const prodSelection = selectedVersion(
          prodRecord,
          indexes.versionsByEnvironment.get("prod")!,
        );
        for (const field of [
          "source_mode",
          "component_key",
          "sha256",
          "mime_type",
          "format",
          "bytes",
          "width",
          "height",
          "duration_ms",
          "source_hash",
          "dependency_hashes",
          "transform_profile",
          "transform_signature",
          "sanitizer_signature",
          "generator_signature",
          "toolchain_signature",
          "approval_status",
          "quarantine_reason",
          "sanitized_output_sha256",
          "input_hash",
          "brand_slots",
          "svg_id_prefix",
          "template_version",
          "safety_report",
        ] as const) {
          compareField(
            `version.${field}`,
            devSelection.version?.[field] ?? null,
            prodSelection.version?.[field] ?? null,
            "error",
          );
        }
        const devTranslations = new Map(
          recordTranslations(input.dev, devRecord).map((translation) => [
            translation.languages_code,
            translation,
          ]),
        );
        const prodTranslations = new Map(
          recordTranslations(input.prod, prodRecord).map((translation) => [
            translation.languages_code,
            translation,
          ]),
        );
        const requiredLocales =
          devRecord.locale_policy === "localized" ||
          prodRecord.locale_policy === "localized"
            ? ["en", "fr", "es"]
            : ["en"];
        for (const locale of requiredLocales) {
          const devTranslation = devTranslations.get(locale);
          const prodTranslation = prodTranslations.get(locale);
          if (
            devRecord.alt_mode === "informative" ||
            prodRecord.alt_mode === "informative"
          ) {
            compareField(
              `translation.${locale}.alt_text`,
              devTranslation?.alt_text ?? null,
              prodTranslation?.alt_text ?? null,
              "error",
            );
          }
          if (devRecord.role === "og" || prodRecord.role === "og") {
            compareField(
              `translation.${locale}.og_image_alt`,
              devTranslation?.og_image_alt ?? null,
              prodTranslation?.og_image_alt ?? null,
              "error",
            );
          }
          for (const field of ["caption", "credit"] as const) {
            compareField(
              `translation.${locale}.${field}`,
              devTranslation?.[field] ?? null,
              prodTranslation?.[field] ?? null,
              "warning",
            );
          }
        }
      }
      const rowId =
        rows.find((row) => row.semanticKey === semanticKey)?.id ?? semanticKey;
      if (errorFields.length > 0) {
        findings.push(
          makeFinding({
            code: "environment-drift",
            severity: "error",
            identity: rowId,
            message: `${semanticKey} has behavior or proof drift between DEV and PROD.`,
            evidence: {
              differingFields: errorFields.sort(compareUtf8),
              dev: devError,
              prod: prodError,
            },
            requiredScopes: scopes(
              "dev-registry",
              "dev-files",
              "prod-registry",
              "prod-files",
            ),
          }),
        );
      }
      if (warningFields.length > 0) {
        findings.push(
          makeFinding({
            code: "environment-drift",
            severity: "warning",
            identity: `${rowId}:display`,
            message: `${semanticKey} has display-only drift between DEV and PROD.`,
            evidence: {
              differingFields: warningFields.sort(compareUtf8),
              dev: devWarning,
              prod: prodWarning,
            },
            requiredScopes: scopes("dev-registry", "prod-registry"),
          }),
        );
      }
    }
  }
  if (
    !scopeEvaluated(receipts, "dev-files") ||
    !scopeEvaluated(receipts, "prod-files")
  ) {
    return findings;
  }
  const devFiles = new Map(
    input.dev.files.map((file) => [logicalFileKey("dev", file, indexes), file]),
  );
  const prodFiles = new Map(
    input.prod.files.map((file) => [
      logicalFileKey("prod", file, indexes),
      file,
    ]),
  );
  const keys = [...new Set([...devFiles.keys(), ...prodFiles.keys()])].sort(
    compareUtf8,
  );
  const fileIsPublic = (
    environment: CmsEnvironment,
    file: NormalizedCmsFile | undefined,
  ): boolean => {
    if (!file) return false;
    const snapshotValue = input[environment]!;
    if (
      snapshotValue.references.some(
        (reference) =>
          reference.fileId === file.fileId &&
          reference.active === true &&
          reference.consumption === "rendered",
      )
    ) {
      return true;
    }
    const record = indexes.recordByFile.get(environment)!.get(file.fileId);
    return Boolean(
      record &&
      discovered.some(
        (usage) =>
          usage.environment === environment &&
          usage.assetRecordId === record.id &&
          usageIsPublic(usage),
      ),
    );
  };
  for (const key of keys) {
    const dev = devFiles.get(key);
    const prod = prodFiles.get(key);
    const differingFields: string[] = [];
    const devEvidence: Record<string, unknown> = {};
    const prodEvidence: Record<string, unknown> = {};
    const publicLogicalFile =
      fileIsPublic("dev", dev) || fileIsPublic("prod", prod);
    let severity: AssetFinding["severity"] = publicLogicalFile
      ? "error"
      : "warning";
    if (!dev || !prod) {
      differingFields.push("presence");
      devEvidence.present = Boolean(dev);
      prodEvidence.present = Boolean(prod);
    } else {
      if (
        dev.hashState === "verified" &&
        prod.hashState === "verified" &&
        dev.sha256 !== prod.sha256
      ) {
        differingFields.push("sha256");
        devEvidence.sha256 = dev.sha256;
        prodEvidence.sha256 = prod.sha256;
        severity = "error";
      }
      const comparisons = [
        ["mimeType", dev.mimeType, prod.mimeType],
        ["width", dev.width, prod.width],
        ["height", dev.height, prod.height],
        ["observedBytes", dev.observedBytes, prod.observedBytes],
      ] as const;
      for (const [field, left, right] of comparisons) {
        if (left !== right) {
          differingFields.push(field);
          devEvidence[field] = left;
          prodEvidence[field] = right;
        }
      }
    }
    if (differingFields.length > 0) {
      const row = rows.find((candidate) =>
        candidate.sources.some(
          (source) => source.id === dev?.id || source.id === prod?.id,
        ),
      );
      findings.push(
        makeFinding({
          code: "environment-drift",
          severity,
          identity: row?.id ?? key,
          message: `${key} differs between DEV and PROD.`,
          evidence: {
            differingFields: differingFields.sort(compareUtf8),
            dev: devEvidence,
            prod: prodEvidence,
          },
          requiredScopes: scopes("dev-files", "prod-files"),
        }),
      );
    }
  }
  const devPresets = new Map(
    input.dev.transformPresets.map((preset) => [preset.key, preset]),
  );
  const prodPresets = new Map(
    input.prod.transformPresets.map((preset) => [preset.key, preset]),
  );
  for (const key of [
    ...new Set([...devPresets.keys(), ...prodPresets.keys()]),
  ].sort(compareUtf8)) {
    const dev = devPresets.get(key);
    const prod = prodPresets.get(key);
    if (compactCanonical(dev ?? null) === compactCanonical(prod ?? null))
      continue;
    const fields = [
      "fit",
      "width",
      "height",
      "quality",
      "format",
      "withoutEnlargement",
    ].filter(
      (field) =>
        (dev as unknown as Record<string, unknown> | undefined)?.[field] !==
        (prod as unknown as Record<string, unknown> | undefined)?.[field],
    );
    findings.push(
      makeFinding({
        code: "environment-drift",
        severity: "warning",
        identity: `transform-preset:${key}`,
        message: `Transform preset ${key} differs between DEV and PROD.`,
        evidence: {
          differingFields: fields,
          dev: dev ?? null,
          prod: prod ?? null,
        },
        requiredScopes: scopes("dev-files", "prod-files"),
      }),
    );
  }
  return findings;
}

function nonEmpty(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function recordTranslations(
  snapshotValue: DirectusAssetSnapshot,
  record: NormalizedAssetRecord,
): NormalizedAssetTranslation[] {
  return snapshotValue.translations.filter(
    (translation) => relationId(translation.asset_records_id) === record.id,
  );
}

function buildAccessibilityFindings(
  input: AssetAuditInput,
  indexes: ReconciliationIndexes,
  discovered: readonly DiscoveredAssetUsage[],
  usageIssues: readonly UsageBuildIssue[],
): AssetFinding[] {
  const findings: AssetFinding[] = [];
  const conflictIds = new Set(
    usageIssues
      .filter((issue) => issue.kind === "alt-conflict")
      .map((issue) => issue.usageId),
  );
  for (const usage of discovered) {
    if (conflictIds.has(usage.id)) continue;
    const record = usage.assetRecordId
      ? indexes.recordsByEnvironment
          .get(usage.environment)!
          .get(usage.assetRecordId)
      : usage.semanticKey
        ? indexes.recordsBySemantic
            .get(usage.environment)!
            .get(usage.semanticKey)
        : null;
    if (!record) continue;
    const snapshotValue = input[usage.environment]!;
    const translations = recordTranslations(snapshotValue, record);
    const missing: Array<{
      locale: string | null;
      overrideState: string;
      contextState: string;
      severity: AssetFinding["severity"];
    }> = [];
    if (record.alt_mode === "decorative") {
      if (
        ["local-img", "sanitized-svg-img"].includes(usage.deliveryMode) &&
        usage.altTextOverride !== ""
      ) {
        missing.push({
          locale: usage.locale,
          overrideState:
            usage.altTextOverride === null ? "missing" : "non-empty",
          contextState: usage.altSource ? "dynamic" : "missing",
          severity: severityForRequired(usage.required),
        });
      }
    } else if (record.alt_mode === "informative") {
      const locales =
        record.locale_policy === "localized" ? ["en", "fr", "es"] : ["en"];
      for (const locale of locales) {
        const translation = translations.find(
          (candidate) => candidate.languages_code === locale,
        );
        if (!nonEmpty(translation?.alt_text)) {
          missing.push({
            locale,
            overrideState: nonEmpty(usage.altTextOverride)
              ? "present"
              : "missing",
            contextState: nonEmpty(usage.altTextOverride)
              ? "override"
              : usage.altSource
                ? "dynamic"
                : "missing",
            severity: severityForRequired(
              usage.required || usageIsPublic(usage),
            ),
          });
        }
      }
    } else if (record.alt_mode === "usage-supplied") {
      if (!nonEmpty(usage.altTextOverride)) {
        missing.push({
          locale: usage.locale,
          overrideState: usage.altTextOverride === "" ? "empty" : "missing",
          contextState: usage.altSource ? "dynamic" : "missing",
          severity: usage.altSource
            ? "warning"
            : severityForRequired(usage.required),
        });
      }
    }
    for (const gap of missing) {
      findings.push(
        makeFinding({
          code: "missing-alt-text",
          severity: gap.severity,
          identity: `${recordSemantic(record)}|${usage.id}|${gap.locale ?? "global"}`,
          message: `${recordSemantic(record)} lacks required alt evidence.`,
          evidence: {
            altMode: record.alt_mode,
            localePolicy: record.locale_policy,
            ...(record.locale_policy === "localized" && gap.locale
              ? { locale: gap.locale }
              : {}),
            overrideState: gap.overrideState,
            contextState: gap.contextState,
          },
          requiredScopes: scopes(
            usage.sourceKind === "cms"
              ? `${usage.environment}-content`
              : "repository",
            `${usage.environment}-registry`,
          ),
        }),
      );
    }
  }
  return findings;
}

function mimeMatchesKind(kind: string, mimeType: string | null): boolean {
  if (mimeType === null) return kind === "code-component";
  if (kind === "raster")
    return /^image\/(?:avif|gif|jpeg|png|webp)$/.test(mimeType);
  if (kind === "svg") return mimeType === "image/svg+xml";
  if (kind === "font")
    return /^(?:font\/|application\/(?:font|x-font))/.test(mimeType);
  if (kind === "document") return mimeType === "application/pdf";
  if (kind === "video") return mimeType.startsWith("video/");
  return kind === "code-component";
}

function allowedMime(
  record: NormalizedAssetRecord,
  mimeType: string | null,
): boolean {
  if (mimeType === null || record.allowed_mime_families === null) return true;
  return record.allowed_mime_families.some((allowed) => {
    if (allowed.endsWith("/*"))
      return mimeType.startsWith(allowed.slice(0, -1));
    return mimeType === allowed;
  });
}

function mimeForFormat(format: string | null): string | null {
  if (!format) return null;
  const normalized = format.toLowerCase().replace(/^\./, "");
  const values: Record<string, string> = {
    avif: "image/avif",
    gif: "image/gif",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    svg: "image/svg+xml",
    pdf: "application/pdf",
    mp4: "video/mp4",
    webm: "video/webm",
    woff: "font/woff",
    woff2: "font/woff2",
    ttf: "font/ttf",
    otf: "font/otf",
  };
  return values[normalized] ?? null;
}

function filenameFormat(filename: string | null): string | null {
  if (!filename) return null;
  const clean = filename.split(/[?#]/, 1)[0]!;
  const extension = clean.includes(".")
    ? clean.split(".").at(-1)!.toLowerCase()
    : null;
  if (extension === "jpeg") return "jpg";
  return extension;
}

function buildDimensionAndFormatFindings(
  input: AssetAuditInput,
  indexes: ReconciliationIndexes,
  discovered: readonly DiscoveredAssetUsage[],
): AssetFinding[] {
  const findings: AssetFinding[] = [];
  const usageByRecord = new Map<string, DiscoveredAssetUsage[]>();
  for (const usage of discovered) {
    if (!usage.assetRecordId) continue;
    const key = `${usage.environment}:${usage.assetRecordId}`;
    const group = usageByRecord.get(key) ?? [];
    group.push(usage);
    usageByRecord.set(key, group);
  }
  for (const environment of ["dev", "prod"] as const) {
    for (const record of input[environment]?.records ?? []) {
      if (!ACTIVE_LIFECYCLES.has(record.lifecycle_status)) continue;
      const selected = selectedFile(record, environment, indexes);
      if (!selected.version) continue;
      const version = selected.version;
      const file = selected.file;
      const usages = usageByRecord.get(`${environment}:${record.id}`) ?? [];
      const required = usages.some(
        (usage) => usage.required || usageIsPublic(usage),
      );
      const width = version.width ?? file?.width ?? null;
      const height = version.height ?? file?.height ?? null;
      const dimensionProblems: Array<{
        expectedWidth: number | null;
        expectedHeight: number | null;
        observedWidth: number | null;
        observedHeight: number | null;
      }> = [];
      if (
        record.aspect_ratio_mode === "exact" &&
        record.aspect_ratio_width !== null &&
        record.aspect_ratio_height !== null &&
        (width === null ||
          height === null ||
          width <= 0 ||
          height <= 0 ||
          width * record.aspect_ratio_height !==
            height * record.aspect_ratio_width)
      ) {
        dimensionProblems.push({
          expectedWidth: record.aspect_ratio_width,
          expectedHeight: record.aspect_ratio_height,
          observedWidth: width,
          observedHeight: height,
        });
      }
      if (
        version.width !== null &&
        version.height !== null &&
        file !== null &&
        file.width !== null &&
        file.height !== null &&
        (version.width !== file.width || version.height !== file.height)
      ) {
        dimensionProblems.push({
          expectedWidth: version.width,
          expectedHeight: version.height,
          observedWidth: file.width,
          observedHeight: file.height,
        });
      }
      if (record.role === "og" && (width !== 1200 || height !== 630)) {
        dimensionProblems.push({
          expectedWidth: 1200,
          expectedHeight: 630,
          observedWidth: width,
          observedHeight: height,
        });
      }
      for (const problem of dimensionProblems) {
        findings.push(
          makeFinding({
            code: "invalid-dimensions",
            severity: severityForRequired(required),
            identity: recordSemantic(record),
            message: `${recordSemantic(record)} violates its dimension policy.`,
            evidence: problem,
            requiredScopes: scopes(
              `${environment}-registry`,
              ...(file ? ([`${environment}-files`] as AssetAuditScope[]) : []),
            ),
          }),
        );
      }
      const formatProblems: string[] = [];
      if (!mimeMatchesKind(record.kind, version.mime_type)) {
        formatProblems.push("kind-mime-format-agreement");
      } else {
        if (record.kind !== "code-component" && version.format === null) {
          formatProblems.push("version-format-missing");
        }
        if (!allowedMime(record, version.mime_type)) {
          formatProblems.push("allowed-mime-family");
        }
        const formatMime = mimeForFormat(version.format);
        if (version.format !== null && formatMime === null) {
          formatProblems.push("version-format-unknown");
        }
        if (
          formatMime !== null &&
          version.mime_type !== null &&
          formatMime !== version.mime_type
        ) {
          formatProblems.push("version-format-mime-mismatch");
        }
        if (file && file.mimeType === null) {
          formatProblems.push("file-mime-missing");
        } else if (
          file?.mimeType !== null &&
          version.mime_type !== null &&
          file?.mimeType !== version.mime_type
        ) {
          formatProblems.push("file-mime-mismatch");
        }
        if (file?.mimeType && !mimeMatchesKind(record.kind, file.mimeType)) {
          formatProblems.push("file-kind-mime-mismatch");
        }
        if (file?.mimeType && !allowedMime(record, file.mimeType)) {
          formatProblems.push("file-mime-not-allowed");
        }
        const extension = filenameFormat(
          file?.filenameDownload ?? file?.filenameDisk ?? null,
        );
        if (file && extension === null) {
          formatProblems.push("file-extension-missing");
        }
        const normalizedVersionFormat =
          version.format?.toLowerCase() === "jpeg"
            ? "jpg"
            : (version.format?.toLowerCase() ?? null);
        if (
          extension !== null &&
          normalizedVersionFormat !== null &&
          extension !== normalizedVersionFormat
        ) {
          formatProblems.push("file-extension-mismatch");
        }
        const extensionMime = mimeForFormat(extension);
        if (
          extensionMime &&
          file?.mimeType &&
          extensionMime !== file.mimeType
        ) {
          formatProblems.push("file-extension-mime-mismatch");
        }
      }
      for (const invariant of selected.invalid.filter((value) =>
        [
          "code-component-source-mode",
          "code-component-directus-file",
          "code-component-key-missing",
          "code-component-key-mismatch",
          "file-source-mode",
          "directus-file-missing",
          "component-key-present",
        ].includes(value),
      )) {
        formatProblems.push(invariant);
      }
      for (const invariant of [...new Set(formatProblems)].sort(compareUtf8)) {
        findings.push(
          makeFinding({
            code: "invalid-format",
            severity: severityForRequired(required),
            identity: recordSemantic(record),
            message: `${recordSemantic(record)} violates its kind/source/format policy.`,
            evidence: {
              kind: record.kind,
              sourceMode: version.source_mode,
              mimeType: version.mime_type,
              format: version.format,
              delivery: record.delivery_mode,
              violatedInvariant: invariant,
            },
            requiredScopes: scopes(
              `${environment}-registry`,
              ...(file ? ([`${environment}-files`] as AssetAuditScope[]) : []),
            ),
          }),
        );
      }
    }
  }
  return findings;
}

function sinkShaped(rawRef: string): boolean {
  return /\{@html|\.innerHTML|DOMParser|\.appendChild|fetch\([^)]*\.svg/i.test(
    rawRef,
  );
}

function verifiedSanitizedInlineSvg(
  record: NormalizedAssetRecord,
  environment: CmsEnvironment,
  indexes: ReconciliationIndexes,
  expectedOutputSha256: string | null,
): boolean {
  if (record.kind !== "svg" || record.delivery_mode !== "inline-svg") {
    return false;
  }
  const selected = selectedFile(record, environment, indexes);
  const version = selected.version;
  const file = selected.file;
  if (
    !version ||
    !file?.sha256 ||
    version.safety_report.state !== "declared-safe"
  ) {
    return false;
  }
  const report = version.safety_report;
  const outputSha256 = version.sanitized_output_sha256;
  return Boolean(
    report.policy &&
    version.sanitizer_signature &&
    version.sanitizer_signature === report.sanitizerSignature &&
    version.source_hash &&
    version.source_hash === report.sourceSha256 &&
    outputSha256 &&
    outputSha256 === report.sanitizedOutputSha256 &&
    outputSha256 === version.sha256 &&
    outputSha256 === file.sha256 &&
    (expectedOutputSha256 === null || outputSha256 === expectedOutputSha256),
  );
}

interface RawSvgModuleProof {
  linked: boolean;
  proven: boolean;
}

function rawSvgModuleProof(
  sourceFile: string,
  input: AssetAuditInput,
  indexes: ReconciliationIndexes,
): RawSvgModuleProof {
  const sourceModule = sourceIdentity(sourceFile).sourceModule;
  const sameModuleUsages = input.repository.usages.filter(
    (usage) => sourceIdentity(usage.sourceFile).sourceModule === sourceModule,
  );
  const linked = sameModuleUsages.some((usage) => {
    const asset = usage.assetId
      ? indexes.repositoryAssets.get(usage.assetId)
      : null;
    return (
      asset?.kind === "svg" ||
      usage.deliveryMode === "inline-svg" ||
      usage.deliveryMode === "tokenized-inline-svg" ||
      usage.unresolvedRef?.toLowerCase().includes(".svg")
    );
  });
  const sinkCount = input.repository.findings.filter(
    (finding) =>
      finding.code === "unsupported-pattern" &&
      sinkShaped(finding.rawRef) &&
      sourceIdentity(finding.sourceFile).sourceModule === sourceModule,
  ).length;
  if (sinkCount !== 1) return { linked, proven: false };

  const exactByAsset = new Map<string, RepositoryUsage>();
  for (const usage of sameModuleUsages) {
    if (
      usage.sourceKind === "declaration" ||
      !["exact-static", "resolved-generated"].includes(usage.confidence) ||
      usage.deliveryMode !== "inline-svg" ||
      !usage.assetId
    ) {
      continue;
    }
    const asset = indexes.repositoryAssets.get(usage.assetId);
    if (asset?.kind === "svg") exactByAsset.set(usage.assetId, usage);
  }

  const declarationBySemantic = new Map<AssetSemanticKey, RepositoryUsage>();
  for (const usage of sameModuleUsages) {
    if (
      usage.sourceKind === "declaration" &&
      usage.confidence === "declared-dynamic" &&
      usage.deliveryMode === "inline-svg" &&
      usage.semanticKey
    ) {
      declarationBySemantic.set(usage.semanticKey, usage);
    }
  }

  if (exactByAsset.size > 1 || declarationBySemantic.size > 1) {
    return { linked, proven: false };
  }

  let exactSemantic: AssetSemanticKey | null = null;
  let exactProven = false;
  const exactUsage = [...exactByAsset.values()][0];
  if (exactUsage?.assetId) {
    const asset = indexes.repositoryAssets.get(exactUsage.assetId);
    const record = recordForEvidence(repositoryEvidence(exactUsage), indexes);
    if (record && asset?.sha256) {
      exactSemantic = recordSemantic(record);
      exactProven = verifiedSanitizedInlineSvg(
        record,
        "dev",
        indexes,
        asset.sha256,
      );
    }
  }

  let declarationSemantic: AssetSemanticKey | null = null;
  let declarationProven = false;
  const declarationUsage = [...declarationBySemantic.values()][0];
  if (declarationUsage?.semanticKey) {
    const record = indexes.recordsBySemantic
      .get("dev")!
      .get(declarationUsage.semanticKey);
    if (record) {
      declarationSemantic = recordSemantic(record);
      declarationProven = verifiedSanitizedInlineSvg(
        record,
        "dev",
        indexes,
        null,
      );
    }
  }

  if (exactByAsset.size === 1 && declarationBySemantic.size === 1) {
    return {
      linked,
      proven:
        exactProven &&
        declarationProven &&
        exactSemantic === declarationSemantic,
    };
  }
  if (exactByAsset.size === 1) return { linked, proven: exactProven };
  if (declarationBySemantic.size === 1) {
    return { linked, proven: declarationProven };
  }
  return { linked, proven: false };
}

function buildSvgFindings(
  input: AssetAuditInput,
  indexes: ReconciliationIndexes,
  discovered: readonly DiscoveredAssetUsage[],
): AssetFinding[] {
  const findings: AssetFinding[] = [];
  for (const usage of discovered) {
    const record = usage.assetRecordId
      ? indexes.recordsByEnvironment
          .get(usage.environment)!
          .get(usage.assetRecordId)
      : usage.semanticKey
        ? indexes.recordsBySemantic
            .get(usage.environment)!
            .get(usage.semanticKey)
        : null;
    if (!record || !["svg", "code-component"].includes(record.kind)) continue;
    const selected = selectedFile(record, usage.environment, indexes);
    const version = selected.version;
    if (!version) continue;
    const report = version.safety_report;
    const missing: string[] = [];
    if (report.state === "rejected") {
      missing.push("safety-report-rejected");
    } else if (report.state !== "declared-safe") {
      missing.push("declared-safe-report");
    }
    if (record.kind === "code-component") {
      const component = [...indexes.repositoryAssets.values()].find(
        (asset) =>
          asset.origin === "code-component" &&
          (asset.id === version.component_key ||
            asset.repoPath?.endsWith(`/${version.component_key}`)),
      );
      if (!report.policy) missing.push("review-policy");
      if (
        !component?.sha256 ||
        component.sha256 !== version.sha256 ||
        report.sourceSha256 !== version.sha256
      ) {
        missing.push("reviewed-component-sha256");
      }
      if (
        version.directus_file !== null ||
        version.sanitized_output_sha256 !== null ||
        report.sanitizedOutputSha256 !== null
      ) {
        missing.push("code-component-null-output-proof");
      }
    } else {
      const file = selected.file;
      if (!report.policy) missing.push("safety-policy");
      if (!version.sanitizer_signature || !report.sanitizerSignature) {
        missing.push("sanitizer-signature");
      } else if (version.sanitizer_signature !== report.sanitizerSignature) {
        missing.push("sanitizer-signature");
      }
      if (!version.source_hash || version.source_hash !== report.sourceSha256) {
        missing.push("source-sha256");
      }
      if (
        !file?.sha256 ||
        file.sha256 !== version.sha256 ||
        version.sha256 !== version.sanitized_output_sha256 ||
        version.sanitized_output_sha256 !== report.sanitizedOutputSha256
      ) {
        missing.push("sanitized-output-sha256");
      }
      if (record.delivery_mode === "tokenized-inline-svg") {
        if (
          !version.transform_signature ||
          version.transform_signature !== report.transformSignature
        ) {
          missing.push("transform-signature");
        }
        const approved = new Set(record.approved_token_slots ?? []);
        if ((version.brand_slots ?? []).some((slot) => !approved.has(slot))) {
          missing.push("approved-token-slots");
        }
      }
      if (record.delivery_mode === "inline-svg") {
        const exactUsage = input.repository.usages.find(
          (candidate) => candidate.id === usage.evidenceUsageId,
        );
        const sourceModule = exactUsage
          ? sourceIdentity(exactUsage.sourceFile).sourceModule
          : null;
        const hasSink = Boolean(
          sourceModule &&
          input.repository.findings.some(
            (finding) =>
              finding.code === "unsupported-pattern" &&
              sinkShaped(finding.rawRef) &&
              sourceIdentity(finding.sourceFile).sourceModule === sourceModule,
          ),
        );
        const moduleProof = exactUsage
          ? rawSvgModuleProof(exactUsage.sourceFile, input, indexes)
          : { linked: false, proven: false };
        if (!hasSink || !moduleProof.proven) {
          missing.push("verified-sanitized-output-identity");
        }
      }
    }
    if (missing.length > 0) {
      findings.push(
        makeFinding({
          code: "unsafe-svg",
          severity: severityForRequired(usage.required || usageIsPublic(usage)),
          identity: `${recordSemantic(record)}|${usage.id}`,
          message: `${recordSemantic(record)} lacks complete SVG safety proof.`,
          evidence: {
            delivery: record.delivery_mode,
            safetyState: report.state,
            missingOrMismatchedProofs: [...new Set(missing)].sort(compareUtf8),
          },
          requiredScopes: scopes(
            "svg-safety",
            usage.sourceKind === "cms"
              ? `${usage.environment}-content`
              : "repository",
            `${usage.environment}-registry`,
            ...(record.kind === "svg"
              ? ([`${usage.environment}-files`] as AssetAuditScope[])
              : []),
          ),
        }),
      );
    }
  }
  for (const scanFinding of input.repository.findings) {
    if (
      scanFinding.code !== "unsupported-pattern" ||
      !sinkShaped(scanFinding.rawRef)
    )
      continue;
    const moduleProof = rawSvgModuleProof(
      scanFinding.sourceFile,
      input,
      indexes,
    );
    if (moduleProof.proven) continue;
    if (!moduleProof.linked) continue;
    const moduleUsages = input.repository.usages.filter((usage) =>
      sameSourceModule(usage.sourceFile, scanFinding.sourceFile),
    );
    const alreadyClassified = moduleUsages.some((rawUsage) => {
      const usage = discovered.find(
        (candidate) => candidate.evidenceUsageId === rawUsage.id,
      );
      return Boolean(
        usage &&
        findings.some((finding) => finding.identity.endsWith(`|${usage.id}`)),
      );
    });
    if (alreadyClassified) continue;
    findings.push(
      makeFinding({
        code: "unsafe-svg",
        severity: "error",
        identity: `${scanFinding.sourceFile}|${scanFinding.rawRef}`,
        message: `${scanFinding.sourceFile} inserts SVG-shaped content without verified identity.`,
        evidence: {
          delivery: "inline-svg",
          safetyState: "unknown",
          missingOrMismatchedProofs: ["verified-sanitized-output-identity"],
        },
        requiredScopes: scopes("repository", "svg-safety"),
      }),
    );
  }
  return findings;
}

interface OgResolution {
  resolved: boolean;
  excluded: boolean;
  proofState: string;
  fallbackState: string;
  version: NormalizedAssetVersion | null;
  sourceScopes: AssetAuditScope[];
}

function ogTranslationValid(
  snapshotValue: DirectusAssetSnapshot,
  record: NormalizedAssetRecord,
  locale: string,
): boolean {
  return recordTranslations(snapshotValue, record).some(
    (translation) =>
      translation.languages_code === locale &&
      nonEmpty(translation.og_image_alt),
  );
}

function runtimeOgProof(
  requirement: OgCoverageRequirement,
  proof: DiscoveredAssetUsage | undefined,
): boolean {
  if (
    !requirement.currentRef ||
    requirement.currentRef.kind !== "runtime-route" ||
    !proof
  ) {
    return false;
  }
  const finalSegment = requirement.route.split("/").filter(Boolean).at(-1);
  if (!finalSegment) return false;
  const route = requirement.currentRef.route;
  if (requirement.ownerType === "blog") {
    const match = route.match(RUNTIME_BLOG_PATTERN);
    return Boolean(
      match &&
      match[1] === finalSegment &&
      proof.evidenceUsageId === "declared:site.og.runtime-blog" &&
      proof.semanticKey === "site.og.runtime-blog" &&
      proof.consumerType === "blog" &&
      proof.sourceKind === "declaration" &&
      proof.route === "/blog/[slug]" &&
      proof.slot === "og-image" &&
      proof.deliveryMode === "og-meta" &&
      proof.required,
    );
  }
  if (requirement.ownerType === "project") {
    const match = route.match(RUNTIME_PROJECT_PATTERN);
    const locale = match?.[2] ?? null;
    const localeValid =
      requirement.locale === "en"
        ? locale === null || locale === "en"
        : locale === requirement.locale;
    return Boolean(
      match &&
      match[1] === finalSegment &&
      localeValid &&
      proof.evidenceUsageId === "declared:site.og.runtime-project" &&
      proof.semanticKey === "site.og.runtime-project" &&
      proof.consumerType === "project" &&
      proof.sourceKind === "declaration" &&
      proof.route === "/projects/[slug]" &&
      proof.slot === "og-image" &&
      proof.deliveryMode === "og-meta" &&
      proof.required,
    );
  }
  return false;
}

function directOgProofMatches(
  requirement: OgCoverageRequirement,
  proof: DiscoveredAssetUsage | undefined,
  input: AssetAuditInput,
): boolean {
  if (!proof) {
    return !requirement.required && requirement.proofUsageId === null;
  }
  const seamMatches =
    proof.evidenceUsageId === requirement.proofUsageId &&
    proof.consumerType === requirement.ownerType &&
    proof.consumerKey === requirement.ownerKey &&
    proof.route === requirement.route &&
    proof.locale === requirement.locale &&
    proof.slot === "og-image" &&
    proof.deliveryMode === "og-meta";
  if (!seamMatches || !requirement.currentRef) return false;
  if (requirement.currentRef.kind === "repository-path") {
    const rawUsage = input.repository.usages.find(
      (usage) => usage.id === requirement.proofUsageId,
    );
    const asset = rawUsage?.assetId
      ? input.repository.assets.find(
          (candidate) => candidate.id === rawUsage.assetId,
        )
      : null;
    return asset?.repoPath === normalizeString(requirement.currentRef.repoPath);
  }
  if (requirement.currentRef.kind === "directus-file") {
    const directusRef = requirement.currentRef;
    return Boolean(
      input[directusRef.environment]?.references.some(
        (reference) =>
          reference.id === requirement.proofUsageId &&
          reference.fileId === directusRef.fileId,
      ),
    );
  }
  if (requirement.currentRef.kind === "semantic-key") {
    return proof.semanticKey === requirement.currentRef.semanticKey;
  }
  return false;
}

function buildOgFindings(
  input: AssetAuditInput,
  indexes: ReconciliationIndexes,
  discovered: readonly DiscoveredAssetUsage[],
): AssetFinding[] {
  const findings: AssetFinding[] = [];
  const byKey = new Map(input.ogCoverage.map((row) => [row.usageKey, row]));
  const cache = new Map<string, OgResolution>();
  const resolve = (row: OgCoverageRequirement): OgResolution => {
    const cached = cache.get(row.usageKey);
    if (cached) return cached;
    if (!row.required && row.exclusionReason !== null) {
      const excluded = {
        resolved: false,
        excluded: true,
        proofState: "excluded",
        fallbackState: "not-evaluated",
        version: null,
        sourceScopes: ["og-coverage" as AssetAuditScope],
      };
      cache.set(row.usageKey, excluded);
      return excluded;
    }
    for (const candidate of row.semanticCandidates) {
      for (const environment of ["dev", "prod"] as const) {
        const snapshotValue = input[environment];
        const record = indexes.recordsBySemantic
          .get(environment)!
          .get(candidate);
        if (!snapshotValue || !record) continue;
        const selected = selectedFile(record, environment, indexes);
        if (
          selected.version &&
          selected.invalid.length === 0 &&
          ogTranslationValid(snapshotValue, record, row.locale)
        ) {
          const resolved = {
            resolved: true,
            excluded: false,
            proofState: `semantic:${candidate}`,
            fallbackState: "not-needed",
            version: selected.version,
            sourceScopes: [
              "og-coverage" as AssetAuditScope,
              `${environment}-registry` as AssetAuditScope,
              `${environment}-files` as AssetAuditScope,
            ],
          };
          cache.set(row.usageKey, resolved);
          return resolved;
        }
      }
    }
    const proof = row.proofUsageId
      ? discovered.find((usage) => usage.evidenceUsageId === row.proofUsageId)
      : undefined;
    if (row.currentRef) {
      let sourceExists = false;
      let version: NormalizedAssetVersion | null = null;
      const sourceScopes: AssetAuditScope[] = ["og-coverage"];
      if (row.currentRef.kind === "repository-path") {
        const repoPath = normalizeString(row.currentRef.repoPath);
        sourceExists = input.repository.assets.some(
          (asset) => asset.repoPath === repoPath,
        );
        sourceScopes.push("repository");
      } else if (row.currentRef.kind === "directus-file") {
        sourceExists = indexes.filesByEnvironment
          .get(row.currentRef.environment)!
          .has(row.currentRef.fileId);
        sourceScopes.push(`${row.currentRef.environment}-files`);
      } else if (row.currentRef.kind === "semantic-key") {
        const record = indexes.recordsBySemantic
          .get("dev")!
          .get(row.currentRef.semanticKey);
        if (record) {
          const selected = selectedFile(record, "dev", indexes);
          version = selected.version;
          sourceExists = Boolean(version && selected.invalid.length === 0);
        }
        sourceScopes.push("dev-registry", "dev-files");
      } else {
        sourceExists = runtimeOgProof(row, proof);
        sourceScopes.push("repository");
      }
      const proofValid =
        row.currentRef.kind === "runtime-route"
          ? sourceExists
          : directOgProofMatches(row, proof, input);
      if (sourceExists && proofValid) {
        const resolved = {
          resolved: true,
          excluded: false,
          proofState: proof ? "proven" : "source-only",
          fallbackState: "not-needed",
          version,
          sourceScopes,
        };
        cache.set(row.usageKey, resolved);
        return resolved;
      }
    }
    if (row.fallbackUsageKey) {
      const fallback = resolve(byKey.get(row.fallbackUsageKey)!);
      if (fallback.resolved && !fallback.excluded) {
        const resolved = {
          ...fallback,
          proofState: "fallback",
          fallbackState: `resolved:${row.fallbackUsageKey}`,
          sourceScopes: [
            ...fallback.sourceScopes,
            "og-coverage" as AssetAuditScope,
          ],
        };
        cache.set(row.usageKey, resolved);
        return resolved;
      }
    }
    const unresolved = {
      resolved: false,
      excluded: false,
      proofState: row.proofUsageId ? "invalid" : "missing",
      fallbackState: row.fallbackUsageKey ? "unresolved" : "absent",
      version: null,
      sourceScopes: ["og-coverage" as AssetAuditScope],
    };
    cache.set(row.usageKey, unresolved);
    return unresolved;
  };
  for (const row of input.ogCoverage) {
    const resolution = resolve(row);
    let candidateVersion: NormalizedAssetVersion | null = null;
    let candidateScope: AssetAuditScope | null = null;
    if (row.required || row.exclusionReason === null) {
      candidateLoop: for (const candidate of row.semanticCandidates) {
        for (const environment of ["dev", "prod"] as const) {
          const snapshotValue = input[environment];
          const record = indexes.recordsBySemantic
            .get(environment)!
            .get(candidate);
          if (!snapshotValue || !record) continue;
          const selected = selectedFile(record, environment, indexes);
          if (!selected.version || selected.invalid.length > 0) continue;
          candidateVersion = selected.version;
          candidateScope = `${environment}-registry`;
          if (!ogTranslationValid(snapshotValue, record, row.locale)) {
            findings.push(
              makeFinding({
                code: "missing-alt-text",
                severity: severityForRequired(row.required),
                identity: `${recordSemantic(record)}|${row.locale}`,
                message: `${recordSemantic(record)} lacks ${row.locale} OG alt text.`,
                evidence: {
                  altMode: record.alt_mode,
                  localePolicy: record.locale_policy,
                  locale: row.locale,
                  overrideState: "missing",
                  contextState: "missing",
                },
                requiredScopes: scopes(
                  "og-coverage",
                  `${environment}-registry`,
                  `${environment}-content`,
                ),
              }),
            );
          }
          break candidateLoop;
        }
      }
    }
    if (!resolution.resolved && !resolution.excluded) {
      findings.push(
        makeFinding({
          code: "missing-og-coverage",
          severity: severityForRequired(row.required),
          identity: row.usageKey,
          message: `${row.usageKey} has no proven OG source.`,
          evidence: {
            route: row.route,
            locale: row.locale,
            owner: `${row.ownerType}:${row.ownerKey}`,
            orderedCandidates: [...row.semanticCandidates],
            proofState: resolution.proofState,
            fallbackState: resolution.fallbackState,
          },
          requiredScopes: scopes(...resolution.sourceScopes),
        }),
      );
    }
    const fingerprintVersion = resolution.version ?? candidateVersion;
    if (
      row.expectedInputHash !== null &&
      !resolution.excluded &&
      (row.currentRef !== null ||
        fingerprintVersion !== null ||
        resolution.resolved) &&
      fingerprintVersion?.input_hash !== row.expectedInputHash
    ) {
      findings.push(
        makeFinding({
          code: "stale-generated-output",
          severity: severityForRequired(row.required),
          identity: row.usageKey,
          message: `${row.usageKey} resolved a stale OG input fingerprint.`,
          evidence: {
            expectedOutputSha256: null,
            observedOutputSha256: fingerprintVersion?.sha256 ?? null,
            expectedInputHash: row.expectedInputHash,
            observedInputHash: fingerprintVersion?.input_hash ?? null,
            required: row.required,
          },
          requiredScopes: scopes(
            "og-coverage",
            ...resolution.sourceScopes,
            ...(candidateScope ? [candidateScope] : []),
          ),
        }),
      );
    }
  }
  return findings;
}

function findingSort(left: AssetFinding, right: AssetFinding): number {
  return (
    SEVERITY_ORDER[left.severity] - SEVERITY_ORDER[right.severity] ||
    CODE_ORDER.get(left.code)! - CODE_ORDER.get(right.code)! ||
    compareUtf8(left.identity, right.identity) ||
    compareUtf8(left.id, right.id)
  );
}

function deduplicateFindings(
  findings: readonly AssetFinding[],
): AssetFinding[] {
  const byFingerprint = new Map<Sha256Hex, AssetFinding>();
  for (const finding of findings) {
    const current = byFingerprint.get(finding.fingerprint);
    if (
      !current ||
      SEVERITY_ORDER[finding.severity] < SEVERITY_ORDER[current.severity]
    ) {
      byFingerprint.set(finding.fingerprint, finding);
    }
  }
  return [...byFingerprint.values()].sort(findingSort);
}

function summarizeFindings(
  findings: readonly AssetFinding[],
): Readonly<Record<AssetFindingCode, AssetFindingCount>> {
  const summary = {} as Record<AssetFindingCode, AssetFindingCount>;
  for (const code of ASSET_FINDING_CODES) {
    const rows = findings.filter((finding) => finding.code === code);
    summary[code] = {
      error: rows.filter((finding) => finding.severity === "error").length,
      warning: rows.filter((finding) => finding.severity === "warning").length,
      info: rows.filter((finding) => finding.severity === "info").length,
      total: rows.length,
    };
  }
  return summary;
}

function validateInput(input: AssetAuditInput): void {
  if (
    !input ||
    typeof input !== "object" ||
    input.repository?.schemaVersion !== 1
  ) {
    throw new TypeError("Invalid asset audit input");
  }
  if (input.dev && input.dev.environment !== "dev") {
    throw new TypeError("DEV snapshot environment mismatch");
  }
  if (input.prod && input.prod.environment !== "prod") {
    throw new TypeError("PROD snapshot environment mismatch");
  }
  validateGeneratedOutputs(input.generatedOutputs);
  validateOgCoverage(input.ogCoverage);
}

export function reconcileAssetAudit(input: AssetAuditInput): AssetAuditReport {
  validateInput(input);
  const scopeReceipts = buildScopeReceipts(input);
  const indexes = buildIndexes(input);
  const discovered = discoverUsages(input, indexes);
  const rows = buildLogicalRows(input, indexes, discovered.usages);
  const allFindings = [
    ...buildMissingAndUsageFindings(
      input,
      indexes,
      scopeReceipts,
      discovered.usages,
      discovered.issues,
    ),
    ...buildInventoryFindings(input, indexes, scopeReceipts, discovered.usages),
    ...buildDuplicateAndHardcodedFindings(input, discovered.usages),
    ...buildRepositoryScanFindingFindings(input),
    ...buildGeneratedFindings(input, indexes),
    ...buildEnvironmentFindings(
      input,
      indexes,
      scopeReceipts,
      rows,
      discovered.usages,
    ),
    ...buildAccessibilityFindings(
      input,
      indexes,
      discovered.usages,
      discovered.issues,
    ),
    ...buildDimensionAndFormatFindings(input, indexes, discovered.usages),
    ...buildSvgFindings(input, indexes, discovered.usages),
    ...buildOgFindings(input, indexes, discovered.usages),
  ];
  const findings = deduplicateFindings(allFindings);
  return {
    schemaVersion: 1,
    inputReceipts: {
      repositorySha256: hashRepositoryScan(input.repository) as Sha256Hex,
      devSnapshotSha256: input.dev
        ? hashDirectusAssetSnapshot(input.dev)
        : null,
      prodSnapshotSha256: input.prod
        ? hashDirectusAssetSnapshot(input.prod)
        : null,
      generatedOutputsSha256: hashDomainRows(
        input.generatedOutputs,
        (output) => `${output.outputAssetId}\0${output.generator}`,
      ),
      ogCoverageSha256: hashDomainRows(input.ogCoverage, (row) => row.usageKey),
      repositoryRevision: input.repositoryRevision
        ? normalizeString(input.repositoryRevision)
        : null,
    },
    scopeReceipts,
    summary: summarizeFindings(findings),
    rows,
    discoveredUsages: discovered.usages,
    findings,
  };
}
