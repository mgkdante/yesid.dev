import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import StopLabel from '../StopLabel.svelte';

describe('StopLabel', () => {
  it('renders stop number and label', () => {
    const { container } = render(StopLabel, { props: { stop: '03', label: 'STACK' } });
    expect(container.querySelector('.stop-label')?.textContent).toBe('STOP 03 · STACK');
  });

  it('renders with different stop values', () => {
    const { container } = render(StopLabel, { props: { stop: '07', label: 'CONTACT' } });
    expect(container.querySelector('.stop-label')?.textContent).toBe('STOP 07 · CONTACT');
  });

  it.each([
    ['fr', 'ARRÊT 03 · STACK'],
    ['es', 'PARADA 03 · STACK'],
  ] as const)('keeps the app-owned %s prefix', (locale, expected) => {
    const { container } = render(StopLabel, {
      props: { stop: '03', label: 'STACK' },
      context: new Map([[Symbol.for('@yesid/ui/locale'), () => locale]]),
    });
    expect(container.querySelector('.stop-label')?.textContent).toBe(expected);
  });

  // GO2-W5 wayfinding plate: the digits speak the yellow voice.

});
