import type { TokenTree, Token } from '../types.ts';
import { serializeCss } from '../serialize.ts';
import { isLeaf } from '../parse.ts';

const HEADER = `/* GENERATED FROM packages/tokens/tokens.json — DO NOT EDIT */
/* Run \`bun run --cwd packages/tokens build\` to regenerate. */
`;

/**
 * Paired tokens: CSS architectural cross-references (not raw DTCG values).
 * These map shadcn-compatible aliases to primary semantic tokens via var().
 * They are identical in both dark and light themes.
 */
const PAIRED_TOKENS = [
  '  /* Paired tokens (shadcn-compatible) */',
  '  --card-foreground: var(--foreground);',
  '  --popover-foreground: var(--foreground);',
  '  --primary-foreground: var(--background);',
  '  --accent-foreground: var(--background);',
  '  --secondary: var(--popover);',
  '  --ring: var(--primary);',
  '  --input: var(--border);',
].join('\n');

interface FlatToken {
  cssName: string;
  token: Token;
}

/** Walk a subtree and yield CSS-name → token pairs. Skips $-prefixed metadata. */
function flatten(tree: TokenTree, prefix = ''): FlatToken[] {
  const out: FlatToken[] = [];
  for (const [k, v] of Object.entries(tree)) {
    if (k.startsWith('$')) continue;
    const name = prefix ? `${prefix}-${k}` : k;
    if (isLeaf(v)) {
      out.push({ cssName: name, token: v });
    } else {
      out.push(...flatten(v as TokenTree, name));
    }
  }
  return out;
}

function emitBlock(selector: string, items: FlatToken[], extra?: string): string {
  if (items.length === 0) return '';
  const lines = items.map(({ cssName, token }) => `  --${cssName}: ${serializeCss(token)};`);
  const body = extra ? `${lines.join('\n')}\n\n${extra}` : lines.join('\n');
  return `${selector} {\n${body}\n}\n`;
}

export function generateTokensCss(tree: TokenTree): string {
  // :root holds brand + non-themed tokens (radius, duration, ease, z, opacity, container, font, text, space, shadow, color.brand).
  const rootItems: FlatToken[] = [];
  const darkItems: FlatToken[] = [];
  const lightItems: FlatToken[] = [];

  for (const [topKey, topValue] of Object.entries(tree)) {
    if (topKey.startsWith('$')) continue;
    if (topKey === 'color') {
      // color.brand → :root; color.dark → dark theme; color.light → light theme
      for (const [subKey, subValue] of Object.entries(topValue as TokenTree)) {
        const flat = flatten(subValue as TokenTree, subKey === 'brand' ? '' : '');
        if (subKey === 'brand') rootItems.push(...flat);
        else if (subKey === 'dark') darkItems.push(...flat);
        else if (subKey === 'light') lightItems.push(...flat);
      }
    } else {
      const flat = flatten(topValue as TokenTree, topKey);
      rootItems.push(...flat);
    }
  }

  // :root gets a shadcn --radius alias pointing to our --radius-md
  const rootExtra = '  /* shadcn alias — components reference --radius */\n  --radius: var(--radius-md);';

  const darkBlock = emitBlock('[data-theme="dark"], .theme-dark', darkItems, PAIRED_TOKENS);
  const lightBlock = emitBlock('[data-theme="light"], .theme-light', lightItems, PAIRED_TOKENS);

  // prefers-color-scheme fallbacks mirror the attribute-selector theme blocks.
  // These fire when the user hasn't explicitly set a data-theme attribute.
  const darkMedia =
    `@media (prefers-color-scheme: dark) {\n` +
    `  :root:not([data-theme="light"]) {\n` +
    darkItems.map(({ cssName, token }) => `    --${cssName}: ${serializeCss(token)};`).join('\n') +
    `\n\n` +
    PAIRED_TOKENS.split('\n').map(l => `  ${l}`).join('\n') +
    `\n  }\n}\n`;

  const lightMedia =
    `@media (prefers-color-scheme: light) {\n` +
    `  :root:not([data-theme="dark"]) {\n` +
    lightItems.map(({ cssName, token }) => `    --${cssName}: ${serializeCss(token)};`).join('\n') +
    `\n\n` +
    PAIRED_TOKENS.split('\n').map(l => `  ${l}`).join('\n') +
    `\n  }\n}\n`;

  return (
    HEADER +
    '\n' +
    emitBlock(':root', rootItems, rootExtra) +
    '\n' +
    darkBlock +
    '\n' +
    lightBlock +
    '\n' +
    darkMedia +
    '\n' +
    lightMedia
  );
}
