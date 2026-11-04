# c-s5 impact proof rollout

Scope: optional public proof for existing project and service metrics. No numbers,
sources or dates are backfilled. No production CMS writes are part of the PR.

The app is safe to merge before these fields exist. Both fetchers read wildcard
fields and accept absent/null/blank proof. The updated fetchers were run read-only
against the current public CMS on 2026-11-04, before the columns existed: eight
project metrics and four service metrics survived unchanged. The uncited fixture
also builds. Adding the nullable columns first is compatible with the old app.

## Exact fields

The copyable POST payloads are in [impact-proof-fields.json](impact-proof-fields.json).
They match the four committed field snapshots. All are nullable, optional,
default null, and have no uniqueness, index or relation. No existing field moves.

| Collection | Field | Type / interface | Placement | Labels EN / FR / ES |
| --- | --- | --- | --- | --- |
| projects_impact_metrics | source_url | string, varchar(2048) / input | ungrouped, sort 6 | Proof source (optional) / Source de la preuve (facultatif) / Fuente de la prueba (opcional) |
| projects_impact_metrics | as_of | date / datetime | ungrouped, sort 7 | As-of date (optional) / Date de référence (facultatif) / Fecha de referencia (opcional) |
| services | impact_metric_source_url | string, varchar(2048) / input | grp_content, sort 2 | same source labels |
| services | impact_metric_as_of | date / datetime | grp_content, sort 3 | same date labels |

Labels use en-US, fr-CA and es-ES. Source URLs are validated at export: HTTPS,
absolute, and no embedded credentials. A missing citation is valid. A supplied
invalid URL or calendar date stops export. The date is the measurement's date,
not the record's edit date. UI dates use locale formatting with UTC calendar-day
semantics; llms-full.txt carries the supplied ISO date and source URL.

## Permission changes to confirm separately

1. Human Editor: ADD `services` READ, fields exactly `impact_metric_source_url,impact_metric_as_of`, unrestricted row filter `{}`; no other field.
2. Human Editor: ADD `services` UPDATE, fields exactly `impact_metric_source_url,impact_metric_as_of`, row filter `{}`, validation null, presets null; no other field.

No permission change: Human Editor already has projects_impact_metrics create/read/update
with `*`; AI Editor already has create/read/update with `*` on both collections;
Build Bot content read already has read `*`; public already has read `*` (projects
restricted to published parents). Those existing filters and grants stay exact.
No new create/delete/admin/public write grant. The site's request-time application
does not need CMS access; existing public reads will expose these proof fields too.

These statements use the committed permission snapshot. Re-read live grants before
applying: a newer equivalent grant must be reconciled, never duplicated or overwritten.

## Order for the orchestrator, after owner confirmation

1. Merge the reviewed app/snapshot PR after every E2E shard passes. Do not pull newer
   main into the worker branch after opening the PR. The existing uncited Publish
   can run without the new columns.
2. Run cms.yml `diff` on main. Review the exact diff. Expected scope is the four
   nullable fields plus the two narrowly scoped permission rows above. Stop for
   unrelated differences. The authenticated live diff was not run by the worker.
3. From the owner's authenticated browser session, GET `/fields/projects_impact_metrics`
   and `/fields/services`; confirm the four fields are absent. Save relevant preimages
   of any existing fields/grants. Do not change item content.
4. In the JSON packet order, POST each `payload` to its `path`. Read each field
   back with GET `/fields/{collection}/{field}`. Existing metrics remain null.
5. Resolve Human Editor's current policy with GET
   `/directus-extension-sync/table/directus_policies/sync_id/_sync_human_editor_policy`.
   Use its returned `local_id`, not a guessed UUID. GET `/permissions` filtered to
   that policy and `services`; stop/reconcile if a corresponding grant now exists.
6. POST the two permission bodies below, one at a time, replacing POLICY_ID with
   the resolved policy ID. Save each returned permission `id` and read it back.
7. Register each new permission's sync identity with the mapping POST below. This
   avoids duplicate grants or a perpetual diff after manual REST creation. Inspect
   an uncertain outcome before retrying. Never POST the same grant twice.
8. Run cms.yml `diff` again. It must be empty. A live diff or permission mismatch
   remains an orchestrator blocker, not evidence supplied by a fixture build.
9. Owner fills only real proof in CMS, then uses Publish site. Verify that Publish,
   the corresponding live pages and llms-full.txt all show that exact source/date.
   The worker's synthetic layout examples are never content for this step.

```json
{
  "collection": "services", "action": "read", "policy": "POLICY_ID",
  "permissions": {}, "validation": null, "presets": null,
  "fields": ["impact_metric_source_url", "impact_metric_as_of"]
}
```

```json
{
  "collection": "services", "action": "update", "policy": "POLICY_ID",
  "permissions": {}, "validation": null, "presets": null,
  "fields": ["impact_metric_source_url", "impact_metric_as_of"]
}
```

POST `/directus-extension-sync/table/directus_permissions` for each returned ID:

```json
{"table":"directus_permissions","local_id":"READ_PERMISSION_ID","sync_id":"he-services-impact-proof-read"}
```

```json
{"table":"directus_permissions","local_id":"UPDATE_PERMISSION_ID","sync_id":"he-services-impact-proof-update"}
```

Use ordinary authenticated REST requests from that session. No token extraction,
credential-file search, global schema push or production content write is needed.

## Owner's authoring action

- Projects: Content > Projects > the project > Impact metrics > the specific metric.
  Fill **Proof source (optional)** and/or **As-of date (optional)**.
- Services: Content > Services > the service > **Card and page text**. Fill the
  same two fields for the service's impact metric, outside its language tabs.
- The source is one public HTTPS URL, shared across languages. The date says when
  the number was true. Leave either blank when unknown. Existing values and labels
  stay untouched. Never paste confidential client evidence or private signed links.

## Rollback

Redeploy the prior site revision. If a source revert is needed, revert application
and exporter changes while retaining the additive CMS snapshots and any applied
permission rows. Leave nullable CMS fields and authored evidence in place; the
old app ignores them. This rollback requires no CMS content deletion. If grants must be
revoked, remove only the two recorded permission IDs and their corresponding sync
maps, after separate owner confirmation. Do not delete a column containing evidence.
An eventual schema rollback requires explicit authority, field-level backup, and a
new reviewed snapshot change; it is not part of this packet.
