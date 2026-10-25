import { describe, it, expect } from 'vitest';
import { params } from '../params';

async function match(value: string): Promise<boolean> {
  return !(await params.ogType['~standard'].validate(value)).issues;
}

describe('ogType param matcher', () => {
  it('accepts "blog"', async () => {
    expect(await match('blog')).toBe(true);
  });

  it('accepts "project"', async () => {
    expect(await match('project')).toBe(true);
  });

  it('rejects unknown types', async () => {
    expect(await match('foo')).toBe(false);
    expect(await match('')).toBe(false);
    expect(await match('Blog')).toBe(false);
    expect(await match('blogs')).toBe(false);
  });
});
