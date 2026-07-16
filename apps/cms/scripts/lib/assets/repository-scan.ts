import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { posix, resolve } from "node:path";
import { promisify } from "node:util";
import type {
  AssetDeliveryMode,
  AssetKind,
  AssetSemanticKey,
  AssetUsageDeclaration,
} from "@repo/shared";

const execFileAsync = promisify(execFile);

export interface RepositoryScanOptions {
  repoRoot: string;
  trackedFiles?: readonly string[];
  declarations?: readonly AssetUsageDeclaration[];
}

export interface RepositoryAsset {
  id: string;
  kind: AssetKind;
  origin:
    | "repository-file"
    | "generated-file"
    | "cms-mirror"
    | "code-component"
    | "external-provider"
    | "external-publication";
  repoPath: string | null;
  sha256: string | null;
  bytes: number | null;
  inlineSvgOrdinal: number | null;
}

export interface RepositoryUsage {
  id: string;
  assetId: string | null;
  semanticKey: AssetSemanticKey | null;
  unresolvedRef: string | null;
  confidence:
    "exact-static" | "resolved-generated" | "declared-dynamic" | "unknown";
  consumerType: AssetUsageDeclaration["consumerType"];
  consumerKey: string;
  sourceKind: "repository" | "generated" | "cms" | "route" | "declaration";
  sourceFile: string;
  sourceLine: number | null;
  cmsField: string | null;
  route: string | null;
  locale: string | null;
  slot: string;
  required: boolean;
  deliveryMode: AssetDeliveryMode;
  altTextOverride: string | null;
  altSource: string | null;
}

export interface GeneratedFromLink {
  outputAssetId: string;
  inputRef: string;
  generator: string;
  relation: "derived-from" | "mirrored-from" | "generated-by";
}

export interface RepositoryScanFinding {
  code:
    | "dynamic-reference"
    | "missing-target"
    | "undeclared-external"
    | "unsupported-pattern"
    | "duplicate-identity";
  sourceFile: string;
  sourceLine: number | null;
  rawRef: string;
}

export interface RepositoryScan {
  schemaVersion: 1;
  assets: readonly RepositoryAsset[];
  usages: readonly RepositoryUsage[];
  generatedFrom: readonly GeneratedFromLink[];
  findings: readonly RepositoryScanFinding[];
}

export interface SvelteAssetReference {
  rawRef: string;
  sourceLine: number;
  context: "markup" | "script" | "style";
  deliveryEvidence: "raw-query" | "svg-dom-insertion" | null;
  mediaTagName: SvelteMediaTag["tagName"] | null;
  mediaTagLine: number | null;
  mediaAttribute: "src" | "srcset" | "poster" | null;
  altTextOverride: string | null;
  altSource: string | null;
}

export interface SvelteMediaTag {
  tagName: "img" | "source" | "picture" | "video" | "audio";
  sourceLine: number;
  sourceAttribute: "src" | "srcset" | "poster" | null;
  sourceExpression: string | null;
  literalCandidates: readonly SvelteAssetReference[];
  dynamicReferences: readonly SvelteAssetReference[];
  altTextOverride: string | null;
  altSource: string | null;
}

export interface SvelteAssetSurface {
  inlineSvgLines: readonly number[];
  imageLines: readonly number[];
  sourceLines: readonly number[];
  pictureLines: readonly number[];
  videoLines: readonly number[];
  audioLines: readonly number[];
  literalReferences: readonly SvelteAssetReference[];
  dynamicReferences: readonly SvelteAssetReference[];
  rawInsertionLines: readonly { sourceLine: number; rawRef: string }[];
  mediaTags: readonly SvelteMediaTag[];
}

interface CodeReference extends SvelteAssetReference {}

const PHYSICAL_ROOTS = [
  "apps/web/static/",
  "apps/web/src/lib/assets/",
  "apps/web/src/lib/og/fonts/",
  "apps/cms/brand/",
  "apps/cms/icons/",
  "gbp-assets/",
] as const;

const TEXT_SOURCE_PATTERN = /\.(?:svelte|html|[cm]?[jt]sx?|css|json)$/i;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const ICONIFY_PATTERN = /^[a-z0-9][a-z0-9-]*:[a-z0-9][a-z0-9._-]*$/;
const ASSET_EXTENSION_PATTERN =
  /\.(?:avif|gif|jpe?g|png|webp|svg|ttf|otf|woff2?|mp4|webm|mov|m4v|pdf)(?:\?.*)?$/i;
const DIRECTUS_FILE_FIELDS = new Set([
  "asset",
  "cover",
  "cover_image",
  "default_og_image",
  "file",
  "file_id",
  "hero_image",
  "image",
  "image_file",
  "light",
  "logo",
  "og_image",
  "poster",
  "thumbnail",
]);

function compareOrdinal(left: string, right: string): number {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));
}

function normalizeText(value: string): string {
  return value.replace(/\r\n?/g, "\n").normalize("NFC");
}

function normalizeRepoPath(value: string): string {
  const normalized = posix
    .normalize(value.replaceAll("\\", "/"))
    .replace(/^\.\//, "");
  if (
    !normalized ||
    normalized === "." ||
    normalized.startsWith("/") ||
    normalized === ".." ||
    normalized.startsWith("../")
  ) {
    throw new TypeError(
      `Expected a repository-relative path, received ${JSON.stringify(value)}`,
    );
  }
  return normalized.normalize("NFC");
}

function absolutePath(repoRoot: string, repoPath: string): string {
  return resolve(repoRoot, ...repoPath.split("/"));
}

function isExcluded(repoPath: string): boolean {
  if (
    repoPath === "apps/cms/scripts/lib/assets/repository-scan.ts" ||
    repoPath === "apps/cms/fixtures/assets/audit-baseline.json" ||
    repoPath === "packages/gates/src/presets/yesid.ts" ||
    (repoPath.startsWith("apps/web/src/") &&
      /-fixture\.svelte$/i.test(repoPath))
  )
    return true;
  const path = `/${repoPath.toLowerCase()}/`;
  return (
    path.includes("/.git/") ||
    path.includes("/node_modules/") ||
    path.includes("/.svelte-kit/") ||
    path.includes("/.superpowers/") ||
    path.includes("/coverage/") ||
    path.includes("/dist/") ||
    path.includes("/build/") ||
    path.includes("/cache/") ||
    path.includes("/analytics/") ||
    path.includes("/apps/cms/ops/") ||
    path.includes("/test-results") ||
    path.includes("/snapshots/") ||
    path.includes("/__snapshots__/") ||
    path.includes("/tests/") ||
    /\.(?:test|spec)\.[^/]+\/$/.test(path) ||
    /\/tsconfig(?:\.[^/]+)?\.json\/$/.test(path) ||
    path.endsWith(".d.ts/")
  );
}

function isPhysicalAsset(repoPath: string): boolean {
  if (repoPath.startsWith("apps/web/static/")) return true;
  return (
    PHYSICAL_ROOTS.slice(1).some((root) => repoPath.startsWith(root)) &&
    ASSET_EXTENSION_PATTERN.test(repoPath)
  );
}

function assetKind(repoPath: string): AssetKind {
  const lower = repoPath.toLowerCase().split("?")[0]!;
  if (lower.endsWith(".svg")) return "svg";
  if (/\.(?:png|jpe?g|webp|gif|avif)$/.test(lower)) return "raster";
  if (/\.(?:ttf|otf|woff2?)$/.test(lower)) return "font";
  if (/\.(?:mp4|webm|mov|m4v)$/.test(lower)) return "video";
  return "document";
}

function assetOrigin(repoPath: string): RepositoryAsset["origin"] {
  if (repoPath.startsWith("gbp-assets/")) return "external-publication";
  if (
    /\.w\d+\.webp$/i.test(repoPath) ||
    repoPath.startsWith("apps/web/static/og/") ||
    repoPath === "apps/web/static/brand/mark-512.png" ||
    repoPath === "apps/web/static/svg/graffiti/the-end.svg"
  ) {
    return "generated-file";
  }
  return "repository-file";
}

function lineAt(source: string, index: number): number {
  let line = 1;
  for (let cursor = 0; cursor < index; cursor += 1) {
    if (source.charCodeAt(cursor) === 10) line += 1;
  }
  return line;
}

function maskRange(source: string, start: number, end: number): string {
  return `${source.slice(0, start)}${source
    .slice(start, end)
    .replace(/[^\n]/g, " ")}${source.slice(end)}`;
}

function maskHtmlComments(source: string): string {
  return source.replace(/<!--[\s\S]*?-->/g, (comment) =>
    comment.replace(/[^\n]/g, " "),
  );
}

function maskBlockComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, (comment) =>
    comment.replace(/[^\n]/g, " "),
  );
}

function looksLikeAssetReference(rawRef: string): boolean {
  const value = rawRef.trim();
  if (
    !value ||
    value.startsWith("#") ||
    value.startsWith("data:") ||
    value.startsWith("var(")
  )
    return false;
  if (/^\/(?:assets|images|svg|og|brand)\/$/.test(value)) return false;
  if (
    /^\.(?:avif|gif|jpe?g|png|webp|svg|ttf|otf|woff2?|mp4|webm|mov|m4v|pdf|svelte)(?:\?.*)?$/i.test(
      value,
    )
  )
    return false;
  if (
    value.includes("*") &&
    (/^\/(?:static|src\/lib)\//.test(value) || value.startsWith("$lib/"))
  )
    return true;
  if (value.startsWith("/assets/")) return true;
  if (/^https?:\/\//i.test(value))
    return ASSET_EXTENSION_PATTERN.test(value) || value.includes("/assets/");
  if (
    /^\/(?:images|svg|og|brand)\//.test(value) ||
    /^\/favicon(?:\.|$)/.test(value)
  )
    return true;
  if (/^\/(?:static|src\/lib)\//.test(value) || value.startsWith("$lib/")) {
    return (
      ASSET_EXTENSION_PATTERN.test(value) ||
      value.replace(/\?.*$/, "").endsWith(".svelte")
    );
  }
  return (
    ASSET_EXTENSION_PATTERN.test(value) ||
    value.replace(/\?.*$/, "").endsWith(".svelte")
  );
}

function pushReference(
  literals: CodeReference[],
  dynamics: CodeReference[],
  rawRef: string,
  sourceLine: number,
  context: CodeReference["context"],
  dynamic: boolean,
): void {
  const normalized = normalizeText(rawRef.trim());
  if (
    !normalized ||
    normalized.startsWith("#") ||
    normalized.startsWith("data:") ||
    normalized.startsWith("var(")
  )
    return;
  if (!looksLikeAssetReference(normalized)) return;
  (dynamic ? dynamics : literals).push({
    rawRef: normalized,
    sourceLine,
    context,
    deliveryEvidence: null,
    mediaTagName: null,
    mediaTagLine: null,
    mediaAttribute: null,
    altTextOverride: null,
    altSource: null,
  });
}

function scanCodeReferences(
  source: string,
  lineOffset = 0,
): {
  literalReferences: CodeReference[];
  dynamicReferences: CodeReference[];
} {
  const literalReferences: CodeReference[] = [];
  const dynamicReferences: CodeReference[] = [];
  let index = 0;
  let line = 1 + lineOffset;

  while (index < source.length) {
    const char = source[index]!;
    const next = source[index + 1];
    if (char === "\n") {
      line += 1;
      index += 1;
      continue;
    }
    if (char === "/" && next === "/") {
      index += 2;
      while (index < source.length && source[index] !== "\n") index += 1;
      continue;
    }
    if (char === "/" && next === "*") {
      index += 2;
      while (index < source.length) {
        if (source[index] === "\n") line += 1;
        if (source[index] === "*" && source[index + 1] === "/") {
          index += 2;
          break;
        }
        index += 1;
      }
      continue;
    }
    if (char !== "'" && char !== '"' && char !== "`") {
      index += 1;
      continue;
    }

    const quote = char;
    const startLine = line;
    let value = "";
    let dynamic = false;
    index += 1;
    while (index < source.length) {
      const current = source[index]!;
      if (current === "\n") line += 1;
      if (current === "\\") {
        if (index + 1 < source.length) {
          value += source[index + 1];
          index += 2;
          continue;
        }
      }
      if (current === quote) {
        index += 1;
        break;
      }
      if (quote === "`" && current === "$" && source[index + 1] === "{")
        dynamic = true;
      value += current;
      index += 1;
    }
    pushReference(
      literalReferences,
      dynamicReferences,
      value,
      startLine,
      "script",
      dynamic,
    );
  }

  const rawGlobPattern =
    /import\.meta\.glob\s*\(\s*(['"`])([^'"`]+)\1\s*,\s*\{([\s\S]*?)\}\s*\)/g;
  for (const match of source.matchAll(rawGlobPattern)) {
    const options = match[3] ?? "";
    if (!/\bquery\s*:\s*(['"])\?raw\1/.test(options)) continue;
    const rawRef = normalizeText((match[2] ?? "").trim());
    const sourceLine = lineAt(source, match.index ?? 0) + lineOffset;
    for (const reference of literalReferences) {
      if (reference.rawRef === rawRef && reference.sourceLine === sourceLine)
        reference.deliveryEvidence = "raw-query";
    }
  }

  return { literalReferences, dynamicReferences };
}

function scanCssReferences(
  source: string,
  lineOffset = 0,
): {
  literalReferences: CodeReference[];
  dynamicReferences: CodeReference[];
} {
  const literalReferences: CodeReference[] = [];
  const dynamicReferences: CodeReference[] = [];
  const masked = maskBlockComments(source);
  const urlPattern = /url\(\s*(?:"([^"]*)"|'([^']*)'|([^)'"\s][^)]*))\s*\)/gi;
  for (const match of masked.matchAll(urlPattern)) {
    const rawRef = (match[1] ?? match[2] ?? match[3] ?? "").trim();
    const dynamic = rawRef.includes("${") || /[{}]/.test(rawRef);
    pushReference(
      literalReferences,
      dynamicReferences,
      rawRef,
      lineAt(masked, match.index ?? 0) + lineOffset,
      "style",
      dynamic,
    );
  }
  return { literalReferences, dynamicReferences };
}

function scanSvgFetchInsertions(
  source: string,
  lineOffset = 0,
): { sourceLine: number; rawRef: string }[] {
  const insertions: { sourceLine: number; rawRef: string }[] = [];
  const masked = maskBlockComments(source).replace(/\/\/[^\n]*/g, (comment) =>
    " ".repeat(comment.length),
  );
  const fetchPattern =
    /\bfetch\s*\(\s*(?:'[^']*\.svg[^']*'|"[^"]*\.svg[^"]*"|`[^`]*\.svg[^`]*`)\s*\)/g;
  for (const match of masked.matchAll(fetchPattern)) {
    insertions.push({
      sourceLine: lineAt(masked, match.index ?? 0) + lineOffset,
      rawRef: match[0],
    });
  }
  return insertions;
}

function tagLines(source: string, tag: string): number[] {
  const lines: number[] = [];
  const pattern = new RegExp(`<${tag}\\b`, "gi");
  for (const match of source.matchAll(pattern))
    lines.push(lineAt(source, match.index ?? 0));
  return lines;
}

interface ParsedMarkupAttribute {
  kind: "literal" | "expression" | "shorthand";
  value: string;
}

interface MediaTagScan {
  tags: SvelteMediaTag[];
  ranges: Array<{ start: number; end: number }>;
}

function findStartTagEnd(source: string, start: number): number {
  let quote: "'" | '"' | "`" | null = null;
  let escaped = false;
  let braceDepth = 0;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index]!;
    if (quote) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === "\\") {
        escaped = true;
        continue;
      }
      if (char === quote) quote = null;
      continue;
    }
    if (char === "'" || char === '"' || char === "`") {
      quote = char;
      continue;
    }
    if (char === "{") {
      braceDepth += 1;
      continue;
    }
    if (char === "}") {
      braceDepth = Math.max(0, braceDepth - 1);
      continue;
    }
    if (char === ">" && braceDepth === 0) return index;
  }
  return source.length - 1;
}

function parseMarkupAttribute(
  tagSource: string,
  name: string,
): ParsedMarkupAttribute | null {
  const assignment = new RegExp(`(?:^|\\s)${name}\\s*=\\s*`, "i").exec(
    tagSource,
  );
  if (assignment) {
    const start = (assignment.index ?? 0) + assignment[0].length;
    const first = tagSource[start];
    if (first === "'" || first === '"') {
      let value = "";
      for (let index = start + 1; index < tagSource.length; index += 1) {
        const char = tagSource[index]!;
        if (char === "\\" && index + 1 < tagSource.length) {
          value += tagSource[index + 1];
          index += 1;
          continue;
        }
        if (char === first) break;
        value += char;
      }
      return { kind: "literal", value: normalizeText(value) };
    }
    if (first === "{") {
      let depth = 1;
      let quote: "'" | '"' | "`" | null = null;
      let escaped = false;
      let value = "";
      for (let index = start + 1; index < tagSource.length; index += 1) {
        const char = tagSource[index]!;
        if (quote) {
          value += char;
          if (escaped) escaped = false;
          else if (char === "\\") escaped = true;
          else if (char === quote) quote = null;
          continue;
        }
        if (char === "'" || char === '"' || char === "`") {
          quote = char;
          value += char;
          continue;
        }
        if (char === "{") depth += 1;
        if (char === "}") {
          depth -= 1;
          if (depth === 0) break;
        }
        value += char;
      }
      return { kind: "expression", value: normalizeText(value.trim()) };
    }
    const value = tagSource.slice(start).match(/^[^\s>]+/)?.[0] ?? "";
    return { kind: "literal", value: normalizeText(value) };
  }

  const shorthand = new RegExp(`(?:^|\\s)\\{${name}\\}(?=\\s|/?>)`, "i").exec(
    tagSource,
  );
  return shorthand ? { kind: "shorthand", value: name } : null;
}

function mediaReference(
  rawRef: string,
  mediaTag: Pick<
    SvelteMediaTag,
    "tagName" | "sourceLine" | "altTextOverride" | "altSource"
  >,
  mediaAttribute: "src" | "srcset" | "poster",
): SvelteAssetReference {
  return {
    rawRef: normalizeText(rawRef.trim()),
    sourceLine: mediaTag.sourceLine,
    context: "markup",
    deliveryEvidence: null,
    mediaTagName: mediaTag.tagName,
    mediaTagLine: mediaTag.sourceLine,
    mediaAttribute,
    altTextOverride: mediaTag.altTextOverride,
    altSource: mediaTag.altSource,
  };
}

function scanMarkupMediaTags(markup: string): MediaTagScan {
  const tags: SvelteMediaTag[] = [];
  const ranges: Array<{ start: number; end: number }> = [];
  const opener = /<(img|source|picture|video|audio)\b/gi;
  let match: RegExpExecArray | null;
  while ((match = opener.exec(markup)) !== null) {
    const start = match.index;
    const end = findStartTagEnd(markup, start);
    const tagSource = markup.slice(start, end + 1);
    const tagName = match[1]!.toLowerCase() as SvelteMediaTag["tagName"];
    const sourceLine = lineAt(markup, start);
    const alt = parseMarkupAttribute(tagSource, "alt");
    const altTextOverride = alt?.kind === "literal" ? alt.value : null;
    const altSource =
      alt?.kind === "literal" ? "literal" : (alt?.value ?? null);
    const base = { tagName, sourceLine, altTextOverride, altSource };
    const literalCandidates: SvelteAssetReference[] = [];
    const dynamicReferences: SvelteAssetReference[] = [];
    let sourceAttribute: SvelteMediaTag["sourceAttribute"] = null;
    let sourceExpression: string | null = null;

    for (const attributeName of ["src", "srcset", "poster"] as const) {
      const attribute = parseMarkupAttribute(tagSource, attributeName);
      if (!attribute) continue;
      if (sourceAttribute === null) {
        sourceAttribute = attributeName;
        sourceExpression = attribute.value;
      }
      if (attribute.kind === "literal" && !/[{}]/.test(attribute.value)) {
        const candidates =
          attributeName === "srcset"
            ? attribute.value
                .split(",")
                .map((part) => part.trim().split(/\s+/)[0] ?? "")
            : [attribute.value];
        for (const candidate of candidates) {
          if (looksLikeAssetReference(candidate))
            literalCandidates.push(
              mediaReference(candidate, base, attributeName),
            );
        }
        continue;
      }

      if (attribute.kind !== "literal") {
        const scanned = scanCodeReferences(attribute.value);
        for (const candidate of scanned.literalReferences) {
          literalCandidates.push(
            mediaReference(candidate.rawRef, base, attributeName),
          );
        }
        for (const candidate of scanned.dynamicReferences) {
          dynamicReferences.push(
            mediaReference(candidate.rawRef, base, attributeName),
          );
        }
        if (
          scanned.literalReferences.length > 0 ||
          scanned.dynamicReferences.length > 0
        )
          continue;
      }
      dynamicReferences.push(
        mediaReference(attribute.value, base, attributeName),
      );
    }

    tags.push({
      ...base,
      sourceAttribute,
      sourceExpression,
      literalCandidates: literalCandidates.sort(referenceCompare),
      dynamicReferences: dynamicReferences.sort(referenceCompare),
    });
    ranges.push({ start, end: end + 1 });
    opener.lastIndex = end + 1;
  }
  return { tags, ranges };
}

export function scanSvelteAssetSurface(
  repoPath: string,
  source: string,
): SvelteAssetSurface {
  void normalizeRepoPath(repoPath);
  const normalized = normalizeText(source);
  const htmlCommentMasked = maskHtmlComments(normalized);
  let markup = htmlCommentMasked;
  const literalReferences: CodeReference[] = [];
  const dynamicReferences: CodeReference[] = [];
  const rawInsertionLines: { sourceLine: number; rawRef: string }[] = [];

  const ranges: Array<{ start: number; end: number }> = [];
  for (const match of htmlCommentMasked.matchAll(
    /<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi,
  )) {
    const whole = match[0];
    const body = match[1] ?? "";
    const start = match.index ?? 0;
    const bodyStart = start + whole.indexOf(body);
    const scanned = scanCodeReferences(
      body,
      lineAt(htmlCommentMasked, bodyStart) - 1,
    );
    literalReferences.push(...scanned.literalReferences);
    dynamicReferences.push(...scanned.dynamicReferences);
    const commentMaskedBody = maskBlockComments(body).replace(
      /\/\/[^\n]*/g,
      (comment) => " ".repeat(comment.length),
    );
    for (const pattern of [
      /\.innerHTML\b/g,
      /\bnew\s+DOMParser\s*\(/g,
      /\.appendChild\s*\(/g,
    ]) {
      for (const rawMatch of commentMaskedBody.matchAll(pattern)) {
        rawInsertionLines.push({
          sourceLine: lineAt(
            htmlCommentMasked,
            bodyStart + (rawMatch.index ?? 0),
          ),
          rawRef: rawMatch[0],
        });
      }
    }
    rawInsertionLines.push(
      ...scanSvgFetchInsertions(body, lineAt(htmlCommentMasked, bodyStart) - 1),
    );
    ranges.push({ start, end: start + whole.length });
  }
  for (const match of htmlCommentMasked.matchAll(
    /<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi,
  )) {
    const whole = match[0];
    const body = match[1] ?? "";
    const start = match.index ?? 0;
    const bodyStart = start + whole.indexOf(body);
    const scanned = scanCssReferences(
      body,
      lineAt(htmlCommentMasked, bodyStart) - 1,
    );
    literalReferences.push(...scanned.literalReferences);
    dynamicReferences.push(...scanned.dynamicReferences);
    ranges.push({ start, end: start + whole.length });
  }
  for (const range of ranges.sort((a, b) => b.start - a.start))
    markup = maskRange(markup, range.start, range.end);
  const mediaScan = scanMarkupMediaTags(markup);
  for (const tag of mediaScan.tags) {
    literalReferences.push(...tag.literalCandidates);
    dynamicReferences.push(...tag.dynamicReferences);
  }
  let nonMediaMarkup = markup;
  for (const range of mediaScan.ranges.sort((a, b) => b.start - a.start)) {
    nonMediaMarkup = maskRange(nonMediaMarkup, range.start, range.end);
  }

  const attributePattern =
    /\b(?:src|srcset|href|poster)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
  for (const match of nonMediaMarkup.matchAll(attributePattern)) {
    const value = match[1] ?? match[2] ?? "";
    const values =
      /^\s*[^,]+(?:,|$)/.test(value) && value.includes(",")
        ? value.split(",").map((part) => part.trim().split(/\s+/)[0] ?? "")
        : [value.trim().split(/\s+/)[0] ?? ""];
    for (const rawRef of values) {
      pushReference(
        literalReferences,
        dynamicReferences,
        rawRef,
        lineAt(nonMediaMarkup, match.index ?? 0),
        "markup",
        rawRef.includes("{"),
      );
    }
  }
  for (const match of markup.matchAll(/\{@html\b[^}]*\}/g)) {
    rawInsertionLines.push({
      sourceLine: lineAt(markup, match.index ?? 0),
      rawRef: match[0],
    });
  }

  const hasDomParser = rawInsertionLines.some((item) =>
    item.rawRef.includes("DOMParser"),
  );
  const hasDomAppend = rawInsertionLines.some((item) =>
    item.rawRef.includes("appendChild"),
  );
  if (hasDomParser && hasDomAppend) {
    const fetchedSvgRefs = new Set(
      rawInsertionLines
        .filter((item) => item.rawRef.startsWith("fetch"))
        .flatMap((item) =>
          scanCodeReferences(item.rawRef).literalReferences.map(
            (reference) => reference.rawRef,
          ),
        ),
    );
    for (const reference of literalReferences) {
      if (
        reference.rawRef.replace(/[?#].*$/, "").endsWith(".svg") &&
        fetchedSvgRefs.has(reference.rawRef)
      ) {
        reference.deliveryEvidence = "svg-dom-insertion";
      }
    }
  }

  return {
    inlineSvgLines: tagLines(markup, "svg"),
    imageLines: tagLines(markup, "img"),
    sourceLines: tagLines(markup, "source"),
    pictureLines: tagLines(markup, "picture"),
    videoLines: tagLines(markup, "video"),
    audioLines: tagLines(markup, "audio"),
    literalReferences: literalReferences.sort(referenceCompare),
    dynamicReferences: dynamicReferences.sort(referenceCompare),
    rawInsertionLines: rawInsertionLines.sort(
      (a, b) =>
        a.sourceLine - b.sourceLine || compareOrdinal(a.rawRef, b.rawRef),
    ),
    mediaTags: mediaScan.tags,
  };
}

function referenceCompare(
  left: SvelteAssetReference,
  right: SvelteAssetReference,
): number {
  return (
    left.sourceLine - right.sourceLine ||
    compareOrdinal(left.rawRef, right.rawRef) ||
    compareOrdinal(left.context, right.context)
  );
}

function usageConsumerType(
  sourceFile: string,
): AssetUsageDeclaration["consumerType"] {
  if (sourceFile.includes("/blog/")) return "blog";
  if (sourceFile.includes("/projects/")) return "project";
  if (sourceFile.includes("/services/")) return "service";
  if (sourceFile.includes("/routes/")) return "route";
  if (sourceFile.endsWith(".css")) return "style";
  if (sourceFile.includes("/components/")) return "component";
  if (sourceFile.includes("/fixtures/")) return "system";
  return "site";
}

function sourceKind(sourceFile: string): RepositoryUsage["sourceKind"] {
  if (sourceFile.includes("/fixtures/")) return "cms";
  if (sourceFile.includes("/content/") || sourceFile.endsWith(".manifest.json"))
    return "generated";
  if (sourceFile.includes("/routes/")) return "route";
  return "repository";
}

function usageDelivery(
  asset: RepositoryAsset,
  context: SvelteAssetReference["context"] | "cms",
  rawRef: string,
  deliveryEvidence: SvelteAssetReference["deliveryEvidence"] = null,
): AssetDeliveryMode {
  if (asset.kind === "code-component") return "code-component";
  if (asset.kind === "font") return "font-face";
  if (asset.kind === "video") return "video";
  if (asset.kind === "document") return "download";
  if (context === "style") return "css-background";
  if (asset.repoPath?.includes("/og/")) return "og-meta";
  if (
    asset.kind === "svg" &&
    (deliveryEvidence !== null || /(?:\?|&)raw(?:[=&]|$)/.test(rawRef))
  )
    return "inline-svg";
  return "local-img";
}

function resolveLiteralPath(sourceFile: string, rawRef: string): string | null {
  let value = normalizeText(rawRef.trim());
  if (
    !value ||
    /^https?:\/\//i.test(value) ||
    value.startsWith("data:") ||
    UUID_PATTERN.test(value)
  )
    return null;
  if (value.startsWith("%sveltekit.assets%/"))
    value = `/${value.slice("%sveltekit.assets%/".length)}`;
  value = value.replace(/[?#].*$/, "");
  if (value.startsWith("$lib/"))
    return normalizeRepoPath(`apps/web/src/lib/${value.slice("$lib/".length)}`);
  if (value.startsWith("/src/lib/"))
    return normalizeRepoPath(`apps/web${value}`);
  if (value.startsWith("/static/"))
    return normalizeRepoPath(`apps/web${value}`);
  if (
    /^\/(?:images|svg|og|brand)\//.test(value) ||
    /^\/favicon(?:\.|$)/.test(value)
  ) {
    return normalizeRepoPath(`apps/web/static${value}`);
  }
  if (
    value.startsWith("apps/") ||
    value.startsWith("packages/") ||
    value.startsWith("gbp-assets/")
  ) {
    return normalizeRepoPath(value);
  }
  if (value.startsWith("./") || value.startsWith("../"))
    return normalizeRepoPath(posix.join(posix.dirname(sourceFile), value));
  return null;
}

function globMatches(
  sourceFile: string,
  rawPattern: string,
  trackedFiles: readonly string[],
): string[] {
  const resolved = resolveLiteralPath(sourceFile, rawPattern);
  if (!resolved || !resolved.includes("*")) return [];
  const escaped = resolved
    .split("*")
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("[^/]*");
  const pattern = new RegExp(`^${escaped}$`);
  return trackedFiles
    .filter((repoPath) => pattern.test(repoPath))
    .sort(compareOrdinal);
}

function hasDynamicEvidence(source: string): boolean {
  return (
    source.includes("import.meta.glob") ||
    source.includes("${") ||
    source.includes("fileId") ||
    source.includes("assetImage(") ||
    source.includes("asset(") ||
    source.includes("defaultOgImage") ||
    source.includes("ogImage") ||
    source.includes("imageSource(") ||
    source.includes("fetch(") ||
    source.includes("?raw")
  );
}

async function discoverTrackedFiles(repoRoot: string): Promise<string[]> {
  const { stdout } = await execFileAsync("git", ["ls-files", "-z"], {
    cwd: repoRoot,
    encoding: "buffer",
    maxBuffer: 16 * 1024 * 1024,
  });
  return Buffer.from(stdout)
    .toString("utf8")
    .split("\0")
    .filter(Boolean)
    .map(normalizeRepoPath)
    .sort(compareOrdinal);
}

function findingCompare(
  left: RepositoryScanFinding,
  right: RepositoryScanFinding,
): number {
  return (
    compareOrdinal(left.sourceFile, right.sourceFile) ||
    (left.sourceLine ?? 0) - (right.sourceLine ?? 0) ||
    compareOrdinal(left.rawRef, right.rawRef) ||
    compareOrdinal(left.code, right.code)
  );
}

function provenanceCompare(
  left: GeneratedFromLink,
  right: GeneratedFromLink,
): number {
  return (
    compareOrdinal(left.outputAssetId, right.outputAssetId) ||
    compareOrdinal(left.inputRef, right.inputRef) ||
    compareOrdinal(left.generator, right.generator) ||
    compareOrdinal(left.relation, right.relation)
  );
}

export async function scanRepository(
  options: RepositoryScanOptions,
): Promise<RepositoryScan> {
  const repoRoot = resolve(options.repoRoot);
  const discovered = options.trackedFiles
    ? options.trackedFiles.map(normalizeRepoPath)
    : await discoverTrackedFiles(repoRoot);
  const duplicatePaths = new Set<string>();
  const seenPaths = new Set<string>();
  for (const repoPath of discovered) {
    if (seenPaths.has(repoPath)) duplicatePaths.add(repoPath);
    seenPaths.add(repoPath);
  }
  const trackedFiles = [...seenPaths]
    .filter((repoPath) => !isExcluded(repoPath))
    .sort(compareOrdinal);
  const trackedSet = new Set(trackedFiles);
  const declarations = [...(options.declarations ?? [])].sort((a, b) =>
    compareOrdinal(a.usageKey, b.usageKey),
  );
  const declarationKeys = new Set<string>();
  for (const item of declarations) {
    if (declarationKeys.has(item.usageKey))
      throw new TypeError(`Duplicate declared usage: ${item.usageKey}`);
    declarationKeys.add(item.usageKey);
  }

  const assets = new Map<string, RepositoryAsset>();
  const assetsByPath = new Map<string, RepositoryAsset[]>();
  const usages: RepositoryUsage[] = [];
  const generatedFrom: GeneratedFromLink[] = [];
  const findings: RepositoryScanFinding[] = [];
  const sourceCache = new Map<string, string>();
  const svelteSurfaceCache = new Map<string, SvelteAssetSurface>();
  const usageOccurrences = new Map<string, number>();

  function addAsset(asset: RepositoryAsset): RepositoryAsset {
    const existing = assets.get(asset.id);
    if (existing) return existing;
    assets.set(asset.id, asset);
    if (asset.repoPath) {
      const forPath = assetsByPath.get(asset.repoPath) ?? [];
      forPath.push(asset);
      assetsByPath.set(asset.repoPath, forPath);
    }
    return asset;
  }

  function replaceAsset(asset: RepositoryAsset): void {
    assets.set(asset.id, asset);
    if (asset.repoPath) {
      const forPath = assetsByPath.get(asset.repoPath) ?? [];
      const index = forPath.findIndex((item) => item.id === asset.id);
      if (index >= 0) forPath[index] = asset;
      else forPath.push(asset);
      assetsByPath.set(asset.repoPath, forPath);
    }
  }

  async function readBytes(repoPath: string): Promise<Buffer> {
    return Buffer.from(await readFile(absolutePath(repoRoot, repoPath)));
  }

  async function readSource(repoPath: string): Promise<string> {
    const cached = sourceCache.get(repoPath);
    if (cached !== undefined) return cached;
    const source = normalizeText(
      await readFile(absolutePath(repoRoot, repoPath), "utf8"),
    );
    sourceCache.set(repoPath, source);
    return source;
  }

  for (const repoPath of duplicatePaths) {
    findings.push({
      code: "duplicate-identity",
      sourceFile: repoPath,
      sourceLine: null,
      rawRef: repoPath,
    });
  }

  for (const repoPath of trackedFiles.filter(isPhysicalAsset)) {
    const bytes = await readBytes(repoPath);
    addAsset({
      id: `repo-file:${repoPath}`,
      kind: assetKind(repoPath),
      origin: assetOrigin(repoPath),
      repoPath,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      bytes: bytes.byteLength,
      inlineSvgOrdinal: null,
    });
  }

  for (const repoPath of trackedFiles.filter((path) =>
    path.endsWith(".svelte"),
  )) {
    const source = await readSource(repoPath);
    const surface = scanSvelteAssetSurface(repoPath, source);
    svelteSurfaceCache.set(repoPath, surface);
    const bytes = Buffer.from(await readFile(absolutePath(repoRoot, repoPath)));
    for (const [index, sourceLine] of surface.inlineSvgLines.entries()) {
      const asset = addAsset({
        id: `repo-component:${repoPath}#svg:${index + 1}`,
        kind: "code-component",
        origin: "code-component",
        repoPath,
        sha256: createHash("sha256").update(bytes).digest("hex"),
        bytes: bytes.byteLength,
        inlineSvgOrdinal: index + 1,
      });
      addExactUsage(asset, repoPath, sourceLine, "script", null);
    }
  }

  function addExactUsage(
    asset: RepositoryAsset,
    sourceFile: string,
    sourceLine: number | null,
    context: SvelteAssetReference["context"] | "cms",
    cmsField: string | null,
    rawRef: string | null = null,
    accessibility: Pick<SvelteAssetReference, "altTextOverride" | "altSource"> &
      Partial<Pick<SvelteAssetReference, "deliveryEvidence">> = {
      altTextOverride: null,
      altSource: null,
    },
    deliveryRef: string = rawRef ?? "",
  ): void {
    const occurrenceKey = `${sourceFile}\0${asset.id}`;
    const occurrence = (usageOccurrences.get(occurrenceKey) ?? 0) + 1;
    usageOccurrences.set(occurrenceKey, occurrence);
    usages.push({
      id: `exact:${sourceFile}:${asset.id}:${occurrence}`,
      assetId: asset.id,
      semanticKey: null,
      unresolvedRef: rawRef,
      confidence:
        asset.origin === "generated-file" || asset.origin === "cms-mirror"
          ? "resolved-generated"
          : "exact-static",
      consumerType: usageConsumerType(sourceFile),
      consumerKey: sourceFile,
      sourceKind: sourceKind(sourceFile),
      sourceFile,
      sourceLine,
      cmsField,
      route: null,
      locale: null,
      slot: context === "style" ? "background" : (cmsField ?? "asset"),
      required: true,
      deliveryMode: usageDelivery(
        asset,
        context,
        deliveryRef,
        accessibility.deliveryEvidence ?? null,
      ),
      altTextOverride: accessibility.altTextOverride,
      altSource: accessibility.altSource,
    });
  }

  function addUnresolvedUsage(
    sourceFile: string,
    reference: SvelteAssetReference,
  ): void {
    if (reference.mediaTagName === null || reference.mediaAttribute === null)
      return;
    const sourceLine = reference.mediaTagLine ?? reference.sourceLine;
    const normalizedRef = normalizeText(reference.rawRef.trim());
    const evidenceSlot =
      reference.mediaTagName !== null && reference.mediaAttribute !== null
        ? `${reference.mediaTagName}-${reference.mediaAttribute}`
        : reference.context === "style"
          ? "background"
          : "asset-reference";
    const anchoredSourceFile = `${sourceFile}#${evidenceSlot}:${normalizedRef}`;
    const identity = createHash("sha256")
      .update(`${anchoredSourceFile}\0${normalizedRef}`)
      .digest("hex")
      .slice(0, 16);
    const occurrenceKey = `unresolved\0${anchoredSourceFile}\0${identity}`;
    const occurrence = (usageOccurrences.get(occurrenceKey) ?? 0) + 1;
    usageOccurrences.set(occurrenceKey, occurrence);
    usages.push({
      id: `unresolved:${anchoredSourceFile}:${identity}:${occurrence}`,
      assetId: null,
      semanticKey: null,
      unresolvedRef: normalizedRef,
      confidence: "unknown",
      consumerType: usageConsumerType(sourceFile),
      consumerKey: sourceFile,
      sourceKind: sourceKind(sourceFile),
      sourceFile: anchoredSourceFile,
      sourceLine,
      cmsField: null,
      route: null,
      locale: null,
      slot: evidenceSlot,
      required: true,
      deliveryMode:
        reference.mediaTagName === "video" ||
        reference.mediaTagName === "audio" ||
        /\.(?:mp4|webm|mov|m4v)(?:[?#].*)?$/i.test(normalizedRef)
          ? "video"
          : reference.context === "style"
            ? "css-background"
            : /\.(?:ttf|otf|woff2?)(?:[?#].*)?$/i.test(normalizedRef)
              ? "font-face"
              : /\.pdf(?:[?#].*)?$/i.test(normalizedRef)
                ? "download"
                : reference.context === "script" &&
                    /\.svg(?:[?#].*)?$/i.test(normalizedRef)
                  ? "inline-svg"
                  : "local-img",
      altTextOverride: reference.altTextOverride,
      altSource: reference.altSource,
    });
  }

  function addFinding(
    code: RepositoryScanFinding["code"],
    sourceFile: string,
    sourceLine: number | null,
    rawRef: string,
  ): void {
    findings.push({
      code,
      sourceFile,
      sourceLine,
      rawRef: normalizeText(rawRef),
    });
  }

  function bindReference(
    sourceFile: string,
    reference: SvelteAssetReference,
  ): void {
    const rawRef = reference.rawRef;
    if (/^https?:\/\//i.test(rawRef)) {
      addUnresolvedUsage(sourceFile, reference);
      addFinding(
        "undeclared-external",
        sourceFile,
        reference.sourceLine,
        rawRef,
      );
      return;
    }
    const directusAssetUrl = /^\/assets\/([^/?#]+)(?:[?#].*)?$/.exec(rawRef);
    if (directusAssetUrl && UUID_PATTERN.test(directusAssetUrl[1] ?? "")) {
      const mappedPath = inverseUuidMap.get(directusAssetUrl[1]!);
      const mappedAssets = mappedPath
        ? (assetsByPath.get(mappedPath) ?? [])
        : [];
      if (mappedAssets.length === 0) {
        addFinding("missing-target", sourceFile, reference.sourceLine, rawRef);
      } else {
        for (const asset of mappedAssets) {
          addExactUsage(
            asset,
            sourceFile,
            reference.sourceLine,
            "cms",
            "directus_asset_url",
            rawRef,
            reference,
            reference.rawRef,
          );
        }
      }
      return;
    }
    if (rawRef.includes("*")) {
      const matches = globMatches(sourceFile, rawRef, trackedFiles);
      if (matches.length === 0) {
        addUnresolvedUsage(sourceFile, reference);
        addFinding("missing-target", sourceFile, reference.sourceLine, rawRef);
      }
      for (const match of matches) {
        for (const asset of assetsByPath.get(match) ?? []) {
          addExactUsage(
            asset,
            sourceFile,
            reference.sourceLine,
            reference.context,
            null,
            null,
            reference,
            reference.rawRef,
          );
        }
      }
      return;
    }
    const resolvedPath = resolveLiteralPath(sourceFile, rawRef);
    if (!resolvedPath) {
      addUnresolvedUsage(sourceFile, reference);
      if (reference.mediaTagName === null || reference.mediaAttribute === null)
        addFinding(
          "unsupported-pattern",
          sourceFile,
          reference.sourceLine,
          rawRef,
        );
      return;
    }
    const resolvedAssets = assetsByPath.get(resolvedPath) ?? [];
    if (resolvedPath.endsWith(".svelte") && resolvedAssets.length === 0) return;
    if (resolvedAssets.length === 0) {
      addUnresolvedUsage(sourceFile, reference);
      addFinding("missing-target", sourceFile, reference.sourceLine, rawRef);
      return;
    }
    for (const asset of resolvedAssets) {
      addExactUsage(
        asset,
        sourceFile,
        reference.sourceLine,
        reference.context,
        null,
        null,
        reference,
        reference.rawRef,
      );
    }
  }

  const inverseUuidMap = new Map<string, string>();
  const idMapPaths = [
    "apps/cms/fixtures/assets-id-map.json",
    "packages/shared/fixtures/assets-id-map.json",
  ];
  const mappedRepositoryPath = (legacyPath: string) =>
    normalizeRepoPath(
      legacyPath.startsWith("brand/")
        ? `apps/cms/${legacyPath.replace(/^\//, "")}`
        : `apps/web/static/${legacyPath.replace(/^\//, "")}`,
    );
  for (const mapPath of idMapPaths) {
    if (!trackedSet.has(mapPath)) continue;
    const bytes = await readBytes(mapPath);
    const mapAsset = addAsset({
      id: `repo-file:${mapPath}`,
      kind: "document",
      origin: mapPath.startsWith("packages/shared/")
        ? "cms-mirror"
        : "generated-file",
      repoPath: mapPath,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      bytes: bytes.byteLength,
      inlineSvgOrdinal: null,
    });
    const parsed = JSON.parse(normalizeText(bytes.toString("utf8"))) as Record<
      string,
      string
    >;
    for (const [legacyPath, uuid] of Object.entries(parsed).sort(([a], [b]) =>
      compareOrdinal(a, b),
    )) {
      const mappedPath = mappedRepositoryPath(legacyPath);
      if (UUID_PATTERN.test(uuid)) inverseUuidMap.set(uuid, mappedPath);
      const mirrored = assetsByPath.get(mappedPath)?.[0];
      if (mirrored && mirrored.origin === "repository-file")
        replaceAsset({ ...mirrored, origin: "cms-mirror" });
    }
    generatedFrom.push({
      outputAssetId: mapAsset.id,
      inputRef: mapPath.startsWith("packages/shared/")
        ? "apps/cms/fixtures/assets-id-map.json"
        : "apps/cms/fixtures/assets-manifest.json",
      generator: "apps/cms/scripts/migrate-assets.ts",
      relation: mapPath.startsWith("packages/shared/")
        ? "mirrored-from"
        : "generated-by",
    });
  }

  let hasIconifyProviderAssets = false;
  const techStackPath = "apps/web/src/lib/content/tech-stack.ts";
  if (trackedSet.has(techStackPath)) {
    const techStackSource = await readSource(techStackPath);
    const techIconPath =
      "apps/web/src/lib/components/stack-engine/TechIcon.svelte";
    const techIconTag = svelteSurfaceCache
      .get(techIconPath)
      ?.mediaTags.find((tag) => tag.tagName === "img");
    for (const match of techStackSource.matchAll(
      /\biconify_id:\s*['"]([^'"]+)['"]/g,
    )) {
      const iconifyId = match[1]!;
      if (!ICONIFY_PATTERN.test(iconifyId)) continue;
      const asset = addAsset({
        id: `external:iconify:${iconifyId}`,
        kind: "svg",
        origin: "external-provider",
        repoPath: null,
        sha256: null,
        bytes: null,
        inlineSvgOrdinal: null,
      });
      addExactUsage(
        asset,
        techIconPath,
        techIconTag?.sourceLine ?? null,
        "markup",
        "iconify_id",
        null,
        techIconTag ?? undefined,
      );
      hasIconifyProviderAssets = true;
    }
  }
  const isResolvedIconifyTemplate = (repoPath: string, rawRef: string) =>
    hasIconifyProviderAssets &&
    repoPath === "apps/web/src/lib/components/stack-engine/TechIcon.svelte" &&
    rawRef.startsWith("https://api.iconify.design/") &&
    rawRef.includes("${encodeURIComponent(prefix)}") &&
    rawRef.includes("${encodeURIComponent(name)}.svg");

  for (const repoPath of trackedFiles.filter((path) =>
    TEXT_SOURCE_PATTERN.test(path),
  )) {
    const source = await readSource(repoPath);
    if (repoPath.endsWith(".json")) {
      scanJsonSource(repoPath, source);
      continue;
    }
    if (repoPath.endsWith(".svelte") || repoPath.endsWith(".html")) {
      const surface =
        svelteSurfaceCache.get(repoPath) ??
        scanSvelteAssetSurface(repoPath, source);
      for (const reference of surface.literalReferences)
        bindReference(repoPath, reference);
      for (const reference of surface.dynamicReferences) {
        if (
          reference.mediaTagName !== null &&
          reference.mediaAttribute !== null
        )
          addUnresolvedUsage(repoPath, reference);
        if (!isResolvedIconifyTemplate(repoPath, reference.rawRef))
          addFinding(
            "dynamic-reference",
            repoPath,
            reference.sourceLine,
            reference.rawRef,
          );
      }
      for (const insertion of surface.rawInsertionLines)
        addFinding(
          "unsupported-pattern",
          repoPath,
          insertion.sourceLine,
          insertion.rawRef,
        );
    } else if (repoPath.endsWith(".css")) {
      const surface = scanCssReferences(source);
      for (const reference of surface.literalReferences)
        bindReference(repoPath, reference);
      for (const reference of surface.dynamicReferences)
        addFinding(
          "dynamic-reference",
          repoPath,
          reference.sourceLine,
          reference.rawRef,
        );
    } else {
      const surface = scanCodeReferences(source);
      for (const reference of surface.literalReferences)
        bindReference(repoPath, reference);
      for (const reference of surface.dynamicReferences)
        addFinding(
          "dynamic-reference",
          repoPath,
          reference.sourceLine,
          reference.rawRef,
        );
      const commentMasked = maskBlockComments(source).replace(
        /\/\/[^\n]*/g,
        (comment) => " ".repeat(comment.length),
      );
      for (const pattern of [
        /\.innerHTML\b/g,
        /\bnew\s+DOMParser\s*\(/g,
        /\.appendChild\s*\(/g,
      ]) {
        for (const match of commentMasked.matchAll(pattern))
          addFinding(
            "unsupported-pattern",
            repoPath,
            lineAt(commentMasked, match.index ?? 0),
            match[0],
          );
      }
      for (const insertion of scanSvgFetchInsertions(source))
        addFinding(
          "unsupported-pattern",
          repoPath,
          insertion.sourceLine,
          insertion.rawRef,
        );
    }
  }

  function scanJsonSource(repoPath: string, source: string): void {
    let parsed: unknown;
    try {
      parsed = JSON.parse(source);
    } catch {
      addFinding("unsupported-pattern", repoPath, null, "invalid-json");
      return;
    }
    function walk(value: unknown, field: string | null): void {
      if (Array.isArray(value)) {
        for (const item of value) walk(item, field);
        return;
      }
      if (value && typeof value === "object") {
        for (const [key, child] of Object.entries(
          value as Record<string, unknown>,
        ).sort(([a], [b]) => compareOrdinal(a, b)))
          walk(child, key);
        return;
      }
      if (typeof value !== "string") return;
      const sourceLine = lineAt(
        source,
        Math.max(0, source.indexOf(JSON.stringify(value))),
      );
      if (UUID_PATTERN.test(value)) {
        const mappedPath = inverseUuidMap.get(value);
        if (!mappedPath && !DIRECTUS_FILE_FIELDS.has(field ?? "")) return;
        const mappedAsset = mappedPath
          ? assetsByPath.get(mappedPath)?.[0]
          : undefined;
        if (mappedAsset)
          addExactUsage(mappedAsset, repoPath, sourceLine, "cms", field, value);
        else addFinding("missing-target", repoPath, sourceLine, value);
        return;
      }
      if (looksLikeAssetReference(value)) {
        bindReference(repoPath, {
          rawRef: value,
          sourceLine,
          context: "markup",
          deliveryEvidence: null,
          mediaTagName: null,
          mediaTagLine: null,
          mediaAttribute: null,
          altTextOverride: null,
          altSource: null,
        });
      }
    }
    walk(parsed, null);
  }

  await addGeneratedProvenance();

  async function ensureGeneratedFile(
    repoPath: string,
    origin: RepositoryAsset["origin"] = "generated-file",
  ): Promise<RepositoryAsset | null> {
    if (!trackedSet.has(repoPath)) return null;
    const existing = assets.get(`repo-file:${repoPath}`);
    if (existing) return existing;
    const bytes = await readBytes(repoPath);
    return addAsset({
      id: `repo-file:${repoPath}`,
      kind: assetKind(repoPath),
      origin,
      repoPath,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      bytes: bytes.byteLength,
      inlineSvgOrdinal: null,
    });
  }

  async function addGeneratedProvenance(): Promise<void> {
    const variantsPath = "apps/web/src/lib/content/media-variants.ts";
    if (trackedSet.has(variantsPath)) {
      const source = await readSource(variantsPath);
      let currentOriginal: string | null = null;
      for (const line of source.split("\n")) {
        const original = line.match(/^\t'([^']+)': \{$/);
        if (original) {
          currentOriginal = original[1]!;
          continue;
        }
        const variant = line.match(/\bpath:\s*'([^']+)'/);
        if (!variant || !currentOriginal || variant[1] === currentOriginal)
          continue;
        const outputPath = resolveLiteralPath(variantsPath, variant[1]!);
        const outputAsset = outputPath
          ? assetsByPath.get(outputPath)?.[0]
          : undefined;
        if (!outputAsset) continue;
        generatedFrom.push({
          outputAssetId: outputAsset.id,
          inputRef: currentOriginal,
          generator: "apps/cms/scripts/lib/media-variants.ts",
          relation: "derived-from",
        });
      }
    }

    const staticOgInputs = [
      "apps/web/src/lib/og/fonts/Inter-Black.ttf",
      "apps/web/src/lib/og/fonts/Inter-Medium.ttf",
      "apps/web/src/lib/og/fonts/JetBrainsMono-Medium.ttf",
      "apps/cms/brand/yesid-wordmark.svg",
    ] as const;
    const serviceOgInputs: Readonly<Record<string, string>> = {
      "analytics-reporting":
        "apps/web/static/svg/services/service-reporting.svg",
      "data-pipeline": "apps/web/static/svg/services/service-pipeline.svg",
      "database-engineering":
        "apps/web/static/svg/services/service-database.svg",
      "web-development": "apps/web/static/svg/services/service-web.svg",
    };
    for (const asset of [...assets.values()].filter(
      (item) =>
        item.repoPath?.startsWith("apps/web/static/og/") &&
        item.repoPath.endsWith(".png"),
    )) {
      const inputs: string[] = [...staticOgInputs];
      const serviceMatch = asset.repoPath?.match(
        /\/og\/services\/([a-z-]+?)(?:\.(?:fr|es))?\.png$/,
      );
      if (serviceMatch && serviceOgInputs[serviceMatch[1]!])
        inputs.push(serviceOgInputs[serviceMatch[1]!]!);
      if (
        /\/og\/routes\/about(?:\.(?:fr|es))?\.png$/.test(asset.repoPath ?? "")
      ) {
        inputs.push("apps/web/static/images/about/headshot.webp");
      }
      if (
        /\/og\/routes\/projects(?:\.(?:fr|es))?\.png$/.test(
          asset.repoPath ?? "",
        )
      ) {
        inputs.push(
          "apps/web/src/lib/assets/project-fallbacks/digital-desktop.svg",
        );
      }
      for (const inputRef of inputs) {
        generatedFrom.push({
          outputAssetId: asset.id,
          inputRef,
          generator: "apps/web/scripts/generate-og-cards.ts",
          relation: "generated-by",
        });
      }
    }

    const gbpCoverInputs = [
      "apps/web/src/lib/og/fonts/Inter-Black.ttf",
      "apps/web/src/lib/og/fonts/JetBrainsMono-Medium.ttf",
      "apps/cms/brand/yesid-wordmark.svg",
      "apps/web/src/lib/components/svg/azur/BlueprintAzurSide.svelte",
    ] as const;
    const gbpLogoInputs = [
      "apps/web/src/lib/og/fonts/JetBrainsMono-Medium.ttf",
      "apps/cms/brand/yesid-wordmark.svg",
    ] as const;
    for (const asset of [...assets.values()].filter((item) =>
      item.repoPath?.startsWith("gbp-assets/"),
    )) {
      const fileName = posix.basename(asset.repoPath ?? "");
      const inputs = fileName.startsWith("mark-dot.")
        ? ["scripts/generate-gbp-assets.ts#markDot"]
        : fileName.startsWith("logo-wordmark.")
          ? [...gbpLogoInputs]
          : fileName.startsWith("cover-services.") ||
              fileName.startsWith("og-default.")
            ? [...gbpCoverInputs]
            : [];
      for (const inputRef of inputs) {
        generatedFrom.push({
          outputAssetId: asset.id,
          inputRef,
          generator: "scripts/generate-gbp-assets.ts",
          relation: "generated-by",
        });
      }
    }
    const brandMark = assetsByPath.get(
      "apps/web/static/brand/mark-512.png",
    )?.[0];
    if (brandMark) {
      generatedFrom.push({
        outputAssetId: brandMark.id,
        inputRef: "scripts/generate-gbp-assets.ts#markDot",
        generator: "scripts/generate-gbp-assets.ts",
        relation: "generated-by",
      });
    }

    const graffiti = assetsByPath.get(
      "apps/web/static/svg/graffiti/the-end.svg",
    )?.[0];
    if (graffiti) {
      generatedFrom.push({
        outputAssetId: graffiti.id,
        inputRef: "apps/web/scripts/compose-graffiti.py#letters",
        generator: "apps/web/scripts/compose-graffiti.py",
        relation: "generated-by",
      });
    }

    const manifestPath = "apps/web/src/lib/content/generated.manifest.json";
    if (trackedSet.has(manifestPath)) {
      const manifest = JSON.parse(await readSource(manifestPath)) as {
        files?: Record<string, string>;
      };
      for (const fileName of Object.keys(manifest.files ?? {}).sort(
        compareOrdinal,
      )) {
        const outputPath = normalizeRepoPath(
          `apps/web/src/lib/content/${fileName}`,
        );
        const outputAsset = await ensureGeneratedFile(outputPath);
        if (!outputAsset) continue;
        generatedFrom.push({
          outputAssetId: outputAsset.id,
          inputRef: `${manifestPath}#files.${fileName}`,
          generator: "apps/cms/scripts/export-fallbacks.ts",
          relation: "generated-by",
        });
      }
    }

    const runtimeRoute =
      "apps/web/src/routes/og/[type=ogType]/[slug].png/+server.ts";
    if (trackedSet.has(runtimeRoute)) {
      for (const type of ["blog", "project"] as const) {
        const runtimeAsset = addAsset({
          id: `generated-runtime:og:${type}`,
          kind: "raster",
          origin: "generated-file",
          repoPath: runtimeRoute,
          sha256: null,
          bytes: null,
          inlineSvgOrdinal: null,
        });
        const runtimeInputs = [
          runtimeRoute,
          "apps/web/src/lib/og/template.ts",
          "apps/web/src/lib/og/render.ts",
          "apps/web/src/lib/og/fonts.ts",
          "apps/web/src/lib/og/load-title.ts",
          "apps/web/src/lib/og/fonts/Inter-Black.ttf",
          "apps/web/src/lib/og/fonts/Inter-Medium.ttf",
          "apps/web/src/lib/og/fonts/JetBrainsMono-Medium.ttf",
          `apps/web/src/lib/repositories/${type}.ts`,
          `apps/web/src/lib/content/${type === "blog" ? "blog.ts" : "projects.ts"}`,
        ];
        for (const inputRef of runtimeInputs) {
          generatedFrom.push({
            outputAssetId: runtimeAsset.id,
            inputRef,
            generator: runtimeRoute,
            relation: "generated-by",
          });
        }
      }
    }
  }

  for (const item of declarations) {
    const fragmentIndex = item.source.indexOf("#");
    const sourceFile = normalizeRepoPath(
      fragmentIndex < 0 ? item.source : item.source.slice(0, fragmentIndex),
    );
    const sourceFragment =
      fragmentIndex < 0
        ? null
        : normalizeText(item.source.slice(fragmentIndex + 1).trim());
    const declaredSourceFile = sourceFragment
      ? `${sourceFile}#${sourceFragment}`
      : sourceFile;
    if (!trackedSet.has(sourceFile)) {
      addFinding("missing-target", sourceFile, null, item.source);
    } else {
      const source = await readSource(sourceFile);
      const parsedDynamicEvidence = sourceFile.endsWith(".svelte")
        ? (
            svelteSurfaceCache.get(sourceFile) ??
            scanSvelteAssetSurface(sourceFile, source)
          ).mediaTags.some((tag) => tag.dynamicReferences.length > 0)
        : false;
      if (!hasDynamicEvidence(source) && !parsedDynamicEvidence) {
        addFinding(
          "unsupported-pattern",
          sourceFile,
          null,
          `declaration:${item.usageKey}:unmatched`,
        );
      }
    }
    usages.push({
      id: `declared:${item.usageKey}`,
      assetId: null,
      semanticKey: item.semanticKey,
      unresolvedRef: item.reason,
      confidence: "declared-dynamic",
      consumerType: item.consumerType,
      consumerKey: item.consumerKey,
      sourceKind: "declaration",
      sourceFile: declaredSourceFile,
      sourceLine: null,
      cmsField: null,
      route: item.route,
      locale: item.locale,
      slot: item.slot,
      required: item.required,
      deliveryMode: item.deliveryMode,
      altTextOverride: null,
      altSource: null,
    });
  }

  return {
    schemaVersion: 1,
    assets: [...assets.values()].sort((a, b) => compareOrdinal(a.id, b.id)),
    usages: usages.sort((a, b) => compareOrdinal(a.id, b.id)),
    generatedFrom: generatedFrom.sort(provenanceCompare),
    findings: findings.sort(findingCompare),
  };
}

function canonicalValue(value: unknown): unknown {
  if (typeof value === "string") return normalizeText(value);
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort(
      compareOrdinal,
    )) {
      result[normalizeText(key)] = canonicalValue(
        (value as Record<string, unknown>)[key],
      );
    }
    return result;
  }
  return value;
}

function canonicalEntry<T>(value: T): T {
  return canonicalValue(value) as T;
}

export function canonicalizeRepositoryScan(scan: RepositoryScan): string {
  if (scan.schemaVersion !== 1)
    throw new TypeError("Repository scan schemaVersion must be 1");
  const ordered: RepositoryScan = {
    schemaVersion: 1,
    assets: scan.assets
      .map(canonicalEntry)
      .sort((a, b) => compareOrdinal(a.id, b.id)),
    usages: scan.usages
      .map(canonicalEntry)
      .sort((a, b) => compareOrdinal(a.id, b.id)),
    generatedFrom: scan.generatedFrom
      .map(canonicalEntry)
      .sort(provenanceCompare),
    findings: scan.findings.map(canonicalEntry).sort(findingCompare),
  };
  return `${JSON.stringify(canonicalValue(ordered), null, "\t")}\n`;
}

export function hashRepositoryScan(scan: RepositoryScan): string {
  return createHash("sha256")
    .update(canonicalizeRepositoryScan(scan))
    .digest("hex");
}
