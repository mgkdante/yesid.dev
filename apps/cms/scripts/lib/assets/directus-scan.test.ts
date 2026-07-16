import { createHash } from "node:crypto";
import { describe, expect, it } from "bun:test";
import type { Sha256Hex } from "@repo/shared";
import {
  DEFAULT_DIRECTUS_READ_LIMITS,
  DIRECTUS_PAGE_SIZE,
  DIRECTUS_READ_SURFACES,
  DIRECTUS_SURFACE_SPECS,
  canonicalizeDirectusAssetSnapshot,
  hashDirectusAssetSnapshot,
  scanDirectusAssets,
  type CmsAssetReadResponse,
  type CmsReadClient,
  type CmsReadResponse,
  type DirectusAssetSnapshot,
  type DirectusReadSurface,
} from "./directus-scan";

const FILE_A = "11111111-1111-4111-8111-111111111111";
const FILE_B = "22222222-2222-4222-8222-222222222222";
const FILE_C = "33333333-3333-4333-8333-333333333333";
const FILE_D = "44444444-4444-4444-8444-444444444444";
const RECORD_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const VERSION_A = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const BLOCK_A = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

type PageSurface = Exclude<
  DirectusReadSurface,
  | "directus_settings.storage_asset_presets"
  | "site_meta"
  | "block_about_content"
>;
type SingletonSurface = Exclude<DirectusReadSurface, PageSurface>;

interface ReadPageCall {
  surface: PageSurface;
  fields: readonly unknown[];
  sort: readonly string[];
  limit: number;
  offset: number;
}

interface ReadSingletonCall {
  surface: SingletonSurface;
  fields: readonly unknown[];
}

interface AssetCall {
  fileId: string;
  maxBytes: number;
}

interface ClientCalls {
  pages: ReadPageCall[];
  singletons: ReadSingletonCall[];
  assets: AssetCall[];
  maxConcurrentDownloads: number;
}

interface ClientOptions {
  pageRows?: Partial<Record<PageSurface, readonly unknown[]>>;
  pageStatus?: Partial<Record<PageSurface, number>>;
  pageHandler?: (
    input: ReadPageCall,
    callIndex: number,
  ) => CmsReadResponse | Promise<CmsReadResponse> | undefined;
  singletons?: Partial<Record<SingletonSurface, unknown>>;
  singletonStatus?: Partial<Record<SingletonSurface, number>>;
  singletonHandler?: (
    input: ReadSingletonCall,
    callIndex: number,
  ) => CmsReadResponse | Promise<CmsReadResponse> | undefined;
  assetHandler?: (
    fileId: string,
    maxBytes: number,
  ) => CmsAssetReadResponse | Promise<CmsAssetReadResponse>;
}

function makeClient(
  options: ClientOptions = {},
): CmsReadClient & { calls: ClientCalls } {
  const calls: ClientCalls = {
    pages: [],
    singletons: [],
    assets: [],
    maxConcurrentDownloads: 0,
  };
  let activeDownloads = 0;

  return {
    calls,
    async readPage(input) {
      const call = { ...input } as ReadPageCall;
      calls.pages.push(call);
      const handled = await options.pageHandler?.(call, calls.pages.length - 1);
      if (handled !== undefined) return handled;
      const status = options.pageStatus?.[call.surface] ?? 200;
      const rows = options.pageRows?.[call.surface] ?? [];
      return {
        status,
        data:
          status >= 200 && status < 300
            ? rows.slice(call.offset, call.offset + call.limit)
            : { private: "upstream response must not escape" },
      };
    },
    async readSingleton(input) {
      const call = { ...input } as ReadSingletonCall;
      calls.singletons.push(call);
      const handled = await options.singletonHandler?.(
        call,
        calls.singletons.length - 1,
      );
      if (handled !== undefined) return handled;
      const status = options.singletonStatus?.[call.surface] ?? 200;
      const defaults: Record<SingletonSurface, unknown> = {
        "directus_settings.storage_asset_presets": {
          storage_asset_presets: null,
        },
        site_meta: { id: 1, default_og_image: null },
        block_about_content: {
          id: BLOCK_A,
          status: "archived",
          headshot: null,
          client_logos: null,
        },
      };
      return {
        status,
        data:
          status >= 200 && status < 300
            ? (options.singletons?.[call.surface] ?? defaults[call.surface])
            : { private: "upstream response must not escape" },
      };
    },
    async readAsset(fileId, maxBytes) {
      calls.assets.push({ fileId, maxBytes });
      activeDownloads += 1;
      calls.maxConcurrentDownloads = Math.max(
        calls.maxConcurrentDownloads,
        activeDownloads,
      );
      try {
        return options.assetHandler
          ? await options.assetHandler(fileId, maxBytes)
          : { status: 200, bytes: new ArrayBuffer(0) };
      } finally {
        activeDownloads -= 1;
      }
    },
  };
}

function uuidFor(index: number): string {
  return `${index.toString(16).padStart(8, "0")}-0000-4000-8000-${index
    .toString(16)
    .padStart(12, "0")}`;
}

function pageRows(
  count: number,
  prefix = "/page",
): Array<Record<string, unknown>> {
  return Array.from({ length: count }, (_, index) => ({
    id: uuidFor(index + 1),
    status: "published",
    path: `${prefix}-${index + 1}`,
    type: "freeform",
  }));
}

function directusFile(
  id: string,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id,
    storage: "local",
    filename_disk: `${id}.bin`,
    filename_download: `${id}.bin`,
    title: null,
    type: "application/octet-stream",
    folder: null,
    legacy_path: null,
    filesize: "0",
    width: null,
    height: null,
    duration: null,
    description: null,
    tags: [],
    metadata: null,
    ...overrides,
  };
}

function sha256(bytes: Uint8Array): Sha256Hex {
  return createHash("sha256").update(bytes).digest("hex") as Sha256Hex;
}

function buffer(values: readonly number[]): ArrayBuffer {
  return Uint8Array.from(values).buffer;
}

function imageDocument(
  input: {
    blockId?: string;
    main?: string;
    light?: string | null;
    mainUrlId?: string;
    lightUrlId?: string;
    caption?: string;
    alt?: string | null;
  } = {},
): Record<string, unknown> {
  const blockId = input.blockId ?? "image-block";
  const main = input.main ?? FILE_A;
  const light = input.light === undefined ? FILE_B : input.light;
  const file = {
    fileId: main,
    fileURL: `/files/${main}`,
    url: `/assets/${input.mainUrlId ?? main}`,
  };
  return {
    time: 1,
    version: "2.31.2",
    blocks: [
      {
        id: blockId,
        type: "image",
        data: {
          file,
          ...(light === null
            ? {}
            : {
                variants: {
                  light: {
                    fileId: light,
                    fileURL: `/files/${light}`,
                    url: `/assets/${input.lightUrlId ?? light}`,
                  },
                },
              }),
          caption: input.caption ?? "CMS screenshot caption",
          ...(input.alt === undefined ? {} : { alt: input.alt }),
          withBorder: false,
          withBackground: false,
          stretched: false,
        },
      },
    ],
  };
}

function registryRecordRow(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id: RECORD_A,
    semantic_key: "site.review.asset",
    title: "Review asset",
    meaning: null,
    kind: "raster",
    role: "content",
    lifecycle_status: "approved",
    code_component_key: null,
    owner_type: "site",
    owner_key: "site",
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
    approved_version: VERSION_A,
    date_created: null,
    date_updated: null,
    user_created: null,
    user_updated: null,
    ...overrides,
  };
}

function registryVersionRow(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id: VERSION_A,
    asset_record: RECORD_A,
    version_number: 1,
    source_mode: "upload",
    directus_file: FILE_A,
    component_key: null,
    sha256: "a".repeat(64),
    mime_type: "image/png",
    format: "png",
    bytes: 4,
    width: 1,
    height: 1,
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
    safety_report: safetyReportRow(),
    date_created: null,
    user_created: null,
    ...overrides,
  };
}

function safetyReportRow(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    state: "not-applicable",
    reasons: [],
    policy: null,
    sourceSha256: null,
    sanitizerSignature: null,
    sanitizedOutputSha256: null,
    transformSignature: null,
    ...overrides,
  };
}

function storedUsageRow(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id: "b".repeat(64),
    asset_record: RECORD_A,
    resolved_version: VERSION_A,
    unresolved_ref: null,
    scan_run_id: "scan-review",
    last_seen_manifest_sha256: "c".repeat(64),
    confidence: "exact-static",
    consumer_type: "site",
    consumer_key: "site",
    source_kind: "cms",
    source_file: "site_meta",
    cms_field: "default_og_image",
    source_line: null,
    route: "/",
    locale: "en",
    slot: "og-image",
    required: true,
    delivery_mode: "og-meta",
    alt_text_override: null,
    alt_source: null,
    active: true,
    first_seen: "2026-07-15T00:00:00.000Z",
    last_seen: "2026-07-15T00:00:00.000Z",
    date_updated: null,
    ...overrides,
  };
}

const EXPECTED_FIELDS = {
  asset_records: [
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
  ],
  asset_records_translations: [
    "id",
    "asset_records_id",
    "languages_code",
    "alt_text",
    "caption",
    "credit",
    "og_image_alt",
  ],
  asset_versions: [
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
  ],
  asset_usages: [
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
  ],
  directus_folders: ["id", "name", "parent"],
  directus_files: [
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
  ],
  "directus_settings.storage_asset_presets": ["storage_asset_presets"],
  site_meta: ["id", "default_og_image"],
  route_seo: ["id", "path", "status", "og_image"],
  about_languages: [
    "id",
    "status",
    "image",
    "translations.id",
    "translations.languages_code",
    "translations.label",
  ],
  blog_posts: [
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
  ],
  icons: ["id", "status", "name", "iconify_id", "svg_override"],
  illustrations: ["id", "label", "file"],
  projects: [
    "id",
    "status",
    "hero_image",
    "hero_image_light",
    "hero_image_secondary",
    "hero_image_secondary_light",
    "svg_illustration",
  ],
  projects_translations: [
    "id",
    "projects_id",
    "languages_code",
    "title",
    "description",
  ],
  projects_sections: ["id", "projects_id"],
  projects_sections_translations: [
    "id",
    "projects_sections_id",
    "languages_code",
    "content",
  ],
  services: ["id", "visible", "svg"],
  legal_pages: ["id", "status"],
  legal_pages_translations: ["id", "legal_pages_id", "languages_code", "body"],
  tech_stack: ["id", "name", "status", "icon_id"],
  tech_stack_translations: [
    "id",
    "tech_stack_id",
    "languages_code",
    "what_it_is",
    "what_i_use_it_for",
    "why_i_use_it_instead",
  ],
  block_about_content: ["id", "status", "headshot", "client_logos"],
  block_about_content_translations: [
    "id",
    "block_about_content_id",
    "languages_code",
    "identity_name",
    "polaroids",
    "interests",
    "testimonials",
  ],
  nav_links: ["id", "status", "placement", "href", "page", "icon"],
  contact_channels: ["id", "status", "href", "icon"],
  stack_archetypes: [
    "id",
    "status",
    "slug",
    "icon",
    "tech.id",
    "tech.tech_stack_id",
  ],
  site_pages: ["id", "status", "path", "type"],
  site_pages_translations: ["id", "site_pages_id", "languages_code"],
} as const satisfies Record<DirectusReadSurface, readonly string[]>;

describe("Directus surface contract and bounded reads", () => {
  it("exports the exact frozen 29-surface contract with explicit fields and cardinality", () => {
    expect(DIRECTUS_PAGE_SIZE).toBe(100);
    expect(DEFAULT_DIRECTUS_READ_LIMITS).toEqual({
      maxRowsPerCollection: 10_000,
      maxFiles: 1_000,
      maxFileBytes: 20_971_520,
      maxTotalFileBytes: 536_870_912,
      maxConcurrentDownloads: 4,
    });
    expect(DIRECTUS_READ_SURFACES).toHaveLength(29);
    expect(Object.keys(DIRECTUS_SURFACE_SPECS)).toEqual([
      ...DIRECTUS_READ_SURFACES,
    ]);
    expect(Object.isFrozen(DIRECTUS_SURFACE_SPECS)).toBe(true);

    const singletons = new Set<DirectusReadSurface>([
      "directus_settings.storage_asset_presets",
      "site_meta",
      "block_about_content",
    ]);
    for (const surface of DIRECTUS_READ_SURFACES) {
      const spec = DIRECTUS_SURFACE_SPECS[surface];
      expect(spec.mode).toBe(singletons.has(surface) ? "singleton" : "page");
      expect(spec.fields).toEqual(EXPECTED_FIELDS[surface]);
      expect(Object.isFrozen(spec)).toBe(true);
      expect(Object.isFrozen(spec.fields)).toBe(true);
      if (spec.mode === "page") {
        expect(spec.sort).toEqual(["id"]);
        expect(Object.isFrozen(spec.sort)).toBe(true);
        expect("filter" in spec).toBe(false);
        expect("deep" in spec).toBe(false);
      } else {
        expect("sort" in spec).toBe(false);
      }
    }
  });

  it("dispatches each fixed surface once through only its approved reader port", async () => {
    const client = makeClient();
    const snapshot = await scanDirectusAssets({ environment: "dev", client });

    expect(client.calls.pages.map((call) => call.surface).sort()).toEqual(
      DIRECTUS_READ_SURFACES.filter(
        (surface): surface is PageSurface =>
          ![
            "directus_settings.storage_asset_presets",
            "site_meta",
            "block_about_content",
          ].includes(surface),
      ).sort(),
    );
    expect(client.calls.singletons.map((call) => call.surface).sort()).toEqual([
      "block_about_content",
      "directus_settings.storage_asset_presets",
      "site_meta",
    ]);
    for (const call of client.calls.pages) {
      expect(call).toEqual({
        surface: call.surface,
        fields: EXPECTED_FIELDS[call.surface],
        sort: ["id"],
        limit: 100,
        offset: 0,
      });
    }
    for (const call of client.calls.singletons) {
      expect(call.fields).toEqual(EXPECTED_FIELDS[call.surface]);
    }
    expect(snapshot.readReceipts).toHaveLength(29);
    expect(
      snapshot.readReceipts.map((receipt) => receipt.surface).sort(),
    ).toEqual([...DIRECTUS_READ_SURFACES].sort());
  });

  it("stops a short page, proves an exact full page with an empty read, and walks multiple pages", async () => {
    for (const [count, expectedOffsets] of [
      [2, [0]],
      [100, [0, 100]],
      [205, [0, 100, 200]],
    ] as const) {
      const client = makeClient({ pageRows: { site_pages: pageRows(count) } });
      const snapshot = await scanDirectusAssets({ environment: "dev", client });
      expect(
        client.calls.pages
          .filter((call) => call.surface === "site_pages")
          .map((call) => call.offset),
      ).toEqual([...expectedOffsets]);
      expect(
        snapshot.readReceipts.find((r) => r.surface === "site_pages"),
      ).toEqual(
        expect.objectContaining({
          availability: "available",
          complete: true,
          rowCount: count,
        }),
      );
    }
  });

  it("rejects duplicate page identities and marks the surface incomplete", async () => {
    const duplicate = {
      id: uuidFor(90),
      status: "published",
      path: "/duplicate",
      type: "freeform",
    };
    const client = makeClient({
      pageRows: { site_pages: [duplicate, duplicate] },
    });
    const snapshot = await scanDirectusAssets({ environment: "dev", client });

    expect(snapshot.readIssues).toContainEqual(
      expect.objectContaining({
        code: "response-invalid",
        environment: "dev",
        entityKey: uuidFor(90),
      }),
    );
    expect(
      snapshot.readReceipts.find((r) => r.surface === "site_pages"),
    ).toEqual(
      expect.objectContaining({ availability: "failed", complete: false }),
    );
  });

  it("rejects an oversized page before consuming any of its rows", async () => {
    const oversized = pageRows(DIRECTUS_PAGE_SIZE + 1, "/oversized");
    const client = makeClient({
      pageHandler: (call) =>
        call.surface === "site_pages"
          ? { status: 200, data: oversized }
          : undefined,
    });

    const snapshot = await scanDirectusAssets({ environment: "dev", client });

    expect(
      client.calls.pages.filter((call) => call.surface === "site_pages"),
    ).toHaveLength(1);
    expect(snapshot.readIssues).toContainEqual(
      expect.objectContaining({
        code: "response-invalid",
        operation: "readPage:site_pages",
        entityKey: "site_pages",
      }),
    );
    expect(
      snapshot.readReceipts.find((receipt) => receipt.surface === "site_pages"),
    ).toEqual(
      expect.objectContaining({
        availability: "failed",
        complete: false,
        rowCount: 0,
      }),
    );
    expect(
      snapshot.references.some((reference) =>
        reference.route?.startsWith("/oversized"),
      ),
    ).toBe(false);
  });

  it("enforces the row cap without issuing an unbounded next page", async () => {
    const client = makeClient({ pageRows: { site_pages: pageRows(101) } });
    const snapshot = await scanDirectusAssets({
      environment: "dev",
      client,
      limits: { maxRowsPerCollection: 100 },
    });

    expect(
      client.calls.pages
        .filter((call) => call.surface === "site_pages")
        .map((call) => call.offset),
    ).toEqual([0]);
    expect(snapshot.readIssues).toContainEqual(
      expect.objectContaining({
        code: "pagination-limit",
        entityKey: "site_pages",
      }),
    );
    expect(
      snapshot.readReceipts.find((r) => r.surface === "site_pages"),
    ).toEqual(expect.objectContaining({ complete: false, rowCount: 100 }));
  });

  it("accepts lowered positive safe limits and rejects invalid or over-four concurrency overrides", async () => {
    const client = makeClient();
    await expect(
      scanDirectusAssets({
        environment: "prod",
        client,
        limits: {
          maxRowsPerCollection: 1,
          maxFiles: 1,
          maxFileBytes: 1,
          maxTotalFileBytes: 1,
          maxConcurrentDownloads: 1,
        },
      }),
    ).resolves.toEqual(expect.objectContaining({ environment: "prod" }));

    for (const limits of [
      { maxRowsPerCollection: 0 },
      { maxFiles: -1 },
      { maxFileBytes: 1.5 },
      { maxTotalFileBytes: Number.MAX_SAFE_INTEGER + 1 },
      { maxConcurrentDownloads: 5 },
    ] as const) {
      await expect(
        scanDirectusAssets({
          environment: "dev",
          client: makeClient(),
          limits,
        }),
      ).rejects.toThrow();
    }
  });
});

describe("registry, relation, folder, and preset normalization", () => {
  it("normalizes complete registry rows, relation objects, set-like JSON, safety evidence, and presets", async () => {
    const usageId = "1".repeat(64);
    const fileHash = "2".repeat(64);
    const sourceHash = "3".repeat(64);
    const record = {
      id: RECORD_A,
      semantic_key: "site.home.hero",
      title: "Home hero",
      meaning: "Primary home artwork",
      kind: "raster",
      role: "hero",
      lifecycle_status: "approved",
      code_component_key: null,
      owner_type: "site",
      owner_key: "site",
      locale_policy: "localized",
      alt_mode: "informative",
      aspect_ratio_mode: "exact",
      aspect_ratio_width: 16,
      aspect_ratio_height: 9,
      allowed_mime_families: ["image/png", "image/*", "image/png"],
      transform_profile: "hero-1200",
      delivery_mode: "local-img",
      focal_point_x: 0.5,
      focal_point_y: 0.25,
      max_bytes: 2_000_000,
      brand_status: "approved",
      approved_token_slots: ["accent", "primary", "accent"],
      candidate_version: null,
      approved_version: { id: VERSION_A },
      date_created: "2026-07-15T00:00:00.000Z",
      date_updated: null,
      user_created: null,
      user_updated: null,
    };
    const version = {
      id: VERSION_A,
      asset_record: { id: RECORD_A },
      version_number: 1,
      source_mode: "upload",
      directus_file: { id: FILE_A },
      component_key: null,
      sha256: fileHash,
      mime_type: "image/png",
      format: "png",
      bytes: 4,
      width: 1600,
      height: 900,
      duration_ms: null,
      orientation: "landscape",
      color_profile: "sRGB",
      is_animated: false,
      source_hash: sourceHash,
      dependency_hashes: { zeta: fileHash, alpha: sourceHash },
      transform_profile: "hero-1200",
      transform_signature: null,
      sanitizer_signature: null,
      generator_signature: null,
      toolchain_signature: null,
      approval_status: "approved",
      approved_by: null,
      approved_at: "2026-07-15T00:00:00.000Z",
      replaces_version: null,
      replacement_reason: null,
      promotion_request_id: null,
      quarantine_reason: null,
      sanitized_output_sha256: null,
      input_hash: null,
      brand_slots: ["primary", "accent", "primary"],
      svg_id_prefix: null,
      template_version: null,
      safety_report: {
        state: "not-applicable",
        reasons: [" raster ", "raster"],
        policy: null,
        sourceSha256: null,
        sanitizerSignature: null,
        sanitizedOutputSha256: null,
        transformSignature: null,
      },
      date_created: "2026-07-15T00:00:00.000Z",
      user_created: null,
    };
    const client = makeClient({
      pageRows: {
        asset_records: [record],
        asset_records_translations: [
          {
            id: 1,
            asset_records_id: { id: RECORD_A },
            languages_code: "en",
            alt_text: "Home hero",
            caption: null,
            credit: null,
            og_image_alt: null,
          },
        ],
        asset_versions: [version],
        asset_usages: [
          {
            id: usageId,
            asset_record: { id: RECORD_A },
            resolved_version: { id: VERSION_A },
            unresolved_ref: null,
            scan_run_id: "scan-1",
            last_seen_manifest_sha256: fileHash,
            confidence: "exact-static",
            consumer_type: "site",
            consumer_key: "home",
            source_kind: "cms",
            source_file: "site_meta",
            cms_field: "default_og_image",
            source_line: null,
            route: "/",
            locale: "en",
            slot: "hero",
            required: true,
            delivery_mode: "local-img",
            alt_text_override: null,
            alt_source: "asset_records_translations.alt_text",
            active: true,
            first_seen: "2026-07-15T00:00:00.000Z",
            last_seen: "2026-07-15T00:00:00.000Z",
            date_updated: null,
          },
        ],
      },
      singletons: {
        "directus_settings.storage_asset_presets": {
          storage_asset_presets: [
            {
              key: "og-1200",
              fit: "cover",
              width: 1200,
              height: 630,
              quality: 85,
              format: "webp",
              withoutEnlargement: true,
            },
          ],
        },
      },
    });
    const snapshot = await scanDirectusAssets({ environment: "dev", client });

    expect(snapshot.registryAvailability).toBe("available");
    expect(snapshot.records[0]).toEqual(
      expect.objectContaining({
        id: RECORD_A,
        semantic_key: "site.home.hero",
        allowed_mime_families: ["image/*", "image/png"],
        approved_token_slots: ["accent", "primary"],
        approved_version: VERSION_A,
      }),
    );
    expect(snapshot.translations[0]).toEqual(
      expect.objectContaining({
        asset_records_id: RECORD_A,
        languages_code: "en",
      }),
    );
    expect(snapshot.versions[0]).toEqual(
      expect.objectContaining({
        asset_record: RECORD_A,
        directus_file: FILE_A,
        brand_slots: ["accent", "primary"],
        dependency_hashes: { alpha: sourceHash, zeta: fileHash },
        safety_report: expect.objectContaining({
          state: "not-applicable",
          reasons: ["raster"],
        }),
      }),
    );
    expect(snapshot.storedUsages[0]).toEqual(
      expect.objectContaining({
        id: usageId,
        asset_record: RECORD_A,
        resolved_version: VERSION_A,
      }),
    );
    expect(snapshot.transformPresets).toEqual([
      {
        key: "og-1200",
        fit: "cover",
        width: 1200,
        height: 630,
        quality: 85,
        format: "webp",
        withoutEnlargement: true,
      },
    ]);
  });

  it("keeps registry missing, forbidden, empty, and failed states distinct", async () => {
    const registrySurfaces = [
      "asset_records",
      "asset_records_translations",
      "asset_versions",
      "asset_usages",
    ] as const;
    for (const [status, expected] of [
      [404, "missing"],
      [403, "forbidden"],
      [200, "available"],
    ] as const) {
      const pageStatus = Object.fromEntries(
        registrySurfaces.map((surface) => [surface, status]),
      ) as Partial<Record<PageSurface, number>>;
      const snapshot = await scanDirectusAssets({
        environment: "dev",
        client: makeClient({ pageStatus }),
      });
      expect(snapshot.registryAvailability).toBe(expected);
    }
    const unknown = await scanDirectusAssets({
      environment: "dev",
      client: makeClient({ pageStatus: { asset_versions: 500 } }),
    });
    expect(unknown.registryAvailability).toBe("unknown");
  });

  it("normalizes scalar and object relations identically", async () => {
    const snapshot = await scanDirectusAssets({
      environment: "dev",
      client: makeClient({
        pageRows: {
          route_seo: [
            { id: 1, path: "/one", status: "published", og_image: FILE_A },
            {
              id: 2,
              path: "/two",
              status: "published",
              og_image: { id: FILE_A },
            },
          ],
          site_pages: [
            {
              id: uuidFor(1),
              status: "published",
              path: "/one",
              type: "freeform",
            },
            {
              id: uuidFor(2),
              status: "published",
              path: "/two",
              type: "freeform",
            },
          ],
        },
      }),
    });
    expect(
      snapshot.references
        .filter((ref) => ref.collection === "route_seo")
        .map((ref) => ref.fileId),
    ).toEqual([FILE_A, FILE_A]);
  });

  it("builds folder paths and preserves missing-parent and cycle evidence", async () => {
    const root = uuidFor(10);
    const child = uuidFor(11);
    const missing = uuidFor(12);
    const cycleA = uuidFor(13);
    const cycleB = uuidFor(14);
    const snapshot = await scanDirectusAssets({
      environment: "dev",
      client: makeClient({
        pageRows: {
          directus_folders: [
            { id: child, name: "icons", parent: { id: root } },
            { id: root, name: "brand", parent: null },
            { id: missing, name: "lost", parent: FILE_D },
            { id: cycleA, name: "a", parent: cycleB },
            { id: cycleB, name: "b", parent: cycleA },
          ],
        },
      }),
    });

    expect(snapshot.folders.find((folder) => folder.id === root)?.path).toBe(
      "brand",
    );
    expect(snapshot.folders.find((folder) => folder.id === child)).toEqual(
      expect.objectContaining({ parentId: root, path: "brand/icons" }),
    );
    for (const id of [missing, cycleA, cycleB]) {
      expect(
        snapshot.folders.find((folder) => folder.id === id)?.path,
      ).toBeNull();
      expect(snapshot.readIssues).toContainEqual(
        expect.objectContaining({ code: "response-invalid", entityKey: id }),
      );
    }
  });
});

describe("closed Task 2 registry values", () => {
  it("rejects every unsupported record enum with sanitized incomplete registry evidence", async () => {
    for (const overrides of [
      { lifecycle_status: "published" },
      { owner_type: "developer" },
      { locale_policy: "regional" },
      { alt_mode: "caption" },
      { aspect_ratio_mode: "fluid" },
      { brand_status: "live" },
    ]) {
      const snapshot = await scanDirectusAssets({
        environment: "dev",
        client: makeClient({
          pageRows: { asset_records: [registryRecordRow(overrides)] },
        }),
      });

      expect(snapshot.records).toEqual([]);
      expect(snapshot.registryAvailability).toBe("unknown");
      expect(
        snapshot.readReceipts.find(
          (receipt) => receipt.surface === "asset_records",
        ),
      ).toEqual(
        expect.objectContaining({ availability: "available", complete: false }),
      );
      expect(snapshot.readIssues).toContainEqual(
        expect.objectContaining({
          code: "response-invalid",
          operation: "normalize:asset_records",
          entityKey: RECORD_A,
        }),
      );
      expect(JSON.stringify(snapshot)).not.toContain(
        `:${JSON.stringify(Object.values(overrides)[0])}`,
      );
    }
  });

  it("rejects invalid version enums and lowercase hash evidence, including safety-report signatures", async () => {
    for (const overrides of [
      { source_mode: "remote" },
      { approval_status: "ready" },
      { transform_signature: "A".repeat(64) },
      {
        safety_report: safetyReportRow({
          state: "declared-safe",
          sanitizerSignature: "A".repeat(64),
        }),
      },
      {
        safety_report: safetyReportRow({
          state: "declared-safe",
          transformSignature: "not-a-sha256",
        }),
      },
    ]) {
      const snapshot = await scanDirectusAssets({
        environment: "dev",
        client: makeClient({
          pageRows: { asset_versions: [registryVersionRow(overrides)] },
        }),
      });

      expect(snapshot.versions).toEqual([]);
      expect(snapshot.registryAvailability).toBe("unknown");
      expect(
        snapshot.readReceipts.find(
          (receipt) => receipt.surface === "asset_versions",
        ),
      ).toEqual(
        expect.objectContaining({ availability: "available", complete: false }),
      );
      expect(snapshot.readIssues).toContainEqual(
        expect.objectContaining({
          code: "response-invalid",
          operation: "normalize:asset_versions",
          entityKey: VERSION_A,
        }),
      );
    }
  });

  it("rejects uppercase dependency hashes instead of coercing them", async () => {
    const snapshot = await scanDirectusAssets({
      environment: "dev",
      client: makeClient({
        pageRows: {
          asset_versions: [
            registryVersionRow({
              dependency_hashes: { source: "A".repeat(64) },
            }),
          ],
        },
      }),
    });

    expect(snapshot.versions).toEqual([]);
    expect(snapshot.registryAvailability).toBe("unknown");
    expect(
      snapshot.readReceipts.find(
        (receipt) => receipt.surface === "asset_versions",
      ),
    ).toEqual(
      expect.objectContaining({ availability: "available", complete: false }),
    );
    expect(snapshot.readIssues).toContainEqual(
      expect.objectContaining({
        code: "response-invalid",
        operation: "normalize:asset_versions",
        entityKey: VERSION_A,
      }),
    );
  });

  it("rejects unsupported stored-usage confidence and non-null locale", async () => {
    for (const overrides of [{ confidence: "probable" }, { locale: "de" }]) {
      const snapshot = await scanDirectusAssets({
        environment: "dev",
        client: makeClient({
          pageRows: { asset_usages: [storedUsageRow(overrides)] },
        }),
      });

      expect(snapshot.storedUsages).toEqual([]);
      expect(snapshot.registryAvailability).toBe("unknown");
      expect(
        snapshot.readReceipts.find(
          (receipt) => receipt.surface === "asset_usages",
        ),
      ).toEqual(
        expect.objectContaining({ availability: "available", complete: false }),
      );
      expect(snapshot.readIssues).toContainEqual(
        expect.objectContaining({
          code: "response-invalid",
          operation: "normalize:asset_usages",
          entityKey: "b".repeat(64),
        }),
      );
    }
  });

  it("preserves structurally readable pointer and source-exclusivity contradictions for audit", async () => {
    const snapshot = await scanDirectusAssets({
      environment: "dev",
      client: makeClient({
        pageRows: {
          asset_records: [
            registryRecordRow({
              candidate_version: VERSION_A,
              approved_version: VERSION_A,
            }),
          ],
          asset_versions: [
            registryVersionRow({
              source_mode: "upload",
              directus_file: null,
              component_key: "Logo.svelte",
            }),
          ],
        },
      }),
    });

    expect(snapshot.records).toHaveLength(1);
    expect(snapshot.versions).toHaveLength(1);
    expect(snapshot.versions[0]).toEqual(
      expect.objectContaining({
        source_mode: "upload",
        directus_file: null,
        component_key: "Logo.svelte",
      }),
    );
    expect(snapshot.registryAvailability).toBe("available");
  });
});

describe("Directus file inventory and bounded hashing", () => {
  it("normalizes file metadata, folder paths, original bytes, and Directus millisecond duration", async () => {
    const folderId = uuidFor(20);
    const bytes = Uint8Array.from([0, 1, 2, 255]);
    const client = makeClient({
      pageRows: {
        directus_folders: [{ id: folderId, name: "og", parent: null }],
        directus_files: [
          directusFile(FILE_A, {
            filename_disk: "stored-a.png",
            filename_download: "route-home.png",
            title: "Route home OG",
            type: "image/png",
            folder: { id: folderId },
            legacy_path: "images/og/route-home.png",
            filesize: String(bytes.byteLength),
            width: 1200,
            height: 630,
            duration: 1234,
            description: "Home share card",
            tags: ["og", "home"],
            metadata: { source: "generator", nested: { version: 1 } },
          }),
        ],
      },
      assetHandler: () => ({ status: 200, bytes: bytes.buffer }),
    });

    const snapshot = await scanDirectusAssets({ environment: "prod", client });
    expect(snapshot.files).toEqual([
      expect.objectContaining({
        id: `directus-file:prod:${FILE_A}`,
        environment: "prod",
        fileId: FILE_A,
        storage: "local",
        filenameDisk: "stored-a.png",
        filenameDownload: "route-home.png",
        title: "Route home OG",
        mimeType: "image/png",
        folderId,
        folderPath: "og",
        legacyPath: "images/og/route-home.png",
        declaredBytes: 4,
        observedBytes: 4,
        width: 1200,
        height: 630,
        durationMs: 1234,
        description: "Home share card",
        tags: ["og", "home"],
        metadata: { source: "generator", nested: { version: 1 } },
        sha256: sha256(bytes),
        hashState: "verified",
      }),
    ]);
    expect(client.calls.assets).toEqual([
      { fileId: FILE_A, maxBytes: 20_971_520 },
    ]);
    expect(snapshot.readIssues).not.toContainEqual(
      expect.objectContaining({
        code: "download-size-mismatch",
        entityKey: FILE_A,
      }),
    );
  });

  it("sorts eligibility before concurrent work and applies file, total, and mismatch limits after observed bytes", async () => {
    const completionOrder: string[] = [];
    const bytesById = new Map<string, readonly number[]>([
      [FILE_A, [1, 2, 3, 4]],
      [FILE_B, [5, 6, 7, 8]],
      [FILE_C, [9, 10]],
    ]);
    const delayById = new Map([
      [FILE_A, 20],
      [FILE_B, 1],
      [FILE_C, 10],
    ]);
    const client = makeClient({
      pageRows: {
        directus_files: [
          directusFile(FILE_C, { filesize: "2" }),
          directusFile(FILE_D, { filesize: "6" }),
          directusFile(FILE_A, { filesize: "1" }),
          directusFile(FILE_B, { filesize: "4" }),
        ],
      },
      assetHandler: async (fileId) => {
        await new Promise((resolve) =>
          setTimeout(resolve, delayById.get(fileId) ?? 0),
        );
        completionOrder.push(fileId);
        return { status: 200, bytes: buffer(bytesById.get(fileId) ?? []) };
      },
    });

    const snapshot = await scanDirectusAssets({
      environment: "dev",
      client,
      limits: {
        maxFiles: 3,
        maxFileBytes: 5,
        maxTotalFileBytes: 6,
        maxConcurrentDownloads: 3,
      },
    });

    expect(client.calls.assets.map((call) => call.fileId)).toEqual([
      FILE_A,
      FILE_B,
      FILE_C,
    ]);
    expect(client.calls.assets.every((call) => call.maxBytes === 5)).toBe(true);
    expect(completionOrder).toEqual([FILE_B, FILE_C, FILE_A]);
    const byId = new Map(snapshot.files.map((file) => [file.fileId, file]));
    expect(byId.get(FILE_A)).toEqual(
      expect.objectContaining({
        declaredBytes: 1,
        observedBytes: 4,
        sha256: sha256(Uint8Array.from([1, 2, 3, 4])),
        hashState: "verified",
      }),
    );
    expect(byId.get(FILE_B)).toEqual(
      expect.objectContaining({
        observedBytes: 4,
        sha256: null,
        hashState: "skipped-total-size-limit",
      }),
    );
    expect(byId.get(FILE_C)).toEqual(
      expect.objectContaining({
        observedBytes: 2,
        sha256: sha256(Uint8Array.from([9, 10])),
        hashState: "verified",
      }),
    );
    expect(byId.get(FILE_D)).toEqual(
      expect.objectContaining({
        observedBytes: null,
        sha256: null,
        hashState: "skipped-file-size-limit",
      }),
    );
    expect(snapshot.readIssues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "download-size-mismatch",
          entityKey: FILE_A,
        }),
        expect.objectContaining({
          code: "download-total-size-limit",
          entityKey: FILE_B,
        }),
        expect.objectContaining({
          code: "download-file-size-limit",
          entityKey: FILE_D,
        }),
      ]),
    );
  });

  it("limits attempted downloads by sorted file ID without dropping skipped inventory rows", async () => {
    const client = makeClient({
      pageRows: {
        directus_files: [
          directusFile(FILE_C),
          directusFile(FILE_A),
          directusFile(FILE_B),
        ],
      },
    });
    const snapshot = await scanDirectusAssets({
      environment: "dev",
      client,
      limits: { maxFiles: 2 },
    });

    expect(client.calls.assets.map((call) => call.fileId)).toEqual([
      FILE_A,
      FILE_B,
    ]);
    expect(snapshot.files).toHaveLength(3);
    expect(snapshot.files.find((file) => file.fileId === FILE_C)).toEqual(
      expect.objectContaining({
        hashState: "skipped-file-count-limit",
        sha256: null,
      }),
    );
    expect(snapshot.readIssues).toContainEqual(
      expect.objectContaining({
        code: "download-file-count-limit",
        entityKey: FILE_C,
      }),
    );
  });

  it("rejects an understated observed oversize buffer even when its declaration was eligible", async () => {
    const client = makeClient({
      pageRows: { directus_files: [directusFile(FILE_A, { filesize: "1" })] },
      assetHandler: () => ({ status: 200, bytes: buffer([1, 2, 3, 4, 5, 6]) }),
    });
    const snapshot = await scanDirectusAssets({
      environment: "dev",
      client,
      limits: { maxFileBytes: 5 },
    });

    expect(snapshot.files[0]).toEqual(
      expect.objectContaining({
        declaredBytes: 1,
        observedBytes: 6,
        sha256: null,
        hashState: "skipped-file-size-limit",
      }),
    );
    expect(snapshot.readIssues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "download-file-size-limit",
          entityKey: FILE_A,
        }),
        expect.objectContaining({
          code: "download-size-mismatch",
          entityKey: FILE_A,
        }),
      ]),
    );
  });

  it("never exceeds four download workers and forwards the exact per-file ceiling", async () => {
    const ids = Array.from({ length: 7 }, (_, index) => uuidFor(index + 30));
    const client = makeClient({
      pageRows: {
        directus_files: ids.map((id) => directusFile(id, { filesize: "1" })),
      },
      assetHandler: async () => {
        await new Promise((resolve) => setTimeout(resolve, 8));
        return { status: 200, bytes: buffer([1]) };
      },
    });
    await scanDirectusAssets({
      environment: "dev",
      client,
      limits: { maxConcurrentDownloads: 4, maxFileBytes: 7 },
    });

    expect(client.calls.maxConcurrentDownloads).toBe(4);
    expect(client.calls.assets).toHaveLength(7);
    expect(client.calls.assets.every((call) => call.maxBytes === 7)).toBe(true);
  });

  it("advances a bounded ordered download window and applies the total cap across windows", async () => {
    const ids = Array.from({ length: 5 }, (_, index) => uuidFor(index + 130));
    const bytesById = new Map<string, readonly number[]>([
      [ids[0]!, [1, 2, 3, 4]],
      [ids[1]!, [5, 6, 7, 8]],
      [ids[2]!, [9, 10]],
      [ids[3]!, [11]],
      [ids[4]!, [12]],
    ]);
    const started: string[] = [];
    let releaseHead!: () => void;
    const headGate = new Promise<void>((resolve) => {
      releaseHead = resolve;
    });
    let secondFinished!: () => void;
    const secondFinishedGate = new Promise<void>((resolve) => {
      secondFinished = resolve;
    });
    const client = makeClient({
      pageRows: {
        directus_files: [...ids]
          .reverse()
          .map((id) => directusFile(id, { filesize: "1" })),
      },
      assetHandler: async (fileId) => {
        started.push(fileId);
        if (fileId === ids[0]) await headGate;
        if (fileId === ids[1]) secondFinished();
        return { status: 200, bytes: buffer(bytesById.get(fileId) ?? []) };
      },
    });

    const scan = scanDirectusAssets({
      environment: "dev",
      client,
      limits: {
        maxFiles: 5,
        maxFileBytes: 8,
        maxTotalFileBytes: 6,
        maxConcurrentDownloads: 2,
      },
    });
    await secondFinishedGate;
    await new Promise((resolve) => setTimeout(resolve, 0));
    try {
      expect(started).toEqual(ids.slice(0, 2));
    } finally {
      releaseHead();
    }

    const snapshot = await scan;
    expect(started).toEqual(ids);
    expect(client.calls.maxConcurrentDownloads).toBe(2);
    expect(
      Object.fromEntries(
        snapshot.files.map((file) => [file.fileId, file.hashState]),
      ),
    ).toEqual({
      [ids[0]!]: "verified",
      [ids[1]!]: "skipped-total-size-limit",
      [ids[2]!]: "verified",
      [ids[3]!]: "skipped-total-size-limit",
      [ids[4]!]: "skipped-total-size-limit",
    });
  });

  it("distinguishes forbidden downloads from failed responses and thrown readers", async () => {
    const client = makeClient({
      pageRows: {
        directus_files: [FILE_A, FILE_B, FILE_C, FILE_D].map((id) =>
          directusFile(id),
        ),
      },
      assetHandler: (fileId) => {
        if (fileId === FILE_A) return { status: 401, bytes: null };
        if (fileId === FILE_B) return { status: 403, bytes: null };
        if (fileId === FILE_C) return { status: 500, bytes: null };
        throw new Error("Bearer cms-download-secret at /home/private/token");
      },
    });
    const snapshot = await scanDirectusAssets({ environment: "dev", client });
    const states = Object.fromEntries(
      snapshot.files.map((file) => [file.fileId, file.hashState]),
    );
    expect(states).toEqual({
      [FILE_A]: "forbidden",
      [FILE_B]: "forbidden",
      [FILE_C]: "failed",
      [FILE_D]: "failed",
    });
    expect(
      snapshot.readIssues.filter((issue) => issue.code === "download-failed"),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ status: 401, entityKey: FILE_A }),
        expect.objectContaining({ status: 403, entityKey: FILE_B }),
        expect.objectContaining({ status: 500, entityKey: FILE_C }),
        expect.objectContaining({ status: null, entityKey: FILE_D }),
      ]),
    );
    expect(JSON.stringify(snapshot)).not.toContain("cms-download-secret");
    expect(JSON.stringify(snapshot)).not.toContain("/home/private");
  });
});

describe("response validation, availability precedence, and sanitized failures", () => {
  it("rejects envelopes, primitives, and wrong page/singleton cardinality without exposing bodies", async () => {
    const client = makeClient({
      pageHandler: (call) => {
        if (call.surface === "route_seo") {
          return {
            status: 200,
            data: { data: [{ token: "page-body-secret" }] },
          };
        }
        if (call.surface === "services")
          return { status: 200, data: "not-an-array" };
        return undefined;
      },
      singletonHandler: (call) => {
        if (call.surface === "site_meta") {
          return {
            status: 200,
            data: [{ id: 1, secret: "singleton-body-secret" }],
          };
        }
        return undefined;
      },
    });
    const snapshot = await scanDirectusAssets({ environment: "dev", client });

    for (const surface of ["route_seo", "services", "site_meta"] as const) {
      expect(
        snapshot.readReceipts.find((receipt) => receipt.surface === surface),
      ).toEqual(
        expect.objectContaining({
          availability: "failed",
          complete: false,
          rowCount: null,
        }),
      );
      expect(snapshot.readIssues).toContainEqual(
        expect.objectContaining({
          code: "response-invalid",
          entityKey: surface,
        }),
      );
    }
    const serialized = JSON.stringify(snapshot);
    expect(serialized).not.toContain("page-body-secret");
    expect(serialized).not.toContain("singleton-body-secret");
  });

  it("uses unknown over forbidden over missing over available for aggregate registry truth", async () => {
    const forbiddenOverMissing = await scanDirectusAssets({
      environment: "dev",
      client: makeClient({
        pageStatus: { asset_records: 404, asset_versions: 403 },
      }),
    });
    expect(forbiddenOverMissing.registryAvailability).toBe("forbidden");

    const invalidOverForbidden = await scanDirectusAssets({
      environment: "dev",
      client: makeClient({
        pageStatus: { asset_records: 404, asset_records_translations: 403 },
        pageHandler: (call) =>
          call.surface === "asset_versions"
            ? { status: 200, data: { data: [] } }
            : undefined,
      }),
    });
    expect(invalidOverForbidden.registryAvailability).toBe("unknown");
  });

  it("turns thrown read errors into sanitized receipts and issues", async () => {
    const client = makeClient({
      pageHandler: (call) => {
        if (call.surface === "route_seo") {
          throw new Error(
            "Bearer read-secret; token=abc123; /home/mgkdante/private",
          );
        }
        return undefined;
      },
    });
    const snapshot = await scanDirectusAssets({ environment: "prod", client });
    expect(
      snapshot.readReceipts.find((receipt) => receipt.surface === "route_seo"),
    ).toEqual(
      expect.objectContaining({ availability: "failed", complete: false }),
    );
    expect(snapshot.readIssues).toContainEqual(
      expect.objectContaining({
        code: "request-failed",
        environment: "prod",
        status: null,
        entityKey: "route_seo",
      }),
    );
    const canonical = canonicalizeDirectusAssetSnapshot(snapshot);
    for (const forbidden of [
      "read-secret",
      "abc123",
      "/home/mgkdante",
      "Bearer",
    ]) {
      expect(canonical).not.toContain(forbidden);
    }
  });
});

describe("CMS media references, publicness, and consumption truth", () => {
  it("walks Block Editor main/light IDs, duplicate asset URLs, captions, and unknown media without scanning prose", async () => {
    const content = imageDocument({
      blockId: "hero-shot",
      main: FILE_A,
      light: FILE_B,
      mainUrlId: FILE_C,
      lightUrlId: FILE_D,
      caption: "Caption is evidence, not valid alt text",
    });
    (content.blocks as unknown[]).push(
      {
        id: "prose-only",
        type: "paragraph",
        data: {
          text: `Do not scan ${FILE_A} or /assets/${FILE_B} from prose.`,
        },
      },
      {
        id: "unknown-media",
        type: "media",
        data: { src: "/mystery/video.mov" },
      },
      {
        id: "unknown-embed",
        type: "embed",
        data: { url: "https://video.example/embed/1" },
      },
    );
    const projectId = "project-alpha";
    const client = makeClient({
      pageRows: {
        projects: [
          {
            id: projectId,
            status: "published",
            hero_image: null,
            hero_image_light: null,
            hero_image_secondary: null,
            hero_image_secondary_light: null,
            svg_illustration: null,
          },
        ],
        projects_sections: [{ id: 7, projects_id: projectId }],
        projects_sections_translations: [
          {
            id: 8,
            projects_sections_id: 7,
            languages_code: "en",
            content,
          },
        ],
        site_pages: [
          {
            id: uuidFor(70),
            status: "published",
            path: "/projects",
            type: "listing",
          },
        ],
      },
    });
    const snapshot = await scanDirectusAssets({ environment: "dev", client });
    const refs = snapshot.references.filter(
      (ref) =>
        ref.collection === "projects_sections_translations" &&
        ref.field === "content",
    );

    for (const [fileId, referenceKind, slot] of [
      [FILE_A, "block-file-id", "content:hero-shot:main"],
      [FILE_B, "block-file-id", "content:hero-shot:light"],
      [FILE_C, "embedded-asset-url", "content:hero-shot:main"],
      [FILE_D, "embedded-asset-url", "content:hero-shot:light"],
    ] as const) {
      expect(refs).toContainEqual(
        expect.objectContaining({
          fileId,
          referenceKind,
          slot,
          ordinal: 0,
          required: false,
          deliveryMode: "local-img",
          consumption: "rendered",
          contextualAlt: null,
          altSource: null,
        }),
      );
    }
    expect(
      refs.filter((ref) => ref.referenceKind === "unresolved-media"),
    ).toHaveLength(2);
    expect(refs.some((ref) => ref.rawRef?.startsWith("/files/"))).toBe(false);
    expect(refs.some((ref) => ref.rawRef?.includes("Do not scan"))).toBe(false);
  });

  it("ignores unsupported Block Editor alt fields and uses only real polaroid alt fields", async () => {
    const content = imageDocument({
      blockId: "caption-only",
      main: FILE_A,
      light: null,
      caption: "Block caption is not alt",
    });
    const explicitDocument = imageDocument({
      blockId: "explicit-alt",
      main: FILE_B,
      light: null,
      caption: "Different block caption",
      alt: "Explicit block alt",
    });
    (content.blocks as unknown[]).push(
      (explicitDocument.blocks as unknown[])[0],
    );
    const projectId = "project-alt-policy";
    const client = makeClient({
      pageRows: {
        projects: [
          {
            id: projectId,
            status: "published",
            hero_image: null,
            hero_image_light: null,
            hero_image_secondary: null,
            hero_image_secondary_light: null,
            svg_illustration: null,
          },
        ],
        projects_sections: [{ id: 301, projects_id: projectId }],
        projects_sections_translations: [
          {
            id: 302,
            projects_sections_id: 301,
            languages_code: "en",
            content,
          },
        ],
        block_about_content_translations: [
          {
            id: 303,
            block_about_content_id: BLOCK_A,
            languages_code: "en",
            identity_name: "Yesid",
            polaroids: [
              {
                src: "/images/about/caption-only.webp",
                alt: null,
                caption: "Polaroid caption is not alt",
              },
              {
                src: "/images/about/explicit-alt.webp",
                alt: "Explicit polaroid alt",
                caption: "Different polaroid caption",
              },
            ],
            interests: [],
            testimonials: [],
          },
        ],
        site_pages: [
          {
            id: uuidFor(304),
            status: "published",
            path: "/projects",
            type: "listing",
          },
          {
            id: uuidFor(305),
            status: "published",
            path: "/about",
            type: "freeform",
          },
        ],
      },
      singletons: {
        block_about_content: {
          id: BLOCK_A,
          status: "published",
          headshot: null,
          client_logos: [],
        },
      },
    });

    const snapshot = await scanDirectusAssets({ environment: "dev", client });
    const blockRefs = snapshot.references.filter(
      (reference) =>
        reference.collection === "projects_sections_translations" &&
        reference.field === "content" &&
        reference.referenceKind === "block-file-id",
    );
    expect(blockRefs.find((reference) => reference.fileId === FILE_A)).toEqual(
      expect.objectContaining({ contextualAlt: null, altSource: null }),
    );
    expect(blockRefs.find((reference) => reference.fileId === FILE_B)).toEqual(
      expect.objectContaining({ contextualAlt: null, altSource: null }),
    );

    const polaroidRefs = snapshot.references.filter(
      (reference) =>
        reference.collection === "block_about_content_translations" &&
        reference.field === "polaroids",
    );
    expect(
      polaroidRefs.find(
        (reference) => reference.rawRef === "/images/about/caption-only.webp",
      ),
    ).toEqual(
      expect.objectContaining({ contextualAlt: null, altSource: null }),
    );
    expect(
      polaroidRefs.find(
        (reference) => reference.rawRef === "/images/about/explicit-alt.webp",
      ),
    ).toEqual(
      expect.objectContaining({
        contextualAlt: "Explicit polaroid alt",
        altSource: "block_about_content_translations.polaroids[1].alt",
      }),
    );
    expect(JSON.stringify(snapshot.references)).not.toContain(
      "caption is not alt",
    );
  });

  it("classifies only field-aware UUID, asset URL, repository path, HTTP, and unresolved strings", async () => {
    const client = makeClient({
      pageRows: {
        block_about_content_translations: [
          {
            id: 1,
            block_about_content_id: BLOCK_A,
            languages_code: "en",
            identity_name: "Yesid",
            polaroids: [
              { src: FILE_A, alt: "Bare file ID", caption: null },
              { src: `/assets/${FILE_B}`, alt: "Asset URL", caption: null },
              {
                src: "/images/about/polaroid.webp",
                alt: "Repository image",
                caption: null,
              },
              {
                src: "https://cdn.example/polaroid.webp",
                alt: "Remote image",
                caption: null,
              },
              { src: "swap-me-later", alt: "Unknown image", caption: null },
            ],
            interests: [],
            testimonials: [],
          },
        ],
        site_pages: [
          {
            id: uuidFor(71),
            status: "published",
            path: "/about",
            type: "freeform",
          },
        ],
      },
      singletons: {
        block_about_content: {
          id: BLOCK_A,
          status: "published",
          headshot: null,
          client_logos: [],
        },
      },
    });
    const snapshot = await scanDirectusAssets({ environment: "dev", client });
    const refs = snapshot.references.filter((ref) => ref.field === "polaroids");

    expect(refs).toHaveLength(5);
    expect(refs.find((ref) => ref.rawRef === FILE_A)).toEqual(
      expect.objectContaining({
        fileId: FILE_A,
        referenceKind: "embedded-asset-url",
      }),
    );
    expect(refs.find((ref) => ref.rawRef === `/assets/${FILE_B}`)).toEqual(
      expect.objectContaining({
        fileId: FILE_B,
        referenceKind: "embedded-asset-url",
      }),
    );
    expect(
      refs.find((ref) => ref.rawRef === "/images/about/polaroid.webp"),
    ).toEqual(
      expect.objectContaining({
        fileId: null,
        referenceKind: "repository-path",
      }),
    );
    expect(
      refs.find((ref) => ref.rawRef === "https://cdn.example/polaroid.webp"),
    ).toEqual(
      expect.objectContaining({ fileId: null, referenceKind: "external-url" }),
    );
    expect(refs.find((ref) => ref.rawRef === "swap-me-later")).toEqual(
      expect.objectContaining({
        fileId: null,
        referenceKind: "unresolved-media",
      }),
    );
  });

  it("maps every current CMS media surface with exact field policies and omits behavior tokens", async () => {
    const projectId = "project-alpha";
    const illustrationId = "illustration-alpha";
    const iconId = "icon-valid";
    const invalidIconId = "icon-invalid";
    const pageIds = {
      about: uuidFor(80),
      blog: uuidFor(81),
      projects: uuidFor(82),
      services: uuidFor(83),
      tech: uuidFor(84),
      contact: uuidFor(85),
      route: uuidFor(86),
      legal: uuidFor(87),
    };
    const oneImage = imageDocument({ blockId: "cms-image", light: null });
    const client = makeClient({
      pageRows: {
        route_seo: [
          { id: 1, path: "/landing", status: "published", og_image: FILE_B },
        ],
        about_languages: [
          {
            id: "french",
            status: "published",
            image: { id: FILE_C },
            translations: [
              { id: 1, languages_code: "en", label: "French" },
              { id: 2, languages_code: "fr", label: "Français" },
            ],
          },
        ],
        blog_posts: [
          {
            id: "cms-assets",
            translation_key: "cms-assets",
            status: "published",
            lang: "en",
            category: "engineering",
            external: false,
            url: null,
            title: "CMS assets",
            cover_image: FILE_D,
            svg_illustration: illustrationId,
            body: oneImage,
          },
        ],
        icons: [
          {
            id: iconId,
            status: "published",
            name: "Svelte",
            iconify_id: "logos:svelte-kit",
            svg_override: FILE_A,
          },
          {
            id: invalidIconId,
            status: "published",
            name: "Broken",
            iconify_id: "https://icons.example/not-a-key",
            svg_override: null,
          },
          {
            id: "icon-unused",
            status: "published",
            name: "Unused",
            iconify_id: "logos:unused",
            svg_override: FILE_B,
          },
        ],
        illustrations: [
          { id: illustrationId, label: "Blueprint", file: FILE_C },
        ],
        projects: [
          {
            id: projectId,
            status: "published",
            hero_image: FILE_A,
            hero_image_light: FILE_B,
            hero_image_secondary: FILE_C,
            hero_image_secondary_light: FILE_D,
            svg_illustration: illustrationId,
          },
        ],
        projects_translations: [
          {
            id: 11,
            projects_id: projectId,
            languages_code: "en",
            title: "Project alpha",
            description: oneImage,
          },
        ],
        projects_sections: [{ id: 12, projects_id: projectId }],
        projects_sections_translations: [
          {
            id: 13,
            projects_sections_id: 12,
            languages_code: "en",
            content: oneImage,
          },
        ],
        services: [
          { id: "data-systems", visible: true, svg: "service-data.svg" },
          { id: "hidden-service", visible: false, svg: "service-hidden.svg" },
        ],
        legal_pages: [{ id: "privacy", status: "published" }],
        legal_pages_translations: [
          {
            id: 14,
            legal_pages_id: "privacy",
            languages_code: "en",
            body: oneImage,
          },
        ],
        tech_stack: [
          {
            id: "svelte",
            name: "Svelte",
            status: "published",
            icon_id: iconId,
          },
          {
            id: "broken",
            name: "Broken",
            status: "published",
            icon_id: invalidIconId,
          },
        ],
        tech_stack_translations: [
          {
            id: 15,
            tech_stack_id: "svelte",
            languages_code: "en",
            what_it_is: oneImage,
            what_i_use_it_for: oneImage,
            why_i_use_it_instead: oneImage,
          },
        ],
        block_about_content_translations: [
          {
            id: 16,
            block_about_content_id: BLOCK_A,
            languages_code: "en",
            identity_name: "Yesid O.",
            polaroids: [
              {
                src: "/images/about/polaroid.webp",
                alt: "Yesid in Montréal",
                caption: "Summer",
              },
            ],
            interests: [
              {
                id: "transit",
                label: "Transit",
                image: "/images/about/transit.webp",
              },
            ],
            testimonials: [
              {
                quote: "Good",
                author: "Client",
                role: "Owner",
                company: "Co",
                logo: "/images/clients/co.svg",
              },
            ],
          },
        ],
        nav_links: [
          {
            id: 17,
            status: "published",
            placement: "primary",
            href: "/about",
            page: pageIds.about,
            icon: iconId,
          },
        ],
        contact_channels: [
          {
            id: 18,
            status: "published",
            href: "mailto:hello@example.com",
            icon: "email",
          },
        ],
        stack_archetypes: [
          {
            id: 19,
            status: "published",
            slug: "modern-web",
            icon: "sparkles",
            tech: [{ id: 20, tech_stack_id: "svelte" }],
          },
        ],
        site_pages: [
          {
            id: pageIds.about,
            status: "published",
            path: "/about",
            type: "freeform",
          },
          {
            id: pageIds.blog,
            status: "published",
            path: "/blog",
            type: "listing",
          },
          {
            id: pageIds.projects,
            status: "published",
            path: "/projects",
            type: "listing",
          },
          {
            id: pageIds.services,
            status: "published",
            path: "/services",
            type: "listing",
          },
          {
            id: pageIds.tech,
            status: "published",
            path: "/tech-stack",
            type: "listing",
          },
          {
            id: pageIds.contact,
            status: "published",
            path: "/contact",
            type: "freeform",
          },
          {
            id: pageIds.route,
            status: "published",
            path: "/landing",
            type: "freeform",
          },
          {
            id: pageIds.legal,
            status: "published",
            path: "/legal/privacy",
            type: "freeform",
          },
        ],
        site_pages_translations: [
          { id: 21, site_pages_id: pageIds.about, languages_code: "en" },
        ],
      },
      singletons: {
        site_meta: { id: 1, default_og_image: FILE_A },
        block_about_content: {
          id: BLOCK_A,
          status: "published",
          headshot: "/images/about/headshot.webp",
          client_logos: [{ name: "Client", src: "/images/clients/client.svg" }],
        },
      },
    });
    const snapshot = await scanDirectusAssets({ environment: "dev", client });
    const refs = snapshot.references;
    const emittedFields = new Set(
      refs.map((ref) => `${ref.collection}.${ref.field}`),
    );

    for (const expected of [
      "site_meta.default_og_image",
      "route_seo.og_image",
      "about_languages.image",
      "blog_posts.cover_image",
      "blog_posts.svg_illustration",
      "blog_posts.body",
      "icons.iconify_id",
      "icons.svg_override",
      "illustrations.file",
      "projects.hero_image",
      "projects.hero_image_light",
      "projects.hero_image_secondary",
      "projects.hero_image_secondary_light",
      "projects.svg_illustration",
      "projects_translations.description",
      "projects_sections_translations.content",
      "services.svg",
      "legal_pages_translations.body",
      "tech_stack.icon_id",
      "tech_stack_translations.what_it_is",
      "tech_stack_translations.what_i_use_it_for",
      "tech_stack_translations.why_i_use_it_instead",
      "block_about_content.headshot",
      "block_about_content.client_logos",
      "block_about_content_translations.polaroids",
      "block_about_content_translations.interests",
      "block_about_content_translations.testimonials",
      "nav_links.icon",
    ]) {
      expect(emittedFields.has(expected)).toBe(true);
    }
    expect(refs.some((ref) => ref.collection === "contact_channels")).toBe(
      false,
    );
    expect(
      refs.some(
        (ref) => ref.collection === "stack_archetypes" && ref.field === "icon",
      ),
    ).toBe(false);
    expect(refs.some((ref) => ref.consumption === "non-asset-token")).toBe(
      false,
    );

    expect(refs.find((ref) => ref.collection === "site_meta")).toEqual(
      expect.objectContaining({
        ownerType: "site",
        ownerKey: "site",
        route: "/",
        active: true,
        slot: "og-image",
        required: true,
        deliveryMode: "og-meta",
        referenceKind: "typed-file-relation",
        fileId: FILE_A,
        consumption: "rendered",
      }),
    );
    expect(refs.find((ref) => ref.collection === "route_seo")).toEqual(
      expect.objectContaining({
        ownerType: "route",
        ownerKey: "/landing",
        route: "/landing",
        active: true,
        slot: "og-image",
        required: false,
        deliveryMode: "og-meta",
        consumption: "rendered",
      }),
    );
    const languageRefs = refs.filter(
      (ref) => ref.collection === "about_languages",
    );
    expect(languageRefs).toHaveLength(2);
    expect(languageRefs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          locale: "en",
          contextualAlt: "French",
          required: true,
          deliveryMode: "local-img",
        }),
        expect.objectContaining({
          locale: "fr",
          contextualAlt: "Français",
          required: true,
          deliveryMode: "local-img",
        }),
      ]),
    );
    expect(
      refs.find(
        (ref) => ref.collection === "blog_posts" && ref.field === "cover_image",
      ),
    ).toEqual(
      expect.objectContaining({
        active: true,
        consumption: "rendered",
        slot: "og-image",
        deliveryMode: "og-meta",
      }),
    );
    expect(
      refs.find(
        (ref) =>
          ref.collection === "services" && ref.itemKey === "data-systems",
      ),
    ).toEqual(
      expect.objectContaining({
        active: true,
        rawRef: "apps/web/static/svg/services/service-data.svg",
        referenceKind: "repository-path",
        required: true,
        deliveryMode: "inline-svg",
      }),
    );
    expect(
      refs.find(
        (ref) =>
          ref.collection === "services" && ref.itemKey === "hidden-service",
      )?.active,
    ).toBe(false);
    expect(
      refs.find(
        (ref) =>
          ref.collection === "block_about_content_translations" &&
          ref.field === "interests",
      ),
    ).toEqual(
      expect.objectContaining({
        required: true,
        deliveryMode: "css-background",
        consumption: "rendered",
      }),
    );

    for (const [collection, field] of [
      ["projects", "svg_illustration"],
      ["illustrations", "file"],
      ["nav_links", "icon"],
      ["block_about_content", "client_logos"],
      ["block_about_content_translations", "testimonials"],
    ] as const) {
      const reference = refs.find(
        (ref) => ref.collection === collection && ref.field === field,
      );
      expect(reference).toEqual(
        expect.objectContaining({
          active: false,
          consumption: "cms-intent-only",
        }),
      );
    }
  });

  it("validates Iconify provider keys exactly and inherits icon activity only from consumers", async () => {
    const client = makeClient({
      pageRows: {
        icons: [
          {
            id: "valid",
            status: "draft",
            name: "Valid",
            iconify_id: "simple-icons:svelte.js",
            svg_override: FILE_A,
          },
          {
            id: "invalid",
            status: "published",
            name: "Invalid",
            iconify_id: "https://iconify.example/logos:svelte",
            svg_override: null,
          },
          {
            id: "orphan",
            status: "published",
            name: "Orphan",
            iconify_id: "logos:orphan",
            svg_override: FILE_B,
          },
        ],
        tech_stack: [
          {
            id: "tech-valid",
            name: "Valid",
            status: "published",
            icon_id: "valid",
          },
          {
            id: "tech-invalid",
            name: "Invalid",
            status: "published",
            icon_id: "invalid",
          },
        ],
        site_pages: [
          {
            id: uuidFor(90),
            status: "published",
            path: "/tech-stack",
            type: "listing",
          },
        ],
      },
    });
    const snapshot = await scanDirectusAssets({ environment: "dev", client });
    const valid = snapshot.references.find(
      (ref) =>
        ref.collection === "icons" &&
        ref.itemKey === "valid" &&
        ref.field === "iconify_id",
    );
    expect(valid).toEqual(
      expect.objectContaining({
        rawRef: "simple-icons:svelte.js",
        referenceKind: "external-provider",
        deliveryMode: "external-url",
        active: true,
      }),
    );
    const invalid = snapshot.references.find(
      (ref) =>
        ref.collection === "icons" &&
        ref.itemKey === "invalid" &&
        ref.field === "iconify_id",
    );
    expect(invalid).toEqual(
      expect.objectContaining({
        rawRef: "https://iconify.example/logos:svelte",
        referenceKind: "unresolved-media",
        active: true,
      }),
    );
    expect(
      snapshot.references.find(
        (ref) =>
          ref.collection === "icons" &&
          ref.itemKey === "orphan" &&
          ref.field === "iconify_id",
      )?.active,
    ).toBe(false);
    expect(
      snapshot.references.some(
        (ref) =>
          ref.collection === "icons" &&
          ref.itemKey === "invalid" &&
          ref.referenceKind === "external-url",
      ),
    ).toBe(false);
  });

  it("cascades listing and parent publicness and treats every non-published status as inactive", async () => {
    const client = makeClient({
      pageRows: {
        route_seo: [
          { id: 1, path: "/public", status: "published", og_image: FILE_A },
          { id: 2, path: "/draft-page", status: "published", og_image: FILE_B },
          { id: 3, path: "/public", status: "draft", og_image: FILE_C },
        ],
        projects: [
          {
            id: "draft-project",
            status: null,
            hero_image: FILE_A,
            hero_image_light: null,
            hero_image_secondary: null,
            hero_image_secondary_light: null,
            svg_illustration: null,
          },
        ],
        projects_translations: [
          {
            id: 4,
            projects_id: "draft-project",
            languages_code: "en",
            title: "Draft",
            description: imageDocument({ light: null }),
          },
        ],
        site_pages: [
          {
            id: uuidFor(91),
            status: "published",
            path: "/public",
            type: "freeform",
          },
          {
            id: uuidFor(92),
            status: "draft",
            path: "/draft-page",
            type: "freeform",
          },
          {
            id: uuidFor(93),
            status: "archived",
            path: "/projects",
            type: "listing",
          },
        ],
      },
    });
    const snapshot = await scanDirectusAssets({ environment: "dev", client });
    const routeRefs = snapshot.references.filter(
      (ref) => ref.collection === "route_seo",
    );
    expect(routeRefs.find((ref) => ref.itemKey === "1")?.active).toBe(true);
    expect(routeRefs.find((ref) => ref.itemKey === "2")?.active).toBe(false);
    expect(routeRefs.find((ref) => ref.itemKey === "3")?.active).toBe(false);
    expect(
      snapshot.references
        .filter(
          (ref) =>
            ref.collection === "projects" ||
            ref.collection === "projects_translations",
        )
        .every((ref) => ref.active === false),
    ).toBe(true);
  });
});

describe("deterministic Directus snapshot canonicalization", () => {
  it("sorts every domain array and object key with NFC strings, LF, tab indentation, and one trailing newline", async () => {
    const base = await scanDirectusAssets({
      environment: "dev",
      client: makeClient({
        pageRows: {
          directus_folders: [
            { id: uuidFor(101), name: "Zulu", parent: null },
            { id: uuidFor(100), name: "Cafe\u0301\r\nArt", parent: null },
          ],
        },
      }),
    });
    const left = structuredClone(base) as DirectusAssetSnapshot;
    const right = structuredClone(base) as DirectusAssetSnapshot;
    (
      right as unknown as { folders: Array<Record<string, unknown>> }
    ).folders.reverse();
    (
      right as unknown as { readReceipts: Array<Record<string, unknown>> }
    ).readReceipts.reverse();
    const decomposed = (
      right as unknown as { folders: Array<{ name: string }> }
    ).folders.find((folder) => folder.name.includes("Cafe"));
    if (decomposed) decomposed.name = "Café\nArt";

    const canonicalLeft = canonicalizeDirectusAssetSnapshot(left);
    const canonicalRight = canonicalizeDirectusAssetSnapshot(right);
    expect(canonicalLeft).toBe(canonicalRight);
    expect(canonicalLeft.endsWith("\n")).toBe(true);
    expect(canonicalLeft.endsWith("\n\n")).toBe(false);
    expect(canonicalLeft).not.toContain("\r");
    expect(canonicalLeft).toContain("Café".normalize("NFC"));
    expect(canonicalLeft).toContain('\n\t"environment"');
    expect(hashDirectusAssetSnapshot(left)).toBe(
      sha256(new TextEncoder().encode(canonicalLeft)),
    );
    expect(hashDirectusAssetSnapshot(right)).toBe(
      hashDirectusAssetSnapshot(left),
    );
  });
});
