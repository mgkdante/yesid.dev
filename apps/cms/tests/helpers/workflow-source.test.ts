import { describe, expect, it } from "bun:test";
import {
  workflowJobBlock,
  workflowStepBlock,
} from "./workflow-source";

const workflow = `name: Example

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Compile
        run: bun run build
      - uses: actions/upload-artifact@v4
      - name: Verify
        run: bun test
  deploy:
    runs-on: ubuntu-latest
`;

describe("workflow source helpers", () => {
  it("extracts first and final jobs without changing source bytes", () => {
    expect(workflowJobBlock(workflow, "build", { expectedNext: "deploy" }))
      .toBe(`  build:
    runs-on: ubuntu-latest
    steps:
      - name: Compile
        run: bun run build
      - uses: actions/upload-artifact@v4
      - name: Verify
        run: bun test`);
    expect(workflowJobBlock(workflow, "deploy")).toBe(`  deploy:
    runs-on: ubuntu-latest`);
    expect(workflowJobBlock(workflow, "missing")).toBeNull();
  });

  it("reports an unexpected next-job boundary", () => {
    expect(() =>
      workflowJobBlock(workflow, "build", { expectedNext: "release" }),
    ).toThrow("expected workflow job release after build, found deploy");
  });

  it("supports both existing step-boundary contracts", () => {
    const build = workflowJobBlock(workflow, "build");
    expect(build).not.toBeNull();
    if (!build) return;

    expect(workflowStepBlock(build, "Compile")).toBe(`      - name: Compile
        run: bun run build`);
    expect(
      workflowStepBlock(build, "Compile", { beforeStep: "Verify" }),
    ).toBe(`      - name: Compile
        run: bun run build
      - uses: actions/upload-artifact@v4`);
    expect(
      workflowStepBlock(build, "Verify", { throughJobEnd: true }),
    ).toBe(`      - name: Verify
        run: bun test`);
    expect(workflowStepBlock(build, "Missing")).toBeNull();
  });
});
