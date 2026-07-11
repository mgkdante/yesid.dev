# Lean high-intent analytics design

Date: 2026-07-11

Status: operator-approved design, awaiting written-spec review

Notion slice: [slice-38 — Lean high-intent analytics](https://app.notion.com/p/39a3e863069081e19916cbc1f7f4763e)

## Decision

Keep yesid.dev analytics intentionally small. Use Plausible's built-in page metrics to understand blog, project, service, and locale interest. Preserve the two existing conversions and add only two property-free click events that indicate strong commercial or proof-seeking intent:

- `contact_form_success`
- `booking_click`
- `direct_contact_click`
- `project_proof_click`

Automatic outbound-link, file-download, and form-submission capture remain disabled. No custom properties are sent.

This design is separate from slice-35. Slice-35 still closes when the existing two conversion goals and production receipts are proven. Slice-38 begins implementation only after this spec is reviewed and an implementation plan is approved.

## Questions this measurement must answer

1. Which blog posts, projects, services, and locales attract visits and hold attention?
2. Which pages precede a successful contact form submission or booking click?
3. Which pages lead someone to choose a direct contact channel?
4. Which project pages make someone inspect the live result or source repository?

The design does not attempt to reconstruct individual users or record every interaction.

## Approaches considered

### 1. Manual property-free high-intent events: selected

Track only direct contact and project-proof clicks in addition to the existing conversions. Attribute them with the sanitized current page URL already used by the analytics client.

Benefits:

- answers a real business question;
- stays compatible with the existing no-custom-properties boundary;
- keeps event volume and goal management small;
- avoids storing full destination URLs;
- uses existing consent, domain, sanitation, lazy-load, and withdrawal controls.

Trade-off: `direct_contact_click` does not distinguish email from phone or WhatsApp, and `project_proof_click` does not distinguish live-site from repository clicks. That detail is deliberately deferred until aggregate volume proves it would change a decision.

### 2. Automatic outbound-link tracking: rejected for this phase

This is easy to enable but would count GitHub, LinkedIn, article citations, social links, and other external navigation that is not necessarily commercial intent. Plausible stores the full outbound destination for this event, which adds noise, billing volume, and another data field to disclose.

### 3. Rich content events with custom properties: deferred

A generic event with `content_type`, `content_id`, `placement`, `locale`, or `channel` could calculate card-level click-through rates. It also requires a supported Plausible plan, a larger legal disclosure, more code paths, more event volume, and stronger cardinality controls. Built-in page metrics should be tested first.

## Measurement framework

| Decision | Metric | Source | Initial interpretation |
|---|---|---|---|
| Which content attracts attention? | Unique visitors and pageviews by pathname | Plausible pageviews | Compare pages within the same content type and locale |
| Which content holds attention? | Time on page, scroll depth, bounce, exit rate | Plausible built-in engagement | Use together; no single metric proves quality |
| How do visitors move toward contact? | Entry/exit pages and user journeys ending at a conversion | Plausible built-in journeys plus goals | Work backward from the two conversion goals |
| Are visitors contacting directly? | Unique and total `direct_contact_click` conversions by current page | Custom event | Indicates a high-intent channel launch, not a delivered message |
| Are visitors inspecting project proof? | Unique and total `project_proof_click` conversions by project pathname | Custom event | Indicates proof interest, not client intent or project approval |
| Did contact delivery succeed? | `contact_form_success` | Existing custom event | Fires only after Web3Forms reports success |
| Did someone open booking? | `booking_click` | Existing custom event | Intent only; it does not prove a completed booking |

The initial 30-day baseline has only three visitors and includes untagged QA. No content, conversion, or target decision should be made from that sample. The first review records facts and data quality before it sets targets.

Plausible treats a visit that triggers a custom event as engaged rather than bounced. That behavior is acceptable for these four high-intent events, but the rollout date must be annotated because bounce-rate comparisons across the change are not perfectly like-for-like.

## Event contracts

### `direct_contact_click`

Purpose: measure activation of an approved direct contact channel.

Eligible actions:

- public `mailto:` contact link;
- public `tel:` contact link;
- public WhatsApp link on an approved WhatsApp host.

Current scope: the CMS-backed contact-channel list. Email exists today. Phone and WhatsApp are added by the separate NAP/public-contact lane; this analytics slice does not create those channels.

Rules:

- fire from the user's click handler, once per click;
- send the event name and sanitized current page URL only;
- do not send the destination, channel, label, phone, email, link text, or a custom property;
- do not classify GitHub, LinkedIn, Cal.com, or ordinary HTTPS links as direct contact;
- do not block or delay the native link action when analytics is unavailable.

### `project_proof_click`

Purpose: measure when a visitor leaves a project detail page to inspect public proof.

Eligible actions:

- a rendered project `liveUrl` link;
- a rendered public project `repoUrl` link.

Rules:

- instrument the shared `ProjectLinksCard` so desktop and mobile renderings follow one contract;
- fire from the user's click handler, once per click;
- send the event name and sanitized current project page URL only;
- do not send the external URL, project title, repository visibility, link label, or a custom property;
- do not fire for the non-link private-repository state;
- do not block or delay navigation when analytics is unavailable.

### Existing event guarantees

- `contact_form_success` keeps firing only after a successful Web3Forms response.
- `booking_click` keeps covering the current homepage and contact-page Cal.com links.
- Their names and payload shapes do not change in this slice.

## Analytics data flow

1. A visitor makes a saved explicit analytics choice.
2. Before consent, no tracker module, tracker request, pageview, or custom event loads or sends.
3. An eligible click calls the existing analytics facade with one allowed event name.
4. The existing client confirms the production hostname and current consent state.
5. The existing URL sanitizer keeps the pathname and allowed acquisition parameters, while removing private query state.
6. The tracker sends the event without `props`.
7. Provider errors fail open and never interrupt the visitor action.
8. Consent withdrawal prevents later events without deleting or rewriting earlier aggregate data.

## Privacy and data minimization

Never send:

- names, email addresses, phone numbers, messages, form fields, validation text, or response bodies;
- direct-contact destinations or project external URLs;
- custom properties;
- raw search or filter text;
- `bp`, `stack`, arbitrary technology selections, or other internal query state;
- mouse movement, hover, focus, theme, menu, replay, or per-keystroke activity;
- manually generated scroll milestones.

The current page path is public site structure, not visitor-supplied content. Existing acquisition-key allowlisting remains the only query-string exception.

## Automatic capture configuration

Keep these NPM tracker options unchanged:

```ts
outboundLinks: false,
fileDownloads: false,
formSubmissions: false,
```

Reasons:

- outbound capture is broader than the approved high-intent scope;
- the site has no meaningful download funnel to measure;
- automatic form tracking could count attempts and duplicate the accurate post-success event.

Plausible account-side automatic goals do not override these code settings and are not evidence that the corresponding events are being sent.

## Component boundaries

- Event type and sending contract: `apps/web/src/lib/utils/analytics.ts`
- Browser facade: `apps/web/src/lib/analytics/client.ts`
- Direct-contact call site: CMS-backed channels in `ContactPage.svelte`
- Project-proof call site: `ProjectLinksCard.svelte`
- Existing conversion call sites: `ContactPage.svelte` and `HeroTextContent.svelte`
- Consent lifecycle: existing analytics consent components and client

No global click listener or DOM scraping is introduced. Each eligible component owns its explicit semantic event.

## Error handling

- Missing, malformed, or ineligible links do not emit an event.
- A tracker import failure, provider rejection, consent read failure, or send exception is swallowed by the existing fail-open client.
- Navigation and contact actions continue normally.
- No retries are added. Repeated provider retries could inflate events or delay navigation.

## Test design

Implementation begins with failing tests for:

1. the exact four-event allowlist;
2. property-free payloads and sanitized current URLs;
3. no sends before consent, after decline, after withdrawal, on localhost, or on a non-production hostname;
4. direct contact classification for approved `mailto:`, `tel:`, and WhatsApp links only;
5. no direct-contact event for GitHub, LinkedIn, Cal.com, or other HTTPS links;
6. one `project_proof_click` for live and public repository links;
7. no project-proof event for a private-repository non-link;
8. unchanged `contact_form_success` and `booking_click` behavior;
9. unchanged disabled automatic-capture configuration;
10. browser interception proving no `props`, no private query parameters, and no duplicate event per click.

## Plausible account setup

Before production receipts:

1. remove the mistakenly created custom-property names `contact_form_success` and `booking_click`;
2. create four Custom event goals with names matching the event names exactly;
3. use the UI unless the operator supplies a valid Enterprise Sites API key; the current stored key returned HTTP 401 for writes;
4. verify the goal list through the read-only API;
5. generate events only after the goals exist because Plausible does not backfill earlier events.

## Legal and consent reconciliation

The current public privacy copy describes two conversion events and says no custom properties are sent. The no-custom-properties statement remains true, but the event description must expand to the two additional high-intent interactions in EN, FR, and ES.

The consent prompt must remain plain-language and materially equivalent across the three locales. Exact copy is operator-reviewed before CMS promotion. CMS changes follow dry-run-first DEV and PROD reconciliation, then fallback export and runtime verification.

## Rollout and deployment gate

1. Operator reviews this written spec.
2. Write the implementation plan.
3. Implement locally with TDD on `slice/38-lean-high-intent-analytics`.
4. Do not push the branch while the Vercel account remains Hobby because branch pushes create preview deployments.
5. Operator upgrades Vercel and archives the plan/DPA receipt.
6. Run CMS dry runs, approved copy writes, fallback export, and the complete local verification suite.
7. Push, open the reviewed PR, and let CI and the preview deploy complete.
8. Promote through the normal branch path only after review.
9. Add the four goals before generating any production receipt.
10. Run the blocked, declined, granted, and withdrawal matrix in a normal browser.
11. Tag controlled QA with `utm_source=codex_ops2_qa`, confirm all four events in Realtime, and filter or annotate the QA window.
12. Review the first clean 30-day baseline without setting retrospective targets.

## Completion conditions

This slice closes only when code, CMS copy, committed fallbacks, tests, CI, deployment, four exact goals, the consent matrix, four Realtime receipts, QA annotation, and the baseline procedure are all evidenced. The existing slice-35 closeout is not held open by this later instrumentation.
