<!--
  BlueprintCTA (slice-29) — the engine's three exits, all real:
    cta-proof     → the project that proves the archetype ('I built this')
    cta-service   → the service that delivers it ('Hire this')
    cta-blueprint → /contact?bp=… prefilled handoff ('Send me this blueprint')
  Goal mode encodes the archetype's full stack (layer order); compose mode
  encodes the visitor's picked ids instead.
-->
<script lang="ts">
	import type { StackArchetype } from '@repo/shared/schemas';
	import { encodeBlueprint } from '$lib/utils/blueprint-param';

	let {
		archetype,
		composeTechs = null,
	}: {
		archetype: StackArchetype;
		/** Compose mode: the picked tech ids — replaces the archetype stack in the bp param. */
		composeTechs?: string[] | null;
	} = $props();

	const blueprintHref = $derived(
		'/contact?bp=' +
			encodeBlueprint({
				archetype: archetype.slug,
				// archetype.tech is already in layer order (emitter contract).
				techs: composeTechs ?? archetype.tech.map((l) => l.id),
			}),
	);
</script>

<div class="blueprint-cta" data-testid="blueprint-cta">
	<a class="cta-link cta-primary" data-testid="cta-blueprint" href={blueprintHref}>
		Send me this blueprint →
	</a>
	<a class="cta-link" data-testid="cta-proof" href={`/projects/${archetype.proofProjectSlug}`}>
		I built this
	</a>
	<a class="cta-link" data-testid="cta-service" href={`/services/${archetype.serviceId}`}>
		Hire this
	</a>
</div>

<style>
	.blueprint-cta {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
		padding-top: 1.5rem;
	}

	.cta-link {
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--secondary-foreground);
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.cta-link:hover {
		color: var(--primary);
	}

	.cta-primary {
		color: var(--primary-foreground);
		background: var(--primary);
		text-decoration: none;
		border-radius: 999px;
		padding: 0.5rem 1.1rem;
	}

	.cta-primary:hover {
		color: var(--primary-foreground);
		filter: brightness(1.08);
	}
</style>
