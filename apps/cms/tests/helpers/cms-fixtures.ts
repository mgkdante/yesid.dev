import { readFileSync } from "node:fs";
import { isAbsolute, resolve, sep } from "node:path";

const CMS_FIXTURES_ROOT = resolve(import.meta.dir, "..", "..", "fixtures");

export function readCmsFixtureJson<T = unknown>(relativePath: string): T {
  if (!relativePath || isAbsolute(relativePath) || relativePath.includes("\0")) {
    throw new TypeError("CMS fixture path must be a non-empty relative path");
  }
  const path = resolve(CMS_FIXTURES_ROOT, relativePath);
  if (!path.startsWith(`${CMS_FIXTURES_ROOT}${sep}`)) {
    throw new TypeError("CMS fixture path must stay inside apps/cms/fixtures");
  }
  return JSON.parse(readFileSync(path, "utf8")) as T;
}
