#!/usr/bin/env bun

import { createHash } from "node:crypto";
import {
  ASSET_DELIVERY_MODES,
  SHA256_HEX_PATTERN,
  type Sha256Hex,
} from "@repo/shared";
import {
  sanitizeAssetAuditPublicText,
  type AssetAuditReport,
  type AssetAuditScope,
  type DiscoveredAssetUsage,
} from "./lib/assets/audit";
import {
  type NormalizedStoredUsage,
} from "./lib/assets/directus-scan";
import { canonicalizeAssetAuditReport } from "./lib/assets/report";
import { assertDevCms } from "./lib/sdk";
import {
  loadLiveAssetAuditReport,
  TARGET_URLS,
} from "./audit-assets";

export const DEV_ASSET_USAGE_SYNC_URL = TARGET_URLS.dev;
const GENERATED_SCAN_PREFIX = "asset-audit:";
const PAGE_SIZE = 100;
const REQUIRED_SYNC_SCOPES = Object.freeze([
  "repository",
  "dev-registry",
  "dev-files",
  "dev-content",
  "og-coverage",
] as const satisfies readonly AssetAuditScope[]);
const STORED_USAGE_FIELDS = Object.freeze([
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
] as const);

const CONFIDENCE_VALUES = new Set<NormalizedStoredUsage["confidence"]>([
  "exact-static",
  "resolved-generated",
  "declared-dynamic",
  "unknown",
]);
const CONSUMER_TYPE_VALUES = new Set<
  NormalizedStoredUsage["consumer_type"]
>([
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
const SOURCE_KIND_VALUES = new Set<NormalizedStoredUsage["source_kind"]>([
  "repository",
  "generated",
  "cms",
  "route",
  "declaration",
]);
const LOCALE_VALUES = new Set<string>([
  "en",
  "fr",
  "es",
]);
const LOWERCASE_UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const POSTGRES_INTEGER_MAX = 2_147_483_647;

export interface ParsedAssetUsageSyncArgs {
  mode: "dry-run" | "apply";
}

export interface AssetUsageCreatePayload {
  id: string;
  asset_record: string | null;
  resolved_version: string | null;
  unresolved_ref: string | null;
  scan_run_id: string;
  last_seen_manifest_sha256: Sha256Hex;
  confidence: NormalizedStoredUsage["confidence"];
  consumer_type: NormalizedStoredUsage["consumer_type"];
  consumer_key: string;
  source_kind: NormalizedStoredUsage["source_kind"];
  source_file: string;
  cms_field: string | null;
  source_line: number | null;
  route: string | null;
  locale: NormalizedStoredUsage["locale"];
  slot: string;
  required: boolean;
  delivery_mode: NormalizedStoredUsage["delivery_mode"];
  alt_text_override: string | null;
  alt_source: string | null;
  active: true;
  first_seen: string;
  last_seen: string;
}

export type AssetUsageUpdatePayload = Omit<AssetUsageCreatePayload, "id">;

export type AssetUsageSyncAction =
  | {
      kind: "create";
      id: string;
      payload: AssetUsageCreatePayload;
    }
  | {
      kind: "update";
      id: string;
      payload: AssetUsageUpdatePayload;
    }
  | {
      kind: "deactivate";
      id: string;
      payload: { active: false };
    };

export interface AssetUsageSyncPlan {
  manifestSha256: Sha256Hex;
  scanRunId: string;
  observationTime: string;
  actions: readonly AssetUsageSyncAction[];
}

export interface AssetUsageSyncHttpClient {
  readStoredUsages(): Promise<readonly NormalizedStoredUsage[]>;
  applyAction(action: AssetUsageSyncAction): Promise<void>;
}

export interface SyncReadInput {
  url: string;
  token: string;
}

export interface SyncWriteInput extends SyncReadInput {
  action: AssetUsageSyncAction;
}

export interface AssetUsageSyncCliDependencies {
  env: Readonly<Record<string, string | undefined>>;
  now: () => string;
  resolveDirectusUrl: () => string;
  loadAuditReport: (input: SyncReadInput) => Promise<AssetAuditReport>;
  loadStoredUsages: (
    input: SyncReadInput,
  ) => Promise<readonly NormalizedStoredUsage[]>;
  applyAction: (input: SyncWriteInput) => Promise<void>;
  log: (message: string) => void;
  error: (message: string) => void;
}

function compareUtf8(left: string, right: string): number {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function strictIsoTimestamp(value: string, label: string): string {
  if (
    !Number.isFinite(Date.parse(value)) ||
    new Date(value).toISOString() !== value
  ) {
    throw new TypeError(`${label} must be a strict ISO timestamp`);
  }
  return value;
}

function assertSyncEvidence(report: AssetAuditReport): void {
  for (const scope of REQUIRED_SYNC_SCOPES) {
    const matches = report.scopeReceipts.filter(
      (receipt) => receipt.scope === scope,
    );
    if (
      matches.length !== 1 ||
      matches[0]!.status !== "evaluated" ||
      matches[0]!.reason !== "complete"
    ) {
      throw new TypeError(
        `Asset usage sync has incomplete ${scope} evidence; it must be evaluated`,
      );
    }
  }
}

function assertUsageIdentity(usage: DiscoveredAssetUsage): void {
  const hasRecord = usage.assetRecordId !== null;
  const hasUnresolved = usage.unresolvedRef !== null;
  if (
    usage.environment !== "dev" ||
    !usage.syncEligible ||
    Number(hasRecord) + Number(hasUnresolved) !== 1 ||
    (!hasRecord && usage.resolvedVersionId !== null) ||
    (hasRecord && usage.unresolvedRef !== null)
  ) {
    throw new TypeError(
      `Invalid asset usage identity: exactly one asset_record or unresolved_ref is required, and resolved_version requires asset_record`,
    );
  }
}

function assertProjectedString(
  value: unknown,
  field: string,
  options: {
    nullable?: boolean;
    allowEmpty?: boolean;
    maxLength?: number;
  } = {},
): asserts value is string | null {
  if (options.nullable && value === null) return;
  if (
    typeof value !== "string" ||
    (!options.allowEmpty && value.length === 0) ||
    value.includes("\0") ||
    (options.maxLength !== undefined &&
      [...value].length > options.maxLength)
  ) {
    throw new TypeError(`Invalid projected asset usage field: ${field}`);
  }
}

function assertProjectedUuid(value: string | null, field: string): void {
  if (value !== null && !LOWERCASE_UUID_PATTERN.test(value)) {
    throw new TypeError(`Invalid projected asset usage field: ${field}`);
  }
}

function assertProjectedUsage(usage: DiscoveredAssetUsage): void {
  assertUsageIdentity(usage);
  if (!SHA256_HEX_PATTERN.test(usage.id)) {
    throw new TypeError("Invalid projected asset usage field: id");
  }
  assertProjectedUuid(usage.assetRecordId, "asset_record");
  assertProjectedUuid(usage.resolvedVersionId, "resolved_version");
  assertProjectedString(usage.unresolvedRef, "unresolved_ref", {
    nullable: true,
    allowEmpty: false,
    maxLength: 255,
  });
  if (!CONFIDENCE_VALUES.has(usage.confidence)) {
    throw new TypeError("Invalid projected asset usage field: confidence");
  }
  if (!CONSUMER_TYPE_VALUES.has(usage.consumerType)) {
    throw new TypeError("Invalid projected asset usage field: consumer_type");
  }
  assertProjectedString(usage.consumerKey, "consumer_key", { maxLength: 255 });
  if (!SOURCE_KIND_VALUES.has(usage.sourceKind)) {
    throw new TypeError("Invalid projected asset usage field: source_kind");
  }
  assertProjectedString(usage.sourceFile, "source_file", { maxLength: 1024 });
  assertProjectedString(usage.cmsField, "cms_field", {
    nullable: true,
    allowEmpty: true,
    maxLength: 512,
  });
  if (
    usage.sourceLine !== null &&
    (!Number.isSafeInteger(usage.sourceLine) ||
      usage.sourceLine <= 0 ||
      usage.sourceLine > POSTGRES_INTEGER_MAX)
  ) {
    throw new TypeError("Invalid projected asset usage field: source_line");
  }
  assertProjectedString(usage.route, "route", {
    nullable: true,
    allowEmpty: true,
    maxLength: 2048,
  });
  if (!(usage.locale === null || LOCALE_VALUES.has(usage.locale))) {
    throw new TypeError("Invalid projected asset usage field: locale");
  }
  assertProjectedString(usage.slot, "slot", { maxLength: 255 });
  if (typeof usage.required !== "boolean") {
    throw new TypeError("Invalid projected asset usage field: required");
  }
  if (!(ASSET_DELIVERY_MODES as readonly string[]).includes(usage.deliveryMode)) {
    throw new TypeError("Invalid projected asset usage field: delivery_mode");
  }
  assertProjectedString(usage.altTextOverride, "alt_text_override", {
    nullable: true,
    allowEmpty: true,
  });
  assertProjectedString(usage.altSource, "alt_source", {
    nullable: true,
    allowEmpty: true,
    maxLength: 255,
  });
}

function normalizedSyncEligibleUsages(
  report: AssetAuditReport,
): DiscoveredAssetUsage[] {
  const normalized = JSON.parse(
    canonicalizeAssetAuditReport(report),
  ) as AssetAuditReport;
  const usages = normalized.discoveredUsages.filter(
    (usage) => usage.syncEligible,
  );
  for (const usage of usages) assertProjectedUsage(usage);
  return usages;
}

function hashNormalizedAssetUsageManifest(
  usages: readonly DiscoveredAssetUsage[],
): Sha256Hex {
  const projected = usages
    .map((usage) => ({
      id: usage.id,
      environment: usage.environment,
      assetRecordId: usage.assetRecordId,
      resolvedVersionId: usage.resolvedVersionId,
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
    }))
    .sort((left, right) => compareUtf8(left.id, right.id));
  return createHash("sha256")
    .update(`${JSON.stringify({ schemaVersion: 1, usages: projected })}\n`)
    .digest("hex") as Sha256Hex;
}

function createPayload(
  usage: DiscoveredAssetUsage,
  manifestSha256: Sha256Hex,
  observationTime: string,
): AssetUsageCreatePayload {
  assertUsageIdentity(usage);
  return {
    id: usage.id,
    asset_record: usage.assetRecordId,
    resolved_version: usage.resolvedVersionId,
    unresolved_ref: usage.unresolvedRef,
    scan_run_id: `${GENERATED_SCAN_PREFIX}${manifestSha256}`,
    last_seen_manifest_sha256: manifestSha256,
    confidence: usage.confidence,
    consumer_type: usage.consumerType,
    consumer_key: usage.consumerKey,
    source_kind: usage.sourceKind,
    source_file: usage.sourceFile,
    cms_field: usage.cmsField,
    source_line: usage.sourceLine,
    route: usage.route,
    locale: usage.locale as NormalizedStoredUsage["locale"],
    slot: usage.slot,
    required: usage.required,
    delivery_mode: usage.deliveryMode,
    alt_text_override: usage.altTextOverride,
    alt_source: usage.altSource,
    active: true,
    first_seen: observationTime,
    last_seen: observationTime,
  };
}

function updatePayload(
  payload: AssetUsageCreatePayload,
  existing: NormalizedStoredUsage,
  observationTime: string,
): AssetUsageUpdatePayload {
  const { id: _id, ...fields } = payload;
  return {
    ...fields,
    first_seen: existing.first_seen,
    last_seen: observationTime,
  };
}

function comparableStoredRow(row: NormalizedStoredUsage): Record<string, unknown> {
  return Object.fromEntries(
    STORED_USAGE_FIELDS.filter(
      (field) => field !== "id" && field !== "date_updated",
    ).map((field) => [field, row[field]]),
  );
}

function comparableUpdatePayload(
  payload: AssetUsageUpdatePayload,
  existing: NormalizedStoredUsage,
): Record<string, unknown> {
  return {
    ...payload,
    last_seen: existing.last_seen,
  };
}

const ACTION_ORDER: Readonly<Record<AssetUsageSyncAction["kind"], number>> = {
  create: 0,
  update: 1,
  deactivate: 2,
};

export function hashAssetUsageManifest(report: AssetAuditReport): Sha256Hex {
  return hashNormalizedAssetUsageManifest(normalizedSyncEligibleUsages(report));
}

export function buildAssetUsageSyncPlan(input: {
  report: AssetAuditReport;
  storedUsages: readonly NormalizedStoredUsage[];
  observationTime: string;
}): AssetUsageSyncPlan {
  const observationTime = strictIsoTimestamp(
    input.observationTime,
    "Asset usage observation time",
  );
  assertSyncEvidence(input.report);
  const desired = normalizedSyncEligibleUsages(input.report);
  const manifestSha256 = hashNormalizedAssetUsageManifest(desired);
  const scanRunId = `${GENERATED_SCAN_PREFIX}${manifestSha256}`;
  const desiredById = new Map<string, AssetUsageCreatePayload>();
  for (const usage of desired) {
    if (desiredById.has(usage.id)) {
      throw new TypeError(`Duplicate asset usage identity: ${usage.id}`);
    }
    desiredById.set(
      usage.id,
      createPayload(usage, manifestSha256, observationTime),
    );
  }

  const existingById = new Map<string, NormalizedStoredUsage>();
  for (const existing of input.storedUsages) {
    if (existing.environment !== "dev") {
      throw new TypeError("Asset usage synchronization accepts DEV rows only");
    }
    if (existingById.has(existing.id)) {
      throw new TypeError(`Duplicate stored asset usage identity: ${existing.id}`);
    }
    existingById.set(existing.id, existing);
  }

  const actions: AssetUsageSyncAction[] = [];
  for (const [id, payload] of desiredById) {
    const existing = existingById.get(id);
    if (!existing) {
      actions.push({ kind: "create", id, payload });
      continue;
    }
    if (!existing.scan_run_id.startsWith(GENERATED_SCAN_PREFIX)) {
      throw new TypeError(
        `Asset usage id collision with a row not owned by asset-audit: ${id}`,
      );
    }
    const projected = updatePayload(payload, existing, observationTime);
    const currentComparable = comparableStoredRow(existing);
    const desiredComparable = comparableUpdatePayload(projected, existing);
    if (
      JSON.stringify(currentComparable) !== JSON.stringify(desiredComparable)
    ) {
      actions.push({ kind: "update", id, payload: projected });
    }
  }

  for (const existing of input.storedUsages) {
    if (
      existing.active &&
      existing.scan_run_id.startsWith(GENERATED_SCAN_PREFIX) &&
      !desiredById.has(existing.id)
    ) {
      actions.push({
        kind: "deactivate",
        id: existing.id,
        payload: { active: false },
      });
    }
  }
  actions.sort(
    (left, right) =>
      ACTION_ORDER[left.kind] - ACTION_ORDER[right.kind] ||
      compareUtf8(left.id, right.id),
  );
  return { manifestSha256, scanRunId, observationTime, actions };
}

export function parseAssetUsageSyncArgs(
  argv: readonly string[],
): ParsedAssetUsageSyncArgs {
  const allowed = new Set(["--dry-run", "--apply"]);
  for (const argument of argv) {
    if (!allowed.has(argument)) {
      throw new TypeError("Unknown asset usage sync flag");
    }
  }
  for (const flag of allowed) {
    if (argv.filter((argument) => argument === flag).length > 1) {
      throw new TypeError(`Use ${flag} at most once`);
    }
  }
  if (argv.includes("--dry-run") && argv.includes("--apply")) {
    throw new TypeError("Choose one asset usage sync mode");
  }
  return { mode: argv.includes("--apply") ? "apply" : "dry-run" };
}

function assertAssetUsageSyncUrl(url: string): void {
  assertDevCms(url);
  if (url !== DEV_ASSET_USAGE_SYNC_URL) {
    throw new TypeError(
      `Refusing non-canonical DEV asset usage URL: ${url}. DEV-ONLY.`,
    );
  }
}

function requiredString(
  value: unknown,
  field: string,
  allowEmpty = false,
): string {
  if (
    typeof value !== "string" ||
    (!allowEmpty && value.length === 0) ||
    value.includes("\0")
  ) {
    throw new TypeError(`Invalid stored asset usage field: ${field}`);
  }
  return value;
}

function nullableString(value: unknown, field: string): string | null {
  return value === null ? null : requiredString(value, field, true);
}

function relationId(value: unknown, field: string): string | null {
  if (value === null) return null;
  if (typeof value === "string") return requiredString(value, field);
  if (isRecord(value) && typeof value.id === "string") {
    return requiredString(value.id, field);
  }
  throw new TypeError(`Invalid stored asset usage relation: ${field}`);
}

function normalizeStoredUsage(value: unknown): NormalizedStoredUsage {
  if (!isRecord(value)) {
    throw new TypeError("Invalid stored asset usage row");
  }
  const id = requiredString(value.id, "id");
  const assetRecord = relationId(value.asset_record, "asset_record");
  const resolvedVersion = relationId(value.resolved_version, "resolved_version");
  const unresolvedRef = nullableString(value.unresolved_ref, "unresolved_ref");
  const scanRunId = requiredString(value.scan_run_id, "scan_run_id");
  const manifestHash = requiredString(
    value.last_seen_manifest_sha256,
    "last_seen_manifest_sha256",
  );
  const confidence = value.confidence as NormalizedStoredUsage["confidence"];
  const consumerType = value.consumer_type as NormalizedStoredUsage["consumer_type"];
  const sourceKind = value.source_kind as NormalizedStoredUsage["source_kind"];
  const locale = value.locale as NormalizedStoredUsage["locale"];
  const deliveryMode = value.delivery_mode as NormalizedStoredUsage["delivery_mode"];
  if (
    !SHA256_HEX_PATTERN.test(id) ||
    !SHA256_HEX_PATTERN.test(manifestHash) ||
    !CONFIDENCE_VALUES.has(confidence) ||
    !CONSUMER_TYPE_VALUES.has(consumerType) ||
    !SOURCE_KIND_VALUES.has(sourceKind) ||
    !(locale === null || LOCALE_VALUES.has(locale)) ||
    !(ASSET_DELIVERY_MODES as readonly string[]).includes(deliveryMode) ||
    typeof value.required !== "boolean" ||
    typeof value.active !== "boolean" ||
    !(value.source_line === null ||
      (Number.isSafeInteger(value.source_line) && Number(value.source_line) > 0))
  ) {
    throw new TypeError(`Invalid stored asset usage row: ${id}`);
  }
  return {
    id,
    environment: "dev",
    asset_record: assetRecord,
    resolved_version: resolvedVersion,
    unresolved_ref: unresolvedRef,
    scan_run_id: scanRunId,
    last_seen_manifest_sha256: manifestHash as Sha256Hex,
    confidence,
    consumer_type: consumerType,
    consumer_key: requiredString(value.consumer_key, "consumer_key"),
    source_kind: sourceKind,
    source_file: requiredString(value.source_file, "source_file"),
    cms_field: nullableString(value.cms_field, "cms_field"),
    source_line: value.source_line as number | null,
    route: nullableString(value.route, "route"),
    locale,
    slot: requiredString(value.slot, "slot"),
    required: value.required,
    delivery_mode: deliveryMode,
    alt_text_override: nullableString(
      value.alt_text_override,
      "alt_text_override",
    ),
    alt_source: nullableString(value.alt_source, "alt_source"),
    active: value.active,
    first_seen: strictIsoTimestamp(
      requiredString(value.first_seen, "first_seen"),
      "Stored asset usage first_seen",
    ),
    last_seen: strictIsoTimestamp(
      requiredString(value.last_seen, "last_seen"),
      "Stored asset usage last_seen",
    ),
    date_updated:
      value.date_updated === null
        ? null
        : strictIsoTimestamp(
            requiredString(value.date_updated, "date_updated"),
            "Stored asset usage date_updated",
          ),
  };
}

function requestHeaders(
  token: string,
  includeJson: boolean,
): Record<string, string> {
  return {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
    ...(includeJson ? { "Content-Type": "application/json" } : {}),
  };
}

export function createAssetUsageSyncHttpClient(input: {
  url: string;
  token: string;
  fetch?: typeof fetch;
}): AssetUsageSyncHttpClient {
  assertAssetUsageSyncUrl(input.url);
  if (!input.token || input.token.trim() !== input.token) {
    throw new TypeError("DIRECTUS_ADMIN_TOKEN is required");
  }
  const fetcher = input.fetch ?? globalThis.fetch;
  return {
    async readStoredUsages() {
      const rows: NormalizedStoredUsage[] = [];
      for (let offset = 0; ; offset += PAGE_SIZE) {
        const query = new URLSearchParams({
          fields: STORED_USAGE_FIELDS.join(","),
          sort: "id",
          limit: String(PAGE_SIZE),
          offset: String(offset),
        });
        const response = await fetcher(
          new URL(`/items/asset_usages?${query}`, input.url),
          {
            method: "GET",
            headers: requestHeaders(input.token, false),
            redirect: "error",
            signal: AbortSignal.timeout(30_000),
          },
        );
        if (!response.ok) {
          throw new Error(`Asset usage CMS request failed (${response.status})`);
        }
        let body: unknown;
        try {
          body = await response.json();
        } catch {
          throw new Error("Asset usage CMS response was invalid");
        }
        if (!isRecord(body) || !Array.isArray(body.data)) {
          throw new Error("Asset usage CMS response was invalid");
        }
        const page = body.data.map(normalizeStoredUsage);
        rows.push(...page);
        if (page.length < PAGE_SIZE) return rows;
      }
    },
    async applyAction(action) {
      const create = action.kind === "create";
      const path = create
        ? "/items/asset_usages"
        : `/items/asset_usages/${encodeURIComponent(action.id)}`;
      const response = await fetcher(new URL(path, input.url), {
        method: create ? "POST" : "PATCH",
        headers: requestHeaders(input.token, true),
        body: JSON.stringify(action.payload),
        redirect: "error",
        signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok) {
        throw new Error(`Asset usage CMS request failed (${response.status})`);
      }
    },
  };
}

function defaultDependencies(): AssetUsageSyncCliDependencies {
  const clients = new Map<string, AssetUsageSyncHttpClient>();
  const client = (input: SyncReadInput): AssetUsageSyncHttpClient => {
    const key = `${input.url}\0${input.token}`;
    const current = clients.get(key);
    if (current) return current;
    const created = createAssetUsageSyncHttpClient(input);
    clients.set(key, created);
    return created;
  };
  return {
    env: process.env,
    now: () => new Date().toISOString(),
    resolveDirectusUrl: () => DEV_ASSET_USAGE_SYNC_URL,
    loadAuditReport: (input) =>
      loadLiveAssetAuditReport({
        targets: [{ environment: "dev", url: input.url }],
        token: input.token,
      }),
    loadStoredUsages: (input) => client(input).readStoredUsages(),
    applyAction: (input) => client(input).applyAction(input.action),
    log: (message) => console.log(message),
    error: (message) => console.error(message),
  };
}

function publicCliError(error: unknown, token?: string): string {
  let message = error instanceof Error ? error.message : String(error);
  if (token) message = message.replaceAll(token, "[REDACTED]");
  const safeDetail =
    /DEV-ONLY|Refusing|Unknown asset usage sync flag|at most once|Choose one|DIRECTUS_ADMIN_TOKEN|incomplete .* evidence|id collision|strict ISO|Invalid asset usage identity/i.test(
      message,
    );
  if (!safeDetail) return "Asset usage sync failed during CMS operation";
  return sanitizeAssetAuditPublicText(message).slice(0, 400);
}

export async function runAssetUsageSyncCli(
  argv: readonly string[],
  dependencies: Partial<AssetUsageSyncCliDependencies> = {},
): Promise<0 | 2> {
  const deps = { ...defaultDependencies(), ...dependencies };
  let token: string | undefined;
  try {
    const args = parseAssetUsageSyncArgs(argv);
    const readUrl = deps.resolveDirectusUrl();
    assertAssetUsageSyncUrl(readUrl);
    token = deps.env.DIRECTUS_ADMIN_TOKEN;
    if (!token || token.trim() !== token) {
      throw new TypeError("DIRECTUS_ADMIN_TOKEN is required");
    }
    const readInput = { url: readUrl, token };
    const [report, storedUsages] = await Promise.all([
      deps.loadAuditReport(readInput),
      deps.loadStoredUsages(readInput),
    ]);
    const plan = buildAssetUsageSyncPlan({
      report,
      storedUsages,
      observationTime: deps.now(),
    });
    const counts = {
      create: plan.actions.filter((action) => action.kind === "create").length,
      update: plan.actions.filter((action) => action.kind === "update").length,
      deactivate: plan.actions.filter(
        (action) => action.kind === "deactivate",
      ).length,
    };
    deps.log(
      `Asset usage sync ${args.mode}: create=${counts.create} update=${counts.update} deactivate=${counts.deactivate}`,
    );
    if (args.mode === "dry-run") return 0;

    const applyUrl = deps.resolveDirectusUrl();
    assertAssetUsageSyncUrl(applyUrl);
    if (applyUrl !== readUrl) {
      throw new TypeError("Refusing changed DEV asset usage target. DEV-ONLY.");
    }
    for (const action of plan.actions) {
      await deps.applyAction({ url: applyUrl, token, action });
    }
    deps.log(
      `Asset usage sync apply complete: create=${counts.create} update=${counts.update} deactivate=${counts.deactivate}`,
    );
    return 0;
  } catch (error) {
    deps.error(`Asset usage sync error: ${publicCliError(error, token)}`);
    return 2;
  }
}

if (import.meta.main) {
  process.exitCode = await runAssetUsageSyncCli(process.argv.slice(2));
}
