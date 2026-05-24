import { describe, it, expect } from 'vitest';
import { match } from './ogType';

describe('ogType param matcher', () => {
  it('accepts "blog"', () => {
    expect(match('blog')).toBe(true);
  });

  it('accepts "project"', () => {
    expect(match('project')).toBe(true);
  });

  it('rejects unknown types', () => {
    expect(match('foo')).toBe(false);
    expect(match('')).toBe(false);
    expect(match('Blog')).toBe(false);
    expect(match('blogs')).toBe(false);
  });
});
