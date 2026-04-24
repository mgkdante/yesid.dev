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

# Install the extension via npm. Using pnpm here fails with
# ERR_PNPM_UNEXPECTED_STORE because the image's existing node_modules is
# linked from /home/node/.local/share/pnpm/store/v10 (built as `node` user)
# and running pnpm as `root` defaults to /root/.local/share/pnpm/store/v10.
# npm install has no store-location semantics; drops the package into
# /directus/node_modules where Directus 11 auto-discovers it via the
# `directus:extension` manifest entry (type=endpoint, host=^11.0.0,
# verified 2026-04-24 against Directus 11.17.3).
RUN npm install --no-audit --no-fund --no-save directus-extension-sync@3.0.6

USER node
