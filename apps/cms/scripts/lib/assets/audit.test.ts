import { afterEach, describe, expect, it } from "bun:test";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import {
  defineAssetUsages,
  parseAssetSemanticKey,
  type Sha256Hex,
} from "@repo/shared";
import {
  ASSET_FINDING_EVIDENCE_POLICY,
  ASSET_FINDING_CODES,
  fingerprintAssetFinding,
  projectAssetFindingEvidence,
  reconcileAssetAudit,
  repositoryLegacyPath,
  type AssetAuditInput,
  type AssetAuditReport,
  type AssetFindingCode,
  type GeneratedOutputExpectation,
  type OgCoverageRequirement,
} from "./audit";
import {
  DIRECTUS_READ_SURFACES,
  type CmsEnvironment,
  type DirectusAssetSnapshot,
  type NormalizedAssetRecord,
  type NormalizedAssetTranslation,
  type NormalizedAssetVersion,
  type NormalizedCmsFile,
  type NormalizedCmsReference,
  type NormalizedTransformPreset,
} from "./directus-scan";
import type {
  RepositoryAsset,
  RepositoryScan,
  RepositoryScanFinding,
  RepositoryUsage,
} from "./repository-scan";
import { scanRepository } from "./repository-scan";

const SHA_A = "a".repeat(64) as Sha256Hex;
const SHA_B = "b".repeat(64) as Sha256Hex;
const SHA_C = "c".repeat(64) as Sha256Hex;
const SHA_D = "d".repeat(64) as Sha256Hex;
const SHA_E = "e".repeat(64) as Sha256Hex;

const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryRoots
      .splice(0)
      .map((root) => rm(root, { recursive: true, force: true })),
  );
});

async function makeMiniRepository(
  files: Readonly<Record<string, string | Uint8Array>>,
) {
  const root = await mkdtemp(join(tmpdir(), "yesid-asset-audit-"));
  temporaryRoots.push(root);
  for (const [repoPath, contents] of Object.entries(files)) {
    const absolutePath = join(root, ...repoPath.split("/"));
    await mkdir(dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, contents);
  }
  return { root, trackedFiles: Object.keys(files) };
}

function uuid(value: number): string {
  return `00000000-0000-4000-8000-${value.toString(16).padStart(12, "0")}`;
}

function semantic(value: string) {
  return parseAssetSemanticKey(value);
}

function repositoryAsset(
  overrides: Partial<RepositoryAsset> = {},
): RepositoryAsset {
  return {
    id: "repo:apps/web/static/images/demo.png",
    kind: "raster",
    origin: "repository-file",
    repoPath: "apps/web/static/images/demo.png",
    sha256: SHA_A,
    bytes: 128,
    inlineSvgOrdinal: null,
    ...overrides,
  };
}

function repositoryUsage(
  overrides: Partial<RepositoryUsage> = {},
): RepositoryUsage {
  return {
    id: "usage:demo",
    assetId: "repo:apps/web/static/images/demo.png",
    semanticKey: semantic("site.demo.image"),
    unresolvedRef: null,
    confidence: "exact-static",
    consumerType: "component",
    consumerKey: "demo",
    sourceKind: "repository",
    sourceFile: "apps/web/src/lib/Demo.svelte",
    sourceLine: 12,
    cmsField: null,
    route: "/",
    locale: "en",
    slot: "hero",
    required: true,
    deliveryMode: "local-img",
    altTextOverride: "Demo",
    altSource: null,
    ...overrides,
  };
}

function repositoryFinding(
  overrides: Partial<RepositoryScanFinding> = {},
): RepositoryScanFinding {
  return {
    code: "dynamic-reference",
    sourceFile: "apps/web/src/lib/Demo.svelte",
    sourceLine: 12,
    rawRef: "${asset}",
    ...overrides,
  };
}

function repositoryScan(
  overrides: Partial<RepositoryScan> = {},
): RepositoryScan {
  return {
    schemaVersion: 1,
    assets: [],
    usages: [],
    generatedFrom: [],
    findings: [],
    ...overrides,
  };
}

function cmsFile(
  environment: CmsEnvironment,
  overrides: Partial<NormalizedCmsFile> = {},
): NormalizedCmsFile {
  const fileId = overrides.fileId ?? uuid(environment === "dev" ? 100 : 200);
  return {
    id: `directus-file:${environment}:${fileId}`,
    environment,
    fileId,
    storage: "local",
    filenameDisk: `${fileId}.png`,
    filenameDownload: "demo.png",
    title: "Demo",
    mimeType: "image/png",
    folderId: null,
    folderPath: null,
    legacyPath: "images/demo.png",
    declaredBytes: 128,
    observedBytes: 128,
    width: 1200,
    height: 630,
    durationMs: null,
    description: null,
    tags: [],
    metadata: null,
    sha256: SHA_A,
    hashState: "verified",
    ...overrides,
  };
}

function assetRecord(
  overrides: Partial<NormalizedAssetRecord> = {},
): NormalizedAssetRecord {
  return {
    id: uuid(1),
    environment: "dev",
    semantic_key: semantic("site.demo.image"),
    title: "Demo",
    meaning: null,
    kind: "raster",
    role: "content",
    lifecycle_status: "approved",
    code_component_key: null,
    owner_type: "component",
    owner_key: "demo",
    locale_policy: "global",
    alt_mode: "decorative",
    aspect_ratio_mode: "any",
    aspect_ratio_width: null,
    aspect_ratio_height: null,
    allowed_mime_families: ["image/png"],
    transform_profile: null,
    delivery_mode: "local-img",
    focal_point_x: null,
    focal_point_y: null,
    max_bytes: null,
    brand_status: "approved",
    approved_token_slots: null,
    candidate_version: null,
    approved_version: uuid(2),
    date_created: null,
    date_updated: null,
    user_created: null,
    user_updated: null,
    ...overrides,
  } as NormalizedAssetRecord;
}

function svgSafety(
  overrides: Record<string, unknown> = {},
): NormalizedAssetVersion["safety_report"] {
  return {
    state: "not-applicable",
    reasons: [],
    policy: null,
    sourceSha256: null,
    sanitizerSignature: null,
    sanitizedOutputSha256: null,
    transformSignature: null,
    ...overrides,
  } as NormalizedAssetVersion["safety_report"];
}

function assetVersion(
  overrides: Partial<NormalizedAssetVersion> = {},
): NormalizedAssetVersion {
  return {
    id: uuid(2),
    environment: "dev",
    asset_record: uuid(1),
    version_number: 1,
    source_mode: "upload",
    directus_file: uuid(100),
    component_key: null,
    sha256: SHA_A,
    mime_type: "image/png",
    format: "png",
    bytes: 128,
    width: 1200,
    height: 630,
    duration_ms: null,
    orientation: null,
    color_profile: null,
    is_animated: false,
    source_hash: null,
    dependency_hashes: null,
    transform_profile: null,
    transform_signature: null,
    sanitizer_signature: null,
    generator_signature: null,
    toolchain_signature: null,
    approval_status: "approved",
    approved_by: null,
    approved_at: null,
    replaces_version: null,
    replacement_reason: null,
    promotion_request_id: null,
    quarantine_reason: null,
    sanitized_output_sha256: null,
    input_hash: null,
    brand_slots: null,
    svg_id_prefix: null,
    template_version: null,
    safety_report: svgSafety(),
    date_created: null,
    user_created: null,
    ...overrides,
  } as NormalizedAssetVersion;
}

function translation(
  overrides: Partial<NormalizedAssetTranslation> = {},
): NormalizedAssetTranslation {
  return {
    id: uuid(300),
    environment: "dev",
    asset_records_id: uuid(1),
    languages_code: "en",
    alt_text: "Demo image",
    caption: null,
    credit: null,
    og_image_alt: null,
    ...overrides,
  } as NormalizedAssetTranslation;
}

function cmsReference(
  overrides: Partial<NormalizedCmsReference> = {},
): NormalizedCmsReference {
  return {
    id: "cms:dev:route_seo:home:og_image:0",
    environment: "dev",
    collection: "route_seo",
    itemKey: "home",
    field: "og_image",
    ordinal: 0,
    ownerType: "route",
    ownerKey: "home",
    route: "/",
    locale: "en",
    active: true,
    consumption: "rendered",
    slot: "og-image",
    required: true,
    deliveryMode: "og-meta",
    referenceKind: "typed-file-relation",
    fileId: uuid(100),
    rawRef: null,
    contextualAlt: "Home preview",
    altSource: "route_seo.og_image_alt",
    ...overrides,
  };
}

function completeReceipts() {
  return DIRECTUS_READ_SURFACES.map((surface) => ({
    surface,
    availability: "available" as const,
    complete: true,
    rowCount: 0,
  }));
}

function snapshot(
  environment: CmsEnvironment,
  overrides: Partial<DirectusAssetSnapshot> = {},
): DirectusAssetSnapshot {
  return {
    schemaVersion: 1,
    environment,
    registryAvailability: "available",
    folders: [],
    files: [],
    records: [],
    translations: [],
    versions: [],
    storedUsages: [],
    references: [],
    transformPresets: [],
    readReceipts: completeReceipts(),
    readIssues: [],
    ...overrides,
  };
}

function generatedOutput(
  overrides: Partial<GeneratedOutputExpectation> = {},
): GeneratedOutputExpectation {
  return {
    outputAssetId: "repo:apps/web/static/og/demo.png",
    semanticKey: semantic("site.og.demo"),
    generator: "scripts/generate-og.ts",
    expectedOutputSha256: SHA_A,
    expectedInputHash: SHA_B,
    observedMetadataState: "observed",
    observedMimeType: "image/png",
    observedWidth: 1200,
    observedHeight: 630,
    expectedMimeType: "image/png",
    expectedWidth: 1200,
    expectedHeight: 630,
    required: true,
    ...overrides,
  };
}

function ogMatrix(): OgCoverageRequirement[] {
  const rows: OgCoverageRequirement[] = [];
  for (let group = 1; group <= 25; group += 1) {
    const suffix = group.toString().padStart(2, "0");
    for (const locale of ["en", "fr", "es"] as const) {
      rows.push({
        usageKey: `route.og.slot-${suffix}.${locale}`,
        route: `/routes/slot-${suffix}`,
        locale,
        ownerType: "route",
        ownerKey: `slot-${suffix}`,
        semanticCandidates: [semantic(`route.og.slot-${suffix}`)],
        currentRef: null,
        proofUsageId: null,
        fallbackUsageKey: null,
        expectedInputHash: null,
        required: false,
        exclusionReason: "Intentionally excluded from this focused fixture.",
      });
    }
  }
  return rows;
}

function auditInput(overrides: Partial<AssetAuditInput> = {}): AssetAuditInput {
  return {
    repository: repositoryScan(),
    generatedOutputs: [],
    ogCoverage: ogMatrix(),
    repositoryRevision: "fixture-revision",
    ...overrides,
  };
}

function findings(report: AssetAuditReport, code: AssetFindingCode) {
  return report.findings.filter((finding) => finding.code === code);
}

function expectFinding(
  report: AssetAuditReport,
  code: AssetFindingCode,
  severity?: "error" | "warning" | "info",
) {
  const match = findings(report, code)[0];
  expect(match, `Expected ${code} finding`).toBeDefined();
  if (severity) expect(match?.severity).toBe(severity);
  return match!;
}

function trackedRasterFixture(
  options: {
    environment?: CmsEnvironment;
    semanticKey?: string;
    legacyPath?: string;
    fileId?: string;
    recordId?: string;
    versionId?: string;
    sha256?: Sha256Hex;
    record?: Partial<NormalizedAssetRecord>;
    version?: Partial<NormalizedAssetVersion>;
    file?: Partial<NormalizedCmsFile>;
  } = {},
) {
  const environment = options.environment ?? "dev";
  const recordId = options.recordId ?? uuid(environment === "dev" ? 1 : 11);
  const versionId = options.versionId ?? uuid(environment === "dev" ? 2 : 12);
  const fileId = options.fileId ?? uuid(environment === "dev" ? 100 : 200);
  const semanticKey = semantic(options.semanticKey ?? "site.demo.image");
  const sha256 = options.sha256 ?? SHA_A;
  const record = assetRecord({
    id: recordId,
    environment,
    semantic_key: semanticKey,
    approved_version: versionId,
    ...options.record,
  });
  const version = assetVersion({
    id: versionId,
    environment,
    asset_record: recordId,
    directus_file: fileId,
    sha256,
    ...options.version,
  });
  const file = cmsFile(environment, {
    fileId,
    id: `directus-file:${environment}:${fileId}`,
    legacyPath: options.legacyPath ?? "images/demo.png",
    sha256,
    ...options.file,
  });
  return { record, version, file };
}

function verifiedInlineSvgFixture(options: {
  semanticKey: string;
  legacyPath: string;
  sha256: Sha256Hex;
  recordId?: string;
  versionId?: string;
  fileId?: string;
}) {
  return trackedRasterFixture({
    semanticKey: options.semanticKey,
    legacyPath: options.legacyPath,
    sha256: options.sha256,
    recordId: options.recordId,
    versionId: options.versionId,
    fileId: options.fileId,
    record: {
      kind: "svg",
      role: "illustration",
      delivery_mode: "inline-svg",
      allowed_mime_families: ["image/svg+xml"],
    },
    version: {
      mime_type: "image/svg+xml",
      format: "svg",
      source_hash: SHA_C,
      sanitized_output_sha256: options.sha256,
      sanitizer_signature: SHA_D,
      safety_report: svgSafety({
        state: "declared-safe",
        policy: "svg-safe-v1",
        sourceSha256: SHA_C,
        sanitizerSignature: SHA_D,
        sanitizedOutputSha256: options.sha256,
      }),
    },
    file: {
      mimeType: "image/svg+xml",
      filenameDownload: options.legacyPath.split("/").at(-1) ?? "asset.svg",
    },
  });
}

describe("repositoryLegacyPath", () => {
  it("maps static and CMS brand roots into the exact Directus legacy namespace", () => {
    expect(
      repositoryLegacyPath("apps/web/static/images/about/headshot.webp"),
    ).toBe("images/about/headshot.webp");
    expect(repositoryLegacyPath("apps/cms/brand/logo-mark.svg")).toBe(
      "brand/logo-mark.svg",
    );
    expect(repositoryLegacyPath("apps/web/src/lib/Logo.svelte")).toBeNull();
  });
});

describe("approved finding taxonomy", () => {
  it("exports exactly the 15 approved finding codes", () => {
    expect(ASSET_FINDING_CODES).toEqual([
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
    ]);
  });

  it("emits missing-record for a required semantic usage with proven DEV registry absence", () => {
    const report = reconcileAssetAudit(
      auditInput({
        repository: repositoryScan({
          usages: [repositoryUsage({ assetId: null })],
        }),
        dev: snapshot("dev", { registryAvailability: "missing" }),
      }),
    );

    const finding = expectFinding(report, "missing-record", "error");
    expect(finding.identity).toContain("site.demo.image");
    expect(finding.evidence).toEqual({
      semanticKey: "site.demo.image",
      consumer: "component:demo",
      route: "/",
      locale: "en",
      slot: "hero",
      required: true,
    });
    expect(finding.requiredScopes).toEqual(["repository", "dev-registry"]);
  });

  it("emits missing-version when a live record has no approved pointer", () => {
    const record = assetRecord({ approved_version: null });
    const report = reconcileAssetAudit(
      auditInput({
        repository: repositoryScan({ usages: [repositoryUsage()] }),
        dev: snapshot("dev", { records: [record] }),
      }),
    );

    const finding = expectFinding(report, "missing-version", "error");
    expect(finding.identity).toBe("site.demo.image");
    expect(finding.evidence).toEqual(
      expect.objectContaining({
        lifecycle: "approved",
        selectedPointerKind: "approved_version",
        invalidInvariants: expect.arrayContaining(["selected-pointer-missing"]),
      }),
    );
  });

  it("emits untracked-repo-asset for a required authored repository file", () => {
    const asset = repositoryAsset();
    const report = reconcileAssetAudit(
      auditInput({
        repository: repositoryScan({
          assets: [asset],
          usages: [repositoryUsage()],
        }),
        dev: snapshot("dev"),
      }),
    );

    const finding = expectFinding(report, "untracked-repo-asset", "error");
    expect(finding.identity).toBe("apps/web/static/images/demo.png");
    expect(finding.evidence).toEqual({
      origin: "repository-file",
      sha256: SHA_A,
      completeChainState: "not-applicable",
    });
  });

  it("emits unused-record for an active registry record with no current rendered usage", () => {
    const tracked = trackedRasterFixture();
    const report = reconcileAssetAudit(
      auditInput({
        dev: snapshot("dev", {
          records: [tracked.record],
          versions: [tracked.version],
          files: [tracked.file],
        }),
      }),
    );

    const finding = expectFinding(report, "unused-record", "warning");
    expect(finding.identity).toBe("site.demo.image");
    expect(finding.evidence).toEqual({
      lifecycle: "approved",
      ownerType: "component",
      ownerKey: "demo",
    });
  });

  it("emits orphaned-directus-file only after file, content, and registry reachability are evaluated", () => {
    const file = cmsFile("dev", { legacyPath: "uploads/orphan.png" });
    const report = reconcileAssetAudit(
      auditInput({ dev: snapshot("dev", { files: [file] }) }),
    );

    const finding = expectFinding(report, "orphaned-directus-file", "warning");
    expect(finding.evidence).toEqual({
      hashState: "verified",
      relationPresent: false,
      versionPresent: false,
      mirrorPresent: false,
    });
    expect(finding.requiredScopes).toEqual([
      "repository",
      "dev-registry",
      "dev-files",
      "dev-content",
    ]);
  });

  it("emits duplicate-content for independent authored identities in one scope", () => {
    const first = repositoryAsset();
    const second = repositoryAsset({
      id: "repo:apps/web/static/images/copy.png",
      repoPath: "apps/web/static/images/copy.png",
    });
    const report = reconcileAssetAudit(
      auditInput({
        repository: repositoryScan({ assets: [first, second] }),
        dev: snapshot("dev"),
      }),
    );

    const finding = expectFinding(report, "duplicate-content", "warning");
    expect(finding.identity).toBe(SHA_A);
    expect(finding.evidence).toEqual({
      authoredIdentities: [second.id, first.id],
    });
  });

  it("retains a resolved /assets UUID as hardcoded evidence", () => {
    const fileId = uuid(100);
    const tracked = trackedRasterFixture({ fileId });
    const hardcoded = repositoryUsage({
      id: "usage:hardcoded",
      assetId: null,
      semanticKey: null,
      unresolvedRef: `/assets/${fileId}`,
      sourceFile: "apps/web/src/lib/Hero.svelte",
      cmsField: "data.image",
      slot: "image",
    });
    const report = reconcileAssetAudit(
      auditInput({
        repository: repositoryScan({ usages: [hardcoded] }),
        dev: snapshot("dev", {
          records: [tracked.record],
          versions: [tracked.version],
          files: [tracked.file],
        }),
      }),
    );

    const finding = expectFinding(report, "hardcoded-file-id", "error");
    expect(finding.identity).toContain(fileId);
    expect(finding.evidence).toEqual({
      sourceKind: "repository",
      sourceFile: "apps/web/src/lib/Hero.svelte",
      cmsField: "data.image",
      route: "/",
      locale: "en",
      slot: "image",
    });
  });

  it("emits unresolved-dynamic-usage for an undeclared required public reference", () => {
    const dynamic = repositoryUsage({
      id: "usage:dynamic",
      assetId: null,
      semanticKey: null,
      unresolvedRef: "/images/${slug}.png",
      confidence: "unknown",
      altTextOverride: null,
      altSource: "alt",
    });
    const report = reconcileAssetAudit(
      auditInput({
        repository: repositoryScan({
          usages: [dynamic],
          findings: [repositoryFinding({ rawRef: "/images/${slug}.png" })],
        }),
        dev: snapshot("dev"),
      }),
    );

    const finding = expectFinding(report, "unresolved-dynamic-usage", "error");
    expect(finding.identity).toMatch(/^[0-9a-f]{64}$/);
    expect(finding.evidence).toEqual({
      unresolvedRef: "/images/${slug}.png",
      confidence: "unknown",
      declarationState: "missing",
    });
  });

  it("emits stale-generated-output when required committed output bytes differ", () => {
    const asset = repositoryAsset({
      id: "repo:apps/web/static/og/demo.png",
      repoPath: "apps/web/static/og/demo.png",
      origin: "generated-file",
      sha256: SHA_B,
      bytes: 42,
    });
    const report = reconcileAssetAudit(
      auditInput({
        repository: repositoryScan({ assets: [asset] }),
        generatedOutputs: [generatedOutput()],
      }),
    );

    const finding = expectFinding(report, "stale-generated-output", "error");
    expect(finding.identity).toBe(asset.id);
    expect(finding.evidence).toEqual({
      expectedOutputSha256: SHA_A,
      observedOutputSha256: SHA_B,
      expectedInputHash: SHA_B,
      observedInputHash: null,
      required: true,
    });
  });

  it("emits environment-drift when one UUID has different verified bytes", () => {
    const fileId = uuid(500);
    const dev = cmsFile("dev", { fileId, sha256: SHA_A });
    const prod = cmsFile("prod", { fileId, sha256: SHA_B });
    const report = reconcileAssetAudit(
      auditInput({
        dev: snapshot("dev", { files: [dev] }),
        prod: snapshot("prod", { files: [prod] }),
      }),
    );

    const finding = expectFinding(report, "environment-drift", "error");
    expect(finding.evidence).toEqual({
      differingFields: ["sha256"],
      dev: { sha256: SHA_A },
      prod: { sha256: SHA_B },
    });
  });

  it("emits missing-alt-text for a required informative global record", () => {
    const tracked = trackedRasterFixture({
      record: { alt_mode: "informative", locale_policy: "global" },
    });
    const report = reconcileAssetAudit(
      auditInput({
        repository: repositoryScan({
          usages: [repositoryUsage({ altTextOverride: null, altSource: null })],
        }),
        dev: snapshot("dev", {
          records: [tracked.record],
          versions: [tracked.version],
          files: [tracked.file],
          translations: [],
        }),
      }),
    );

    const finding = expectFinding(report, "missing-alt-text", "error");
    expect(finding.evidence).toEqual({
      altMode: "informative",
      localePolicy: "global",
      overrideState: "missing",
      contextState: "missing",
    });
  });

  it("emits invalid-dimensions for an exact-ratio violation", () => {
    const tracked = trackedRasterFixture({
      record: {
        aspect_ratio_mode: "exact",
        aspect_ratio_width: 2,
        aspect_ratio_height: 1,
      },
      version: { width: 1200, height: 601 },
      file: { width: 1200, height: 601 },
    });
    const report = reconcileAssetAudit(
      auditInput({
        repository: repositoryScan({ usages: [repositoryUsage()] }),
        dev: snapshot("dev", {
          records: [tracked.record],
          versions: [tracked.version],
          files: [tracked.file],
        }),
      }),
    );

    const finding = expectFinding(report, "invalid-dimensions", "error");
    expect(finding.evidence).toEqual({
      expectedWidth: 2,
      expectedHeight: 1,
      observedWidth: 1200,
      observedHeight: 601,
    });
  });

  it("emits invalid-format when a raster record points at SVG MIME and format", () => {
    const tracked = trackedRasterFixture({
      version: { mime_type: "image/svg+xml", format: "svg" },
      file: { mimeType: "image/svg+xml", filenameDownload: "demo.svg" },
    });
    const report = reconcileAssetAudit(
      auditInput({
        repository: repositoryScan({ usages: [repositoryUsage()] }),
        dev: snapshot("dev", {
          records: [tracked.record],
          versions: [tracked.version],
          files: [tracked.file],
        }),
      }),
    );

    const finding = expectFinding(report, "invalid-format", "error");
    expect(finding.evidence).toEqual(
      expect.objectContaining({
        kind: "raster",
        sourceMode: "upload",
        mimeType: "image/svg+xml",
        format: "svg",
        violatedInvariant: "kind-mime-format-agreement",
      }),
    );
  });

  it("emits unsafe-svg for an approved raw Directus inline SVG", () => {
    const tracked = trackedRasterFixture({
      semanticKey: "site.demo.svg",
      record: {
        kind: "svg",
        role: "illustration",
        delivery_mode: "inline-svg",
        allowed_mime_families: ["image/svg+xml"],
      },
      version: {
        mime_type: "image/svg+xml",
        format: "svg",
        safety_report: svgSafety({ state: "unknown", reasons: ["unreviewed"] }),
      },
      file: {
        mimeType: "image/svg+xml",
        filenameDownload: "demo.svg",
      },
    });
    const report = reconcileAssetAudit(
      auditInput({
        repository: repositoryScan({
          usages: [
            repositoryUsage({
              semanticKey: semantic("site.demo.svg"),
              deliveryMode: "inline-svg",
            }),
          ],
        }),
        dev: snapshot("dev", {
          records: [tracked.record],
          versions: [tracked.version],
          files: [tracked.file],
        }),
      }),
    );

    const finding = expectFinding(report, "unsafe-svg", "error");
    expect(finding.evidence).toEqual(
      expect.objectContaining({
        delivery: "inline-svg",
        safetyState: "unknown",
        missingOrMismatchedProofs: expect.arrayContaining([
          "verified-sanitized-output-identity",
        ]),
      }),
    );
  });

  it("emits missing-og-coverage for a required row without a proven source", () => {
    const matrix = ogMatrix();
    matrix[0] = {
      ...matrix[0]!,
      required: true,
      exclusionReason: null,
    };
    const report = reconcileAssetAudit(auditInput({ ogCoverage: matrix }));

    const finding = expectFinding(report, "missing-og-coverage", "error");
    expect(finding.identity).toBe(matrix[0]!.usageKey);
    expect(finding.evidence).toEqual({
      route: matrix[0]!.route,
      locale: "en",
      owner: "route:slot-01",
      orderedCandidates: ["route.og.slot-01"],
      proofState: "missing",
      fallbackState: "absent",
    });
  });
});

describe("scope receipts and incomplete-scope safety", () => {
  it("marks absent DEV and PROD snapshots not evaluated without manufacturing CMS findings", () => {
    const report = reconcileAssetAudit(
      auditInput({
        repository: repositoryScan({
          usages: [repositoryUsage({ assetId: null })],
        }),
      }),
    );

    expect(report.scopeReceipts).toEqual([
      { scope: "repository", status: "evaluated", reason: "complete" },
      {
        scope: "dev-registry",
        status: "not-evaluated",
        reason: "input-absent",
      },
      { scope: "dev-files", status: "not-evaluated", reason: "input-absent" },
      { scope: "dev-content", status: "not-evaluated", reason: "input-absent" },
      {
        scope: "prod-registry",
        status: "not-evaluated",
        reason: "input-absent",
      },
      { scope: "prod-files", status: "not-evaluated", reason: "input-absent" },
      {
        scope: "prod-content",
        status: "not-evaluated",
        reason: "input-absent",
      },
      { scope: "generated-outputs", status: "evaluated", reason: "complete" },
      { scope: "og-coverage", status: "evaluated", reason: "complete" },
      {
        scope: "svg-safety",
        status: "not-evaluated",
        reason: "supplemental-evidence-missing",
      },
    ]);
    expect(findings(report, "missing-record")).toHaveLength(0);
    expect(findings(report, "missing-version")).toHaveLength(0);
    expect(findings(report, "orphaned-directus-file")).toHaveLength(0);
    expect(findings(report, "environment-drift")).toHaveLength(0);
  });

  it("treats a missing DEV registry as evaluated absence but expected missing PROD registry as not drift", () => {
    const missingReceipt = (environment: CmsEnvironment) =>
      snapshot(environment, {
        registryAvailability: "missing",
        readReceipts: completeReceipts().map((receipt) =>
          receipt.surface.startsWith("asset_")
            ? {
                ...receipt,
                availability: "missing" as const,
                complete: false,
                rowCount: null,
              }
            : receipt,
        ),
      });
    const report = reconcileAssetAudit(
      auditInput({
        repository: repositoryScan({
          usages: [repositoryUsage({ assetId: null })],
        }),
        dev: missingReceipt("dev"),
        prod: missingReceipt("prod"),
      }),
    );

    expect(report.scopeReceipts).toContainEqual({
      scope: "dev-registry",
      status: "evaluated",
      reason: "registry-missing",
    });
    expect(report.scopeReceipts).toContainEqual({
      scope: "prod-registry",
      status: "not-evaluated",
      reason: "registry-missing",
    });
    expectFinding(report, "missing-record", "error");
    expect(findings(report, "environment-drift")).toHaveLength(0);
  });

  it("does not infer missing records from forbidden or failed/unknown registry reads", () => {
    const forbidden = snapshot("dev", {
      registryAvailability: "forbidden",
      readReceipts: completeReceipts().map((receipt) =>
        receipt.surface.startsWith("asset_")
          ? {
              ...receipt,
              availability: "forbidden" as const,
              complete: false,
              rowCount: null,
            }
          : receipt,
      ),
    });
    const failed = snapshot("dev", {
      registryAvailability: "unknown",
      readReceipts: completeReceipts().map((receipt) =>
        receipt.surface === "asset_records"
          ? {
              ...receipt,
              availability: "failed" as const,
              complete: false,
              rowCount: null,
            }
          : receipt,
      ),
      readIssues: [
        {
          code: "request-failed",
          environment: "dev",
          operation: "readPage:asset_records",
          status: 503,
          entityKey: null,
        },
      ],
    });
    for (const current of [forbidden, failed]) {
      const report = reconcileAssetAudit(
        auditInput({
          repository: repositoryScan({
            usages: [repositoryUsage({ assetId: null })],
          }),
          dev: current,
        }),
      );
      expect(findings(report, "missing-record")).toHaveLength(0);
      expect(findings(report, "missing-version")).toHaveLength(0);
      expect(
        report.scopeReceipts.find((receipt) => receipt.scope === "dev-registry")
          ?.status,
      ).toBe("not-evaluated");
    }
  });

  it("suppresses orphan conclusions when a content read is incomplete", () => {
    const readReceipts = completeReceipts().map((receipt) =>
      receipt.surface === "route_seo"
        ? {
            ...receipt,
            availability: "failed" as const,
            complete: false,
            rowCount: null,
          }
        : receipt,
    );
    const report = reconcileAssetAudit(
      auditInput({
        dev: snapshot("dev", {
          files: [cmsFile("dev", { legacyPath: "uploads/maybe-used.png" })],
          readReceipts,
          readIssues: [
            {
              code: "request-failed",
              environment: "dev",
              operation: "readPage:route_seo",
              status: 503,
              entityKey: null,
            },
          ],
        }),
      }),
    );

    expect(report.scopeReceipts).toContainEqual({
      scope: "dev-content",
      status: "not-evaluated",
      reason: "request-failed",
    });
    expect(findings(report, "orphaned-directus-file")).toHaveLength(0);
  });

  it("suppresses byte drift when either file read is incomplete or unhashed", () => {
    const fileId = uuid(900);
    const failedFileReceipts = completeReceipts().map((receipt) =>
      receipt.surface === "directus_files"
        ? {
            ...receipt,
            availability: "failed" as const,
            complete: false,
            rowCount: null,
          }
        : receipt,
    );
    const dev = snapshot("dev", {
      files: [cmsFile("dev", { fileId, sha256: SHA_A })],
    });
    const prod = snapshot("prod", {
      files: [
        cmsFile("prod", {
          fileId,
          sha256: null,
          hashState: "failed",
        }),
      ],
      readReceipts: failedFileReceipts,
      readIssues: [
        {
          code: "download-failed",
          environment: "prod",
          operation: "readAsset",
          status: 503,
          entityKey: fileId,
        },
      ],
    });
    const report = reconcileAssetAudit(auditInput({ dev, prod }));

    expect(report.scopeReceipts).toContainEqual({
      scope: "prod-files",
      status: "not-evaluated",
      reason: "request-failed",
    });
    expect(findings(report, "environment-drift")).toHaveLength(0);
  });
});

describe("usage discovery and stable identities", () => {
  it("joins static and CMS-brand repository paths to exact normalized legacy paths", () => {
    const staticTracked = trackedRasterFixture({
      semanticKey: "site.about.headshot",
      legacyPath: "images/about/headshot.webp",
      fileId: uuid(101),
      recordId: uuid(11),
      versionId: uuid(12),
      file: {
        filenameDownload: "headshot.webp",
        mimeType: "image/webp",
      },
      version: { mime_type: "image/webp", format: "webp" },
    });
    const brandTracked = trackedRasterFixture({
      semanticKey: "site.brand.logo",
      legacyPath: "brand/logo.svg",
      fileId: uuid(102),
      recordId: uuid(21),
      versionId: uuid(22),
      sha256: SHA_B,
      record: {
        kind: "svg",
        role: "brand",
        delivery_mode: "sanitized-svg-img",
        allowed_mime_families: ["image/svg+xml"],
      },
      file: { filenameDownload: "logo.svg", mimeType: "image/svg+xml" },
      version: {
        mime_type: "image/svg+xml",
        format: "svg",
        source_hash: SHA_C,
        sanitized_output_sha256: SHA_B,
        sanitizer_signature: SHA_D,
        safety_report: svgSafety({
          state: "declared-safe",
          policy: "svg-safe-v1",
          sourceSha256: SHA_C,
          sanitizerSignature: SHA_D,
          sanitizedOutputSha256: SHA_B,
        }),
      },
    });
    const staticAsset = repositoryAsset({
      id: "repo:apps/web/static/images/about/headshot.webp",
      repoPath: "apps/web/static/images/about/headshot.webp",
      sha256: SHA_A,
    });
    const brandAsset = repositoryAsset({
      id: "repo:apps/cms/brand/logo.svg",
      kind: "svg",
      repoPath: "apps/cms/brand/logo.svg",
      sha256: SHA_B,
    });
    const report = reconcileAssetAudit(
      auditInput({
        repository: repositoryScan({ assets: [staticAsset, brandAsset] }),
        dev: snapshot("dev", {
          records: [staticTracked.record, brandTracked.record],
          versions: [staticTracked.version, brandTracked.version],
          files: [staticTracked.file, brandTracked.file],
        }),
      }),
    );

    const staticRow = report.rows.find(
      (row) => row.legacyPath === "images/about/headshot.webp",
    );
    const brandRow = report.rows.find(
      (row) => row.legacyPath === "brand/logo.svg",
    );
    expect(staticRow?.sources.map((source) => source.kind)).toEqual(
      expect.arrayContaining(["repository-file", "directus-file"]),
    );
    expect(brandRow?.sources.map((source) => source.kind)).toEqual(
      expect.arrayContaining(["repository-file", "directus-file"]),
    );
  });

  it("keeps a 64-hex usage ID stable across source-line and version UUID churn", () => {
    const firstTracked = trackedRasterFixture({ versionId: uuid(2) });
    const secondTracked = trackedRasterFixture({ versionId: uuid(999) });
    const first = reconcileAssetAudit(
      auditInput({
        repository: repositoryScan({
          usages: [repositoryUsage({ sourceLine: 12 })],
        }),
        dev: snapshot("dev", {
          records: [firstTracked.record],
          versions: [firstTracked.version],
          files: [firstTracked.file],
        }),
      }),
    );
    const second = reconcileAssetAudit(
      auditInput({
        repository: repositoryScan({
          usages: [repositoryUsage({ sourceLine: 999 })],
        }),
        dev: snapshot("dev", {
          records: [secondTracked.record],
          versions: [secondTracked.version],
          files: [secondTracked.file],
        }),
      }),
    );

    expect(first.discoveredUsages).toHaveLength(1);
    expect(first.discoveredUsages[0]!.id).toMatch(/^[0-9a-f]{64}$/);
    expect(second.discoveredUsages[0]!.id).toBe(first.discoveredUsages[0]!.id);
  });

  it("groups a consumer slot before identity selection and hashes conflicts order-independently", () => {
    const first = repositoryUsage({
      id: "usage:z",
      assetId: null,
      semanticKey: null,
      unresolvedRef: "repository:apps/web/static/images/a.png",
      sourceLine: 50,
    });
    const second = repositoryUsage({
      id: "usage:a",
      assetId: null,
      semanticKey: null,
      unresolvedRef: "repository:apps/web/static/images/b.png",
      sourceLine: 10,
    });
    const run = (usages: readonly RepositoryUsage[]) =>
      reconcileAssetAudit(
        auditInput({
          repository: repositoryScan({ usages }),
          dev: snapshot("dev"),
        }),
      );
    const forward = run([first, second]);
    const reversed = run([second, first]);

    expect(forward.discoveredUsages).toHaveLength(1);
    const usage = forward.discoveredUsages[0]!;
    expect(usage.id).toMatch(/^[0-9a-f]{64}$/);
    expect(usage.evidenceUsageId).toBe("usage:a");
    expect(usage.sourceLine).toBe(10);
    expect(usage.semanticKey).toBeNull();
    expect(usage.assetRecordId).toBeNull();
    expect(usage.resolvedVersionId).toBeNull();
    expect(usage.unresolvedRef).toMatch(/^conflict-sha256:[0-9a-f]{64}$/);
    expect(usage.syncEligible).toBe(false);
    expect(reversed.discoveredUsages).toEqual(forward.discoveredUsages);
    expect(findings(reversed, "invalid-format")).toEqual(
      findings(forward, "invalid-format"),
    );
  });

  it("retains bounded sync-eligible semantic and repository references when records are missing", () => {
    const semanticUsage = repositoryUsage({ assetId: null });
    const path = "apps/web/static/images/untracked.png";
    const pathAsset = repositoryAsset({
      id: `repo:${path}`,
      repoPath: path,
      sha256: SHA_B,
    });
    const pathUsage = repositoryUsage({
      id: "usage:path",
      assetId: pathAsset.id,
      semanticKey: null,
      consumerKey: "secondary",
      slot: "thumbnail",
    });
    const report = reconcileAssetAudit(
      auditInput({
        repository: repositoryScan({
          assets: [pathAsset],
          usages: [semanticUsage, pathUsage],
        }),
        dev: snapshot("dev"),
      }),
    );

    const semanticResult = report.discoveredUsages.find(
      (usage) => usage.semanticKey === "site.demo.image",
    );
    const pathResult = report.discoveredUsages.find(
      (usage) => usage.consumerKey === "secondary",
    );
    expect(semanticResult).toEqual(
      expect.objectContaining({
        unresolvedRef: "semantic:site.demo.image",
        syncEligible: true,
      }),
    );
    expect(pathResult).toEqual(
      expect.objectContaining({
        unresolvedRef: `repository:${path}`,
        syncEligible: true,
      }),
    );
  });

  it("coalesces duplicate occurrences and applies OR, confidence, line, and alt conflict rules", () => {
    const optional = repositoryUsage({
      id: "usage:z",
      sourceLine: 20,
      required: false,
      confidence: "declared-dynamic",
      altTextOverride: "One",
    });
    const exact = repositoryUsage({
      id: "usage:a",
      sourceLine: 5,
      required: true,
      confidence: "exact-static",
      altTextOverride: "Two",
    });
    const tracked = trackedRasterFixture();
    const report = reconcileAssetAudit(
      auditInput({
        repository: repositoryScan({ usages: [optional, exact] }),
        dev: snapshot("dev", {
          records: [tracked.record],
          versions: [tracked.version],
          files: [tracked.file],
        }),
      }),
    );

    expect(report.discoveredUsages).toHaveLength(1);
    expect(report.discoveredUsages[0]).toEqual(
      expect.objectContaining({
        evidenceUsageId: "usage:a",
        sourceLine: 5,
        required: true,
        confidence: "exact-static",
        altTextOverride: null,
      }),
    );
    expectFinding(report, "missing-alt-text", "error");
  });

  it("keeps PROD usage discovery read-only and excludes inactive/CMS-intent references", () => {
    const active = cmsReference({ id: "cms:prod:active", environment: "prod" });
    const inactive = cmsReference({
      id: "cms:prod:inactive",
      environment: "prod",
      active: false,
    });
    const intent = cmsReference({
      id: "cms:prod:intent",
      environment: "prod",
      active: false,
      consumption: "cms-intent-only",
      field: "client_logos",
      slot: "client-logo",
    });
    const token = cmsReference({
      id: "cms:prod:token",
      environment: "prod",
      active: true,
      consumption: "non-asset-token",
      field: "future_token",
      fileId: null,
      rawRef: "phone",
    });
    const report = reconcileAssetAudit(
      auditInput({
        prod: snapshot("prod", {
          references: [active, inactive, intent, token],
          registryAvailability: "missing",
        }),
      }),
    );

    expect(
      report.discoveredUsages.map((usage) => usage.evidenceUsageId),
    ).toEqual([active.id]);
    expect(report.discoveredUsages[0]?.syncEligible).toBe(false);
  });
});

describe("origin, duplicate, generated, and environment classification", () => {
  it("does not call normal counterparts, derivations, replacement lineage, or inline roots duplicates", () => {
    const authored = repositoryAsset();
    const derivative = repositoryAsset({
      id: "repo:apps/web/static/images/demo.w480.webp",
      origin: "generated-file",
      repoPath: "apps/web/static/images/demo.w480.webp",
    });
    const inlineOne = repositoryAsset({
      id: "inline:1",
      kind: "svg",
      origin: "code-component",
      repoPath: "apps/web/src/lib/Demo.svelte",
      inlineSvgOrdinal: 1,
      sha256: SHA_B,
    });
    const inlineTwo = repositoryAsset({
      id: "inline:2",
      kind: "svg",
      origin: "code-component",
      repoPath: "apps/web/src/lib/Demo.svelte",
      inlineSvgOrdinal: 2,
      sha256: SHA_B,
    });
    const report = reconcileAssetAudit(
      auditInput({
        repository: repositoryScan({
          assets: [authored, derivative, inlineOne, inlineTwo],
          generatedFrom: [
            {
              outputAssetId: derivative.id,
              inputRef: authored.id,
              generator: "sharp",
              relation: "derived-from",
            },
          ],
        }),
        dev: snapshot("dev"),
        prod: snapshot("prod", {
          files: [cmsFile("prod", { fileId: uuid(777), sha256: SHA_A })],
        }),
      }),
    );

    expect(findings(report, "duplicate-content")).toHaveLength(0);
  });

  it("requires authored repository/component/publication tracking but excludes providers and exact mirrors", () => {
    const repo = repositoryAsset();
    const component = repositoryAsset({
      id: "component:Logo.svelte",
      kind: "code-component",
      origin: "code-component",
      repoPath: "apps/web/src/lib/Logo.svelte",
      sha256: SHA_B,
    });
    const publication = repositoryAsset({
      id: "publication:gbp/logo.png",
      origin: "external-publication",
      repoPath: "gbp-assets/logo.png",
      sha256: SHA_C,
    });
    const provider = repositoryAsset({
      id: "external:iconify:lucide:menu",
      kind: "svg",
      origin: "external-provider",
      repoPath: null,
      sha256: null,
      bytes: null,
    });
    const mirror = repositoryAsset({
      id: "mirror:logo",
      kind: "svg",
      origin: "cms-mirror",
      repoPath: "apps/cms/brand/logo.svg",
      sha256: SHA_D,
    });
    const trackedMirror = trackedRasterFixture({
      semanticKey: "site.brand.mirror",
      legacyPath: "brand/logo.svg",
      sha256: SHA_D,
      record: { kind: "svg", delivery_mode: "sanitized-svg-img" },
      version: { mime_type: "image/svg+xml", format: "svg" },
      file: { mimeType: "image/svg+xml", filenameDownload: "logo.svg" },
    });
    const report = reconcileAssetAudit(
      auditInput({
        repository: repositoryScan({
          assets: [repo, component, publication, provider, mirror],
        }),
        dev: snapshot("dev", {
          records: [trackedMirror.record],
          versions: [trackedMirror.version],
          files: [trackedMirror.file],
        }),
      }),
    );
    const untracked = findings(report, "untracked-repo-asset").map(
      (finding) => finding.identity,
    );
    expect(untracked).toEqual(
      expect.arrayContaining([
        repo.repoPath,
        component.repoPath,
        publication.repoPath,
      ]),
    );
    expect(untracked).not.toContain(provider.id);
    expect(untracked).not.toContain(mirror.repoPath);
  });

  it("does not report drift for equal bytes with different UUIDs", () => {
    const dev = cmsFile("dev", { fileId: uuid(111), sha256: SHA_A });
    const prod = cmsFile("prod", { fileId: uuid(222), sha256: SHA_A });
    const report = reconcileAssetAudit(
      auditInput({
        dev: snapshot("dev", { files: [dev] }),
        prod: snapshot("prod", { files: [prod] }),
      }),
    );
    expect(findings(report, "environment-drift")).toHaveLength(0);
  });

  it("reports one-sided files and keeps preset-only drift at warning severity", () => {
    const devPreset = {
      key: "card",
      fit: "cover",
      width: 640,
      height: 360,
      quality: 80,
      format: "webp",
      withoutEnlargement: true,
    } as NormalizedTransformPreset;
    const prodPreset = { ...devPreset, quality: 75 };
    const report = reconcileAssetAudit(
      auditInput({
        dev: snapshot("dev", {
          files: [cmsFile("dev", { legacyPath: "only-dev.png" })],
          transformPresets: [devPreset],
        }),
        prod: snapshot("prod", { transformPresets: [prodPreset] }),
      }),
    );
    const drift = findings(report, "environment-drift");
    expect(drift.some((finding) => finding.severity === "warning")).toBe(true);
    expect(
      drift.some((finding) =>
        JSON.stringify(finding.evidence).includes("quality"),
      ),
    ).toBe(true);
  });

  it("distinguishes missing generated fingerprints, stale hashes, and required metadata", () => {
    const output = repositoryAsset({
      id: "repo:apps/web/static/og/demo.png",
      origin: "generated-file",
      repoPath: "apps/web/static/og/demo.png",
      sha256: SHA_B,
    });
    const report = reconcileAssetAudit(
      auditInput({
        repository: repositoryScan({ assets: [output] }),
        generatedOutputs: [
          generatedOutput({
            expectedOutputSha256: null,
            expectedInputHash: null,
            required: false,
          }),
          generatedOutput({
            outputAssetId: "repo:apps/web/static/og/demo-metadata.png",
            expectedOutputSha256: SHA_A,
            observedMetadataState: "missing",
          }),
        ],
      }),
    );
    const stale = findings(report, "stale-generated-output");
    expect(stale.some((finding) => finding.severity === "warning")).toBe(true);
    expect(stale.some((finding) => finding.severity === "error")).toBe(true);
    expect(report.scopeReceipts).toContainEqual({
      scope: "generated-outputs",
      status: "not-evaluated",
      reason: "supplemental-evidence-missing",
    });
  });

  it("validates generated OG MIME and exact 1200x630 metadata", () => {
    const output = repositoryAsset({
      id: "repo:apps/web/static/og/demo.png",
      origin: "generated-file",
      repoPath: "apps/web/static/og/demo.png",
      sha256: SHA_A,
    });
    const valid = reconcileAssetAudit(
      auditInput({
        repository: repositoryScan({ assets: [output] }),
        generatedOutputs: [generatedOutput()],
      }),
    );
    expect(findings(valid, "invalid-dimensions")).toHaveLength(0);
    expect(findings(valid, "invalid-format")).toHaveLength(0);

    const invalid = reconcileAssetAudit(
      auditInput({
        repository: repositoryScan({ assets: [output] }),
        generatedOutputs: [
          generatedOutput({
            observedMimeType: "image/webp",
            observedWidth: 1200,
            observedHeight: 628,
          }),
        ],
      }),
    );
    expectFinding(invalid, "invalid-format", "error");
    expectFinding(invalid, "invalid-dimensions", "error");
  });
});

describe("accessibility and policy evidence", () => {
  it("accepts decorative images only with literal empty alt and rejects informative empty alt", () => {
    const decorative = trackedRasterFixture({
      record: { alt_mode: "decorative" },
    });
    const decorativeReport = reconcileAssetAudit(
      auditInput({
        repository: repositoryScan({
          usages: [repositoryUsage({ altTextOverride: "", altSource: null })],
        }),
        dev: snapshot("dev", {
          records: [decorative.record],
          versions: [decorative.version],
          files: [decorative.file],
        }),
      }),
    );
    expect(findings(decorativeReport, "missing-alt-text")).toHaveLength(0);

    const informative = trackedRasterFixture({
      record: { alt_mode: "informative" },
    });
    const informativeReport = reconcileAssetAudit(
      auditInput({
        repository: repositoryScan({
          usages: [repositoryUsage({ altTextOverride: "", altSource: null })],
        }),
        dev: snapshot("dev", {
          records: [informative.record],
          versions: [informative.version],
          files: [informative.file],
          translations: [translation({ alt_text: "" })],
        }),
      }),
    );
    expectFinding(informativeReport, "missing-alt-text", "error");
  });

  it("requires EN for global, EN/FR/ES for localized, and never substitutes captions", () => {
    const localized = trackedRasterFixture({
      record: { alt_mode: "informative", locale_policy: "localized" },
    });
    const report = reconcileAssetAudit(
      auditInput({
        repository: repositoryScan({ usages: [repositoryUsage()] }),
        dev: snapshot("dev", {
          records: [localized.record],
          versions: [localized.version],
          files: [localized.file],
          translations: [
            translation({ languages_code: "en", alt_text: "English" }),
            translation({
              id: uuid(301),
              languages_code: "fr",
              alt_text: "Français",
            }),
            translation({
              id: uuid(302),
              languages_code: "es",
              alt_text: null,
              caption: "Una leyenda no es texto alternativo",
            }),
          ],
        }),
      }),
    );
    expect(
      findings(report, "missing-alt-text").some(
        (finding) => finding.evidence.locale === "es",
      ),
    ).toBe(true);
  });

  it("accepts a literal usage override or proven contextual CMS alt but warns on dynamic-only evidence", () => {
    const tracked = trackedRasterFixture({
      record: { alt_mode: "usage-supplied", locale_policy: "usage-supplied" },
    });
    const literal = reconcileAssetAudit(
      auditInput({
        repository: repositoryScan({
          usages: [
            repositoryUsage({ altTextOverride: "Portrait", altSource: null }),
          ],
        }),
        dev: snapshot("dev", {
          records: [tracked.record],
          versions: [tracked.version],
          files: [tracked.file],
        }),
      }),
    );
    expect(findings(literal, "missing-alt-text")).toHaveLength(0);

    const contextual = reconcileAssetAudit(
      auditInput({
        dev: snapshot("dev", {
          records: [tracked.record],
          versions: [tracked.version],
          files: [tracked.file],
          references: [
            cmsReference({
              deliveryMode: "local-img",
              slot: "hero",
              contextualAlt: "Contextual portrait",
              altSource: "projects_translations.title",
            }),
          ],
        }),
      }),
    );
    expect(findings(contextual, "missing-alt-text")).toHaveLength(0);

    const dynamic = reconcileAssetAudit(
      auditInput({
        repository: repositoryScan({
          usages: [
            repositoryUsage({
              required: false,
              altTextOverride: null,
              altSource: "project.title",
            }),
          ],
        }),
        dev: snapshot("dev", {
          records: [tracked.record],
          versions: [tracked.version],
          files: [tracked.file],
        }),
      }),
    );
    expectFinding(dynamic, "missing-alt-text", "warning");
  });
});

describe("SVG evidence classification", () => {
  function svgFixture(options: {
    semanticKey: string;
    deliveryMode:
      | "sanitized-svg-img"
      | "tokenized-inline-svg"
      | "inline-svg"
      | "code-component";
    sourceMode?: "upload" | "code-component";
    safety?: Record<string, unknown>;
    version?: Partial<NormalizedAssetVersion>;
    record?: Partial<NormalizedAssetRecord>;
  }) {
    const sourceMode = options.sourceMode ?? "upload";
    const isComponent = sourceMode === "code-component";
    const componentKey = isComponent ? "Logo.svelte" : null;
    const tracked = trackedRasterFixture({
      semanticKey: options.semanticKey,
      record: {
        kind: isComponent ? "code-component" : "svg",
        role: "illustration",
        code_component_key: componentKey,
        delivery_mode: options.deliveryMode,
        approved_token_slots:
          options.deliveryMode === "tokenized-inline-svg"
            ? ["brand-primary", "brand-accent"]
            : null,
        allowed_mime_families: isComponent ? null : ["image/svg+xml"],
        ...options.record,
      },
      version: {
        source_mode: sourceMode,
        directus_file: isComponent ? null : uuid(100),
        component_key: componentKey,
        mime_type: isComponent ? null : "image/svg+xml",
        format: isComponent ? null : "svg",
        source_hash: SHA_C,
        sanitized_output_sha256: isComponent ? null : SHA_A,
        sanitizer_signature: isComponent ? null : SHA_D,
        transform_signature:
          options.deliveryMode === "tokenized-inline-svg" ? SHA_E : null,
        brand_slots:
          options.deliveryMode === "tokenized-inline-svg"
            ? ["brand-primary"]
            : null,
        safety_report: svgSafety({
          state: "declared-safe",
          policy: "svg-safe-v1",
          sourceSha256: isComponent ? SHA_A : SHA_C,
          sanitizerSignature: isComponent ? null : SHA_D,
          sanitizedOutputSha256: isComponent ? null : SHA_A,
          transformSignature:
            options.deliveryMode === "tokenized-inline-svg" ? SHA_E : null,
          ...options.safety,
        }),
        ...options.version,
      },
      file: {
        mimeType: "image/svg+xml",
        filenameDownload: "demo.svg",
      },
    });
    return tracked;
  }

  it("accepts reviewed code-component, sanitized-image, and tokenized-inline proof equality", () => {
    const component = svgFixture({
      semanticKey: "site.logo.component",
      deliveryMode: "code-component",
      sourceMode: "code-component",
    });
    const sanitized = svgFixture({
      semanticKey: "site.logo.sanitized",
      deliveryMode: "sanitized-svg-img",
      record: { owner_key: "sanitized" },
    });
    const tokenized = svgFixture({
      semanticKey: "site.logo.tokenized",
      deliveryMode: "tokenized-inline-svg",
      record: { owner_key: "tokenized" },
    });
    const componentAsset = repositoryAsset({
      id: "component:Logo.svelte",
      kind: "code-component",
      origin: "code-component",
      repoPath: "apps/web/src/lib/Logo.svelte",
      sha256: SHA_A,
    });
    const usages = [
      repositoryUsage({
        id: "usage:component",
        assetId: componentAsset.id,
        semanticKey: semantic("site.logo.component"),
        consumerKey: "component",
        deliveryMode: "code-component",
      }),
      repositoryUsage({
        id: "usage:sanitized",
        semanticKey: semantic("site.logo.sanitized"),
        consumerKey: "sanitized",
        deliveryMode: "sanitized-svg-img",
      }),
      repositoryUsage({
        id: "usage:tokenized",
        semanticKey: semantic("site.logo.tokenized"),
        consumerKey: "tokenized",
        deliveryMode: "tokenized-inline-svg",
      }),
    ];
    const report = reconcileAssetAudit(
      auditInput({
        repository: repositoryScan({ assets: [componentAsset], usages }),
        dev: snapshot("dev", {
          records: [component.record, sanitized.record, tokenized.record],
          versions: [component.version, sanitized.version, tokenized.version],
          files: [sanitized.file, tokenized.file],
        }),
      }),
    );
    expect(findings(report, "unsafe-svg")).toHaveLength(0);
  });

  it("rejects mismatched sanitizer/output/source/transform proofs and token slots", () => {
    const mismatched = svgFixture({
      semanticKey: "site.logo.tokenized",
      deliveryMode: "tokenized-inline-svg",
      version: {
        sanitized_output_sha256: SHA_B,
        transform_signature: SHA_C,
        brand_slots: ["unapproved-slot"],
      },
    });
    const report = reconcileAssetAudit(
      auditInput({
        repository: repositoryScan({
          usages: [
            repositoryUsage({
              semanticKey: semantic("site.logo.tokenized"),
              deliveryMode: "tokenized-inline-svg",
            }),
          ],
        }),
        dev: snapshot("dev", {
          records: [mismatched.record],
          versions: [mismatched.version],
          files: [mismatched.file],
        }),
      }),
    );
    const finding = expectFinding(report, "unsafe-svg", "error");
    expect(finding.evidence.missingOrMismatchedProofs).toEqual(
      expect.arrayContaining([
        "sanitized-output-sha256",
        "transform-signature",
        "approved-token-slots",
      ]),
    );
  });

  it("treats rejected evidence as unsafe and unknown optional evidence as warning", () => {
    const rejected = svgFixture({
      semanticKey: "site.logo.rejected",
      deliveryMode: "sanitized-svg-img",
      safety: { state: "rejected", reasons: ["script-element"] },
    });
    const unknown = svgFixture({
      semanticKey: "site.logo.unknown",
      deliveryMode: "sanitized-svg-img",
      safety: { state: "unknown", reasons: ["not-reviewed"] },
      record: { owner_key: "unknown" },
    });
    const report = reconcileAssetAudit(
      auditInput({
        repository: repositoryScan({
          usages: [
            repositoryUsage({
              id: "usage:rejected",
              semanticKey: semantic("site.logo.rejected"),
              deliveryMode: "sanitized-svg-img",
            }),
            repositoryUsage({
              id: "usage:unknown",
              semanticKey: semantic("site.logo.unknown"),
              consumerKey: "unknown",
              sourceFile: "apps/cms/scripts/svg-preview.ts",
              deliveryMode: "sanitized-svg-img",
              required: false,
            }),
          ],
        }),
        dev: snapshot("dev", {
          records: [rejected.record, unknown.record],
          versions: [rejected.version, unknown.version],
          files: [rejected.file, unknown.file],
        }),
      }),
    );
    expect(
      findings(report, "unsafe-svg").some(
        (finding) => finding.severity === "error",
      ),
    ).toBe(true);
    expect(
      findings(report, "unsafe-svg").some(
        (finding) => finding.severity === "warning",
      ),
    ).toBe(true);
  });

  it("links sink-shaped evidence only to an SVG identity and ignores a generic DOM sink", () => {
    const svg = repositoryAsset({
      id: "repo:apps/web/static/svg/demo.svg",
      kind: "svg",
      repoPath: "apps/web/static/svg/demo.svg",
    });
    const linked = reconcileAssetAudit(
      auditInput({
        repository: repositoryScan({
          assets: [svg],
          usages: [
            repositoryUsage({
              assetId: svg.id,
              semanticKey: null,
              unresolvedRef: "repository:apps/web/static/svg/demo.svg",
              deliveryMode: "inline-svg",
            }),
          ],
          findings: [
            repositoryFinding({
              code: "unsupported-pattern",
              rawRef: "node.innerHTML = svg",
            }),
          ],
        }),
        dev: snapshot("dev"),
      }),
    );
    expectFinding(linked, "unsafe-svg", "error");

    const generic = reconcileAssetAudit(
      auditInput({
        repository: repositoryScan({
          findings: [
            repositoryFinding({
              code: "unsupported-pattern",
              rawRef: "node.innerHTML = text",
            }),
          ],
        }),
        dev: snapshot("dev"),
      }),
    );
    expect(findings(generic, "unsafe-svg")).toHaveLength(0);
  });

  it("accepts raw insertion only when the exact declared usage ties to verified output identity", () => {
    const tracked = svgFixture({
      semanticKey: "site.logo.verified",
      deliveryMode: "inline-svg",
    });
    const inserted = repositoryAsset({
      id: "repo:apps/web/static/svg/verified.svg",
      kind: "svg",
      repoPath: "apps/web/static/svg/verified.svg",
      sha256: SHA_A,
    });
    const usage = repositoryUsage({
      id: "declared:site.logo.verified",
      assetId: inserted.id,
      semanticKey: semantic("site.logo.verified"),
      sourceKind: "declaration",
      sourceFile: "apps/web/src/lib/Verified.svelte#verifiedSvg",
      deliveryMode: "inline-svg",
      confidence: "declared-dynamic",
    });
    const report = reconcileAssetAudit(
      auditInput({
        repository: repositoryScan({
          assets: [inserted],
          usages: [usage],
          findings: [
            repositoryFinding({
              sourceFile: usage.sourceFile,
              code: "unsupported-pattern",
              rawRef: "{@html verifiedSvg}",
            }),
          ],
        }),
        dev: snapshot("dev", {
          records: [tracked.record],
          versions: [tracked.version],
          files: [tracked.file],
        }),
      }),
    );
    expect(findings(report, "unsafe-svg")).toHaveLength(0);
  });
});

describe("OG coverage grammar and resolution", () => {
  function setRow(
    matrix: OgCoverageRequirement[],
    usageKey: string,
    patch: Partial<OgCoverageRequirement>,
  ) {
    const index = matrix.findIndex((row) => row.usageKey === usageKey);
    if (index < 0) throw new Error(`Missing OG fixture row ${usageKey}`);
    matrix[index] = { ...matrix[index]!, ...patch };
  }

  it("accepts exactly 25 groups with EN/FR/ES and rejects malformed matrices", () => {
    expect(() => reconcileAssetAudit(auditInput())).not.toThrow();
    const missing = ogMatrix().slice(0, -1);
    expect(() =>
      reconcileAssetAudit(auditInput({ ogCoverage: missing })),
    ).toThrow();

    const duplicate = ogMatrix();
    duplicate[1] = { ...duplicate[0]! };
    expect(() =>
      reconcileAssetAudit(auditInput({ ogCoverage: duplicate })),
    ).toThrow();

    const emptyCandidate = ogMatrix();
    emptyCandidate[0] = { ...emptyCandidate[0]!, semanticCandidates: [] };
    expect(() =>
      reconcileAssetAudit(auditInput({ ogCoverage: emptyCandidate })),
    ).toThrow();

    const contradictory = ogMatrix();
    contradictory[0] = { ...contradictory[0]!, required: true };
    expect(() =>
      reconcileAssetAudit(auditInput({ ogCoverage: contradictory })),
    ).toThrow();
  });

  it("resolves a direct repository OG only with same owner/route/locale/fixed-slot proof", () => {
    const matrix = ogMatrix();
    const usageKey = "route.og.slot-01.en";
    const path = "apps/web/static/og/slot-01-en.png";
    setRow(matrix, usageKey, {
      required: true,
      exclusionReason: null,
      currentRef: { kind: "repository-path", repoPath: path },
      proofUsageId: "usage:og-direct",
    });
    const asset = repositoryAsset({ id: `repo:${path}`, repoPath: path });
    const usage = repositoryUsage({
      id: "usage:og-direct",
      assetId: asset.id,
      semanticKey: null,
      consumerType: "route",
      consumerKey: "slot-01",
      route: "/routes/slot-01",
      locale: "en",
      slot: "og-image",
      deliveryMode: "og-meta",
    });
    const report = reconcileAssetAudit(
      auditInput({
        repository: repositoryScan({ assets: [asset], usages: [usage] }),
        ogCoverage: matrix,
      }),
    );
    expect(
      findings(report, "missing-og-coverage").some(
        (finding) => finding.identity === usageKey,
      ),
    ).toBe(false);
    expect(
      report.discoveredUsages.some((item) => item.evidenceUsageId === usage.id),
    ).toBe(true);
  });

  it("resolves same-locale fallback after its target and rejects cycles and cross-locale fallback", () => {
    const matrix = ogMatrix();
    const sourceKey = "route.og.slot-01.en";
    const fallbackKey = "route.og.slot-02.en";
    const path = "apps/web/static/og/fallback.png";
    setRow(matrix, sourceKey, {
      required: true,
      exclusionReason: null,
      fallbackUsageKey: fallbackKey,
    });
    setRow(matrix, fallbackKey, {
      required: true,
      exclusionReason: null,
      currentRef: { kind: "repository-path", repoPath: path },
      proofUsageId: "usage:fallback",
    });
    const asset = repositoryAsset({ id: `repo:${path}`, repoPath: path });
    const usage = repositoryUsage({
      id: "usage:fallback",
      assetId: asset.id,
      semanticKey: null,
      consumerType: "route",
      consumerKey: "slot-02",
      route: "/routes/slot-02",
      locale: "en",
      slot: "og-image",
      deliveryMode: "og-meta",
    });
    const valid = reconcileAssetAudit(
      auditInput({
        repository: repositoryScan({ assets: [asset], usages: [usage] }),
        ogCoverage: matrix,
      }),
    );
    expect(
      findings(valid, "missing-og-coverage").some(
        (finding) => finding.identity === sourceKey,
      ),
    ).toBe(false);

    const cycle = structuredClone(matrix);
    setRow(cycle, fallbackKey, {
      currentRef: null,
      fallbackUsageKey: sourceKey,
    });
    expect(() =>
      reconcileAssetAudit(auditInput({ ogCoverage: cycle })),
    ).toThrow();
    const crossLocale = ogMatrix();
    setRow(crossLocale, sourceKey, {
      required: true,
      exclusionReason: null,
      fallbackUsageKey: "route.og.slot-02.fr",
    });
    expect(() =>
      reconcileAssetAudit(auditInput({ ogCoverage: crossLocale })),
    ).toThrow();
  });

  it("proves closed blog and project runtime routes through only their exact template declarations", () => {
    const matrix = ogMatrix();
    for (const locale of ["en", "fr", "es"] as const) {
      setRow(matrix, `route.og.slot-03.${locale}`, {
        route: "/blog/hello-world",
        ownerType: "blog",
        ownerKey: "hello-world",
        required: true,
        exclusionReason: null,
        currentRef: {
          kind: "runtime-route",
          route: "/og/blog/hello-world.png",
        },
        proofUsageId: "declared:site.og.runtime-blog",
      });
      setRow(matrix, `route.og.slot-04.${locale}`, {
        route: "/projects/metro-map",
        ownerType: "project",
        ownerKey: "metro-map",
        required: true,
        exclusionReason: null,
        currentRef: {
          kind: "runtime-route",
          route:
            locale === "en"
              ? "/og/project/metro-map.png"
              : `/og/project/metro-map.png?locale=${locale}`,
        },
        proofUsageId: "declared:site.og.runtime-project",
      });
    }
    const declarations = [
      repositoryUsage({
        id: "declared:site.og.runtime-blog",
        assetId: null,
        semanticKey: semantic("site.og.runtime-blog"),
        confidence: "declared-dynamic",
        consumerType: "blog",
        consumerKey: "runtime-blog",
        sourceKind: "declaration",
        sourceFile: "apps/web/src/routes/og/blog/[slug]/+server.ts",
        sourceLine: null,
        route: "/blog/[slug]",
        locale: null,
        slot: "og-image",
        deliveryMode: "og-meta",
      }),
      repositoryUsage({
        id: "declared:site.og.runtime-project",
        assetId: null,
        semanticKey: semantic("site.og.runtime-project"),
        confidence: "declared-dynamic",
        consumerType: "project",
        consumerKey: "runtime-project",
        sourceKind: "declaration",
        sourceFile: "apps/web/src/routes/og/project/[slug]/+server.ts",
        sourceLine: null,
        route: "/projects/[slug]",
        locale: null,
        slot: "og-image",
        deliveryMode: "og-meta",
      }),
    ];
    const valid = reconcileAssetAudit(
      auditInput({
        repository: repositoryScan({ usages: declarations }),
        ogCoverage: matrix,
      }),
    );
    for (const group of ["slot-03", "slot-04"]) {
      expect(
        findings(valid, "missing-og-coverage").some((finding) =>
          finding.identity.includes(group),
        ),
      ).toBe(false);
    }

    const invalid = structuredClone(matrix);
    setRow(invalid, "route.og.slot-03.en", {
      currentRef: {
        kind: "runtime-route",
        route: "/og/blog/wrong-slug.png?locale=en",
      },
    });
    setRow(invalid, "route.og.slot-04.fr", {
      currentRef: { kind: "runtime-route", route: "/og/project/metro-map.png" },
    });
    const invalidReport = reconcileAssetAudit(
      auditInput({
        repository: repositoryScan({ usages: declarations }),
        ogCoverage: invalid,
      }),
    );
    expect(
      findings(invalidReport, "missing-og-coverage").map(
        (finding) => finding.identity,
      ),
    ).toEqual(
      expect.arrayContaining(["route.og.slot-03.en", "route.og.slot-04.fr"]),
    );
  });

  it("requires locale OG alt proof and checks expected input hash on the chosen semantic version", () => {
    const matrix = ogMatrix();
    const tracked = trackedRasterFixture({
      semanticKey: "route.og.slot-01",
      record: {
        role: "og",
        locale_policy: "localized",
        alt_mode: "informative",
        delivery_mode: "og-meta",
      },
      version: { input_hash: SHA_A },
    });
    setRow(matrix, "route.og.slot-01.en", {
      required: true,
      exclusionReason: null,
      expectedInputHash: SHA_B,
    });
    const report = reconcileAssetAudit(
      auditInput({
        dev: snapshot("dev", {
          records: [tracked.record],
          versions: [tracked.version],
          files: [tracked.file],
          translations: [
            translation({
              asset_records_id: tracked.record.id,
              languages_code: "en",
              og_image_alt: null,
            }),
          ],
        }),
        ogCoverage: matrix,
      }),
    );
    expectFinding(report, "missing-alt-text", "error");
    expectFinding(report, "stale-generated-output", "error");
    expectFinding(report, "missing-og-coverage", "error");
  });
});

describe("fingerprint stability", () => {
  it("normalizes stable approved evidence and excludes requiredScopes from the fingerprint input", () => {
    const input = {
      schemaVersion: 1 as const,
      code: "missing-record" as const,
      identity: "site.demo.image|usage-id",
      evidence: {
        semanticKey: "site.demo.image",
        consumer: "component:demo",
        route: "/",
        locale: "en",
        slot: "hero",
        required: true,
      },
    };
    const first = fingerprintAssetFinding(input);
    const second = fingerprintAssetFinding({
      ...input,
      evidence: {
        required: true,
        slot: "hero",
        locale: "en",
        route: "/",
        consumer: "component:demo",
        semanticKey: "site.demo.image",
      },
    });
    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(second).toBe(first);
  });

  it("shares one evidence projector while preserving ordered OG candidate priority", () => {
    expect(
      ASSET_FINDING_EVIDENCE_POLICY["missing-og-coverage"].orderedArrays,
    ).toEqual(["orderedCandidates"]);
    expect(
      projectAssetFindingEvidence("missing-record", {
        semanticKey: "site.demo.image",
        consumer: "component:demo",
        route: "/",
        locale: "en",
        slot: "hero",
        required: true,
        sourceLine: 999,
        authorization: "SECRET",
      }),
    ).toEqual({
      semanticKey: "site.demo.image",
      consumer: "component:demo",
      route: "/",
      locale: "en",
      slot: "hero",
      required: true,
    });

    const ogInput = {
      schemaVersion: 1 as const,
      code: "missing-og-coverage" as const,
      identity: "route.og.demo.en",
      evidence: {
        route: "/demo",
        locale: "en",
        owner: "route:demo",
        orderedCandidates: ["route.og.first", "route.og.second"],
        proofState: "missing",
        fallbackState: "absent",
      },
    };
    expect(
      fingerprintAssetFinding({
        ...ogInput,
        evidence: {
          ...ogInput.evidence,
          orderedCandidates: [...ogInput.evidence.orderedCandidates].reverse(),
        },
      }),
    ).not.toBe(fingerprintAssetFinding(ogInput));

    const unordered = {
      schemaVersion: 1 as const,
      code: "missing-version" as const,
      identity: "site.demo.image",
      evidence: {
        lifecycle: "approved",
        selectedPointerKind: "approved_version",
        invalidInvariants: ["z", "a", "z"],
      },
    };
    expect(
      fingerprintAssetFinding({
        ...unordered,
        evidence: {
          ...unordered.evidence,
          invalidInvariants: ["a", "z"],
        },
      }),
    ).toBe(fingerprintAssetFinding(unordered));
  });
});

describe("independent review regressions", () => {
  it("maps unmatched Task 4 findings and preserves a finding-only /assets UUID as hardcoded", () => {
    const fileId = uuid(456);
    const repository = repositoryScan({
      findings: [
        repositoryFinding({
          code: "dynamic-reference",
          sourceLine: 10,
          rawRef: "/images/${slug}.png",
        }),
        repositoryFinding({
          code: "missing-target",
          sourceLine: 11,
          rawRef: "/images/missing.png",
        }),
        repositoryFinding({
          code: "undeclared-external",
          sourceLine: 12,
          rawRef: "https://cdn.example.test/asset.png",
        }),
        repositoryFinding({
          code: "unsupported-pattern",
          sourceLine: 13,
          rawRef: "/images/untracked.avif",
        }),
        repositoryFinding({
          code: "unsupported-pattern",
          sourceLine: 14,
          rawRef: `/assets/${fileId}`,
        }),
      ],
    });
    const report = reconcileAssetAudit(
      auditInput({ repository, dev: snapshot("dev") }),
    );

    expect(findings(report, "unresolved-dynamic-usage")).toHaveLength(4);
    expect(findings(report, "hardcoded-file-id")).toHaveLength(1);
    expect(findings(report, "hardcoded-file-id")[0]?.identity).toContain(
      fileId,
    );
  });

  it("correlates declarations by the exact expression anchor rather than reason text or route metadata", () => {
    const sourceFile = "apps/web/src/lib/Demo.svelte#img-src:heroImage";
    const unknown = repositoryUsage({
      id: "usage:unknown-seam",
      assetId: null,
      unresolvedRef: "runtime-selected-file",
      confidence: "unknown",
      sourceFile,
    });
    const declaration = repositoryUsage({
      id: "declared:site.demo.image",
      assetId: null,
      unresolvedRef: "declaration-reason-is-different",
      confidence: "declared-dynamic",
      sourceKind: "declaration",
      sourceFile,
    });
    const matched = reconcileAssetAudit(
      auditInput({
        repository: repositoryScan({ usages: [unknown, declaration] }),
        dev: snapshot("dev"),
      }),
    );
    expect(findings(matched, "unresolved-dynamic-usage")).toHaveLength(0);

    const wrongSeam = reconcileAssetAudit(
      auditInput({
        repository: repositoryScan({
          usages: [
            unknown,
            {
              ...declaration,
              unresolvedRef: unknown.unresolvedRef,
              sourceFile: "apps/web/src/lib/Demo.svelte#img-src:unrelatedImage",
            },
          ],
        }),
        dev: snapshot("dev"),
      }),
    );
    expect(findings(wrongSeam, "unresolved-dynamic-usage")).toHaveLength(1);
  });

  it("keeps SVG safety not evaluated when a required proof scope is incomplete", () => {
    const receipts = completeReceipts().map((receipt) =>
      receipt.surface === "route_seo"
        ? {
            ...receipt,
            availability: "failed" as const,
            complete: false,
            rowCount: null,
          }
        : receipt,
    );
    const svg = repositoryAsset({
      id: "repo:apps/web/static/svg/review.svg",
      kind: "svg",
      repoPath: "apps/web/static/svg/review.svg",
    });
    const report = reconcileAssetAudit(
      auditInput({
        repository: repositoryScan({
          assets: [svg],
          usages: [
            repositoryUsage({
              assetId: svg.id,
              semanticKey: semantic("site.review.svg"),
              deliveryMode: "inline-svg",
            }),
          ],
        }),
        dev: snapshot("dev", {
          readReceipts: receipts,
          readIssues: [
            {
              code: "request-failed",
              environment: "dev",
              operation: "readPage:route_seo",
              status: 503,
              entityKey: null,
            },
          ],
        }),
      }),
    );
    expect(report.scopeReceipts).toContainEqual({
      scope: "svg-safety",
      status: "not-evaluated",
      reason: "request-failed",
    });
  });

  it("rejects one verified raw SVG identity when another sink-shaped insertion shares the module", () => {
    const tracked = trackedRasterFixture({
      semanticKey: "site.review.svg",
      record: {
        kind: "svg",
        delivery_mode: "inline-svg",
        allowed_mime_families: ["image/svg+xml"],
      },
      version: {
        mime_type: "image/svg+xml",
        format: "svg",
        source_hash: SHA_C,
        sanitized_output_sha256: SHA_A,
        sanitizer_signature: SHA_D,
        safety_report: svgSafety({
          state: "declared-safe",
          policy: "svg-safe-v1",
          sourceSha256: SHA_C,
          sanitizerSignature: SHA_D,
          sanitizedOutputSha256: SHA_A,
        }),
      },
      file: { mimeType: "image/svg+xml", filenameDownload: "review.svg" },
    });
    const asset = repositoryAsset({
      id: "repo:apps/web/static/svg/review.svg",
      kind: "svg",
      repoPath: "apps/web/static/svg/review.svg",
      sha256: SHA_A,
    });
    const usage = repositoryUsage({
      id: "declared:site.review.svg",
      assetId: asset.id,
      semanticKey: semantic("site.review.svg"),
      sourceKind: "declaration",
      sourceFile: "apps/web/src/lib/Review.svelte#verifiedSvg",
      sourceLine: 12,
      deliveryMode: "inline-svg",
      confidence: "declared-dynamic",
    });
    const report = reconcileAssetAudit(
      auditInput({
        repository: repositoryScan({
          assets: [asset],
          usages: [usage],
          findings: [
            repositoryFinding({
              sourceFile: usage.sourceFile,
              sourceLine: 12,
              code: "unsupported-pattern",
              rawRef: "{@html verifiedSvg}",
            }),
            repositoryFinding({
              sourceFile: usage.sourceFile,
              sourceLine: 99,
              code: "unsupported-pattern",
              rawRef: "{@html unverifiedSvg}",
            }),
          ],
        }),
        dev: snapshot("dev", {
          records: [tracked.record],
          versions: [tracked.version],
          files: [tracked.file],
        }),
      }),
    );
    expect(findings(report, "unsafe-svg")).toHaveLength(1);
  });

  it("binds OG proof to the chosen source, rejects excluded fallback, and flags missing input proof", () => {
    const matrix = ogMatrix();
    const sourceKey = "route.og.slot-01.en";
    const fallbackKey = "route.og.slot-02.en";
    const currentPath = "apps/web/static/og/current.png";
    const wrongPath = "apps/web/static/og/wrong.png";
    matrix[0] = {
      ...matrix[0]!,
      required: true,
      exclusionReason: null,
      currentRef: { kind: "repository-path", repoPath: currentPath },
      proofUsageId: "usage:wrong-proof",
      expectedInputHash: SHA_A,
    };
    const current = repositoryAsset({
      id: `repo:${currentPath}`,
      repoPath: currentPath,
    });
    const wrong = repositoryAsset({
      id: `repo:${wrongPath}`,
      repoPath: wrongPath,
      sha256: SHA_B,
    });
    const wrongProof = repositoryUsage({
      id: "usage:wrong-proof",
      assetId: wrong.id,
      semanticKey: null,
      consumerType: "route",
      consumerKey: "slot-01",
      route: "/routes/slot-01",
      locale: "en",
      slot: "og-image",
      deliveryMode: "og-meta",
    });
    const mismatched = reconcileAssetAudit(
      auditInput({
        repository: repositoryScan({
          assets: [current, wrong],
          usages: [wrongProof],
        }),
        ogCoverage: matrix,
      }),
    );
    expect(
      findings(mismatched, "missing-og-coverage").some(
        (finding) => finding.identity === sourceKey,
      ),
    ).toBe(true);

    const fallbackMatrix = ogMatrix();
    fallbackMatrix[0] = {
      ...fallbackMatrix[0]!,
      required: true,
      exclusionReason: null,
      fallbackUsageKey: fallbackKey,
    };
    const excludedFallback = reconcileAssetAudit(
      auditInput({ ogCoverage: fallbackMatrix }),
    );
    expect(
      findings(excludedFallback, "missing-og-coverage").some(
        (finding) => finding.identity === sourceKey,
      ),
    ).toBe(true);

    const validProofMatrix = ogMatrix();
    validProofMatrix[0] = {
      ...validProofMatrix[0]!,
      required: true,
      exclusionReason: null,
      currentRef: { kind: "repository-path", repoPath: currentPath },
      proofUsageId: "usage:current-proof",
      expectedInputHash: SHA_A,
    };
    const currentProof = {
      ...wrongProof,
      id: "usage:current-proof",
      assetId: current.id,
    };
    const unverifiable = reconcileAssetAudit(
      auditInput({
        repository: repositoryScan({
          assets: [current],
          usages: [currentProof],
        }),
        ogCoverage: validProofMatrix,
      }),
    );
    expect(
      findings(unverifiable, "stale-generated-output").some(
        (finding) => finding.identity === sourceKey,
      ),
    ).toBe(true);
  });

  it("does not use a CMS version hash when a required generated repository output is absent", () => {
    const tracked = trackedRasterFixture({
      semanticKey: "site.og.demo",
      version: { input_hash: SHA_B },
    });
    const report = reconcileAssetAudit(
      auditInput({
        dev: snapshot("dev", {
          records: [tracked.record],
          versions: [tracked.version],
          files: [tracked.file],
        }),
        generatedOutputs: [generatedOutput()],
      }),
    );
    const finding = expectFinding(report, "stale-generated-output", "error");
    expect(finding.evidence.observedOutputSha256).toBeNull();
  });

  it("compares version format plus actual file MIME and extension", () => {
    const tracked = trackedRasterFixture({
      version: { mime_type: "image/png", format: "webp" },
      file: {
        mimeType: "image/svg+xml",
        filenameDownload: "demo.svg",
        filenameDisk: `${uuid(100)}.svg`,
      },
    });
    const report = reconcileAssetAudit(
      auditInput({
        repository: repositoryScan({ usages: [repositoryUsage()] }),
        dev: snapshot("dev", {
          records: [tracked.record],
          versions: [tracked.version],
          files: [tracked.file],
        }),
      }),
    );
    const invariants = findings(report, "invalid-format").map(
      (finding) => finding.evidence.violatedInvariant,
    );
    expect(invariants).toEqual(
      expect.arrayContaining([
        "version-format-mime-mismatch",
        "file-mime-mismatch",
        "file-extension-mismatch",
      ]),
    );
  });

  it("detects behavior, generation-proof, required-translation, and display-only environment drift", () => {
    const dev = trackedRasterFixture({
      environment: "dev",
      semanticKey: "site.drift.asset",
      fileId: uuid(700),
      recordId: uuid(701),
      versionId: uuid(702),
      record: { title: "DEV title", delivery_mode: "local-img" },
      version: { input_hash: SHA_A },
      file: { legacyPath: "images/drift.png", sha256: SHA_A },
    });
    const prod = trackedRasterFixture({
      environment: "prod",
      semanticKey: "site.drift.asset",
      fileId: uuid(800),
      recordId: uuid(801),
      versionId: uuid(802),
      record: {
        title: "PROD title",
        delivery_mode: "css-background",
        brand_status: "restricted",
        alt_mode: "informative",
      },
      version: { input_hash: SHA_B },
      file: { legacyPath: "images/drift.png", sha256: SHA_A },
    });
    const report = reconcileAssetAudit(
      auditInput({
        dev: snapshot("dev", {
          records: [dev.record],
          versions: [dev.version],
          files: [dev.file],
          translations: [
            translation({
              asset_records_id: dev.record.id,
              languages_code: "en",
              alt_text: "DEV alt",
              caption: "DEV caption",
            }),
          ],
        }),
        prod: snapshot("prod", {
          records: [prod.record],
          versions: [prod.version],
          files: [prod.file],
          translations: [
            translation({
              id: uuid(900),
              environment: "prod",
              asset_records_id: prod.record.id,
              languages_code: "en",
              alt_text: "PROD alt",
              caption: "PROD caption",
            }),
          ],
        }),
      }),
    );
    const drift = findings(report, "environment-drift");
    const errorFields = drift
      .filter((finding) => finding.severity === "error")
      .flatMap((finding) => finding.evidence.differingFields as string[]);
    const warningFields = drift
      .filter((finding) => finding.severity === "warning")
      .flatMap((finding) => finding.evidence.differingFields as string[]);
    expect(errorFields).toEqual(
      expect.arrayContaining([
        "record.delivery_mode",
        "record.brand_status",
        "record.alt_mode",
        "version.input_hash",
        "translation.en.alt_text",
      ]),
    );
    expect(warningFields).toEqual(
      expect.arrayContaining(["record.title", "translation.en.caption"]),
    );
  });
});

describe("second independent rereview regressions", () => {
  it("rejects one semantic declaration when multiple raw sinks share the module", () => {
    const tracked = trackedRasterFixture({
      semanticKey: "site.rereview.svg",
      record: {
        kind: "svg",
        delivery_mode: "inline-svg",
        allowed_mime_families: ["image/svg+xml"],
      },
      version: {
        mime_type: "image/svg+xml",
        format: "svg",
        source_hash: SHA_C,
        sanitized_output_sha256: SHA_A,
        sanitizer_signature: SHA_D,
        safety_report: svgSafety({
          state: "declared-safe",
          policy: "svg-safe-v1",
          sourceSha256: SHA_C,
          sanitizerSignature: SHA_D,
          sanitizedOutputSha256: SHA_A,
        }),
      },
      file: { mimeType: "image/svg+xml", filenameDownload: "rereview.svg" },
    });
    const asset = repositoryAsset({
      id: "repo:apps/web/static/svg/rereview.svg",
      kind: "svg",
      repoPath: "apps/web/static/svg/rereview.svg",
      sha256: SHA_A,
    });
    const sourceModule = "apps/web/src/lib/Rereview.svelte";
    const report = reconcileAssetAudit(
      auditInput({
        repository: repositoryScan({
          assets: [asset],
          usages: [
            repositoryUsage({
              id: "declared:site.rereview.svg",
              assetId: asset.id,
              semanticKey: semantic("site.rereview.svg"),
              sourceKind: "declaration",
              sourceFile: `${sourceModule}#verifiedSvg`,
              sourceLine: 12,
              deliveryMode: "inline-svg",
              confidence: "declared-dynamic",
            }),
          ],
          findings: [
            repositoryFinding({
              sourceFile: sourceModule,
              sourceLine: 12,
              code: "unsupported-pattern",
              rawRef: "{@html verifiedSvg}",
            }),
            repositoryFinding({
              sourceFile: sourceModule,
              sourceLine: 12,
              code: "unsupported-pattern",
              rawRef: "{@html unverifiedSvg}",
            }),
          ],
        }),
        dev: snapshot("dev", {
          records: [tracked.record],
          versions: [tracked.version],
          files: [tracked.file],
        }),
      }),
    );

    expect(findings(report, "unsafe-svg")).toHaveLength(1);
  });

  it("does not evaluate SVG safety when the DEV registry is forbidden without visible SVG rows", () => {
    const report = reconcileAssetAudit(
      auditInput({
        dev: snapshot("dev", { registryAvailability: "forbidden" }),
      }),
    );

    expect(report.scopeReceipts).toContainEqual({
      scope: "svg-safety",
      status: "not-evaluated",
      reason: "registry-forbidden",
    });
  });

  it("reconciles a scanner dynamic unknown to one declaration on an exact shared seam", () => {
    const tracked = trackedRasterFixture({ semanticKey: "site.card.hero" });
    const asset = repositoryAsset();
    const sourceModule = "apps/web/src/lib/Card.svelte";
    const unknown = repositoryUsage({
      id: "usage:scanner-dynamic",
      assetId: null,
      semanticKey: null,
      unresolvedRef: "images[card.slug]",
      confidence: "unknown",
      consumerKey: "scanner-expression-1",
      sourceFile: `${sourceModule}#img-src:heroImage`,
      route: "/cards/[slug]",
      locale: null,
      slot: "hero",
      deliveryMode: "local-img",
    });
    const declaration = repositoryUsage({
      id: "declared:site.card.hero",
      assetId: asset.id,
      semanticKey: semantic("site.card.hero"),
      unresolvedRef: null,
      confidence: "declared-dynamic",
      sourceKind: "declaration",
      consumerKey: "card-hero-declaration",
      sourceFile: `${sourceModule}#img-src:heroImage`,
      route: "/cards/[slug]",
      locale: null,
      slot: "hero",
      deliveryMode: "local-img",
    });
    const report = reconcileAssetAudit(
      auditInput({
        repository: repositoryScan({
          assets: [asset],
          usages: [unknown, declaration],
        }),
        dev: snapshot("dev", {
          records: [tracked.record],
          versions: [tracked.version],
          files: [tracked.file],
        }),
      }),
    );

    expect(findings(report, "unresolved-dynamic-usage")).toHaveLength(0);
  });

  it("does not suppress a repository finding with a different identity on the same line", () => {
    const sourceFile = "apps/web/src/lib/TwoRefs.svelte";
    const usage = repositoryUsage({
      id: "usage:first-dynamic",
      assetId: null,
      semanticKey: null,
      unresolvedRef: "images[firstSlug]",
      confidence: "unknown",
      sourceFile,
      sourceLine: 44,
    });
    const report = reconcileAssetAudit(
      auditInput({
        repository: repositoryScan({
          usages: [usage],
          findings: [
            repositoryFinding({
              sourceFile,
              sourceLine: 44,
              rawRef: "images[secondSlug]",
            }),
          ],
        }),
      }),
    );

    expect(
      findings(report, "unresolved-dynamic-usage")
        .map((finding) => finding.evidence.unresolvedRef)
        .sort(),
    ).toEqual(["images[firstSlug]", "images[secondSlug]"]);
  });

  it("requires consumer proof for a required direct OG source with no proof usage id", () => {
    const matrix = ogMatrix();
    const row = matrix[0]!;
    const repoPath = "apps/web/static/og/source-only.png";
    matrix[0] = {
      ...row,
      currentRef: { kind: "repository-path", repoPath },
      proofUsageId: null,
      required: true,
      exclusionReason: null,
    };
    const report = reconcileAssetAudit(
      auditInput({
        repository: repositoryScan({
          assets: [repositoryAsset({ id: `repo:${repoPath}`, repoPath })],
        }),
        ogCoverage: matrix,
      }),
    );

    expect(
      findings(report, "missing-og-coverage").some(
        (finding) => finding.identity === row.usageKey,
      ),
    ).toBe(true);
  });

  it("rejects an arbitrary version format even when the MIME and file extension are valid", () => {
    const tracked = trackedRasterFixture({
      version: { mime_type: "image/png", format: "banana" },
      file: { mimeType: "image/png", filenameDownload: "demo.png" },
    });
    const report = reconcileAssetAudit(
      auditInput({
        repository: repositoryScan({ usages: [repositoryUsage()] }),
        dev: snapshot("dev", {
          records: [tracked.record],
          versions: [tracked.version],
          files: [tracked.file],
        }),
      }),
    );

    expect(
      findings(report, "invalid-format").map(
        (finding) => finding.evidence.violatedInvariant,
      ),
    ).toContain("version-format-unknown");
  });

  it("compares every component, transformation, approval, quarantine, and SVG prefix field across environments", () => {
    const dev = trackedRasterFixture({
      environment: "dev",
      semanticKey: "site.rereview.drift",
      fileId: uuid(910),
      recordId: uuid(911),
      versionId: uuid(912),
      record: { code_component_key: "components/dev.svelte" },
      version: {
        component_key: "components/dev.svelte",
        transform_profile: "dev-profile",
        approval_status: "approved",
        quarantine_reason: null,
        svg_id_prefix: "dev-",
      },
      file: { legacyPath: "images/rereview-drift.png" },
    });
    const prod = trackedRasterFixture({
      environment: "prod",
      semanticKey: "site.rereview.drift",
      fileId: uuid(920),
      recordId: uuid(921),
      versionId: uuid(922),
      record: { code_component_key: "components/prod.svelte" },
      version: {
        component_key: "components/prod.svelte",
        transform_profile: "prod-profile",
        approval_status: "rejected",
        quarantine_reason: "unsafe-content",
        svg_id_prefix: "prod-",
      },
      file: { legacyPath: "images/rereview-drift.png" },
    });
    const report = reconcileAssetAudit(
      auditInput({
        dev: snapshot("dev", {
          records: [dev.record],
          versions: [dev.version],
          files: [dev.file],
        }),
        prod: snapshot("prod", {
          records: [prod.record],
          versions: [prod.version],
          files: [prod.file],
        }),
      }),
    );
    const errorFields = findings(report, "environment-drift")
      .filter((finding) => finding.severity === "error")
      .flatMap((finding) => finding.evidence.differingFields as string[]);

    expect(errorFields).toEqual(
      expect.arrayContaining([
        "record.code_component_key",
        "version.component_key",
        "version.transform_profile",
        "version.approval_status",
        "version.quarantine_reason",
        "version.svg_id_prefix",
      ]),
    );
  });
});

describe("final audit and report corrections", () => {
  it("reconciles a real scanner usage only to the declaration with the exact expression anchor", async () => {
    const sourceFile = "apps/web/src/lib/components/DynamicPair.svelte";
    const mini = await makeMiniRepository({
      [sourceFile]: [
        '<script lang="ts">',
        "  let heroImage: string;",
        "  let unrelatedImage: string;",
        "</script>",
        '<img src={heroImage} alt="">',
        '<img src={unrelatedImage} alt="">',
      ].join("\n"),
    });
    const repository = await scanRepository({
      repoRoot: mini.root,
      trackedFiles: mini.trackedFiles,
      declarations: defineAssetUsages([
        {
          usageKey: "site.dynamic-pair.hero",
          semanticKey: "site.dynamic-pair.hero",
          consumerType: "component",
          consumerKey: "dynamic-pair-hero",
          source: `${sourceFile}#img-src:heroImage`,
          route: "/",
          locale: null,
          slot: "hero",
          required: true,
          deliveryMode: "local-img",
          confidence: "declared-dynamic",
          reason: "The page model supplies the hero image.",
        },
      ]),
    });

    const report = reconcileAssetAudit(
      auditInput({ repository, dev: snapshot("dev") }),
    );
    expect(
      findings(report, "unresolved-dynamic-usage").map(
        (finding) => finding.evidence.unresolvedRef,
      ),
    ).toEqual(["unrelatedImage"]);
  });

  it("accepts one real scanner raw-SVG identity with complete reviewed output proof", async () => {
    const sourceFile = "apps/web/src/lib/components/RawSvg.svelte";
    const svgPath = "apps/web/static/svg/verified.svg";
    const svgBytes =
      '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/></svg>';
    const sha256 = createHash("sha256")
      .update(svgBytes)
      .digest("hex") as Sha256Hex;
    const mini = await makeMiniRepository({
      [sourceFile]: [
        '<script lang="ts">',
        '  import verifiedSvg from "/svg/verified.svg?raw";',
        "</script>",
        "{@html verifiedSvg}",
      ].join("\n"),
      [svgPath]: svgBytes,
    });
    const repository = await scanRepository({
      repoRoot: mini.root,
      trackedFiles: mini.trackedFiles,
      declarations: [],
    });
    const tracked = verifiedInlineSvgFixture({
      semanticKey: "site.raw-svg.verified",
      legacyPath: "svg/verified.svg",
      sha256,
    });

    const report = reconcileAssetAudit(
      auditInput({
        repository,
        dev: snapshot("dev", {
          records: [tracked.record],
          versions: [tracked.version],
          files: [tracked.file],
        }),
      }),
    );
    expect(findings(report, "unsafe-svg")).toHaveLength(0);
  });

  it("rejects a real scanner raw-SVG identity when an unrelated raw sink shares its module", async () => {
    const sourceFile = "apps/web/src/lib/components/MixedRawSvg.svelte";
    const svgPath = "apps/web/static/svg/verified.svg";
    const svgBytes =
      '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/></svg>';
    const sha256 = createHash("sha256")
      .update(svgBytes)
      .digest("hex") as Sha256Hex;
    const mini = await makeMiniRepository({
      [sourceFile]: [
        '<script lang="ts">',
        '  import verifiedSvg from "/svg/verified.svg?raw";',
        "  let untrustedCmsHtml: string;",
        "</script>",
        "{@html verifiedSvg}",
        "{@html untrustedCmsHtml}",
      ].join("\n"),
      [svgPath]: svgBytes,
    });
    const repository = await scanRepository({
      repoRoot: mini.root,
      trackedFiles: mini.trackedFiles,
      declarations: [],
    });
    expect(
      repository.findings.filter(
        (finding) =>
          finding.code === "unsupported-pattern" &&
          finding.sourceFile === sourceFile &&
          finding.rawRef.startsWith("{@html"),
      ),
    ).toHaveLength(2);
    const tracked = verifiedInlineSvgFixture({
      semanticKey: "site.raw-svg.verified",
      legacyPath: "svg/verified.svg",
      sha256,
    });

    const report = reconcileAssetAudit(
      auditInput({
        repository,
        dev: snapshot("dev", {
          records: [tracked.record],
          versions: [tracked.version],
          files: [tracked.file],
        }),
      }),
    );
    expect(findings(report, "unsafe-svg")).toHaveLength(1);
  });

  it("keeps a real scanner raw-SVG sink unsafe when two exact identities share its source module", async () => {
    const sourceFile = "apps/web/src/lib/components/AmbiguousRawSvg.svelte";
    const firstPath = "apps/web/static/svg/first.svg";
    const secondPath = "apps/web/static/svg/second.svg";
    const firstBytes =
      '<svg xmlns="http://www.w3.org/2000/svg"><path id="first"/></svg>';
    const secondBytes =
      '<svg xmlns="http://www.w3.org/2000/svg"><path id="second"/></svg>';
    const firstSha = createHash("sha256")
      .update(firstBytes)
      .digest("hex") as Sha256Hex;
    const secondSha = createHash("sha256")
      .update(secondBytes)
      .digest("hex") as Sha256Hex;
    const mini = await makeMiniRepository({
      [sourceFile]: [
        '<script lang="ts">',
        '  import firstSvg from "/svg/first.svg?raw";',
        '  import secondSvg from "/svg/second.svg?raw";',
        "</script>",
        "{@html firstSvg}",
      ].join("\n"),
      [firstPath]: firstBytes,
      [secondPath]: secondBytes,
    });
    const repository = await scanRepository({
      repoRoot: mini.root,
      trackedFiles: mini.trackedFiles,
      declarations: [],
    });
    const first = verifiedInlineSvgFixture({
      semanticKey: "site.raw-svg.first",
      legacyPath: "svg/first.svg",
      sha256: firstSha,
      recordId: uuid(31),
      versionId: uuid(32),
      fileId: uuid(33),
    });
    const second = verifiedInlineSvgFixture({
      semanticKey: "site.raw-svg.second",
      legacyPath: "svg/second.svg",
      sha256: secondSha,
      recordId: uuid(41),
      versionId: uuid(42),
      fileId: uuid(43),
    });

    const report = reconcileAssetAudit(
      auditInput({
        repository,
        dev: snapshot("dev", {
          records: [first.record, second.record],
          versions: [first.version, second.version],
          files: [first.file, second.file],
        }),
      }),
    );
    expect(findings(report, "unsafe-svg").length).toBeGreaterThan(0);
  });

  it("accepts one explicit raw-SVG semantic declaration in the sink module and rejects declaration ambiguity", async () => {
    const sourceFile = "apps/web/src/lib/components/CmsRawSvg.svelte";
    const mini = await makeMiniRepository({
      [sourceFile]: [
        '<script lang="ts">let cmsSvg = fetch("/api/svg");</script>',
        "{@html cmsSvg}",
      ].join("\n"),
    });
    const declarationFor = (usageKey: string, semanticKey: string) => ({
      usageKey,
      semanticKey,
      consumerType: "component" as const,
      consumerKey: usageKey,
      source: `${sourceFile}#cms-svg-record`,
      route: "/",
      locale: null,
      slot: "illustration",
      required: true,
      deliveryMode: "inline-svg" as const,
      confidence: "declared-dynamic" as const,
      reason: "The CMS record supplies sanitized inline SVG output.",
    });
    const first = verifiedInlineSvgFixture({
      semanticKey: "site.cms-raw.first",
      legacyPath: "svg/cms-first.svg",
      sha256: SHA_A,
      recordId: uuid(51),
      versionId: uuid(52),
      fileId: uuid(53),
    });
    const second = verifiedInlineSvgFixture({
      semanticKey: "site.cms-raw.second",
      legacyPath: "svg/cms-second.svg",
      sha256: SHA_B,
      recordId: uuid(61),
      versionId: uuid(62),
      fileId: uuid(63),
    });
    const scan = (rows: ReturnType<typeof declarationFor>[]) =>
      scanRepository({
        repoRoot: mini.root,
        trackedFiles: mini.trackedFiles,
        declarations: defineAssetUsages(rows),
      });

    const uniqueReport = reconcileAssetAudit(
      auditInput({
        repository: await scan([
          declarationFor("site.cms-raw.first", "site.cms-raw.first"),
        ]),
        dev: snapshot("dev", {
          records: [first.record],
          versions: [first.version],
          files: [first.file],
        }),
      }),
    );
    expect(findings(uniqueReport, "unsafe-svg")).toHaveLength(0);

    const ambiguousReport = reconcileAssetAudit(
      auditInput({
        repository: await scan([
          declarationFor("site.cms-raw.first", "site.cms-raw.first"),
          {
            ...declarationFor("site.cms-raw.second", "site.cms-raw.second"),
            source: `${sourceFile}#other-cms-svg-record`,
          },
        ]),
        dev: snapshot("dev", {
          records: [first.record, second.record],
          versions: [first.version, second.version],
          files: [first.file, second.file],
        }),
      }),
    );
    expect(findings(ambiguousReport, "unsafe-svg").length).toBeGreaterThan(0);
  });

  it("requires registry, files, and content evidence for every present SVG environment", () => {
    for (const surface of ["directus_files", "route_seo"] as const) {
      const report = reconcileAssetAudit(
        auditInput({
          dev: snapshot("dev", {
            readReceipts: completeReceipts().map((receipt) =>
              receipt.surface === surface
                ? {
                    ...receipt,
                    availability: "forbidden" as const,
                    complete: false,
                    rowCount: null,
                  }
                : receipt,
            ),
            readIssues: [
              {
                code: "collection-forbidden",
                environment: "dev",
                operation: `readPage:${surface}`,
                status: 403,
                entityKey: null,
              },
            ],
          }),
        }),
      );

      expect(report.scopeReceipts).toContainEqual({
        scope: "svg-safety",
        status: "not-evaluated",
        reason: "request-failed",
      });
    }
  });
});
