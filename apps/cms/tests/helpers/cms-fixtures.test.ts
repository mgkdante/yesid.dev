import { describe, expect, it } from "bun:test";
import { readCmsFixtureJson } from "./cms-fixtures";

describe("readCmsFixtureJson", () => {
  it("reads root and nested CMS JSON fixtures", () => {
    const manifest = readCmsFixtureJson<{ assets: unknown[] }>(
      "assets-manifest.json",
    );
    const presets = readCmsFixtureJson<{ presets: unknown[] }>(
      "brand/presets.json",
    );

    expect(manifest.assets.length).toBeGreaterThan(0);
    expect(presets.presets.length).toBeGreaterThan(0);
  });

  it("keeps reads inside the CMS fixture boundary", () => {
    for (const path of ["", "../package.json", "/tmp/fixture.json"])
      expect(() => readCmsFixtureJson(path)).toThrow(/fixture path/i);
  });
});
