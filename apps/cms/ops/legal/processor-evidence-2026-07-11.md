# yesid.dev actual-provider evidence record

Prepared: 2026-07-11

Evidence cutoff: 2026-07-11, America/Toronto

Status: **agent-preparable evidence recorded; operator account receipts, provider decisions, and licensed Quebec legal review remain open**

This is an internal operational record, not legal advice and not a completed evaluation of privacy factors. It separates verified facts from missing account evidence for the five providers used by the public yesid.dev service. It does not conclude that a provider offers adequate protection under Quebec law or that an agreement meets a statutory requirement.

Scope is yesid.dev hosting, contact delivery, mailbox storage, booking, and analytics. Transit is excluded.

## Current decision and truth boundary

1. The production contact path remains Web3Forms to Proton. The operator explicitly chose to keep it.
2. The cancelled Resend proposal is historical only. It is not a production provider, implementation target, checklist item, or prerequisite in this record.
3. Vercel hosts the commercial yesid.dev services site. The authenticated team is on Hobby, and Vercel restricts Hobby to non-commercial personal use. This is a whole-site plan issue, not a reason to change the contact form. The operator committed to upgrade by the next deployment, with a working target of 2026-07-25; that future action is not a completed receipt.
4. Web3Forms is the live contact relay. Its public Free-plan, retention, contract, and spam-processing statements require account and written-provider clarification before the legal record can be frozen.
5. Proton is the live mailbox. Its actual plan, DPA applicability, account access, and operator retention settings require authenticated evidence.
6. Cal.com is the live booking service. Its actual plan, integrations, access controls, DPA, subprocessor record, and retention/deletion settings require authenticated evidence.
7. Plausible is live behind explicit opt-in. Its public DPA and code controls are evidenced, but the exact goals and account-side receipts are still incomplete.
8. The current privacy text says adequate protection was assessed before relying on each provider. The evidence below does not substantiate that completed claim. It must not receive a final operator copy freeze until it is corrected or supported by real records and licensed advice.
9. The older `privacy.advisorNotes` inside `legal-pages-2026-07-09.json` repeats that completed-assessment claim and omits Proton and Plausible. This record supersedes that internal note. Do not use the old note as promotion authority.

No adequate-protection conclusion is recorded here.

## Production processing map

```text
CONTACT FORM
browser -> Web3Forms -> Proton Mail inbox -> operator

DIRECT EMAIL
visitor email provider -> Proton Mail inbox -> operator

BOOKING
browser -> Cal.com -> meeting provider + operator calendar/email integrations
                       (private integration configuration not inspected)

ANALYTICS, ONLY AFTER EXPLICIT GRANT
browser -> Plausible Analytics Cloud -> aggregate dashboard -> operator

SITE DELIVERY
browser -> Vercel -> prerendered yesid.dev pages and request metadata
```

The public form code sends no attachment. Free-text contact and booking fields can still contain sensitive information if a visitor chooses to enter it. Raw messages, headers, credentials, account screenshots, and incident details belong in restricted evidence storage, not git.

## Verified project and account receipts

- Repository truth was checked at `origin/main` commit `866640d21e536dcde8da87ee4294c23ca2b8fdc0`.
- The production contact source posts client-side to `https://api.web3forms.com/submit`; no live same-origin contact route exists in this commit.
- The public site, contact route, legal routes, booking link, robots file, sitemap, and sampled priority routes were reachable on 2026-07-11.
- Authenticated Vercel CLI/API evidence identified project `yesid-dev`, team `mgkdantes-projects`, active Hobby billing, one confirmed OWNER, and enabled MFA with TOTP.
- The repository's 1Password service-account flow resolved the stored Plausible API credential without exposing it.
- Fresh Plausible goal reads returned `404`, `Outbound Link: Click`, `File Download`, and `Form: Submission`. They did not return `contact_form_success` or `booking_click` at the evidence cutoff.
- The operator accidentally created `contact_form_success` and `booking_click` as Plausible custom-property names rather than goals. An idempotent Sites API goal write was attempted with the existing credential and returned HTTP 401 for both names; no goal was created or changed. The key remains usable for read-only receipts.
- Authenticated Directus reads found five legal pages in each environment and 30 public `admin@yesid.dev` occurrences in both DEV and PROD. Neither environment contained `contact@yesid.dev` in those legal-page bodies at the evidence cutoff. The operator approved `contact@yesid.dev` for every public-facing use, but no CMS write or rebuild has happened yet.
- The private confidentiality incident register exists, recorded zero incidents at the evidence cutoff, and defines the required incident fields and a five-year minimum retention rule.

## Processor register

| Provider | Production role | Main personal-information boundary | Verified contract/account state | Current disposition |
|---|---|---|---|---|
| Vercel | Public-site hosting | Request metadata and deployment/account data | Authenticated Hobby, one OWNER, MFA/TOTP; public DPA applies to Pro and Enterprise | Commercial-plan mismatch; operator decision required |
| Web3Forms | Contact-form relay | Name, email, free-text message, form metadata, IP/email data used by spam controls | Public Free tier is labelled PERSONAL; no authenticated dashboard or DPA receipt | Retained production provider; account and written-provider evidence incomplete |
| Proton Mail | Contact mailbox | Message content, sender/recipient data, attachments from direct email, and mail metadata | Public DPA exists; actual plan and applicability unproved | Retained production provider; operator account evidence incomplete |
| Cal.com | Booking | Name, email, booking/timezone data, optional notes/guests, and connected integrations | Public terms/privacy available; authenticated DPA and account settings unproved | Retained production provider; minimize and document account configuration |
| Plausible | Consent-gated analytics | Path/referrer/campaign, browser/device categories, approximate geography, named events, and transient IP/User-Agent processing | Public DPA accepted by use; live goal/account receipts incomplete | Retained production provider; finish OPS2 and account evidence |

## Provider records

### Vercel

**Role and necessity.** Vercel serves the public commercial services site. The current contact form does not make Vercel process form fields.

**Authenticated evidence.** The live project belongs to an active Hobby team. The current operator is the one confirmed OWNER and MFA with TOTP is enabled.

**Contract and plan evidence.** Vercel's [Fair Use Guidelines](https://vercel.com/docs/limits/fair-use-guidelines), updated 2026-06-16, restrict Hobby teams to non-commercial personal use. The definition includes advertising the sale of a product or service. yesid.dev advertises paid freelance services. Vercel's [Data Processing Addendum](https://vercel.com/legal/dpa), effective 2026-03-31, applies to Pro and Enterprise customers.

**Open operator action.** Upgrade to a commercial plan before the next deployment and archive the applicable agreement and plan receipt. Working target: 2026-07-25. Also archive a dated subprocessor list, deployment/log retention settings, owner/access receipt, and incident route. Until the dashboard proves the upgrade, the mismatch remains open.

### Web3Forms

**Role and data.** The browser sends name, email, message, subject, and sender-display metadata to Web3Forms, which delivers the inquiry to Proton. The client-side access key is public by the provider's design. No attachment, webhook, or optional integration appears in the current form code.

**Public evidence.** Web3Forms [Pricing](https://web3forms.com/pricing) labels the Free tier PERSONAL and advertises a 30-day form-submission history. Its [FAQ](https://docs.web3forms.com/getting-started/faq) separately says form submissions are not stored and that logs containing personal information are deleted periodically, described there as every two months. The [Privacy Policy](https://web3forms.com/privacy) says IP and email data may be sent to CleanTalk and Akismet for spam prevention. The [Terms](https://web3forms.com/terms) still contain `[Your Jurisdiction]` in the governing-law clause. No public DPA was found in the provider's first-party legal navigation during this review.

**Open operator action.** Capture the dashboard plan, form destination, account owner/access, security controls, history/deletion controls, active integrations, and spam settings. Ask Web3Forms in writing to confirm commercial Free eligibility, the controlling retention statement, contracting entity, DPA/subprocessors and locations, transfer safeguards, incident notice, deletion/return procedure, spam-processor defaults, outbound-mail provider, and transport-security policy.

### Proton Mail

**Role and data.** Proton stores direct and Web3Forms-relayed messages, sender/recipient details, subjects, timestamps, reply history, and delivery metadata. Direct email can include attachments. External inbound email is not end-to-end encrypted unless the sender uses a compatible encrypted path.

**Public evidence.** Proton's [Terms](https://proton.me/legal/terms), modified 2026-06-23, say Business and Workspace plans are intended for businesses while all other subscription plans are intended for consumers. Proton publishes a [DPA](https://proton.me/legal/dpa). The [Mail Privacy Policy](https://proton.me/mail/privacy-policy) says encrypted offline backups can be kept for up to 30 days.

**Open operator action.** Archive the actual plan and DPA applicability, account owner/access, 2FA, recovery and active sessions, forwarding/filters/clients, provider retention/deletion terms, incident route, and the operator's inquiry-deletion schedule. Preserve only a redacted private receipt from a controlled message-header inspection.

### Cal.com

**Role and data.** The public booking path collects required contact and scheduling data. The observed public event also permits optional notes and guest addresses and uses a meeting provider. Private calendar, email, reminder, analytics, and workflow integrations were not inspected.

**Public evidence.** Cal.com's [Privacy Policy](https://cal.com/privacy) retains personal data as long as necessary for stated purposes, legal obligations, disputes, and agreements; it does not give a booking-specific fixed period. It also describes subprocessors. The [Security page](https://cal.com/security) and compliance material do not replace an authenticated account-side DPA and configuration receipt.

**Open operator action.** Export the applicable DPA, current subprocessors, plan, account access/MFA, hosting region, deletion/retention controls, calendar/email/meeting integrations, workflows, reminders, and analytics settings. Decide whether notes, guest emails, and the meeting provider are necessary; disable fields or integrations that are not needed.

### Plausible Analytics Cloud

**Role and data.** The site loads Plausible only after the visitor grants analytics. It sends pageviews plus `contact_form_success` and `booking_click` without form fields or custom properties. Withdrawal stops future analytics events.

**Public evidence.** Plausible's [DPA](https://plausible.io/dpa), last updated 2026-03, says use of the service constitutes acceptance. It describes EU processing and storage on EU-owned infrastructure in Germany, deletion of raw IP/User-Agent inputs rather than storage, deletion of old salts every 24 hours, breach notice no later than 48 hours, and permanent deletion of site statistics on instruction. The [Privacy Policy](https://plausible.io/privacy) identifies account and infrastructure providers including Hetzner, Bunny, UpCloud, Paddle, and Postmark.

**Open operator action.** Confirm the two exact custom goals in the live API, capture a normal-browser Realtime receipt, and identify or annotate the controlled QA window. Archive plan/invoice, DPA/subprocessor snapshot, account owner/team, MFA/sessions, shared links, optional integrations, and site-statistics retention/deletion decisions.

## Cross-provider risk and control record

| Risk | Current control | Remaining evidence or decision |
|---|---|---|
| Sensitive text entered into contact or booking fields | No form attachment; narrow published purpose | Decide on a plain-language warning and deletion procedure; minimize Cal.com optional fields |
| Provider or operator account compromise | Vercel MFA evidenced; provider security controls | Capture Web3Forms, Proton, Cal.com, and Plausible access/MFA/session receipts |
| Retention statements blur provider and operator layers | This record separates them | Adopt inquiry, booking, mailbox, and analytics review/deletion schedules |
| Cross-border processing lacks a completed legal record | Public contracts and factual inventory collected | Licensed section 17 and 18.3 review, written-agreement verification, and mitigation decision |
| Public copy outruns evidence | CMS is truth; promotion is operator-gated | Correct or substantiate the completed-assessment sentence before copy freeze |
| Incident evidence leaks into git | Restricted Notion register is canonical | Keep people, raw messages, headers, credentials, and forensic details out of the repo |

## Confidentiality incident register

The restricted register exists. It records discovery and occurrence dates, cause, affected information and people, systems/providers, containment, serious-injury analysis, notifications, mitigation, corrective actions, provider communications, evidence location, and destruction date. Its policy requires at least five years of retention after awareness.

The current count of zero recorded incidents is not proof that no earlier incident occurred outside the reviewed evidence.

Remaining operator evidence:

1. confirm the page's restricted access list and review owner;
2. add provider security contacts and escalation routes;
3. prove the operator can create an entry without copying incident details into git;
4. retain each future entry for at least five years after awareness;
5. involve a licensed Québec legal advisor when serious-injury risk or notice duties are uncertain.

## Identity, professional title, address, and NAP

Existing records identify the operator as Yesid Fernando Otalora, describe no current NEQ, publish a Gatineau legal address, and market services in Montreal. These are operator-supplied facts, not a current Registraire extract or licensed conclusion.

The operator confirmed they are not an OIQ member. Public EN/FR/ES person-title uses of `engineer`, `ingénieur`, and `ingeniero` require replacement with operator-approved non-reserved wording. Generic discipline and service phrases such as `database-engineering`, `data engineering`, and `ingénierie de données` are a separate category and must not be changed by a blind text replacement.

The operator approved a Montreal service-area presentation and confirmed that they travel to clients in Montreal. The Gatineau street address is not a customer-facing location and is to remain hidden from the service-area profile. Public contact is `contact@yesid.dev`, phone and WhatsApp are `+1 819 446-5594`, and `admin@yesid.dev` is internal-only. These are approved NAP fields, not publication receipts.

Before profile or directory publication, record the remaining operator approval for:

1. exact legal name and sole-proprietor status;
2. Registraire/NEQ status and whether `yesid.dev` is a registered or declared trade name;
3. the lawful legal-page treatment of the Gatineau address alongside the approved Montreal service area;
4. the exact public display name;
5. one consistent public NAP record using the approved public email, phone, and WhatsApp fields.

## EN/FR operator copy-freeze checklist

- [ ] Production transport is named as Web3Forms to Proton in EN and FR.
- [ ] The completed section 17 assessment statement is supported by real records or replaced with accurate pending language after licensed review.
- [ ] Vercel plan, DPA applicability, locations, retention, subprocessors, and access controls match authenticated receipts.
- [ ] Web3Forms plan, commercial eligibility, destination, integrations, spam processors, retention, transfers, deletion, and contract statements match authenticated and written evidence.
- [ ] Proton plan, DPA applicability, external-mail limits, backup retention, access controls, and operator deletion schedule match authenticated evidence.
- [ ] Cal.com fields, meeting provider, integrations, retention, deletion, access controls, and contract evidence match the actual account.
- [ ] Plausible consent behavior, event names, goals, no-custom-property boundary, locations, account access, and deletion decision match code and dashboard receipts.
- [ ] Inquiry, booking, mailbox, and analytics retention periods do not misstate provider retention.
- [ ] Functional local storage and temporary locale-handoff storage statements match deployed code.
- [ ] Every public person title uses the operator-approved non-reserved EN/FR/ES wording; generic discipline/service terminology remains intact.
- [ ] Legal name, sole-proprietor wording, NEQ/trade-name decision, address, and NAP are operator-approved and source-backed.
- [ ] EN and FR have the same provider list, purposes, information categories, transfers, retention, rights, security caveats, and effective date.
- [ ] The five EN/FR legal routes, CMS rows, committed fallbacks, links, canonicals, locale switches, and mobile rendering are reconciled after any approved change.
- [ ] The operator records factual approval.
- [ ] A real licensed Québec legal advisor records the legal review. No agent checkbox substitutes for it.

## Exact external gates

### Operator or authenticated-account gates

1. Resolve the Vercel commercial-plan mismatch and archive the resulting contract/plan receipt.
2. Capture the Web3Forms dashboard and written-provider answers listed above.
3. Capture the Proton plan, DPA applicability, access/security, configuration, and retention receipts.
4. Capture the Cal.com plan, DPA/subprocessors, access/security, integrations, and retention/deletion receipts.
5. Finish the Plausible goal and Realtime receipts plus account-security and retention evidence.
6. Confirm the incident-register access list, review owner, escalation contacts, and entry procedure.
7. Approve the non-reserved EN/FR/ES person-title trio.
8. Confirm legal identity, Registraire/NEQ/trade-name status, address treatment, Google Business Profile eligibility, and one NAP record.
9. Approve factual EN/FR copy before any CMS promotion.

### Licensed Quebec legal-advisor gates

1. Review each provider and data flow under sections 17 and 18.3 and record the conclusion, foreign-law analysis, safeguards, contract terms, and mitigations.
2. Review the five current legal pages and EN/FR equivalence.
3. Review legal identity, sole-proprietor and trade-name/NEQ status, public-address treatment, and Montreal/Gatineau presentation.
4. Review the non-reserved professional-title replacement and any remaining person, service, or business-name use that could imply OIQ authorization.
5. Review retention, rights, incident, storage, consent, and cross-border wording.

### Completion rule

This file completes the agent-preparable factual inventory. It does not complete contracts, operator decisions, public copy freeze, section 17 or 18.3 conclusions, or licensed review. Homework checkboxes may close only when the corresponding receipts exist.

## Official source index

- [Vercel Fair Use Guidelines](https://vercel.com/docs/limits/fair-use-guidelines)
- [Vercel Data Processing Addendum](https://vercel.com/legal/dpa)
- [Web3Forms Pricing](https://web3forms.com/pricing)
- [Web3Forms FAQ](https://docs.web3forms.com/getting-started/faq)
- [Web3Forms Privacy Policy](https://web3forms.com/privacy)
- [Web3Forms Terms](https://web3forms.com/terms)
- [Proton Terms](https://proton.me/legal/terms)
- [Proton Data Processing Agreement](https://proton.me/legal/dpa)
- [Proton Mail Privacy Policy](https://proton.me/mail/privacy-policy)
- [Cal.com Privacy Policy](https://cal.com/privacy)
- [Cal.com Security](https://cal.com/security)
- [Plausible Data Processing Agreement](https://plausible.io/dpa)
- [Plausible Privacy Policy](https://plausible.io/privacy)
- [Quebec private-sector privacy law](https://www.legisquebec.gouv.qc.ca/en/document/cs/P-39.1)
- [Quebec Engineers Act](https://www.legisquebec.gouv.qc.ca/en/document/cs/I-9)
- [OIQ protected-title guidance](https://www.oiq.qc.ca/en/general-public/protection-of-the-public/reporting-illegal-practice-of-engineering/)
