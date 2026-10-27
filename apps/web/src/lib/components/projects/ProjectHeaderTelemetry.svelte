<script lang="ts">
	import type { Project } from '#lib/types.ts';
	import { resolveLocale } from '#lib/utils/locale.ts';
	import { getLocale } from '#lib/utils/locale-context.ts';
	import { getStackRole } from '#lib/utils/stack-roles.ts';
	import { projectMetrics } from '#lib/utils/project-metrics.ts';

	let { project }: { project: Project } = $props();

	const locale = getLocale();
	const TICKS = [0, 80, 160, 240, 320, 400, 480];
	const INK = 'text-primary opacity-[var(--article-deco-opacity)]';
	const EDGE = `${INK} absolute top-1/2 hidden -translate-y-1/2 font-mono text-[10px] uppercase leading-[2.4] tracking-[1.5px] lg:block`;

	const layerId = $derived(project.relatedServices[0] ?? project.slug);
	const stackRoles = $derived(
		project.stack.map((tech) => ({
			role: getStackRole(tech),
			name: tech.toLowerCase().replace(/\s+/g, '-'),
		})),
	);
	const metrics = $derived(projectMetrics(project));
</script>

<div class="absolute bottom-[55px] right-[45px] hidden lg:block">
	<svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="var(--primary)" stroke-width="0.8">
		<circle cx="22" cy="22" r="16" />
		<line x1="22" y1="0" x2="22" y2="44" />
		<line x1="0" y1="22" x2="44" y2="22" />
	</svg>
</div>

<div class="{INK} absolute left-1/2 top-[18px] hidden -translate-x-1/2 gap-7 font-mono text-micro lg:flex">
	{#each TICKS as tick (tick)}
		<span>{tick}</span>
	{/each}
</div>

<div class="{EDGE} left-7">
	<div>PRJ <span>{project.slug}</span></div>
	{#if project.location}<div>SRC {project.location}</div>{/if}
	{#if project.environment}<div>ENV {project.environment}</div>{/if}
	{#if project.version}<div>VER {project.version}</div>{/if}
	<div>STATUS <span>{project.status}</span></div>
	<div class="mt-2">───────</div>
	{#each metrics as metric, i (i)}
		<div>{metric.value} {resolveLocale(metric.label, locale)}</div>
	{/each}
</div>

<div class="{EDGE} right-7 text-right">
	<div>LAYER {layerId}</div>
	{#each stackRoles as item, i (i)}
		<div>{item.role} <span>{item.name}</span></div>
	{/each}
	<div class="mt-2">───────</div>
	<div>NODES {project.stack.length}</div>
</div>
