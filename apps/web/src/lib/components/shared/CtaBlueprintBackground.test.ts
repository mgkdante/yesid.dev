import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import CtaBlueprintBackground from './CtaBlueprintBackground.svelte';

describe('CtaBlueprintBackground', () => {
	it('composes one decorative shell with one hero and twelve unique edge-distributed sheets', () => {
		const { container } = render(CtaBlueprintBackground);
		const background = screen.getByTestId('cta-blueprint-background');
		const sheets = [...container.querySelectorAll('[data-cta-sheet]')];

		expect(background).toHaveAttribute('aria-hidden', 'true');
		expect(container.querySelectorAll('.hero-svg')).toHaveLength(1);
		expect(sheets).toHaveLength(12);
		expect(new Set(sheets.map((sheet) => sheet.getAttribute('data-cta-sheet')))).toHaveProperty(
			'size',
			12,
		);
		for (const sheet of [
			'bridge',
			'catenary',
			'tunnel',
			'geology',
			'interface',
			'signal',
			'vent-shaft',
			'transit',
			'tbm',
			'pipeline',
			'station',
			'code',
		]) {
			expect(container.querySelector(`[data-cta-sheet="${sheet}"]`)).toBeInTheDocument();
		}
		for (const motif of [
			'twin-track',
			'website',
			'flow-connectors',
			'code-geometry',
		]) {
			expect(container.querySelector(`[data-motif="${motif}"]`)).toBeInTheDocument();
		}
		expect(background.querySelector('a, button, input, select, textarea, [tabindex]')).toBeNull();
	});

	it('reuses BlueprintShell without duplicating its furniture or readability tricks', () => {
		const source = readFileSync(
			resolve(process.cwd(), 'src/lib/components/shared/CtaBlueprintBackground.svelte'),
			'utf8',
		);

		expect(source).toContain("import { BlueprintShell } from '@yesid/ui/brand'");
		expect(source).toContain('normalizeTextFont={false}');
		expect(source).not.toMatch(/\.crosshair|\.ref-label|backdrop-filter|mask(?:-image)?|protected-center|content-shield/);
		expect(source).not.toMatch(/data-theme|theme-light/);
	});

	it('renders each source blueprint component exactly once', () => {
		const source = readFileSync(
			resolve(process.cwd(), 'src/lib/components/shared/CtaBlueprintBackground.svelte'),
			'utf8',
		);
		const components = [
			'BlueprintShell',
			'BlueprintAzurSide',
			'BlueprintBridge',
			'BlueprintCatenary',
			'BlueprintTunnelSection',
			'BlueprintGeology',
			'BlueprintInterfaceSuite',
			'BlueprintSignal',
			'BlueprintVentShaft',
			'BlueprintTransitRoute',
			'BlueprintTBM',
			'BlueprintDataPipeline',
			'BlueprintStationSection',
			'BlueprintCodeSystem',
		];

		for (const component of components) {
			expect(source.match(new RegExp(`<${component}\\b`, 'g')) ?? [], component).toHaveLength(1);
		}
	});
});
