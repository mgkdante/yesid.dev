# Directus 12.0.0 base + folder extensions under EXTENSIONS_PATH.
# directus-extension-sync is packed from npm; the local noindex hook is copied
# from this build context. Both are discovered through `directus:extension`.
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
#   - Neon branch the env's DB BEFORE first v12 boot (migrations run on boot)
# ─────────────────────────────────────────────────────────────────────────────
#
# See the Notion slice-18c research page for the original design notes and
# slice-26 Plan/Research for the v12 upgrade runbook.
#
# Build context: apps/cms/ only (Railway Option A per P7). No COPY from
# outside subdir; Dockerfile is self-contained.

FROM directus/directus:12.0.0

USER root
WORKDIR /directus

# Install the extension FOLDER-BASED under EXTENSIONS_PATH (/directus/extensions).
#
# Do NOT `npm install` into /directus — the 11.x-era technique. The v12 image's
# node_modules is a pnpm-symlinked layout; npm install rewrites it and breaks
# Directus's own imports (verified 2026-06-10 on CI run 27301210728: boot died
# with ERR_MODULE_NOT_FOUND '@directus/update-check' imported from cli.js).
# Folder extensions are scanned natively from EXTENSIONS_PATH; the package has
# zero runtime deps (extensions-sdk bundles them into dist), so pack+untar is
# the whole install.
#
# The patch step widens the extension's host range so Directus 12's boot-time
# semver check accepts it (see OVERRIDE banner above). The verify step fails the
# image build loudly if the patch ever stops matching (e.g. after a version bump).
RUN npm pack directus-extension-sync@3.0.6 --pack-destination /tmp --quiet \
	&& mkdir -p /directus/extensions/directus-extension-sync \
	&& tar -xzf /tmp/directus-extension-sync-3.0.6.tgz -C /directus/extensions/directus-extension-sync --strip-components=1 \
	&& rm /tmp/directus-extension-sync-3.0.6.tgz \
	&& node -e "const fs=require('fs');const p='/directus/extensions/directus-extension-sync/package.json';const j=JSON.parse(fs.readFileSync(p,'utf8'));j['directus:extension'].host='^11.0.0 || ^12.0.0';fs.writeFileSync(p,JSON.stringify(j,null,2));" \
	&& node -e "const h=require('/directus/extensions/directus-extension-sync/package.json')['directus:extension'].host;if(h!=='^11.0.0 || ^12.0.0'){console.error('host patch failed: '+h);process.exit(1)};console.log('extension host patched: '+h)" \
	&& chown -R node:node /directus/extensions

COPY --chown=node:node extensions/noindex /directus/extensions/directus-extension-noindex

USER node
