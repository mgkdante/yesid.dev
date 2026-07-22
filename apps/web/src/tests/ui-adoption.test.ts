import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const REPO_ROOT = resolve(process.cwd(), '../..');
const read = (path: string) => readFileSync(resolve(REPO_ROOT, path), 'utf8');
const exists = (path: string) => existsSync(resolve(REPO_ROOT, path));

describe('@yesid/ui customer contract', () => {
	it('installs the immutable release package and its governing parity notes', () => {
		const manifest = 'apps/web/vendor/design/ui/package.json';
		expect(exists(manifest), `${manifest} must be vendored`).toBe(true);
		if (!exists(manifest)) return;

		expect(JSON.parse(read(manifest)).name).toBe('@yesid/ui');
		expect(read('apps/web/vendor/design/ui/PARITY-NOTES.md')).toContain('## Adoption matrix');
		expect(read('apps/web/vendor/design/ui/PARITY-NOTES.md')).toContain('### Brand adoption matrix');
	});

	it('initializes one app-owned UI configuration in both SvelteKit module graphs', () => {
		const initializer = read('apps/web/src/lib/ui/configure.ts');
		const clientHooks = read('apps/web/src/hooks.client.ts');
		const serverHooks = read('apps/web/src/hooks.server.ts');
		const layout = read('apps/web/src/routes/+layout.svelte');

		expect(initializer).toContain("from '@yesid/ui/cn'");
		expect(initializer).toContain('configureUi()');
		expect(clientHooks).toContain('ClientInit');
		expect(clientHooks).toContain("from '$lib/ui/configure'");
		expect(clientHooks).toContain('initializeUi()');
		expect(serverHooks).toContain('ServerInit');
		expect(serverHooks).toContain("from '$lib/ui/configure'");
		expect(serverHooks).toContain('initializeUi()');
		expect(layout).not.toContain('configureUi');
	});

	it('wires Tailwind scanning, boot configuration, and the cn compatibility shim', () => {
		const siteCss = read('apps/web/src/lib/styles/site.css');
		const layout = read('apps/web/src/routes/+layout.svelte');
		const cn = read('apps/web/src/lib/utils/cn.ts');
		const viteConfig = read('apps/web/vite.config.ts');

		expect(siteCss).toContain("@import '../../app.css';");
		expect(siteCss).toContain('@source "../../../vendor/design/ui/src";');
		expect(layout).toContain("import '$lib/styles/site.css';");
		expect(cn).toContain("from '@yesid/ui/cn'");
		expect(cn).not.toContain("from './create-cn'");
		expect(exists('apps/web/src/lib/utils/create-cn.ts')).toBe(false);
		expect(viteConfig).toMatch(/dedupe:\s*\['bits-ui'\]/);
	});
});

describe('@yesid/ui primitive adoption contract', () => {
	it('centralizes yesid.dev full-width hazard bands in one product wrapper', () => {
		const wrapper = 'apps/web/src/lib/components/shared/HazardSeparator.svelte';
		expect(exists(wrapper), `${wrapper} must preserve the pre-release full-width contract`).toBe(
			true,
		);
		if (!exists(wrapper)) return;

		expect(read(wrapper)).toContain("from '@yesid/ui/separator'");
		expect(read(wrapper)).toContain('variant="hazard"');
		expect(read(wrapper)).toContain('maxWidth="none"');
		for (const path of [
			'apps/web/src/lib/components/about/AboutPage.svelte',
			'apps/web/src/lib/components/blog/BlogDetailPage.svelte',
			'apps/web/src/lib/components/blog/BlogListingPage.svelte',
			'apps/web/src/lib/components/brand/TerminalChrome.svelte',
			'apps/web/src/lib/components/home/HomePage.svelte',
			'apps/web/src/lib/components/projects/ProjectDetailPage.svelte',
			'apps/web/src/lib/components/projects/ProjectListingPage.svelte',
			'apps/web/src/lib/components/services/ProjectsStrip.svelte',
			'apps/web/src/lib/components/services/ServiceDetailPage.svelte',
			'apps/web/src/lib/components/shared/CtaBand.svelte',
			'apps/web/src/lib/components/shared/StationTabs.svelte',
			'apps/web/src/routes/+error.svelte',
			'apps/web/src/routes/[[lang=locale]]/tech-stack/+page.svelte',
		]) {
			expect(read(path), path).toContain(
				"from '$lib/components/shared/HazardSeparator.svelte'",
			);
			expect(read(path), path).not.toContain("from '@yesid/ui/separator'");
		}
	});

	it('routes parity-safe families through package subpaths', () => {
		expect(read('apps/web/src/lib/components/blog/BlogRow.svelte')).toContain(
			"from '@yesid/ui/badge'",
		);
		expect(read('apps/web/src/lib/components/shared/TableOfContents.svelte')).toContain(
			"from '@yesid/ui/scroll-area'",
		);
		expect(read('apps/web/src/lib/components/home/HomePage.svelte')).toContain(
			"from '$lib/components/shared/HazardSeparator.svelte'",
		);
		expect(read('apps/web/src/lib/components/shared/StationTabs.svelte')).toContain(
			"from '@yesid/ui/tabs'",
		);
		expect(read('apps/web/src/lib/components/shared/FilterGroup.svelte')).toContain(
			"from '@yesid/ui/toggle-group'",
		);

		for (const family of ['badge', 'scroll-area', 'separator', 'tabs', 'toggle', 'toggle-group']) {
			expect(exists(`apps/web/src/lib/components/ui/${family}`), family).toBe(false);
		}
	});

	it('adopts matching roots while retaining conflicting Collapsible Content and Resizable Handle', () => {
		const collapsible = read('apps/web/src/lib/components/shared/CollapsibleSection.svelte');
		const contact = read('apps/web/src/lib/components/contact/ContactPage.svelte');

		expect(collapsible).toContain("from '@yesid/ui/collapsible'");
		expect(collapsible).toContain(
			"CollapsibleContent from '$lib/components/ui/collapsible/collapsible-content.svelte'",
		);
		expect(contact).toContain("from '@yesid/ui/resizable'");
		expect(contact).toContain(
			"ResizableHandle from '$lib/components/ui/resizable/resizable-handle.svelte'",
		);
		expect(exists('apps/web/src/lib/components/ui/collapsible/collapsible.svelte')).toBe(false);
		expect(exists('apps/web/src/lib/components/ui/collapsible/collapsible-trigger.svelte')).toBe(false);
		expect(exists('apps/web/src/lib/components/ui/resizable/resizable-pane-group.svelte')).toBe(false);
	});

	it('pins consumer classes where package defaults differ', () => {
		const blogRow = read('apps/web/src/lib/components/blog/BlogRow.svelte');
		const projectCard = read('apps/web/src/lib/components/projects/ProjectCard.svelte');
		const collapsible = read('apps/web/src/lib/components/shared/CollapsibleSection.svelte');
		const stationTabs = read('apps/web/src/lib/components/shared/StationTabs.svelte');

		// xs is already byte-equivalent; number needs yesid.dev's literal 12px type.
		expect(blogRow).toContain('size="xs"');
		expect(projectCard).toContain('size="xs"');
		expect(collapsible).toContain('text-[0.75rem]');
		expect(stationTabs).toContain('h-8');
		expect(stationTabs).toContain('p-[3px]');
	});

	it('keeps hard-conflict components app-side with a parity-note pointer', () => {
		for (const path of [
			'apps/web/src/lib/components/ui/button/button.svelte',
			'apps/web/src/lib/components/ui/card/card.svelte',
			'apps/web/src/lib/components/ui/collapsible/collapsible-content.svelte',
			'apps/web/src/lib/components/ui/resizable/resizable-handle.svelte',
		]) {
			expect(exists(path), path).toBe(true);
			expect(read(path), path).toContain('vendor/design/ui/PARITY-NOTES.md');
		}
	});
});

describe('@yesid/ui brand adoption contract', () => {
	it('removes clean local copies and imports the package brand surface', () => {
		for (const path of [
			'apps/web/src/lib/components/brand/BlueprintShell.svelte',
			'apps/web/src/lib/components/brand/ChevronToggle.svelte',
			'apps/web/src/lib/components/brand/SectionLabel.svelte',
			'apps/web/src/lib/components/shared/TocBadge.svelte',
		]) {
			expect(exists(path), path).toBe(false);
		}

		expect(read('apps/web/src/lib/components/blog/BlogBlueprint.svelte')).toContain(
			"from '@yesid/ui/brand'",
		);
		expect(read('apps/web/src/lib/components/shared/TocNav.svelte')).toContain(
			"from '@yesid/ui/brand'",
		);
	});

	it('passes BlueprintShell text normalization parity at every call site', () => {
		for (const path of [
			'apps/web/src/lib/components/blog/BlogBlueprint.svelte',
			'apps/web/src/lib/components/projects/ProjectsBlueprint.svelte',
			'apps/web/src/lib/components/shared/CtaBlueprintBackground.svelte',
		]) {
			expect(read(path), path).toContain('normalizeTextFont={false}');
		}
	});

	it('keeps app-owned StopLabel and MetroStation parity adapters', () => {
		const stop = read('apps/web/src/lib/components/brand/StopLabel.svelte');
		const metro = read('apps/web/src/lib/components/brand/MetroStation.svelte');

		expect(stop).toContain("StopLabel as UiStopLabel");
		expect(stop).toContain('prefix={STOP_WORD[locale]}');
		expect(metro).toContain("MetroStation as UiMetroStation");
		expect(metro).toContain('{#snippet yesidRoundel(stationNo');
		expect(metro).toContain('roundel={yesidRoundel}');
	});

	it('keeps the exact StickyPanel and TerminalCursor compatibility wrappers', () => {
		const sticky = read('apps/web/src/lib/components/brand/StickyPanel.svelte');
		const cursor = read('apps/web/src/lib/components/shared/TerminalCursor.svelte');

		expect(sticky).toContain("StickyPanel as UiStickyPanel");
		expect(sticky).toContain('bind:ref={panel}');
		expect(sticky).toContain('background: var(--surface-3);');
		expect(sticky).toContain('box-shadow: none;');
		expect(cursor).toContain("TerminalCursor as UiTerminalCursor");
		expect(cursor).toContain('width: 8px;');
		expect(cursor).toContain('height: 14px;');
		expect(cursor).toContain('background: var(--accent);');
		expect(cursor).toContain('background: var(--accent-text);');
	});

	it('keeps quiet-mode product policy in a thin package adapter', () => {
		const quietMode = read('apps/web/src/lib/components/shared/QuietModeButton.svelte');

		expect(quietMode).toContain('QuietModeButton as UiQuietModeButton');
		expect(quietMode).toContain('type QuietModeButtonCopy');
		expect(quietMode).toContain("from '$lib/state/quiet-mode.svelte'");
		expect(quietMode).toContain('onMount(() => quietModeStore.init())');
		expect(quietMode).toContain('activeEffect="glow"');
		expect(quietMode).not.toContain('<svg');
		expect(quietMode).not.toContain('<style>');
	});
});
