import { describe, it, expect } from 'vitest';
import { buildOgTree } from './template';

describe('buildOgTree', () => {
  it('matches snapshot for typical blog title', () => {
    const tree = buildOgTree({
      eyebrow: 'BLOG',
      title: 'Postgres Vacuum Tuning for High-Write Tables',
    });
    expect(tree).toMatchSnapshot();
  });

  it('matches snapshot for short project title', () => {
    const tree = buildOgTree({
      eyebrow: 'PROJECT',
      title: 'Transit Pipelines',
    });
    expect(tree).toMatchSnapshot();
  });

  it('matches snapshot for title with special chars', () => {
    const tree = buildOgTree({
      eyebrow: 'BLOG',
      title: `Why "&<>'" all matter`,
    });
    expect(tree).toMatchSnapshot();
  });
});
