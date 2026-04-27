import type { TokenTree } from '../types.ts';
import { serializeYaml } from '../serialize.ts';
import { isLeaf } from '../parse.ts';

interface DesignMdOptions {
  /** Component names to list under ## Components. Child 3 populates this; Child 1 emits an empty array. */
  components?: string[];
}

function yamlMap(tree: TokenTree, indent: number, transformKey?: (k: string) => string): string {
  const lines: string[] = [];
  const pad = ' '.repeat(indent);
  for (const [k, v] of Object.entries(tree)) {
    if (k.startsWith('$')) continue;
    const outKey = transformKey ? transformKey(k) : k;
    if (isLeaf(v)) {
      lines.push(`${pad}${outKey}: ${serializeYaml(v)}`);
    } else {
      lines.push(`${pad}${outKey}:`);
      lines.push(yamlMap(v as TokenTree, indent + 2, transformKey));
    }
  }
  return lines.join('\n');
}

export function generateDesignMd(tree: TokenTree, opts: DesignMdOptions = {}): string {
  const colors = tree.color as TokenTree;
  const text = tree.text as TokenTree;
  const radius = tree.radius as TokenTree;
  const space = tree.space as TokenTree;

  // Typography: each text-* token becomes { fontFamily: ..., fontSize: ... }.
  // For Child 1 we emit a minimal map; richer typography composition can come later.
  const typographyLines: string[] = [];
  for (const [k, v] of Object.entries(text)) {
    if (isLeaf(v)) {
      typographyLines.push(`  ${k}:`);
      typographyLines.push(`    fontSize: ${serializeYaml(v)}`);
    }
  }

  const componentsBlock = (opts.components ?? []).length
    ? (opts.components ?? []).map((c) => `  ${c}: {}`).join('\n')
    : '  # populated in slice-design-3-figma';

  return `---
version: alpha
name: yesid.dev
description: Digital infrastructure that moves. Edge-to-edge, dark-first, one orange, motion-with-intent.

# GENERATED FROM packages/tokens/tokens.json — DO NOT EDIT
# Run \`bun run --cwd packages/tokens build\` to regenerate.

colors:
  brand:
${yamlMap(colors.brand as TokenTree, 4)}
  dark:
${yamlMap(colors.dark as TokenTree, 4)}
  light:
${yamlMap(colors.light as TokenTree, 4)}

typography:
${typographyLines.join('\n')}

rounded:
${yamlMap(radius, 2)}

spacing:
${yamlMap(space, 2, (k) => `"${k}"`)}

components:
${componentsBlock}
---

## Overview

yesid.dev is a freelance digital-infrastructure brand. The design language is edge-to-edge,
dark-first, restrained-orange. Every visual decision traces back to one of five principles:
edge-to-edge layout, dark-first surfaces, one-orange interactivity, motion-with-intent,
no fluff. Full narrative: \`apps/web/brand/BRAND.md\`. Implementation rules:
\`docs/project/CONSTITUTION.md\`.

## Colors

Single brand orange (\`#E07800\`) reserved for interactive surfaces only. Semantic tokens
(\`background\`, \`foreground\`, \`card\`, \`muted\`, etc.) carry theme-switching responsibility.
Contrast verified on dark first, then light.

## Typography

Inter Variable for headings + body; JetBrains Mono Variable for code, terminals, mono labels.
Self-hosted (no Google Fonts CDN). Type scale uses \`clamp()\` for fluid sizing across breakpoints.
Hard floors: body ≥ 16px, mono ≥ 13px, labels ≥ 12px, micro for chrome only.

## Layout

Four CSS Grid recipes: Full-Bleed · Contained · Content+Sidebars · Edge-Title-Grid. Container
widths cap at \`64rem\` (content) / \`72rem\` (wide). Page gutters scale via \`--space-page-x\`.
Section spacing scales via \`--space-section-y\`. Detailed recipes:
\`docs/project/CONSTITUTION.md § 2\`.

## Elevation & Depth

Shadow tokens use \`color-mix(in srgb, var(--primary) N%, transparent)\` for brand-connected
glows. Six tiers: \`glow-sm\`, \`glow-md\`, \`glow-lg\`, \`card\`, \`section\`, \`nav\`. No raw
\`box-shadow\` in components.

## Shapes

Five radius tokens: \`sm\` (4px), \`md\` (8px, default), \`lg\` (12px), \`xl\` (16px), \`pill\` (9999px).
Borders use semantic tokens (\`border\`, \`border-subtle\`, \`border-strong\`).

## Components

See \`apps/web/src/lib/components/brand/\` (12 brand primitives) and \`apps/web/src/lib/components/ui/\`
(19 shadcn-svelte primitives, customized with brand tokens). Figma documentation:
\`apps/web/brand/foundations/figma.md\`.

## Do's and Don'ts

**Do**

- Reference tokens via \`var(--token)\` or Tailwind utilities (\`bg-primary\`, \`text-foreground\`).
- Use the 4 CSS Grid recipes; pages own their grids in scoped CSS.
- Respect \`prefers-reduced-motion\` on every animation.

**Don't**

- Hardcode hex colors in components.
- Use arbitrary Tailwind values (\`text-[14px]\`, \`p-[22px]\`) — use the scale or a token.
- Use \`vh\` on mobile; use \`dvh\`/\`svh\`/\`lvh\`.
- Add motion that doesn't serve wayfinding, feedback, or emphasis.
`;
}
