import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import ScrollPrompt from './ScrollPrompt.svelte';

describe('ScrollPrompt', () => {
	it('renders without crashing', () => {
		expect(() => render(ScrollPrompt)).not.toThrow();
	});

	it('has accessible label for scroll action', () => {
		const { container } = render(ScrollPrompt);
		const prompt = container.querySelector('[data-testid="scroll-prompt"]');
		expect(prompt).toBeInTheDocument();
		expect(prompt?.getAttribute('aria-label')).toBe('Scroll down');
	});

	it('renders an SVG chevron', () => {
		const { container } = render(ScrollPrompt);
		const svg = container.querySelector('svg');
		expect(svg).toBeInTheDocument();
		const path = svg?.querySelector('path');
		expect(path).toBeInTheDocument();
	});
});
