# Lean High-Intent Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two narrow, property-free high-intent events to yesid.dev, reconcile the trilingual disclosure and CMS truth, and close the Plausible rollout with real production receipts.

**Architecture:** Keep Plausible's existing consent-gated browser client and built-in page analytics unchanged. Add typed semantic calls at the CMS contact-channel and shared project-proof components, classify only explicitly eligible absolute links, and send the sanitized current page URL without properties. Replace the broad historical OPS2 CMS promoter with a live, narrow reconciler for the three consent descriptions and six Privacy/Cookies bodies, then promote only after the Vercel commercial-plan gate.

**Tech Stack:** Bun 1.3.x, TypeScript 5.9, Svelte 5, SvelteKit 2, Vitest 4, Testing Library, Playwright 1.58, Directus 12 REST API, Plausible Analytics Cloud, 1Password CLI, GitHub Actions, Vercel.

## Global Constraints

- Scope is yesid.dev only. Do not touch Transit code, content, repositories, release state, case-study truth, or implementation.
- Preserve the live contact transport: browser to Web3Forms to Proton. Do not add Resend or a Vercel contact endpoint.
- The exact custom-event names are `contact_form_success`, `booking_click`, `direct_contact_click`, and `project_proof_click`.
- Keep `autoCapturePageviews: false`, `outboundLinks: false`, `fileDownloads: false`, and `formSubmissions: false`.
- Send no custom properties, destinations, labels, channel names, project names, form data, personal information, search state, hover data, replay data, or manual scroll milestones.
- Keep current URL sanitation: pathname plus only `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `ref`, and `source`.
- `direct_contact_click` accepts `mailto:` links whose payload contains `@`, `tel:` links whose payload contains at least one digit, and exact HTTPS `wa.me` links only. Adding another WhatsApp host requires an explicit test and operator approval.
- `project_proof_click` accepts absolute HTTP/HTTPS project live or public-repository links without URL credentials. The private-repository state remains a non-link.
- Analytics must fail open. It must never prevent, await, retry, or delay navigation or contact actions.
- Public analytics copy is EN/FR/ES and must remain materially equivalent. No CMS write occurs until the operator approves the exact copy in Task 6.
- Use the existing `OP_TOKEN` from `/home/mgkdante/Yesito/projects/yesid.dev/.env` as `OP_SERVICE_ACCOUNT_TOKEN`. Never print or persist the token.
- Run every CMS command in dry-run/read mode before a write. A dry-run must read live state; an offline printout is not reconciliation evidence.
- Do not hand-edit `apps/web/src/lib/content/site-labels.ts`, `apps/web/src/lib/content/legal-pages.ts`, or `apps/web/src/lib/content/generated.manifest.json`; regenerate them from live CMS state.
- No branch push, PR, preview deployment, CMS write, merge, or production deployment while Vercel remains Hobby. Local tests, local commits, read-only API checks, and Plausible goal cleanup are allowed.
- The four Plausible goals must exist before generating production event receipts because Plausible does not backfill earlier events.
- Controlled production QA uses `utm_source=codex_ops2_qa`; record its UTC window and exclude it from the clean baseline.
- Custom events change Plausible's engaged/bounce classification. Record the rollout date before comparing bounce rates across the change.
- Slice 35 closes from the two existing conversion receipts independently of slice 38. Do not hold OPS2 open for the later two events.
- Use TDD for every code or content-contract change and verification-before-completion before any success claim.

## File Structure

### Create

- `apps/web/src/lib/utils/high-intent-links.ts` — pure absolute-link eligibility rules.
- `apps/web/src/lib/utils/high-intent-links.test.ts` — accepted and rejected direct-contact/project-proof URLs.
- `apps/web/src/lib/components/projects/ProjectLinksCard.test.ts` — semantic event coverage for live, public repository, private repository, malformed, and empty states.
- `apps/cms/scripts/promote-lean-high-intent-analytics.ts` — live DEV/PROD reader, narrow nine-row planner, guarded writer, and post-write verifier.
- `apps/cms/tests/promote-lean-high-intent-analytics.test.ts` — CLI safety, exact scope, drift refusal, convergence, and narrow-write tests.
- `apps/cms/tests/lean-high-intent-copy.test.ts` — exact EN/FR/ES consent and legal-copy contract.

### Modify

- `apps/web/src/lib/utils/analytics.ts` — widen only the typed event allowlist.
- `apps/web/src/lib/utils/analytics.test.ts` — exact four-event, property-free, consent, and sanitation assertions.
- `apps/web/src/lib/components/contact/ContactPage.svelte` — classify and track direct-contact channel clicks.
- `apps/web/src/lib/components/contact/ContactPage.test.ts` — eligible/ineligible channel and unchanged booking tests.
- `apps/web/src/lib/components/projects/ProjectLinksCard.svelte` — classify and track live/public-repository clicks.
- `apps/web/tests/analytics.spec.ts` — real tracker payloads and consent-state browser coverage.
- `apps/web/tests/page-content/legal.spec.ts` — live rendered four-interaction and no-properties disclosure checks.
- `apps/cms/fixtures/content/site-labels.json` — EN consent description.
- `apps/cms/fixtures/content/site-labels.fr.json` — FR consent description.
- `apps/cms/fixtures/content/site-labels.es.json` — ES consent description.
- `apps/cms/ops/legal/legal-pages-2026-07-09.json` — Privacy/Cookies EN/FR/ES analytics paragraphs and revision dates.

### Delete after the replacement reconciler is green

- `apps/cms/scripts/promote-ops2-analytics-prod.ts` — broad, PROD-only historical writer.
- `apps/cms/tests/promote-ops2-analytics-prod.test.ts` — superseded shallow test.

### Generated later from live CMS, never hand-edited

- `apps/web/src/lib/content/site-labels.ts`
- `apps/web/src/lib/content/legal-pages.ts`
- `apps/web/src/lib/content/generated.manifest.json`

### Intentionally unchanged

- `apps/web/src/lib/analytics/client.ts` — the widened union flows through its existing `trackAnalyticsEvent(name)` facade.
- `apps/web/src/lib/components/home/HeroTextContent.svelte` — existing homepage `booking_click` remains unchanged.
- Analytics consent state/store/components — existing unknown, decline, grant, reopen, and withdrawal lifecycle remains authoritative.

---

### Task 1: Expand the typed event contract without changing the tracker

**Files:**

- Modify: `apps/web/src/lib/utils/analytics.test.ts`
- Modify: `apps/web/src/lib/utils/analytics.ts`

**Interfaces:**

- Consumes: existing `createAnalyticsClient`, `sanitizeAnalyticsUrl`, and property-free `tracker.track(name, { url })` behavior.
- Produces: `AnalyticsEventName = 'contact_form_success' | 'booking_click' | 'direct_contact_click' | 'project_proof_click'`.
- Preserves: `trackPageview(url: URL): Promise<void>` and `trackEvent(name: AnalyticsEventName, url: URL): Promise<void>`.

- [ ] **Step 1: Install the worktree dependencies without changing the lockfile**

Run from the slice-38 worktree root:

```bash
bun install --frozen-lockfile
```

Expected: exit 0, `bun.lock` unchanged, and `apps/web/node_modules/.bin/vitest` resolves through the workspace install. The pre-plan baseline failed with `vitest: command not found`; do not treat that dependency failure as a product-test result.

- [ ] **Step 2: Write the failing exact-event and consent tests**

Add this test inside `describe('createAnalyticsClient', ...)`:

```ts
it('exposes exactly the four approved custom event names', () => {
	expect(ANALYTICS_EVENTS).toEqual([
		'contact_form_success',
		'booking_click',
		'direct_contact_click',
		'project_proof_click',
	]);
});
```

Rename the existing payload test to `sends sanitized pageviews and the four typed custom events without properties` and replace its expected calls with:

```ts
expect(track.mock.calls).toEqual([
	[
		'pageview',
		{ url: 'https://yesid.dev/fr/work/transit?utm_source=portfolio' },
	],
	['contact_form_success', { url: 'https://yesid.dev/contact?ref=calendar' }],
	['booking_click', { url: 'https://yesid.dev/contact?ref=calendar' }],
	['direct_contact_click', { url: 'https://yesid.dev/contact?ref=calendar' }],
	['project_proof_click', { url: 'https://yesid.dev/contact?ref=calendar' }],
]);

for (const [, options] of track.mock.calls) {
	expect(options).toEqual({ url: expect.any(String) });
	expect(options).not.toHaveProperty('props');
}
```

Add this withdrawal regression:

```ts
it('blocks the new events before consent and after withdrawal', async () => {
	let consent = false;
	const { client, loadTracker, module } = createClient({
		canTrack: () => consent,
	});
	const url = new URL(
		'https://yesid.dev/projects/yesid-dev?token=private&utm_source=portfolio',
	);

	await client.trackEvent('direct_contact_click', url);
	expect(loadTracker).not.toHaveBeenCalled();

	consent = true;
	await client.trackEvent('direct_contact_click', url);
	expect(module.track).toHaveBeenCalledWith('direct_contact_click', {
		url: 'https://yesid.dev/projects/yesid-dev?utm_source=portfolio',
	});

	consent = false;
	await client.trackEvent('project_proof_click', url);
	expect(module.track).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 3: Run the focused test and verify RED**

Run:

```bash
bun run --cwd apps/web test -- src/lib/utils/analytics.test.ts
```

Expected: FAIL because `ANALYTICS_EVENTS` still contains only `contact_form_success` and `booking_click`, and the payload list is missing the two new calls.

- [ ] **Step 4: Make the minimal event-list change**

Replace the tuple at the top of `analytics.ts` with:

```ts
export const ANALYTICS_EVENTS = [
	'contact_form_success',
	'booking_click',
	'direct_contact_click',
	'project_proof_click',
] as const;
export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];
```

Do not alter `PLAUSIBLE_CONFIG`, `ACQUISITION_KEYS`, `send`, or `client.ts`.

- [ ] **Step 5: Run the focused test and verify GREEN**

Run:

```bash
bun run --cwd apps/web test -- src/lib/utils/analytics.test.ts
```

Expected: the analytics unit file passes; every event call has exactly `{ url: string }` and no `props`.

- [ ] **Step 6: Commit the typed contract**

```bash
git add apps/web/src/lib/utils/analytics.ts apps/web/src/lib/utils/analytics.test.ts
git commit -m "feat(analytics): type lean high-intent events"
```

### Task 2: Classify eligible links at a pure boundary

**Files:**

- Create: `apps/web/src/lib/utils/high-intent-links.test.ts`
- Create: `apps/web/src/lib/utils/high-intent-links.ts`

**Interfaces:**

- Produces: `isDirectContactHref(href: string): boolean`.
- Produces: `isProjectProofHref(href: string): boolean`.
- Consumed by: Tasks 3 and 4 only; neither function returns or forwards a URL.
- Direct-contact eligibility requires a `mailto:` payload containing `@`, a `tel:` payload containing at least one digit, or an exact HTTPS `wa.me` link with a non-root path.

- [ ] **Step 1: Write the failing URL-classification tests**

Create `high-intent-links.test.ts` with:

```ts
import { describe, expect, it } from 'vitest';
import { isDirectContactHref, isProjectProofHref } from './high-intent-links';

describe('isDirectContactHref', () => {
	it.each([
		'mailto:contact@yesid.dev',
		'tel:+18194465594',
		'https://wa.me/18194465594',
	])('accepts the approved direct-contact URL %s', (href) => {
		expect(isDirectContactHref(href)).toBe(true);
	});

	it.each([
		'',
		'not a url',
		'mailto:',
		'mailto:contact',
		'tel:',
		'tel:+',
		'https://wa.me/',
		'http://wa.me/18194465594',
		'https://wa.me:8443/18194465594',
		'https://wa.me.evil.example/18194465594',
		'https://github.com/mgkdante',
		'https://www.linkedin.com/in/otaloray/',
		'https://cal.com/yesid-dev',
		'https://example.com/contact',
	])('rejects the ineligible direct-contact URL %s', (href) => {
		expect(isDirectContactHref(href)).toBe(false);
	});
});

describe('isProjectProofHref', () => {
	it.each([
		'https://yesid.dev',
		'https://github.com/mgkdante/yesid.dev',
		'http://localhost:4173/demo',
	])('accepts the absolute web proof URL %s', (href) => {
		expect(isProjectProofHref(href)).toBe(true);
	});

	it.each([
		'',
		'not a url',
		'/projects/yesid-dev',
		'mailto:contact@yesid.dev',
		'tel:+18194465594',
		'javascript:alert(1)',
		'https://user:password@example.com/private',
	])('rejects the ineligible project-proof URL %s', (href) => {
		expect(isProjectProofHref(href)).toBe(false);
	});
});
```

- [ ] **Step 2: Run the focused test and verify RED**

```bash
bun run --cwd apps/web test -- src/lib/utils/high-intent-links.test.ts
```

Expected: FAIL because `./high-intent-links` does not exist.

- [ ] **Step 3: Implement the minimal pure classifier**

Create `high-intent-links.ts` with:

```ts
const APPROVED_WHATSAPP_HOSTS = new Set(['wa.me']);

function parseAbsoluteUrl(href: string): URL | null {
	const value = href.trim();
	if (!value) return null;

	try {
		return new URL(value);
	} catch {
		return null;
	}
}

export function isDirectContactHref(href: string): boolean {
	const url = parseAbsoluteUrl(href);
	if (!url) return false;

	if (url.protocol === 'mailto:') {
		return url.pathname.includes('@');
	}

	if (url.protocol === 'tel:') {
		return /\d/.test(url.pathname);
	}

	return (
		url.protocol === 'https:' &&
		url.port === '' &&
		APPROVED_WHATSAPP_HOSTS.has(url.hostname) &&
		url.pathname !== '/'
	);
}

export function isProjectProofHref(href: string): boolean {
	const url = parseAbsoluteUrl(href);
	if (!url || url.username || url.password) return false;

	return (
		(url.protocol === 'https:' || url.protocol === 'http:') &&
		url.hostname.length > 0
	);
}
```

- [ ] **Step 4: Run the classifier tests and verify GREEN**

```bash
bun run --cwd apps/web test -- src/lib/utils/high-intent-links.test.ts
```

Expected: every accept/reject row passes.

- [ ] **Step 5: Commit the pure boundary**

```bash
git add apps/web/src/lib/utils/high-intent-links.ts apps/web/src/lib/utils/high-intent-links.test.ts
git commit -m "feat(analytics): classify high-intent links"
```

### Task 3: Track direct-contact clicks from the CMS channel list

**Files:**

- Modify: `apps/web/src/lib/components/contact/ContactPage.test.ts`
- Modify: `apps/web/src/lib/components/contact/ContactPage.svelte`

**Interfaces:**

- Consumes: `isDirectContactHref(href: string): boolean` from Task 2.
- Consumes: `trackAnalyticsEvent(name: AnalyticsEventName): void` from the unchanged browser facade.
- Produces: one `direct_contact_click` per eligible user click, or the existing one `booking_click` for the calendar channel.

- [ ] **Step 1: Replace the stale non-calendar test and add failing eligible/ineligible cases**

Keep the existing calendar and booking-escape-hatch tests. Replace `does not track booking for non-calendar social links` with these tests:

```ts
it.each([
	['email', 'mailto:contact@yesid.dev'],
	['phone', 'tel:+18194465594'],
	['whatsapp', 'https://wa.me/18194465594'],
])('tracks one direct contact event for %s', async (icon, href) => {
	const content = {
		...contactContent,
		socials: [{ label: { en: icon }, href, icon }],
	} as typeof contactContent;

	render(ContactPage, { props: { contactPage: content } });
	await clickWithoutNavigating(
		screen.getAllByTestId(`contact-social-${icon}`)[0],
	);

	expect(analyticsMocks.trackAnalyticsEvent).toHaveBeenCalledTimes(1);
	expect(analyticsMocks.trackAnalyticsEvent).toHaveBeenCalledWith(
		'direct_contact_click',
	);
});

it.each([
	['github', 'https://github.com/mgkdante'],
	['linkedin', 'https://www.linkedin.com/in/otaloray/'],
	['cal-link-without-calendar-icon', 'https://cal.com/yesid-dev'],
	['ordinary-https', 'https://example.com/contact'],
	['insecure-whatsapp', 'http://wa.me/18194465594'],
	['spoofed-whatsapp', 'https://wa.me.evil.example/18194465594'],
	['malformed', 'not a url'],
])('does not track the ineligible channel %s', async (icon, href) => {
	const content = {
		...contactContent,
		socials: [{ label: { en: icon }, href, icon }],
	} as typeof contactContent;

	render(ContactPage, { props: { contactPage: content } });
	await clickWithoutNavigating(
		screen.getAllByTestId(`contact-social-${icon}`)[0],
	);

	expect(analyticsMocks.trackAnalyticsEvent).not.toHaveBeenCalled();
});

it('keeps calendar separate from direct contact', async () => {
	render(ContactPage, { props: { contactPage: contactContent } });
	await clickWithoutNavigating(
		screen.getAllByTestId('contact-social-calendar')[0],
	);

	expect(analyticsMocks.trackAnalyticsEvent.mock.calls).toEqual([
		['booking_click'],
	]);
});
```

- [ ] **Step 2: Run the component test and verify RED**

```bash
bun run --cwd apps/web test -- src/lib/components/contact/ContactPage.test.ts
```

Expected: the email, phone, and WhatsApp cases fail because the component currently tracks only the calendar icon.

- [ ] **Step 3: Add the direct-contact handler without changing navigation**

Add this import:

```ts
import { isDirectContactHref } from '$lib/utils/high-intent-links';
```

Add this function beside the existing `handleBookingClick`:

```ts
function handleContactChannelClick(
	social: ContactContent['socials'][number],
): void {
	if (social.icon === 'calendar') {
		handleBookingClick();
		return;
	}

	if (isDirectContactHref(social.href)) {
		trackAnalyticsEvent('direct_contact_click');
	}
}
```

Replace only the CMS channel anchor handler:

```svelte
onclick={() => handleContactChannelClick(social)}
```

Do not change `href`, `target`, `rel`, the Web3Forms submit flow, or the form booking escape hatch.

- [ ] **Step 4: Run contact and classifier tests and verify GREEN**

```bash
bun run --cwd apps/web test -- \
  src/lib/utils/high-intent-links.test.ts \
  src/lib/components/contact/ContactPage.test.ts
```

Expected: eligible links send one direct event, ineligible links send none, and both existing booking surfaces still send one booking event.

- [ ] **Step 5: Commit the contact call site**

```bash
git add apps/web/src/lib/components/contact/ContactPage.svelte apps/web/src/lib/components/contact/ContactPage.test.ts
git commit -m "feat(analytics): track direct contact intent"
```

### Task 4: Track public project-proof clicks at the shared card

**Files:**

- Create: `apps/web/src/lib/components/projects/ProjectLinksCard.test.ts`
- Modify: `apps/web/src/lib/components/projects/ProjectLinksCard.svelte`

**Interfaces:**

- Consumes: `isProjectProofHref(href: string): boolean` from Task 2.
- Produces: one `project_proof_click` for a valid rendered `liveUrl` or public `repoUrl` click.
- Preserves: `repoPrivate: true` wins over a populated `repoUrl` and remains a non-link.

- [ ] **Step 1: Write the failing component tests**

Create `ProjectLinksCard.test.ts` with:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { projectFactory } from '../../../tests/factories';

const analyticsMocks = vi.hoisted(() => ({
	trackAnalyticsEvent: vi.fn(),
}));

vi.mock('$lib/analytics/client', () => analyticsMocks);

import ProjectLinksCard from './ProjectLinksCard.svelte';

beforeEach(() => {
	analyticsMocks.trackAnalyticsEvent.mockClear();
});

async function clickWithoutNavigating(link: Element): Promise<void> {
	const preventNavigation = (event: Event) => event.preventDefault();
	link.addEventListener('click', preventNavigation);
	try {
		await fireEvent.click(link);
	} finally {
		link.removeEventListener('click', preventNavigation);
	}
}

describe('ProjectLinksCard high-intent analytics', () => {
	it('tracks one project proof event for the live-site link', async () => {
		const project = projectFactory.build({
			liveUrl: 'https://example.com/demo',
		});
		const { container } = render(ProjectLinksCard, {
			props: { project, sectionKey: 'test-links' },
		});
		const link = container.querySelector(
			'a[href="https://example.com/demo"]',
		);
		expect(link).not.toBeNull();

		await clickWithoutNavigating(link!);

		expect(analyticsMocks.trackAnalyticsEvent.mock.calls).toEqual([
			['project_proof_click'],
		]);
	});

	it('tracks one project proof event for a public repository link', async () => {
		const project = projectFactory.build({
			repoUrl: 'https://github.com/mgkdante/public-project',
			repoPrivate: false,
		});
		const { container } = render(ProjectLinksCard, {
			props: { project, sectionKey: 'test-links' },
		});
		const link = container.querySelector(
			'a[href="https://github.com/mgkdante/public-project"]',
		);
		expect(link).not.toBeNull();

		await clickWithoutNavigating(link!);

		expect(analyticsMocks.trackAnalyticsEvent.mock.calls).toEqual([
			['project_proof_click'],
		]);
	});

	it('keeps a private repository non-clickable and untracked', async () => {
		const project = projectFactory.build({
			repoUrl: 'https://github.com/mgkdante/private-project',
			repoPrivate: true,
		});
		const { container } = render(ProjectLinksCard, {
			props: { project, sectionKey: 'test-links' },
		});

		expect(
			container.querySelector(
				'a[href="https://github.com/mgkdante/private-project"]',
			),
		).toBeNull();
		await fireEvent.click(screen.getByTestId('project-repo-private'));
		expect(analyticsMocks.trackAnalyticsEvent).not.toHaveBeenCalled();
	});

	it.each(['not a url', 'mailto:contact@yesid.dev'])(
		'does not track an invalid rendered proof URL %s',
		async (liveUrl) => {
			const project = projectFactory.build({ liveUrl });
			const { container } = render(ProjectLinksCard, {
				props: { project, sectionKey: 'test-links' },
			});
			const link = container.querySelector(`a[href="${liveUrl}"]`);
			expect(link).not.toBeNull();

			await clickWithoutNavigating(link!);
			expect(analyticsMocks.trackAnalyticsEvent).not.toHaveBeenCalled();
		},
	);

	it('renders no links card when the project has no proof links', () => {
		const project = projectFactory.build({
			liveUrl: undefined,
			repoUrl: undefined,
			repoPrivate: false,
		});
		render(ProjectLinksCard, {
			props: { project, sectionKey: 'test-links' },
		});

		expect(screen.queryByTestId('project-links-card')).toBeNull();
		expect(analyticsMocks.trackAnalyticsEvent).not.toHaveBeenCalled();
	});
});
```

- [ ] **Step 2: Run the new component test and verify RED**

```bash
bun run --cwd apps/web test -- src/lib/components/projects/ProjectLinksCard.test.ts
```

Expected: the valid live and repository cases fail because no analytics handler exists.

- [ ] **Step 3: Instrument only valid rendered proof links**

Add these imports and handler in `ProjectLinksCard.svelte`:

```ts
import { trackAnalyticsEvent } from '$lib/analytics/client';
import { isProjectProofHref } from '$lib/utils/high-intent-links';

function handleProjectProofClick(href: string | undefined): void {
	if (href && isProjectProofHref(href)) {
		trackAnalyticsEvent('project_proof_click');
	}
}
```

Add this handler to the `liveUrl` anchor:

```svelte
onclick={() => handleProjectProofClick(project.liveUrl)}
```

Add this handler to the public `repoUrl` anchor:

```svelte
onclick={() => handleProjectProofClick(project.repoUrl)}
```

Do not add a handler to `project-repo-private`.

- [ ] **Step 4: Run the project and classifier tests and verify GREEN**

```bash
bun run --cwd apps/web test -- \
  src/lib/utils/high-intent-links.test.ts \
  src/lib/components/projects/ProjectLinksCard.test.ts \
  src/lib/components/projects/ProjectDetailPage.image.test.ts
```

Expected: all files pass; a public live/repository click sends exactly one event, a malformed URL sends none, and private repository behavior is unchanged.

- [ ] **Step 5: Commit the project-proof call site**

```bash
git add apps/web/src/lib/components/projects/ProjectLinksCard.svelte apps/web/src/lib/components/projects/ProjectLinksCard.test.ts
git commit -m "feat(analytics): track project proof intent"
```

### Task 5: Prove real tracker payloads and consent transitions in a browser

**Files:**

- Modify: `apps/web/tests/analytics.spec.ts`

**Interfaces:**

- Consumes: the real `@plausible-analytics/tracker/plausible.js` package through the production-host proxy.
- Produces: intercepted POST evidence for one property-free event per eligible click.
- Preserves: existing pageview, hostname, lazy import, unknown-consent, and provider-failure tests.

- [ ] **Step 1: Add the event and click helpers**

Extend the Playwright type import to include `Locator`:

```ts
import { expect, test, type Locator, type Page } from '@playwright/test';
```

Add these helpers below `nonSentinel`:

```ts
function eventsNamed(payloads: Payload[], name: string): Payload[] {
	return nonSentinel(payloads).filter((payload) => payload.n === name);
}

async function clickWithoutNavigation(link: Locator): Promise<void> {
	await link.evaluate((element) => {
		element.addEventListener(
			'click',
			(event) => event.preventDefault(),
			{ capture: true, once: true },
		);
		(element as HTMLElement).click();
	});
}
```

- [ ] **Step 2: Write the failing direct-contact payload test**

Add:

```ts
test('direct contact click sends one property-free event with the sanitized current page', async ({
	page,
}) => {
	await grantBeforeLoad(page);
	await proxyProductionHostnameToPreview(page);
	const payloads = await capturePlausible(page);

	await page.goto(
		`${LOCAL_PRODUCTION_ORIGIN}/contact?utm_source=codex_ops2_qa&bp=secret`,
	);
	await waitForPageviews(payloads, 1);
	await expectNpmTracker(page);

	const email = page
		.getByTestId('contact-social-email')
		.filter({ visible: true })
		.first();
	await expect(email).toBeVisible();
	await clickWithoutNavigation(email);

	await expect
		.poll(() => eventsNamed(payloads, 'direct_contact_click').length)
		.toBe(1);
	await settleBrowser(page);
	await drainCapturedRequests(page, payloads);

	const events = eventsNamed(payloads, 'direct_contact_click');
	expect(events).toHaveLength(1);
	expect(events[0]).toMatchObject({
		n: 'direct_contact_click',
		d: 'yesid.dev',
	});
	expect(events[0].p).toBeUndefined();
	const trackedUrl = new URL(events[0].u);
	expect(trackedUrl.pathname).toBe('/contact');
	expect(trackedUrl.searchParams.get('utm_source')).toBe('codex_ops2_qa');
	expect(trackedUrl.searchParams.has('bp')).toBe(false);
	expectExactPageviewCount(payloads, 1);
});
```

- [ ] **Step 3: Write the failing project-proof payload test**

Add:

```ts
test('project proof click sends one property-free event with the sanitized current project page', async ({
	page,
}) => {
	await grantBeforeLoad(page);
	await proxyProductionHostnameToPreview(page);
	const payloads = await capturePlausible(page);

	await page.goto(
		`${LOCAL_PRODUCTION_ORIGIN}/projects/yesid-dev?utm_source=codex_ops2_qa&stack=secret`,
	);
	await waitForPageviews(payloads, 1);
	await expectNpmTracker(page);

	const card = page
		.getByTestId('project-links-card')
		.filter({ visible: true })
		.first();
	const liveSite = card.locator('a[href="https://yesid.dev"]');
	await expect(liveSite).toBeVisible();
	await clickWithoutNavigation(liveSite);

	await expect
		.poll(() => eventsNamed(payloads, 'project_proof_click').length)
		.toBe(1);
	await settleBrowser(page);
	await drainCapturedRequests(page, payloads);

	const events = eventsNamed(payloads, 'project_proof_click');
	expect(events).toHaveLength(1);
	expect(events[0]).toMatchObject({
		n: 'project_proof_click',
		d: 'yesid.dev',
	});
	expect(events[0].p).toBeUndefined();
	const trackedUrl = new URL(events[0].u);
	expect(trackedUrl.pathname).toBe('/projects/yesid-dev');
	expect(trackedUrl.searchParams.get('utm_source')).toBe('codex_ops2_qa');
	expect(trackedUrl.searchParams.has('stack')).toBe(false);
	expectExactPageviewCount(payloads, 1);
});
```

- [ ] **Step 4: Write the failing decline/grant/withdrawal click test**

Add:

```ts
test('direct contact remains blocked after decline and after withdrawal', async ({
	page,
}) => {
	await enableWebdriverSends(page);
	await proxyProductionHostnameToPreview(page);
	const payloads = await capturePlausible(page);

	await page.goto(`${LOCAL_PRODUCTION_ORIGIN}/contact`);
	const email = page
		.getByTestId('contact-social-email')
		.filter({ visible: true })
		.first();

	await page.getByTestId('analytics-consent-decline').click();
	await clickWithoutNavigation(email);
	await settleBrowser(page);
	await drainCapturedRequests(page, payloads);
	expect(eventsNamed(payloads, 'direct_contact_click')).toHaveLength(0);

	await page.getByTestId('analytics-preferences').click();
	await page.getByTestId('analytics-consent-accept').click();
	await waitForPageviews(payloads, 1);
	await clickWithoutNavigation(email);
	await expect
		.poll(() => eventsNamed(payloads, 'direct_contact_click').length)
		.toBe(1);
	await drainCapturedRequests(page, payloads);
	expect(eventsNamed(payloads, 'direct_contact_click')).toHaveLength(1);

	await page.getByTestId('analytics-preferences').click();
	await page.getByTestId('analytics-consent-decline').click();
	await clickWithoutNavigation(email);
	await settleBrowser(page);
	await drainCapturedRequests(page, payloads);
	expect(eventsNamed(payloads, 'direct_contact_click')).toHaveLength(1);
});
```

The existing `production hostname without a saved choice renders consent and sends no events` test remains the blocked/unknown proof. The existing localhost and disabled-hostname tests remain the environment proof.

- [ ] **Step 5: Run the browser file and verify RED before component implementation, then GREEN after Tasks 1–4**

Run:

```bash
bun run --cwd apps/web test:e2e -- analytics.spec.ts --project=desktop-chrome
```

Expected RED before Tasks 1–4: the two new named-event polls remain at zero. Expected GREEN after Tasks 1–4: the entire analytics browser file passes, each positive event count is exactly one, private query state is absent, `p` is absent, and decline/withdrawal add no event.

- [ ] **Step 6: Commit the browser contract**

```bash
git add apps/web/tests/analytics.spec.ts
git commit -m "test(analytics): prove high-intent browser payloads"
```

### Task 6: Reconcile the exact trilingual public disclosure

**Files:**

- Create: `apps/cms/tests/lean-high-intent-copy.test.ts`
- Modify: `apps/cms/fixtures/content/site-labels.json`
- Modify: `apps/cms/fixtures/content/site-labels.fr.json`
- Modify: `apps/cms/fixtures/content/site-labels.es.json`
- Modify: `apps/cms/ops/legal/legal-pages-2026-07-09.json`
- Modify: `apps/web/tests/analytics.spec.ts`
- Modify: `apps/web/tests/page-content/legal.spec.ts`

**Interfaces:**

- Consumes: the four exact event meanings from the approved design.
- Produces: exact EN/FR/ES consent descriptions and matching Privacy/Cookies disclosure source.
- Preserves: opt-in wording, Plausible provider facts, no-cookie wording, no-custom-properties wording, and all non-analytics legal content.

- [ ] **Step 1: Present this exact copy package to the operator**

The implementation worker must obtain an explicit approval of these strings before changing the content source or writing CMS state. The approved analytics spec alone does not silently approve public legal wording.

Consent descriptions:

```text
EN: Plausible would count visits, pages viewed, referral sources, general device and region data, and clicks on contact or project proof links. No cookies, names, email addresses, form contents, destination URLs, or custom properties.

FR: Plausible compterait les visites, les pages vues, les sources de référence, des données générales sur l’appareil et la région, ainsi que les clics sur des liens de contact, de site en ligne ou de dépôt public d’un projet. Aucun cookie, nom, courriel, contenu de formulaire, URL de destination ni propriété personnalisée.

ES: Plausible contaría visitas, páginas vistas, fuentes de referencia, datos generales del dispositivo y la región, y clics en enlaces de contacto, del sitio publicado o del repositorio público de un proyecto. Sin cookies, nombres, correos, contenido de formularios, URL de destino ni propiedades personalizadas.
```

Replacement legal clauses, used once in Privacy and once in Cookies for each locale:

```text
EN: and four conversion events: a successful contact-form submission, a click to book a call, a click on a direct contact channel, and a click to inspect a project's live site or public source repository. I do not attach contact-form fields, destination URLs, link labels, or custom properties to those events.

FR: ainsi que quatre événements de conversion : l’envoi réussi du formulaire de contact, le clic pour réserver un appel, le clic sur un moyen de contact direct et le clic pour consulter le site en ligne ou le dépôt public de code source d’un projet. Je ne joins à ces événements aucun champ du formulaire de contact, aucune URL de destination, aucune étiquette de lien ni aucune propriété personnalisée.

ES: y cuatro eventos de conversión: el envío exitoso del formulario de contacto, el clic para reservar una llamada, el clic en un canal de contacto directo y el clic para consultar el sitio publicado o el repositorio público de código fuente de un proyecto. No adjunto a esos eventos ningún campo del formulario de contacto, URL de destino, etiqueta de enlace ni propiedad personalizada.
```

Use `2026-07-11`, the operator's spec-approval date, as the revision date in the Privacy and Cookies EN/FR/ES date lines. Do not change the dates on Terms, Accessibility, or Notice.

- [ ] **Step 2: Write the failing content-contract test**

Create `lean-high-intent-copy.test.ts` with:

```ts
import { describe, expect, it } from 'bun:test';
import enLabels from '../fixtures/content/site-labels.json';
import frLabels from '../fixtures/content/site-labels.fr.json';
import esLabels from '../fixtures/content/site-labels.es.json';
import drafts from '../ops/legal/legal-pages-2026-07-09.json';

type Locale = 'en' | 'fr' | 'es';
type DraftBlock = { kind: string; text?: string; items?: string[] };
type DraftLocale = { title: string; blocks: DraftBlock[] };
type DraftPage = {
	slug: string;
	en: DraftLocale;
	fr: DraftLocale;
	es: DraftLocale;
};

const descriptions: Record<Locale, string> = {
	en: 'Plausible would count visits, pages viewed, referral sources, general device and region data, and clicks on contact or project proof links. No cookies, names, email addresses, form contents, destination URLs, or custom properties.',
	fr: 'Plausible compterait les visites, les pages vues, les sources de référence, des données générales sur l’appareil et la région, ainsi que les clics sur des liens de contact, de site en ligne ou de dépôt public d’un projet. Aucun cookie, nom, courriel, contenu de formulaire, URL de destination ni propriété personnalisée.',
	es: 'Plausible contaría visitas, páginas vistas, fuentes de referencia, datos generales del dispositivo y la región, y clics en enlaces de contacto, del sitio publicado o del repositorio público de un proyecto. Sin cookies, nombres, correos, contenido de formularios, URL de destino ni propiedades personalizadas.',
};

const clauses: Record<Locale, string> = {
	en: "and four conversion events: a successful contact-form submission, a click to book a call, a click on a direct contact channel, and a click to inspect a project's live site or public source repository. I do not attach contact-form fields, destination URLs, link labels, or custom properties to those events.",
	fr: 'ainsi que quatre événements de conversion : l’envoi réussi du formulaire de contact, le clic pour réserver un appel, le clic sur un moyen de contact direct et le clic pour consulter le site en ligne ou le dépôt public de code source d’un projet. Je ne joins à ces événements aucun champ du formulaire de contact, aucune URL de destination, aucune étiquette de lien ni aucune propriété personnalisée.',
	es: 'y cuatro eventos de conversión: el envío exitoso del formulario de contacto, el clic para reservar una llamada, el clic en un canal de contacto directo y el clic para consultar el sitio publicado o el repositorio público de código fuente de un proyecto. No adjunto a esos eventos ningún campo del formulario de contacto, URL de destino, etiqueta de enlace ni propiedad personalizada.',
};

const staleClauses: Record<Locale, string> = {
	en: 'and two conversion events:',
	fr: 'ainsi que deux événements de conversion :',
	es: 'y dos eventos de conversión:',
};

const pages = (drafts as { pages: DraftPage[] }).pages;

function textFor(slug: 'privacy' | 'cookies', locale: Locale): string {
	const page = pages.find((candidate) => candidate.slug === slug);
	if (!page) throw new Error(`missing legal draft ${slug}`);
	return page[locale].blocks.map((block) => block.text ?? '').join('\n');
}

describe('lean high-intent public copy', () => {
	it('dates the revised source artifact', () => {
		expect(drafts.generatedAt).toBe('2026-07-11');
	});

	it('keeps the three consent descriptions exact and equivalent', () => {
		expect(enLabels.ui_analytics_consent_description).toBe(descriptions.en);
		expect(frLabels.ui_analytics_consent_description).toBe(descriptions.fr);
		expect(esLabels.ui_analytics_consent_description).toBe(descriptions.es);
	});

	it.each(['privacy', 'cookies'] as const)(
		'discloses the four property-free interactions in %s',
		(slug) => {
			for (const locale of ['en', 'fr', 'es'] as const) {
				const body = textFor(slug, locale);
				expect(body).toContain(clauses[locale]);
				expect(body).not.toContain(staleClauses[locale]);
				expect(body).toContain('2026-07-11');
			}
		},
	);
});
```

- [ ] **Step 3: Run the content-contract test and verify RED**

```bash
bun test apps/cms/tests/lean-high-intent-copy.test.ts
```

Expected: FAIL because the fixtures still omit high-intent clicks, the six legal bodies still say two events, and Privacy/Cookies still show `2026-07-09`.

- [ ] **Step 4: Apply only the approved source-copy changes**

Set `ui_analytics_consent_description` in the three fixture files to the exact strings in Step 1.

In each Privacy/Cookies analytics paragraph, replace only these two consecutive sentences per locale:

```text
EN OLD: and two conversion events: a successful contact-form submission and a click to book a call. I do not attach contact-form fields or custom properties to those events.
EN NEW: and four conversion events: a successful contact-form submission, a click to book a call, a click on a direct contact channel, and a click to inspect a project's live site or public source repository. I do not attach contact-form fields, destination URLs, link labels, or custom properties to those events.

FR OLD: ainsi que deux événements de conversion : l'envoi réussi du formulaire de contact et le clic pour réserver un appel. Je ne joins à ces événements aucun champ du formulaire de contact ni aucune propriété personnalisée.
FR NEW: ainsi que quatre événements de conversion : l’envoi réussi du formulaire de contact, le clic pour réserver un appel, le clic sur un moyen de contact direct et le clic pour consulter le site en ligne ou le dépôt public de code source d’un projet. Je ne joins à ces événements aucun champ du formulaire de contact, aucune URL de destination, aucune étiquette de lien ni aucune propriété personnalisée.

ES OLD: y dos eventos de conversión: el envío exitoso del formulario de contacto y el clic para reservar una llamada. No adjunto a esos eventos ningún campo del formulario de contacto ni propiedades personalizadas.
ES NEW: y cuatro eventos de conversión: el envío exitoso del formulario de contacto, el clic para reservar una llamada, el clic en un canal de contacto directo y el clic para consultar el sitio publicado o el repositorio público de código fuente de un proyecto. No adjunto a esos eventos ningún campo del formulario de contacto, URL de destino, etiqueta de enlace ni propiedad personalizada.
```

Change only the Privacy/Cookies EN/FR/ES revision-date strings from `2026-07-09` to `2026-07-11`. Set the top-level `generatedAt` to `2026-07-11` because the source artifact changed.

- [ ] **Step 5: Strengthen the rendered legal-page browser test**

Replace `ANALYTICS_LEGAL_ROUTES` with:

```ts
const ANALYTICS_LEGAL_ROUTES = [
	{
		path: '/legal/privacy',
		interaction: 'four conversion events',
		noProperties: 'destination URLs, link labels, or custom properties',
	},
	{
		path: '/fr/legal/privacy',
		interaction: 'quatre événements de conversion',
		noProperties: 'URL de destination, aucune étiquette de lien ni aucune propriété personnalisée',
	},
	{
		path: '/es/legal/privacy',
		interaction: 'cuatro eventos de conversión',
		noProperties: 'URL de destino, etiqueta de enlace ni propiedad personalizada',
	},
	{
		path: '/legal/cookies',
		interaction: 'four conversion events',
		noProperties: 'destination URLs, link labels, or custom properties',
	},
	{
		path: '/fr/legal/cookies',
		interaction: 'quatre événements de conversion',
		noProperties: 'URL de destination, aucune étiquette de lien ni aucune propriété personnalisée',
	},
	{
		path: '/es/legal/cookies',
		interaction: 'cuatro eventos de conversión',
		noProperties: 'URL de destino, etiqueta de enlace ni propiedad personalizada',
	},
] as const;
```

Update the loop inside the existing Plausible test to:

```ts
for (const route of ANALYTICS_LEGAL_ROUTES) {
	await page.goto(route.path);
	const body = page.locator('[data-testid="legal-body"]');
	await expect(body).toContainText('Plausible');
	await expect(body).toContainText(route.interaction);
	await expect(body).toContainText(route.noProperties);
	await expect(body).toContainText('2026-07-11');
	await expect(body).not.toContainText('Umami');
}
```

Add these runtime consent-description cases to `apps/web/tests/analytics.spec.ts`:

```ts
for (const { locale, path, description } of [
	{
		locale: 'English',
		path: '/contact',
		description:
			'Plausible would count visits, pages viewed, referral sources, general device and region data, and clicks on contact or project proof links. No cookies, names, email addresses, form contents, destination URLs, or custom properties.',
	},
	{
		locale: 'French',
		path: '/fr/contact',
		description:
			'Plausible compterait les visites, les pages vues, les sources de référence, des données générales sur l’appareil et la région, ainsi que les clics sur des liens de contact, de site en ligne ou de dépôt public d’un projet. Aucun cookie, nom, courriel, contenu de formulaire, URL de destination ni propriété personnalisée.',
	},
	{
		locale: 'Spanish',
		path: '/es/contact',
		description:
			'Plausible contaría visitas, páginas vistas, fuentes de referencia, datos generales del dispositivo y la región, y clics en enlaces de contacto, del sitio publicado o del repositorio público de un proyecto. Sin cookies, nombres, correos, contenido de formularios, URL de destino ni propiedades personalizadas.',
	},
] as const) {
	test(`${locale} analytics station renders the approved high-intent disclosure`, async ({
		page,
	}) => {
		await enableWebdriverSends(page);
		await proxyProductionHostnameToPreview(page);
		await page.goto(`${LOCAL_PRODUCTION_ORIGIN}${path}`);

		await expect(page.getByTestId('analytics-consent')).toBeVisible();
		await expect(page.locator('#analytics-consent-description')).toHaveText(
			description,
		);
	});
}
```

- [ ] **Step 6: Run source-copy tests and verify GREEN**

```bash
bun test apps/cms/tests/lean-high-intent-copy.test.ts
EXPORT_FALLBACKS_SKIP=1 bun run --cwd apps/web build
bun run --cwd apps/web test:e2e:prebuilt -- \
  tests/analytics.spec.ts \
  tests/page-content/legal.spec.ts \
  --project=desktop-chrome
```

Expected: the source contract passes. The new rendered consent/legal copy assertions remain RED until live CMS modules are regenerated in Task 10; that RED is expected and must not be hidden by hand-editing generated files.

- [ ] **Step 7: Commit the approved source and the still-enforcing rendered test**

```bash
git add \
  apps/cms/tests/lean-high-intent-copy.test.ts \
  apps/cms/fixtures/content/site-labels.json \
  apps/cms/fixtures/content/site-labels.fr.json \
  apps/cms/fixtures/content/site-labels.es.json \
  apps/cms/ops/legal/legal-pages-2026-07-09.json \
  apps/web/tests/analytics.spec.ts \
  apps/web/tests/page-content/legal.spec.ts
git commit -m "content(analytics): disclose high-intent measurement"
```

### Task 7: Replace the broad historical CMS writer with a live narrow reconciler

**Files:**

- Create: `apps/cms/tests/promote-lean-high-intent-analytics.test.ts`
- Create: `apps/cms/scripts/promote-lean-high-intent-analytics.ts`
- Delete after green: `apps/cms/tests/promote-ops2-analytics-prod.test.ts`
- Delete after green: `apps/cms/scripts/promote-ops2-analytics-prod.ts`

**Interfaces:**

- CLI: `bun apps/cms/scripts/promote-lean-high-intent-analytics.ts --target=dev|prod [--dry-run|--apply] [--confirm=APPLY_PROD_LEAN_HIGH_INTENT_ANALYTICS]`.
- Produces: zero to three consent-description PATCHes and zero to six legal-body PATCHes.
- Read contract: every invocation reads live target state before planning.
- Apply contract: every apply re-reads live state and exits only when the second plan is empty.
- Safety contract: no schema, title, status, sort, footer, navigation, unrelated label, or unrelated legal-page mutation.

- [ ] **Step 1: Write failing CLI and pure-plan tests**

The test file must import these exact exports:

```ts
import { describe, expect, it } from 'bun:test';
import {
	PROD_CONFIRMATION,
	TARGET_URLS,
	applyAndVerify,
	buildDesiredSnapshot,
	buildPlan,
	parseCli,
	type CmsRequest,
	type LiveSnapshot,
} from '../scripts/promote-lean-high-intent-analytics';
```

Cover these cases with `bun:test`:

```ts
describe('parseCli', () => {
	it('requires an explicit target', () => {
		expect(() => parseCli([])).toThrow(/--target=dev\|prod/);
	});

	it('defaults to live dry-run', () => {
		expect(parseCli(['--target=dev'])).toEqual({
			target: 'dev',
			apply: false,
		});
	});

	it('rejects conflicting modes and unknown flags', () => {
		expect(() =>
			parseCli(['--target=dev', '--dry-run', '--apply']),
		).toThrow(/choose one/);
		expect(() => parseCli(['--target=dev', '--wide-write'])).toThrow();
	});

	it('requires the exact production confirmation', () => {
		expect(() => parseCli(['--target=prod', '--apply'])).toThrow(
			new RegExp(PROD_CONFIRMATION),
		);
		expect(
			parseCli([
				'--target=prod',
				'--apply',
				`--confirm=${PROD_CONFIRMATION}`,
			]),
		).toEqual({ target: 'prod', apply: true });
	});
});
```

Add these complete test helpers and cases after the CLI block:

```ts
function currentSnapshot(desired: LiveSnapshot): LiveSnapshot {
	const current = structuredClone(desired);
	for (const [index, row] of current.consent.entries()) {
		row.id = 100 + index;
		row.description = `old consent ${row.language}`;
	}
	for (const [index, row] of current.legal.entries()) {
		row.id = 200 + index;
		const allowed = row.slug === 'privacy' ? [1, 15] : [0, 6];
		for (const blockIndex of allowed) {
			row.body.blocks[blockIndex] = {
				...row.body.blocks[blockIndex],
				data: { text: `old ${row.slug} ${row.language} ${blockIndex}` },
			};
		}
	}
	return current;
}

function fakeRequest(
	before: LiveSnapshot,
	after: LiveSnapshot,
): { request: CmsRequest; calls: Array<{ method: string; path: string }> } {
	let wrote = false;
	const calls: Array<{ method: string; path: string }> = [];
	const request: CmsRequest = async (method, path) => {
		calls.push({ method, path });
		if (method === 'PATCH') {
			wrote = true;
			return { status: 200, json: { data: {} } };
		}

		const snapshot = wrote ? after : before;
		if (path.startsWith('/items/site_labels_translations?')) {
			return {
				status: 200,
				json: {
					data: snapshot.consent.map((row) => ({
						id: row.id,
						languages_code: row.language,
						ui_analytics_consent_description: row.description,
					})),
				},
			};
		}

		const slug = path.includes('/privacy?') ? 'privacy' : 'cookies';
		return {
			status: 200,
			json: {
				data: {
					id: slug,
					translations: snapshot.legal
						.filter((row) => row.slug === slug)
						.map((row) => ({
							id: row.id,
							languages_code: row.language,
							body: row.body,
						})),
				},
			},
		};
	};
	return { request, calls };
}

describe('buildPlan', () => {
	it('plans exactly three consent and six legal patches', () => {
		const desired = buildDesiredSnapshot();
		const current = currentSnapshot(desired);
		const plan = buildPlan(current, desired);

		expect(plan).toHaveLength(9);
		expect(plan.filter((patch) => patch.kind === 'consent')).toHaveLength(3);
		expect(plan.filter((patch) => patch.kind === 'legal')).toHaveLength(6);
		expect(new Set(plan.map((patch) => patch.path)).size).toBe(9);
	});

	it('converges to an empty plan', () => {
		const desired = buildDesiredSnapshot();
		expect(buildPlan(desired, desired)).toEqual([]);
	});

	it('refuses drift outside the date and analytics blocks', () => {
		const desired = buildDesiredSnapshot();
		const drifted = currentSnapshot(desired);
		drifted.legal[0].body.blocks[2].data = { text: 'unrelated edit' };

		expect(() => buildPlan(drifted, desired)).toThrow(
			/unrelated legal drift/,
		);
	});
});

describe('applyAndVerify', () => {
	it('uses PATCH only and verifies the second live read', async () => {
		const desired = buildDesiredSnapshot();
		const current = currentSnapshot(desired);
		const { request, calls } = fakeRequest(current, desired);

		await expect(applyAndVerify(request, desired)).resolves.toHaveLength(9);
		const writes = calls.filter((call) => call.method !== 'GET');
		expect(writes).toHaveLength(9);
		expect(writes.every((call) => call.method === 'PATCH')).toBe(true);
	});

	it('fails when the post-apply read remains stale', async () => {
		const desired = buildDesiredSnapshot();
		const current = currentSnapshot(desired);
		const { request } = fakeRequest(current, current);

		await expect(applyAndVerify(request, desired)).rejects.toThrow(
			/post-apply verification/,
		);
	});
});

it('pins both CMS target URLs', () => {
	expect(TARGET_URLS).toEqual({
		dev: 'https://cms.dev.yesid.dev',
		prod: 'https://cms.yesid.dev',
	});
});
```

- [ ] **Step 2: Run the new test and verify RED**

```bash
bun test apps/cms/tests/promote-lean-high-intent-analytics.test.ts
```

Expected: FAIL because the replacement module does not exist.

- [ ] **Step 3: Implement strict CLI parsing and fixed targets**

Start the new script with these exact public contracts:

```ts
#!/usr/bin/env bun

import { parseArgs } from 'node:util';
import enLabels from '../fixtures/content/site-labels.json';
import frLabels from '../fixtures/content/site-labels.fr.json';
import esLabels from '../fixtures/content/site-labels.es.json';
import drafts from '../ops/legal/legal-pages-2026-07-09.json';
import { toBlockEditorDoc } from './seed-legal-pages';
import { getAdminToken } from './lib/auth';
import { createLogger } from './lib/logger';
import { rest } from './lib/schema-apply';

export const TARGET_URLS = {
	dev: 'https://cms.dev.yesid.dev',
	prod: 'https://cms.yesid.dev',
} as const;
export const PROD_CONFIRMATION = 'APPLY_PROD_LEAN_HIGH_INTENT_ANALYTICS';

type Target = keyof typeof TARGET_URLS;
type Locale = 'en' | 'fr' | 'es';
export interface CliOptions {
	target: Target;
	apply: boolean;
}

export function parseCli(argv: string[]): CliOptions {
	const { values } = parseArgs({
		args: argv,
		options: {
			target: { type: 'string' },
			apply: { type: 'boolean', default: false },
			'dry-run': { type: 'boolean', default: false },
			confirm: { type: 'string' },
		},
		strict: true,
		allowPositionals: false,
	});

	if (values.target !== 'dev' && values.target !== 'prod') {
		throw new Error('required: --target=dev|prod');
	}
	if (values.apply && values['dry-run']) {
		throw new Error('choose one: --dry-run or --apply');
	}
	if (values.target === 'prod' && values.apply) {
		if (values.confirm !== PROD_CONFIRMATION) {
			throw new Error(`production apply requires --confirm=${PROD_CONFIRMATION}`);
		}
	} else if (values.confirm !== undefined) {
		throw new Error('--confirm is accepted only for production apply');
	}

	return { target: values.target, apply: values.apply };
}
```

- [ ] **Step 4: Implement the exact desired snapshot and drift-safe planner**

Use these data shapes:

```ts
interface BlockEditorDoc {
	time: number;
	version: string;
	blocks: Array<{ id: string; type: string; data: Record<string, unknown> }>;
}

interface ConsentRow {
	id: number;
	language: Locale;
	description: string;
}

interface LegalRow {
	id: number;
	slug: 'privacy' | 'cookies';
	language: Locale;
	body: BlockEditorDoc;
}

export interface LiveSnapshot {
	consent: ConsentRow[];
	legal: LegalRow[];
}

export interface PlannedPatch {
	kind: 'consent' | 'legal';
	key: string;
	path: string;
	body: Record<string, unknown>;
}

const ALLOWED_LEGAL_BLOCKS: Record<'privacy' | 'cookies', Set<number>> = {
	privacy: new Set([1, 15]),
	cookies: new Set([0, 6]),
};

function stable(value: unknown): string {
	return JSON.stringify(value);
}

function requireExactKeys(
	rows: Array<{ slug?: string; language: Locale }>,
	expected: string[],
	name: string,
): void {
	const keys = rows
		.map((row) => row.slug ? `${row.slug}:${row.language}` : row.language)
		.sort();
	if (stable(keys) !== stable([...expected].sort())) {
		throw new Error(`${name} rows missing or duplicated: ${keys.join(',')}`);
	}
}
```

Add these exact builders and planner:

```ts
type DraftBlock = { kind: 'h2' | 'h3' | 'p' | 'ul' | 'ol'; text?: string; items?: string[] };
type DraftLocale = { title: string; blocks: DraftBlock[] };
type DraftPage = {
	slug: string;
	en: DraftLocale;
	fr: DraftLocale;
	es: DraftLocale;
};

const LOCALES = ['en', 'fr', 'es'] as const;
const LEGAL_SLUGS = ['privacy', 'cookies'] as const;
const CONSENT_DESCRIPTIONS: Record<Locale, string> = {
	en: enLabels.ui_analytics_consent_description,
	fr: frLabels.ui_analytics_consent_description,
	es: esLabels.ui_analytics_consent_description,
};

export function buildDesiredSnapshot(): LiveSnapshot {
	const pages = (drafts as { pages: DraftPage[] }).pages;
	const legal: LegalRow[] = [];

	for (const [slugIndex, slug] of LEGAL_SLUGS.entries()) {
		const page = pages.find((candidate) => candidate.slug === slug);
		if (!page) throw new Error(`missing desired legal draft ${slug}`);

		for (const [localeIndex, language] of LOCALES.entries()) {
			legal.push({
				id: -(slugIndex * LOCALES.length + localeIndex + 1),
				slug,
				language,
				body: toBlockEditorDoc(
					slug,
					language,
					page[language].blocks,
				) as BlockEditorDoc,
			});
		}
	}

	return {
		consent: LOCALES.map((language, index) => ({
			id: -(index + 1),
			language,
			description: CONSENT_DESCRIPTIONS[language],
		})),
		legal,
	};
}

function indexBy<T>(rows: T[], key: (row: T) => string): Map<string, T> {
	return new Map(rows.map((row) => [key(row), row]));
}

function assertLegalDriftSafe(current: LegalRow, desired: LegalRow): void {
	if (
		current.body.time !== desired.body.time ||
		current.body.version !== desired.body.version ||
		current.body.blocks.length !== desired.body.blocks.length
	) {
		throw new Error(`unrelated legal drift at ${current.slug}:${current.language}:document`);
	}

	const allowed = ALLOWED_LEGAL_BLOCKS[current.slug];
	for (const [index, desiredBlock] of desired.body.blocks.entries()) {
		if (allowed.has(index)) continue;
		if (stable(current.body.blocks[index]) !== stable(desiredBlock)) {
			throw new Error(
				`unrelated legal drift at ${current.slug}:${current.language}:${index}`,
			);
		}
	}
}

export function buildPlan(
	current: LiveSnapshot,
	desired: LiveSnapshot,
): PlannedPatch[] {
	const expectedConsent = [...LOCALES];
	const expectedLegal = LEGAL_SLUGS.flatMap((slug) =>
		LOCALES.map((language) => `${slug}:${language}`),
	);
	requireExactKeys(current.consent, expectedConsent, 'consent');
	requireExactKeys(desired.consent, expectedConsent, 'desired consent');
	requireExactKeys(current.legal, expectedLegal, 'legal');
	requireExactKeys(desired.legal, expectedLegal, 'desired legal');

	const desiredConsent = indexBy(desired.consent, (row) => row.language);
	const desiredLegal = indexBy(
		desired.legal,
		(row) => `${row.slug}:${row.language}`,
	);
	const patches: PlannedPatch[] = [];

	for (const live of current.consent) {
		const wanted = desiredConsent.get(live.language)!;
		if (live.description === wanted.description) continue;
		patches.push({
			kind: 'consent',
			key: `consent:${live.language}`,
			path: `/items/site_labels_translations/${live.id}`,
			body: {
				ui_analytics_consent_description: wanted.description,
			},
		});
	}

	for (const live of current.legal) {
		const key = `${live.slug}:${live.language}`;
		const wanted = desiredLegal.get(key)!;
		assertLegalDriftSafe(live, wanted);
		if (stable(live.body) === stable(wanted.body)) continue;
		patches.push({
			kind: 'legal',
			key: `legal:${key}`,
			path: `/items/legal_pages_translations/${live.id}`,
			body: { body: wanted.body },
		});
	}

	return patches.sort((left, right) => left.key.localeCompare(right.key));
}
```

- [ ] **Step 5: Implement live reads, narrow writes, and post-apply convergence**

Export this request interface so tests can inject a fake:

```ts
export type CmsRequest = (
	method: 'GET' | 'PATCH',
	path: string,
	body?: Record<string, unknown>,
) => Promise<{ status: number; json: any }>;
```

The live reader must issue exactly these three GET shapes:

```ts
GET /items/site_labels_translations?fields=id,languages_code,ui_analytics_consent_description&filter[languages_code][_in]=en,fr,es&limit=-1
GET /items/legal_pages/privacy?fields=id,translations.id,translations.languages_code,translations.body
GET /items/legal_pages/cookies?fields=id,translations.id,translations.languages_code,translations.body
```

Normalize `body` when Directus returns either an object or a JSON string. Fail closed on every response status of 400 or higher, a missing page, a missing translation, a duplicate locale, or malformed body JSON. Use this exact reader:

```ts
function requireSuccess(
	response: { status: number; json: any },
	label: string,
): any {
	if (response.status >= 400) {
		throw new Error(
			`${label} failed (${response.status}): ${JSON.stringify(response.json)}`,
		);
	}
	return response.json?.data;
}

function normalizeBody(value: unknown, key: string): BlockEditorDoc {
	let body = value;
	if (typeof body === 'string') {
		try {
			body = JSON.parse(body);
		} catch {
			throw new Error(`malformed legal body JSON at ${key}`);
		}
	}
	if (
		!body ||
		typeof body !== 'object' ||
		!Array.isArray((body as BlockEditorDoc).blocks)
	) {
		throw new Error(`malformed legal body at ${key}`);
	}
	return body as BlockEditorDoc;
}

export async function readLiveSnapshot(
	request: CmsRequest,
): Promise<LiveSnapshot> {
	const consentData = requireSuccess(
		await request(
			'GET',
			'/items/site_labels_translations?fields=id,languages_code,ui_analytics_consent_description&filter[languages_code][_in]=en,fr,es&limit=-1',
		),
		'read consent descriptions',
	) as Array<{
		id: number;
		languages_code: string;
		ui_analytics_consent_description: string;
	}>;

	const legal: LegalRow[] = [];
	for (const slug of LEGAL_SLUGS) {
		const page = requireSuccess(
			await request(
				'GET',
				`/items/legal_pages/${slug}?fields=id,translations.id,translations.languages_code,translations.body`,
			),
			`read legal page ${slug}`,
		) as {
			id: string;
			translations: Array<{
				id: number;
				languages_code: string;
				body: unknown;
			}>;
		if (!page || page.id !== slug || !Array.isArray(page.translations)) {
			throw new Error(`missing legal page ${slug}`);
		}

		for (const translation of page.translations) {
			if (!LOCALES.includes(translation.languages_code as Locale)) continue;
			const language = translation.languages_code as Locale;
			legal.push({
				id: translation.id,
				slug,
				language,
				body: normalizeBody(translation.body, `${slug}:${language}`),
			});
		}
	}

	return {
		consent: consentData.map((row) => {
			if (!LOCALES.includes(row.languages_code as Locale)) {
				throw new Error(`unexpected consent locale ${row.languages_code}`);
			}
			if (typeof row.ui_analytics_consent_description !== 'string') {
				throw new Error(`missing consent description ${row.languages_code}`);
			}
			return {
				id: row.id,
				language: row.languages_code as Locale,
				description: row.ui_analytics_consent_description,
			};
		}),
		legal,
	};
}
```

Implement apply and verification with this control flow:

```ts
export async function applyAndVerify(
	request: CmsRequest,
	desired: LiveSnapshot,
): Promise<PlannedPatch[]> {
	const before = await readLiveSnapshot(request);
	const plan = buildPlan(before, desired);

	for (const patch of plan) {
		const response = await request('PATCH', patch.path, patch.body);
		if (response.status >= 400) {
			throw new Error(
				`PATCH ${patch.key} failed (${response.status}): ${JSON.stringify(response.json)}`,
			);
		}
	}

	const after = await readLiveSnapshot(request);
	const remaining = buildPlan(after, desired);
	if (remaining.length > 0) {
		throw new Error(
			`post-apply verification left ${remaining.length} changes`,
		);
	}
	return plan;
}
```

Finish the real adapter and main entry point with:

```ts
const log = createLogger('promote-lean-high-intent-analytics');

async function main(): Promise<void> {
	const options = parseCli(process.argv.slice(2));
	const directusUrl = TARGET_URLS[options.target];
	const token = await getAdminToken(directusUrl, { allowBuildToken: false });
	const request: CmsRequest = (method, path, body) =>
		rest({ directusUrl, token }, method, path, body);
	const desired = buildDesiredSnapshot();

	if (!options.apply) {
		const current = await readLiveSnapshot(request);
		const plan = buildPlan(current, desired);
		if (plan.length === 0) {
			log.info('NO CHANGES');
			return;
		}
		for (const patch of plan) {
			log.info(`PATCH ${patch.key} ${patch.path}`);
		}
		log.info(`dry-run: ${plan.length} live changes; no writes`);
		return;
	}

	const applied = await applyAndVerify(request, desired);
	if (applied.length === 0) {
		log.info('NO CHANGES');
		return;
	}
	log.info(`applied and verified ${applied.length} changes`);
	log.info('NO CHANGES');
}

if (import.meta.main) {
	main().catch((error) => {
		console.error('[promote-lean-high-intent-analytics] FAILED:', error);
		process.exit(1);
	});
}
```

- [ ] **Step 6: Run the reconciler test and verify GREEN**

```bash
bun test apps/cms/tests/promote-lean-high-intent-analytics.test.ts
```

Expected: CLI guard, exact nine-row plan, no-op convergence, unrelated-drift refusal, PATCH-only scope, and post-apply verification tests all pass.

- [ ] **Step 7: Remove the superseded broad writer and run CMS regressions**

Delete the old script and test, then run:

```bash
bun test \
  apps/cms/tests/promote-lean-high-intent-analytics.test.ts \
  apps/cms/tests/lean-high-intent-copy.test.ts \
  apps/cms/tests/setup-site-labels-dry-run.test.ts \
  apps/cms/scripts/lib/fetchers/legal-pages.test.ts \
  apps/cms/scripts/lib/fetchers/site-labels.test.ts \
  apps/cms/scripts/export-fallbacks.test.ts \
  apps/cms/scripts/verify-content-manifest.test.ts
```

Expected: all tracked CMS legal/label tests pass and `rg -n "promote-ops2-analytics-prod" apps/cms` returns no matches.

- [ ] **Step 8: Commit the safe CMS path**

```bash
git add \
  apps/cms/scripts/promote-lean-high-intent-analytics.ts \
  apps/cms/tests/promote-lean-high-intent-analytics.test.ts \
  apps/cms/scripts/promote-ops2-analytics-prod.ts \
  apps/cms/tests/promote-ops2-analytics-prod.test.ts
git commit -m "refactor(cms): narrow analytics copy promotion"
```

### Task 8: Run the complete local code gate and obtain review

**Files:**

- Verify only; no new implementation file is expected.

**Interfaces:**

- Consumes: Tasks 1–7.
- Produces: a reviewable local branch with all code/CMS-source tests green and one explicitly expected legal-render RED pending live CMS export.

- [ ] **Step 1: Run all focused unit and CMS contracts**

```bash
bun run --cwd apps/web test -- \
  src/lib/utils/analytics.test.ts \
  src/lib/utils/high-intent-links.test.ts \
  src/lib/components/contact/ContactPage.test.ts \
  src/lib/components/projects/ProjectLinksCard.test.ts \
  src/lib/components/projects/ProjectDetailPage.image.test.ts

bun test \
  apps/cms/tests/promote-lean-high-intent-analytics.test.ts \
  apps/cms/tests/lean-high-intent-copy.test.ts \
  apps/cms/tests/setup-site-labels-dry-run.test.ts \
  apps/cms/scripts/lib/fetchers/legal-pages.test.ts \
  apps/cms/scripts/lib/fetchers/site-labels.test.ts \
  apps/cms/scripts/export-fallbacks.test.ts \
  apps/cms/scripts/verify-content-manifest.test.ts
```

Expected: every focused unit/CMS test passes.

- [ ] **Step 2: Run type, build, and analytics browser gates**

```bash
bun run --cwd apps/web check
EXPORT_FALLBACKS_SKIP=1 bun run --cwd apps/web build
bun run --cwd apps/web test:e2e:prebuilt -- \
  tests/analytics.spec.ts \
  tests/page-content/projects-detail.spec.ts \
  --grep-invert "renders the approved high-intent disclosure" \
  --project=desktop-chrome
```

Expected: Svelte check exits 0, build exits 0 with committed content, and the analytics/private-repository browser files pass.

- [ ] **Step 3: Preserve the honest pending legal-render gate**

Run:

```bash
bun run --cwd apps/web test:e2e:prebuilt -- \
  tests/analytics.spec.ts \
  tests/page-content/legal.spec.ts \
  --project=desktop-chrome
```

Expected before Task 10: FAIL only on the new analytics-station description and legal four-event/date assertions because generated modules still reflect live CMS. Any unrelated failure is a bug and must be fixed before continuing. Record the exact failing assertions; do not weaken them and do not hand-edit generated modules.

- [ ] **Step 4: Check patch hygiene**

```bash
git diff --check
git status --short
git log --oneline --decorate origin/main..HEAD
```

Expected: no whitespace errors, only slice-38 files, local commits only, no push, and no generated module changes yet.

- [ ] **Step 5: Request code review under the no-push gate**

Use `superpowers:requesting-code-review`. The reviewer must check:

- no `props` or destination data;
- exact four-event union;
- exact `wa.me` host rule;
- no global click listener;
- private repository stays a non-link;
- no Web3Forms/Proton change;
- nine-row CMS write ceiling and live post-read;
- unrelated legal drift refusal;
- no generated-file hand edit;
- no Transit file.

Resolve every valid finding locally and rerun Steps 1–4. Do not push while the Vercel plan gate is unmet.

### Task 9: Correct the Plausible goals and close slice 35 independently

**Files:**

- External Plausible account and Notion evidence only; no repository file.

**Interfaces:**

- Consumes: existing production `contact_form_success` and `booking_click` calls.
- Produces: exact goal configuration plus normal-browser Realtime receipts for the two OPS2 events.
- Does not depend on: Tasks 1–8 or a new deployment.

- [ ] **Step 1: Read the current goal state with the stored credential**

Run without printing either token:

```bash
export OP_SERVICE_ACCOUNT_TOKEN="$(sed -n 's/^OP_TOKEN=//p' /home/mgkdante/Yesito/projects/yesid.dev/.env)"
export PLAUSIBLE_API_KEY="$(op read 'op://yesid-dev/API - Plausible/credential')"
curl --fail-with-body --silent --show-error --get \
  https://plausible.io/api/v1/sites/goals \
  -H "Authorization: Bearer ${PLAUSIBLE_API_KEY}" \
  --data-urlencode site_id=yesid.dev \
  | jq '.goals | map({id, goal_type, event_name, display_name, custom_props})'
unset PLAUSIBLE_API_KEY
```

Expected pre-cleanup state, if unchanged from the 2026-07-11 read: `404`, `Outbound Link: Click`, `File Download`, and `Form: Submission`, with the two intended event names incorrectly stored as property constraints. Re-read rather than assuming this state is unchanged.

- [ ] **Step 2: Correct goals in Plausible Site Settings**

The stored key returned HTTP 401 for goal writes and Plausible documents Sites API writes as Enterprise-only. Use the authenticated UI unless a valid Sites API key is later supplied.

Exact UI actions:

1. Open `yesid.dev` → **Site Settings** → **Goals**.
2. Delete `Outbound Link: Click`, `File Download`, and `Form: Submission` goals. This removes the mistaken `booking_click` and `contact_form_success` property constraints.
3. Keep the automatic `404` goal.
4. Add a **Custom event** goal named `contact_form_success` with no property constraints and no alternate display name.
5. Add a **Custom event** goal named `booking_click` with no property constraints and no alternate display name.
6. Add a **Custom event** goal named `direct_contact_click` with no property constraints and no alternate display name.
7. Add a **Custom event** goal named `project_proof_click` with no property constraints and no alternate display name.
8. Capture one settings screenshot showing the five remaining goals.

Do not ask the operator for a PIN, password, or browser credential. If authenticated clicks are blocked, leave this exact click list and continue nonblocked local work.

- [ ] **Step 3: Verify the exact goal state through the read API**

```bash
export OP_SERVICE_ACCOUNT_TOKEN="$(sed -n 's/^OP_TOKEN=//p' /home/mgkdante/Yesito/projects/yesid.dev/.env)"
export PLAUSIBLE_API_KEY="$(op read 'op://yesid-dev/API - Plausible/credential')"
curl --fail-with-body --silent --show-error --get \
  https://plausible.io/api/v1/sites/goals \
  -H "Authorization: Bearer ${PLAUSIBLE_API_KEY}" \
  --data-urlencode site_id=yesid.dev \
  | jq -e '
      . as $root
      | [.goals[] | select(.event_name != "404")] as $events
      | ($events | length == 4)
        and ([$events[].event_name] | sort == [
          "booking_click",
          "contact_form_success",
          "direct_contact_click",
          "project_proof_click"
        ])
        and all($events[]; .goal_type == "event")
        and all($events[]; .display_name == .event_name)
        and all($events[]; .custom_props == {})
        and any($root.goals[]; .event_name == "404")
    '
unset PLAUSIBLE_API_KEY
```

Expected: `jq` exits 0 and prints `true`.

- [ ] **Step 4: Run the OPS2 normal-browser receipt window**

Use a normal non-automated clean browser profile with no saved analytics choice. Open:

```text
https://yesid.dev/contact?utm_source=codex_ops2_qa&utm_medium=qa&utm_campaign=ops2_closeout
```

Record UTC start time. Then:

1. Before choosing, confirm no Plausible tracker request.
2. Choose **No thanks**, retry a booking/direct action, and confirm no request.
3. Reopen **Analytics preferences**, choose **Allow analytics**, submit one clearly labelled QA contact-form message through the real Web3Forms form, and click the real booking link once.
4. Reopen preferences, choose **No thanks**, click booking again, and confirm no later request.
5. Record UTC end time, request names, sanitized current URLs, response status, and that the form/booking actions remained usable.

The contact QA message must contain no real client data and should identify the controlled window, for example `OPS2 analytics QA, safe to delete`.

- [ ] **Step 5: Capture Realtime and close slice 35**

In Plausible Realtime, filter to `utm_source=codex_ops2_qa` and capture `contact_form_success` and `booking_click`. Record the QA window in slice-35 Plan/Handoff and explicitly exclude that UTM source from future baselines. Reconcile the shipped PR/deploy SHA already attached to slice 35, then use `workflow-overlord:workflow-overlord-slice-close` only after both receipts, consent states, and goal screenshot exist.

Do not wait for `direct_contact_click` or `project_proof_click` to close slice 35.

### Task 10: After the Vercel upgrade, reconcile DEV and PROD CMS and regenerate committed content

**Files:**

- Generate: `apps/web/src/lib/content/site-labels.ts`
- Generate: `apps/web/src/lib/content/legal-pages.ts`
- Generate: `apps/web/src/lib/content/generated.manifest.json`
- Update: slice-38 Notion Plan with Vercel/DPA evidence and live reconciliation receipts.

**Interfaces:**

- Consumes: reviewed Tasks 1–8, operator-approved Task 6 copy, and proof that Vercel is no longer Hobby.
- Produces: DEV/PROD `NO CHANGES` convergence and byte-identical live-generated content.

- [ ] **Step 1: Enforce the external commercial-plan gate**

Before any command below, capture evidence that the yesid.dev Vercel account is no longer Hobby and archive the plan/DPA receipt in the legal/operator evidence surface. Update the slice-38 Plan with the receipt date and link. If the account still reports Hobby, stop this task; local work stays committed but unpushed.

- [ ] **Step 2: Load the existing 1Password service-account token safely**

First rebase onto the then-current canonical main so any completed legal-email/operator lane is part of the desired source before a live legal diff:

```bash
git fetch origin
git rebase origin/main
```

Rerun Task 8 Steps 1–4 after the rebase. If the desired non-analytics legal body differs from live CMS, the reconciler must stop on unrelated drift; complete the owning legal lane before this analytics writer proceeds.

Then load secrets:

```bash
export OP_SERVICE_ACCOUNT_TOKEN="$(sed -n 's/^OP_TOKEN=//p' /home/mgkdante/Yesito/projects/yesid.dev/.env)"
test -n "${OP_SERVICE_ACCOUNT_TOKEN}"
export YESID_CMS_ENV=/home/mgkdante/Yesito/projects/yesid.dev/apps/cms/.env
test -f "${YESID_CMS_ENV}"
```

Expected: both `test` commands exit 0 and print nothing.

- [ ] **Step 3: Live-diff, apply, and re-diff DEV**

```bash
op run --env-file="${YESID_CMS_ENV}" -- \
  bun apps/cms/scripts/promote-lean-high-intent-analytics.ts \
  --target=dev --dry-run

op run --env-file="${YESID_CMS_ENV}" -- \
  bun apps/cms/scripts/promote-lean-high-intent-analytics.ts \
  --target=dev --apply

op run --env-file="${YESID_CMS_ENV}" -- \
  bun apps/cms/scripts/promote-lean-high-intent-analytics.ts \
  --target=dev --dry-run
```

Expected: first run plans at most nine narrow PATCHes and no other path; apply writes exactly that plan and verifies it; final run prints `NO CHANGES`. Any unrelated legal drift stops the write for operator review.

- [ ] **Step 4: Export the two DEV modules live and verify provenance**

```bash
op run --env-file="${YESID_CMS_ENV}" -- env \
  PUBLIC_DIRECTUS_URL=https://cms.dev.yesid.dev \
  bun apps/cms/scripts/export-fallbacks.ts --module=legal-pages

op run --env-file="${YESID_CMS_ENV}" -- env \
  PUBLIC_DIRECTUS_URL=https://cms.dev.yesid.dev \
  bun apps/cms/scripts/export-fallbacks.ts --module=site-labels

jq -e '.source == "live"' apps/web/src/lib/content/generated.manifest.json
bun run ci:content
```

Expected: both exports report live source; manifest source is `live`; content integrity passes; only `legal-pages.ts`, `site-labels.ts`, and their manifest hashes change.

- [ ] **Step 5: Save DEV hashes, then live-diff, apply, and re-diff PROD**

```bash
DEV_CONTENT_HASHES="$(sha256sum \
  apps/web/src/lib/content/legal-pages.ts \
  apps/web/src/lib/content/site-labels.ts)"

op run --env-file="${YESID_CMS_ENV}" -- \
  bun apps/cms/scripts/promote-lean-high-intent-analytics.ts \
  --target=prod --dry-run

op run --env-file="${YESID_CMS_ENV}" -- \
  bun apps/cms/scripts/promote-lean-high-intent-analytics.ts \
  --target=prod --apply \
  --confirm=APPLY_PROD_LEAN_HIGH_INTENT_ANALYTICS

op run --env-file="${YESID_CMS_ENV}" -- \
  bun apps/cms/scripts/promote-lean-high-intent-analytics.ts \
  --target=prod --dry-run
```

Expected: PROD has the same narrow plan; final run prints `NO CHANGES`. The CMS update may trigger a content rebuild, which is permitted only because Step 1 proved the account upgrade.

- [ ] **Step 6: Export PROD and prove byte identity with DEV**

```bash
op run --env-file="${YESID_CMS_ENV}" -- env \
  PUBLIC_DIRECTUS_URL=https://cms.yesid.dev \
  bun apps/cms/scripts/export-fallbacks.ts --module=legal-pages

op run --env-file="${YESID_CMS_ENV}" -- env \
  PUBLIC_DIRECTUS_URL=https://cms.yesid.dev \
  bun apps/cms/scripts/export-fallbacks.ts --module=site-labels

test "$(sha256sum \
  apps/web/src/lib/content/legal-pages.ts \
  apps/web/src/lib/content/site-labels.ts)" = "${DEV_CONTENT_HASHES}"
jq -e '.source == "live"' apps/web/src/lib/content/generated.manifest.json
bun run ci:content
```

Expected: hash comparison exits 0, manifest remains live, and committed runtime content now matches both CMS environments.

- [ ] **Step 7: Make the rendered legal gate GREEN**

```bash
EXPORT_FALLBACKS_SKIP=1 bun run --cwd apps/web build
bun run --cwd apps/web test:e2e:prebuilt -- \
  tests/analytics.spec.ts \
  tests/page-content/legal.spec.ts \
  --project=desktop-chrome
```

Expected: all three analytics-station descriptions match approved copy, and all six EN/FR/ES Privacy/Cookies routes render four events, no destination/custom properties, opt-in wording, and the approved revision date.

- [ ] **Step 8: Commit only live-generated content**

```bash
git add \
  apps/web/src/lib/content/legal-pages.ts \
  apps/web/src/lib/content/site-labels.ts \
  apps/web/src/lib/content/generated.manifest.json
git commit -m "chore(content): export high-intent analytics disclosure"
```

### Task 11: Push through review, main, develop, and production

**Files:**

- Repository and GitHub/Vercel state only; no new feature file expected.

**Interfaces:**

- Consumes: all-green Tasks 1–10 and Vercel upgrade evidence.
- Produces: reviewed main/develop integration and verified production deployment.

- [ ] **Step 1: Run verification-before-completion locally**

```bash
bun run --cwd apps/web test
bun run --cwd apps/cms test
bun run --cwd apps/web check
EXPORT_FALLBACKS_SKIP=1 bun run --cwd apps/web build
bun run --cwd apps/web test:e2e:prebuilt -- \
  tests/analytics.spec.ts \
  tests/page-content/legal.spec.ts \
  tests/page-content/projects-detail.spec.ts \
  --project=desktop-chrome
bun run ci:content
git diff --check
git status --short
```

Expected: every command exits 0 and the worktree is clean.

- [ ] **Step 2: Refresh and prove the branch has no unexpected base drift**

```bash
git fetch origin
git rebase origin/main
git log --oneline --left-right origin/main...HEAD
git diff --stat origin/main...HEAD
git diff --name-only origin/main...HEAD | rg '^transit/' && exit 1 || true
```

Expected: rebase succeeds, only intentional slice-38 commits/files remain, and no Transit path. Rerun Step 1 after the rebase before requesting final review.

- [ ] **Step 3: Obtain final code review**

Use `superpowers:requesting-code-review` again against `origin/main...HEAD`. Resolve findings, rerun Step 1, and continue only when the reviewer reports no blocking issue.

- [ ] **Step 4: Push and open the reviewed PR**

```bash
git push -u origin slice/38-lean-high-intent-analytics

gh pr create \
  --base main \
  --head slice/38-lean-high-intent-analytics \
  --title "feat(analytics): add lean high-intent measurement" \
  --body $'## Summary\n- add property-free direct-contact and project-proof events\n- reconcile EN/FR/ES consent and legal disclosure\n- replace broad OPS2 CMS writes with live narrow reconciliation\n\n## Verification\n- web unit/check/build green\n- CMS tests/content integrity green\n- analytics/legal/project browser gates green\n- DEV and PROD CMS post-checks report NO CHANGES\n\n## Guardrails\n- Web3Forms to Proton unchanged\n- automatic outbound/form/file capture remains disabled\n- no custom properties or destination URLs\n- Transit untouched'
```

Expected: push creates the first preview only after Vercel upgrade; PR URL is recorded in slice 38.

- [ ] **Step 5: Wait for CI and verify the preview legal surface**

```bash
gh pr checks --watch
```

After all checks are green, derive the actual preview URL from the GitHub deployment receipt, then run the legal browser file against it using the existing automation bypass secret through 1Password; never print the bypass value:

```bash
DEPLOYMENT_ID="$(gh api --method GET \
  repos/mgkdante/yesid.dev/deployments \
  -f ref=slice/38-lean-high-intent-analytics \
  -f environment=Preview \
  -f per_page=100 \
  --jq 'sort_by(.created_at) | last | .id')"
test -n "${DEPLOYMENT_ID}"
VERCEL_PREVIEW_URL="$(gh api \
  "repos/mgkdante/yesid.dev/deployments/${DEPLOYMENT_ID}/statuses" \
  --jq 'map(select(.environment_url != null)) | first | .environment_url')"
test -n "${VERCEL_PREVIEW_URL}"

export OP_SERVICE_ACCOUNT_TOKEN="$(sed -n 's/^OP_TOKEN=//p' /home/mgkdante/Yesito/projects/yesid.dev/.env)"
op run --env-file=/home/mgkdante/Yesito/projects/yesid.dev/.env -- env \
  PLAYWRIGHT_BASE_URL="${VERCEL_PREVIEW_URL}" \
  bun run --cwd apps/web test:e2e -- \
  tests/page-content/legal.spec.ts \
  --project=desktop-chrome
```

Expected: both receipt variables are non-empty and six legal routes pass on the preview. The analytics event payload file remains a hermetic local-production-host test and is not repurposed for a Vercel hostname where analytics is intentionally disabled.

- [ ] **Step 6: Merge through branch protection and verify production**

After review approval:

```bash
gh pr merge --squash --delete-branch
git fetch origin
```

Wait for the production Vercel deployment attached to the merged main SHA. Verify the six legal routes, `/contact`, and `/projects/yesid-dev` return 200 and show the approved content/interactions. Record merged SHA and deployment URL in slice 38.

- [ ] **Step 7: Reconcile develop through its protected path**

If `origin/develop` is behind the merged `origin/main`, open and merge a main-to-develop sync PR:

```bash
gh pr create \
  --base develop \
  --head main \
  --title "chore: sync lean analytics release to develop" \
  --body $'Sync the reviewed lean high-intent analytics release from main. No additional changes.'
```

Wait for checks and merge using the repository's permitted strategy. Finally run:

```bash
git fetch origin
test "$(git rev-parse origin/main^{tree})" = "$(git rev-parse origin/develop^{tree})"
```

Expected: main and develop trees are byte-identical.

### Task 12: Capture four production receipts and start the clean baseline

**Files:**

- Plausible dashboard, normal browser evidence, Notion slice-38 Plan/Handoff, and canonical Homework only.

**Interfaces:**

- Consumes: deployed reviewed code, exact four goals, PROD disclosure convergence.
- Produces: four-state consent proof, four Realtime goal receipts, excluded QA window, and a dated 30-day review procedure.

- [ ] **Step 1: Run one normal non-automated production matrix**

Use a clean normal browser and these controlled URLs:

```text
https://yesid.dev/contact?utm_source=codex_ops2_qa&utm_medium=qa&utm_campaign=lean_high_intent_rollout
https://yesid.dev/projects/yesid-dev?utm_source=codex_ops2_qa&utm_medium=qa&utm_campaign=lean_high_intent_rollout
```

Record UTC start/end and deployed SHA. Prove:

1. **Unknown/blocked:** no tracker chunk and no `/api/event` request before a choice.
2. **Declined:** eligible clicks produce no request.
3. **Granted:** one successful QA form submit, one booking click, one direct email/phone/WhatsApp click, and one project live-site click each produce exactly one matching event.
4. **Withdrawn:** after changing the choice to **No thanks**, later eligible clicks produce no request.

For every granted request record event name, sanitized current page URL, response status, absence of `p`/custom properties, and that the native action remained usable. Do not put names, messages, contact destinations, or external project URLs into evidence beyond the already-public route/action label.

- [ ] **Step 2: Capture Plausible Realtime**

Within the Realtime window, filter to `utm_source=codex_ops2_qa` and capture all four exact goals:

```text
contact_form_success
booking_click
direct_contact_click
project_proof_click
```

Record screenshot path/URL, UTC window, expected count, actual count, deployed SHA, and the two controlled page paths in the slice-38 Handoff. Record that the visit is controlled QA and must be excluded by UTM source; Plausible has no required annotation dependency for closure.

- [ ] **Step 3: Record rollout and baseline dates**

```bash
BASELINE_START="$(date +%F)"
BASELINE_END="$(date -d "${BASELINE_START} +30 days" +%F)"
printf '%s\n%s\n' "${BASELINE_START}" "${BASELINE_END}"
```

Record both printed dates in the Plan/Handoff. State that custom events count a visit as engaged, so bounce-rate comparisons before and after `BASELINE_START` are not like-for-like. Set no target from the pre-rollout three-visitor sample.

- [ ] **Step 4: Use an exact clean Stats API v2 query at the review date**

On or after `BASELINE_END`, run:

```bash
export OP_SERVICE_ACCOUNT_TOKEN="$(sed -n 's/^OP_TOKEN=//p' /home/mgkdante/Yesito/projects/yesid.dev/.env)"
export PLAUSIBLE_API_KEY="$(op read 'op://yesid-dev/API - Plausible/credential')"

jq -n \
  --arg start "${BASELINE_START}" \
  --arg end "${BASELINE_END}" \
  '{
    site_id: "yesid.dev",
    metrics: ["visitors", "visits", "pageviews", "bounce_rate", "visit_duration"],
    date_range: [$start, $end],
    filters: [["is_not", "visit:utm_source", ["codex_ops2_qa"]]]
  }' \
  | curl --fail-with-body --silent --show-error \
      https://plausible.io/api/v2/query \
      -H "Authorization: Bearer ${PLAUSIBLE_API_KEY}" \
      -H 'Content-Type: application/json' \
      --data-binary @- \
  | tee /tmp/yesid-plausible-clean-aggregate.json

jq -n \
  --arg start "${BASELINE_START}" \
  --arg end "${BASELINE_END}" \
  '{
    site_id: "yesid.dev",
    metrics: ["visitors", "pageviews", "bounce_rate", "time_on_page", "scroll_depth"],
    dimensions: ["event:page"],
    date_range: [$start, $end],
    filters: [["is_not", "visit:utm_source", ["codex_ops2_qa"]]],
    order_by: [["visitors", "desc"]]
  }' \
  | curl --fail-with-body --silent --show-error \
      https://plausible.io/api/v2/query \
      -H "Authorization: Bearer ${PLAUSIBLE_API_KEY}" \
      -H 'Content-Type: application/json' \
      --data-binary @- \
  | tee /tmp/yesid-plausible-clean-pages.json

unset PLAUSIBLE_API_KEY
```

Expected: aggregate and page breakdown exclude the controlled UTM source. Record facts and data-quality limits first; set a target only if the clean sample is large enough to support one.

- [ ] **Step 5: Reconcile Notion and close only when evidence is complete**

Update slice-38 Plan/Handoff with:

- delivered files and commits;
- PR, main/develop trees, and deploy receipts;
- Vercel upgrade/DPA receipt;
- exact DEV/PROD nine-row plans and final `NO CHANGES` reads;
- live-generated manifest provenance and hashes;
- four goals and goal-settings screenshot;
- blocked/declined/granted/withdrawn evidence;
- four Realtime receipts;
- QA UTC window and UTM exclusion;
- rollout/baseline dates and the eventual clean baseline read.

Check or remove canonical Homework items only after their evidence exists. Use `workflow-overlord:workflow-overlord-slice-close` for slice 38 only after the 30-day baseline review is actually recorded. If the review date has not arrived, leave slice 38 in progress with the exact next executable action and date; do not claim it complete.

## Final Verification Matrix

| Surface | Required evidence |
|---|---|
| Event contract | Exact four-name tuple; no `props`; automatic capture still false |
| Contact | mailto/tel/exact HTTPS wa.me only; calendar remains booking; GitHub/LinkedIn/Cal excluded from direct contact |
| Projects | live/public repository only; private state non-link; malformed URLs untracked |
| Consent | unknown, decline, grant, withdrawal; production hostname only; fail-open navigation |
| CMS source | exact EN/FR/ES copy; Privacy/Cookies only; approved revision date |
| CMS writes | live dry-run, at most nine PATCHes, unrelated-drift refusal, post-write `NO CHANGES` |
| Generated content | DEV/PROD byte identity; manifest `source: live`; no hand edit |
| Delivery | reviewed PR; CI green; preview and production receipts; main/develop tree identity |
| Plausible | four exact property-free goals plus 404; four Realtime events; QA excluded |
| Baseline | rollout date, 30-day clean range, no retrospective target, data-quality caveats |
| Scope | Web3Forms→Proton unchanged; Transit untouched |
