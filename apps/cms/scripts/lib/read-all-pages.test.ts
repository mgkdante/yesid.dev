import { describe, expect, it } from "bun:test";
import { readAllPages } from "./read-all-pages";

describe("readAllPages", () => {
  it("owns deterministic offset advancement until the consumer stops", async () => {
    const reads: Array<{ limit: number; offset: number }> = [];
    const visited: number[][] = [];
    const rows = [1, 2, 3, 4, 5];

    await readAllPages({
      pageSize: 2,
      readPage: async (window) => {
        reads.push(window);
        return rows.slice(window.offset, window.offset + window.limit);
      },
      visitPage: (page) => {
        visited.push(page);
        return page.length === 2 ? "continue" : "stop";
      },
    });

    expect(reads).toEqual([
      { limit: 2, offset: 0 },
      { limit: 2, offset: 2 },
      { limit: 2, offset: 4 },
    ]);
    expect(visited).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("allows an exact full final page to be confirmed by one empty read", async () => {
    const offsets: number[] = [];
    const rows = [1, 2, 3, 4];

    await readAllPages({
      pageSize: 2,
      readPage: async ({ limit, offset }) => {
        offsets.push(offset);
        return rows.slice(offset, offset + limit);
      },
      visitPage: (page) =>
        page.length === 2 ? "continue" : "stop",
    });

    expect(offsets).toEqual([0, 2, 4]);
  });

  it("does not read another page after an explicit stop", async () => {
    let reads = 0;
    await readAllPages({
      pageSize: 100,
      readPage: async () => {
        reads += 1;
        return ["full-enough-for-the-domain"];
      },
      visitPage: () => "stop",
    });
    expect(reads).toBe(1);
  });

  it("propagates reader and visitor failures unchanged", async () => {
    const readFailure = new Error("read failed");
    await expect(
      readAllPages({
        pageSize: 1,
        readPage: async () => {
          throw readFailure;
        },
        visitPage: () => "stop",
      }),
    ).rejects.toBe(readFailure);

    const visitFailure = new Error("visit failed");
    await expect(
      readAllPages({
        pageSize: 1,
        readPage: async () => [1],
        visitPage: () => {
          throw visitFailure;
        },
      }),
    ).rejects.toBe(visitFailure);
  });

  it("rejects an unsafe page size before reading", async () => {
    let reads = 0;
    for (const pageSize of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
      await expect(
        readAllPages({
          pageSize,
          readPage: async () => {
            reads += 1;
            return [];
          },
          visitPage: () => "stop",
        }),
      ).rejects.toThrow(/page size/i);
    }
    expect(reads).toBe(0);
  });
});
