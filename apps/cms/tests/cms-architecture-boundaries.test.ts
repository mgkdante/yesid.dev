import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const cmsRoot = join(import.meta.dir, "..");

describe("CMS architecture boundaries", () => {
  it("does not claim ownership from the retired web Directus adapter", () => {
    const staleClaims = [
      "apps/web/src/lib/adapters/directus.ts",
      "apps/web/src/lib/adapters/directus-queue.ts",
      "runtime adapter still",
      "apps/web's adapter",
      "directus adapter's",
    ];
    for (const relativePath of [
      "scripts/lib/locale.ts",
      "scripts/lib/queued-fetch.ts",
      "scripts/lib/fetchers/blog-posts.ts",
      "scripts/lib/fetchers/error-pages.ts",
      "scripts/lib/fetchers/morph-shapes.ts",
      "scripts/lib/fetchers/page-blocks-home.ts",
      "scripts/lib/fetchers/page-blocks-medium.ts",
      "scripts/lib/fetchers/page-blocks-simple.ts",
      "scripts/lib/fetchers/projects.ts",
      "scripts/lib/fetchers/services.ts",
      "scripts/lib/fetchers/site-meta.ts",
      "scripts/lib/fetchers/tech-stack.ts",
    ]) {
      const source = readFileSync(join(cmsRoot, relativePath), "utf8");
      for (const staleClaim of staleClaims) {
        expect(source, `${relativePath}: ${staleClaim}`).not.toContain(
          staleClaim,
        );
      }
    }
  });

  it("documents the asset-audit ownership and publication boundary", () => {
    const readme = readFileSync(join(cmsRoot, "README.md"), "utf8");
    for (const contract of [
      "### Asset audit ownership boundary",
      "scripts/lib/assets/repository-scan.ts",
      "scripts/lib/assets/directus-scan.ts",
      "scripts/lib/assets/audit.ts",
      "scripts/lib/assets/report.ts",
      "scripts/audit-assets.ts",
      "bun run verify:assets-audit",
      ".asset-audit/report.json",
      "fixtures/assets/audit-baseline.json",
      "credential-free",
      "GET-only",
      "--update-baseline",
      "--confirm=UPDATE_ASSET_AUDIT_BASELINE",
    ]) {
      expect(readme, contract).toContain(contract);
    }
  });
});
