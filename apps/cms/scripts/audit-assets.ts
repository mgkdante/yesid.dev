#!/usr/bin/env bun

import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdir, realpath, rename, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { promisify } from "node:util";
import {
  ASSET_FINDING_CODES,
  fingerprintAssetFinding,
  projectAssetFindingEvidence,
  reconcileAssetAudit,
  sanitizeAssetAuditPublicText,
  type AssetAuditReport,
  type AssetAuditScope,
  type AssetFinding,
  type GeneratedOutputExpectation,
  type OgCoverageRequirement,
} from "./lib/assets/audit";
import {
  scanDirectusAssets,
  type CmsEnvironment,
  type CmsReadClient,
} from "./lib/assets/directus-scan";
import {
  canonicalizeAssetAuditReport,
  hashAssetAuditReport,
} from "./lib/assets/report";
import {
  scanRepository,
  type RepositoryScan,
  type RepositoryUsage,
} from "./lib/assets/repository-scan";
import { assetUsageDeclarations } from "../../web/src/lib/assets/usage-declarations";
import { blogPosts } from "../../web/src/lib/content/blog";
import { legalPages } from "../../web/src/lib/content/legal-pages";
import { projects } from "../../web/src/lib/content/projects";
import { services } from "../../web/src/lib/content/services";
import { sitePages } from "../../web/src/lib/content/site-pages";
import { PUBLISHED_LOCALES } from "../../web/src/lib/utils/published-locales";
import { parseAssetSemanticKey, type Sha256Hex } from "@repo/shared";

const execFileAsync = promisify(execFile);
const CMS_ROOT = resolve(import.meta.dir, "..");
const REPO_ROOT = resolve(CMS_ROOT, "../..");
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const GIT_REVISION_PATTERN = /^[0-9a-f]{40}(?:[0-9a-f]{24})?$/;
const BASELINE_KEYS = Object.freeze([
  "schemaVersion",
  "source",
  "generatedAt",
  "repositoryRevision",
  "scopeReceipts",
  "reportSha256",
  "repositoryAssetIds",
  "acceptedFindings",
  "releaseManifest",
] as const);
const SCOPE_RECEIPT_KEYS = Object.freeze([
  "scope",
  "status",
  "reason",
] as const);
const ACCEPTED_FINDING_KEYS = Object.freeze([
  "fingerprint",
  "code",
  "severity",
  "requiredScopes",
] as const);
const RELEASE_MANIFEST_KEYS = Object.freeze(["status", "validated"] as const);
const SCOPE_REASONS = Object.freeze([
  "complete",
  "input-absent",
  "registry-missing",
  "registry-forbidden",
  "request-failed",
  "response-invalid",
  "supplemental-evidence-missing",
] as const satisfies readonly AssetAuditReport["scopeReceipts"][number]["reason"][]);
const FINDING_SEVERITY_RANK = Object.freeze({
  info: 0,
  warning: 1,
  error: 2,
} as const satisfies Readonly<Record<AssetFinding["severity"], number>>);

export const TARGET_URLS = Object.freeze({
  dev: "https://cms.dev.yesid.dev",
  prod: "https://cms.yesid.dev",
} as const);

export const DEFAULT_ASSET_AUDIT_REPORT_PATH = resolve(
  CMS_ROOT,
  ".asset-audit/report.json",
);
export const DEFAULT_ASSET_AUDIT_BASELINE_PATH = resolve(
  CMS_ROOT,
  "fixtures/assets/audit-baseline.json",
);
export const UPDATE_ASSET_AUDIT_BASELINE_CONFIRMATION =
  "UPDATE_ASSET_AUDIT_BASELINE" as const;

export const ASSET_AUDIT_SCOPES = Object.freeze([
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

export type AssetAuditTarget = "dev" | "prod" | "both";
export type AssetAuditExitCode = 0 | 1 | 2;

export interface ParsedAssetAuditArgs {
  offline: boolean;
  target: AssetAuditTarget;
  reportPath: string;
  baselinePath: string;
  requireNoRegressions: boolean;
  requireClean: boolean;
  updateBaseline: boolean;
  help: boolean;
}

export interface AcceptedAssetFinding {
  fingerprint: Sha256Hex;
  code: AssetFinding["code"];
  severity: AssetFinding["severity"];
  requiredScopes: readonly AssetAuditScope[];
}

export interface AssetAuditBaseline {
  schemaVersion: 1;
  source: "live";
  generatedAt: string;
  repositoryRevision: string | null;
  scopeReceipts: AssetAuditReport["scopeReceipts"];
  reportSha256: Sha256Hex;
  repositoryAssetIds: readonly string[];
  acceptedFindings: readonly AcceptedAssetFinding[];
  releaseManifest: {
    status: "unavailable-until-41.2";
    validated: false;
  };
}

export interface AssetAuditGateOutcome extends AcceptedAssetFinding {
  status: "ACCEPTED" | "REGRESSION" | "RESOLVED" | "NOT_EVALUATED";
}

export interface AssetAuditGateResult {
  exitCode: 0 | 1;
  outcomes: readonly AssetAuditGateOutcome[];
  repositoryManifest: {
    status: "EVALUATED";
    acceptedCount: number;
    currentCount: number;
    addedIds: readonly string[];
    removedIds: readonly string[];
  };
}

export interface LiveReportInput {
  targets: readonly {
    environment: CmsEnvironment;
    url: string;
  }[];
  token: string;
}

export interface AssetAuditCliDependencies {
  env: Readonly<Record<string, string | undefined>>;
  now: () => string;
  repositoryRevision: () => Promise<string | null>;
  loadOfflineReport: () => Promise<AssetAuditReport>;
  loadLiveReport: (input: LiveReportInput) => Promise<AssetAuditReport>;
  readJson: (path: string) => Promise<unknown>;
  writeText: (path: string, contents: string) => Promise<void>;
  log: (message: string) => void;
  error: (message: string) => void;
}

function optionKey(argument: string): string {
  const equals = argument.indexOf("=");
  return equals < 0 ? argument : argument.slice(0, equals);
}

function recordOption(seen: Set<string>, argument: string): void {
  const key = optionKey(argument);
  if (seen.has(key)) {
    throw new TypeError(`${key} may be supplied at most once`);
  }
  seen.add(key);
}

function requiredOptionValue(argument: string, name: string): string {
  const value = argument.slice(name.length + 1);
  if (!value || value.includes("\0")) {
    throw new TypeError(`${name} requires a non-empty value`);
  }
  return value;
}

export function parseAssetAuditArgs(
  argv: readonly string[],
): ParsedAssetAuditArgs {
  const seen = new Set<string>();
  let offline = false;
  let target: AssetAuditTarget = "both";
  let reportPath = DEFAULT_ASSET_AUDIT_REPORT_PATH;
  let baselinePath = DEFAULT_ASSET_AUDIT_BASELINE_PATH;
  let requireNoRegressions = false;
  let requireClean = false;
  let updateBaseline = false;
  let help = false;
  let confirmation: string | null = null;

  for (const argument of argv) {
    recordOption(seen, argument);
    if (argument === "--offline") offline = true;
    else if (argument === "--require-no-regressions")
      requireNoRegressions = true;
    else if (argument === "--require-clean") requireClean = true;
    else if (argument === "--update-baseline") updateBaseline = true;
    else if (argument === "--help") help = true;
    else if (argument.startsWith("--target=")) {
      const value = requiredOptionValue(argument, "--target");
      if (!(value === "dev" || value === "prod" || value === "both")) {
        throw new TypeError("--target must be dev, prod, or both");
      }
      target = value;
    } else if (argument.startsWith("--report=")) {
      reportPath = requiredOptionValue(argument, "--report");
    } else if (argument.startsWith("--baseline=")) {
      baselinePath = requiredOptionValue(argument, "--baseline");
    } else if (argument.startsWith("--confirm=")) {
      confirmation = requiredOptionValue(argument, "--confirm");
    } else {
      throw new TypeError("Unknown asset audit option");
    }
  }

  if (resolve(reportPath) === resolve(baselinePath)) {
    throw new TypeError("Report and baseline paths must be different");
  }
  if (confirmation !== null && !updateBaseline) {
    throw new TypeError("--confirm requires --update-baseline");
  }
  if (updateBaseline) {
    if (offline) {
      throw new TypeError("Offline runs cannot update the live baseline");
    }
    if (target !== "both") {
      throw new TypeError("Baseline updates require --target=both");
    }
    if (requireNoRegressions || requireClean) {
      throw new TypeError(
        "Baseline updates cannot be combined with gate flags",
      );
    }
    if (confirmation !== UPDATE_ASSET_AUDIT_BASELINE_CONFIRMATION) {
      throw new TypeError(
        `Baseline update requires --confirm=${UPDATE_ASSET_AUDIT_BASELINE_CONFIRMATION}`,
      );
    }
  }

  return {
    offline,
    target,
    reportPath,
    baselinePath,
    requireNoRegressions,
    requireClean,
    updateBaseline,
    help,
  };
}

function compareUtf8(left: string, right: string): number {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean {
  const keys = Object.keys(value).sort(compareUtf8);
  const canonical = [...expected].sort(compareUtf8);
  return (
    keys.length === canonical.length &&
    keys.every((key, index) => key === canonical[index])
  );
}

function validScopeReceipt(
  value: unknown,
): value is AssetAuditReport["scopeReceipts"][number] {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, SCOPE_RECEIPT_KEYS) ||
    !ASSET_AUDIT_SCOPES.includes(value.scope as AssetAuditScope) ||
    !(value.status === "evaluated" || value.status === "not-evaluated") ||
    !SCOPE_REASONS.includes(
      value.reason as AssetAuditReport["scopeReceipts"][number]["reason"],
    )
  ) {
    return false;
  }
  if (value.status === "evaluated") {
    return value.reason === "complete";
  }
  return value.reason !== "complete";
}

function validateScopeReceipts(
  value: unknown,
): AssetAuditReport["scopeReceipts"] {
  if (!Array.isArray(value) || value.length !== ASSET_AUDIT_SCOPES.length) {
    throw new TypeError("Asset audit baseline has invalid scope receipts");
  }
  const byScope = new Map<string, AssetAuditReport["scopeReceipts"][number]>();
  for (const item of value) {
    if (!validScopeReceipt(item) || byScope.has(item.scope as string)) {
      throw new TypeError("Asset audit baseline has invalid scope receipts");
    }
    byScope.set(
      item.scope as string,
      item as unknown as AssetAuditReport["scopeReceipts"][number],
    );
  }
  return ASSET_AUDIT_SCOPES.map((scope) => byScope.get(scope)!);
}

function validateAcceptedFinding(value: unknown): AcceptedAssetFinding {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ACCEPTED_FINDING_KEYS) ||
    typeof value.fingerprint !== "string" ||
    !SHA256_PATTERN.test(value.fingerprint) ||
    !ASSET_FINDING_CODES.includes(value.code as AssetFinding["code"]) ||
    !(
      value.severity === "error" ||
      value.severity === "warning" ||
      value.severity === "info"
    ) ||
    !Array.isArray(value.requiredScopes) ||
    value.requiredScopes.length === 0
  ) {
    throw new TypeError("Asset audit baseline has an invalid accepted finding");
  }
  const scopes = value.requiredScopes as unknown[];
  if (
    scopes.some(
      (scope) =>
        typeof scope !== "string" ||
        !ASSET_AUDIT_SCOPES.includes(scope as AssetAuditScope),
    ) ||
    new Set(scopes).size !== scopes.length
  ) {
    throw new TypeError("Asset audit baseline has invalid finding scopes");
  }
  return {
    fingerprint: value.fingerprint as Sha256Hex,
    code: value.code as AssetFinding["code"],
    severity: value.severity,
    requiredScopes: ASSET_AUDIT_SCOPES.filter((scope) =>
      scopes.includes(scope),
    ),
  };
}

const REPOSITORY_SOURCE_KINDS = new Set<
  AssetAuditReport["rows"][number]["sources"][number]["kind"]
>([
  "repository-file",
  "generated-file",
  "cms-mirror",
  "code-component",
  "external-provider",
  "external-publication",
]);

function validateRepositoryAssetIds(value: unknown): readonly string[] {
  if (!Array.isArray(value) || value.length > 50_000) {
    throw new TypeError(
      "Asset audit baseline has an invalid repository manifest",
    );
  }
  const ids = value.map((id) => {
    if (
      typeof id !== "string" ||
      id.length === 0 ||
      id.length > 2_048 ||
      id.trim() !== id ||
      sanitizeAssetAuditPublicText(id) !== id
    ) {
      throw new TypeError(
        "Asset audit baseline has an invalid repository manifest",
      );
    }
    return id;
  });
  if (new Set(ids).size !== ids.length) {
    throw new TypeError(
      "Asset audit baseline has duplicate repository asset ids",
    );
  }
  return [...ids].sort(compareUtf8);
}

function repositoryAssetIdsFromReport(
  report: AssetAuditReport,
): readonly string[] {
  const ids = new Set<string>();
  for (const row of report.rows) {
    for (const source of row.sources) {
      if (
        source.environment !== null ||
        !REPOSITORY_SOURCE_KINDS.has(source.kind)
      ) {
        continue;
      }
      if (
        typeof source.id !== "string" ||
        source.id.length === 0 ||
        source.id.length > 2_048 ||
        source.id.trim() !== source.id ||
        sanitizeAssetAuditPublicText(source.id) !== source.id
      ) {
        throw new TypeError(
          "Current asset audit report has an invalid repository asset id",
        );
      }
      ids.add(source.id);
    }
  }
  return [...ids].sort(compareUtf8);
}

export function parseAssetAuditBaseline(value: unknown): AssetAuditBaseline {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, BASELINE_KEYS) ||
    value.schemaVersion !== 1 ||
    value.source !== "live" ||
    typeof value.generatedAt !== "string" ||
    !Number.isFinite(Date.parse(value.generatedAt)) ||
    new Date(value.generatedAt).toISOString() !== value.generatedAt ||
    !(
      value.repositoryRevision === null ||
      (typeof value.repositoryRevision === "string" &&
        GIT_REVISION_PATTERN.test(value.repositoryRevision))
    ) ||
    typeof value.reportSha256 !== "string" ||
    !SHA256_PATTERN.test(value.reportSha256) ||
    !Array.isArray(value.repositoryAssetIds) ||
    !Array.isArray(value.acceptedFindings) ||
    !isRecord(value.releaseManifest) ||
    !hasExactKeys(value.releaseManifest, RELEASE_MANIFEST_KEYS) ||
    value.releaseManifest.status !== "unavailable-until-41.2" ||
    value.releaseManifest.validated !== false
  ) {
    throw new TypeError("Invalid live asset audit baseline");
  }
  const acceptedFindings = value.acceptedFindings
    .map(validateAcceptedFinding)
    .sort((left, right) => compareUtf8(left.fingerprint, right.fingerprint));
  if (
    new Set(acceptedFindings.map((finding) => finding.fingerprint)).size !==
    acceptedFindings.length
  ) {
    throw new TypeError("Asset audit baseline has duplicate fingerprints");
  }
  return {
    schemaVersion: 1,
    source: "live",
    generatedAt: value.generatedAt,
    repositoryRevision: value.repositoryRevision,
    scopeReceipts: validateScopeReceipts(value.scopeReceipts),
    reportSha256: value.reportSha256 as Sha256Hex,
    repositoryAssetIds: validateRepositoryAssetIds(value.repositoryAssetIds),
    acceptedFindings,
    releaseManifest: {
      status: "unavailable-until-41.2",
      validated: false,
    },
  };
}

function normalizeAssetAuditReport(
  report: AssetAuditReport,
  rejectStaleFingerprints: boolean,
): AssetAuditReport {
  if (
    !report ||
    typeof report !== "object" ||
    !Array.isArray(report.findings)
  ) {
    throw new TypeError("Invalid current asset audit report");
  }
  for (const finding of report.findings) {
    if (
      !finding ||
      typeof finding !== "object" ||
      !ASSET_FINDING_CODES.includes(finding.code) ||
      !(
        finding.severity === "error" ||
        finding.severity === "warning" ||
        finding.severity === "info"
      ) ||
      !Array.isArray(finding.requiredScopes) ||
      finding.requiredScopes.length === 0 ||
      finding.requiredScopes.some(
        (scope: AssetAuditScope) => !ASSET_AUDIT_SCOPES.includes(scope),
      ) ||
      new Set(finding.requiredScopes).size !== finding.requiredScopes.length
    ) {
      throw new TypeError("Current asset audit report has an invalid finding");
    }
  }
  const normalized = JSON.parse(
    canonicalizeAssetAuditReport(report),
  ) as AssetAuditReport;
  validateScopeReceipts(normalized.scopeReceipts);
  if (
    new Set(normalized.findings.map((finding) => finding.fingerprint)).size !==
    normalized.findings.length
  ) {
    throw new TypeError(
      "Current asset audit report has duplicate canonical fingerprints",
    );
  }
  if (rejectStaleFingerprints) {
    for (const raw of report.findings) {
      const expected = fingerprintAssetFinding({
        schemaVersion: 1,
        code: raw.code,
        identity: sanitizeAssetAuditPublicText(raw.identity),
        evidence: projectAssetFindingEvidence(raw.code, raw.evidence),
      });
      if (raw.id !== expected || raw.fingerprint !== expected) {
        throw new TypeError(
          "Current asset audit report contains a stale or forged fingerprint",
        );
      }
    }
  }
  return normalized;
}

function findingReceipt(finding: AssetFinding): AcceptedAssetFinding {
  return {
    fingerprint: finding.fingerprint,
    code: finding.code,
    severity: finding.severity,
    requiredScopes: ASSET_AUDIT_SCOPES.filter((scope) =>
      finding.requiredScopes.includes(scope),
    ),
  };
}

function scopesEvaluated(
  scopes: readonly AssetAuditScope[],
  receipts: ReadonlyMap<AssetAuditScope, "evaluated" | "not-evaluated">,
): boolean {
  return scopes.every((scope) => receipts.get(scope) === "evaluated");
}

export function evaluateAssetAuditGate(input: {
  report: AssetAuditReport;
  baseline: AssetAuditBaseline;
  requireNoRegressions: boolean;
  requireClean: boolean;
}): AssetAuditGateResult {
  const baseline = parseAssetAuditBaseline(input.baseline);
  const report = normalizeAssetAuditReport(input.report, true);
  const receiptStatus = new Map(
    report.scopeReceipts.map((receipt) => [receipt.scope, receipt.status]),
  );
  const current = new Map<Sha256Hex, AssetFinding>();
  for (const finding of report.findings) {
    if (current.has(finding.fingerprint)) {
      throw new TypeError(
        "Current asset audit report has duplicate fingerprints",
      );
    }
    current.set(finding.fingerprint, finding);
  }
  const accepted = new Map(
    baseline.acceptedFindings.map((finding) => [finding.fingerprint, finding]),
  );
  const currentRepositoryAssetIds = repositoryAssetIdsFromReport(report);
  const acceptedRepositoryAssetIds = new Set(baseline.repositoryAssetIds);
  const currentRepositoryAssetIdSet = new Set(currentRepositoryAssetIds);
  const addedRepositoryAssetIds = currentRepositoryAssetIds.filter(
    (id) => !acceptedRepositoryAssetIds.has(id),
  );
  const removedRepositoryAssetIds = baseline.repositoryAssetIds.filter(
    (id) => !currentRepositoryAssetIdSet.has(id),
  );
  const fingerprints = [
    ...new Set([...current.keys(), ...accepted.keys()]),
  ].sort(compareUtf8);
  const outcomes: AssetAuditGateOutcome[] = fingerprints.map((fingerprint) => {
    const currentFinding = current.get(fingerprint);
    const baselineFinding = accepted.get(fingerprint);
    const receipt = currentFinding
      ? findingReceipt(currentFinding)
      : baselineFinding!;
    if (currentFinding && baselineFinding) {
      const severityEscalated =
        FINDING_SEVERITY_RANK[currentFinding.severity] >
        FINDING_SEVERITY_RANK[baselineFinding.severity];
      const scopesWidened = currentFinding.requiredScopes.some(
        (scope) => !baselineFinding.requiredScopes.includes(scope),
      );
      if (severityEscalated || scopesWidened) {
        return { ...receipt, status: "REGRESSION" };
      }
    }
    if (!scopesEvaluated(receipt.requiredScopes, receiptStatus)) {
      return { ...receipt, status: "NOT_EVALUATED" };
    }
    if (currentFinding && baselineFinding) {
      return { ...receipt, status: "ACCEPTED" };
    }
    if (currentFinding) return { ...receipt, status: "REGRESSION" };
    return { ...receipt, status: "RESOLVED" };
  });
  const incomplete = report.scopeReceipts.some(
    (receipt) => receipt.status !== "evaluated",
  );
  const cleanFailure =
    input.requireClean &&
    (report.findings.length > 0 ||
      incomplete ||
      addedRepositoryAssetIds.length > 0);
  const regressionFailure =
    input.requireNoRegressions &&
    (outcomes.some((outcome) => outcome.status === "REGRESSION") ||
      addedRepositoryAssetIds.length > 0);
  return {
    exitCode: cleanFailure || regressionFailure ? 1 : 0,
    outcomes,
    repositoryManifest: {
      status: "EVALUATED",
      acceptedCount: baseline.repositoryAssetIds.length,
      currentCount: currentRepositoryAssetIds.length,
      addedIds: addedRepositoryAssetIds,
      removedIds: removedRepositoryAssetIds,
    },
  };
}

export function createAssetAuditBaseline(input: {
  report: AssetAuditReport;
  generatedAt: string;
  repositoryRevision: string | null;
}): AssetAuditBaseline {
  const report = normalizeAssetAuditReport(input.report, false);
  const baseline: AssetAuditBaseline = {
    schemaVersion: 1,
    source: "live",
    generatedAt: input.generatedAt,
    repositoryRevision: input.repositoryRevision,
    scopeReceipts: report.scopeReceipts,
    reportSha256: hashAssetAuditReport(report),
    repositoryAssetIds: repositoryAssetIdsFromReport(report),
    acceptedFindings: report.findings
      .map(findingReceipt)
      .sort((left, right) => compareUtf8(left.fingerprint, right.fingerprint)),
    releaseManifest: {
      status: "unavailable-until-41.2",
      validated: false,
    },
  };
  return parseAssetAuditBaseline(baseline);
}

export function canonicalizeAssetAuditBaseline(
  baseline: AssetAuditBaseline,
): string {
  return `${JSON.stringify(parseAssetAuditBaseline(baseline), null, "\t")}\n`;
}

type OgLocale = "en" | "fr" | "es";

export interface AssetAuditOgGraphCounts {
  siteStaticGroups: 13;
  serviceStaticGroups: 4;
  projectRuntimeGroups: 2;
  blogRuntimeGroups: 6;
  totalGroups: 25;
  totalRows: 75;
}

export interface AssetAuditOgGraph {
  repository: RepositoryScan;
  ogCoverage: readonly OgCoverageRequirement[];
  counts: AssetAuditOgGraphCounts;
}

interface BlogOgSource {
  slug: string;
  lang: string;
  translationKey: string;
  external: boolean;
}

interface ProjectOgSource {
  slug: string;
  status: string;
}

interface SitePageOgSource {
  path: string;
}

interface ServiceOgSource {
  id: string;
  visible: boolean;
}

const OG_LOCALES = Object.freeze(["en", "fr", "es"] as const);
const DEFAULT_OG_GROUPS = Object.freeze([
  { ownerType: "site", ownerKey: "home", route: "/" },
  { ownerType: "route", ownerKey: "blog-listing", route: "/blog" },
  {
    ownerType: "route",
    ownerKey: "blog-personal",
    route: "/blog/personal",
  },
  { ownerType: "route", ownerKey: "tech-stack", route: "/tech-stack" },
  { ownerType: "route", ownerKey: "legal-privacy", route: "/legal/privacy" },
  { ownerType: "route", ownerKey: "legal-terms", route: "/legal/terms" },
  { ownerType: "route", ownerKey: "legal-cookies", route: "/legal/cookies" },
  {
    ownerType: "route",
    ownerKey: "legal-accessibility",
    route: "/legal/accessibility",
  },
  { ownerType: "route", ownerKey: "legal-notice", route: "/legal/notice" },
] as const);
const ROUTE_OG_GROUPS = Object.freeze([
  "about",
  "contact",
  "services",
  "projects",
] as const);
const SERVICE_OG_GROUPS = Object.freeze([
  "database-engineering",
  "data-pipeline",
  "analytics-reporting",
  "web-development",
] as const);

function localizedPublicRoute(route: string, locale: OgLocale): string {
  if (locale === "en") return route;
  return route === "/" ? `/${locale}` : `/${locale}${route}`;
}

function staticOgPath(
  family: "default" | "routes" | "services",
  key: string,
  locale: OgLocale,
): string {
  if (family === "default") {
    return `apps/web/static/og/default.${locale}.png`;
  }
  const suffix = locale === "en" ? "" : `.${locale}`;
  return `apps/web/static/og/${family}/${key}${suffix}.png`;
}

function staticProofUsage(input: {
  repository: RepositoryScan;
  usageKey: string;
  ownerType: "site" | "route" | "service";
  ownerKey: string;
  route: string;
  locale: OgLocale;
  repoPath: string;
  sourceFile: string;
}): RepositoryUsage {
  const matches = input.repository.assets.filter(
    (asset) => asset.repoPath === input.repoPath,
  );
  if (matches.length > 1) {
    throw new TypeError(`Duplicate repository OG path: ${input.repoPath}`);
  }
  return {
    id: `og-matrix:${input.usageKey}`,
    assetId: matches[0]?.id ?? `repo-file:${input.repoPath}`,
    semanticKey: null,
    unresolvedRef: null,
    confidence: "exact-static",
    consumerType: input.ownerType,
    consumerKey: input.ownerKey,
    sourceKind: "route",
    sourceFile: input.sourceFile,
    sourceLine: null,
    cmsField: null,
    route: input.route,
    locale: input.locale,
    slot: "og-image",
    required: true,
    deliveryMode: "og-meta",
    altTextOverride: null,
    altSource: null,
  };
}

function staticRequirement(input: {
  repository: RepositoryScan;
  consumerProofPresent: boolean;
  usageKey: string;
  semanticKey: OgCoverageRequirement["semanticCandidates"][number];
  ownerType: "site" | "route" | "service";
  ownerKey: string;
  route: string;
  locale: OgLocale;
  repoPath: string;
  sourceFile: string;
}): { requirement: OgCoverageRequirement; usage: RepositoryUsage | null } {
  const proofUsageId = `og-matrix:${input.usageKey}`;
  return {
    requirement: {
      usageKey: input.usageKey,
      route: input.route,
      locale: input.locale,
      ownerType: input.ownerType,
      ownerKey: input.ownerKey,
      semanticCandidates: [input.semanticKey],
      currentRef: { kind: "repository-path", repoPath: input.repoPath },
      proofUsageId,
      fallbackUsageKey: null,
      expectedInputHash: null,
      required: true,
      exclusionReason: null,
    },
    usage: input.consumerProofPresent ? staticProofUsage(input) : null,
  };
}

type StaticOgFamily = "default" | "routes" | "services";

const STATIC_OG_CONSUMER_SEAMS = Object.freeze({
  default: {
    id: "declared:site.og.localized-static",
    semanticKey: "site.og.localized-static",
    consumerType: "system",
    consumerKey: "localized-og-default",
    sourceFile: "apps/web/src/lib/utils/seo-defaults.ts#defaultOgImageFor",
    route: "/",
  },
  routes: {
    id: "declared:site.og.localized-route",
    semanticKey: "site.og.localized-route",
    consumerType: "route",
    consumerKey: "localized-route-og",
    sourceFile: "apps/web/src/lib/utils/seo-defaults.ts#localizeOgCard",
    route: null,
  },
  services: {
    id: "declared:site.og.localized-service",
    semanticKey: "site.og.localized-service",
    consumerType: "service",
    consumerKey: "localized-service-og",
    sourceFile:
      "apps/web/src/lib/adapters/route-seo-factories.ts#servicesIdSeoFactory",
    route: "/services/[id]",
  },
} as const);

function hasStaticOgConsumerProof(
  repository: RepositoryScan,
  family: StaticOgFamily,
): boolean {
  const expected = STATIC_OG_CONSUMER_SEAMS[family];
  const matches = repository.usages.filter((usage) => usage.id === expected.id);
  if (matches.length !== 1) return false;
  const usage = matches[0]!;
  return (
    usage.assetId === null &&
    usage.semanticKey === expected.semanticKey &&
    typeof usage.unresolvedRef === "string" &&
    usage.unresolvedRef.length > 0 &&
    usage.confidence === "declared-dynamic" &&
    usage.consumerType === expected.consumerType &&
    usage.consumerKey === expected.consumerKey &&
    usage.sourceKind === "declaration" &&
    usage.sourceFile === expected.sourceFile &&
    usage.cmsField === null &&
    usage.route === expected.route &&
    usage.locale === null &&
    usage.slot === "og-image" &&
    usage.required === true &&
    usage.deliveryMode === "og-meta"
  );
}

function groupedBlogs(
  rows: readonly BlogOgSource[],
): Map<string, Readonly<Record<OgLocale, BlogOgSource>>> {
  const groups = new Map<string, Map<OgLocale, BlogOgSource>>();
  for (const row of rows) {
    if (row.external) continue;
    if (!OG_LOCALES.includes(row.lang as OgLocale)) {
      throw new TypeError(`Unsupported blog OG locale: ${row.lang}`);
    }
    const locale = row.lang as OgLocale;
    const group = groups.get(row.translationKey) ?? new Map();
    if (group.has(locale)) {
      throw new TypeError(
        `Duplicate blog OG locale ${row.translationKey}:${locale}`,
      );
    }
    group.set(locale, row);
    groups.set(row.translationKey, group);
  }
  const complete = new Map<string, Readonly<Record<OgLocale, BlogOgSource>>>();
  for (const [translationKey, group] of groups) {
    if (!OG_LOCALES.every((locale) => group.has(locale))) {
      throw new TypeError(`Incomplete blog OG locale group: ${translationKey}`);
    }
    complete.set(translationKey, {
      en: group.get("en")!,
      fr: group.get("fr")!,
      es: group.get("es")!,
    });
  }
  return complete;
}

export function buildCurrentAssetOgGraph(input: {
  repository: RepositoryScan;
  blogs?: readonly BlogOgSource[];
  projectRows?: readonly ProjectOgSource[];
  legalSlugs?: readonly string[];
  sitePageRows?: readonly SitePageOgSource[];
  serviceRows?: readonly ServiceOgSource[];
  publishedLocales?: readonly string[];
}): AssetAuditOgGraph {
  const blogs = groupedBlogs(input.blogs ?? blogPosts);
  const publicProjects = (input.projectRows ?? projects)
    .filter((project) => project.status === "public")
    .map((project) => project.slug)
    .sort(compareUtf8);
  const currentLegalSlugs = [
    ...(input.legalSlugs ?? legalPages.map((page) => page.slug)),
  ].sort(compareUtf8);
  const expectedLegalSlugs = [
    "accessibility",
    "cookies",
    "notice",
    "privacy",
    "terms",
  ];
  const currentSitePaths = (input.sitePageRows ?? sitePages)
    .map((page) => page.path)
    .sort(compareUtf8);
  const expectedSitePaths = [
    ...DEFAULT_OG_GROUPS.map((group) => group.route),
    ...ROUTE_OG_GROUPS.map((route) => `/${route}`),
  ].sort(compareUtf8);
  const currentVisibleServices = (input.serviceRows ?? services)
    .filter((service) => service.visible)
    .map((service) => service.id)
    .sort(compareUtf8);
  const expectedVisibleServices = [...SERVICE_OG_GROUPS].sort(compareUtf8);
  const currentPublishedLocales = [
    ...(input.publishedLocales ?? PUBLISHED_LOCALES),
  ].sort(compareUtf8);
  const expectedPublishedLocales = [...OG_LOCALES].sort(compareUtf8);
  if (
    JSON.stringify(currentLegalSlugs) !== JSON.stringify(expectedLegalSlugs)
  ) {
    throw new TypeError("The canonical five-page legal OG inventory drifted");
  }
  if (JSON.stringify(currentSitePaths) !== JSON.stringify(expectedSitePaths)) {
    throw new TypeError("The generated site-page OG inventory drifted");
  }
  if (
    JSON.stringify(currentVisibleServices) !==
    JSON.stringify(expectedVisibleServices)
  ) {
    throw new TypeError("The generated visible-service OG inventory drifted");
  }
  if (
    JSON.stringify(currentPublishedLocales) !==
    JSON.stringify(expectedPublishedLocales)
  ) {
    throw new TypeError("The published OG locale inventory drifted");
  }
  if (publicProjects.length !== 2) {
    throw new TypeError("The canonical OG graph requires two public projects");
  }
  if (blogs.size !== 6) {
    throw new TypeError(
      "The canonical OG graph requires six blog translation groups",
    );
  }

  const requirements: OgCoverageRequirement[] = [];
  const proofUsages: RepositoryUsage[] = [];
  const staticConsumerProof = {
    default: hasStaticOgConsumerProof(input.repository, "default"),
    routes: hasStaticOgConsumerProof(input.repository, "routes"),
    services: hasStaticOgConsumerProof(input.repository, "services"),
  };
  for (const group of DEFAULT_OG_GROUPS) {
    for (const locale of OG_LOCALES) {
      const usageKey = `og.${group.ownerKey}.${locale}`;
      const row = staticRequirement({
        repository: input.repository,
        consumerProofPresent: staticConsumerProof.default,
        usageKey,
        semanticKey: parseAssetSemanticKey(`og.site.default.${locale}`),
        ownerType: group.ownerType,
        ownerKey: group.ownerKey,
        route: localizedPublicRoute(group.route, locale),
        locale,
        repoPath: staticOgPath("default", "default", locale),
        sourceFile: "apps/web/src/lib/utils/seo-defaults.ts#defaultOgImageFor",
      });
      requirements.push(row.requirement);
      if (row.usage) proofUsages.push(row.usage);
    }
  }
  for (const routeKey of ROUTE_OG_GROUPS) {
    for (const locale of OG_LOCALES) {
      const usageKey = `og.route.${routeKey}.${locale}`;
      const row = staticRequirement({
        repository: input.repository,
        consumerProofPresent: staticConsumerProof.routes,
        usageKey,
        semanticKey: parseAssetSemanticKey(`og.route.${routeKey}.${locale}`),
        ownerType: "route",
        ownerKey: routeKey,
        route: localizedPublicRoute(`/${routeKey}`, locale),
        locale,
        repoPath: staticOgPath("routes", routeKey, locale),
        sourceFile: "apps/web/src/lib/utils/seo-defaults.ts#localizeOgCard",
      });
      requirements.push(row.requirement);
      if (row.usage) proofUsages.push(row.usage);
    }
  }
  for (const serviceKey of SERVICE_OG_GROUPS) {
    for (const locale of OG_LOCALES) {
      const usageKey = `og.service.${serviceKey}.${locale}`;
      const row = staticRequirement({
        repository: input.repository,
        consumerProofPresent: staticConsumerProof.services,
        usageKey,
        semanticKey: parseAssetSemanticKey(
          `og.service.${serviceKey}.${locale}`,
        ),
        ownerType: "service",
        ownerKey: serviceKey,
        route: localizedPublicRoute(`/services/${serviceKey}`, locale),
        locale,
        repoPath: staticOgPath("services", serviceKey, locale),
        sourceFile:
          "apps/web/src/lib/adapters/route-seo-factories.ts#servicesIdSeoFactory",
      });
      requirements.push(row.requirement);
      if (row.usage) proofUsages.push(row.usage);
    }
  }
  for (const projectSlug of publicProjects) {
    for (const locale of OG_LOCALES) {
      requirements.push({
        usageKey: `og.project.${projectSlug}.${locale}`,
        route: localizedPublicRoute(`/projects/${projectSlug}`, locale),
        locale,
        ownerType: "project",
        ownerKey: projectSlug,
        semanticCandidates: [
          parseAssetSemanticKey(`og.project.${projectSlug}.${locale}`),
        ],
        currentRef: {
          kind: "runtime-route",
          route:
            locale === "en"
              ? `/og/project/${projectSlug}.png`
              : `/og/project/${projectSlug}.png?locale=${locale}`,
        },
        proofUsageId: "declared:site.og.runtime-project",
        fallbackUsageKey: null,
        expectedInputHash: null,
        required: true,
        exclusionReason: null,
      });
    }
  }
  for (const [translationKey, translations] of [...blogs].sort((left, right) =>
    compareUtf8(left[0], right[0]),
  )) {
    for (const locale of OG_LOCALES) {
      const slug = translations[locale].slug;
      requirements.push({
        usageKey: `og.blog.${translationKey}.${locale}`,
        route: localizedPublicRoute(`/blog/${slug}`, locale),
        locale,
        ownerType: "blog",
        ownerKey: translationKey,
        semanticCandidates: [
          parseAssetSemanticKey(`og.blog.${translationKey}.${locale}`),
        ],
        currentRef: {
          kind: "runtime-route",
          route: `/og/blog/${slug}.png`,
        },
        proofUsageId: "declared:site.og.runtime-blog",
        fallbackUsageKey: null,
        expectedInputHash: null,
        required: true,
        exclusionReason: null,
      });
    }
  }

  requirements.sort((left, right) =>
    compareUtf8(left.usageKey, right.usageKey),
  );
  proofUsages.sort((left, right) => compareUtf8(left.id, right.id));
  const existingUsageIds = new Set(
    input.repository.usages.map((usage) => usage.id),
  );
  for (const usage of proofUsages) {
    if (existingUsageIds.has(usage.id)) {
      throw new TypeError(`Duplicate OG proof usage: ${usage.id}`);
    }
  }
  const expectedStaticProofs =
    Number(staticConsumerProof.default) * DEFAULT_OG_GROUPS.length * 3 +
    Number(staticConsumerProof.routes) * ROUTE_OG_GROUPS.length * 3 +
    Number(staticConsumerProof.services) * SERVICE_OG_GROUPS.length * 3;
  if (
    requirements.length !== 75 ||
    proofUsages.length !== expectedStaticProofs
  ) {
    throw new TypeError("The canonical OG graph must contain 75 rows");
  }
  return {
    repository: {
      ...input.repository,
      usages: [...input.repository.usages, ...proofUsages],
    },
    ogCoverage: requirements,
    counts: {
      siteStaticGroups: 13,
      serviceStaticGroups: 4,
      projectRuntimeGroups: 2,
      blogRuntimeGroups: 6,
      totalGroups: 25,
      totalRows: 75,
    },
  };
}

export function buildCurrentGeneratedOutputExpectations(
  repository: RepositoryScan,
): readonly GeneratedOutputExpectation[] {
  const assets = new Map(repository.assets.map((asset) => [asset.id, asset]));
  const requiredAssets = new Set(
    repository.usages
      .filter((usage) => usage.required && usage.assetId !== null)
      .map((usage) => usage.assetId!),
  );
  const outputs = new Map<string, GeneratedOutputExpectation>();
  for (const link of repository.generatedFrom) {
    const asset = assets.get(link.outputAssetId);
    if (!asset) continue;
    const key = `${link.outputAssetId}\0${link.generator}`;
    if (outputs.has(key)) continue;
    outputs.set(key, {
      outputAssetId: link.outputAssetId,
      semanticKey: null,
      generator: link.generator,
      expectedOutputSha256:
        asset.sha256 && SHA256_PATTERN.test(asset.sha256)
          ? (asset.sha256 as Sha256Hex)
          : null,
      expectedInputHash: null,
      observedMetadataState: "missing",
      observedMimeType: null,
      observedWidth: null,
      observedHeight: null,
      expectedMimeType: null,
      expectedWidth: null,
      expectedHeight: null,
      required: requiredAssets.has(asset.id),
    });
  }
  const result = [...outputs.values()].sort(
    (left, right) =>
      compareUtf8(left.outputAssetId, right.outputAssetId) ||
      compareUtf8(left.generator, right.generator),
  );
  if (result.length === 0) {
    throw new TypeError("Generated asset evidence is absent");
  }
  return result;
}

function fieldsList(fields: readonly unknown[]): string {
  if (!fields.every((field) => typeof field === "string" && field.length > 0)) {
    throw new TypeError("Directus asset audit fields must be explicit strings");
  }
  return (fields as readonly string[]).join(",");
}

function pageEndpoint(surface: string): string {
  if (surface === "directus_files") return "/files";
  if (surface === "directus_folders") return "/folders";
  return `/items/${surface}`;
}

function singletonEndpoint(surface: string): string {
  if (surface === "directus_settings.storage_asset_presets") return "/settings";
  return `/items/${surface}`;
}

export function createAssetAuditCmsReadClient(input: {
  url: string;
  token: string;
  fetch?: typeof fetch;
}): CmsReadClient {
  if (!Object.values(TARGET_URLS).includes(input.url as never)) {
    throw new TypeError("Asset audit CMS URL is not an approved fixed target");
  }
  if (!input.token || input.token.trim() !== input.token) {
    throw new TypeError("DIRECTUS_ADMIN_TOKEN is required");
  }
  const fetcher = input.fetch ?? globalThis.fetch;
  const request = (path: string) =>
    fetcher(new URL(path, input.url), {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${input.token}`,
      },
      redirect: "error",
      signal: AbortSignal.timeout(30_000),
    });
  return {
    async readRegistryCollections() {
      const response = await request("/collections?fields=collection");
      if (!response.ok) return { status: response.status, data: null };
      let body: unknown;
      try {
        body = await response.json();
      } catch {
        return { status: response.status, data: null };
      }
      return {
        status: response.status,
        data: isRecord(body) ? body.data : undefined,
      };
    },
    async readPage(page) {
      const query = new URLSearchParams({
        fields: fieldsList(page.fields),
        sort: page.sort.join(","),
        limit: String(page.limit),
        offset: String(page.offset),
      });
      const response = await request(`${pageEndpoint(page.surface)}?${query}`);
      if (!response.ok) return { status: response.status, data: null };
      let body: unknown;
      try {
        body = await response.json();
      } catch {
        return { status: response.status, data: null };
      }
      return {
        status: response.status,
        data: isRecord(body) ? body.data : undefined,
      };
    },
    async readSingleton(singleton) {
      const query = new URLSearchParams({
        fields: fieldsList(singleton.fields),
      });
      const response = await request(
        `${singletonEndpoint(singleton.surface)}?${query}`,
      );
      if (!response.ok) return { status: response.status, data: null };
      let body: unknown;
      try {
        body = await response.json();
      } catch {
        return { status: response.status, data: null };
      }
      return {
        status: response.status,
        data: isRecord(body) ? body.data : undefined,
      };
    },
    async readAsset(fileId, maxBytes) {
      if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) {
        throw new TypeError("Asset byte limit must be a positive safe integer");
      }
      const response = await request(`/assets/${encodeURIComponent(fileId)}`);
      if (!response.ok) return { status: response.status, bytes: null };
      const declaredLength = response.headers.get("content-length");
      if (declaredLength !== null) {
        const length = Number(declaredLength);
        if (Number.isFinite(length) && length > maxBytes) {
          await response.body?.cancel();
          return { status: 413, bytes: null };
        }
      }
      if (!response.body) return { status: 502, bytes: null };
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let total = 0;
      while (true) {
        const next = await reader.read();
        if (next.done) break;
        total += next.value.byteLength;
        if (total > maxBytes) {
          await reader.cancel();
          return { status: 413, bytes: null };
        }
        chunks.push(next.value);
      }
      const bytes = new Uint8Array(total);
      let offset = 0;
      for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.byteLength;
      }
      return { status: response.status, bytes: bytes.buffer };
    },
  };
}

export async function currentRepositoryRevision(): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync("git", ["rev-parse", "HEAD"], {
      cwd: REPO_ROOT,
      encoding: "utf8",
    });
    const revision = stdout.trim();
    return revision || null;
  } catch {
    return null;
  }
}

async function loadAssetAuditReport(
  targets: readonly { environment: CmsEnvironment; url: string }[],
  token?: string,
): Promise<AssetAuditReport> {
  const rawRepository = await scanRepository({
    repoRoot: REPO_ROOT,
    declarations: assetUsageDeclarations,
  });
  const ogGraph = buildCurrentAssetOgGraph({ repository: rawRepository });
  const snapshots = await Promise.all(
    targets.map(async (target) => ({
      environment: target.environment,
      snapshot: await scanDirectusAssets({
        environment: target.environment,
        client: createAssetAuditCmsReadClient({
          url: target.url,
          token: token!,
        }),
      }),
    })),
  );
  const byEnvironment = new Map(
    snapshots.map((entry) => [entry.environment, entry.snapshot]),
  );
  const repositoryRevision = await currentRepositoryRevision();
  return reconcileAssetAudit({
    repository: ogGraph.repository,
    dev: byEnvironment.get("dev"),
    prod: byEnvironment.get("prod"),
    generatedOutputs: buildCurrentGeneratedOutputExpectations(
      ogGraph.repository,
    ),
    ogCoverage: ogGraph.ogCoverage,
    ...(repositoryRevision ? { repositoryRevision } : {}),
  });
}

export async function loadOfflineAssetAuditReport(): Promise<AssetAuditReport> {
  return loadAssetAuditReport([]);
}

export async function loadLiveAssetAuditReport(
  input: LiveReportInput,
): Promise<AssetAuditReport> {
  if (!input.token || input.token.trim() !== input.token) {
    throw new TypeError("DIRECTUS_ADMIN_TOKEN is required");
  }
  if (
    input.targets.length === 0 ||
    input.targets.some(
      (target) => TARGET_URLS[target.environment] !== target.url,
    )
  ) {
    throw new TypeError("Live asset audit targets must use fixed CMS URLs");
  }
  return loadAssetAuditReport(input.targets, input.token);
}

async function readJsonFile(path: string): Promise<unknown> {
  return Bun.file(path).json();
}

async function writeTextAtomically(
  path: string,
  contents: string,
): Promise<void> {
  const absolutePath = resolve(path);
  await mkdir(dirname(absolutePath), { recursive: true });
  const temporaryPath = `${absolutePath}.${randomUUID()}.tmp`;
  try {
    await Bun.write(temporaryPath, contents);
    await rename(temporaryPath, absolutePath);
  } finally {
    await rm(temporaryPath, { force: true });
  }
}

function defaultDependencies(): AssetAuditCliDependencies {
  return {
    env: process.env,
    now: () => new Date().toISOString(),
    repositoryRevision: currentRepositoryRevision,
    loadOfflineReport: loadOfflineAssetAuditReport,
    loadLiveReport: loadLiveAssetAuditReport,
    readJson: readJsonFile,
    writeText: writeTextAtomically,
    log: (message) => console.log(message),
    error: (message) => console.error(message),
  };
}

function selectedTargets(target: AssetAuditTarget): LiveReportInput["targets"] {
  if (target === "dev") {
    return [{ environment: "dev", url: TARGET_URLS.dev }];
  }
  if (target === "prod") {
    return [{ environment: "prod", url: TARGET_URLS.prod }];
  }
  return [
    { environment: "dev", url: TARGET_URLS.dev },
    { environment: "prod", url: TARGET_URLS.prod },
  ];
}

async function canonicalOutputPath(path: string): Promise<string> {
  const absolute = resolve(path);
  try {
    return await realpath(absolute);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return absolute;
    }
    throw error;
  }
}

async function assertDistinctOutputPaths(
  reportPath: string,
  baselinePath: string,
): Promise<void> {
  const [report, baseline] = await Promise.all([
    canonicalOutputPath(reportPath),
    canonicalOutputPath(baselinePath),
  ]);
  if (report === baseline) {
    throw new TypeError(
      "Report and baseline paths must resolve to different files",
    );
  }
}

function assertLiveBaselineEligible(report: AssetAuditReport): void {
  const normalized = normalizeAssetAuditReport(report, true);
  const requiredCompleteScopes = new Set<AssetAuditScope>([
    "repository",
    "dev-registry",
    "dev-files",
    "dev-content",
    "prod-files",
    "prod-content",
    "og-coverage",
  ]);
  const blockingReasons = new Set<
    AssetAuditReport["scopeReceipts"][number]["reason"]
  >([
    "input-absent",
    "registry-forbidden",
    "request-failed",
    "response-invalid",
  ]);
  const blocked = normalized.scopeReceipts.filter(
    (receipt) =>
      receipt.status === "not-evaluated" && blockingReasons.has(receipt.reason),
  );
  if (blocked.length > 0) {
    throw new TypeError(
      `Live baseline evidence is incomplete for ${blocked
        .map((receipt) => receipt.scope)
        .join(", ")}`,
    );
  }
  const incompleteRequiredScopes = normalized.scopeReceipts.filter(
    (receipt) =>
      requiredCompleteScopes.has(receipt.scope) &&
      !(receipt.status === "evaluated" && receipt.reason === "complete"),
  );
  if (incompleteRequiredScopes.length > 0) {
    throw new TypeError(
      `Live baseline evidence is incomplete for ${incompleteRequiredScopes
        .map((receipt) => receipt.scope)
        .join(", ")}`,
    );
  }
  for (const environment of ["dev", "prod"] as const) {
    const snapshotHash =
      normalized.inputReceipts[`${environment}SnapshotSha256`];
    if (snapshotHash === null) {
      throw new TypeError(
        `Live baseline evidence is missing the ${environment.toUpperCase()} snapshot`,
      );
    }
  }
}

function renderAssetAuditArtifact(
  report: AssetAuditReport,
  gate: AssetAuditGateResult | null,
): string {
  const normalized = JSON.parse(
    canonicalizeAssetAuditReport(report),
  ) as AssetAuditReport;
  return `${JSON.stringify(
    {
      ...normalized,
      reportSha256: hashAssetAuditReport(normalized),
      gate: gate
        ? {
            exitCode: gate.exitCode,
            outcomes: gate.outcomes,
            repositoryManifest: gate.repositoryManifest,
          }
        : {
            exitCode: 0,
            outcomes: [],
            repositoryManifest: {
              status: "NOT_EVALUATED",
              acceptedCount: 0,
              currentCount: repositoryAssetIdsFromReport(normalized).length,
              addedIds: [],
              removedIds: [],
            },
          },
      releaseManifest: {
        status: "unavailable-until-41.2",
        validated: false,
      },
    },
    null,
    "\t",
  )}\n`;
}

const ASSET_AUDIT_HELP = `Usage: bun scripts/audit-assets.ts [options]

Read-only asset inventory and accepted-debt gate.

Options:
  --offline                       Scan repository truth without CMS credentials
  --target=dev|prod|both          Select fixed live CMS target(s); default both
  --report=<path>                 Write the deterministic audit artifact
  --baseline=<path>               Read or replace the accepted-debt baseline
  --require-no-regressions        Fail on new findings in evaluated scopes
  --require-clean                 Fail on any finding or incomplete scope
  --update-baseline               Replace baseline from a complete live both-target run
  --confirm=UPDATE_ASSET_AUDIT_BASELINE
                                  Required exact confirmation for replacement
  --help                          Print this help without reads, scans, or writes`;

function safeErrorMessage(error: unknown, token?: string): string {
  let message = error instanceof Error ? error.message : String(error);
  if (token) message = message.replaceAll(token, "[REDACTED]");
  message = sanitizeAssetAuditPublicText(message).slice(0, 500);
  return message || "Asset audit failed";
}

export async function runAssetAuditCli(
  argv: readonly string[],
  dependencies: Partial<AssetAuditCliDependencies> = {},
): Promise<AssetAuditExitCode> {
  const deps = { ...defaultDependencies(), ...dependencies };
  let token: string | undefined;
  try {
    const args = parseAssetAuditArgs(argv);
    if (args.help) {
      deps.log(ASSET_AUDIT_HELP);
      return 0;
    }
    await assertDistinctOutputPaths(args.reportPath, args.baselinePath);

    let report: AssetAuditReport;
    if (args.offline) {
      report = await deps.loadOfflineReport();
    } else {
      token = deps.env.DIRECTUS_ADMIN_TOKEN;
      if (!token || token.trim() !== token || token.length === 0) {
        throw new TypeError(
          "DIRECTUS_ADMIN_TOKEN is required for live asset audit reads",
        );
      }
      report = await deps.loadLiveReport({
        targets: selectedTargets(args.target),
        token,
      });
    }

    normalizeAssetAuditReport(report, true);
    let gate: AssetAuditGateResult | null = null;
    if (args.requireNoRegressions || args.requireClean) {
      const baseline = parseAssetAuditBaseline(
        await deps.readJson(args.baselinePath),
      );
      gate = evaluateAssetAuditGate({
        report,
        baseline,
        requireNoRegressions: args.requireNoRegressions,
        requireClean: args.requireClean,
      });
    }

    await deps.writeText(
      args.reportPath,
      renderAssetAuditArtifact(report, gate),
    );

    if (args.updateBaseline) {
      assertLiveBaselineEligible(report);
      const baseline = createAssetAuditBaseline({
        report,
        generatedAt: deps.now(),
        repositoryRevision: await deps.repositoryRevision(),
      });
      await deps.writeText(
        args.baselinePath,
        canonicalizeAssetAuditBaseline(baseline),
      );
    }

    const exitCode = gate?.exitCode ?? 0;
    deps.log(
      `Asset audit ${exitCode === 0 ? "passed" : "failed"}; report: ${args.reportPath}`,
    );
    return exitCode;
  } catch (error) {
    deps.error(`Asset audit error: ${safeErrorMessage(error, token)}`);
    return 2;
  }
}

if (import.meta.main) {
  process.exitCode = await runAssetAuditCli(process.argv.slice(2));
}
