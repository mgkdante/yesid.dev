import { describe, expect, it } from "bun:test";
import { mkdtemp, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import type { Sha256Hex } from "@repo/shared";
import {
  ASSET_FINDING_CODES,
  fingerprintAssetFinding,
  reconcileAssetAudit,
  type AssetAuditReport,
  type AssetAuditScope,
  type AssetFinding,
  type GeneratedOutputExpectation,
  type OgCoverageRequirement,
} from "../scripts/lib/assets/audit";
import { hashAssetAuditReport } from "../scripts/lib/assets/report";
import type { CmsReadClient } from "../scripts/lib/assets/directus-scan";
import {
  scanRepository,
  type RepositoryScan,
} from "../scripts/lib/assets/repository-scan";
import { assetUsageDeclarations } from "../../web/src/lib/assets/usage-declarations";
import { blogPosts } from "../../web/src/lib/content/blog";
import { projects } from "../../web/src/lib/content/projects";
import { services } from "../../web/src/lib/content/services";
import { sitePages } from "../../web/src/lib/content/site-pages";
import { PUBLISHED_LOCALES } from "../../web/src/lib/utils/published-locales";

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

type Target = "dev" | "prod" | "both";
type ExitCode = 0 | 1 | 2;

interface AcceptedFinding {
  fingerprint: Sha256Hex;
  code: AssetFinding["code"];
  severity: AssetFinding["severity"];
  requiredScopes: readonly AssetAuditScope[];
}

interface AssetAuditBaseline {
  schemaVersion: 1;
  source: "live";
  generatedAt: string;
  repositoryRevision: string | null;
  scopeReceipts: AssetAuditReport["scopeReceipts"];
  reportSha256: Sha256Hex;
  repositoryAssetIds: readonly string[];
  acceptedFindings: readonly AcceptedFinding[];
  releaseManifest: {
    status: "unavailable-until-41.2";
    validated: false;
  };
}

interface ParsedAssetAuditArgs {
  offline: boolean;
  target: Target;
  reportPath: string;
  baselinePath: string;
  requireNoRegressions: boolean;
  requireClean: boolean;
  updateBaseline: boolean;
  help: boolean;
}

interface GateOutcome extends AcceptedFinding {
  status: "ACCEPTED" | "REGRESSION" | "RESOLVED" | "NOT_EVALUATED";
}

interface GateResult {
  exitCode: 0 | 1;
  outcomes: readonly GateOutcome[];
  repositoryManifest: {
    status: "EVALUATED";
    acceptedCount: number;
    currentCount: number;
    addedIds: readonly string[];
    removedIds: readonly string[];
  };
}

interface LiveReportInput {
  targets: readonly {
    environment: "dev" | "prod";
    url: string;
  }[];
  token: string;
}

interface CliDependencies {
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

interface AuditAssetsSubject {
  TARGET_URLS: Readonly<{
    dev: "https://cms.dev.yesid.dev";
    prod: "https://cms.yesid.dev";
  }>;
  DEFAULT_ASSET_AUDIT_REPORT_PATH: string;
  DEFAULT_ASSET_AUDIT_BASELINE_PATH: string;
  UPDATE_ASSET_AUDIT_BASELINE_CONFIRMATION: "UPDATE_ASSET_AUDIT_BASELINE";
  parseAssetAuditArgs(argv: readonly string[]): ParsedAssetAuditArgs;
  parseAssetAuditBaseline(value: unknown): AssetAuditBaseline;
  createAssetAuditBaseline(input: {
    report: AssetAuditReport;
    generatedAt: string;
    repositoryRevision: string | null;
  }): AssetAuditBaseline;
  buildCurrentAssetOgGraph(input: {
    repository: RepositoryScan;
    blogs?: readonly {
      slug: string;
      lang: string;
      translationKey: string;
      external: boolean;
    }[];
    projectRows?: readonly { slug: string; status: string }[];
    legalSlugs?: readonly string[];
    sitePageRows?: readonly { path: string }[];
    serviceRows?: readonly { id: string; visible: boolean }[];
    publishedLocales?: readonly string[];
  }): {
    repository: RepositoryScan;
    ogCoverage: readonly OgCoverageRequirement[];
    counts: {
      siteStaticGroups: 13;
      serviceStaticGroups: 4;
      projectRuntimeGroups: 2;
      blogRuntimeGroups: 6;
      totalGroups: 25;
      totalRows: 75;
    };
  };
  buildCurrentGeneratedOutputExpectations(
    repository: RepositoryScan,
  ): readonly GeneratedOutputExpectation[];
  createAssetAuditCmsReadClient(input: {
    url: string;
    token: string;
    fetch?: typeof fetch;
  }): CmsReadClient;
  evaluateAssetAuditGate(input: {
    report: AssetAuditReport;
    baseline: AssetAuditBaseline;
    requireNoRegressions: boolean;
    requireClean: boolean;
  }): GateResult;
  runAssetAuditCli(
    argv: readonly string[],
    dependencies?: Partial<CliDependencies>,
  ): Promise<ExitCode>;
}

let subject: AuditAssetsSubject | null = null;
let importFailure: unknown = null;
try {
  subject = (await import("../scripts/audit-assets")) as AuditAssetsSubject;
} catch (error) {
  importFailure = error;
}

function requireSubject(): AuditAssetsSubject {
  expect(importFailure).toBeNull();
  expect(subject).not.toBeNull();
  if (!subject) throw new Error("audit-assets module is unavailable");
  return subject;
}

const sha = (character: string) => character.repeat(64) as Sha256Hex;
const gitRevision = (character: string) => character.repeat(40);
const REPOSITORY_SOURCE_KINDS = new Set([
  "repository-file",
  "generated-file",
  "cms-mirror",
  "code-component",
  "external-provider",
  "external-publication",
]);
const repoRoot = resolve(import.meta.dir, "../../..");
let repositoryScanPromise: Promise<RepositoryScan> | null = null;

function currentRepositoryScan(): Promise<RepositoryScan> {
  repositoryScanPromise ??= scanRepository({
    repoRoot,
    declarations: assetUsageDeclarations,
  });
  return repositoryScanPromise;
}

function finding(
  identity: string,
  requiredScopes: readonly AssetAuditScope[] = ["repository"],
  severity: AssetFinding["severity"] = "warning",
): AssetFinding {
  const evidence = {
    semanticKey: "site.demo.image",
    consumer: identity,
    route: "/",
    locale: "en",
    slot: "hero",
    required: true,
  };
  const fingerprint = fingerprintAssetFinding({
    schemaVersion: 1,
    code: "missing-record",
    identity,
    evidence,
  });
  return {
    id: fingerprint,
    fingerprint,
    code: "missing-record",
    severity,
    identity,
    message: `Missing registry record for ${identity}`,
    evidence,
    requiredScopes,
  };
}

function report(
  findings: readonly AssetFinding[] = [],
  notEvaluated: readonly AssetAuditScope[] = [],
): AssetAuditReport {
  const unavailable = new Set(notEvaluated);
  const summary = Object.fromEntries(
    ASSET_FINDING_CODES.map((code) => {
      const matching = findings.filter((entry) => entry.code === code);
      const error = matching.filter(
        (entry) => entry.severity === "error",
      ).length;
      const warning = matching.filter(
        (entry) => entry.severity === "warning",
      ).length;
      const info = matching.filter((entry) => entry.severity === "info").length;
      return [code, { error, warning, info, total: matching.length }];
    }),
  ) as AssetAuditReport["summary"];

  return {
    schemaVersion: 1,
    inputReceipts: {
      repositorySha256: sha("1"),
      devSnapshotSha256: unavailable.has("dev-registry") ? null : sha("2"),
      prodSnapshotSha256: unavailable.has("prod-registry") ? null : sha("3"),
      generatedOutputsSha256: sha("4"),
      ogCoverageSha256: sha("5"),
      repositoryRevision: gitRevision("f"),
    },
    scopeReceipts: EXPECTED_SCOPES.map((scope) =>
      unavailable.has(scope)
        ? { scope, status: "not-evaluated", reason: "input-absent" }
        : { scope, status: "evaluated", reason: "complete" },
    ),
    summary,
    rows: [],
    discoveredUsages: [],
    findings,
  };
}

function source(
  id: string,
  overrides: Partial<AssetAuditReport["rows"][number]["sources"][number]> = {},
): AssetAuditReport["rows"][number]["sources"][number] {
  return {
    id,
    kind: "repository-file",
    environment: null,
    logicalPath: id.replace(/^repo-file:/, ""),
    fileId: null,
    sha256: sha("a"),
    bytes: 128,
    mimeType: null,
    width: null,
    height: null,
    ...overrides,
  };
}

function reportWithSources(
  sources: readonly AssetAuditReport["rows"][number]["sources"][number][],
  notEvaluated: readonly AssetAuditScope[] = [],
): AssetAuditReport {
  const base = report([], notEvaluated);
  return {
    ...base,
    rows: [
      {
        id: sha("8"),
        semanticKey: null,
        legacyPath: null,
        sha256: null,
        sources,
        usageIds: [],
      },
    ],
  };
}

function baseline(
  sourceReport: AssetAuditReport,
  acceptedFindings: readonly AssetFinding[] = sourceReport.findings,
): AssetAuditBaseline {
  return {
    schemaVersion: 1,
    source: "live",
    generatedAt: "2026-07-15T12:00:00.000Z",
    repositoryRevision: gitRevision("f"),
    scopeReceipts: sourceReport.scopeReceipts,
    reportSha256: hashAssetAuditReport(sourceReport),
    repositoryAssetIds: [
      ...new Set(
        sourceReport.rows.flatMap((row) =>
          row.sources
            .filter(
              (source) =>
                source.environment === null &&
                REPOSITORY_SOURCE_KINDS.has(source.kind),
            )
            .map((source) => source.id),
        ),
      ),
    ].sort(),
    acceptedFindings: acceptedFindings.map((entry) => ({
      fingerprint: entry.fingerprint,
      code: entry.code,
      severity: entry.severity,
      requiredScopes: entry.requiredScopes,
    })),
    releaseManifest: {
      status: "unavailable-until-41.2",
      validated: false,
    },
  };
}

function makeHarness(input: {
  baseline: AssetAuditBaseline;
  offlineReport?: AssetAuditReport;
  liveReport?: AssetAuditReport;
  env?: Readonly<Record<string, string | undefined>>;
}) {
  const calls = {
    offline: 0,
    live: [] as LiveReportInput[],
    reads: [] as string[],
    writes: [] as Array<{ path: string; contents: string }>,
    logs: [] as string[],
    errors: [] as string[],
  };
  const dependencies: CliDependencies = {
    env: input.env ?? {},
    now: () => "2026-07-15T13:00:00.000Z",
    repositoryRevision: async () => gitRevision("f"),
    loadOfflineReport: async () => {
      calls.offline += 1;
      return input.offlineReport ?? report();
    },
    loadLiveReport: async (request) => {
      calls.live.push(request);
      return input.liveReport ?? report();
    },
    readJson: async (path) => {
      calls.reads.push(path);
      return structuredClone(input.baseline);
    },
    writeText: async (path, contents) => {
      calls.writes.push({ path, contents });
    },
    log: (message) => calls.logs.push(message),
    error: (message) => calls.errors.push(message),
  };
  return { calls, dependencies };
}

describe("asset audit CLI argument contract", () => {
  it("pins the only live endpoints and the exact baseline-update confirmation", () => {
    const cli = requireSubject();
    expect(cli.TARGET_URLS).toEqual({
      dev: "https://cms.dev.yesid.dev",
      prod: "https://cms.yesid.dev",
    });
    expect(cli.UPDATE_ASSET_AUDIT_BASELINE_CONFIRMATION).toBe(
      "UPDATE_ASSET_AUDIT_BASELINE",
    );
    expect(cli.DEFAULT_ASSET_AUDIT_REPORT_PATH.replaceAll("\\", "/")).toMatch(
      /(?:^|\/)apps\/cms\/\.asset-audit\/report\.json$/,
    );
    expect(cli.DEFAULT_ASSET_AUDIT_BASELINE_PATH.replaceAll("\\", "/")).toMatch(
      /(?:^|\/)apps\/cms\/fixtures\/assets\/audit-baseline\.json$/,
    );
  });

  it("parses every supported read and gate flag without inventing a CMS URL", () => {
    const cli = requireSubject();
    expect(
      cli.parseAssetAuditArgs([
        "--offline",
        "--target=prod",
        "--report=/tmp/asset-report.json",
        "--baseline=/tmp/asset-baseline.json",
        "--require-no-regressions",
        "--require-clean",
        "--help",
      ]),
    ).toEqual({
      offline: true,
      target: "prod",
      reportPath: "/tmp/asset-report.json",
      baselinePath: "/tmp/asset-baseline.json",
      requireNoRegressions: true,
      requireClean: true,
      updateBaseline: false,
      help: true,
    });

    for (const target of ["dev", "prod", "both"] as const) {
      expect(cli.parseAssetAuditArgs([`--target=${target}`]).target).toBe(
        target,
      );
    }
    expect(cli.parseAssetAuditArgs([])).toMatchObject({
      offline: false,
      target: "both",
      reportPath: cli.DEFAULT_ASSET_AUDIT_REPORT_PATH,
      baselinePath: cli.DEFAULT_ASSET_AUDIT_BASELINE_PATH,
      requireNoRegressions: false,
      requireClean: false,
      updateBaseline: false,
      help: false,
    });
  });

  it("rejects unknown, malformed, empty, and duplicate options", () => {
    const { parseAssetAuditArgs } = requireSubject();
    expect(() => parseAssetAuditArgs(["--target=staging"])).toThrow(/target/i);
    expect(() => parseAssetAuditArgs(["--report="])).toThrow(/report/i);
    expect(() => parseAssetAuditArgs(["--baseline="])).toThrow(/baseline/i);
    expect(() => parseAssetAuditArgs(["--offline", "--offline"])).toThrow(
      /offline.*at most once|duplicate.*offline/i,
    );
    expect(() =>
      parseAssetAuditArgs(["--target=dev", "--target=prod"]),
    ).toThrow(/target.*at most once|duplicate.*target/i);
    expect(() => parseAssetAuditArgs(["--url=https://example.com"])).toThrow(
      /unknown/i,
    );
    expect(() => parseAssetAuditArgs(["--apply"])).toThrow(
      /unknown|read-only/i,
    );
    expect(() =>
      parseAssetAuditArgs([
        "--report=/tmp/a/../same.json",
        "--baseline=/tmp/same.json",
      ]),
    ).toThrow(/different/i);
  });

  it("allows baseline replacement only after the exact owner confirmation on a live run", () => {
    const { parseAssetAuditArgs } = requireSubject();
    expect(() => parseAssetAuditArgs(["--update-baseline"])).toThrow(
      /UPDATE_ASSET_AUDIT_BASELINE/,
    );
    expect(() =>
      parseAssetAuditArgs([
        "--update-baseline",
        "--confirm=update_asset_audit_baseline",
      ]),
    ).toThrow(/UPDATE_ASSET_AUDIT_BASELINE/);
    expect(() =>
      parseAssetAuditArgs(["--confirm=UPDATE_ASSET_AUDIT_BASELINE"]),
    ).toThrow(/update-baseline/i);
    expect(() =>
      parseAssetAuditArgs([
        "--offline",
        "--update-baseline",
        "--confirm=UPDATE_ASSET_AUDIT_BASELINE",
      ]),
    ).toThrow(/offline.*baseline|baseline.*offline/i);
    expect(
      parseAssetAuditArgs([
        "--target=both",
        "--update-baseline",
        "--confirm=UPDATE_ASSET_AUDIT_BASELINE",
      ]),
    ).toMatchObject({
      offline: false,
      target: "both",
      updateBaseline: true,
    });
    expect(() =>
      parseAssetAuditArgs([
        "--target=dev",
        "--update-baseline",
        "--confirm=UPDATE_ASSET_AUDIT_BASELINE",
      ]),
    ).toThrow(/target=both/i);
    expect(() =>
      parseAssetAuditArgs([
        "--require-clean",
        "--update-baseline",
        "--confirm=UPDATE_ASSET_AUDIT_BASELINE",
      ]),
    ).toThrow(/gate/i);
  });
});

describe("accepted-debt asset audit gate", () => {
  it("rejects forged current fingerprints instead of accepting stale debt", () => {
    const { evaluateAssetAuditGate } = requireSubject();
    const accepted = finding("accepted-forge-target");
    const forged = {
      ...finding("different-current-finding"),
      fingerprint: accepted.fingerprint,
      id: accepted.id,
    };

    expect(() =>
      evaluateAssetAuditGate({
        report: report([forged]),
        baseline: baseline(report([accepted]), [accepted]),
        requireNoRegressions: true,
        requireClean: false,
      }),
    ).toThrow(/fingerprint|canonical/i);
  });

  it("normalizes fingerprints before creating accepted-debt receipts", () => {
    const { createAssetAuditBaseline } = requireSubject();
    const canonical = finding("baseline-normalization");
    const stale = { ...canonical, id: sha("9"), fingerprint: sha("9") };
    const source = report([stale]);

    const created = createAssetAuditBaseline({
      report: source,
      generatedAt: "2026-07-15T12:00:00.000Z",
      repositoryRevision: gitRevision("a"),
    });

    expect(created.acceptedFindings).toHaveLength(1);
    expect(created.acceptedFindings[0]?.fingerprint).toBe(
      canonical.fingerprint,
    );
    expect(created.reportSha256).toBe(hashAssetAuditReport(source));
  });

  it("rejects duplicate or extra current scope receipts", () => {
    const { evaluateAssetAuditGate } = requireSubject();
    const source = report();
    const invalid = {
      ...source,
      scopeReceipts: [...source.scopeReceipts, source.scopeReceipts[0]!],
    };

    expect(() =>
      evaluateAssetAuditGate({
        report: invalid,
        baseline: baseline(source),
        requireNoRegressions: true,
        requireClean: false,
      }),
    ).toThrow(/scope.?receipts?/i);
  });

  it("accepts known evaluated fingerprints and fails only new evaluated findings in regression mode", () => {
    const { evaluateAssetAuditGate } = requireSubject();
    const accepted = finding("accepted");
    const regression = finding("new-regression", ["repository"], "info");
    const current = report([accepted, regression]);
    const result = evaluateAssetAuditGate({
      report: current,
      baseline: baseline(report([accepted]), [accepted]),
      requireNoRegressions: true,
      requireClean: false,
    });

    expect(result.exitCode).toBe(1);
    expect(
      result.outcomes.find(
        (entry) => entry.fingerprint === accepted.fingerprint,
      ),
    ).toMatchObject({
      status: "ACCEPTED",
      fingerprint: accepted.fingerprint,
    });
    expect(
      result.outcomes.find(
        (entry) => entry.fingerprint === regression.fingerprint,
      ),
    ).toMatchObject({
      status: "REGRESSION",
      fingerprint: regression.fingerprint,
      severity: "info",
    });
  });

  it("makes require-clean stricter than accepted debt", () => {
    const { evaluateAssetAuditGate } = requireSubject();
    const accepted = finding("accepted-clean-check");
    const sourceReport = report([accepted]);

    expect(
      evaluateAssetAuditGate({
        report: sourceReport,
        baseline: baseline(sourceReport),
        requireNoRegressions: true,
        requireClean: false,
      }).exitCode,
    ).toBe(0);
    expect(
      evaluateAssetAuditGate({
        report: sourceReport,
        baseline: baseline(sourceReport),
        requireNoRegressions: false,
        requireClean: true,
      }).exitCode,
    ).toBe(1);
  });

  it("labels unavailable live evidence NOT_EVALUATED instead of passing, failing, or resolving it", () => {
    const { evaluateAssetAuditGate } = requireSubject();
    const acceptedLiveFinding = finding("accepted-live", ["dev-registry"]);
    const newLiveFinding = finding("new-live", ["dev-files"]);
    const acceptedBaseline = baseline(report([acceptedLiveFinding]), [
      acceptedLiveFinding,
    ]);
    const offlineReport = report(
      [newLiveFinding],
      ["dev-registry", "dev-files", "dev-content"],
    );
    const result = evaluateAssetAuditGate({
      report: offlineReport,
      baseline: acceptedBaseline,
      requireNoRegressions: true,
      requireClean: true,
    });

    expect(result.exitCode).toBe(1);
    expect(
      result.outcomes.find(
        (entry) => entry.fingerprint === acceptedLiveFinding.fingerprint,
      ),
    ).toMatchObject({ status: "NOT_EVALUATED" });
    expect(
      result.outcomes.find(
        (entry) => entry.fingerprint === newLiveFinding.fingerprint,
      ),
    ).toMatchObject({ status: "NOT_EVALUATED" });
    expect(result.outcomes.some((entry) => entry.status === "REGRESSION")).toBe(
      false,
    );
    expect(result.outcomes.some((entry) => entry.status === "RESOLVED")).toBe(
      false,
    );
  });

  it("marks absent accepted debt resolved only when every required scope was evaluated", () => {
    const { evaluateAssetAuditGate } = requireSubject();
    const oldFinding = finding("resolved", ["repository", "svg-safety"]);
    const result = evaluateAssetAuditGate({
      report: report(),
      baseline: baseline(report([oldFinding]), [oldFinding]),
      requireNoRegressions: true,
      requireClean: false,
    });

    expect(result.exitCode).toBe(0);
    expect(result.outcomes).toContainEqual({
      fingerprint: oldFinding.fingerprint,
      code: oldFinding.code,
      severity: oldFinding.severity,
      requiredScopes: oldFinding.requiredScopes,
      status: "RESOLVED",
    });
  });

  it("treats a severity escalation for accepted debt as a regression", () => {
    const { evaluateAssetAuditGate } = requireSubject();
    const accepted = finding("metadata-drift", ["repository"], "info");
    const currentFinding = {
      ...accepted,
      severity: "error" as const,
    };
    const current = report([currentFinding]);
    const result = evaluateAssetAuditGate({
      report: current,
      baseline: baseline(report([accepted]), [accepted]),
      requireNoRegressions: true,
      requireClean: false,
    });

    expect(result.exitCode).toBe(1);
    expect(result.outcomes).toContainEqual({
      fingerprint: accepted.fingerprint,
      code: accepted.code,
      severity: "error",
      requiredScopes: ["repository"],
      status: "REGRESSION",
    });
  });

  it("treats widened evidence scopes as a regression even when the new scope is unavailable", () => {
    const { evaluateAssetAuditGate } = requireSubject();
    const accepted = finding("scope-drift", ["repository"], "warning");
    const currentFinding = {
      ...accepted,
      requiredScopes: ["repository", "dev-files"],
    } satisfies AssetFinding;
    const result = evaluateAssetAuditGate({
      report: report([currentFinding], ["dev-files"]),
      baseline: baseline(report([accepted]), [accepted]),
      requireNoRegressions: true,
      requireClean: false,
    });

    expect(result.exitCode).toBe(1);
    expect(result.outcomes).toContainEqual({
      fingerprint: accepted.fingerprint,
      code: accepted.code,
      severity: "warning",
      requiredScopes: ["repository", "dev-files"],
      status: "REGRESSION",
    });
  });

  it("fails a repository asset added after the approved live manifest even when CMS scopes are offline", () => {
    const { evaluateAssetAuditGate } = requireSubject();
    const repoPath = "apps/web/static/images/new-public-asset.svg";
    const sourceId = `repo-file:${repoPath}`;
    const offline = report(
      [],
      [
        "dev-registry",
        "dev-files",
        "dev-content",
        "prod-registry",
        "prod-files",
        "prod-content",
        "svg-safety",
      ],
    );
    const current: AssetAuditReport = {
      ...offline,
      rows: [
        {
          id: sha("8"),
          semanticKey: null,
          legacyPath: "images/new-public-asset.svg",
          sha256: sha("a"),
          sources: [
            {
              id: sourceId,
              kind: "repository-file",
              environment: null,
              logicalPath: repoPath,
              fileId: null,
              sha256: sha("a"),
              bytes: 128,
              mimeType: null,
              width: null,
              height: null,
            },
          ],
          usageIds: [],
        },
      ],
    };
    const approved = baseline(report());

    const result = evaluateAssetAuditGate({
      report: current,
      baseline: approved,
      requireNoRegressions: true,
      requireClean: false,
    });

    expect(result.exitCode).toBe(1);
    expect(result.outcomes).toEqual([]);
    expect(result.repositoryManifest).toEqual({
      status: "EVALUATED",
      acceptedCount: 0,
      currentCount: 1,
      addedIds: [sourceId],
      removedIds: [],
    });
  });

  it("keys the repository manifest by stable source identity, reports removals, and excludes CMS sources", () => {
    const { evaluateAssetAuditGate } = requireSubject();
    const stableId = "repo-file:apps/web/static/images/stable.webp";
    const removedId = "repo-component:apps/web/src/lib/Removed.svelte";
    const directusId = "directus-file:dev:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const acceptedReport = reportWithSources([
      source(stableId, { sha256: sha("a"), bytes: 128 }),
      source(removedId, {
        kind: "code-component",
        sha256: sha("b"),
      }),
      source(directusId, {
        kind: "directus-file",
        environment: "dev",
        logicalPath: "images/cms-only.webp",
        fileId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      }),
    ]);
    const current = reportWithSources([
      source(stableId, { sha256: sha("c"), bytes: 512 }),
    ]);

    const result = evaluateAssetAuditGate({
      report: current,
      baseline: baseline(acceptedReport),
      requireNoRegressions: true,
      requireClean: false,
    });

    expect(result.exitCode).toBe(0);
    expect(result.repositoryManifest).toEqual({
      status: "EVALUATED",
      acceptedCount: 2,
      currentCount: 1,
      addedIds: [],
      removedIds: [removedId],
    });
  });

  it("accepts a new live-tracked asset only after a confirmed baseline refresh records its source identity", () => {
    const { createAssetAuditBaseline, evaluateAssetAuditGate } =
      requireSubject();
    const newId = "repo-file:apps/web/static/images/approved-new.webp";
    const live = reportWithSources([source(newId)]);
    const oldBaseline = baseline(report());

    expect(
      evaluateAssetAuditGate({
        report: live,
        baseline: oldBaseline,
        requireNoRegressions: true,
        requireClean: false,
      }).exitCode,
    ).toBe(1);

    const refreshed = createAssetAuditBaseline({
      report: live,
      generatedAt: "2026-07-15T13:00:00.000Z",
      repositoryRevision: gitRevision("a"),
    });
    const accepted = evaluateAssetAuditGate({
      report: live,
      baseline: refreshed,
      requireNoRegressions: true,
      requireClean: true,
    });

    expect(refreshed.repositoryAssetIds).toEqual([newId]);
    expect(accepted.exitCode).toBe(0);
    expect(accepted.repositoryManifest.addedIds).toEqual([]);
  });

  it("keeps inline SVG ordinals collision-free so a new SVG in an existing component fails the gate", () => {
    const { createAssetAuditBaseline, evaluateAssetAuditGate } =
      requireSubject();
    const componentPath =
      "apps/web/src/lib/components/stack-engine/SectionIcon.svelte";
    const firstId = `repo-component:${componentPath}#svg:1`;
    const secondId = `repo-component:${componentPath}#svg:2`;
    const first = source(firstId, {
      kind: "code-component",
      logicalPath: componentPath,
    });
    const second = source(secondId, {
      kind: "code-component",
      logicalPath: componentPath,
    });
    const approvedReport = reportWithSources([first]);
    const currentReport = reportWithSources([first, second]);
    const approvedBaseline = createAssetAuditBaseline({
      report: approvedReport,
      generatedAt: "2026-07-15T13:00:00.000Z",
      repositoryRevision: gitRevision("a"),
    });

    const result = evaluateAssetAuditGate({
      report: currentReport,
      baseline: approvedBaseline,
      requireNoRegressions: true,
      requireClean: false,
    });

    expect(approvedBaseline.repositoryAssetIds).toEqual([firstId]);
    expect(result.exitCode).toBe(1);
    expect(result.repositoryManifest).toEqual({
      status: "EVALUATED",
      acceptedCount: 1,
      currentCount: 2,
      addedIds: [secondId],
      removedIds: [],
    });
  });
});

describe("asset audit baseline publication boundary", () => {
  it("rejects non-canonical keys, reasons, timestamps, and revisions", () => {
    const { parseAssetAuditBaseline } = requireSubject();
    const valid = baseline(report());
    const withExtraTopLevel = { ...valid, directusToken: "secret" };
    const withExtraReceipt = {
      ...valid,
      scopeReceipts: valid.scopeReceipts.map((receipt, index) =>
        index === 0 ? { ...receipt, responseBody: "secret" } : receipt,
      ),
    };
    const withExtraFinding = {
      ...baseline(report([finding("extra-finding-key")])),
      acceptedFindings: [
        {
          ...baseline(report([finding("extra-finding-key")]))
            .acceptedFindings[0]!,
          message: "must not be committed",
        },
      ],
    };
    const withExtraRelease = {
      ...valid,
      releaseManifest: { ...valid.releaseManifest, rows: [] },
    };
    const withBadReason = {
      ...valid,
      scopeReceipts: valid.scopeReceipts.map((receipt, index) =>
        index === 0 ? { ...receipt, reason: "token-expired" } : receipt,
      ),
    };
    const withContradiction = {
      ...valid,
      scopeReceipts: valid.scopeReceipts.map((receipt, index) =>
        index === 0
          ? { ...receipt, status: "not-evaluated", reason: "complete" }
          : receipt,
      ),
    };
    const withMissingDevRegistryMarkedComplete = {
      ...valid,
      scopeReceipts: valid.scopeReceipts.map((receipt) =>
        receipt.scope === "dev-registry"
          ? { ...receipt, status: "evaluated", reason: "registry-missing" }
          : receipt,
      ),
    };

    for (const invalid of [
      withExtraTopLevel,
      withExtraReceipt,
      withExtraFinding,
      withExtraRelease,
      withBadReason,
      withContradiction,
      withMissingDevRegistryMarkedComplete,
      { ...valid, repositoryAssetIds: undefined },
      {
        ...valid,
        repositoryAssetIds: [
          "repo-file:apps/web/static/logo.svg",
          "repo-file:apps/web/static/logo.svg",
        ],
      },
      {
        ...valid,
        repositoryAssetIds: ["repo-file:/home/operator/private.svg"],
      },
      { ...valid, repositoryAssetIds: [" repo-file:invalid"] },
      { ...valid, generatedAt: "July 15, 2026" },
      { ...valid, repositoryRevision: "fixture-revision" },
    ]) {
      expect(() => parseAssetAuditBaseline(invalid)).toThrow(
        /baseline|receipt|revision|timestamp|manifest|asset ids/i,
      );
    }
  });
});

describe("current generated OG inventory contract", () => {
  it("derives the exact 25-group/75-row graph and proves every static file binding", async () => {
    const cli = requireSubject();
    const repository = await currentRepositoryScan();
    const graph = cli.buildCurrentAssetOgGraph({ repository });

    expect(graph.counts).toEqual({
      siteStaticGroups: 13,
      serviceStaticGroups: 4,
      projectRuntimeGroups: 2,
      blogRuntimeGroups: 6,
      totalGroups: 25,
      totalRows: 75,
    });
    expect(graph.ogCoverage).toHaveLength(75);
    const staticRows = graph.ogCoverage.filter(
      (row) => row.currentRef?.kind === "repository-path",
    );
    expect(staticRows).toHaveLength(51);
    for (const row of staticRows) {
      expect(row.proofUsageId).not.toBeNull();
      const proof = graph.repository.usages.find(
        (usage) => usage.id === row.proofUsageId,
      );
      const repoPath =
        row.currentRef?.kind === "repository-path"
          ? row.currentRef.repoPath
          : null;
      const asset = graph.repository.assets.find(
        (entry) => entry.id === proof?.assetId,
      );
      expect(asset?.repoPath).toBe(repoPath);
      expect(proof).toMatchObject({
        consumerType: row.ownerType,
        consumerKey: row.ownerKey,
        route: row.route,
        locale: row.locale,
        slot: "og-image",
        deliveryMode: "og-meta",
        required: true,
      });
    }

    const groups = new Map<string, Set<string>>();
    for (const row of graph.ogCoverage) {
      const groupKey = `${row.ownerType}:${row.ownerKey}`;
      const locales = groups.get(groupKey) ?? new Set<string>();
      locales.add(`${row.locale}:${row.route}`);
      groups.set(groupKey, locales);
    }
    expect(groups.size).toBe(25);
    expect([...groups.values()].every((rows) => rows.size === 3)).toBe(true);
  });

  it("fails closed when generated route, service, project, blog, or locale truth drifts", async () => {
    const cli = requireSubject();
    const repository = await currentRepositoryScan();
    const visibleService = services.find((service) => service.visible)!;
    const publicProject = projects.find(
      (project) => project.status === "public",
    )!;
    const internalPost = blogPosts.find((post) => !post.external)!;

    const mutations = [
      { sitePageRows: [...sitePages, { path: "/new-public-page" }] },
      {
        serviceRows: services.map((service) =>
          service.id === visibleService.id
            ? { ...service, visible: false }
            : service,
        ),
      },
      {
        projectRows: projects.map((project) =>
          project.slug === publicProject.slug
            ? { ...project, status: "draft" }
            : project,
        ),
      },
      {
        blogs: blogPosts.filter((post) => post.slug !== internalPost.slug),
      },
      { publishedLocales: [...PUBLISHED_LOCALES, "de"] },
    ];

    for (const mutation of mutations) {
      expect(() =>
        cli.buildCurrentAssetOgGraph({ repository, ...mutation }),
      ).toThrow(/inventory|requires|incomplete|locale/i);
    }
  });

  it("reports a removed static card or runtime declaration as missing OG coverage", async () => {
    const cli = requireSubject();
    const repository = await currentRepositoryScan();
    const withoutStaticCard: RepositoryScan = {
      ...repository,
      assets: repository.assets.filter(
        (asset) => asset.repoPath !== "apps/web/static/og/default.en.png",
      ),
    };
    const withoutRuntimeProof: RepositoryScan = {
      ...repository,
      usages: repository.usages.filter(
        (usage) => usage.id !== "declared:site.og.runtime-project",
      ),
    };
    const withoutStaticConsumerProof: RepositoryScan = {
      ...repository,
      usages: repository.usages.filter(
        (usage) => usage.id !== "declared:site.og.localized-static",
      ),
    };

    for (const mutatedRepository of [
      withoutStaticCard,
      withoutRuntimeProof,
      withoutStaticConsumerProof,
    ]) {
      const graph = cli.buildCurrentAssetOgGraph({
        repository: mutatedRepository,
      });
      const audit = reconcileAssetAudit({
        repository: graph.repository,
        generatedOutputs: cli.buildCurrentGeneratedOutputExpectations(
          graph.repository,
        ),
        ogCoverage: graph.ogCoverage,
      });
      expect(
        audit.findings.some(
          (finding) => finding.code === "missing-og-coverage",
        ),
      ).toBe(true);
    }
  });
});

describe("live Directus read-only adapter", () => {
  it("uses GET plus a bearer header on fixed endpoints with explicit pagination", async () => {
    const cli = requireSubject();
    const calls: Array<{ url: URL; init: RequestInit }> = [];
    const fakeFetch = (async (
      input: string | URL | Request,
      init?: RequestInit,
    ) => {
      calls.push({
        url: input instanceof URL ? input : new URL(String(input)),
        init: init ?? {},
      });
      return new Response(JSON.stringify({ data: [{ id: "row-1" }] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as typeof fetch;
    const client = cli.createAssetAuditCmsReadClient({
      url: cli.TARGET_URLS.dev,
      token: "static-token",
      fetch: fakeFetch,
    });

    expect(await client.readRegistryCollections!()).toEqual({
      status: 200,
      data: [{ id: "row-1" }],
    });
    expect(
      await client.readPage({
        surface: "directus_files",
        fields: ["id", "filename_disk"],
        sort: ["id"],
        limit: 100,
        offset: 200,
      }),
    ).toEqual({ status: 200, data: [{ id: "row-1" }] });
    await client.readPage({
      surface: "directus_folders",
      fields: ["id"],
      sort: ["id"],
      limit: 100,
      offset: 0,
    });
    await client.readPage({
      surface: "asset_records",
      fields: ["id", "semantic_key"],
      sort: ["id"],
      limit: 100,
      offset: 0,
    });
    await client.readSingleton({
      surface: "directus_settings.storage_asset_presets",
      fields: ["storage_asset_presets"],
    });
    await client.readSingleton({
      surface: "site_meta",
      fields: ["id"],
    });

    expect(calls.map((call) => call.url.pathname)).toEqual([
      "/collections",
      "/files",
      "/folders",
      "/items/asset_records",
      "/settings",
      "/items/site_meta",
    ]);
    expect(calls[0]!.url.searchParams.get("fields")).toBe("collection");
    expect(calls[1]!.url.searchParams.get("fields")).toBe("id,filename_disk");
    expect(calls[1]!.url.searchParams.get("sort")).toBe("id");
    expect(calls[1]!.url.searchParams.get("limit")).toBe("100");
    expect(calls[1]!.url.searchParams.get("offset")).toBe("200");
    for (const call of calls) {
      const headers = new Headers(call.init.headers);
      expect(call.init.method).toBe("GET");
      expect(call.init.body).toBeUndefined();
      expect(call.init.redirect).toBe("error");
      expect(call.init.signal).toBeInstanceOf(AbortSignal);
      expect(headers.get("authorization")).toBe("Bearer static-token");
      expect(call.url.search).not.toContain("static-token");
      expect(call.url.pathname).not.toMatch(/login|auth/i);
    }
  });

  it("streams asset bytes under a hard cap and rejects oversized responses", async () => {
    const cli = requireSubject();
    const responses = [
      new Response(new Uint8Array([1, 2, 3]), {
        status: 200,
        headers: { "content-length": "3" },
      }),
      new Response(new Uint8Array([1, 2, 3, 4]), {
        status: 200,
        headers: { "content-length": "4" },
      }),
    ];
    const urls: URL[] = [];
    const client = cli.createAssetAuditCmsReadClient({
      url: cli.TARGET_URLS.prod,
      token: "static-token",
      fetch: (async (input) => {
        urls.push(input instanceof URL ? input : new URL(String(input)));
        return responses.shift()!;
      }) as typeof fetch,
    });

    const accepted = await client.readAsset("file/with spaces", 3);
    expect(new Uint8Array(accepted.bytes!)).toEqual(new Uint8Array([1, 2, 3]));
    expect(await client.readAsset("too-large", 3)).toEqual({
      status: 413,
      bytes: null,
    });
    expect(urls.map((url) => url.pathname)).toEqual([
      "/assets/file%2Fwith%20spaces",
      "/assets/too-large",
    ]);
  });

  it("rejects alternate targets and blank or whitespace bearer tokens", () => {
    const cli = requireSubject();
    for (const input of [
      { url: "https://attacker.example.com", token: "token" },
      { url: cli.TARGET_URLS.dev, token: "" },
      { url: cli.TARGET_URLS.dev, token: " token " },
    ]) {
      expect(() => cli.createAssetAuditCmsReadClient(input)).toThrow(
        /target|token/i,
      );
    }
  });
});

describe("asset audit CLI orchestration", () => {
  it("prints help and exits zero without reading, scanning, or writing", async () => {
    const cli = requireSubject();
    const sourceReport = report();
    const { calls, dependencies } = makeHarness({
      baseline: baseline(sourceReport),
      offlineReport: sourceReport,
      liveReport: sourceReport,
    });

    expect(await cli.runAssetAuditCli(["--help"], dependencies)).toBe(0);
    expect(calls.offline).toBe(0);
    expect(calls.live).toEqual([]);
    expect(calls.reads).toEqual([]);
    expect(calls.writes).toEqual([]);
    expect(calls.logs.join("\n")).toContain("--offline");
    expect(calls.logs.join("\n")).toContain("--update-baseline");
  });

  it("runs the hybrid offline gate with zero token, reader, or network use", async () => {
    const cli = requireSubject();
    const repositoryFinding = finding("offline-repository");
    const current = report(
      [repositoryFinding],
      [
        "dev-registry",
        "dev-files",
        "dev-content",
        "prod-registry",
        "prod-files",
        "prod-content",
      ],
    );
    const { calls, dependencies } = makeHarness({
      baseline: baseline(current, [repositoryFinding]),
      offlineReport: current,
      env: new Proxy(
        {
          DIRECTUS_ADMIN_EMAIL: "must-not-be-used@example.com",
          DIRECTUS_ADMIN_PASSWORD: "must-not-be-used",
        },
        {
          get(target, property, receiver) {
            if (property === "DIRECTUS_ADMIN_TOKEN") {
              throw new Error("offline asset audit accessed the admin token");
            }
            return Reflect.get(target, property, receiver);
          },
        },
      ),
    });
    let fetchCalls = 0;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => {
      fetchCalls += 1;
      throw new Error("offline asset audit must not use fetch");
    }) as unknown as typeof fetch;
    try {
      expect(
        await cli.runAssetAuditCli(
          ["--offline", "--require-no-regressions"],
          dependencies,
        ),
      ).toBe(0);
    } finally {
      globalThis.fetch = originalFetch;
    }

    expect(fetchCalls).toBe(0);
    expect(calls.offline).toBe(1);
    expect(calls.live).toEqual([]);
    expect(calls.reads).toEqual([cli.DEFAULT_ASSET_AUDIT_BASELINE_PATH]);
    expect(calls.writes).toHaveLength(1);
    expect(calls.writes[0]?.path).toBe(cli.DEFAULT_ASSET_AUDIT_REPORT_PATH);
    expect(calls.writes[0]?.contents).toContain('"schemaVersion": 1');
  });

  it("requires only a static admin token for live reads and never falls back to password login", async () => {
    const cli = requireSubject();
    const sourceReport = report();
    const missingToken = makeHarness({
      baseline: baseline(sourceReport),
      liveReport: sourceReport,
      env: {
        DIRECTUS_ADMIN_EMAIL: "login-fallback-is-forbidden@example.com",
        DIRECTUS_ADMIN_PASSWORD: "forbidden-password",
      },
    });
    expect(
      await cli.runAssetAuditCli(["--target=dev"], missingToken.dependencies),
    ).toBe(2);
    expect(missingToken.calls.live).toEqual([]);
    expect(missingToken.calls.errors.join("\n")).toMatch(
      /DIRECTUS_ADMIN_TOKEN.*required/i,
    );

    const staticToken = makeHarness({
      baseline: baseline(sourceReport),
      liveReport: sourceReport,
      env: {
        DIRECTUS_ADMIN_TOKEN: "static-admin-token",
        DIRECTUS_ADMIN_EMAIL: "ignored@example.com",
        DIRECTUS_ADMIN_PASSWORD: "ignored-password",
        PUBLIC_DIRECTUS_URL: "https://attacker.example.com",
      },
    });
    expect(
      await cli.runAssetAuditCli(["--target=both"], staticToken.dependencies),
    ).toBe(0);
    expect(staticToken.calls.live).toEqual([
      {
        targets: [
          { environment: "dev", url: cli.TARGET_URLS.dev },
          { environment: "prod", url: cli.TARGET_URLS.prod },
        ],
        token: "static-admin-token",
      },
    ]);
  });

  it("maps gate failures to 1 and input, auth, or baseline failures to 2", async () => {
    const cli = requireSubject();
    const regression = finding("cli-regression");
    const gateHarness = makeHarness({
      baseline: baseline(report()),
      offlineReport: report([regression]),
    });
    expect(
      await cli.runAssetAuditCli(
        ["--offline", "--require-no-regressions"],
        gateHarness.dependencies,
      ),
    ).toBe(1);
    expect(gateHarness.calls.writes).toHaveLength(1);

    const inputHarness = makeHarness({ baseline: baseline(report()) });
    expect(
      await cli.runAssetAuditCli(
        ["--target=invalid"],
        inputHarness.dependencies,
      ),
    ).toBe(2);
    expect(inputHarness.calls.offline).toBe(0);
    expect(inputHarness.calls.live).toEqual([]);

    const secretArgHarness = makeHarness({ baseline: baseline(report()) });
    expect(
      await cli.runAssetAuditCli(
        ["--token=argument-secret"],
        secretArgHarness.dependencies,
      ),
    ).toBe(2);
    expect(secretArgHarness.calls.errors.join("\n")).not.toContain(
      "argument-secret",
    );

    const malformedBaseline = makeHarness({ baseline: baseline(report()) });
    malformedBaseline.dependencies.readJson = async () => ({
      schemaVersion: 1,
      source: "offline",
      releaseManifest: { status: "validated", validated: true },
    });
    expect(
      await cli.runAssetAuditCli(
        ["--offline", "--require-no-regressions"],
        malformedBaseline.dependencies,
      ),
    ).toBe(2);
    expect(malformedBaseline.calls.errors.join("\n")).toMatch(/baseline/i);

    const incompleteClean = makeHarness({
      baseline: baseline(report()),
      offlineReport: report([], ["dev-files"]),
    });
    expect(
      await cli.runAssetAuditCli(
        ["--offline", "--require-clean"],
        incompleteClean.dependencies,
      ),
    ).toBe(1);
  });

  it("refuses baseline replacement when either live snapshot is incomplete or the DEV registry is missing", async () => {
    const cli = requireSubject();
    for (const [scope, reason] of [
      ["dev-registry", "registry-missing"],
      ["dev-registry", "registry-forbidden"],
      ["prod-files", "request-failed"],
      ["prod-content", "response-invalid"],
    ] as const) {
      const live = report();
      const incomplete: AssetAuditReport = {
        ...live,
        scopeReceipts: live.scopeReceipts.map((receipt) =>
          receipt.scope === scope
            ? { ...receipt, status: "not-evaluated", reason }
            : receipt,
        ),
      };
      const { calls, dependencies } = makeHarness({
        baseline: baseline(report()),
        liveReport: incomplete,
        env: { DIRECTUS_ADMIN_TOKEN: "static-token" },
      });

      expect(
        await cli.runAssetAuditCli(
          [
            "--target=both",
            "--report=/tmp/incomplete-live-report.json",
            "--baseline=/tmp/must-not-change.json",
            "--update-baseline",
            "--confirm=UPDATE_ASSET_AUDIT_BASELINE",
          ],
          dependencies,
        ),
      ).toBe(2);
      expect(calls.writes.map((write) => write.path)).toEqual([
        "/tmp/incomplete-live-report.json",
      ]);
      expect(calls.errors.join("\n")).toMatch(/incomplete/i);
    }
  });

  it("never replaces the baseline after a report write failure", async () => {
    const cli = requireSubject();
    const sourceReport = report();
    const { calls, dependencies } = makeHarness({
      baseline: baseline(sourceReport),
      liveReport: sourceReport,
      env: { DIRECTUS_ADMIN_TOKEN: "static-token" },
    });
    dependencies.writeText = async (path) => {
      calls.writes.push({ path, contents: "" });
      throw new Error("disk full");
    };

    expect(
      await cli.runAssetAuditCli(
        [
          "--target=both",
          "--report=/tmp/report-write-fails.json",
          "--baseline=/tmp/baseline-must-not-change.json",
          "--update-baseline",
          "--confirm=UPDATE_ASSET_AUDIT_BASELINE",
        ],
        dependencies,
      ),
    ).toBe(2);
    expect(calls.writes.map((write) => write.path)).toEqual([
      "/tmp/report-write-fails.json",
    ]);
  });

  it("maps loader failures to 2 without leaking a bearer token", async () => {
    const cli = requireSubject();
    const sourceReport = report();
    const { calls, dependencies } = makeHarness({
      baseline: baseline(sourceReport),
      env: { DIRECTUS_ADMIN_TOKEN: "super-secret-token" },
    });
    dependencies.loadLiveReport = async () => {
      throw new Error("request failed for super-secret-token: private body");
    };

    expect(await cli.runAssetAuditCli(["--target=dev"], dependencies)).toBe(2);
    expect(calls.errors.join("\n")).not.toContain("super-secret-token");
    expect(calls.errors.join("\n")).toContain("[REDACTED]");
    expect(calls.writes).toEqual([]);
  });

  it("uses only the selected explicit report and baseline paths", async () => {
    const cli = requireSubject();
    const sourceReport = report();
    const { calls, dependencies } = makeHarness({
      baseline: baseline(sourceReport),
      offlineReport: sourceReport,
    });
    expect(
      await cli.runAssetAuditCli(
        [
          "--offline",
          "--report=/tmp/explicit-asset-report.json",
          "--baseline=/tmp/explicit-asset-baseline.json",
          "--require-no-regressions",
        ],
        dependencies,
      ),
    ).toBe(0);
    expect(calls.reads).toEqual(["/tmp/explicit-asset-baseline.json"]);
    expect(calls.writes.map((entry) => entry.path)).toEqual([
      "/tmp/explicit-asset-report.json",
    ]);
  });

  it("rejects existing report and baseline paths that alias the same file", async () => {
    const cli = requireSubject();
    const sourceReport = report();
    const { calls, dependencies } = makeHarness({
      baseline: baseline(sourceReport),
      offlineReport: sourceReport,
    });
    const directory = await mkdtemp(resolve(tmpdir(), "asset-audit-alias-"));
    const baselinePath = resolve(directory, "baseline.json");
    const reportAlias = resolve(directory, "report.json");
    try {
      await Bun.write(baselinePath, "{}\n");
      await symlink(baselinePath, reportAlias);
      expect(
        await cli.runAssetAuditCli(
          [
            "--offline",
            `--report=${reportAlias}`,
            `--baseline=${baselinePath}`,
          ],
          dependencies,
        ),
      ).toBe(2);
      expect(calls.offline).toBe(0);
      expect(calls.writes).toEqual([]);
      expect(calls.errors.join("\n")).toMatch(/path|same|alias|different/i);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("writes a deterministic live-origin baseline with the release manifest explicitly unavailable", async () => {
    const cli = requireSubject();
    const acceptedB = finding("baseline-b", ["prod-registry"], "info");
    const acceptedA = finding("baseline-a", ["repository"], "error");
    const live = report([acceptedB, acceptedA]);
    const { calls, dependencies } = makeHarness({
      baseline: baseline(report()),
      liveReport: live,
      env: { DIRECTUS_ADMIN_TOKEN: "static-admin-token" },
    });

    expect(
      await cli.runAssetAuditCli(
        [
          "--target=both",
          "--report=/tmp/live-report.json",
          "--baseline=/tmp/live-baseline.json",
          "--update-baseline",
          "--confirm=UPDATE_ASSET_AUDIT_BASELINE",
        ],
        dependencies,
      ),
    ).toBe(0);
    expect(calls.reads).toEqual([]);
    expect(calls.writes.map((entry) => entry.path)).toEqual([
      "/tmp/live-report.json",
      "/tmp/live-baseline.json",
    ]);

    const written = JSON.parse(calls.writes[1]!.contents) as AssetAuditBaseline;
    expect(written).toMatchObject({
      schemaVersion: 1,
      source: "live",
      generatedAt: "2026-07-15T13:00:00.000Z",
      repositoryRevision: gitRevision("f"),
      reportSha256: hashAssetAuditReport(live),
      releaseManifest: {
        status: "unavailable-until-41.2",
        validated: false,
      },
    });
    expect(written.scopeReceipts).toEqual(live.scopeReceipts);
    expect(written.acceptedFindings).toEqual(
      [acceptedA, acceptedB]
        .map((entry) => ({
          fingerprint: entry.fingerprint,
          code: entry.code,
          severity: entry.severity,
          requiredScopes: entry.requiredScopes,
        }))
        .sort((left, right) =>
          Buffer.compare(
            Buffer.from(left.fingerprint, "utf8"),
            Buffer.from(right.fingerprint, "utf8"),
          ),
        ),
    );
  });
});
