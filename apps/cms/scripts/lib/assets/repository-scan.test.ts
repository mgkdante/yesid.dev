import { afterEach, describe, expect, it } from "bun:test";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import {
  defineAssetUsages,
  parseAssetSemanticKey,
  type AssetUsageDeclaration,
} from "@repo/shared";
import { assetUsageDeclarations } from "../../../../web/src/lib/assets/usage-declarations";
import {
  canonicalizeRepositoryScan,
  hashRepositoryScan,
  scanRepository,
  scanSvelteAssetSurface,
  type RepositoryScan,
} from "./repository-scan";

const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryRoots
      .splice(0)
      .map((root) => rm(root, { recursive: true, force: true })),
  );
});

async function makeMiniRepo(files: Record<string, string | Uint8Array>) {
  const root = await mkdtemp(join(tmpdir(), "yesid-repository-scan-"));
  temporaryRoots.push(root);
  for (const [repoPath, contents] of Object.entries(files)) {
    const absolutePath = join(root, ...repoPath.split("/"));
    await mkdir(dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, contents);
  }
  return { root, trackedFiles: Object.keys(files) };
}

function declaration(
  overrides: Partial<AssetUsageDeclaration> = {},
): AssetUsageDeclaration {
  return defineAssetUsages([
    {
      usageKey: "site.demo.dynamic-image",
      semanticKey: "site.demo.dynamic-image",
      consumerType: "component",
      consumerKey: "demo",
      source: "apps/web/src/lib/Demo.svelte#dynamicImage",
      route: "/",
      locale: null,
      slot: "hero",
      required: true,
      deliveryMode: "local-img",
      confidence: "declared-dynamic",
      reason: "The filename is selected at runtime.",
      ...overrides,
    },
  ])[0]!;
}

describe("scanSvelteAssetSurface", () => {
  it("masks comments and script/style bodies while preserving real markup roots and bounded references", () => {
    const source = [
      '<!-- <svg></svg><img src="/images/comment.png"> -->',
      '<script lang="ts">',
      "  // const fake = '<svg><img src=\"/images/fake.png\">';",
      "  import raw from '$lib/assets/raw.svg?raw';",
      "  const literal = '/images/real.png';",
      "  const dynamic = `/images/${slug}.png`;",
      "  node.innerHTML = raw;",
      "  new DOMParser();",
      "  node.appendChild(child);",
      "  fetch('/svg/graffiti/the-end.svg');",
      "</script>",
      "<style>",
      "  /* .fake { background: url('/images/comment.png'); } */",
      "  .mask { filter: url(#paint); }",
      "  .real { background: url('/images/background.png'); }",
      "  .embedded { background: url(data:image/svg+xml;base64,abc); }",
      "</style>",
      '<svg><defs><linearGradient id="paint" /></defs></svg>',
      "<div><svg></svg></div>",
      '<picture><source srcset="/images/real.w240.webp 240w"></picture>',
      '<img src="/images/real.png" alt="">',
      '<!-- <video><source src="fake.mp4"></video> -->',
    ].join("\r\n");

    const surface = scanSvelteAssetSurface(
      "apps/web/src/lib/Demo.svelte",
      source,
    );
    expect(surface.inlineSvgLines).toHaveLength(2);
    expect(surface.imageLines).toHaveLength(1);
    expect(surface.sourceLines).toHaveLength(1);
    expect(surface.pictureLines).toHaveLength(1);
    expect(surface.videoLines).toEqual([]);
    expect(surface.audioLines).toEqual([]);
    expect(
      surface.literalReferences.map((reference) => reference.rawRef),
    ).toEqual(
      expect.arrayContaining([
        "$lib/assets/raw.svg?raw",
        "/images/real.png",
        "/images/background.png",
        "/images/real.w240.webp",
      ]),
    );
    expect(
      surface.literalReferences.map((reference) => reference.rawRef),
    ).not.toContain("/images/comment.png");
    expect(
      surface.literalReferences.map((reference) => reference.rawRef),
    ).not.toContain("#paint");
    expect(
      surface.literalReferences.some((reference) =>
        reference.rawRef.startsWith("data:"),
      ),
    ).toBe(false);
    expect(
      surface.dynamicReferences.map((reference) => reference.rawRef),
    ).toContain("/images/${slug}.png");
    expect(surface.rawInsertionLines).toHaveLength(4);
    expect(
      surface.rawInsertionLines.some((item) =>
        item.rawRef.includes("fetch('/svg/graffiti/the-end.svg')"),
      ),
    ).toBe(true);
    expect(
      surface.literalReferences.every((reference) => reference.sourceLine > 0),
    ).toBe(true);
  });

  it("normalizes parsed Unicode/newlines without changing one-based source lines", () => {
    const surface = scanSvelteAssetSurface(
      "apps/web/src/lib/Cafe.svelte",
      '<!-- cafe\u0301 <svg></svg> -->\r\n<svg aria-label="cafe\u0301"></svg>\r\n<img src="/images/cafe\u0301.png">',
    );
    expect(surface.inlineSvgLines).toEqual([2]);
    expect(surface.imageLines).toEqual([3]);
    expect(
      surface.literalReferences.find((reference) =>
        reference.rawRef.includes("caf"),
      )?.rawRef,
    ).toBe("/images/café.png");
  });

  it("parses dynamic, shorthand, conditional, and literal media attributes with bounded alt evidence", () => {
    const source = [
      "<img src={identity.headshot} alt={name}>",
      "<img src={item.icon === 'champlain' ? '/images/about/edu-champlain.svg' : '/images/about/edu-bishops.svg'} alt=\"\">",
      "<img {src} {alt}>",
      '<img src="/images/static.png" alt="Portrait">',
      '<img src="/images/no-alt.png">',
      "<video poster={poster}><source src={clip}></video>",
    ].join("\n");
    const surface = scanSvelteAssetSurface(
      "apps/web/src/lib/Media.svelte",
      source,
    );
    const imageTags = surface.mediaTags.filter((tag) => tag.tagName === "img");
    expect(imageTags).toHaveLength(5);
    expect(imageTags.map((tag) => tag.sourceLine)).toEqual([1, 2, 3, 4, 5]);
    expect(imageTags[0]).toEqual(
      expect.objectContaining({
        sourceExpression: "identity.headshot",
        altTextOverride: null,
        altSource: "name",
      }),
    );
    expect(
      imageTags[1]?.literalCandidates.map((reference) => reference.rawRef),
    ).toEqual([
      "/images/about/edu-bishops.svg",
      "/images/about/edu-champlain.svg",
    ]);
    expect(imageTags[1]).toEqual(
      expect.objectContaining({ altTextOverride: "", altSource: "literal" }),
    );
    expect(imageTags[2]).toEqual(
      expect.objectContaining({
        sourceExpression: "src",
        altTextOverride: null,
        altSource: "alt",
      }),
    );
    expect(imageTags[3]).toEqual(
      expect.objectContaining({
        altTextOverride: "Portrait",
        altSource: "literal",
      }),
    );
    expect(imageTags[4]).toEqual(
      expect.objectContaining({ altTextOverride: null, altSource: null }),
    );
    expect(surface.mediaTags.map((tag) => tag.tagName)).toEqual([
      "img",
      "img",
      "img",
      "img",
      "img",
      "video",
      "source",
    ]);
  });
});

describe("dynamic media expression anchors", () => {
  it("preserves declaration fragments and anchors each unknown media usage to its normalized expression", async () => {
    const sourceFile = "apps/web/src/lib/Demo.svelte";
    const mini = await makeMiniRepo({
      [sourceFile]: [
        '<script lang="ts">',
        "  let heroImage: string;",
        "  let unrelatedImage: string;",
        "</script>",
        '<img src={heroImage} alt="">',
        '<img src={unrelatedImage} alt="">',
      ].join("\n"),
    });
    const scan = await scanRepository({
      repoRoot: mini.root,
      trackedFiles: mini.trackedFiles,
      declarations: [
        declaration({
          source: `${sourceFile}#img-src:heroImage`,
        }),
      ],
    });

    expect(
      scan.usages
        .filter((usage) => usage.confidence === "unknown")
        .map((usage) => usage.sourceFile)
        .sort(),
    ).toEqual([
      `${sourceFile}#img-src:heroImage`,
      `${sourceFile}#img-src:unrelatedImage`,
    ]);
    expect(
      scan.usages.find(
        (usage) => usage.id === "declared:site.demo.dynamic-image",
      )?.sourceFile,
    ).toBe(`${sourceFile}#img-src:heroImage`);
  });

  it("keeps dynamic media identities stable across line churn while retaining diagnostic lines", async () => {
    const sourceFile = "apps/web/src/lib/Demo.svelte";
    const declarationRow = declaration({
      source: `${sourceFile}#img-src:primaryImage?.src`,
    });
    const scanSource = async (blankLines: number) => {
      const mini = await makeMiniRepo({
        [sourceFile]: [
          '<script lang="ts">',
          "  let primaryImage: { src: string; srcset: string };",
          "</script>",
          ...Array.from({ length: blankLines }, () => ""),
          '<img src={primaryImage?.src} srcset={primaryImage?.srcset} alt="">',
        ].join("\n"),
      });
      return scanRepository({
        repoRoot: mini.root,
        trackedFiles: mini.trackedFiles,
        declarations: [declarationRow],
      });
    };

    const before = await scanSource(0);
    const after = await scanSource(3);
    const unknownRows = (scan: RepositoryScan) =>
      scan.usages
        .filter((usage) => usage.confidence === "unknown")
        .map(({ id, sourceFile, sourceLine }) => ({
          id,
          sourceFile,
          sourceLine,
        }))
        .sort((left, right) => left.sourceFile.localeCompare(right.sourceFile));

    expect(
      unknownRows(before).map(({ id, sourceFile }) => ({ id, sourceFile })),
    ).toEqual(
      unknownRows(after).map(({ id, sourceFile }) => ({ id, sourceFile })),
    );
    expect(unknownRows(before).map((usage) => usage.sourceFile)).toEqual([
      `${sourceFile}#img-src:primaryImage?.src`,
      `${sourceFile}#img-srcset:primaryImage?.srcset`,
    ]);
    expect(unknownRows(before).map((usage) => usage.sourceLine)).not.toEqual(
      unknownRows(after).map((usage) => usage.sourceLine),
    );
  });
});

describe("scanRepository with an injected mini-repository", () => {
  it("excludes the generated audit baseline from consumer evidence and scan recursion", async () => {
    const baselinePath = "apps/cms/fixtures/assets/audit-baseline.json";
    const imagePath = "apps/web/static/images/real.png";
    const miniRepo = await makeMiniRepo({
      [imagePath]: new Uint8Array([1, 2, 3]),
      [baselinePath]: JSON.stringify({ acceptedAsset: "/images/real.png" }),
    });

    const before = await scanRepository({
      repoRoot: miniRepo.root,
      trackedFiles: miniRepo.trackedFiles,
    });
    await writeFile(
      join(miniRepo.root, ...baselinePath.split("/")),
      JSON.stringify({ acceptedAsset: "/images/replacement.png" }),
    );
    const after = await scanRepository({
      repoRoot: miniRepo.root,
      trackedFiles: miniRepo.trackedFiles,
    });

    expect(after).toEqual(before);
    expect(hashRepositoryScan(after)).toBe(hashRepositoryScan(before));
    expect(
      before.usages.some((usage) => usage.sourceFile === baselinePath),
    ).toBe(false);
    expect(
      before.findings.some((finding) => finding.sourceFile === baselinePath),
    ).toBe(false);
  });

  it("builds deterministic physical, component, usage, finding, hash, glob, and UUID evidence", async () => {
    const knownUuid = "11111111-1111-4111-8111-111111111111";
    const web3FormsUuid = "6887fd90-3348-4d31-ba03-bc0e285697b6";
    const demo = [
      '<script lang="ts">',
      "  import Inline from '$lib/icons/Inline.svelte';",
      "  import raw from '$lib/assets/raw.svg?raw';",
      "  // const ignored = '/images/comment.png';",
      "  const missing = '/images/missing.png';",
      "  const remote = 'https://cdn.example.com/remote.png';",
      "  const dynamicImage = `/images/${slug}.png`;",
      "  node.innerHTML = raw;",
      "  new DOMParser();",
      "  node.appendChild(child);",
      "</script>",
      '<style>.demo { background: url("/images/background.png"); }</style>',
      "<Inline />",
      "<svg></svg>",
      '<img src="/images/real.png" alt="">',
    ].join("\n");
    const files: Record<string, string | Uint8Array> = {
      "apps/web/static/images/real.png": new Uint8Array([0, 1, 2, 3, 255]),
      "apps/web/static/images/background.png": new Uint8Array([4, 5, 6]),
      "apps/web/static/svg/services/service-demo.svg": "<svg></svg>",
      "apps/web/src/lib/assets/raw.svg": "<svg></svg>",
      "apps/web/src/lib/icons/Inline.svelte":
        "<svg></svg>\n<!-- <svg></svg> -->\n<svg></svg>",
      "apps/web/src/lib/Demo.svelte": demo,
      "apps/web/src/lib/glob.ts": [
        "const services = import.meta.glob('/static/svg/services/*.svg', { query: '?raw' });",
        "const dynamic = `/svg/services/${name}.svg`;",
      ].join("\n"),
      "apps/web/src/lib/demo.css": [
        "/* url('/images/comment.png') */",
        ".hero { background-image: url('/images/real.png'); }",
        ".internal { filter: url(#paint); }",
      ].join("\n"),
      "apps/cms/fixtures/assets-id-map.json": JSON.stringify({
        "images/real.png": knownUuid,
      }),
      "packages/shared/fixtures/assets-id-map.json": JSON.stringify({
        "images/real.png": knownUuid,
      }),
      "apps/cms/fixtures/collections/contact.json": JSON.stringify({
        hero_image: knownUuid,
        web3formsKey: web3FormsUuid,
      }),
    };
    const miniRepo = await makeMiniRepo(files);
    const trackedFiles = [
      ...miniRepo.trackedFiles,
      "apps/web/static/images/real.png",
    ];
    const declarations = [
      declaration(),
      declaration({
        usageKey: "site.demo.missing-source",
        semanticKey: parseAssetSemanticKey("site.demo.missing-source"),
        source: "apps/web/src/lib/Missing.svelte#image",
      }),
    ];

    const first = await scanRepository({
      repoRoot: miniRepo.root,
      trackedFiles,
      declarations,
    });
    const second = await scanRepository({
      repoRoot: miniRepo.root,
      trackedFiles: [...trackedFiles].reverse(),
      declarations: [...declarations].reverse(),
    });

    expect(first).toEqual(second);
    expect(first.assets.map((asset) => asset.id)).toEqual(
      [...first.assets.map((asset) => asset.id)].sort(),
    );
    expect(first.assets).toContainEqual(
      expect.objectContaining({
        id: "repo-file:apps/web/static/images/real.png",
        kind: "raster",
        sha256: createHash("sha256")
          .update(files["apps/web/static/images/real.png"]!)
          .digest("hex"),
        bytes: 5,
      }),
    );
    expect(
      first.assets.filter(
        (asset) => asset.repoPath === "apps/web/src/lib/icons/Inline.svelte",
      ),
    ).toHaveLength(2);
    expect(first.assets.map((asset) => asset.id)).toEqual(
      expect.arrayContaining([
        "repo-component:apps/web/src/lib/icons/Inline.svelte#svg:1",
        "repo-component:apps/web/src/lib/icons/Inline.svelte#svg:2",
      ]),
    );
    for (const id of [
      "repo-component:apps/web/src/lib/icons/Inline.svelte#svg:1",
      "repo-component:apps/web/src/lib/icons/Inline.svelte#svg:2",
    ]) {
      expect(
        first.usages.some(
          (usage) =>
            usage.assetId === id && usage.sourceFile.endsWith("Demo.svelte"),
        ),
      ).toBe(true);
    }
    expect(
      first.usages.some(
        (usage) =>
          usage.assetId ===
            "repo-file:apps/web/static/svg/services/service-demo.svg" &&
          usage.sourceFile === "apps/web/src/lib/glob.ts",
      ),
    ).toBe(true);
    expect(
      first.usages.some(
        (usage) =>
          usage.assetId === "repo-file:apps/web/static/images/real.png" &&
          usage.cmsField === "hero_image",
      ),
    ).toBe(true);
    expect(
      first.usages.some(
        (usage) => usage.id === "declared:site.demo.dynamic-image",
      ),
    ).toBe(true);
    expect(first.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "duplicate-identity",
          rawRef: "apps/web/static/images/real.png",
        }),
        expect.objectContaining({
          code: "dynamic-reference",
          rawRef: "/images/${slug}.png",
        }),
        expect.objectContaining({
          code: "missing-target",
          rawRef: "/images/missing.png",
        }),
        expect.objectContaining({
          code: "undeclared-external",
          rawRef: "https://cdn.example.com/remote.png",
        }),
        expect.objectContaining({
          code: "unsupported-pattern",
          rawRef: expect.stringContaining("innerHTML"),
        }),
        expect.objectContaining({
          code: "missing-target",
          rawRef: "apps/web/src/lib/Missing.svelte#image",
        }),
      ]),
    );
    const canonical = canonicalizeRepositoryScan(first);
    expect(canonical).not.toContain(miniRepo.root);
    expect(canonical).not.toContain(web3FormsUuid);
    expect(canonical).not.toContain("/images/comment.png");
    expect(canonical.endsWith("\n")).toBe(true);
    expect(canonical.endsWith("\n\n")).toBe(false);
    expect(hashRepositoryScan(first)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("rejects duplicate declared identities and reports declarations unmatched by any dynamic seam", async () => {
    const miniRepo = await makeMiniRepo({
      "apps/web/src/lib/Demo.svelte": "<svg></svg>",
    });
    const declared = declaration();
    await expect(
      scanRepository({
        repoRoot: miniRepo.root,
        trackedFiles: miniRepo.trackedFiles,
        declarations: [declared, { ...declared }],
      }),
    ).rejects.toThrow(/duplicate declared usage/i);

    const scan = await scanRepository({
      repoRoot: miniRepo.root,
      trackedFiles: miniRepo.trackedFiles,
      declarations: [declared],
    });
    expect(scan.findings).toContainEqual(
      expect.objectContaining({
        code: "unsupported-pattern",
        rawRef: "declaration:site.demo.dynamic-image:unmatched",
      }),
    );
  });

  it("does not classify source modules or root documentation as physical media assets", async () => {
    const miniRepo = await makeMiniRepo({
      "apps/web/src/lib/assets/usage-declarations.ts":
        "export const declarations = [];",
      "apps/web/src/lib/assets/real.svg": "<svg></svg>",
      "apps/web/src/lib/og/fonts/README.md": "Font license notes.",
      "apps/web/src/lib/og/fonts/Real.ttf": new Uint8Array([0, 1, 2]),
    });
    const scan = await scanRepository({
      repoRoot: miniRepo.root,
      trackedFiles: miniRepo.trackedFiles,
    });
    expect(
      scan.assets.some(
        (asset) =>
          asset.repoPath === "apps/web/src/lib/assets/usage-declarations.ts",
      ),
    ).toBe(false);
    expect(
      scan.assets.some(
        (asset) => asset.repoPath === "apps/web/src/lib/og/fonts/README.md",
      ),
    ).toBe(false);
    expect(scan.assets.map((asset) => asset.repoPath)).toEqual(
      expect.arrayContaining([
        "apps/web/src/lib/assets/real.svg",
        "apps/web/src/lib/og/fonts/Real.ttf",
      ]),
    );
  });

  it("binds rendered app.html favicon references to tracked public assets", async () => {
    const miniRepo = await makeMiniRepo({
      "apps/web/static/favicon.svg": "<svg></svg>",
      "apps/web/src/app.html":
        '<html><head><link rel="icon" href="%sveltekit.assets%/favicon.svg"></head></html>',
    });
    const scan = await scanRepository({
      repoRoot: miniRepo.root,
      trackedFiles: miniRepo.trackedFiles,
    });
    expect(scan.usages).toContainEqual(
      expect.objectContaining({
        assetId: "repo-file:apps/web/static/favicon.svg",
        sourceFile: "apps/web/src/app.html",
        sourceLine: 1,
      }),
    );
    expect(
      scan.findings.some(
        (finding) => finding.sourceFile === "apps/web/src/app.html",
      ),
    ).toBe(false);
  });

  it("never silently drops bounded asset-like literals from non-media sources", async () => {
    const directusRef = "/assets/11111111-1111-4111-8111-111111111111";
    const miniRepo = await makeMiniRepo({
      "apps/web/static/svg/services/service-demo.svg": "<svg></svg>",
      "apps/web/src/lib/content/demo.ts": [
        `export const directus = "${directusRef}";`,
        'export const service = "service-demo.svg";',
        'export const legacy = "images/work/missing.png";',
        'export const nonAssets = ["/assets/", "/og/", ".svelte", ".svg", ".png", "image/svg+xml", "v1.2.3", "service-demo"];',
      ].join("\n"),
    });
    const first = await scanRepository({
      repoRoot: miniRepo.root,
      trackedFiles: miniRepo.trackedFiles,
    });
    const second = await scanRepository({
      repoRoot: miniRepo.root,
      trackedFiles: [...miniRepo.trackedFiles].reverse(),
    });
    expect(first).toEqual(second);

    const hasEvidence = (rawRef: string, sourceLine: number) =>
      first.usages.some(
        (usage) =>
          usage.sourceFile === "apps/web/src/lib/content/demo.ts" &&
          usage.sourceLine === sourceLine &&
          usage.unresolvedRef === rawRef,
      ) ||
      first.findings.some(
        (finding) =>
          finding.sourceFile === "apps/web/src/lib/content/demo.ts" &&
          finding.sourceLine === sourceLine &&
          finding.rawRef === rawRef,
      );
    expect(hasEvidence(directusRef, 1)).toBe(true);
    expect(hasEvidence("service-demo.svg", 2)).toBe(true);
    expect(hasEvidence("images/work/missing.png", 3)).toBe(true);

    for (const nonAsset of [
      "/assets/",
      "/og/",
      ".svelte",
      ".svg",
      ".png",
      "image/svg+xml",
      "v1.2.3",
      "service-demo",
    ]) {
      expect(
        first.usages.some((usage) => usage.unresolvedRef === nonAsset) ||
          first.findings.some((finding) => finding.rawRef === nonAsset),
      ).toBe(false);
    }
  });

  it("resolves CMS brand UUIDs and ignores non-rendered configuration, operations, and ambient declarations", async () => {
    const brandUuid = "22222222-2222-4222-8222-222222222222";
    const miniRepo = await makeMiniRepo({
      "apps/cms/brand/yesid-icon.svg": "<svg></svg>",
      "apps/cms/fixtures/assets-id-map.json": JSON.stringify({
        "brand/yesid-icon.svg": brandUuid,
      }),
      "packages/shared/fixtures/assets-id-map.json": JSON.stringify({
        "brand/yesid-icon.svg": brandUuid,
      }),
      "apps/cms/fixtures/collections/site.json": JSON.stringify({
        logo: brandUuid,
      }),
      "apps/cms/ops/i18n/drop.json": JSON.stringify({ logo: brandUuid }),
      "apps/cms/tsconfig.json": JSON.stringify({
        asset: "/images/missing-config.png",
      }),
      "apps/web/src/ambient.d.ts": "declare module '*.svg?raw';",
      "apps/web/src/lib/route-prefix.ts": "export const prefix = '/og/';",
    });
    const scan = await scanRepository({
      repoRoot: miniRepo.root,
      trackedFiles: miniRepo.trackedFiles,
    });
    expect(
      scan.usages.some(
        (usage) =>
          usage.assetId === "repo-file:apps/cms/brand/yesid-icon.svg" &&
          usage.unresolvedRef === brandUuid &&
          usage.cmsField === "logo",
      ),
    ).toBe(true);
    for (const ignoredSource of [
      "apps/cms/ops/i18n/drop.json",
      "apps/cms/tsconfig.json",
      "apps/web/src/ambient.d.ts",
    ]) {
      expect(
        scan.usages.some((usage) => usage.sourceFile === ignoredSource),
      ).toBe(false);
      expect(
        scan.findings.some((finding) => finding.sourceFile === ignoredSource),
      ).toBe(false);
    }
    expect(scan.findings.some((finding) => finding.rawRef === "/og/")).toBe(
      false,
    );
  });

  it("treats the validated TechIcon provider template as resolved while retaining other dynamic evidence", async () => {
    const miniRepo = await makeMiniRepo({
      "apps/web/src/lib/components/stack-engine/TechIcon.svelte": [
        '<script lang="ts">',
        "const resolved = `https://api.iconify.design/${encodeURIComponent(prefix)}/${encodeURIComponent(name)}.svg`;",
        "const stillDynamic = `/images/${slug}.png`;",
        "</script>",
      ].join("\n"),
      "apps/web/src/lib/content/tech-stack.ts":
        "export const tech = [{ iconify_id: 'logos:svelte' }];",
    });
    const scan = await scanRepository({
      repoRoot: miniRepo.root,
      trackedFiles: miniRepo.trackedFiles,
    });
    expect(
      scan.assets.some((asset) => asset.id === "external:iconify:logos:svelte"),
    ).toBe(true);
    expect(
      scan.findings.some(
        (finding) =>
          finding.sourceFile.endsWith("TechIcon.svelte") &&
          finding.rawRef.includes("api.iconify.design"),
      ),
    ).toBe(false);
    expect(scan.findings).toContainEqual(
      expect.objectContaining({
        code: "dynamic-reference",
        rawRef: "/images/${slug}.png",
      }),
    );
  });
});

describe("canonical repository scan", () => {
  it("recursively sorts keys, normalizes text to NFC/LF, and hashes the exact canonical bytes", () => {
    const scan: RepositoryScan = {
      schemaVersion: 1,
      assets: [
        {
          id: "repo-file:apps/web/static/cafe\u0301.svg",
          kind: "svg",
          origin: "repository-file",
          repoPath: "apps/web/static/cafe\u0301.svg",
          sha256: "a".repeat(64),
          bytes: 1,
          inlineSvgOrdinal: null,
        },
        {
          id: "repo-file:apps/web/static/alpha.svg",
          kind: "svg",
          origin: "repository-file",
          repoPath: "apps/web/static/alpha.svg",
          sha256: "b".repeat(64),
          bytes: 2,
          inlineSvgOrdinal: null,
        },
      ],
      usages: [
        {
          id: "exact:z:repo-file:z:1",
          assetId: null,
          semanticKey: null,
          unresolvedRef: "z",
          confidence: "unknown",
          consumerType: "system",
          consumerKey: "z",
          sourceKind: "repository",
          sourceFile: "z.ts",
          sourceLine: 2,
          cmsField: null,
          route: null,
          locale: null,
          slot: "z",
          required: false,
          deliveryMode: "download",
          altTextOverride: null,
          altSource: null,
        },
        {
          id: "exact:a:repo-file:a:1",
          assetId: null,
          semanticKey: null,
          unresolvedRef: "a",
          confidence: "unknown",
          consumerType: "system",
          consumerKey: "a",
          sourceKind: "repository",
          sourceFile: "a.ts",
          sourceLine: 1,
          cmsField: null,
          route: null,
          locale: null,
          slot: "a",
          required: false,
          deliveryMode: "download",
          altTextOverride: null,
          altSource: null,
        },
      ],
      generatedFrom: [
        {
          outputAssetId: "z",
          inputRef: "z",
          generator: "z",
          relation: "generated-by",
        },
        {
          outputAssetId: "a",
          inputRef: "a",
          generator: "a",
          relation: "generated-by",
        },
      ],
      findings: [
        {
          code: "unsupported-pattern",
          sourceFile: "z.ts",
          sourceLine: 2,
          rawRef: "z",
        },
        {
          code: "missing-target",
          sourceFile: "a.ts",
          sourceLine: 1,
          rawRef: "a",
        },
      ],
    };
    const canonical = canonicalizeRepositoryScan(scan);
    const reversed = canonicalizeRepositoryScan({
      ...scan,
      assets: [...scan.assets].reverse(),
      usages: [...scan.usages].reverse(),
      generatedFrom: [...scan.generatedFrom].reverse(),
      findings: [...scan.findings].reverse(),
    });
    expect(canonical.startsWith('{\n\t"assets"')).toBe(true);
    expect(canonical).toContain("café.svg");
    expect(canonical).not.toContain("cafe\u0301.svg");
    expect(canonical).not.toContain("\r");
    expect(reversed).toBe(canonical);
    expect(hashRepositoryScan(scan)).toBe(
      createHash("sha256").update(canonical).digest("hex"),
    );
  });

  it("orders normalized identities by UTF-8 bytes rather than UTF-16 code units", () => {
    const bmp = "repo-file:apps/web/static/edge-\uE000.svg";
    const supplementary = "repo-file:apps/web/static/edge-\u{10000}.svg";
    const asset = (id: string): RepositoryScan["assets"][number] => ({
      id,
      kind: "svg",
      origin: "repository-file",
      repoPath: id.slice("repo-file:".length),
      sha256: "a".repeat(64),
      bytes: 1,
      inlineSvgOrdinal: null,
    });
    const canonical = canonicalizeRepositoryScan({
      schemaVersion: 1,
      assets: [asset(supplementary), asset(bmp)],
      usages: [],
      generatedFrom: [],
      findings: [],
    });
    expect(canonical.indexOf(bmp)).toBeLessThan(
      canonical.indexOf(supplementary),
    );
  });

  it("normalizes provenance entries before deterministic UTF-8 sorting", () => {
    const buildScan = (accented: string): RepositoryScan => ({
      schemaVersion: 1,
      assets: [],
      usages: [],
      generatedFrom: [
        {
          outputAssetId: `repo-file:apps/web/static/${accented}.svg`,
          inputRef: "accented-input",
          generator: "generator.ts",
          relation: "generated-by",
        },
        {
          outputAssetId: "repo-file:apps/web/static/cafz.svg",
          inputRef: "stable-input",
          generator: "generator.ts",
          relation: "generated-by",
        },
      ],
      findings: [],
    });
    const decomposed = canonicalizeRepositoryScan(buildScan("cafe\u0301"));
    const composed = canonicalizeRepositoryScan(buildScan("café"));
    expect(decomposed).toBe(composed);
    expect(composed.indexOf("cafz.svg")).toBeLessThan(
      composed.indexOf("café.svg"),
    );
  });

  it("normalizes findings before deterministic UTF-8 sorting", () => {
    const buildScan = (accented: string): RepositoryScan => ({
      schemaVersion: 1,
      assets: [],
      usages: [],
      generatedFrom: [],
      findings: [
        {
          code: "missing-target",
          sourceFile: `apps/web/src/${accented}.ts`,
          sourceLine: 1,
          rawRef: "accented-ref.svg",
        },
        {
          code: "missing-target",
          sourceFile: "apps/web/src/cafz.ts",
          sourceLine: 1,
          rawRef: "stable-ref.svg",
        },
      ],
    });
    const decomposed = canonicalizeRepositoryScan(buildScan("cafe\u0301"));
    const composed = canonicalizeRepositoryScan(buildScan("café"));
    expect(decomposed).toBe(composed);
    expect(composed.indexOf("cafz.ts")).toBeLessThan(
      composed.indexOf("café.ts"),
    );
  });
});

describe("yesid.dev real repository contract", () => {
  const repoRoot = resolve(import.meta.dir, "../../../../..");
  const trackedFiles = execFileSync("git", ["ls-files", "-z"], {
    cwd: repoRoot,
  })
    .toString("utf8")
    .split("\0")
    .filter(Boolean);
  const futureTrackedFiles = [
    ...new Set([
      ...trackedFiles,
      "apps/cms/scripts/lib/assets/repository-scan.ts",
      "apps/cms/scripts/lib/assets/repository-scan.test.ts",
      "apps/web/src/lib/assets/usage-declarations.ts",
    ]),
  ];

  it("keeps explicit dynamic declarations pure, unique, truthful, and bound to tracked source modules", async () => {
    const usageKeys = assetUsageDeclarations.map((item) => item.usageKey);
    expect(new Set(usageKeys).size).toBe(usageKeys.length);
    for (const item of assetUsageDeclarations) {
      expect(item.confidence).toBe("declared-dynamic");
      expect(trackedFiles).toContain(item.source.split("#")[0]!);
    }
    expect(usageKeys).toEqual(
      expect.arrayContaining([
        "site.services.svg-glob",
        "site.blog.fallback-svg",
        "site.projects.fallback-art",
        "site.og.localized-static",
        "site.og.runtime-blog",
        "site.og.runtime-project",
        "site.media.uuid-mirror",
        "site.cms.image-block",
        "site.media.about-identity-headshot",
        "site.media.about-polaroid",
        "site.media.about-language",
        "site.projects.hero-primary",
        "site.projects.hero-secondary",
        "site.services.img-fallback",
        "site.cms.project-gallery-thumbnail",
        "site.cms.project-gallery-lightbox",
      ]),
    );

    const propDeclarations = assetUsageDeclarations.filter((item) =>
      item.usageKey.startsWith("site.graffiti.prop-"),
    );
    expect(propDeclarations).toHaveLength(4);
    expect(
      propDeclarations.every((item) => item.deliveryMode === "inline-svg"),
    ).toBe(true);
    expect(
      assetUsageDeclarations.find(
        (item) => item.usageKey === "site.services.img-fallback",
      )?.deliveryMode,
    ).toBe("local-img");

    const [closerProps, homeServices] = await Promise.all([
      readFile(
        join(repoRoot, "apps/web/src/lib/components/home/CloserProps.svelte"),
        "utf8",
      ),
      readFile(
        join(repoRoot, "apps/web/src/lib/components/home/HomeServices.svelte"),
        "utf8",
      ),
    ]);
    expect(closerProps).toContain("new DOMParser()");
    expect(closerProps).toContain("wrap.appendChild(svg)");
    expect(closerProps).not.toMatch(/\bsanitiz(?:e|er|ation)\b/i);
    expect(homeServices).toContain("<img");
    expect(homeServices).toContain("wrapper.innerHTML = svgText");
  });

  it("does not treat non-rendering quality-gate component lists as asset consumers", async () => {
    const scan = await scanRepository({
      repoRoot,
      trackedFiles: futureTrackedFiles,
      declarations: assetUsageDeclarations,
    });
    const gatePreset = "packages/gates/src/presets/yesid.ts";
    expect(
      scan.usages.filter((usage) => usage.sourceFile === gatePreset),
    ).toEqual([]);
    expect(
      scan.findings.filter((finding) => finding.sourceFile === gatePreset),
    ).toEqual([]);
  });

  it("does not treat test-only Svelte fixtures as rendered consumers", async () => {
    const scan = await scanRepository({
      repoRoot,
      trackedFiles: futureTrackedFiles,
      declarations: assetUsageDeclarations,
    });
    const quietModeFixture =
      "apps/web/src/lib/components/shared/_quiet-mode-fixture.svelte";
    expect(
      scan.usages.filter((usage) => usage.sourceFile === quietModeFixture),
    ).toEqual([]);
    expect(
      scan.findings.filter(
        (finding) => finding.sourceFile === quietModeFixture,
      ),
    ).toEqual([]);
  });

  it("distinguishes SVG URLs from explicit raw inline imports", async () => {
    const scan = await scanRepository({
      repoRoot,
      trackedFiles: futureTrackedFiles,
      declarations: assetUsageDeclarations,
    });
    for (const sourceFile of [
      "apps/web/src/lib/content/media-assets.ts",
      "apps/cms/scripts/lib/fetchers/page-blocks-about.ts",
    ]) {
      const languageRows = scan.usages.filter(
        (usage) =>
          usage.sourceFile === sourceFile &&
          usage.assetId?.includes("/images/about/languages/") &&
          usage.assetId.endsWith(".svg"),
      );
      expect(languageRows).toHaveLength(3);
      expect(
        languageRows.every((usage) => usage.deliveryMode === "local-img"),
      ).toBe(true);
    }
    expect(scan.usages).toContainEqual(
      expect.objectContaining({
        sourceFile: "apps/web/src/lib/adapters/static.ts",
        sourceLine: 126,
        assetId: "repo-file:apps/web/static/images/montreal-metro.svg",
        deliveryMode: "inline-svg",
      }),
    );

    const blogFallbackRows = scan.usages.filter(
      (usage) =>
        usage.sourceFile === "apps/web/src/lib/blog/static-helpers.ts" &&
        usage.sourceLine === 33 &&
        usage.assetId?.startsWith(
          "repo-file:apps/web/src/lib/assets/blog-fallbacks/",
        ),
    );
    expect(blogFallbackRows).toHaveLength(8);
    expect(
      blogFallbackRows.every((usage) => usage.deliveryMode === "inline-svg"),
    ).toBe(true);

    const serviceGlobRows = scan.usages.filter(
      (usage) =>
        usage.sourceFile === "apps/web/src/lib/utils/service-svg.ts" &&
        usage.sourceLine === 28 &&
        usage.assetId?.startsWith("repo-file:apps/web/static/svg/services/"),
    );
    expect(serviceGlobRows).toHaveLength(6);
    expect(
      serviceGlobRows.every((usage) => usage.deliveryMode === "inline-svg"),
    ).toBe(true);

    expect(scan.usages).toContainEqual(
      expect.objectContaining({
        sourceFile: "apps/web/src/lib/components/home/CloserGraffiti.svelte",
        sourceLine: 36,
        assetId: "repo-file:apps/web/static/svg/graffiti/the-end.svg",
        deliveryMode: "inline-svg",
      }),
    );
  });

  it("locks corrected asset roots, comment-aware Svelte counts, provenance, and deterministic output", async () => {
    const first = await scanRepository({
      repoRoot,
      trackedFiles,
      declarations: assetUsageDeclarations,
    });
    const second = await scanRepository({
      repoRoot,
      trackedFiles: [...trackedFiles].reverse(),
      declarations: [...assetUsageDeclarations].reverse(),
    });
    const postCommit = await scanRepository({
      repoRoot,
      trackedFiles: futureTrackedFiles,
      declarations: assetUsageDeclarations,
    });
    expect(first).toEqual(second);
    expect(hashRepositoryScan(first)).toBe(hashRepositoryScan(second));
    expect(postCommit).toEqual(first);
    expect(hashRepositoryScan(postCommit)).toBe(hashRepositoryScan(first));
    expect(
      postCommit.usages.some(
        (usage) =>
          usage.sourceFile === "apps/cms/scripts/lib/assets/repository-scan.ts",
      ),
    ).toBe(false);
    expect(
      postCommit.findings.some(
        (finding) =>
          finding.sourceFile ===
          "apps/cms/scripts/lib/assets/repository-scan.ts",
      ),
    ).toBe(false);

    const staticAssets = first.assets.filter((asset) =>
      asset.repoPath?.startsWith("apps/web/static/"),
    );
    expect(staticAssets).toHaveLength(120);
    expect(
      staticAssets.filter((asset) => asset.kind !== "document"),
    ).toHaveLength(118);
    expect(
      staticAssets.filter(
        (asset) => asset.kind === "raster" && asset.repoPath?.endsWith(".png"),
      ),
    ).toHaveLength(37);
    expect(
      staticAssets.filter((asset) => asset.repoPath?.endsWith(".webp")),
    ).toHaveLength(63);
    expect(staticAssets.filter((asset) => asset.kind === "svg")).toHaveLength(
      18,
    );
    expect(
      staticAssets.filter((asset) => asset.kind === "document"),
    ).toHaveLength(2);
    expect(
      first.assets.filter(
        (asset) =>
          asset.repoPath?.startsWith("apps/web/src/lib/assets/") &&
          asset.kind === "svg",
      ),
    ).toHaveLength(10);
    expect(
      first.assets.filter(
        (asset) =>
          asset.repoPath?.startsWith("apps/web/src/lib/og/fonts/") &&
          asset.kind === "font",
      ),
    ).toHaveLength(3);
    expect(
      first.assets.some(
        (asset) => asset.repoPath === "apps/web/src/lib/og/fonts/README.md",
      ),
    ).toBe(false);
    expect(
      first.assets.some(
        (asset) =>
          asset.repoPath === "apps/web/src/lib/assets/usage-declarations.ts",
      ),
    ).toBe(false);
    expect(
      first.assets.filter((asset) =>
        asset.repoPath?.startsWith("apps/cms/brand/"),
      ),
    ).toHaveLength(2);
    expect(
      first.assets.filter((asset) =>
        asset.repoPath?.startsWith("apps/cms/icons/"),
      ),
    ).toHaveLength(5);
    expect(
      first.assets.filter((asset) => asset.repoPath?.startsWith("gbp-assets/")),
    ).toHaveLength(16);

    const productionSvelte = trackedFiles.filter(
      (repoPath) =>
        repoPath.startsWith("apps/web/src/") &&
        repoPath.endsWith(".svelte") &&
        !repoPath.includes("/analytics/") &&
        !repoPath.includes(".test.") &&
        !repoPath.includes(".spec."),
    );
    let inlineSvgRoots = 0;
    let imageTags = 0;
    let videoTags = 0;
    let audioTags = 0;
    let svgFiles = 0;
    const renderedImageTags: Array<{ sourceFile: string; sourceLine: number }> =
      [];
    for (const repoPath of productionSvelte) {
      const source = await readFile(
        join(repoRoot, ...repoPath.split("/")),
        "utf8",
      );
      const surface = scanSvelteAssetSurface(repoPath, source);
      inlineSvgRoots += surface.inlineSvgLines.length;
      imageTags += surface.imageLines.length;
      videoTags += surface.videoLines.length;
      audioTags += surface.audioLines.length;
      for (const sourceLine of surface.imageLines)
        renderedImageTags.push({ sourceFile: repoPath, sourceLine });
      if (surface.inlineSvgLines.length > 0) svgFiles += 1;
    }
    expect({ svgFiles, inlineSvgRoots, imageTags }).toEqual({
      svgFiles: 49,
      inlineSvgRoots: 63,
      imageTags: 11,
    });
    expect({ videoTags, audioTags }).toEqual({ videoTags: 0, audioTags: 0 });
    expect(first.assets.filter((asset) => asset.kind === "video")).toEqual([]);

    const expectedImageTags = [
      "apps/web/src/lib/components/about/AboutEducation.svelte:34",
      "apps/web/src/lib/components/about/AboutIdentity.svelte:59",
      "apps/web/src/lib/components/about/AboutLanguages.svelte:47",
      "apps/web/src/lib/components/about/AboutPolaroids.svelte:72",
      "apps/web/src/lib/components/cms/blocks/ImageBlock.svelte:24",
      "apps/web/src/lib/components/home/HomeServices.svelte:163",
      "apps/web/src/lib/components/projects/ProjectHeroPreview.svelte:62",
      "apps/web/src/lib/components/projects/ProjectHeroPreview.svelte:78",
      "apps/web/src/lib/components/projects/ProjectImageGallery.svelte:82",
      "apps/web/src/lib/components/projects/ProjectImageGallery.svelte:128",
      "apps/web/src/lib/components/stack-engine/TechIcon.svelte:33",
    ].sort();
    expect(
      renderedImageTags
        .map((tag) => `${tag.sourceFile}:${tag.sourceLine}`)
        .sort(),
    ).toEqual(expectedImageTags);
    for (const tag of renderedImageTags) {
      const graphRows = first.usages.filter(
        (usage) =>
          usage.sourceFile.split("#")[0] === tag.sourceFile &&
          usage.sourceLine === tag.sourceLine &&
          (usage.assetId !== null || usage.unresolvedRef !== null),
      );
      expect(graphRows.length).toBeGreaterThan(0);
      expect(
        graphRows.every(
          (usage) =>
            Object.hasOwn(usage, "altSource") &&
            Object.hasOwn(usage, "altTextOverride"),
        ),
      ).toBe(true);
      expect(
        graphRows.some(
          (usage) => usage.altSource !== null || usage.altTextOverride !== null,
        ),
      ).toBe(true);
      if (!graphRows.some((usage) => usage.assetId !== null)) {
        expect(
          assetUsageDeclarations.some(
            (item) => item.source.split("#")[0] === tag.sourceFile,
          ),
        ).toBe(true);
      }
    }
    const declaredMediaAnchors = [
      "apps/web/src/lib/components/about/AboutIdentity.svelte#img-src:identity.headshot",
      "apps/web/src/lib/components/about/AboutIdentity.svelte#img-srcset:headshotSrcset",
      "apps/web/src/lib/components/about/AboutLanguages.svelte#img-src:imageSrc",
      "apps/web/src/lib/components/about/AboutPolaroids.svelte#img-src:current.src",
      "apps/web/src/lib/components/cms/blocks/ImageBlock.svelte#img-src:source.src",
      "apps/web/src/lib/components/cms/blocks/ImageBlock.svelte#img-srcset:source.srcset",
      "apps/web/src/lib/components/home/HomeServices.svelte#img-src:/svg/services/{service.svg}",
      "apps/web/src/lib/components/projects/ProjectHeroPreview.svelte#img-src:primaryImage?.src",
      "apps/web/src/lib/components/projects/ProjectHeroPreview.svelte#img-srcset:primaryImage?.srcset",
      "apps/web/src/lib/components/projects/ProjectHeroPreview.svelte#img-src:secondaryImage?.src",
      "apps/web/src/lib/components/projects/ProjectHeroPreview.svelte#img-srcset:secondaryImage?.srcset",
      "apps/web/src/lib/components/projects/ProjectImageGallery.svelte#img-src:source.src",
      "apps/web/src/lib/components/projects/ProjectImageGallery.svelte#img-srcset:source.srcset",
      "apps/web/src/lib/components/projects/ProjectImageGallery.svelte#img-src:activeSource?.src",
      "apps/web/src/lib/components/projects/ProjectImageGallery.svelte#img-srcset:activeSource?.srcset",
    ];
    for (const sourceFile of declaredMediaAnchors) {
      expect(
        first.usages.some(
          (usage) =>
            usage.sourceFile === sourceFile && usage.confidence === "unknown",
        ),
      ).toBe(true);
      expect(
        first.usages.some(
          (usage) =>
            usage.sourceFile === sourceFile &&
            usage.confidence === "declared-dynamic",
        ),
      ).toBe(true);
    }
    const undeclaredTechIconAnchor =
      "apps/web/src/lib/components/stack-engine/TechIcon.svelte#img-src:src";
    expect(
      first.usages.some(
        (usage) =>
          usage.sourceFile === undeclaredTechIconAnchor &&
          usage.confidence === "unknown",
      ),
    ).toBe(true);
    expect(
      first.usages.some(
        (usage) =>
          usage.sourceFile === undeclaredTechIconAnchor &&
          usage.confidence === "declared-dynamic",
      ),
    ).toBe(false);
    for (const educationAsset of [
      "repo-file:apps/web/static/images/about/edu-bishops.svg",
      "repo-file:apps/web/static/images/about/edu-champlain.svg",
    ]) {
      expect(
        first.usages.some(
          (usage) =>
            usage.sourceFile ===
              "apps/web/src/lib/components/about/AboutEducation.svelte" &&
            usage.sourceLine === 34 &&
            usage.assetId === educationAsset,
        ),
      ).toBe(true);
    }
    expect(first.usages).toContainEqual(
      expect.objectContaining({
        assetId: "repo-file:apps/web/static/favicon.svg",
        sourceFile: "apps/web/src/app.html",
        sourceLine: 42,
      }),
    );

    const hasLiteralEvidence = (
      sourceFile: string,
      sourceLine: number,
      rawRef: string,
    ) =>
      first.usages.some(
        (usage) =>
          usage.sourceFile === sourceFile &&
          usage.sourceLine === sourceLine &&
          usage.unresolvedRef === rawRef,
      ) ||
      first.findings.some(
        (finding) =>
          finding.sourceFile === sourceFile &&
          finding.sourceLine === sourceLine &&
          finding.rawRef === rawRef,
      );
    const directusSource = "apps/web/src/lib/content/projects.ts";
    for (const [sourceLine, rawRef, expectedAssetId] of [
      [
        136,
        "/assets/6048a712-de42-4cca-ab51-6f92d64685c2",
        "repo-file:apps/web/static/images/work/yesid-dev-home.png",
      ],
      [
        148,
        "/assets/c2bb6564-62ab-46c4-962b-ab2c756fde9e",
        "repo-file:apps/web/static/images/work/yesid-dev-home-light.png",
      ],
      [
        168,
        "/assets/c2fad757-ecba-457c-aff7-47d3cc504081",
        "repo-file:apps/web/static/images/work/yesid-dev-mobile.png",
      ],
      [
        180,
        "/assets/9af53f0b-aeb9-4d3f-94a6-1ba3476a4f12",
        "repo-file:apps/web/static/images/work/yesid-dev-mobile-light.png",
      ],
      [
        206,
        "/assets/6048a712-de42-4cca-ab51-6f92d64685c2",
        "repo-file:apps/web/static/images/work/yesid-dev-home.png",
      ],
      [
        218,
        "/assets/c2bb6564-62ab-46c4-962b-ab2c756fde9e",
        "repo-file:apps/web/static/images/work/yesid-dev-home-light.png",
      ],
      [
        238,
        "/assets/c2fad757-ecba-457c-aff7-47d3cc504081",
        "repo-file:apps/web/static/images/work/yesid-dev-mobile.png",
      ],
      [
        250,
        "/assets/9af53f0b-aeb9-4d3f-94a6-1ba3476a4f12",
        "repo-file:apps/web/static/images/work/yesid-dev-mobile-light.png",
      ],
    ] as const) {
      expect(hasLiteralEvidence(directusSource, sourceLine, rawRef)).toBe(true);
      expect(
        first.usages.some(
          (usage) =>
            usage.sourceFile === directusSource &&
            usage.sourceLine === sourceLine &&
            usage.assetId === expectedAssetId &&
            usage.unresolvedRef === rawRef &&
            usage.cmsField === "directus_asset_url",
        ),
      ).toBe(true);
    }

    const serviceSources = [
      "apps/web/src/lib/content/services.ts",
      "apps/cms/fixtures/collections/services.json",
    ] as const;
    for (const [rawRef, generatedLine, fixtureLine] of [
      ["service-database.svg", 118, 13],
      ["service-pipeline.svg", 214, 114],
      ["service-reporting.svg", 309, 208],
      ["service-web.svg", 419, 299],
      ["service-sql.svg", 502, 404],
      ["service-tooling.svg", 580, 481],
    ] as const) {
      expect(hasLiteralEvidence(serviceSources[0], generatedLine, rawRef)).toBe(
        true,
      );
      expect(hasLiteralEvidence(serviceSources[1], fixtureLine, rawRef)).toBe(
        true,
      );
      expect(
        first.assets.some(
          (asset) =>
            asset.id === `repo-file:apps/web/static/svg/services/${rawRef}`,
        ),
      ).toBe(true);
    }
    expect(first.usages).toContainEqual(
      expect.objectContaining({
        id: "declared:site.services.svg-glob",
        semanticKey: "site.services.svg-glob",
      }),
    );
    for (const expected of [
      {
        sourceFile: "apps/cms/fixtures/assets-manifest.json",
        sourceLine: 14,
        rawRef: "images/montreal-metro.svg",
      },
      {
        sourceFile: "apps/cms/fixtures/collections/projects.json",
        sourceLine: 8,
        rawRef: "images/work/yesid-dev-home.png",
      },
      {
        sourceFile: "apps/cms/scripts/seed-brand-assets.ts",
        sourceLine: 48,
        rawRef: "brand/yesid-icon.svg",
      },
      {
        sourceFile: "apps/web/scripts/generate-og-cards.ts",
        sourceLine: 72,
        rawRef: "src/lib/og/fonts/Inter-Black.ttf",
      },
    ]) {
      expect(
        hasLiteralEvidence(
          expected.sourceFile,
          expected.sourceLine,
          expected.rawRef,
        ),
      ).toBe(true);
    }

    for (const expected of [
      {
        sourceFile: "apps/web/src/lib/components/home/CloserProps.svelte",
        sourceLine: 24,
        rawRef: "new DOMParser(",
      },
      {
        sourceFile: "apps/web/src/lib/components/home/CloserProps.svelte",
        sourceLine: 56,
        rawRef: ".appendChild(",
      },
      {
        sourceFile: "apps/web/src/lib/components/home/HomeServices.svelte",
        sourceLine: 80,
        rawRef: "fetch(`/svg/services/${service.svg}`)",
      },
      {
        sourceFile: "apps/web/src/lib/components/home/HomeServices.svelte",
        sourceLine: 88,
        rawRef: ".innerHTML",
      },
    ]) {
      expect(first.findings).toContainEqual(
        expect.objectContaining({ code: "unsupported-pattern", ...expected }),
      );
    }

    const blueprintPaths = trackedFiles.filter(
      (repoPath) =>
        repoPath.startsWith("apps/web/src/lib/components/svg/") &&
        repoPath.endsWith(".svelte"),
    );
    expect(blueprintPaths).toHaveLength(27);
    for (const repoPath of blueprintPaths) {
      const blueprintAssets = first.assets.filter(
        (asset) => asset.repoPath === repoPath,
      );
      expect(blueprintAssets.length).toBeGreaterThan(0);
      for (const asset of blueprintAssets) {
        expect(
          first.usages.some(
            (usage) =>
              usage.assetId === asset.id && usage.sourceFile !== repoPath,
          ),
        ).toBe(true);
      }
    }

    const manifest = JSON.parse(
      await readFile(
        join(repoRoot, "apps/cms/fixtures/assets-manifest.json"),
        "utf8",
      ),
    ) as { assets: unknown[] };
    const cmsMap = JSON.parse(
      await readFile(
        join(repoRoot, "apps/cms/fixtures/assets-id-map.json"),
        "utf8",
      ),
    ) as Record<string, string>;
    const sharedMap = JSON.parse(
      await readFile(
        join(repoRoot, "packages/shared/fixtures/assets-id-map.json"),
        "utf8",
      ),
    ) as Record<string, string>;
    const generatedManifest = JSON.parse(
      await readFile(
        join(repoRoot, "apps/web/src/lib/content/generated.manifest.json"),
        "utf8",
      ),
    ) as { files: Record<string, string> };
    expect(manifest.assets).toHaveLength(26);
    expect(Object.keys(cmsMap)).toHaveLength(28);
    expect(sharedMap).toEqual(cmsMap);
    expect(Object.keys(generatedManifest.files)).toHaveLength(22);
    expect(
      first.generatedFrom.filter(
        (link) => link.generator === "apps/cms/scripts/lib/media-variants.ts",
      ),
    ).toHaveLength(49);
    expect(
      new Set(
        first.generatedFrom
          .filter(
            (link) => link.generator === "apps/cms/scripts/export-fallbacks.ts",
          )
          .map((link) => link.outputAssetId),
      ).size,
    ).toBe(22);
    expect(
      first.generatedFrom.filter(
        (link) => link.generator === "apps/web/scripts/generate-og-cards.ts",
      ).length,
    ).toBeGreaterThanOrEqual(30);
    const provenanceInputs = (outputAssetId: string, generator: string) =>
      new Set(
        first.generatedFrom
          .filter(
            (link) =>
              link.outputAssetId === outputAssetId &&
              link.generator === generator,
          )
          .map((link) => link.inputRef),
      );
    const staticOgGenerator = "apps/web/scripts/generate-og-cards.ts";
    for (const asset of first.assets.filter(
      (item) =>
        item.repoPath?.startsWith("apps/web/static/og/") &&
        item.repoPath.endsWith(".png"),
    )) {
      const inputs = provenanceInputs(asset.id, staticOgGenerator);
      for (const expected of [
        "apps/web/src/lib/og/fonts/Inter-Black.ttf",
        "apps/web/src/lib/og/fonts/Inter-Medium.ttf",
        "apps/web/src/lib/og/fonts/JetBrainsMono-Medium.ttf",
        "apps/cms/brand/yesid-wordmark.svg",
      ])
        expect(inputs.has(expected)).toBe(true);
    }
    expect(
      provenanceInputs(
        "repo-file:apps/web/static/og/services/database-engineering.png",
        staticOgGenerator,
      ).has("apps/web/static/svg/services/service-database.svg"),
    ).toBe(true);
    expect(
      provenanceInputs(
        "repo-file:apps/web/static/og/routes/about.png",
        staticOgGenerator,
      ).has("apps/web/static/images/about/headshot.webp"),
    ).toBe(true);
    expect(
      provenanceInputs(
        "repo-file:apps/web/static/og/routes/projects.png",
        staticOgGenerator,
      ).has("apps/web/src/lib/assets/project-fallbacks/digital-desktop.svg"),
    ).toBe(true);
    for (const type of ["blog", "project"]) {
      const inputs = provenanceInputs(
        `generated-runtime:og:${type}`,
        "apps/web/src/routes/og/[type=ogType]/[slug].png/+server.ts",
      );
      for (const expected of [
        "apps/web/src/lib/og/template.ts",
        "apps/web/src/lib/og/render.ts",
        "apps/web/src/lib/og/fonts.ts",
        "apps/web/src/lib/og/load-title.ts",
        "apps/web/src/lib/og/fonts/Inter-Black.ttf",
        "apps/web/src/lib/og/fonts/Inter-Medium.ttf",
        "apps/web/src/lib/og/fonts/JetBrainsMono-Medium.ttf",
        `apps/web/src/lib/content/${type === "blog" ? "blog.ts" : "projects.ts"}`,
      ])
        expect(inputs.has(expected)).toBe(true);
    }
    expect(
      first.generatedFrom.filter(
        (link) => link.generator === "scripts/generate-gbp-assets.ts",
      ).length,
    ).toBeGreaterThanOrEqual(17);
    const gbpGenerator = "scripts/generate-gbp-assets.ts";
    const interBlack = "apps/web/src/lib/og/fonts/Inter-Black.ttf";
    const jetBrains = "apps/web/src/lib/og/fonts/JetBrainsMono-Medium.ttf";
    const wordmark = "apps/cms/brand/yesid-wordmark.svg";
    const azur =
      "apps/web/src/lib/components/svg/azur/BlueprintAzurSide.svelte";
    expect(
      provenanceInputs(
        "repo-file:gbp-assets/en/cover-services.dark.png",
        gbpGenerator,
      ),
    ).toEqual(new Set([interBlack, jetBrains, wordmark, azur]));
    expect(
      provenanceInputs(
        "repo-file:gbp-assets/en/logo-wordmark.dark.png",
        gbpGenerator,
      ),
    ).toEqual(new Set([jetBrains, wordmark]));
    expect(
      provenanceInputs(
        "repo-file:gbp-assets/en/mark-dot.dark.png",
        gbpGenerator,
      ),
    ).toEqual(new Set(["scripts/generate-gbp-assets.ts#markDot"]));
    expect(
      provenanceInputs(
        "repo-file:gbp-assets/en/og-default.dark.png",
        gbpGenerator,
      ),
    ).toEqual(new Set([interBlack, jetBrains, wordmark, azur]));
    expect(
      provenanceInputs(
        "repo-file:apps/web/static/brand/mark-512.png",
        gbpGenerator,
      ),
    ).toEqual(new Set(["scripts/generate-gbp-assets.ts#markDot"]));
    const graffitiInputs = provenanceInputs(
      "repo-file:apps/web/static/svg/graffiti/the-end.svg",
      "apps/web/scripts/compose-graffiti.py",
    );
    expect(graffitiInputs).toEqual(
      new Set(["apps/web/scripts/compose-graffiti.py#letters"]),
    );
    expect(
      graffitiInputs.has("apps/web/static/svg/graffiti/prop-sign.svg"),
    ).toBe(false);
    expect(
      first.assets.filter((asset) => asset.origin === "external-provider")
        .length,
    ).toBeGreaterThan(10);

    const assetIds = new Set(first.assets.map((asset) => asset.id));
    expect(
      first.generatedFrom.every((link) => assetIds.has(link.outputAssetId)),
    ).toBe(true);
    const canonical = canonicalizeRepositoryScan(first);
    expect(canonical).not.toContain(repoRoot);
    expect(canonical).not.toContain("apps/web/test-results");
    expect(canonical.toLowerCase()).not.toContain("/analytics/");
    expect(
      first.assets.some((asset) => asset.repoPath?.includes("test-results")),
    ).toBe(false);
    expect(
      first.findings.some(
        (finding) =>
          finding.sourceFile.startsWith("apps/cms/ops/") ||
          /tsconfig(?:\.[^/]+)?\.json$/.test(finding.sourceFile) ||
          finding.sourceFile.endsWith(".d.ts") ||
          finding.rawRef === "/og/" ||
          (finding.sourceFile.endsWith("/TechIcon.svelte") &&
            finding.rawRef.includes("api.iconify.design")),
      ),
    ).toBe(false);
  }, 15_000);
});
