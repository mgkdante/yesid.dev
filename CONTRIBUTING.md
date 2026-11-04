# Contributing

This is a proprietary production and portfolio repository, not an open-source
project. External pull requests and unsolicited code contributions are not
accepted.

Reproducible public-site defects may be reported through GitHub Issues.
Security reports must follow [SECURITY.md](SECURITY.md).

For authorized dependency changes, update `bun.lock` on your machine with the
repository's pinned Bun version. CI's `bun install --frozen-lockfile` on Linux
decides whether the result is portable. If that install fails because of the
lockfile, regenerate it with the same Bun version on Linux (WSL for that
command or a Linux CI runner), commit it, and rerun CI.
