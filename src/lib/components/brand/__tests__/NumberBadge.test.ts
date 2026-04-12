import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import NumberBadge from '../NumberBadge.svelte';

describe('NumberBadge', () => {
  it('renders zero-padded number', () => {
    render(NumberBadge, { props: { value: 3 } });
    expect(screen.getByText('03')).toBeTruthy();
  });

  it('renders two-digit numbers without extra padding', () => {
    render(NumberBadge, { props: { value: 12 } });
    expect(screen.getByText('12')).toBeTruthy();
  });

  it('applies custom color via inline style', () => {
    const { container } = render(NumberBadge, { props: { value: 1, color: '#FF0000' } });
    const badge = container.querySelector('.badge')!;
    expect(badge.getAttribute('style')).toContain('#FF0000');
  });

  it('renders sonar ring when sonar is true', () => {
    const { container } = render(NumberBadge, { props: { value: 1, sonar: true } });
    expect(container.querySelector('.sonar-ring')).toBeTruthy();
    expect(container.querySelector('.badge-wrapper')).toBeTruthy();
  });

  it('does not render sonar ring by default', () => {
    const { container } = render(NumberBadge, { props: { value: 1 } });
    expect(container.querySelector('.sonar-ring')).toBeNull();
  });

  it('is hidden from assistive tech', () => {
    const { container } = render(NumberBadge, { props: { value: 1 } });
    const badge = container.querySelector('.badge')!;
    expect(badge.getAttribute('aria-hidden')).toBe('true');
  });
});
