#!/usr/bin/env bun
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseTokens } from './src/parse.ts';
import { generateTokensCss } from './src/generators/tokens-css.ts';
import { generateThemeBlock, replaceThemeRegion } from './src/generators/theme-block.ts';
import { generateMotionTs } from './src/generators/motion-ts.ts';
import { generateDesignMd } from './src/generators/design-md.ts';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../..');

const TOKENS_JSON = resolve(here, 'tokens.json');
const TOKENS_CSS = resolve(repoRoot, 'apps/web/src/lib/styles/tokens.css');
const APP_CSS = resolve(repoRoot, 'apps/web/src/app.css');
const MOTION_TS = resolve(repoRoot, 'apps/web/src/lib/motion/tokens.ts');
const DESIGN_MD = resolve(repoRoot, 'DESIGN.md');

interface BuildTarget {
  path: string;
  content: string;
}

function buildAll(): BuildTarget[] {
  const tree = parseTokens(JSON.parse(readFileSync(TOKENS_JSON, 'utf-8')));

  const tokensCss = generateTokensCss(tree);
  const themeBlock = generateThemeBlock(tree);
  const motionTs = generateMotionTs(tree);
  const designMd = generateDesignMd(tree);

  // For app.css we replace only the sentinel region. If the file doesn't exist or
  // lacks sentinels, we error loudly — this is intentional, the migration step
  // (Task 1.10) adds the sentinels.
  let appCssContent: string;
  if (existsSync(APP_CSS)) {
    appCssContent = replaceThemeRegion(readFileSync(APP_CSS, 'utf-8'), themeBlock);
  } else {
    throw new Error(`app.css not found at ${APP_CSS}`);
  }

  return [
    { path: TOKENS_CSS, content: tokensCss },
    { path: APP_CSS, content: appCssContent },
    { path: MOTION_TS, content: motionTs },
    { path: DESIGN_MD, content: designMd },
  ];
}

function writeIfChanged(target: BuildTarget): boolean {
  const current = existsSync(target.path) ? readFileSync(target.path, 'utf-8') : null;
  if (current === target.content) return false;
  writeFileSync(target.path, target.content, 'utf-8');
  return true;
}

const targets = buildAll();
let changed = 0;
for (const t of targets) {
  if (writeIfChanged(t)) {
    console.log(`  wrote ${t.path}`);
    changed++;
  }
}
console.log(changed === 0 ? '✓ build idempotent (no changes)' : `✓ build wrote ${changed} file(s)`);
