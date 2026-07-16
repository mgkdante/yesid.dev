import { describe, expect, it } from "bun:test";
import type { Sha256Hex } from "@repo/shared";
import {
  ASSET_FINDING_CODES,
  type AssetAuditReport,
  type AssetAuditScope,
  type DiscoveredAssetUsage,
} from "../scripts/lib/assets/audit";
import type { NormalizedStoredUsage } from "../scripts/lib/assets/directus-scan";

type ExitCode = 0 | 2;
type SyncMode = "dry-run" | "apply";

interface ParsedAssetUsageSyncArgs {
  mode: SyncMode;
}

interface AssetUsageCreatePayload {
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

type AssetUsageUpdatePayload = Omit<AssetUsageCreatePayload, "id">;

type AssetUsageSyncAction =
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

interface AssetUsageSyncPlan {
  manifestSha256: Sha256Hex;
  scanRunId: string;
  observationTime: string;
  actions: readonly AssetUsageSyncAction[];
}

interface AssetUsageSyncHttpClient {
  readStoredUsages(): Promise<readonly NormalizedStoredUsage[]>;
  applyAction(action: AssetUsageSyncAction): Promise<void>;
}

interface SyncReadInput {
  url: string;
  token: string;
}

interface SyncWriteInput extends SyncReadInput {
  action: AssetUsageSyncAction;
}

interface SyncCliDependencies {
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

interface SyncAssetUsagesSubject {
  DEV_ASSET_USAGE_SYNC_URL: "https://cms.dev.yesid.dev";
  parseAssetUsageSyncArgs(
    argv: readonly string[],
  ): ParsedAssetUsageSyncArgs;
  buildAssetUsageSyncPlan(input: {
    report: AssetAuditReport;
    storedUsages: readonly NormalizedStoredUsage[];
    observationTime: string;
  }): AssetUsageSyncPlan;
  hashAssetUsageManifest(report: AssetAuditReport): Sha256Hex;
  createAssetUsageSyncHttpClient(input: {
    url: string;
    token: string;
    fetch?: typeof fetch;
  }): AssetUsageSyncHttpClient;
  runAssetUsageSyncCli(
    argv: readonly string[],
    dependencies?: Partial<SyncCliDependencies>,
  ): Promise<ExitCode>;
}

let subject: SyncAssetUsagesSubject | null = null;
let importFailure: unknown = null;
try {
  subject = (await import("../scripts/sync-asset-usages")) as SyncAssetUsagesSubject;
} catch (error) {
  importFailure = error;
}

function requireSubject(): SyncAssetUsagesSubject {
  expect(importFailure).toBeNull();
  expect(subject).not.toBeNull();
  if (!subject) throw new Error("sync-asset-usages module is unavailable");
  return subject;
}

const sha = (character: string) => character.repeat(64) as Sha256Hex;
const OBSERVED_AT = "2026-07-15T16:00:00.000Z";
const EARLIER_AT = "2026-07-14T12:00:00.000Z";
const LATER_AT = "2026-07-15T17:00:00.000Z";
const RECORD_ID = "11111111-1111-4111-8111-111111111111";
const VERSION_ID = "22222222-2222-4222-8222-222222222222";
const REQUIRED_SYNC_SCOPES = new Set<AssetAuditScope>([
  "repository",
  "dev-registry",
  "dev-files",
  "dev-content",
]);
const ALL_SCOPES = [
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

function usage(
  idCharacter: string,
  overrides: Partial<DiscoveredAssetUsage> = {},
): DiscoveredAssetUsage {
  return {
    id: sha(idCharacter),
    evidenceUsageId: `repository:static/demo-${idCharacter}.png`,
    environment: "dev",
    syncEligible: true,
    assetRecordId: RECORD_ID,
    resolvedVersionId: VERSION_ID,
    semanticKey: null,
    unresolvedRef: null,
    confidence: "exact-static",
    consumerType: "route",
    consumerKey: `route-${idCharacter}`,
    sourceKind: "repository",
    sourceFile: `apps/web/static/demo-${idCharacter}.png`,
    sourceLine: 7,
    cmsField: null,
    route: `/demo-${idCharacter}`,
    locale: "en",
    slot: "hero",
    required: true,
    deliveryMode: "local-img",
    altTextOverride: null,
    altSource: "route-copy",
    ...overrides,
  };
}

function report(
  discoveredUsages: readonly DiscoveredAssetUsage[] = [],
  notEvaluated: readonly AssetAuditScope[] = [],
): AssetAuditReport {
  const unavailable = new Set(notEvaluated);
  const summary = Object.fromEntries(
    ASSET_FINDING_CODES.map((code) => [
      code,
      { error: 0, warning: 0, info: 0, total: 0 },
    ]),
  ) as AssetAuditReport["summary"];
  return {
    schemaVersion: 1,
    inputReceipts: {
      repositorySha256: sha("1"),
      devSnapshotSha256: unavailable.has("dev-registry") ? null : sha("2"),
      prodSnapshotSha256: null,
      generatedOutputsSha256: sha("3"),
      ogCoverageSha256: sha("4"),
      repositoryRevision: "f".repeat(40),
    },
    scopeReceipts: ALL_SCOPES.map((scope) =>
      unavailable.has(scope)
        ? { scope, status: "not-evaluated", reason: "request-failed" }
        : { scope, status: "evaluated", reason: "complete" },
    ),
    summary,
    rows: [],
    discoveredUsages,
    findings: [],
  };
}

function expectedCreatePayload(
  discovered: DiscoveredAssetUsage,
  sourceReport: AssetAuditReport,
  firstSeen = OBSERVED_AT,
  lastSeen = OBSERVED_AT,
): AssetUsageCreatePayload {
  const manifestSha256 = requireSubject().hashAssetUsageManifest(sourceReport);
  return {
    id: discovered.id,
    asset_record: discovered.assetRecordId,
    resolved_version: discovered.resolvedVersionId,
    unresolved_ref: discovered.unresolvedRef,
    scan_run_id: `asset-audit:${manifestSha256}`,
    last_seen_manifest_sha256: manifestSha256,
    confidence: discovered.confidence,
    consumer_type: discovered.consumerType,
    consumer_key: discovered.consumerKey,
    source_kind: discovered.sourceKind,
    source_file: discovered.sourceFile,
    cms_field: discovered.cmsField,
    source_line: discovered.sourceLine,
    route: discovered.route,
    locale: discovered.locale as NormalizedStoredUsage["locale"],
    slot: discovered.slot,
    required: discovered.required,
    delivery_mode: discovered.deliveryMode,
    alt_text_override: discovered.altTextOverride,
    alt_source: discovered.altSource,
    active: true,
    first_seen: firstSeen,
    last_seen: lastSeen,
  };
}

function storedUsage(
  discovered: DiscoveredAssetUsage,
  sourceReport: AssetAuditReport,
  overrides: Partial<NormalizedStoredUsage> = {},
): NormalizedStoredUsage {
  const payload = expectedCreatePayload(
    discovered,
    sourceReport,
    EARLIER_AT,
    EARLIER_AT,
  );
  return {
    environment: "dev",
    ...payload,
    date_updated: null,
    ...overrides,
  };
}

function postApplyRows(
  current: readonly NormalizedStoredUsage[],
  actions: readonly AssetUsageSyncAction[],
): NormalizedStoredUsage[] {
  const rows = new Map(current.map((row) => [row.id, structuredClone(row)]));
  for (const action of actions) {
    if (action.kind === "create") {
      rows.set(action.id, {
        environment: "dev",
        ...action.payload,
        date_updated: null,
      });
      continue;
    }
    const existing = rows.get(action.id);
    if (!existing) throw new Error(`Missing simulated row ${action.id}`);
    rows.set(action.id, {
      ...existing,
      ...action.payload,
    });
  }
  return [...rows.values()];
}

function makeHarness(input: {
  sourceReport?: AssetAuditReport;
  storedUsages?: readonly NormalizedStoredUsage[];
  urls?: readonly string[];
  env?: Readonly<Record<string, string | undefined>>;
  readFailure?: Error;
  writeFailureAt?: number;
} = {}) {
  const calls = {
    resolveUrl: 0,
    reports: [] as SyncReadInput[],
    usages: [] as SyncReadInput[],
    writes: [] as SyncWriteInput[],
    logs: [] as string[],
    errors: [] as string[],
  };
  const urls = input.urls ?? ["https://cms.dev.yesid.dev"];
  const dependencies: SyncCliDependencies = {
    env: input.env ?? { DIRECTUS_ADMIN_TOKEN: "test-secret-token" },
    now: () => OBSERVED_AT,
    resolveDirectusUrl: () => {
      const index = Math.min(calls.resolveUrl, urls.length - 1);
      calls.resolveUrl += 1;
      return urls[index]!;
    },
    loadAuditReport: async (request) => {
      calls.reports.push(request);
      if (input.readFailure) throw input.readFailure;
      return input.sourceReport ?? report();
    },
    loadStoredUsages: async (request) => {
      calls.usages.push(request);
      if (input.readFailure) throw input.readFailure;
      return input.storedUsages ?? [];
    },
    applyAction: async (request) => {
      calls.writes.push(request);
      if (
        input.writeFailureAt !== undefined &&
        calls.writes.length === input.writeFailureAt
      ) {
        throw new Error("simulated write failure");
      }
    },
    log: (message) => calls.logs.push(message),
    error: (message) => calls.errors.push(message),
  };
  return { calls, dependencies };
}

describe("asset usage synchronization planning", () => {
  it("projects eligible resolved and unresolved discoveries into closed create payloads", () => {
    const resolved = usage("a");
    const unresolved = usage("b", {
      assetRecordId: null,
      resolvedVersionId: null,
      semanticKey: null,
      unresolvedRef: "repository:apps/web/static/unresolved-blueprint.svg",
      confidence: "unknown",
      deliveryMode: "inline-svg",
    });
    const sourceReport = report([resolved, unresolved]);
    const cli = requireSubject();

    const plan = cli.buildAssetUsageSyncPlan({
      report: sourceReport,
      storedUsages: [],
      observationTime: OBSERVED_AT,
    });

    expect(plan).toEqual({
      manifestSha256: cli.hashAssetUsageManifest(sourceReport),
      scanRunId: `asset-audit:${cli.hashAssetUsageManifest(sourceReport)}`,
      observationTime: OBSERVED_AT,
      actions: [
        {
          kind: "create",
          id: resolved.id,
          payload: expectedCreatePayload(resolved, sourceReport),
        },
        {
          kind: "create",
          id: unresolved.id,
          payload: expectedCreatePayload(unresolved, sourceReport),
        },
      ],
    });
    expect(plan.actions[1]?.payload).toMatchObject({
      asset_record: null,
      resolved_version: null,
      unresolved_ref: unresolved.unresolvedRef,
    });
  });

  it("ignores every discovery that the canonical audit did not mark sync-eligible", () => {
    const excluded = usage("a", {
      environment: "prod",
      syncEligible: false,
    });
    const sourceReport = report([excluded]);
    expect(
      requireSubject().buildAssetUsageSyncPlan({
        report: sourceReport,
        storedUsages: [],
        observationTime: OBSERVED_AT,
      }).actions,
    ).toEqual([]);
  });

  it("preserves first_seen and updates last_seen only when a projected field or usage-manifest hash changed", () => {
    const discovered = usage("a");
    const sourceReport = report([discovered]);
    const current = storedUsage(discovered, sourceReport, {
      scan_run_id: `asset-audit:${sha("9")}`,
      last_seen_manifest_sha256: sha("9"),
      first_seen: EARLIER_AT,
      last_seen: EARLIER_AT,
    });

    const plan = requireSubject().buildAssetUsageSyncPlan({
      report: sourceReport,
      storedUsages: [current],
      observationTime: OBSERVED_AT,
    });

    expect(plan.actions).toEqual([
      {
        kind: "update",
        id: discovered.id,
        payload: (() => {
          const { id: _id, ...payload } = expectedCreatePayload(
            discovered,
            sourceReport,
            EARLIER_AT,
            OBSERVED_AT,
          );
          return payload;
        })(),
      },
    ]);
  });

  it("deactivates only active rows owned by a prior asset-audit scan", () => {
    const sourceReport = report();
    const absent = usage("a");
    const manual = usage("b");
    const alreadyInactive = usage("c");
    const stored = [
      storedUsage(absent, sourceReport, {
        scan_run_id: `asset-audit:${sha("8")}`,
      }),
      storedUsage(manual, sourceReport, { scan_run_id: "owner-curated-row" }),
      storedUsage(alreadyInactive, sourceReport, {
        scan_run_id: `asset-audit:${sha("7")}`,
        active: false,
      }),
    ];

    expect(
      requireSubject().buildAssetUsageSyncPlan({
        report: sourceReport,
        storedUsages: stored,
        observationTime: OBSERVED_AT,
      }).actions,
    ).toEqual([
      {
        kind: "deactivate",
        id: absent.id,
        payload: { active: false },
      },
    ]);
  });

  it("sorts creates, updates, and deactivations by kind then UTF-8 id", () => {
    const createB = usage("b");
    const createA = usage("a");
    const updateC = usage("c");
    const deactivateD = usage("d");
    const sourceReport = report([createB, updateC, createA]);
    const currentUpdate = storedUsage(updateC, sourceReport, {
      consumer_key: "stale-consumer",
    });
    const currentDeactivate = storedUsage(deactivateD, sourceReport, {
      scan_run_id: `asset-audit:${sha("8")}`,
    });

    const plan = requireSubject().buildAssetUsageSyncPlan({
      report: sourceReport,
      storedUsages: [currentDeactivate, currentUpdate],
      observationTime: OBSERVED_AT,
    });

    expect(plan.actions.map(({ kind, id }) => [kind, id])).toEqual([
      ["create", createA.id],
      ["create", createB.id],
      ["update", updateC.id],
      ["deactivate", deactivateD.id],
    ]);
  });

  it("produces an empty second plan after applying its own projected actions", () => {
    const create = usage("a");
    const update = usage("b");
    const deactivate = usage("c");
    const sourceReport = report([create, update]);
    const current = [
      storedUsage(update, sourceReport, { required: false }),
      storedUsage(deactivate, sourceReport, {
        scan_run_id: `asset-audit:${sha("8")}`,
      }),
    ];
    const firstPlan = requireSubject().buildAssetUsageSyncPlan({
      report: sourceReport,
      storedUsages: current,
      observationTime: OBSERVED_AT,
    });

    const secondPlan = requireSubject().buildAssetUsageSyncPlan({
      report: sourceReport,
      storedUsages: postApplyRows(current, firstPlan.actions),
      observationTime: LATER_AT,
    });

    expect(firstPlan.actions.map((action) => action.kind)).toEqual([
      "create",
      "update",
      "deactivate",
    ]);
    expect(secondPlan.actions).toEqual([]);
  });

  it("keeps the usage manifest stable when synchronized rows churn the enclosing audit receipt", () => {
    const cli = requireSubject();
    const discovered = usage("a");
    const first = report([discovered]);
    const afterUsageWrite: AssetAuditReport = {
      ...first,
      inputReceipts: {
        ...first.inputReceipts,
        devSnapshotSha256: sha("9"),
      },
    };
    const changedConsumer = report([
      { ...discovered, consumerKey: "materially-changed-consumer" },
    ]);

    expect(cli.hashAssetUsageManifest(afterUsageWrite)).toBe(
      cli.hashAssetUsageManifest(first),
    );
    expect(cli.hashAssetUsageManifest(changedConsumer)).not.toBe(
      cli.hashAssetUsageManifest(first),
    );
  });

  it("refuses incomplete required audit evidence before planning deactivations", () => {
    for (const missingScope of REQUIRED_SYNC_SCOPES) {
      const incomplete = report([], [missingScope]);
      const staleGenerated = storedUsage(usage("a"), incomplete, {
        scan_run_id: `asset-audit:${sha("8")}`,
      });
      expect(() =>
        requireSubject().buildAssetUsageSyncPlan({
          report: incomplete,
          storedUsages: [staleGenerated],
          observationTime: OBSERVED_AT,
        }),
      ).toThrow(new RegExp(`${missingScope}.*evaluated|incomplete.*${missingScope}`, "i"));
    }
  });

  it("refuses an id collision with a row not owned by the asset audit", () => {
    const discovered = usage("a");
    const sourceReport = report([discovered]);
    const ownerCuratedCollision = storedUsage(discovered, sourceReport, {
      scan_run_id: "owner-curated-row",
      consumer_key: "do-not-overwrite",
    });
    expect(() =>
      requireSubject().buildAssetUsageSyncPlan({
        report: sourceReport,
        storedUsages: [ownerCuratedCollision],
        observationTime: OBSERVED_AT,
      }),
    ).toThrow(/collision|not owned|asset-audit/i);
  });

  it("rejects invalid observation times and invalid resolved/unresolved identity combinations", () => {
    const valid = report([usage("a")]);
    expect(() =>
      requireSubject().buildAssetUsageSyncPlan({
        report: valid,
        storedUsages: [],
        observationTime: "2026-07-15",
      }),
    ).toThrow(/ISO|observation/i);

    for (const invalid of [
      usage("b", { assetRecordId: null, resolvedVersionId: null, unresolvedRef: null }),
      usage("c", { unresolvedRef: "repository:collision.svg" }),
      usage("d", {
        assetRecordId: null,
        resolvedVersionId: VERSION_ID,
        unresolvedRef: "repository:invalid.svg",
      }),
    ]) {
      expect(() =>
        requireSubject().buildAssetUsageSyncPlan({
          report: report([invalid]),
          storedUsages: [],
          observationTime: OBSERVED_AT,
        }),
      ).toThrow(/identity|asset_record|resolved_version|unresolved_ref/i);
    }
  });

  it("rejects every discovery that cannot round-trip through the closed asset_usages schema", () => {
    const invalidCases: ReadonlyArray<
      readonly [string, Partial<DiscoveredAssetUsage>]
    > = [
      ["id", { id: "not-a-sha" as Sha256Hex }],
      ["asset_record", { assetRecordId: "not-a-uuid" }],
      ["resolved_version", { resolvedVersionId: "not-a-uuid" }],
      [
        "unresolved_ref",
        {
          assetRecordId: null,
          resolvedVersionId: null,
          unresolvedRef: "x".repeat(256),
        },
      ],
      ["confidence", { confidence: "probably" as never }],
      ["consumer_type", { consumerType: "widget" as never }],
      ["consumer_key", { consumerKey: "x".repeat(256) }],
      ["source_kind", { sourceKind: "filesystem" as never }],
      ["source_file", { sourceFile: "x".repeat(1025) }],
      ["cms_field", { cmsField: "x".repeat(513) }],
      ["source_line", { sourceLine: 2_147_483_648 }],
      ["route", { route: `/${"x".repeat(2048)}` }],
      ["locale", { locale: "de" }],
      ["slot", { slot: "x".repeat(256) }],
      ["required", { required: "yes" as never }],
      ["delivery_mode", { deliveryMode: "raw-html" as never }],
      ["alt_text_override", { altTextOverride: "unsafe\0text" }],
      ["alt_source", { altSource: "x".repeat(256) }],
    ];

    for (const [field, overrides] of invalidCases) {
      expect(() =>
        requireSubject().buildAssetUsageSyncPlan({
          report: report([usage("a", overrides)]),
          storedUsages: [],
          observationTime: OBSERVED_AT,
        }),
      ).toThrow(new RegExp(field, "i"));
    }
  });
});

describe("asset usage synchronization CLI safety", () => {
  it("accepts only the two strict modes and defaults to dry-run", () => {
    const { parseAssetUsageSyncArgs } = requireSubject();
    expect(parseAssetUsageSyncArgs([])).toEqual({ mode: "dry-run" });
    expect(parseAssetUsageSyncArgs(["--dry-run"])).toEqual({ mode: "dry-run" });
    expect(parseAssetUsageSyncArgs(["--apply"])).toEqual({ mode: "apply" });
    for (const argv of [
      ["--dry-run", "--apply"],
      ["--apply", "--apply"],
      ["--dry-run", "--dry-run"],
      ["--apply=true"],
      ["--url=https://cms.dev.yesid.dev"],
      ["apply"],
    ]) {
      expect(() => parseAssetUsageSyncArgs(argv)).toThrow(/flag|mode|unknown|once/i);
    }
  });

  it("refuses PROD before any read or write, including through injected dependencies", async () => {
    expect(requireSubject().DEV_ASSET_USAGE_SYNC_URL).toBe(
      "https://cms.dev.yesid.dev",
    );
    const { calls, dependencies } = makeHarness({
      urls: ["https://cms.yesid.dev"],
    });
    expect(await requireSubject().runAssetUsageSyncCli([], dependencies)).toBe(2);
    expect(calls.reports).toEqual([]);
    expect(calls.usages).toEqual([]);
    expect(calls.writes).toEqual([]);
    expect(calls.errors.join("\n")).toMatch(/DEV-ONLY|non-dev|refus/i);
  });

  it("re-checks the DEV guard immediately before apply and refuses if the target changed", async () => {
    const discovered = usage("a");
    const { calls, dependencies } = makeHarness({
      sourceReport: report([discovered]),
      urls: ["https://cms.dev.yesid.dev", "https://cms.yesid.dev"],
    });
    expect(
      await requireSubject().runAssetUsageSyncCli(["--apply"], dependencies),
    ).toBe(2);
    expect(calls.reports).toHaveLength(1);
    expect(calls.usages).toHaveLength(1);
    expect(calls.resolveUrl).toBeGreaterThanOrEqual(2);
    expect(calls.writes).toEqual([]);
  });

  it("refuses a non-round-trippable discovery before any apply write", async () => {
    const { calls, dependencies } = makeHarness({
      sourceReport: report([usage("a", { locale: "de" })]),
    });
    expect(
      await requireSubject().runAssetUsageSyncCli(["--apply"], dependencies),
    ).toBe(2);
    expect(calls.reports).toHaveLength(1);
    expect(calls.usages).toHaveLength(1);
    expect(calls.writes).toEqual([]);
  });

  it("defaults to a live dry-run and performs no writes", async () => {
    const unresolved = usage("a", {
      assetRecordId: null,
      resolvedVersionId: null,
      unresolvedRef: "repository:private-unresolved-value.svg",
    });
    const { calls, dependencies } = makeHarness({
      sourceReport: report([unresolved]),
    });
    expect(await requireSubject().runAssetUsageSyncCli([], dependencies)).toBe(0);
    expect(calls.reports).toEqual([
      { url: "https://cms.dev.yesid.dev", token: "test-secret-token" },
    ]);
    expect(calls.usages).toEqual(calls.reports);
    expect(calls.writes).toEqual([]);
    expect(calls.logs.join("\n")).toMatch(/create=1/i);
    expect(calls.logs.join("\n")).toMatch(/update=0/i);
    expect(calls.logs.join("\n")).toMatch(/deactivate=0/i);
    expect(calls.logs.join("\n")).not.toContain("test-secret-token");
    expect(calls.logs.join("\n")).not.toContain(unresolved.unresolvedRef!);
    expect(calls.logs.join("\n")).not.toContain(unresolved.id);
  });

  it("applies the deterministic actions sequentially", async () => {
    const create = usage("a");
    const update = usage("b");
    const deactivate = usage("c");
    const sourceReport = report([create, update]);
    const stored = [
      storedUsage(update, sourceReport, { required: false }),
      storedUsage(deactivate, sourceReport, {
        scan_run_id: `asset-audit:${sha("8")}`,
      }),
    ];
    const expectedPlan = requireSubject().buildAssetUsageSyncPlan({
      report: sourceReport,
      storedUsages: stored,
      observationTime: OBSERVED_AT,
    });
    const { calls, dependencies } = makeHarness({
      sourceReport,
      storedUsages: stored,
    });

    expect(
      await requireSubject().runAssetUsageSyncCli(["--apply"], dependencies),
    ).toBe(0);
    expect(calls.writes.map(({ action }) => action)).toEqual(
      [...expectedPlan.actions],
    );
    expect(calls.writes.every(({ url }) => url === "https://cms.dev.yesid.dev")).toBe(
      true,
    );
  });

  it("returns operational failure without writes when input, credentials, or reads fail", async () => {
    const invalidArgs = makeHarness();
    expect(
      await requireSubject().runAssetUsageSyncCli(
        ["--unknown"],
        invalidArgs.dependencies,
      ),
    ).toBe(2);
    expect(invalidArgs.calls.reports).toEqual([]);
    expect(invalidArgs.calls.writes).toEqual([]);

    const secretArg = makeHarness();
    expect(
      await requireSubject().runAssetUsageSyncCli(
        ["--token=argument-secret"],
        secretArg.dependencies,
      ),
    ).toBe(2);
    expect(secretArg.calls.errors.join("\n")).not.toContain("argument-secret");

    const missingToken = makeHarness({ env: {} });
    expect(
      await requireSubject().runAssetUsageSyncCli([], missingToken.dependencies),
    ).toBe(2);
    expect(missingToken.calls.reports).toEqual([]);

    const readFailure = makeHarness({
      readFailure: new Error(
        "read leaked test-secret-token repository:private-unresolved-value.svg",
      ),
    });
    expect(
      await requireSubject().runAssetUsageSyncCli([], readFailure.dependencies),
    ).toBe(2);
    expect(readFailure.calls.writes).toEqual([]);
    const printed = readFailure.calls.errors.join("\n");
    expect(printed).toMatch(/fail/i);
    expect(printed).not.toContain("test-secret-token");
    expect(printed).not.toContain("repository:private-unresolved-value.svg");
  });

  it("stops on the first failed write and does not print row or token data", async () => {
    const sourceReport = report([usage("a"), usage("b")]);
    const { calls, dependencies } = makeHarness({
      sourceReport,
      writeFailureAt: 1,
    });
    expect(
      await requireSubject().runAssetUsageSyncCli(["--apply"], dependencies),
    ).toBe(2);
    expect(calls.writes).toHaveLength(1);
    const printed = [...calls.logs, ...calls.errors].join("\n");
    expect(printed).not.toContain("test-secret-token");
    expect(printed).not.toContain(usage("a").id);
  });
});

describe("asset usage synchronization HTTP contract", () => {
  it("refuses a non-DEV client before fetch can run", () => {
    let fetchCalls = 0;
    expect(() =>
      requireSubject().createAssetUsageSyncHttpClient({
        url: "https://cms.yesid.dev",
        token: "secret",
        fetch: (async () => {
          fetchCalls += 1;
          throw new Error("must not fetch");
        }) as unknown as typeof fetch,
      }),
    ).toThrow(/DEV-ONLY|non-dev|refus/i);
    expect(fetchCalls).toBe(0);
  });

  it("reads stored usages with GET, static bearer auth, explicit fields, sorting, and pagination", async () => {
    const requests: Array<{ url: URL; init?: RequestInit }> = [];
    const discovered = usage("a");
    const sourceReport = report([discovered]);
    const rows = Array.from({ length: 101 }, (_, index) =>
      storedUsage(discovered, sourceReport, {
        id: index.toString(16).padStart(64, "0") as Sha256Hex,
        consumer_key: `route-page-${index}`,
      }),
    );
    const fakeFetch = (async (
      input: string | URL | Request,
      init?: RequestInit,
    ) => {
      const url = new URL(String(input));
      requests.push({ url, init });
      const offset = Number(url.searchParams.get("offset"));
      return new Response(JSON.stringify({ data: rows.slice(offset, offset + 100) }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as typeof fetch;
    const client = requireSubject().createAssetUsageSyncHttpClient({
      url: "https://cms.dev.yesid.dev",
      token: "static-token",
      fetch: fakeFetch,
    });

    const loaded = await client.readStoredUsages();
    expect(loaded).toHaveLength(101);
    expect(loaded.map(({ id }) => id)).toEqual(rows.map(({ id }) => id));
    expect(requests).toHaveLength(2);
    const request = requests[0]!;
    expect(request.url.pathname).toBe("/items/asset_usages");
    expect(request.url.searchParams.get("fields")?.split(",")).toEqual([
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
    ]);
    expect(request.url.searchParams.get("sort")).toBe("id");
    expect(request.url.searchParams.get("limit")).toBe("100");
    expect(requests.map(({ url }) => url.searchParams.get("offset"))).toEqual([
      "0",
      "100",
    ]);
    for (const pageRequest of requests) {
      expect(pageRequest.url.searchParams.has("access_token")).toBe(false);
      expect(pageRequest.init?.method ?? "GET").toBe("GET");
      expect(
        new Headers(pageRequest.init?.headers).get("authorization"),
      ).toBe("Bearer static-token");
    }
  });

  it("uses only POST for creates and encoded-id PATCH for updates and deactivations", async () => {
    const requests: Array<{ url: URL; init?: RequestInit }> = [];
    const fakeFetch = (async (
      input: string | URL | Request,
      init?: RequestInit,
    ) => {
      requests.push({ url: new URL(String(input)), init });
      return new Response(JSON.stringify({ data: {} }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as typeof fetch;
    const client = requireSubject().createAssetUsageSyncHttpClient({
      url: "https://cms.dev.yesid.dev",
      token: "static-token",
      fetch: fakeFetch,
    });
    const discovered = usage("a");
    const sourceReport = report([discovered]);
    const createPayload = expectedCreatePayload(discovered, sourceReport);
    const { id: _id, ...updatePayload } = createPayload;
    const actions: AssetUsageSyncAction[] = [
      { kind: "create", id: createPayload.id, payload: createPayload },
      {
        kind: "update",
        id: "usage/id with spaces",
        payload: updatePayload,
      },
      {
        kind: "deactivate",
        id: "retired/id with spaces",
        payload: { active: false },
      },
    ];
    for (const action of actions) await client.applyAction(action);

    expect(
      requests.map(({ url, init }) => ({
        method: init?.method,
        path: url.pathname,
        body: JSON.parse(String(init?.body)),
      })),
    ).toEqual([
      {
        method: "POST",
        path: "/items/asset_usages",
        body: createPayload,
      },
      {
        method: "PATCH",
        path: "/items/asset_usages/usage%2Fid%20with%20spaces",
        body: updatePayload,
      },
      {
        method: "PATCH",
        path: "/items/asset_usages/retired%2Fid%20with%20spaces",
        body: { active: false },
      },
    ]);
    for (const { url, init } of requests) {
      expect(url.searchParams.has("access_token")).toBe(false);
      expect(new Headers(init?.headers).get("authorization")).toBe(
        "Bearer static-token",
      );
      expect(new Headers(init?.headers).get("content-type")).toBe(
        "application/json",
      );
    }
  });

  it("rejects failed or malformed CMS responses without exposing response bodies", async () => {
    const fakeFetch = (async () =>
      new Response("repository:secret-unresolved-ref", {
        status: 500,
      })) as unknown as typeof fetch;
    const client = requireSubject().createAssetUsageSyncHttpClient({
      url: "https://cms.dev.yesid.dev",
      token: "secret-token",
      fetch: fakeFetch,
    });
    let message = "";
    try {
      await client.readStoredUsages();
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }
    expect(message).toMatch(/500|request failed/i);
    expect(message).not.toContain("repository:secret-unresolved-ref");
    expect(message).not.toContain("secret-token");
  });
});
