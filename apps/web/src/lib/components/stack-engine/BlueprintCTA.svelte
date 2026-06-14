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

  Yellow-conversion rule (go2/w5 operator doctrine): yellow buttons mean
  "talk to Yesid" ONLY; orange covers every other interaction. The blueprint
  handoff IS the conversation starter, so cta-blueprint wears the signage
  pairing (--accent under fixed near-black ink); the service link stays in
  the orange grammar (exploration, not conversation).
-->
<script lang="ts">
	import type { StackArchetype } from '@repo/shared/schemas';
	import { encodeBlueprint } from '$lib/utils/blueprint-param';
	import { localizeHref } from '$lib/utils/locale-routing';
	import { resolveLocale } from '$lib/utils/locale';
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

	// The two exits + the whisper — code-owned, localized, em-dash-free.
	const TAKE_BLUEPRINT = { en: 'Take this blueprint with you →', fr: 'Apporte ce plan avec toi →' };
	const HIRE_THIS = {
		en: 'Hire this, see the service behind it',
		fr: 'Engage ça, vois le service en arrière',
	};
	const WHISPER = {
		en: "if you ever want help building it, I'm around.",
		fr: 'si jamais tu veux un coup de main pour le bâtir, je suis là.',
	};
	const takeBlueprint = $derived(resolveLocale(TAKE_BLUEPRINT, locale));
	const hireThis = $derived(resolveLocale(HIRE_THIS, locale));
	const whisper = $derived(resolveLocale(WHISPER, locale));
</script>

<div class="blueprint-cta" data-testid="blueprint-cta">
	<div class="cta-row">
		<a class="cta-link cta-primary" data-testid="cta-blueprint" href={blueprintHref}>
			{takeBlueprint}
		</a>
		{#if archetype.serviceId}
			<a class="cta-link" data-testid="cta-service" href={localizeHref(`/services/${archetype.serviceId}`, locale)}>
				{hireThis}
			</a>
		{/if}
	</div>
	<!-- go2/w5 tone pass: the whisper — warm, zero pressure. -->
	<p class="cta-whisper">{whisper}</p>
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

	/* go2/w5 legibility pass: CTA labels step up one full rung (tokens only). */
	.cta-whisper {
		font-family: var(--font-mono);
		font-size: var(--text-mono);
		color: var(--engine-teach-ink, var(--secondary-foreground));
		margin: 0;
	}

	.cta-link {
		font-family: var(--font-mono);
		font-size: var(--text-small);
		color: var(--secondary-foreground);
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.cta-link:hover {
		color: var(--primary);
	}

	/* Yellow-conversion rule: the signage pairing. --accent (#FFB627) and the
	   near-black ink are theme-constant — #1C1814 on #FFB627 ≈ 10:1 (AA in
	   BOTH themes). Hover steps down the accent system's own darker yellow
	   (--accent-hover #E5A220, ≈ 8:1 against the same ink) — never orange. */
	.cta-primary {
		color: #1C1814;
		background: var(--accent);
		text-decoration: none;
		border-radius: 999px;
		padding: 0.5rem 1.1rem;
	}

	.cta-primary:hover {
		color: #1C1814;
		background: var(--accent-hover);
	}
</style>
