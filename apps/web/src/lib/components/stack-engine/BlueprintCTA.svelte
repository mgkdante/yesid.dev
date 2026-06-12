<!--
  BlueprintCTA (slice-29, go2/w5 taste round 2) — the engine's two exits,
  both real, both whispering (teacher voice, never a hard sell):
    cta-blueprint → /contact?bp=… handoff ('Take this blueprint with you →')
    cta-service   → hire the service behind it ('Hire this — …', homey voice)
  plus the whisper line under the row. Goal mode encodes the archetype's full
  stack (layer order); compose mode encodes the visitor's picked ids instead.

  Taste round 2 (operator verdict): proof-project links are GONE from the
  engine — proofProjectSlug stays in schema/content for other surfaces, the
  engine just never renders it.
-->
<script lang="ts">
	import type { StackArchetype } from '@repo/shared/schemas';
	import { encodeBlueprint } from '$lib/utils/blueprint-param';
	import { localizeHref } from '$lib/utils/locale-routing';
	import { getLocale } from '$lib/utils/locale-context';

	const locale = getLocale();

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
	<div class="cta-row">
		<a class="cta-link cta-primary" data-testid="cta-blueprint" href={blueprintHref}>
			Take this blueprint with you →
		</a>
		{#if archetype.serviceId}
			<a class="cta-link" data-testid="cta-service" href={localizeHref(`/services/${archetype.serviceId}`, locale)}>
				Hire this — see the service behind it
			</a>
		{/if}
	</div>
	<!-- go2/w5 tone pass: the whisper — warm, zero pressure. -->
	<p class="cta-whisper">if you ever want help building it, I'm around.</p>
</div>

<style>
	.blueprint-cta {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding-top: 1.5rem;
	}

	.cta-row {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.cta-whisper {
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--engine-teach-ink, var(--secondary-foreground));
		margin: 0;
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
