import type { TokenTree, Token } from '../types.ts';
import { serializeCss } from '../serialize.ts';
import { isLeaf } from '../parse.ts';

const HEADER = `/* GENERATED FROM packages/tokens/tokens.json — DO NOT EDIT */
/* Run \`bun run --cwd packages/tokens build\` to regenerate. */
`;

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

function emitBlock(selector: string, items: FlatToken[]): string {
  if (items.length === 0) return '';
  const lines = items.map(({ cssName, token }) => `  --${cssName}: ${serializeCss(token)};`);
  return `${selector} {\n${lines.join('\n')}\n}\n`;
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

  return (
    HEADER +
    '\n' +
    emitBlock(':root', rootItems) +
    '\n' +
    emitBlock('[data-theme="dark"], .theme-dark', darkItems) +
    '\n' +
    emitBlock('[data-theme="light"], .theme-light', lightItems)
  );
}
