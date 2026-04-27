# Directus 11.17.3 base + directus-extension-sync authoring endpoint.
# Extension is auto-discovered from node_modules via its `directus:extension`
# manifest entry (no manual copy to EXTENSIONS_PATH folder required).
#
# See: docs/slices/slice-18/18c-foundations/research.md § P4 for design notes
# (package metadata, GPL-3.0 license stance, local verification steps).
#
# Build context: apps/cms/ only (Railway Option A per P7). No COPY from
# outside subdir; Dockerfile is self-contained.

FROM directus/directus:11.17.3

USER root
WORKDIR /directus

# Install the extension via npm. Using pnpm fails with ERR_PNPM_UNEXPECTED_STORE
# (Directus image's existing node_modules is linked from node-user's pnpm store;
# our root-user pnpm invocation defaults to root's store path).
#
# Critical: do NOT use --no-save. Directus 11 auto-discovery scans the root
# /directus/package.json dependencies list for directus:extension manifests
# (not just node_modules). --no-save would skip the package.json update,
# leaving the extension unregistered at boot (verified empirically 2026-04-24
# on commit 9d555d9: Data Studio Extensions list was empty).
#
# Flags:
# --no-audit: skip audit (slow, noisy on CI)
# --no-fund:  skip fund messages
RUN npm install --no-audit --no-fund directus-extension-sync@3.0.6

USER node
