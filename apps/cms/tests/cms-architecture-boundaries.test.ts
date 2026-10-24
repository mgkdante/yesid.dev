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
    ]) {
      const source = readFileSync(join(cmsRoot, relativePath), "utf8");
      for (const staleClaim of staleClaims) {
        expect(source, `${relativePath}: ${staleClaim}`).not.toContain(
          staleClaim,
        );
      }
    }
  });

});
