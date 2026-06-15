<!--
  ServiceClosingAsk — closing call-to-action for the Services route.
  Shared by the listing (foot of the page) and each detail page (before
  prev/next). The page asked for nothing before this; here it names the next
  step and points at /contact. Authored mobile-first (base = mobile, the
  min-width block enhances for desktop).
-->
<script lang="ts">
	import { resolveLocale } from '$lib/utils/locale';
	import { getLocale } from '$lib/utils/locale-context';
	import { localizeHref } from '$lib/utils/locale-routing';
	import { servicesListingContent } from '$lib/content/services';
	import { pressBounce } from '$lib/motion/actions/pressBounce.js';

	const locale = getLocale();
	const ask = servicesListingContent.closingAsk;

	const heading = resolveLocale(ask.heading, locale);
	const body = resolveLocale(ask.body, locale);
	const cta = resolveLocale(ask.cta, locale);
</script>

<section class="closing-ask" data-testid="service-closing-ask">
	<h2 class="closing-ask-heading">{heading}</h2>
	<p class="closing-ask-body">{body}</p>
	<a
		href={localizeHref('/contact', locale)}
		class="closing-ask-cta tap-press"
		data-testid="service-closing-ask-cta"
		use:pressBounce
	>
		{cta}
	</a>
</section>

<style>
	/* Mobile-first base. */
	.closing-ask {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 1rem;
		padding: 2.5rem var(--space-page-x);
	}

	.closing-ask-heading {
		font-family: var(--font-heading);
		font-size: clamp(28px, 8vw, 36px);
		font-weight: 900;
		line-height: 1.1;
		letter-spacing: -0.02em;
		color: var(--foreground);
	}

	.closing-ask-body {
		font-size: var(--text-body);
		line-height: 1.6;
		color: var(--secondary-foreground);
		max-width: 48ch;
	}

	.closing-ask-cta {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		font-family: var(--font-mono);
		font-size: var(--text-body);
		font-weight: 700;
		color: var(--background);
		background: var(--primary);
		padding: 0.875rem 2rem;
		border-radius: var(--radius-pill);
		text-decoration: none;
		letter-spacing: 0.5px;
		transition: transform var(--duration-fast), box-shadow var(--duration-fast);
	}
	.closing-ask-cta:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 20px color-mix(in srgb, var(--primary) 40%, transparent);
	}

	/* Desktop enhancement. */
	@media (min-width: 768px) {
		.closing-ask {
			gap: 1.25rem;
			padding-block: 4rem;
		}
		.closing-ask-heading {
			font-size: clamp(40px, 4.5vw, 56px);
		}
		.closing-ask-body {
			font-size: var(--text-subheading);
		}
	}
</style>
