import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

const SCRIPT = resolve(__dirname, '../push-to-figma.ts');

interface FigmaVariable {
  name: string;
  type: 'COLOR' | 'FLOAT' | 'STRING';
  values: Record<string, string | number>;
  description?: string;
}

function runScript(): FigmaVariable[] {
  const stdout = execSync(`bun run ${SCRIPT}`, { encoding: 'utf-8' });
  return JSON.parse(stdout) as FigmaVariable[];
}

describe('push-to-figma', () => {
  it('produces no name collisions across collections', () => {
    // Regression: in PR #61's use_figma push code, collection-prefix stripping
    // collapsed `shadow/card` and `color/card` to the same name. The output of
    // push-to-figma.ts itself must never contain duplicate names — even if a
    // downstream consumer wants to display them differently in Figma.
    const vars = runScript();
    const names = vars.map((v) => v.name);
    const dupes = names.filter((n, i) => names.indexOf(n) !== i);
    expect(dupes).toEqual([]);
  });

  it('keeps shadow/ prefix on Shadow collection variables', () => {
    // Shadow names retain the full path (shadow/card, shadow/glow-sm, ...).
    // If a future consumer strips the prefix, it must rename or scope to the
    // collection to avoid `card` collision with the Color collection.
    const vars = runScript();
    const shadowVars = vars.filter((v) => v.name.startsWith('shadow/'));
    expect(shadowVars.length).toBeGreaterThanOrEqual(6);
    expect(shadowVars.find((v) => v.name === 'shadow/card')).toBeDefined();
    expect(shadowVars.every((v) => v.type === 'STRING')).toBe(true);
  });

  it('keeps color/ prefix on Color collection variables (so color/card stays distinct)', () => {
    const vars = runScript();
    const colorCard = vars.find((v) => v.name === 'color/card');
    expect(colorCard).toBeDefined();
    expect(colorCard?.type).toBe('COLOR');
    // color/card has dark + light modes; never `default` (themed pair, not brand)
    expect(Object.keys(colorCard!.values).sort()).toEqual(['dark', 'light']);
  });

  it('produces 69 variables (post-trim baseline)', () => {
    // Sanity check on the overall count after slice-design's trim of
    // dim-foreground, light-foreground, text-body-lg.
    const vars = runScript();
    expect(vars.length).toBe(69);
  });

  it('every variable has at least one value mode', () => {
    const vars = runScript();
    for (const v of vars) {
      const modes = Object.keys(v.values);
      expect(modes.length).toBeGreaterThan(0);
    }
  });
});
