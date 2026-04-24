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

# Upstream Directus image uses pnpm under corepack (not a monorepo
# workspace concern — this is the image's internal package manager).
# Note: pnpm does NOT support `--no-save` (that's an npm flag); `pnpm add`
# always updates package.json. Harmless inside an immutable Docker layer.
# Directus auto-loads the extension at boot from node_modules (type=endpoint,
# host=^11.0.0, verified 2026-04-24 against Directus 11.17.3).
RUN corepack enable \
 && pnpm add directus-extension-sync@3.0.6

USER node
