import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import BrandButtonTest from './BrandButtonTest.svelte';

describe('BrandButton', () => {
  it('renders a button by default', () => {
    const { container } = render(BrandButtonTest, { props: { text: 'Click me' } });
    expect(container.querySelector('button')).toBeTruthy();
    expect(container.querySelector('a')).toBeNull();
  });

  it('renders an anchor when href is provided', () => {
    const { container } = render(BrandButtonTest, { props: { text: 'Go', href: '/contact' } });
    const link = container.querySelector('a');
    expect(link).toBeTruthy();
    expect(link!.getAttribute('href')).toBe('/contact');
    expect(container.querySelector('button')).toBeNull();
  });

  it('renders text content', () => {
    render(BrandButtonTest, { props: { text: 'Send message' } });
    expect(screen.getByText('Send message')).toBeTruthy();
  });

  it('defaults to primary variant', () => {
    const { container } = render(BrandButtonTest, { props: { text: 'Test' } });
    const btn = container.querySelector('button')!;
    expect(btn.className).toContain('btn-primary');
  });

  it('applies ghost variant', () => {
    const { container } = render(BrandButtonTest, { props: { text: 'Test', variant: 'ghost' } });
    const btn = container.querySelector('button')!;
    expect(btn.className).toContain('btn-ghost');
  });

  it('applies md size by default', () => {
    const { container } = render(BrandButtonTest, { props: { text: 'Test' } });
    const btn = container.querySelector('button')!;
    expect(btn.className).toContain('px-6');
  });

  it('applies sm size', () => {
    const { container } = render(BrandButtonTest, { props: { text: 'Test', size: 'sm' } });
    const btn = container.querySelector('button')!;
    expect(btn.className).toContain('px-5');
  });

  it('applies lg size', () => {
    const { container } = render(BrandButtonTest, { props: { text: 'Test', size: 'lg' } });
    const btn = container.querySelector('button')!;
    expect(btn.className).toContain('px-8');
  });
});
