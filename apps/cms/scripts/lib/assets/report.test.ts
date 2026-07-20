import { describe, expect, it } from "bun:test";
import { createHash } from "node:crypto";
import type { Sha256Hex } from "@repo/shared";
import {
  canonicalizeAssetAuditReport,
  hashAssetAuditReport,
  renderAssetAuditTable,
} from "./report";
import {
  ASSET_FINDING_EVIDENCE_POLICY,
  ASSET_FINDING_CODES,
  fingerprintAssetFinding,
  projectAssetFindingEvidence,
  type AssetAuditReport,
  type AssetAuditScope,
  type AssetFinding,
} from "./audit";

const EXPECTED_FINDING_CODES = [
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
] as const;

const EXPECTED_SCOPES = [
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

const SECRET_SENTINEL = "asset-audit-secret-sentinel";
const ABSOLUTE_PATH_SENTINEL = "/home/example/private/asset.png";
const WINDOWS_ABSOLUTE_PATH_SENTINEL = "C:\\Users\\example\\private\\asset.png";
const URL_USER_SENTINEL = "asset-audit-user";
const URL_PASSWORD_SENTINEL = "asset-audit-password";
const URL_TOKEN_A = "asset-audit-access-token-alpha";
const URL_TOKEN_B = "asset-audit-access-token-bravo";
const BEARER_TOKEN_A = "asset-audit-bearer-token-alpha";
const BEARER_TOKEN_B = "asset-audit-bearer-token-bravo";
const FRAGMENT_SENTINEL = "asset-audit-private-fragment";
const SECRET_URL_A = `https://${URL_USER_SENTINEL}:${URL_PASSWORD_SENTINEL}@cdn.example.com/assets/demo.png?width=1200&access_token=${URL_TOKEN_A}#${FRAGMENT_SENTINEL}`;
const SECRET_URL_B = `https://different-user:different-password@cdn.example.com/assets/demo.png?width=1200&access_token=${URL_TOKEN_B}#different-fragment`;
const SANITIZED_URL = "https://cdn.example.com/assets/demo.png?width=1200";
const UUID_A = "11111111-1111-4111-8111-111111111111";
const UUID_B = "22222222-2222-4222-8222-222222222222";

const sha = (character: string) => character.repeat(64) as Sha256Hex;

function compareUtf8(left: string, right: string): number {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));
}

function expectRecursivelySortedObjectKeys(value: unknown): void {
  if (Array.isArray(value)) {
    for (const item of value) expectRecursivelySortedObjectKeys(item);
    return;
  }
  if (!value || typeof value !== "object") return;
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record);
  expect(keys).toEqual([...keys].sort(compareUtf8));
  for (const child of Object.values(record))
    expectRecursivelySortedObjectKeys(child);
}

function expectExactlyOneTrailingLf(value: string): void {
  expect(value).not.toContain("\r");
  expect(value.match(/\n+$/)?.[0]).toBe("\n");
}

function makeFinding(input: {
  code: AssetFinding["code"];
  severity: AssetFinding["severity"];
  identity: string;
  message: string;
  route?: string;
  requiredScopes: readonly AssetAuditScope[];
  includePrivateEvidence?: boolean;
}): AssetFinding {
  const evidence: Record<string, unknown> =
    input.code === "missing-record"
      ? {
          semanticKey: "site.hero.image",
          consumer: input.message,
          route: input.route ?? "/",
          locale: "fr",
          slot: "hero",
          required: true,
        }
      : {};
  if (input.includePrivateEvidence) {
    evidence.authorization = SECRET_SENTINEL;
    evidence.absolutePath = ABSOLUTE_PATH_SENTINEL;
    evidence.sourceLine = 987;
    evidence.versionId = UUID_A;
  }
  const fingerprint = fingerprintAssetFinding({
    schemaVersion: 1,
    code: input.code,
    identity: input.identity,
    evidence,
  });
  return {
    id: fingerprint,
    fingerprint,
    code: input.code,
    severity: input.severity,
    identity: input.identity,
    message: input.message,
    evidence,
    requiredScopes: input.requiredScopes,
  };
}

function makeFindingWithEvidence(input: {
  code: AssetFinding["code"];
  severity: AssetFinding["severity"];
  identity: string;
  message: string;
  evidence: Readonly<Record<string, unknown>>;
  requiredScopes: readonly AssetAuditScope[];
}): AssetFinding {
  const fingerprint = fingerprintAssetFinding({
    schemaVersion: 1,
    code: input.code,
    identity: input.identity,
    evidence: input.evidence,
  });
  return {
    id: fingerprint,
    fingerprint,
    ...input,
  };
}

function findingSummary(
  findings: readonly AssetFinding[],
  reverseKeys: boolean,
): AssetAuditReport["summary"] {
  const codes = reverseKeys
    ? [...EXPECTED_FINDING_CODES].reverse()
    : [...EXPECTED_FINDING_CODES];
  return Object.fromEntries(
    codes.map((code) => {
      const matches = findings.filter((finding) => finding.code === code);
      const error = matches.filter(
        (finding) => finding.severity === "error",
      ).length;
      const warning = matches.filter(
        (finding) => finding.severity === "warning",
      ).length;
      const info = matches.filter(
        (finding) => finding.severity === "info",
      ).length;
      return [code, { error, warning, info, total: matches.length }];
    }),
  ) as AssetAuditReport["summary"];
}

function scopeReceipts(reverse: boolean): AssetAuditReport["scopeReceipts"] {
  const receipts = EXPECTED_SCOPES.map((scope) => {
    if (scope === "repository" || scope === "generated-outputs") {
      return {
        scope,
        status: "evaluated" as const,
        reason: "complete" as const,
      };
    }
    if (scope === "svg-safety") {
      return {
        scope,
        status: "not-evaluated" as const,
        reason: "supplemental-evidence-missing" as const,
      };
    }
    return {
      scope,
      status: "not-evaluated" as const,
      reason: "input-absent" as const,
    };
  });
  return reverse ? receipts.reverse() : receipts;
}

function makeReport(options: {
  reverse: boolean;
  empty?: boolean;
  privateEvidence?: boolean;
}): AssetAuditReport {
  const accent = options.reverse ? "cafe\u0301" : "café";
  const requiredScopes = (scopes: readonly AssetAuditScope[]) =>
    options.reverse ? [...scopes].reverse() : [...scopes];
  const findings = options.empty
    ? []
    : [
        makeFinding({
          code: "missing-record",
          severity: "error",
          identity: "site.hero.image:alpha",
          message: `missing-alpha-one-${accent}`,
          route: "/alpha",
          requiredScopes: requiredScopes(["repository", "dev-registry"]),
          includePrivateEvidence: options.privateEvidence,
        }),
        makeFinding({
          code: "missing-record",
          severity: "error",
          identity: "site.hero.image:alpha",
          message: "missing-alpha-two",
          route: "/beta",
          requiredScopes: requiredScopes(["repository", "dev-registry"]),
        }),
        makeFinding({
          code: "missing-record",
          severity: "error",
          identity: "site.hero.image:zulu",
          message: "missing-zulu",
          requiredScopes: requiredScopes(["repository", "dev-registry"]),
        }),
        makeFinding({
          code: "unsafe-svg",
          severity: "error",
          identity: "svg:zulu",
          message: "unsafe-zulu",
          requiredScopes: requiredScopes(["repository", "svg-safety"]),
        }),
        makeFinding({
          code: "unused-record",
          severity: "warning",
          identity: "record:alpha",
          message: "unused-alpha",
          requiredScopes: requiredScopes([
            "repository",
            "dev-registry",
            "dev-content",
          ]),
        }),
        makeFinding({
          code: "missing-og-coverage",
          severity: "info",
          identity: "og:alpha",
          message: "og-alpha",
          requiredScopes: requiredScopes(["repository", "og-coverage"]),
        }),
      ];
  if (options.reverse) findings.reverse();

  const logicalPath = `images/${accent}.webp`;
  const sources: Array<AssetAuditReport["rows"][number]["sources"][number]> = [
    {
      id: `repo-file:apps/web/static/${logicalPath}`,
      kind: "repository-file",
      environment: null,
      logicalPath: `apps/web/static/${logicalPath}`,
      fileId: null,
      sha256: sha("c"),
      bytes: 42,
      mimeType: "image/webp",
      width: 1200,
      height: 630,
    },
    {
      id: `directus-file:dev:${UUID_A}`,
      kind: "directus-file",
      environment: "dev",
      logicalPath,
      fileId: UUID_A,
      sha256: sha("c"),
      bytes: 42,
      mimeType: "image/webp",
      width: 1200,
      height: 630,
    },
  ];
  const usageIds = [sha("f"), sha("e")];
  if (options.reverse) {
    sources.reverse();
    usageIds.reverse();
  }
  const rowWithSources: AssetAuditReport["rows"][number] = {
    id: sha("2"),
    semanticKey: null,
    legacyPath: logicalPath,
    sha256: sha("c"),
    sources,
    usageIds,
  };
  const rows: Array<AssetAuditReport["rows"][number]> = [
    rowWithSources,
    {
      id: sha("1"),
      semanticKey: null,
      legacyPath: "images/alpha.webp",
      sha256: sha("b"),
      sources: [],
      usageIds: [],
    },
  ];
  if (!options.reverse) rows.reverse();

  const discoveredUsages: Array<AssetAuditReport["discoveredUsages"][number]> =
    [
      {
        id: sha("b"),
        evidenceUsageId: "exact:zulu",
        environment: "dev",
        syncEligible: false,
        assetRecordId: null,
        resolvedVersionId: null,
        semanticKey: null,
        unresolvedRef: "repository:images/zulu.webp",
        confidence: "exact-static",
        consumerType: "component",
        consumerKey: "zulu",
        sourceKind: "repository",
        sourceFile: "apps/web/src/lib/Zulu.svelte",
        sourceLine: 20,
        cmsField: null,
        route: "/zulu",
        locale: "en",
        slot: "hero",
        required: true,
        deliveryMode: "local-img",
        altTextOverride: null,
        altSource: null,
      },
      {
        id: sha("a"),
        evidenceUsageId: "exact:alpha",
        environment: "dev",
        syncEligible: false,
        assetRecordId: null,
        resolvedVersionId: null,
        semanticKey: null,
        unresolvedRef: `repository:images/${accent}.webp`,
        confidence: "resolved-generated",
        consumerType: "component",
        consumerKey: "alpha",
        sourceKind: "repository",
        sourceFile: "apps/web/src/lib/Alpha.svelte",
        sourceLine: 10,
        cmsField: null,
        route: "/alpha",
        locale: "fr",
        slot: "hero",
        required: false,
        deliveryMode: "local-img",
        altTextOverride: accent,
        altSource: "literal",
      },
    ];
  if (!options.reverse) discoveredUsages.reverse();

  const inputReceipts = options.reverse
    ? {
        repositoryRevision: `revision\r\n${accent}`,
        ogCoverageSha256: sha("5"),
        generatedOutputsSha256: sha("4"),
        prodSnapshotSha256: null,
        devSnapshotSha256: null,
        repositorySha256: sha("3"),
      }
    : {
        repositorySha256: sha("3"),
        devSnapshotSha256: null,
        prodSnapshotSha256: null,
        generatedOutputsSha256: sha("4"),
        ogCoverageSha256: sha("5"),
        repositoryRevision: `revision\n${accent}`,
      };

  const report = {
    schemaVersion: 1,
    inputReceipts,
    scopeReceipts: scopeReceipts(options.reverse),
    summary: findingSummary(findings, options.reverse),
    rows,
    discoveredUsages,
    findings,
  } as AssetAuditReport;
  Object.assign(report as unknown as Record<string, unknown>, {
    authorization: SECRET_SENTINEL,
    absolutePath: ABSOLUTE_PATH_SENTINEL,
  });
  return report;
}

const SEVERITY_ORDER: Readonly<Record<AssetFinding["severity"], number>> = {
  error: 0,
  warning: 1,
  info: 2,
};

function sortFindings(findings: readonly AssetFinding[]): AssetFinding[] {
  return [...findings].sort(
    (left, right) =>
      SEVERITY_ORDER[left.severity] - SEVERITY_ORDER[right.severity] ||
      EXPECTED_FINDING_CODES.indexOf(left.code) -
        EXPECTED_FINDING_CODES.indexOf(right.code) ||
      compareUtf8(
        left.identity.normalize("NFC"),
        right.identity.normalize("NFC"),
      ) ||
      compareUtf8(left.id, right.id),
  );
}

describe("asset audit report rendering", () => {
  it("redacts secrets and host paths from every public free-text report field", () => {
    const report = makeReport({ reverse: false });
    const mutable = report as unknown as {
      inputReceipts: Record<string, string | null>;
      rows: Array<{
        id: string;
        semanticKey: string | null;
        legacyPath: string | null;
        sha256: string | null;
        sources: Array<Record<string, unknown>>;
        usageIds: string[];
      }>;
      discoveredUsages: Array<Record<string, unknown>>;
      findings: Array<Record<string, unknown>>;
    };

    for (const key of [
      "repositorySha256",
      "devSnapshotSha256",
      "prodSnapshotSha256",
      "generatedOutputsSha256",
      "ogCoverageSha256",
      "repositoryRevision",
    ]) {
      mutable.inputReceipts[key] = SECRET_URL_A;
    }

    const row = mutable.rows.find((candidate) => candidate.sources.length > 0)!;
    row.id = SECRET_URL_A;
    row.semanticKey = SECRET_URL_A;
    row.legacyPath = ABSOLUTE_PATH_SENTINEL;
    row.sha256 = SECRET_URL_A;
    row.usageIds = [SECRET_URL_A];
    Object.assign(row.sources[0]!, {
      id: SECRET_URL_A,
      logicalPath: WINDOWS_ABSOLUTE_PATH_SENTINEL,
      fileId: SECRET_URL_A,
      sha256: SECRET_URL_A,
      mimeType: SECRET_URL_A,
    });

    Object.assign(mutable.discoveredUsages[0]!, {
      id: SECRET_URL_A,
      evidenceUsageId: SECRET_URL_A,
      assetRecordId: SECRET_URL_A,
      resolvedVersionId: SECRET_URL_A,
      semanticKey: SECRET_URL_A,
      unresolvedRef: SECRET_URL_A,
      consumerKey: SECRET_URL_A,
      sourceFile: ABSOLUTE_PATH_SENTINEL,
      cmsField: SECRET_URL_A,
      route: SECRET_URL_A,
      locale: SECRET_URL_A,
      slot: SECRET_URL_A,
      altTextOverride: SECRET_URL_A,
      altSource: SECRET_URL_A,
    });

    Object.assign(mutable.findings[0]!, {
      id: SECRET_URL_A,
      fingerprint: SECRET_URL_A,
      identity: SECRET_URL_A,
      message: `Authorization: Bearer ${BEARER_TOKEN_A}; source ${ABSOLUTE_PATH_SENTINEL}; asset ${SECRET_URL_A}`,
    });

    const outputs = [
      canonicalizeAssetAuditReport(report),
      renderAssetAuditTable(report),
    ];
    for (const output of outputs) {
      for (const secret of [
        URL_USER_SENTINEL,
        URL_PASSWORD_SENTINEL,
        URL_TOKEN_A,
        BEARER_TOKEN_A,
        FRAGMENT_SENTINEL,
        ABSOLUTE_PATH_SENTINEL,
        WINDOWS_ABSOLUTE_PATH_SENTINEL,
      ]) {
        expect(output).not.toContain(secret);
      }
      expect(output).toContain(SANITIZED_URL);
      expect(output).toContain("[redacted:credential]");
      expect(output).toContain("[redacted:absolute-path]");
    }
  });

  it("redacts embedded local credentials, file URIs, and colon-delimited host paths", () => {
    const report = makeReport({ reverse: false });
    const localToken = "embedded-local-access-token";
    const embeddedLocalRef =
      `/images/demo.png?width=1200&access_token=${localToken}&format=webp` +
      "#private-fragment";
    const fileUri = "file:///home/example/private/from-file-uri.png";
    const colonPosix = "source:/home/example/private/from-colon.png";
    const colonWindows = "source:C:\\Users\\example\\private\\from-colon.png";
    const mutable = report as unknown as {
      inputReceipts: { repositoryRevision: string | null };
      findings: Array<{ message: string }>;
    };
    const sentence =
      `Asset ${embeddedLocalRef} failed; ${fileUri}; ${colonPosix}; ` +
      `${colonWindows}; safe route /work remains.`;
    mutable.inputReceipts.repositoryRevision = sentence;
    mutable.findings[0]!.message = sentence;

    const outputs = [
      canonicalizeAssetAuditReport(report),
      renderAssetAuditTable(report),
    ];
    for (const output of outputs) {
      expect(output).not.toContain(localToken);
      expect(output).not.toContain("private-fragment");
      expect(output).not.toContain("/home/example/private/from-file-uri.png");
      expect(output).not.toContain("/home/example/private/from-colon.png");
      expect(output).not.toContain(
        "C:\\\\Users\\\\example\\\\private\\\\from-colon.png",
      );
      expect(output).toContain(
        "/images/demo.png?format=webp&amp;width=1200".replace("&amp;", "&"),
      );
      expect(output).toContain("[redacted:absolute-path]");
      expect(output).toContain("safe route /work remains");
    }
  });

  it("preserves semantic identities, local paths, and non-secret URLs exactly", () => {
    const report = makeReport({ reverse: false });
    const safeExternalUrl =
      "https://cdn.example.com/assets/demo.png?width=1200&format=webp";
    const safeWebPath = "/images/demo.png?width=1200&format=webp";
    const safeRepoPath = "apps/web/static/images/demo.png";
    const safeLegacyPath = "images/demo.png";
    const safeRoute = "/work";
    const safeIdentity = "site.hero.image:alpha#approved";
    const mutable = report as unknown as {
      inputReceipts: { repositoryRevision: string | null };
      rows: Array<{ legacyPath: string | null }>;
      discoveredUsages: Array<{
        unresolvedRef: string | null;
        sourceFile: string;
        route: string | null;
      }>;
      findings: Array<{ identity: string; message: string }>;
    };

    mutable.inputReceipts.repositoryRevision = safeExternalUrl;
    mutable.rows[0]!.legacyPath = safeLegacyPath;
    mutable.discoveredUsages[0]!.unresolvedRef = safeWebPath;
    mutable.discoveredUsages[0]!.sourceFile = safeRepoPath;
    mutable.discoveredUsages[0]!.route = safeRoute;
    mutable.findings[0]!.identity = safeIdentity;
    mutable.findings[0]!.message = `Asset ${safeExternalUrl} is approved.`;

    const canonical = canonicalizeAssetAuditReport(report);
    expect(canonical).toContain(safeExternalUrl);
    expect(canonical).toContain(safeWebPath);
    expect(canonical).toContain(safeRepoPath);
    expect(canonical).toContain(safeLegacyPath);
    expect(canonical).toContain(safeRoute);
    expect(canonical).toContain(safeIdentity);
  });

  it("preserves validated repository media anchors without letting embedded secrets affect report identity", () => {
    const build = (token: string): AssetAuditReport => {
      const report = makeReport({ reverse: false, empty: true });
      const template = report.discoveredUsages[0]!;
      const secretAnchor =
        `apps/web/src/lib/Dynamic.svelte#img-src:/images/hero.png?` +
        `width=1200&access_token=${token}`;
      return {
        ...report,
        discoveredUsages: [
          {
            ...template,
            id: sha("8"),
            evidenceUsageId: `unresolved:${secretAnchor}:first`,
            sourceFile: secretAnchor,
          },
          {
            ...template,
            id: sha("9"),
            evidenceUsageId:
              "unresolved:apps/web/src/lib/Dynamic.svelte#img-src:unrelatedImage:second",
            sourceFile:
              "apps/web/src/lib/Dynamic.svelte#img-src:unrelatedImage",
          },
        ],
      };
    };
    const first = build("repository-anchor-token-alpha");
    const second = build("repository-anchor-token-bravo");

    expect(canonicalizeAssetAuditReport(second)).toBe(
      canonicalizeAssetAuditReport(first),
    );
    expect(hashAssetAuditReport(second)).toBe(hashAssetAuditReport(first));
    const canonical = JSON.parse(
      canonicalizeAssetAuditReport(first),
    ) as AssetAuditReport;
    expect(
      canonical.discoveredUsages.map((usage) => usage.sourceFile).sort(),
    ).toEqual([
      "apps/web/src/lib/Dynamic.svelte#img-src:/images/hero.png?width=1200",
      "apps/web/src/lib/Dynamic.svelte#img-src:unrelatedImage",
    ]);
  });

  it("makes canonical reports and hashes independent of secret values and incoming finding digests", () => {
    const buildVariant = (input: {
      secretUrl: string;
      bearerToken: string;
      absolutePath: string;
      incomingDigest: Sha256Hex;
    }): AssetAuditReport => {
      const report = makeReport({ reverse: false, empty: true });
      const finding: AssetFinding = {
        id: input.incomingDigest,
        fingerprint: input.incomingDigest,
        code: "unresolved-dynamic-usage",
        severity: "warning",
        identity: input.secretUrl,
        message: `Authorization: Bearer ${input.bearerToken}; source ${input.absolutePath}; asset ${input.secretUrl}`,
        evidence: {
          unresolvedRef: input.secretUrl,
          confidence: "unknown",
          declarationState: "missing",
        },
        requiredScopes: ["repository"],
      };
      return {
        ...report,
        summary: findingSummary([finding], false),
        findings: [finding],
      };
    };
    const firstIncomingDigest = sha("6");
    const secondIncomingDigest = sha("7");
    const first = buildVariant({
      secretUrl: SECRET_URL_A,
      bearerToken: BEARER_TOKEN_A,
      absolutePath: ABSOLUTE_PATH_SENTINEL,
      incomingDigest: firstIncomingDigest,
    });
    const second = buildVariant({
      secretUrl: SECRET_URL_B,
      bearerToken: BEARER_TOKEN_B,
      absolutePath: WINDOWS_ABSOLUTE_PATH_SENTINEL,
      incomingDigest: secondIncomingDigest,
    });

    const firstCanonical = canonicalizeAssetAuditReport(first);
    const secondCanonical = canonicalizeAssetAuditReport(second);
    expect(secondCanonical).toBe(firstCanonical);
    expect(hashAssetAuditReport(second)).toBe(hashAssetAuditReport(first));
    expect(firstCanonical).not.toContain(firstIncomingDigest);
    expect(secondCanonical).not.toContain(secondIncomingDigest);

    const [finding] = (JSON.parse(firstCanonical) as AssetAuditReport).findings;
    expect(finding?.id).toBe(finding?.fingerprint);
    expect(finding?.identity).toBe(SANITIZED_URL);
    expect(finding?.message).toBe(
      `Authorization: [redacted:credential]; source [redacted:absolute-path]; asset ${SANITIZED_URL}`,
    );
    expect(finding?.evidence).toEqual({
      confidence: "unknown",
      declarationState: "missing",
      unresolvedRef: SANITIZED_URL,
    });
  });

  it("redacts every approved evidence string recursively before fingerprinting", () => {
    for (const code of EXPECTED_FINDING_CODES) {
      const policy = ASSET_FINDING_EVIDENCE_POLICY[code];
      const buildEvidence = (
        secretUrl: string,
        bearerToken: string,
        absolutePath: string,
      ): Readonly<Record<string, unknown>> =>
        Object.fromEntries(
          policy.keys.map((key) => [
            key,
            key === "orderedCandidates"
              ? [secretUrl, "site.default.og", secretUrl]
              : {
                  authorization: `Authorization: Bearer ${bearerToken}`,
                  location: absolutePath,
                  nested: [
                    secretUrl,
                    { candidate: secretUrl, identity: "site.hero.image:alpha" },
                  ],
                },
          ]),
        );
      const firstEvidence = buildEvidence(
        SECRET_URL_A,
        BEARER_TOKEN_A,
        ABSOLUTE_PATH_SENTINEL,
      );
      const secondEvidence = buildEvidence(
        SECRET_URL_B,
        BEARER_TOKEN_B,
        WINDOWS_ABSOLUTE_PATH_SENTINEL,
      );
      const projected = projectAssetFindingEvidence(code, firstEvidence);
      const serialized = JSON.stringify(projected);

      for (const secret of [
        URL_USER_SENTINEL,
        URL_PASSWORD_SENTINEL,
        URL_TOKEN_A,
        BEARER_TOKEN_A,
        FRAGMENT_SENTINEL,
        ABSOLUTE_PATH_SENTINEL,
      ]) {
        expect(serialized).not.toContain(secret);
      }
      expect(serialized).toContain(SANITIZED_URL);
      expect(
        fingerprintAssetFinding({
          schemaVersion: 1,
          code,
          identity: SECRET_URL_A,
          evidence: firstEvidence,
        }),
      ).toBe(
        fingerprintAssetFinding({
          schemaVersion: 1,
          code,
          identity: SECRET_URL_B,
          evidence: secondEvidence,
        }),
      );

      if (code === "missing-og-coverage") {
        expect(projected.orderedCandidates).toEqual([
          SANITIZED_URL,
          "site.default.og",
          SANITIZED_URL,
        ]);
      }
    }

    const evidence = { semanticKey: "site.hero.image" };
    expect(
      fingerprintAssetFinding({
        schemaVersion: 1,
        code: "missing-record",
        identity: "site.hero.image:alpha",
        evidence,
      }),
    ).not.toBe(
      fingerprintAssetFinding({
        schemaVersion: 1,
        code: "missing-record",
        identity: "site.hero.image:beta",
        evidence,
      }),
    );
  });

  it("sanitizes nested evidence keys before fingerprinting and report hashing", () => {
    const buildVariant = (privateKey: string): AssetAuditReport => {
      const evidence = {
        differingFields: ["metadata"],
        dev: { [privateKey]: "same" },
        prod: {},
      };
      const finding = makeFindingWithEvidence({
        code: "environment-drift",
        severity: "error",
        identity: "asset:nested-key",
        message: "nested key drift",
        evidence,
        requiredScopes: ["dev-registry", "prod-registry"],
      });
      return {
        ...makeReport({ reverse: false, empty: true }),
        summary: findingSummary([finding], false),
        findings: [finding],
      };
    };
    const first = buildVariant("/home/first/private.png");
    const second = buildVariant("/home/second/private.png");
    const firstCanonical = canonicalizeAssetAuditReport(first);
    const secondCanonical = canonicalizeAssetAuditReport(second);

    expect(secondCanonical).toBe(firstCanonical);
    expect(hashAssetAuditReport(second)).toBe(hashAssetAuditReport(first));
    const [finding] = (JSON.parse(firstCanonical) as AssetAuditReport).findings;
    expect(finding?.evidence).toEqual({
      dev: { "[redacted:absolute-path]": "same" },
      differingFields: ["metadata"],
      prod: {},
    });
  });

  it("rejects nested evidence keys that collide after public sanitization", () => {
    expect(() =>
      projectAssetFindingEvidence("environment-drift", {
        differingFields: ["metadata"],
        dev: {
          "/home/first/private.png": "first",
          "/home/second/private.png": "second",
        },
        prod: {},
      }),
    ).toThrow(/canonical asset audit key collision/i);
  });

  it("canonicalizes recursive keys and every domain array independently of caller order", () => {
    const forward = makeReport({ reverse: false });
    const reversed = makeReport({ reverse: true });
    const canonical = canonicalizeAssetAuditReport(forward);

    expect(canonicalizeAssetAuditReport(reversed)).toBe(canonical);
    expect(hashAssetAuditReport(forward)).toBe(hashAssetAuditReport(reversed));
    expect(hashAssetAuditReport(forward)).toBe(
      createHash("sha256").update(canonical).digest("hex") as Sha256Hex,
    );
    expectExactlyOneTrailingLf(canonical);

    const parsed = JSON.parse(canonical) as AssetAuditReport;
    expectRecursivelySortedObjectKeys(parsed);
    expect(parsed.rows.map((row) => row.id)).toEqual([sha("1"), sha("2")]);
    expect(parsed.rows[1]?.sources.map((source) => source.id)).toEqual([
      `directus-file:dev:${UUID_A}`,
      "repo-file:apps/web/static/images/café.webp",
    ]);
    expect(parsed.rows[1]?.usageIds).toEqual([sha("e"), sha("f")]);
    expect(parsed.discoveredUsages.map((usage) => usage.id)).toEqual([
      sha("a"),
      sha("b"),
    ]);
    expect(parsed.findings.map((finding) => finding.id)).toEqual(
      sortFindings(forward.findings).map((finding) => finding.id),
    );
    for (const finding of parsed.findings) {
      expect(finding.requiredScopes).toEqual(
        [...new Set(finding.requiredScopes)].sort(
          (left, right) =>
            EXPECTED_SCOPES.indexOf(left) - EXPECTED_SCOPES.indexOf(right),
        ),
      );
    }
  });

  it("normalizes fingerprint text and ignores source-line, UUID, secret, and absolute-path churn", () => {
    const identity = `site.hero.image:${sha("a")}`;
    const first = fingerprintAssetFinding({
      schemaVersion: 1,
      code: "missing-record",
      identity,
      evidence: {
        semanticKey: "site.hero.image",
        consumer: "component:hero",
        route: "/cafe\u0301",
        locale: "fr",
        slot: "hero",
        required: true,
        sourceLine: 10,
        versionId: UUID_A,
        authorization: SECRET_SENTINEL,
        absolutePath: ABSOLUTE_PATH_SENTINEL,
      },
    });
    const second = fingerprintAssetFinding({
      schemaVersion: 1,
      code: "missing-record",
      identity,
      evidence: {
        required: true,
        slot: "hero",
        locale: "fr",
        route: "/café",
        consumer: "component:hero",
        semanticKey: "site.hero.image",
        sourceLine: 999,
        versionId: UUID_B,
        authorization: "different-secret",
        absolutePath: "/different/absolute/path.png",
      },
    });
    const expectedBytes = `${JSON.stringify({
      code: "missing-record",
      evidence: {
        consumer: "component:hero",
        locale: "fr",
        required: true,
        route: "/café",
        semanticKey: "site.hero.image",
        slot: "hero",
      },
      identity,
      schemaVersion: 1,
    })}\n`;

    expect(first).toBe(second);
    expect(first).toBe(
      createHash("sha256").update(expectedBytes).digest("hex") as Sha256Hex,
    );
    expect(first).toMatch(/^[0-9a-f]{64}$/);
  });

  it("retains all fifteen zero summary keys and every scope receipt in canonical order", () => {
    expect(ASSET_FINDING_CODES).toEqual(EXPECTED_FINDING_CODES);
    const parsed = JSON.parse(
      canonicalizeAssetAuditReport(makeReport({ reverse: true, empty: true })),
    ) as AssetAuditReport;

    expect(Object.keys(parsed.summary).sort(compareUtf8)).toEqual(
      [...EXPECTED_FINDING_CODES].sort(compareUtf8),
    );
    for (const code of EXPECTED_FINDING_CODES) {
      expect(parsed.summary[code]).toEqual({
        error: 0,
        warning: 0,
        info: 0,
        total: 0,
      });
    }
    expect(parsed.scopeReceipts.map((receipt) => receipt.scope)).toEqual([
      ...EXPECTED_SCOPES,
    ]);
  });

  it("renders a deterministic ANSI-free table with every finding in exact report order", () => {
    const forward = makeReport({ reverse: false });
    const reversed = makeReport({ reverse: true });
    const table = renderAssetAuditTable(forward);

    expect(renderAssetAuditTable(reversed)).toBe(table);
    expectExactlyOneTrailingLf(table);
    expect(table).not.toMatch(/\u001b\[[0-?]*[ -/]*[@-~]/);
    let previousIndex = -1;
    for (const finding of sortFindings(forward.findings)) {
      const index = table.indexOf(finding.message.normalize("NFC"));
      expect(index).toBeGreaterThan(previousIndex);
      previousIndex = index;
    }
  });

  it("projects only public report and closed finding-evidence fields", () => {
    const report = makeReport({
      reverse: false,
      privateEvidence: true,
    });
    const outputs = [
      canonicalizeAssetAuditReport(report),
      renderAssetAuditTable(report),
    ];

    for (const output of outputs) {
      expect(output).not.toContain(SECRET_SENTINEL);
      expect(output).not.toContain(ABSOLUTE_PATH_SENTINEL);
      expect(output).not.toContain("authorization");
      expect(output).not.toContain("absolutePath");
    }
  });

  it("uses the shared evidence projection and recursively canonicalizes unordered nested arrays", () => {
    const buildReport = (
      driftEvidence: Readonly<Record<string, unknown>>,
    ): AssetAuditReport => {
      const findings = [
        makeFindingWithEvidence({
          code: "environment-drift",
          severity: "error",
          identity: "asset:environment-drift",
          message: "environment drift",
          evidence: driftEvidence,
          requiredScopes: ["dev-registry", "prod-registry"],
        }),
        makeFindingWithEvidence({
          code: "missing-og-coverage",
          severity: "warning",
          identity: "route:/work",
          message: "missing OG coverage",
          evidence: {
            route: "/work",
            locale: "en",
            owner: "route:work",
            orderedCandidates: [
              "route.work.og.primary",
              "site.default.og",
              "route.work.og.primary",
            ],
            proofState: "missing",
            fallbackState: "available",
          },
          requiredScopes: ["repository", "og-coverage"],
        }),
      ];
      return {
        ...makeReport({ reverse: false, empty: true }),
        summary: findingSummary(findings, false),
        findings,
      };
    };

    const forward = buildReport({
      differingFields: ["tags", "mimeType", "tags"],
      dev: {
        tags: ["zulu", "alpha", "zulu"],
        metadata: { formats: ["webp", "avif", "webp"] },
      },
      prod: {
        tags: ["alpha", "zulu", "alpha"],
        metadata: { formats: ["avif", "webp", "avif"] },
      },
    });
    const shuffled = buildReport({
      differingFields: ["mimeType", "tags"],
      dev: {
        metadata: { formats: ["avif", "webp"] },
        tags: ["alpha", "zulu"],
      },
      prod: {
        metadata: { formats: ["webp", "avif"] },
        tags: ["zulu", "alpha"],
      },
    });

    const canonical = canonicalizeAssetAuditReport(forward);
    expect(canonicalizeAssetAuditReport(shuffled)).toBe(canonical);
    const parsed = JSON.parse(canonical) as AssetAuditReport;
    for (const finding of parsed.findings) {
      const source = forward.findings.find(
        (candidate) => candidate.code === finding.code,
      );
      expect(source).toBeDefined();
      expect(finding.evidence).toEqual(
        projectAssetFindingEvidence(finding.code, source?.evidence ?? {}),
      );
    }

    const drift = parsed.findings.find(
      (finding) => finding.code === "environment-drift",
    );
    expect(drift?.evidence).toEqual({
      dev: {
        metadata: { formats: ["avif", "webp"] },
        tags: ["alpha", "zulu"],
      },
      differingFields: ["mimeType", "tags"],
      prod: {
        metadata: { formats: ["avif", "webp"] },
        tags: ["alpha", "zulu"],
      },
    });

    const og = parsed.findings.find(
      (finding) => finding.code === "missing-og-coverage",
    );
    expect(og?.evidence.orderedCandidates).toEqual([
      "route.work.og.primary",
      "site.default.og",
      "route.work.og.primary",
    ]);
  });

  it("rejects missing or duplicate canonical scope receipts", () => {
    const complete = makeReport({ reverse: false, empty: true });
    const missing: AssetAuditReport = {
      ...complete,
      scopeReceipts: complete.scopeReceipts.filter(
        (receipt) => receipt.scope !== "repository",
      ),
    };
    const duplicate: AssetAuditReport = {
      ...complete,
      scopeReceipts: [complete.scopeReceipts[0]!, ...complete.scopeReceipts],
    };

    expect(() => canonicalizeAssetAuditReport(missing)).toThrow(
      /exactly one.*repository/i,
    );
    expect(() => canonicalizeAssetAuditReport(duplicate)).toThrow(
      /exactly one.*repository/i,
    );
    expect(() => renderAssetAuditTable(missing)).toThrow(
      /exactly one.*repository/i,
    );
    expect(() => renderAssetAuditTable(duplicate)).toThrow(
      /exactly one.*repository/i,
    );
  });
});
