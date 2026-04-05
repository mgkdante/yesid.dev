import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import TrainJourney from './TrainJourney.svelte';

describe('TrainJourney', () => {
	it('renders without crashing', () => {
		expect(() => render(TrainJourney)).not.toThrow();
	});

	it('has data-testid="train-journey"', () => {
		const { container } = render(TrainJourney);
		expect(container.querySelector('[data-testid="train-journey"]')).toBeInTheDocument();
	});

	it('contains the top-down train SVG', () => {
		const { container } = render(TrainJourney);
		// TrainTop renders an SVG inside the train-journey container
		const svg = container.querySelector('[data-testid="train-journey"] svg');
		expect(svg).toBeInTheDocument();
	});

	it('renders train wrapper element', () => {
		const { container } = render(TrainJourney);
		// The wrapper div contains the Train SVG
		const wrapper = container.querySelector('[data-testid="train-journey"] > div');
		expect(wrapper).toBeInTheDocument();
	});
});
