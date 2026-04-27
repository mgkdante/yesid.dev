import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import tokens from '../../tokens.json' with { type: 'json' };
import { parseTokens } from '../parse.ts';
import { generateTokensCss } from '../generators/tokens-css.ts';
import { generateThemeBlock, replaceThemeRegion } from '../generators/theme-block.ts';
import { generateMotionTs } from '../generators/motion-ts.ts';
import { generateDesignMd } from '../generators/design-md.ts';

const repoRoot = resolve(process.cwd(), '../..');
const tree = parseTokens(tokens);

function read(rel: string): string {
  return readFileSync(resolve(repoRoot, rel), 'utf-8');
}

describe('parity — generated outputs match committed files', () => {
  it('apps/web/src/lib/styles/tokens.css matches generator', () => {
    const expected = generateTokensCss(tree);
    const actual = read('apps/web/src/lib/styles/tokens.css');
    expect(actual).toBe(expected);
  });

  it('apps/web/src/app.css @theme region matches generator', () => {
    const fresh = generateThemeBlock(tree);
    const file = read('apps/web/src/app.css');
    const expected = replaceThemeRegion(file, fresh);
    expect(file).toBe(expected);
  });

  it('apps/web/src/lib/motion/tokens.ts matches generator', () => {
    const expected = generateMotionTs(tree);
    const actual = read('apps/web/src/lib/motion/tokens.ts');
    expect(actual).toBe(expected);
  });

  it('DESIGN.md matches generator', () => {
    const expected = generateDesignMd(tree);
    const actual = read('DESIGN.md');
    expect(actual).toBe(expected);
  });
});
