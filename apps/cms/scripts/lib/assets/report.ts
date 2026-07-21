import { createHash } from "node:crypto";
import type { Sha256Hex } from "@repo/shared";
import {
  ASSET_FINDING_CODES,
  fingerprintAssetFinding,
  projectAssetFindingEvidence,
  sanitizeAssetAuditPublicText,
  type AssetAuditReport,
  type AssetAuditScope,
  type AssetFinding,
} from "./audit";

const ASSET_AUDIT_SCOPES = [
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
] as const satisfies readonly AssetAuditScope[];

const ANSI_PATTERN = /\u001b\[[0-?]*[ -/]*[@-~]/g;
const SEVERITY_ORDER: Readonly<Record<AssetFinding["severity"], number>> = {
  error: 0,
  warning: 1,
  info: 2,
};

function compareUtf8(left: string, right: string): number {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));
}

function normalizeText(value: string): string {
  return sanitizeAssetAuditPublicText(value);
}

function normalizedNullable<T extends string>(value: T | null): T | null {
  return value === null ? null : (normalizeText(value) as T);
}

function compareNullable(left: string | null, right: string | null): number {
  if (left === right) return 0;
  if (left === null) return -1;
  if (right === null) return 1;
  return compareUtf8(left, right);
}

function canonicalValue(value: unknown): unknown {
  if (typeof value === "string") return normalizeText(value);
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    const entries = Object.entries(record)
      .map(([key, child]) => ({
        key: normalizeText(key),
        originalKey: key,
        child,
      }))
      .sort(
        (left, right) =>
          compareUtf8(left.key, right.key) ||
          compareUtf8(left.originalKey, right.originalKey),
      );
    for (const entry of entries) {
      if (Object.hasOwn(result, entry.key))
        throw new TypeError(
          `Canonical asset audit key collision: ${JSON.stringify(entry.key)}`,
        );
      result[entry.key] = canonicalValue(entry.child);
    }
    return result;
  }
  return value;
}

function sortScopes(scopes: readonly AssetAuditScope[]): AssetAuditScope[] {
  const present = new Set(scopes);
  return ASSET_AUDIT_SCOPES.filter((scope) => present.has(scope));
}

function projectFinding(finding: AssetFinding): AssetFinding {
  const identity = normalizeText(finding.identity);
  const evidence = projectAssetFindingEvidence(finding.code, finding.evidence);
  const fingerprint = fingerprintAssetFinding({
    schemaVersion: 1,
    code: finding.code,
    identity,
    evidence,
  });
  return {
    id: fingerprint,
    fingerprint,
    code: finding.code,
    severity: finding.severity,
    identity,
    message: normalizeText(finding.message),
    evidence,
    requiredScopes: sortScopes(finding.requiredScopes),
  };
}

function projectScopeReceipts(
  receipts: AssetAuditReport["scopeReceipts"],
): AssetAuditReport["scopeReceipts"] {
  const projected = ASSET_AUDIT_SCOPES.map((scope) => {
    const matches = receipts.filter((receipt) => receipt.scope === scope);
    if (matches.length !== 1) {
      throw new TypeError(
        `Asset audit scopeReceipts must contain exactly one receipt for ${scope}; received ${matches.length}`,
      );
    }
    const receipt = matches[0]!;
    return {
      scope: receipt.scope,
      status: receipt.status,
      reason: receipt.reason,
    };
  });
  if (receipts.length !== ASSET_AUDIT_SCOPES.length) {
    throw new TypeError(
      `Asset audit scopeReceipts must contain only the ${ASSET_AUDIT_SCOPES.length} canonical scopes`,
    );
  }
  return projected;
}

function findingCompare(left: AssetFinding, right: AssetFinding): number {
  return (
    SEVERITY_ORDER[left.severity] - SEVERITY_ORDER[right.severity] ||
    ASSET_FINDING_CODES.indexOf(left.code) -
      ASSET_FINDING_CODES.indexOf(right.code) ||
    compareUtf8(left.identity, right.identity) ||
    compareUtf8(left.id, right.id)
  );
}

function projectReport(report: AssetAuditReport): AssetAuditReport {
  if (report.schemaVersion !== 1)
    throw new TypeError("Asset audit report schemaVersion must be 1");

  const scopeReceipts = projectScopeReceipts(report.scopeReceipts);
  const summary = Object.fromEntries(
    ASSET_FINDING_CODES.map((code) => {
      const count = report.summary[code];
      return [
        code,
        {
          error: count?.error ?? 0,
          warning: count?.warning ?? 0,
          info: count?.info ?? 0,
          total: count?.total ?? 0,
        },
      ];
    }),
  ) as AssetAuditReport["summary"];

  const rows = report.rows
    .map((row) => ({
      id: normalizeText(row.id),
      semanticKey: normalizedNullable(row.semanticKey),
      legacyPath: normalizedNullable(row.legacyPath),
      sha256:
        row.sha256 === null ? null : (normalizeText(row.sha256) as Sha256Hex),
      sources: row.sources
        .map((source) => ({
          id: normalizeText(source.id),
          kind: source.kind,
          environment: source.environment,
          logicalPath: normalizedNullable(source.logicalPath),
          fileId: normalizedNullable(source.fileId),
          sha256:
            source.sha256 === null
              ? null
              : (normalizeText(source.sha256) as Sha256Hex),
          bytes: source.bytes,
          mimeType: normalizedNullable(source.mimeType),
          width: source.width,
          height: source.height,
        }))
        .sort(
          (left, right) =>
            compareUtf8(left.kind, right.kind) ||
            compareNullable(left.environment, right.environment) ||
            compareNullable(left.logicalPath, right.logicalPath) ||
            compareNullable(left.fileId, right.fileId) ||
            compareUtf8(left.id, right.id),
        ),
      usageIds: [...new Set(row.usageIds.map(normalizeText))].sort(
        compareUtf8,
      ) as Sha256Hex[],
    }))
    .sort((left, right) => compareUtf8(left.id, right.id));

  const discoveredUsages = report.discoveredUsages
    .map((usage) => ({
      id: normalizeText(usage.id) as Sha256Hex,
      evidenceUsageId: normalizeText(usage.evidenceUsageId),
      environment: usage.environment,
      syncEligible: usage.syncEligible,
      assetRecordId: normalizedNullable(usage.assetRecordId),
      resolvedVersionId: normalizedNullable(usage.resolvedVersionId),
      semanticKey: normalizedNullable(usage.semanticKey),
      unresolvedRef: normalizedNullable(usage.unresolvedRef),
      confidence: usage.confidence,
      consumerType: usage.consumerType,
      consumerKey: normalizeText(usage.consumerKey),
      sourceKind: usage.sourceKind,
      sourceFile: normalizeText(usage.sourceFile),
      sourceLine: usage.sourceLine,
      cmsField: normalizedNullable(usage.cmsField),
      route: normalizedNullable(usage.route),
      locale: normalizedNullable(usage.locale),
      slot: normalizeText(usage.slot),
      required: usage.required,
      deliveryMode: usage.deliveryMode,
      altTextOverride: normalizedNullable(usage.altTextOverride),
      altSource: normalizedNullable(usage.altSource),
    }))
    .sort((left, right) => compareUtf8(left.id, right.id));

  return {
    schemaVersion: 1,
    inputReceipts: {
      repositorySha256: normalizeText(
        report.inputReceipts.repositorySha256,
      ) as Sha256Hex,
      devSnapshotSha256:
        report.inputReceipts.devSnapshotSha256 === null
          ? null
          : (normalizeText(
              report.inputReceipts.devSnapshotSha256,
            ) as Sha256Hex),
      prodSnapshotSha256:
        report.inputReceipts.prodSnapshotSha256 === null
          ? null
          : (normalizeText(
              report.inputReceipts.prodSnapshotSha256,
            ) as Sha256Hex),
      generatedOutputsSha256: normalizeText(
        report.inputReceipts.generatedOutputsSha256,
      ) as Sha256Hex,
      ogCoverageSha256: normalizeText(
        report.inputReceipts.ogCoverageSha256,
      ) as Sha256Hex,
      repositoryRevision: normalizedNullable(
        report.inputReceipts.repositoryRevision,
      ),
    },
    scopeReceipts,
    summary,
    rows,
    discoveredUsages,
    findings: report.findings.map(projectFinding).sort(findingCompare),
  };
}

export function canonicalizeAssetAuditReport(report: AssetAuditReport): string {
  return `${JSON.stringify(canonicalValue(projectReport(report)), null, "\t")}\n`;
}

export function hashAssetAuditReport(report: AssetAuditReport): Sha256Hex {
  return createHash("sha256")
    .update(canonicalizeAssetAuditReport(report))
    .digest("hex") as Sha256Hex;
}

function tableCell(value: string | number | boolean | null): string {
  if (value === null) return "";
  return normalizeText(String(value))
    .replace(ANSI_PATTERN, "")
    .replaceAll("\\", "\\\\")
    .replaceAll("|", "\\|")
    .replaceAll("\n", "<br>");
}

export function renderAssetAuditTable(report: AssetAuditReport): string {
  const projected = projectReport(report);
  const lines = [
    "| Scope | Status | Reason |",
    "| --- | --- | --- |",
    ...projected.scopeReceipts.map(
      (receipt) =>
        `| ${tableCell(receipt.scope)} | ${tableCell(receipt.status)} | ${tableCell(receipt.reason)} |`,
    ),
    "",
    "| Finding code | Error | Warning | Info | Total |",
    "| --- | ---: | ---: | ---: | ---: |",
    ...ASSET_FINDING_CODES.map((code) => {
      const count = projected.summary[code];
      return `| ${tableCell(code)} | ${count.error} | ${count.warning} | ${count.info} | ${count.total} |`;
    }),
    "",
    "| Severity | Code | Identity | Message | Required scopes | Fingerprint |",
    "| --- | --- | --- | --- | --- | --- |",
  ];

  if (projected.findings.length === 0) {
    lines.push("|  |  |  | No findings |  |  |");
  } else {
    for (const finding of projected.findings) {
      lines.push(
        `| ${tableCell(finding.severity)} | ${tableCell(finding.code)} | ${tableCell(finding.identity)} | ${tableCell(finding.message)} | ${tableCell(finding.requiredScopes.join(", "))} | ${tableCell(finding.fingerprint)} |`,
      );
    }
  }

  return `${lines.join("\n")}\n`;
}
