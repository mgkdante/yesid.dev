# Patched vendor runtime; package the folder extension in a separate build stage.
# Both stages pin multi-platform digests. Do not replace the vendor's Node or
# pnpm/native-module layout. npm is available only in the packaging stage.
#
# ── slice-26 v12 OVERRIDE (2026-06-10) ──────────────────────────────────────
# directus-extension-sync@3.0.6 declares `host: "^11.0.0"`, so Directus 12
# refuses to load it. The extension is a thin id-map CRUD endpoint whose API
# surface is expected to survive the major (v12's changes are content/access
# layer; see slice-26 Research § Pre-flight). Until tractr ships a v12-aware
# release we widen the host range in the installed manifest.
#
# REMOVE the patch step the moment `npm view directus-extension-sync
# 'directus:extension'` shows a host covering ^12 — then pin that version.
# Watch: https://github.com/tractr/directus-sync/issues
#
# DEPLOY PREREQS (Railway env, not this file — see slice-26 Research runbook):
#   - IP_TRUST_PROXY=true            (v12 flipped the default to false)
#   - LICENSE_KEY=<Open Innovation Grant key> (or LICENSE_TOKEN, never both).
#     v12 licensing: UPGRADED instances above core limits get a 30-day grace;
#     FRESH instances hard-enforce ("collections limit exceeded" at
#     /schema/apply — proven on CI run 27310910938 with our ~50 collections).
#     Activations bind to PUBLIC_URL; the grant allows 5.
#   - health checks must use /server/ping (v12 gates /server/health behind auth)
#   - Preserve and test matching DEV data/config recovery BEFORE upgraded boot
#     (migrations and extension initialization write to the database).
# ─────────────────────────────────────────────────────────────────────────────
#
# See the Notion slice-18c research page for the original design notes and
# slice-26 Plan/Research for the v12 upgrade runbook.
#
# Build context: apps/cms/ only (Railway Option A per P7). No COPY from
# outside subdir; Dockerfile is self-contained.

FROM node:22.23.4-alpine@sha256:fe4f6d74e20370acb04ad889077d14d0f64a9c8ea6a42bc60cddf1e844699914 AS sync-extension

WORKDIR /extension-build

# Install the extension FOLDER-BASED under EXTENSIONS_PATH (/directus/extensions).
#
# Do NOT `npm install` into /directus — the 11.x-era technique. The v12 image's
# node_modules is a pnpm-symlinked layout; npm install rewrites it and breaks
# Directus's own imports (verified 2026-06-10 on CI run 27301210728: boot died
# with ERR_MODULE_NOT_FOUND '@directus/update-check' imported from cli.js).
# The endpoint has no runtime dependencies; its compiled entrypoint is bundled.
# Verify the exact published tarball before extracting it. Lifecycle scripts
# are disabled, and no project files or credentials enter this build stage.
#
# The patch step widens the extension's host range so Directus 12's boot-time
# semver check accepts it (see OVERRIDE banner above). The verify step fails the
# image build loudly if the patch ever stops matching (e.g. after a version bump).
RUN npm pack directus-extension-sync@3.0.6 --ignore-scripts --registry=https://registry.npmjs.org --pack-destination /tmp --quiet \
	&& node -e "const fs=require('node:fs');const crypto=require('node:crypto');const actual='sha512-'+crypto.createHash('sha512').update(fs.readFileSync('/tmp/directus-extension-sync-3.0.6.tgz')).digest('base64');if(actual!=='sha512-Kb7MArnFtLel85/o5ZmLBjz10WXtOYXvxYXqo/DzxtvK8VHnNxTva6A6mYntMMk8rnEoaEJoPBbltujqTzi6/A==')throw new Error('sync extension integrity mismatch');" \
	&& mkdir extension \
	&& tar -xzf /tmp/directus-extension-sync-3.0.6.tgz -C extension --strip-components=1 \
	&& rm /tmp/directus-extension-sync-3.0.6.tgz \
	&& node -e "const fs=require('node:fs');const p='extension/package.json';const j=JSON.parse(fs.readFileSync(p,'utf8'));if(j.name!=='directus-extension-sync'||j.version!=='3.0.6'||j['directus:extension'].host!=='^11.0.0'||Object.keys(j.dependencies||{}).length)throw new Error('unexpected sync extension package');fs.accessSync('extension/'+j['directus:extension'].path);j['directus:extension'].host='^11.0.0 || ^12.0.0';fs.writeFileSync(p,JSON.stringify(j,null,2));"

FROM directus/directus:12.5.1@sha256:ef6fc027605ea659a972356e0c35fd7f88b02118b0b3a322dafbec3cc709fdab

WORKDIR /directus

COPY --from=sync-extension --chown=node:node /extension-build/extension /directus/extensions/directus-extension-sync

COPY --chown=node:node extensions/noindex /directus/extensions/directus-extension-noindex

USER node
