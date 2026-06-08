import { describe, it, expect } from 'vitest';
import { renderOgPng } from './render';
import { buildOgTree } from './template';

describe('renderOgPng', () => {
  it('produces a valid 1200x630 PNG', async () => {
    const tree = buildOgTree({ eyebrow: 'BLOG', title: 'A real test title' });
    const bytes = await renderOgPng(tree);

    // PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
    expect(bytes[0]).toBe(0x89);
    expect(bytes[1]).toBe(0x50);
    expect(bytes[2]).toBe(0x4e);
    expect(bytes[3]).toBe(0x47);

    // IHDR chunk: width = bytes 16..19, height = bytes 20..23 (big-endian).
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    expect(dv.getUint32(16, false)).toBe(1200);
    expect(dv.getUint32(20, false)).toBe(630);

    expect(bytes.byteLength).toBeGreaterThan(5_000);
    expect(bytes.byteLength).toBeLessThan(200_000);
  }, 10_000);

  it('is deterministic for fixed input', async () => {
    const tree = buildOgTree({ eyebrow: 'PROJECT', title: 'Determinism' });
    const a = await renderOgPng(tree);
    const b = await renderOgPng(tree);
    expect(a.byteLength).toBe(b.byteLength);
    for (let i = 0; i < a.byteLength; i++) {
      if (a[i] !== b[i]) {
        throw new Error(`bytes differ at index ${i}: ${a[i]} vs ${b[i]}`);
      }
    }
  }, 15_000);
});
