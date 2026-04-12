import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Tag from '../Tag.svelte';

describe('Tag', () => {
  it('renders the text', () => {
    render(Tag, { props: { text: 'TypeScript' } });
    expect(screen.getByText('TypeScript')).toBeTruthy();
  });

  it('defaults to sm size, inactive, non-interactive', () => {
    const { container } = render(Tag, { props: { text: 'Test' } });
    const span = container.querySelector('span')!;
    expect(span.className).toContain('px-3');
    expect(span.className).toContain('text-xs');
    expect(span.className).not.toContain('cursor-pointer');
  });

  it('applies xs size', () => {
    const { container } = render(Tag, { props: { text: 'Test', size: 'xs' } });
    const span = container.querySelector('span')!;
    expect(span.className).toContain('px-2');
  });

  it('applies active state class', () => {
    const { container } = render(Tag, { props: { text: 'Test', active: true } });
    const span = container.querySelector('span')!;
    expect(span.className).toContain('tag-active');
  });

  it('applies inactive state class', () => {
    const { container } = render(Tag, { props: { text: 'Test', active: false } });
    const span = container.querySelector('span')!;
    expect(span.className).toContain('tag-inactive');
  });

  it('applies custom accent color via inline style when active', () => {
    const { container } = render(Tag, { props: { text: 'Test', active: true, accentColor: '#FF0000' } });
    const span = container.querySelector('span')!;
    expect(span.getAttribute('style')).toContain('#FF0000');
    expect(span.className).not.toContain('tag-active');
  });

  it('applies interactive cursor', () => {
    const { container } = render(Tag, { props: { text: 'Test', interactive: true } });
    const span = container.querySelector('span')!;
    expect(span.className).toContain('cursor-pointer');
  });
});
