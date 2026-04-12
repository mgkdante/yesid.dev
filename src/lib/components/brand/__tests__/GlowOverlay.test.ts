import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import GlowOverlay from '../GlowOverlay.svelte';

describe('GlowOverlay', () => {
  it('renders an overlay div', () => {
    const { container } = render(GlowOverlay);
    const overlay = container.querySelector('[aria-hidden="true"]');
    expect(overlay).toBeTruthy();
  });

  it('is pointer-events-none and absolutely positioned', () => {
    const { container } = render(GlowOverlay);
    const overlay = container.querySelector('[aria-hidden="true"]')!;
    expect(overlay.className).toContain('pointer-events-none');
    expect(overlay.className).toContain('absolute');
    expect(overlay.className).toContain('inset-0');
  });

  it('starts with zero opacity and transitions on group-hover', () => {
    const { container } = render(GlowOverlay);
    const overlay = container.querySelector('[aria-hidden="true"]')!;
    expect(overlay.className).toContain('opacity-0');
    expect(overlay.className).toContain('group-hover:opacity-100');
  });

  it('inherits border-radius from parent', () => {
    const { container } = render(GlowOverlay);
    const overlay = container.querySelector('[aria-hidden="true"]')!;
    expect(overlay.className).toContain('rounded-[inherit]');
  });

  it('has transition for smooth opacity change', () => {
    const { container } = render(GlowOverlay);
    const overlay = container.querySelector('[aria-hidden="true"]')!;
    expect(overlay.className).toContain('transition-opacity');
    expect(overlay.className).toContain('duration-300');
  });
});
