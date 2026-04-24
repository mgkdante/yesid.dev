import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import AboutPage from './AboutPage.svelte';

describe('AboutPage', () => {
	it('renders with data-testid page-about', () => {
		render(AboutPage, { props: { weather: null } });
		expect(screen.getByTestId('page-about')).toBeTruthy();
	});

	it('renders the top hazard stripe', () => {
		render(AboutPage, { props: { weather: null } });
		// Heading was removed — dashboard has a hazard stripe instead
		const page = screen.getByTestId('page-about');
		expect(page).toBeTruthy();
	});

	it('renders metro stop labels on cards', () => {
		render(AboutPage, { props: { weather: null } });
		expect(screen.getByText('STOP 00 — IDENTITY')).toBeTruthy();
		expect(screen.getByText('STOP 08 — SNAPSHOTS')).toBeTruthy();
	});

	it('renders the identity section', () => {
		render(AboutPage, { props: { weather: null } });
		expect(screen.getByTestId('about-identity')).toBeTruthy();
	});

	it('renders the polaroids section', () => {
		render(AboutPage, { props: { weather: null } });
		expect(screen.getByTestId('about-polaroids')).toBeTruthy();
	});

	it('renders the metrics section', () => {
		render(AboutPage, { props: { weather: null } });
		expect(screen.getByTestId('about-metrics')).toBeTruthy();
	});

	it('renders the methodology section', () => {
		render(AboutPage, { props: { weather: null } });
		expect(screen.getByTestId('about-method')).toBeTruthy();
	});

	it('renders the testimonials section', () => {
		render(AboutPage, { props: { weather: null } });
		expect(screen.getByTestId('about-testimonials')).toBeTruthy();
	});

	it('renders the tech stack section', () => {
		render(AboutPage, { props: { weather: null } });
		expect(screen.getByTestId('about-tech-stack')).toBeTruthy();
	});

	it('renders the weather section', () => {
		render(AboutPage, { props: { weather: null } });
		expect(screen.getByTestId('about-weather')).toBeTruthy();
	});

	it('renders the interests section', () => {
		render(AboutPage, { props: { weather: null } });
		expect(screen.getByTestId('about-interests')).toBeTruthy();
	});

	it('renders the logos section', () => {
		render(AboutPage, { props: { weather: null } });
		expect(screen.getByTestId('about-logos')).toBeTruthy();
	});

	it('renders the CTA section', () => {
		render(AboutPage, { props: { weather: null } });
		expect(screen.getByTestId('about-cta')).toBeTruthy();
	});

	it('CTA links to /contact', () => {
		render(AboutPage, { props: { weather: null } });
		const cta = screen.getByTestId('about-cta');
		const link = cta.querySelector('a[href="/contact"]');
		expect(link).toBeTruthy();
	});

	it('renders weather fallback when no data', () => {
		render(AboutPage, { props: { weather: null } });
		const weatherWidget = screen.getByTestId('about-weather');
		expect(weatherWidget.textContent).toContain('Montreal');
		expect(weatherWidget.textContent).toContain('—');
	});

	it('renders weather data when provided', () => {
		render(AboutPage, {
			props: { weather: { temp: 15, condition: 'clear sky', icon: '01d' } }
		});
		const weatherWidget = screen.getByTestId('about-weather');
		expect(weatherWidget.textContent).toContain('15°C');
		expect(weatherWidget.textContent).toContain('clear sky');
	});

	it('does not render its own footer (layout provides it)', () => {
		render(AboutPage, { props: { weather: null } });
		// Footer comes from +layout.svelte, not AboutPage
		const footers = screen.queryAllByTestId('footer');
		expect(footers.length).toBe(0);
	});
});

describe('Card Unification Sweep', () => {
	const srcDir = join(process.cwd(), 'src');

	function findSvelteFiles(dir: string): string[] {
		const files: string[] = [];
		for (const entry of readdirSync(dir, { withFileTypes: true })) {
			const fullPath = join(dir, entry.name);
			if (entry.isDirectory() && !entry.name.startsWith('.')) {
				files.push(...findSvelteFiles(fullPath));
			} else if (entry.name.endsWith('.svelte')) {
				files.push(fullPath);
			}
		}
		return files;
	}

	it('has zero .bento-card class usage in any .svelte file', () => {
		const svelteFiles = findSvelteFiles(srcDir);
		const violations: string[] = [];

		for (const file of svelteFiles) {
			const content = readFileSync(file, 'utf-8');
			if (content.includes('bento-card')) {
				violations.push(file.replace(process.cwd() + '/', ''));
			}
		}

		expect(violations, `Files still using .bento-card:\n${violations.join('\n')}`).toEqual([]);
	});

	it('has zero .bento-card in app.css', () => {
		const appCss = readFileSync(join(srcDir, 'app.css'), 'utf-8');
		expect(appCss).not.toContain('bento-card');
	});
});
