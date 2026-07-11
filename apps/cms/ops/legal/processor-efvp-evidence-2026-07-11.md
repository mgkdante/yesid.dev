# yesid.dev processor register and EFVP-style evidence record

Prepared: 2026-07-11  
Evidence cutoff: 2026-07-11, America/Toronto  
Status: **evidence prepared; adequacy conclusions, contract acceptance receipts, operator decisions, and licensed Quebec legal review remain incomplete**

This is an operational evidence record, not legal advice and not a completed evaluation of privacy factors (EFVP). It organizes facts for the operator and a licensed Quebec legal advisor. It does not assert that any provider offers adequate protection under section 17, that any contract satisfies section 18.3, or that any public legal copy is approved.

Scope is the yesid.dev public site, contact delivery, booking, and analytics. Transit is excluded.

## Decision summary

1. **Do not activate the planned Vercel to Resend contact path yet.** The authenticated Vercel team is on Hobby, whose terms limit use to personal or non-commercial use, and Vercel's DPA applies to Pro and Enterprise. Resend account, DNS, contract, key, and delivery evidence are also missing.
2. **Web3Forms is still the live legacy contact relay and its record is incomplete.** No authenticated plan, agreement, subprocessor, domain-restriction, integration, or account-setting receipt was captured. Its official pages also conflict on whether submissions are stored and for how long. It must not inherit a completed outside-Quebec assessment by implication.
3. **Cal.com is live but its processor record is incomplete.** The public booking configuration currently requires name and email, permits optional notes and guest email addresses, and creates a Daily.co meeting. An authenticated DPA, subprocessor export, account security receipt, retention settings, and connected calendar/email inventory were not available in this review.
4. **Plausible is live behind explicit opt-in and has public contract and data-handling evidence plus narrow project controls.** The code sends pageviews and two named events without custom properties. A dated account-side DPA/source snapshot, account access review, operational browser/dashboard receipts, and licensed Quebec assessment are still required before calling the legal lane complete.
5. **The live EN/FR privacy policy overstates the current evidence.** Its completed-assessment statement applies in practice to current Vercel hosting, Web3Forms contact delivery, Proton mailbox storage, Cal.com booking, and Plausible analytics even though the Vercel, Web3Forms, Proton, and Cal.com records remain incomplete and no licensed conclusion is recorded here. The intended Resend flow is a separate future change and cannot be added to that statement until its own gates are satisfied. The public statement must be corrected or substantiated before the final copy freeze.
6. **No provider receives an “adequate protection” conclusion in this record.** That decision belongs to the operator with licensed Quebec advice after the written agreements and authenticated settings are reviewed.

## Evidence and truth boundaries

### Canonical internal sources

- The private canonical Homework page: legal/operator items and completion rule.
- Private OPS3 Research: provider preflight and intended data flow.
- Private OPS3 Plan and Handoff: implementation, verification, and hard production gates.
- The private canonical confidentiality incident register.
- Draft PR #341, commit `3fc07db085cf0a80b26b3c00ef9334b8ef3cd248`: intended contact implementation, deliberately unmerged and not deployed.

### Live and repository observations made on 2026-07-11

- `origin/main` and this worktree start at `283681320e0e50c4a338d1cc5362b88aee912f25`.
- `https://yesid.dev/contact` returned HTTP 200 from Vercel. Current source and generated content post the form to `https://api.web3forms.com/submit` and retain a visible direct-email link.
- Vercel's authenticated team API returned `billing.plan = hobby` for `mgkdantes-projects`.
- Vercel production environment inventory contained `WEB3FORMS_ACCESS_KEY` and `VITE_WEB3FORMS_ACCESS_KEY`; it contained no `RESEND_API_KEY`.
- The public [English privacy policy](https://yesid.dev/legal/privacy) and [French privacy policy](https://yesid.dev/fr/legal/privacy) identify Web3Forms as the live contact relay and state that adequate protection was assessed for providers outside Quebec.
- The public [English legal notice](https://yesid.dev/legal/notice) and [French legal notice](https://yesid.dev/fr/legal/notice) publish the operator's full name and a Gatineau address, while the site footer presents Montreal as the service location.
- `https://cal.com/yesid-dev` redirected to the live 20-minute event. Its public event configuration requires name and email; exposes optional notes and additional-guest email fields; uses Daily.co for the meeting; and has no workflows configured. This observation does not prove the private account's retention, MFA, calendar, email, or analytics settings.
- The shipped Plausible client loads only after stored choice `granted`, stops future events after withdrawal, and emits `contact_form_success` and `booking_click` without custom properties. Dashboard goals and final normal-browser receipts are separate OPS2 gates.
- No CMS, DNS, provider, Notion, or other external state was changed while preparing this record.

## Processing map

```text
CURRENT CONTACT
browser -> Web3Forms -> Proton Mail inbox -> operator

PLANNED CONTACT, NOT ACTIVE
browser -> Vercel /api/contact -> Resend -> Proton Mail inbox -> operator

DIRECT EMAIL
visitor email provider -> Proton Mail inbox -> operator

BOOKING
browser -> Cal.com -> Daily.co meeting + operator calendar/email integration
                         (private integration identities not inspected)

ANALYTICS, ONLY AFTER EXPLICIT GRANT
browser -> Plausible Analytics Cloud -> aggregate dashboard -> operator
```

Published pages are generated from the CMS and served by Vercel. Source and runtime inspection found no direct browser request from the published site to Railway, Neon, or Directus. Server-side build, revalidation, CMS administration, and deployment traffic remain separate processing paths outside that direct-browser boundary and require their own inventory. Reassess the visitor-data flow if runtime CMS calls or other browser-facing integrations are introduced.

## Assessment method

Quebec's private-sector Act requires an EFVP for a project that develops or overhauls an information system or electronic service involving personal information, with proportionality based on sensitivity, purpose, quantity, distribution, and storage medium ([section 3.3](https://www.legisquebec.gouv.qc.ca/en/version/cs/p-39.1?code=se%3A3_3)). Before personal information is communicated or entrusted outside Quebec, the assessment must consider sensitivity, purpose, safeguards including contractual safeguards, and the foreign legal framework. Communication is permitted only if adequate protection is established and a written agreement accounts for the assessment and mitigations ([section 17](https://www.legisquebec.gouv.qc.ca/fr/version/lc/p-39.1?code=se%3A17&langCont=en)). A service contract must address confidentiality, purpose limitation, end-of-contract retention, incident notice, and verification ([section 18.3](https://www.legisquebec.gouv.qc.ca/fr/version/lc/P-39.1?code=se%3A18_3&langCont=en)).

The [CAI EFVP guide](https://www.cai.gouv.qc.ca/uploads/pdfs/CAI_GU_EFVP.pdf) treats an EFVP as an evolving record of legal compliance, privacy risks, and mitigation strategies. This file follows that structure but stops short of legal conclusions.

The [Office of the Privacy Commissioner of Canada](https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/pipeda_brief/) states that Quebec has substantially similar private-sector legislation and that PIPEDA can still apply to personal information crossing provincial or national borders in commercial activity. Exact application to yesid.dev remains an advisor question.

## Processor register

| Provider | Live role | Personal-information boundary | Main location/transfer evidence | Contract evidence | Project disposition |
|---|---|---|---|---|---|
| Vercel | Live host; planned contact runtime | Every request exposes network/request metadata. Planned endpoint would receive name, email, message, honeypot, IP and User-Agent. | Vercel DPA says primary processing is in the US and may occur wherever Vercel/subprocessors operate. | Public DPA applies only to Pro/Enterprise. Authenticated account is Hobby. | **Block contact cutover. Operator hosting/plan decision required. Adequacy not concluded.** |
| Web3Forms | Live legacy contact relay | Browser sends name, email, message, provider access key and request metadata. Account-side integrations and extra fields are unknown. | Official FAQ says US-East processing and identifies an India-registered parent. | No authenticated plan, agreement/DPA, subprocessor list, domain restriction, integration inventory, or account settings were captured. | **Incomplete live record. Clarify contradictory retention claims, limit exposure, and revoke after proven cutover. Adequacy not concluded.** |
| Resend | Intended contact relay; not live | Planned text-only email contains name, email, message, Reply-To and delivery metadata. No attachment or tracking property is sent by code. | Resend says account data, logs, metadata and API records stay in the US regardless of sending region. | Public DPA exists, but the correct-team executed copy and acceptance receipt were not captured. | **Block. Credential, contract, DNS, settings, send, and advisor evidence required. Adequacy not concluded.** |
| Proton Mail | Live destination for direct and relayed contact | Stores message content, attachments if sent by direct email, sender/recipient data and SMTP metadata; operator inbox practices are part of retention. | Proton is based in Switzerland. External inbound email can traverse non-Proton systems before Proton receives and protects it. | Public business DPA exists, but account plan/applicability, acceptance, access, MFA, recovery, retention and deletion receipts were not captured. | **Incomplete live record. Provider role and transfer treatment require advisor review; operator mailbox controls are required. Adequacy not concluded.** |
| Cal.com | Live booking service | Required name/email; optional notes and guest emails; meeting/timezone metadata; Daily.co video; private calendar/email integrations unknown. | Public privacy policy says data may be transferred to and processed in the US. | Public security page links an authenticated DPA download. No executed DPA or current subprocessor export was captured. | **Incomplete live record. Minimize fields and collect authenticated evidence. Adequacy not concluded.** |
| Plausible | Live, consent-gated analytics | Page URL, referrer/campaign, browser/OS/device categories, approximate geography, pageviews and two named events; raw IP/UA processed transiently; no form fields or custom properties. | Provider says visitor data is stored in Germany and does not leave the EU. | Public DPA says it applies automatically by service use. No dated account receipt/source snapshot was archived here. | **Operational controls evidenced; legal record still needs operator/advisor sign-off. Adequacy not concluded.** |

Web3Forms must remain only until a proven cutover, then its credential must be revoked. Proton evidence remains necessary whichever relay is selected.

## Provider assessments

### Vercel

**Purpose and necessity.** Vercel serves the public site. PR #341 would also make it the same-origin execution boundary for the contact form so the browser no longer sends a provider key directly to an email relay.

**Data and sensitivity.** Ordinary hosting exposes IP address, User-Agent, path, time, and other request metadata. The planned endpoint would additionally process name, email address, free-text message, and honeypot. The intended subject matter is ordinary business contact, but a visitor can place sensitive information in free text. Volume is expected to be small but has not been fixed as an assessment value.

**Evidenced safeguards.** The intended code has a strict 16 KiB body limit; strict field lengths; JSON-only and same-origin checks; a no-send honeypot; generic no-store responses; no body logging; a fixed destination; and no retry. A bounded WAF rule remains unconfigured. Vercel's DPA describes AES-256 at rest, TLS 1.2 or higher, subprocessor contracts, incident notice, audit material, and customer deletion/export controls ([DPA](https://vercel.com/legal/dpa)). Those DPA controls cannot be counted as a contract receipt for the current Hobby account.

**Location and transfers.** Vercel says primary processing facilities are in the United States and data may be processed anywhere Vercel or its subprocessors operate. The current subprocessor list is available through the [Vercel Trust Center](https://security.vercel.com/) but no dated export was archived in this review.

**Retention and deletion.** Vercel documents one hour of accessible Hobby runtime logs ([runtime logs](https://vercel.com/docs/logs/runtime)). PR #341 does not log message bodies. The public material reviewed does not establish the full retention period for all request/system metadata on Hobby. The DPA calls for customer-data deletion in a commercially reasonable timeframe after termination, subject to legal retention, but that DPA does not apply to Hobby.

**Contract and legal gap.** The current [Vercel terms](https://vercel.com/legal/terms) limit Hobby to personal or non-commercial use. The public [Vercel DPA](https://vercel.com/legal/dpa) applies to Pro and Enterprise. yesid.dev presents a freelance commercial practice. This creates both a commercial-use gate and a missing processor-contract gate.

**Required mitigation before contact activation.** Operator authorizes Pro with an applicable agreement and archives the DPA/subprocessor/version receipt, or selects a different compliant host. Then the operator configures and proves the WAF rule, confirms log/body controls, and has the section 17/18.3 position reviewed. Until then, no adequate-protection conclusion is recorded.

### Web3Forms, legacy live relay

**Purpose and current necessity.** Web3Forms currently relays the public contact form to the operator's Proton inbox. It is a temporary legacy dependency, not the intended end state. Removing it before another route is proven would break the public form, while leaving it indefinitely preserves a browser-delivered provider credential and an incomplete processor record.

**Data and sensitivity.** The current browser request includes name, email address, free-text message, provider access key, and ordinary network/request metadata. Free text can contain sensitive information. Authenticated settings were unavailable, so optional integrations, extra captured fields, notification recipients, access history, abuse controls, and domain restrictions were not verified.

**Location and retention conflict.** Web3Forms' official [FAQ](https://docs.web3forms.com/getting-started/faq) says submissions are processed and forwarded without being stored, while server logs may contain personal information and are deleted every two months. It says servers are in US-East and identifies Web3Forms as a subsidiary of Web3Creative registered in Kerala, India. A separate official [HTML contact-form page](https://web3forms.com/platforms/html-contact-form) says submissions are stored for 30 days on the free plan and one year on the pro plan. These official statements conflict. This record does not select one as the operative retention fact.

**Contract and account gap.** No authenticated plan receipt, applicable agreement or DPA, current subprocessor list, account-owner/access/MFA receipt, domain-restriction setting, integration inventory, retention clarification, incident contact, deletion procedure, or destination audit was captured. The current credential is delivered to browsers as part of the live client-side integration. That observed behavior does not prove misuse, but it makes provider-side restriction and post-cutover revocation evidence important.

**Required mitigation.** While the legacy form remains live, capture the correct account, plan, applicable terms/DPA, subprocessors, destination, integrations, domain restriction, abuse controls, access/MFA, retention clarification, incident route, and deletion procedure. Do not claim a completed outside-Quebec assessment without the written analysis. After a controlled replacement succeeds, remove the production variables, verify the browser no longer calls Web3Forms, revoke the access key, and record the revocation receipt.

### Proton Mail

**Purpose and necessity.** Proton Mail is the live destination for direct email and Web3Forms-relayed messages and is the intended destination for Resend-delivered messages. An operator mailbox is necessary for replying to inquiries, but provider storage and operator retention still need limits.

**Data and sensitivity.** The mailbox can hold message bodies, attachments from direct email, sender and recipient addresses, subject lines, timestamps, reply history, and delivery metadata. Proton's [Mail privacy policy](https://proton.me/mail/privacy-policy) describes SMTP metadata including sender, recipient, originating IP, attachment names, subject, and timestamps. It also explains that inbound messages from external providers are scanned in memory before being encrypted for storage. A visitor may send sensitive information despite the business-contact purpose.

**Location and safeguards.** Proton identifies its service entity and Swiss privacy framework in its [privacy policy](https://proton.me/legal/privacy). Its public [mail security material](https://proton.me/mail/security) describes zero-access encryption for stored mailbox data and the limits on end-to-end protection when communicating with external email providers. Two-factor authentication is available, but no authenticated MFA, active-session, recovery, forwarding, filter, delegate, or third-party-client receipt was captured for this mailbox.

**Contract, role, and retention gap.** Proton publishes a [DPA](https://proton.me/legal/dpa) for business and organization customers. The current mailbox plan, DPA applicability/acceptance, account owner, access list, recovery channels, export/deletion controls, active-session inventory, and operator inquiry-retention rule were not captured. Provider terms also distinguish account-level retention from the operator's decision to keep or delete individual messages. Whether Proton is a processor for every direct-email scenario, and how Swiss and transit-provider flows should be classified, are licensed-advisor questions rather than conclusions in this record.

**Required mitigation.** Capture plan and DPA applicability, account access/MFA/recovery/session evidence, forwarding/filter/client inventory, provider retention/deletion terms, incident contact, export/deletion test, and a mailbox deletion schedule for inquiries. Inspect authentication headers on the controlled production send without committing message content or headers to git. Record only a redacted receipt in the private evidence store.

### Resend, intended and not active

**Purpose and necessity.** Resend is the intended sending-only relay from `form@forms.yesid.dev` to the operator's Proton inbox. It removes the browser-visible relay key and gives the sender an authenticated domain. It is not in production.

**Data and sensitivity.** Each successful contact would send name, email, free-text message, Reply-To, sender/recipient addresses, subject, timestamps, delivery status, and provider metadata. PR #341 sends text only, has no attachments, and sends no open/click tracking fields. Free text can still contain sensitive information. Resend's DPA also says message content and metadata are processed and that optional tracking could collect recipient/device information ([DPA](https://resend.com/legal/dpa)).

**Evidenced provider safeguards.** Resend documents encrypted datastores, TLS 1.3 or higher, access controls, vulnerability testing, breach notice without undue delay, subprocessor contracts, audit rights, and deletion/export controls ([security](https://resend.com/docs/security), [DPA](https://resend.com/legal/dpa)). Open and click tracking are disabled by default, but the live domain setting must still be captured ([tracking](https://resend.com/docs/dashboard/domains/tracking)). The intended project controls are account 2FA, a domain-restricted sending key, sending-only capability, enforced TLS, exact provider-returned SPF/DKIM, subdomain DMARC, tracking off, and a controlled header inspection.

**Location and subprocessors.** Resend says sending region controls routing only; account data, including email metadata, logs and API records, remains in the United States ([regions](https://resend.com/docs/dashboard/domains/regions)). Its [subprocessor list](https://resend.com/legal/subprocessors) was last updated 2025-12-31 and lists multiple US providers.

**Retention and deletion.** Resend's 2026 retention announcement lists 30 days for Free, Pro and Scale event data, with flexible Enterprise retention ([retention announcement](https://resend.com/changelog/webhooks-ingester)). The DPA separately says customer data is processed while the agreement is active and deleted within 90 days after account termination. These are different layers and must not be collapsed into one “30-day email” claim. The official [security landing page](https://resend.com/security) and [security documentation](https://resend.com/docs/security) have also reported different backup-retention periods; the current contractual/plan value should be confirmed with Resend before approval.

**Contract and current-state gap.** The DPA says it becomes binding on agreement acceptance and that an executed copy is available in the dashboard. No correct-team executed copy was captured. The stored setup credential is invalid, `forms.yesid.dev` is unconfigured, Vercel has no production key, no controlled send exists, and no authentication headers have been inspected.

**Required mitigation before activation.** Capture the executed DPA and account terms, current subprocessor snapshot, account owner and 2FA receipt, retention clarification, incident contact, and deletion procedure. Create the domain using only exact returned DNS records, keep Proton apex mail unchanged, use a restricted key, keep tracking off, enable enforced TLS, and prove SPF/DKIM/DMARC plus Reply-To in Proton. A licensed advisor must assess the written terms against sections 17 and 18.3. Until then, no adequate-protection conclusion is recorded.

### Cal.com

**Purpose and necessity.** Cal.com provides an optional 20-minute booking route. A scheduling service is useful, but each field and integration still needs a necessity test.

**Data and sensitivity.** The public live configuration requires name and email. It permits optional free-text notes and additional-guest email addresses, creates a Daily.co meeting, and processes scheduling/timezone metadata. A visitor can place sensitive information in notes, and a booker can submit another person's email as a guest. Private calendar and email integration identities were not inspected.

**Evidenced safeguards.** Cal.com publicly describes encryption in transit and at rest, MFA, access reviews, monitoring, annual external penetration testing, SOC 2 Type II and ISO 27001 ([security](https://cal.com/security)). The public privacy policy describes purpose-based retention, US transfer, data-subprocessor obligations, deletion requests, and use of analytics and communications providers ([privacy](https://cal.com/privacy)). These public statements are not a substitute for the account's agreement and settings.

**Location, transfers, and retention.** Cal.com's public privacy policy, marked effective 2023-10-24, says data from outside the US is transferred to and processed in the US. It retains personal data as long as needed for stated purposes, legal obligations, disputes, and agreements, without a booking-specific fixed period. The policy identifies subprocessors by category and some services, but the authenticated current subprocessor document was not captured.

**Contract and settings gap.** Cal.com's security page routes DPA downloads to authenticated account settings. No executed DPA, subprocessor export, data-hosting selection, MFA receipt, account-access list, booking deletion setting, connected calendar/email inventory, reminder configuration, or analytics opt-out receipt was available. The public event shows no workflows, but that alone is not an account audit.

**Required mitigation.** Operator signs in and exports the DPA, subprocessor list, security/account-access receipt, hosting region, retention/deletion controls, and integration inventory. Decide whether notes and guest emails are necessary; disable them if not. Confirm whether Daily.co is necessary and whether any recording is possible or enabled. Disable unnecessary analytics/marketing features where the account permits. A licensed advisor must review the written terms and US transfer. Until then, no adequate-protection conclusion is recorded.

### Plausible Analytics Cloud

**Purpose and necessity.** Plausible measures aggregate site usage and the two named conversions. yesid.dev applies an explicit opt-in gate even though Plausible's own materials say its standard service does not require analytics consent under EU cookie rules.

**Data and sensitivity.** The provider records hostname/path, allowed referral/campaign parameters, referrer, browser, operating system, device category, approximate country/region/city, pageviews, and named events. Each HTTP request contains IP address and User-Agent; Plausible says it creates a daily identifier using a rotating salt, then never stores the raw values. The project does not send form fields or custom properties. Plausible explicitly prohibits personal information in custom properties ([custom properties](https://plausible.io/docs/custom-props/introduction)). Whether transient IP processing or the resulting event data is personal information for a specific Quebec analysis remains an advisor question; this record treats it conservatively.

**Evidenced safeguards.** The code does not import or request the tracker before grant, stops future events after withdrawal, and sends no `props`. Plausible documents HTTPS, encrypted EU hosting, a daily salt deleted every 24 hours, no stored raw IP/User-Agent, access controls, 2FA availability, secure backups, subprocessor contracts, and breach notice within 48 hours ([DPA](https://plausible.io/dpa), [data policy](https://plausible.io/data-policy), [security](https://plausible.io/security)).

**Location and subprocessors.** Plausible says visitor data is processed and stored in Germany on European-owned infrastructure and does not leave the EU. Its public privacy policy identifies Hetzner, Bunny, UpCloud and other account-level service providers ([privacy](https://plausible.io/privacy)). Optional integrations can change that boundary and must remain disabled unless separately assessed.

**Retention and deletion.** Site measurement data remains while the account is active. The operator can permanently delete site data or the account without undue delay. The current yesid.dev operator retention decision is not documented beyond that provider maximum, so a review cadence and deletion trigger remain open.

**Contract and remaining gap.** Plausible's DPA says use constitutes acceptance and no separate signature is required. The operator still needs a dated DPA/subprocessor snapshot, account owner/access/2FA review, optional-integration inventory, and an explicit site-statistics retention decision. The licensed advisor must decide the Quebec section 17/18.3 treatment. No adequate-protection conclusion is recorded here.

## Cross-provider risks and controls

| Risk | Current control | Remaining action |
|---|---|---|
| Visitors put sensitive material in free text | Contact limits, no attachments in planned Resend path, fixed destination | Operator/advisor decides whether to add a plain warning; document deletion workflow; minimize Cal.com notes/guests. |
| Provider/account compromise | Provider security controls; scoped application behavior | Capture operator MFA and access-review receipts for Vercel, Web3Forms, Resend, Proton, Cal.com and Plausible; remove stale users/keys. |
| Over-collection or secondary use | Fixed contact envelope; Plausible no custom props; no Cal workflows visible | Export account settings and disable unnecessary Cal/Resend tracking, integrations, guests, notes, or marketing. |
| Cross-border processing without a complete record | Public contracts and this factual inventory | Licensed section 17 analysis, legal-framework review, written-agreement verification, mitigation record, dated approval. |
| Retention claims blur provider and operator layers | Provider facts separated above | Operator adopts a deletion schedule for inquiries, bookings, mailbox records and analytics; advisor confirms periods. |
| Public copy drifts from runtime | CMS drafts, generated fallbacks, dry-run promoters | Freeze only after live runtime, contracts and settings match; verify EN/FR pages after controlled promotion. |
| Incident evidence leaks into the public repo | A private restricted incident register is canonical | Keep victims, raw messages, credentials, headers and forensic details out of git; reference only restricted evidence locations. |

## Confidentiality incident register evidence

The private canonical confidentiality incident register exists and recorded zero incidents as of 2026-07-11. It contains fields for discovery and occurrence dates, cause, information categories, affected people, systems/providers, containment, serious-injury analysis, notices, mitigation, corrective actions, provider communications, evidence location, and destruction date. The record correctly says that an empty register proves only that the register exists, not that no historical incident occurred outside the reviewed evidence.

The [CAI incident guidance](https://www.cai.gouv.qc.ca/protection-renseignements-personnels/information-entreprises-privees/incidents-confidentialite-mesures-securite-entreprises) requires the register to be updated and retained for at least five years after the enterprise became aware of the incident. Remaining operational evidence:

- verify the private page's access list and record the quarterly access review;
- record provider security contacts and escalation routes;
- test that the operator can create an entry without placing incident data in the public repository;
- keep a five-year minimum retention date on every future entry;
- involve the licensed advisor when serious-injury risk or notice obligations are uncertain.

## Legal identity, NEQ, address, and NAP questions

The public legal notice currently identifies the operator by full name and publishes a Gatineau address. Marketing surfaces and the footer present Montreal. The tracked legal draft's advisor notes record the operator's statement that there is no NEQ, but no current Registraire extract or licensed conclusion was supplied.

Quebec states that a natural person operating a sole proprietorship under a name that does not include their first and last names must register, while registration can be voluntary when the operating name includes both ([registration guidance](https://www.quebec.ca/en/businesses-and-self-employed-workers/start-entreprise/register-constitute-enterprise/learn-about-registration/about-registration)). Because the public brand is `yesid.dev`/`yesid.`, the operator must not treat the current “no NEQ” note as settled legal status.

Current EN/FR/ES site and profile drafts also describe the operator with `engineer`, `ingénieur`, and `ingeniero` titles. No OIQ membership or permit receipt was inspected. Section 22 of Quebec's Engineers Act prohibits a person who is not an engineer from assuming the title alone or with qualifiers, or using a designation that may lead people to believe the person is authorized to practise engineering ([Engineers Act, section 22](https://www.legisquebec.gouv.qc.ca/en/version/cs/I-9?code=se%3A22)); the OIQ likewise says only members may use the title ([OIQ guidance](https://www.oiq.qc.ca/en/general-public/protection-of-the-public/reporting-illegal-practice-of-engineering/)). This record does not decide whether every translation, job title, service label, or trade-name use is prohibited. Until membership or licensed advice is evidenced, new public person-title copy should use a non-reserved description such as `developer` or `digital infrastructure specialist` instead.

Before copy freeze and directory publication, the operator and licensed advisor must resolve and privately evidence:

1. exact legal name and sole-proprietor status;
2. current Registraire search/extract and whether an NEQ exists or registration is required for the public trade name;
3. whether `yesid.dev`/`yesid.` must be declared as another name used in Quebec;
4. OIQ membership/permit status and whether the current EN/FR/ES person titles, service labels, and business descriptions may be used; otherwise approve safe replacement wording;
5. which lawful address must appear on legal pages, and whether publishing a residential address is necessary and accepted by the operator;
6. how the Gatineau legal address and Montreal service-area marketing can coexist without misleading public NAP data;
7. the public email plus phone or WhatsApp choice for profiles and directories;
8. one approved NAP record applied consistently to the site, Google Business Profile, LinkedIn, Upwork, and directories.

This record makes no NAP decision and does not repeat the full street address already visible on the live legal notice.

## EN/FR legal copy-freeze checklist

- [ ] Current production transport is named accurately. It is Web3Forms today; Vercel/Resend wording is published only after the controlled cutover.
- [ ] Web3Forms copy matches the actual plan, US-East/India boundary, account settings, integrations, domain restriction and provider-confirmed retention; the key-revocation date is added after cutover.
- [ ] Proton copy matches the actual mailbox plan, DPA applicability, Swiss processing, external-mail limits, metadata, access controls and operator deletion schedule.
- [ ] The sentence claiming adequate-protection assessments were completed is either supported by completed section 17 evidence or replaced with accurate pending language.
- [ ] Vercel plan, DPA applicability, request/body behavior, locations, retention and subprocessors match authenticated receipts.
- [ ] Resend domain, sending region, US storage, tracking state, retention layers, TLS, DNS, key scope and controlled-send headers match receipts.
- [ ] Cal.com copy matches the actual required/optional booking fields, Daily.co use, connected integrations, retention and account settings.
- [ ] Plausible copy matches consent behavior, event names, no-custom-property boundary, EU hosting and deletion controls.
- [ ] Provider incident-notice, confidentiality, purpose-limitation, end-of-contract deletion and verification terms have been checked against section 18.3.
- [ ] Operator inquiry, booking, mailbox and analytics retention periods are explicit and do not misstate provider retention.
- [ ] Functional `localStorage` and transient locale-handoff `sessionStorage` statements match the deployed code.
- [ ] OIQ membership/title evidence or licensed replacement guidance supports every public `engineer`, `ingénieur`, `ingeniero`, `engineering`, and `ingénierie` person, service, and business-name use across EN/FR/ES.
- [ ] Legal name, sole-proprietor description, NEQ/trade-name decision, address and NAP are operator-approved and source-backed.
- [ ] EN and FR have the same provider list, purposes, categories, transfers, retention, rights, security caveats and effective date.
- [ ] A qualified French legal-language pass confirms terminology and equivalence rather than relying only on translation parity.
- [ ] The five legal routes, `privacy`, `terms`, `cookies`, `accessibility`, and `notice`, plus their CMS rows and committed fallbacks are byte/revision reconciled after a dry run and controlled promotion.
- [ ] Live EN/FR routes are checked in a clean browser for content, links, canonical, locale switch and mobile rendering.
- [ ] Operator records factual approval; a real licensed Quebec legal advisor supplies a documented legal review. No agent checkbox substitutes for either.

## Exact remaining gates

### Operator or authenticated-account gates

1. Choose and authorize Vercel Pro with applicable contract evidence, or choose another compliant host.
2. Export and archive the applicable Vercel DPA/terms, subprocessor list, plan receipt and account access/MFA evidence.
3. Configure and prove the bounded Vercel WAF rule; capture production runtime-log settings/retention and evidence that contact request bodies and response details are not logged or exposed.
4. While Web3Forms remains live, capture its correct account and plan, applicable agreement/DPA, subprocessors, access/MFA, destination, domain restriction, integrations, abuse controls, incident route, deletion process, and written clarification of the conflicting official retention statements.
5. After a proven contact cutover, verify the browser no longer calls Web3Forms, remove its production environment variables, revoke its access key, and archive the revocation receipt.
6. Capture Proton plan and DPA applicability, access/MFA/recovery/sessions, forwarding/filter/client inventory, provider retention/deletion terms, incident route, export/deletion capability, and the operator's inquiry-deletion schedule.
7. Authenticate to the correct Resend team; archive the executed DPA/terms, subprocessor snapshot, 2FA/access receipt and written retention/backup clarification.
8. Configure `forms.yesid.dev`, restricted key, exact DNS, tracking off and enforced TLS; prove one Proton receipt with SPF/DKIM/DMARC and Reply-To using redacted private evidence.
9. Export Cal.com's DPA, current subprocessors, account access/MFA, region, retention/deletion and integration settings; decide whether notes, guests and Daily.co are necessary.
10. Archive Plausible's current DPA/subprocessors, account access/MFA and optional-integration settings; choose a site-statistics retention/review schedule.
11. Capture the final Plausible production consent matrix in a clean browser and the dashboard receipts for `contact_form_success` and `booking_click`; identify or exclude controlled QA traffic before freezing analytics copy.
12. Verify the private incident register access list, provider escalation contacts, entry-creation procedure, five-year retention rule, and quarterly review owner without placing incident details in git.
13. Confirm OIQ membership/permit status or approve non-reserved EN/FR/ES person-title wording while licensed advice is pending; inventory the current site/profile strings that need correction if the title is unavailable.
14. Confirm legal identity, Registraire/NEQ/trade-name position, public address, public contact channel and one NAP record.
15. Approve the factual EN/FR copy and the timing of the controlled CMS promotion.

### Licensed Quebec legal-advisor gates

1. Decide whether each provider/flow receives adequate protection under section 17 and record the legal-framework analysis and mitigations.
2. Confirm each written agreement covers the section 18.3 confidentiality, purpose, retention, incident and verification requirements.
3. Confirm PIPEDA applicability for interprovincial/international commercial flows and correct any public wording.
4. Review the legal identity, sole-proprietor, trade-name/NEQ, professional-title/OIQ, address and Montreal/Gatineau presentation.
5. Confirm which EN/FR/ES person titles, service labels, and business descriptions comply with Quebec's Engineers Act.
6. Confirm retention periods, rights language, incident language, storage/consent statements and EN/FR legal equivalence across `privacy`, `terms`, `cookies`, `accessibility`, and `notice`.

### Completion rule

Homework legal items may be checked only after the receipts above exist. This file completes the agent-preparable evidence inventory, not the legal conclusions, contracts, operator decisions, public copy freeze, or licensed review.

## Official source index

### Quebec and Canada

- [Quebec private-sector Act, section 3.3](https://www.legisquebec.gouv.qc.ca/en/version/cs/p-39.1?code=se%3A3_3)
- [Quebec private-sector Act, section 17](https://www.legisquebec.gouv.qc.ca/fr/version/lc/p-39.1?code=se%3A17&langCont=en)
- [Quebec private-sector Act, section 18.3](https://www.legisquebec.gouv.qc.ca/fr/version/lc/P-39.1?code=se%3A18_3&langCont=en)
- [CAI EFVP guide](https://www.cai.gouv.qc.ca/uploads/pdfs/CAI_GU_EFVP.pdf)
- [CAI confidentiality-incident guidance](https://www.cai.gouv.qc.ca/protection-renseignements-personnels/information-entreprises-privees/incidents-confidentialite-mesures-securite-entreprises)
- [Government of Quebec enterprise-registration guidance](https://www.quebec.ca/en/businesses-and-self-employed-workers/start-entreprise/register-constitute-enterprise/learn-about-registration/about-registration)
- [Quebec Engineers Act, section 22](https://www.legisquebec.gouv.qc.ca/en/version/cs/I-9?code=se%3A22)
- [OIQ illegal-practice and protected-title guidance](https://www.oiq.qc.ca/en/general-public/protection-of-the-public/reporting-illegal-practice-of-engineering/)
- [OPC PIPEDA requirements in brief](https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/pipeda_brief/)

### Vercel

- [Terms of Service](https://vercel.com/legal/terms)
- [Data Processing Addendum](https://vercel.com/legal/dpa)
- [Runtime-log retention](https://vercel.com/docs/logs/runtime)
- [Shared responsibility](https://vercel.com/docs/security/shared-responsibility)
- [Trust Center and subprocessors](https://security.vercel.com/)

### Web3Forms

- [Official FAQ: storage, logging, location, and ownership](https://docs.web3forms.com/getting-started/faq)
- [Official HTML platform page with conflicting submission-retention statement](https://web3forms.com/platforms/html-contact-form)

### Resend

- [Data Processing Addendum](https://resend.com/legal/dpa)
- [Subprocessors](https://resend.com/legal/subprocessors)
- [Regions and US data residency](https://resend.com/docs/dashboard/domains/regions)
- [Security](https://resend.com/docs/security)
- [Security landing page](https://resend.com/security)
- [Open and click tracking](https://resend.com/docs/dashboard/domains/tracking)
- [2026 plan-retention announcement](https://resend.com/changelog/webhooks-ingester)

### Proton Mail

- [Privacy policy](https://proton.me/legal/privacy)
- [Proton Mail privacy policy](https://proton.me/mail/privacy-policy)
- [Data Processing Agreement](https://proton.me/legal/dpa)
- [Mail security and external-email limits](https://proton.me/mail/security)

### Cal.com

- [Privacy policy](https://cal.com/privacy)
- [Security and authenticated compliance downloads](https://cal.com/security)

### Plausible

- [Data Processing Agreement](https://plausible.io/dpa)
- [Data policy](https://plausible.io/data-policy)
- [Security practices](https://plausible.io/security)
- [Privacy policy and subprocessors](https://plausible.io/privacy)
- [Custom-property personal-information restriction](https://plausible.io/docs/custom-props/introduction)
