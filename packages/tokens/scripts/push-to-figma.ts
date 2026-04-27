#!/usr/bin/env bun
// Prepare tokens.json for ingestion into Figma Variables.
// Output: a flat FigmaVariable[] array on stdout. Status messages on stderr.
// A separate orchestration step consumes the JSON and calls the Figma MCP.

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseTokens, isPrimitive, isClampToken } from '../src/parse.ts';
import type { Token, TokenTree, DtcgPrimitive } from '../src/types.ts';

interface FigmaVariable {
  name: string;
  type: 'COLOR' | 'FLOAT' | 'STRING';
  values: Record<string, string | number>;
  description?: string;
}

interface FlatLeaf {
  // Slash-joined path from the tokens.json root (e.g. "color/dark/background", "space/page-x").
  path: string;
  token: Token;
}

const here = dirname(fileURLToPath(import.meta.url));
const TOKENS_JSON = resolve(here, '../tokens.json');

function flattenTree(tree: TokenTree, prefix: string[] = []): FlatLeaf[] {
  const out: FlatLeaf[] = [];
  for (const [key, value] of Object.entries(tree)) {
    if (key.startsWith('$')) continue;
    const next = [...prefix, key];
    if (isPrimitive(value) || isClampToken(value)) {
      out.push({ path: next.join('/'), token: value });
    } else if (typeof value === 'object' && value !== null) {
      out.push(...flattenTree(value as TokenTree, next));
    } else {
      throw new Error(`tokens.json: unexpected non-object branch at ${next.join('.')}`);
    }
  }
  return out;
}

function figmaTypeFor(token: Token): FigmaVariable['type'] {
  if (isClampToken(token)) return 'STRING';
  // Narrowed by isPrimitive in caller; type assertion only to access $type.
  const t = (token as DtcgPrimitive).$type;
  if (t === 'color') return 'COLOR';
  if (t === 'number') return 'FLOAT';
  // dimension, fontFamily, fontWeight, duration, cubicBezier, string — all serialize as strings.
  return 'STRING';
}

function valueFor(token: Token): string | number {
  if (isClampToken(token)) {
    const { min, preferred, max } = token.$value;
    return `clamp(${min}, ${preferred}, ${max})`;
  }
  // DtcgPrimitive — number stays number (FLOAT), everything else passes through as-is.
  return token.$value;
}

// Brand colors and dark/light theme colors live under color/{brand,dark,light}/X.
// For Figma variable names we strip those mode-bucket segments so the variable is
// "color/primary" (one variable across themes) rather than "color/brand/primary".
function colorVariableName(leaf: FlatLeaf): string | null {
  const parts = leaf.path.split('/');
  if (parts[0] !== 'color' || parts.length < 3) return null;
  const bucket = parts[1];
  if (bucket !== 'brand' && bucket !== 'dark' && bucket !== 'light') return null;
  return ['color', ...parts.slice(2)].join('/');
}

function buildVariables(tree: TokenTree): FigmaVariable[] {
  const leaves = flattenTree(tree);
  const variables = new Map<string, FigmaVariable>();

  for (const leaf of leaves) {
    const collapsedColorName = colorVariableName(leaf);
    const isThemed = collapsedColorName !== null && (leaf.path.split('/')[1] === 'dark' || leaf.path.split('/')[1] === 'light');
    const name = collapsedColorName ?? leaf.path;
    const mode = isThemed ? (leaf.path.split('/')[1] as 'dark' | 'light') : 'default';
    const type = figmaTypeFor(leaf.token);
    const value = valueFor(leaf.token);

    const existing = variables.get(name);
    if (existing) {
      // A second leaf collapsed onto the same name — only legal for dark/light theme pairs.
      if (existing.type !== type) {
        throw new Error(
          `Figma variable "${name}" type mismatch: existing=${existing.type}, new=${type} (from ${leaf.path})`,
        );
      }
      existing.values[mode] = value;
      // Prefer the first description seen; don't overwrite with empty.
      if (!existing.description && leaf.token.$description) {
        existing.description = leaf.token.$description;
      }
      continue;
    }

    const variable: FigmaVariable = {
      name,
      type,
      values: { [mode]: value },
    };
    if (leaf.token.$description) variable.description = leaf.token.$description;
    variables.set(name, variable);
  }

  return [...variables.values()];
}

function main(): void {
  let raw: string;
  try {
    raw = readFileSync(TOKENS_JSON, 'utf-8');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`failed to read ${TOKENS_JSON}: ${msg}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`tokens.json is not valid JSON: ${msg}`);
  }

  const tree = parseTokens(parsed);
  const variables = buildVariables(tree);

  console.error(`prepared ${variables.length} Figma variable(s) from ${TOKENS_JSON}`);
  process.stdout.write(JSON.stringify(variables, null, 2));
  process.stdout.write('\n');
}

try {
  main();
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`push-to-figma: ${msg}`);
  process.exit(1);
}
