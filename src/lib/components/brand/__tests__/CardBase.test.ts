import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import CardBaseTest from './CardBaseTest.svelte';

describe('CardBase', () => {
  it('renders content', () => {
    render(CardBaseTest, { props: { text: 'Hello' } });
    expect(screen.getByText('Hello')).toBeTruthy();
  });

  it('renders as div by default', () => {
    const { container } = render(CardBaseTest);
    expect(container.querySelector('div.card')).toBeTruthy();
    expect(container.querySelector('a')).toBeNull();
  });

  it('renders as anchor when href is provided', () => {
    const { container } = render(CardBaseTest, { props: { href: '/work/project' } });
    const link = container.querySelector('a.card');
    expect(link).toBeTruthy();
    expect(link!.getAttribute('href')).toBe('/work/project');
  });

  it('applies hover glow class by default', () => {
    const { container } = render(CardBaseTest);
    const card = container.querySelector('.card')!;
    expect(card.className).toContain('brand-glow-hover');
  });

  it('does not apply hover glow when hover=false', () => {
    const { container } = render(CardBaseTest, { props: { hover: false } });
    const card = container.querySelector('.card')!;
    expect(card.className).not.toContain('brand-glow-hover');
  });

  it('applies interactive cursor', () => {
    const { container } = render(CardBaseTest, { props: { interactive: true } });
    const card = container.querySelector('.card')!;
    expect(card.className).toContain('cursor-pointer');
  });

  it('defaults to md padding', () => {
    const { container } = render(CardBaseTest);
    const card = container.querySelector('.card')!;
    expect(card.className).toContain('p-4');
  });

  it('applies sm padding', () => {
    const { container } = render(CardBaseTest, { props: { padding: 'sm' } });
    const card = container.querySelector('.card')!;
    expect(card.className).toContain('p-3');
  });

  it('applies lg padding', () => {
    const { container } = render(CardBaseTest, { props: { padding: 'lg' } });
    const card = container.querySelector('.card')!;
    expect(card.className).toContain('p-6');
  });

  it('has group class for child hover effects', () => {
    const { container } = render(CardBaseTest);
    const card = container.querySelector('.card')!;
    expect(card.className).toContain('group');
  });
});
