# c-s9 named metric sources rollout

Merge the reviewed app PR first. Apply this packet only after owner confirmation,
through the owner's authenticated browser session. No production changes, CMS item
edits or Publish action were made by the worker. This extends [impact-proof.md](impact-proof.md).

## Exact additive fields and public shape

| Collection | Field | Type / interface | Placement |
| --- | --- | --- | --- |
| services | impact_metric_sources | nullable JSON / list repeater | grp_content, sort 4 |
| projects_impact_metrics | sources | nullable JSON / list repeater | ungrouped, sort 8 |

Both default to null, are optional, have no relation/index/uniqueness, and contain
ordered `{ "label": "Site name", "url": "https://example.org" }` rows. Names are
shared across locales, like site or document names. Do not enter private evidence.
The exporter projects either field to `impactMetric.sources` or
`impactMetrics[].sources`. Missing fields, null and an empty array are valid.
Existing `source_url`, `impact_metric_source_url` and dates remain supported.
When both forms are supplied, the legacy Source link comes first, then named links.
`llms-full.txt` includes every supplied name and URL. No content fixture is backfilled.

[metric-sources-fields.json](metric-sources-fields.json) contains the exact two
POST payloads, matching the new field snapshots. Each repeater has required name
and URL inputs with EN/FR/ES field labels. The new label is **Proof sources
(optional)** / **Sources de la preuve (facultatif)** / **Fuentes de la prueba
(opcional)**. Row labels are **Source name** / **Nom de la source** / **Nombre de la
fuente**, and **Source URL** / **URL de la source** / **URL de la fuente**.

## Editor validation and its boundary

Every named URL uses the exact existing single-source URL schema at export:
absolute HTTPS and no embedded credentials. Invalid JSON shapes, unnamed rows or
any invalid URL stop export. A null/missing list is omitted. An empty list is valid.

The editor URL input carries the exact existing source URL regular expression:
HTTPS, a DNS domain, no credentials/backslashes/whitespace and a valid optional
port. Like the existing single-source field, the editor is deliberately more
conservative than the export URL parser about host syntax.

Directus 12.5.1's default repeater drawer does not enforce nested custom validation
when saving a row. An outer JSON-field `_regex` would validate a string rather than
every array entry. Therefore this packet adds **one blocking filter flow**,
**Validate metric proof sources**, with **one Run Script operation**. It validates
only a supplied sources field, including every row of bulk updates. It returns the
original payload unchanged. Invalid rows throw `FAILED_VALIDATION` (400), with the
owning field and `regex` type. No reject successor may swallow the failure.

The script uses the exact existing editor URL pattern and needs no network,
credentials, environment variables, database reads or elevated service permissions.
It runs for create/update on services and projects_impact_metrics. Unrelated edits
and absent/null/empty lists pass. Existing malformed lists must be corrected when
that field is submitted; unrelated fields remain editable.

[metric-sources-flow.json](metric-sources-flow.json) contains the complete flow and
operation payloads and their sync IDs. [metric-sources-translations.json](metric-sources-translations.json)
contains the three new `impact_proof_sources_invalid` message POSTs and sync IDs.
The existing `impact_proof_source_invalid` messages are reused by row URL inputs.
Actual production editor save/error rendering remains an owner-session check.

Pinned source, Directus v12.5.1, commit `2cd112f1a1afe42829d2e4de899d07ce4394649c`:

- [Repeater drawer save and form](https://github.com/directus/directus/blob/2cd112f1a1afe42829d2e4de899d07ce4394649c/app/src/interfaces/list/list-drawer.vue#L105).
- [Field validation rules](https://github.com/directus/directus/blob/2cd112f1a1afe42829d2e4de899d07ce4394649c/app/src/utils/validate-item.ts#L69).
- [Filter execution, original payload and rejection](https://github.com/directus/directus/blob/2cd112f1a1afe42829d2e4de899d07ce4394649c/api/src/flows.ts#L187).
- [Filter errors and configured return value](https://github.com/directus/directus/blob/2cd112f1a1afe42829d2e4de899d07ce4394649c/api/src/flows.ts#L462).
- [Run Script isolated execution](https://github.com/directus/directus/blob/2cd112f1a1afe42829d2e4de899d07ce4394649c/api/src/operations/exec/index.ts#L43).

Packet tests execute the actual operation code in a fresh VM, test bad later rows,
bulk payloads and unchanged returns, and compare REST payloads to snapshots. They
do not claim a production flow run or authenticated editor save.

## Human Editor grant

Add **impact_metric_sources** to the existing Human Editor services READ and UPDATE
grants, identified by `he-services-impact-proof-read` and
`he-services-impact-proof-update`. Expected final field list on each:

```json
["impact_metric_source_url", "impact_metric_as_of", "impact_metric_sources"]
```

Preserve policy, filters, validation and presets exactly. No create/delete/admin
grant is added. Human Editor already has project-metric create/read/update `*` in
the committed snapshot; no project grant changes. Build Bot, AI Editor and public
reads already include these collections' fields through `*`; no changes there.
Re-read live grants before acting and reconcile drift rather than duplicating rows.

## Apply only after owner confirmation

1. Run cms.yml `diff` on merged main. Review only this packet's two fields, three
   translations, one flow, one operation and two field-list additions. Stop for
   unrelated drift. Do not perform a global schema push.
2. GET both field collections and GET the relevant flows, translations, grants and
   sync mappings. Save preimages. Resolve existing equivalent rows before creating.
3. POST the three translation payloads first. Register each returned ID with POST
   `/directus-extension-sync/table/translations` using
   `{ "table": "translations", "local_id": "RETURNED_ID", "sync_id": "PACKET_SYNC_ID" }`.
   Read back every translation and mapping.
4. POST the two field payloads in packet order. GET
   `/fields/services/impact_metric_sources` and `/fields/projects_impact_metrics/sources`.
   Confirm null defaults and no item data changes. Fields do not need sync-ID maps.
5. POST `/flows` with the packet flow body, but set `status` to `inactive` and
   `operation` to null. Save FLOW_ID. Register it with POST
   `/directus-extension-sync/table/flows`:
   `{ "table": "flows", "local_id": "FLOW_ID", "sync_id": "_sync_flow_metric_sources" }`.
6. POST `/operations` with the packet operation body, replacing only `flow` with
   FLOW_ID. Save OPERATION_ID. Register it with POST
   `/directus-extension-sync/table/operations`:
   `{ "table": "operations", "local_id": "OPERATION_ID", "sync_id": "_sync_op_metric_sources_validate" }`.
7. PATCH `/flows/FLOW_ID` with
   `{ "operation": "OPERATION_ID", "status": "active" }`. Read back flow,
   operation and both maps. Confirm filter type, `$last` return and null reject.
8. Resolve the Human Editor policy with GET
   `/directus-extension-sync/table/policies/sync_id/_sync_human_editor_policy`.
   Resolve each existing grant with GET
   `/directus-extension-sync/table/permissions/sync_id/he-services-impact-proof-read`
   and the corresponding `he-services-impact-proof-update` URL. GET each permission
   and verify collection/action/policy against the resolved policy local_id.
9. PATCH `/permissions/READ_ID` and `/permissions/UPDATE_ID` with only
   `{ "fields": ["impact_metric_source_url", "impact_metric_as_of", "impact_metric_sources"] }`.
   If live grants have additional authorized fields, preserve them and reconcile
   the reviewed snapshot before proceeding. Keep the existing permission sync maps.
   If either prerequisite grant/map is absent, stop and reconcile c-s5 first.
10. Run cms.yml `diff` again. It must be empty for this packet. Save readback receipts.
11. With separate owner authorization for content authoring, edit the real service's
    Proof sources rows. Verify an invalid HTTP URL and a credential URL cannot save;
    verify the four valid named URLs can save. Do not change a metric's copy/value.
12. Publish only when separately authorized. Verify the public metric panel and
    `llms-full.txt` contain the exact authored names and URLs after that deployment.

Map table names are **flows**, **operations**, **permissions**, **translations** and
**policies**, never their `directus_*` database names. No new policy is needed.
Never extract a token or read credential files to apply this packet. For an
uncertain request result, read the current row and map before retrying.

## Owner's four sources, proposed content only

The owner identified these links for “Bilingual from day one, at no extra cost”.
They are not written to CMS or the committed content fixture by this PR:

```json
[
  { "label": "yesid.dev", "url": "https://yesid.dev" },
  { "label": "Transit", "url": "https://transit.yesid.dev" },
  { "label": "Café Arona", "url": "https://cafearona.com" },
  { "label": "Vitreva", "url": "https://vitreva.ca" }
]
```

## Rollback

Redeploy the previous app revision. Leave nullable fields, authored proof and grants
in place; the prior app ignores the new JSON fields. No deletion is needed. If the
new validator blocks legitimate saves, an owner can deactivate this exact flow
after recording its ID, failure and rollback decision. Existing single-source
validation remains. Restore only recorded permission preimages if separately
authorized. Never delete an evidence column or overwrite unrelated grants.
