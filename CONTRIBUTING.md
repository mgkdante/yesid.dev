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

## Fast local tests

Run `bun run test:changed` from the repository root (Windows or Linux). It uses
the merge base with the locally fetched `origin/main`, plus staged, unstaged and
untracked files. Vitest follows its module graph in affected workspaces; other
owning test runners run their full suite. Browser specs use the tested map in
`scripts/test-changed.config.json` and two representative phone/desktop projects.
Unknown or shared paths select all browser specs at those sizes. Selection and
reasons are printed; failures propagate. Run `git fetch origin main` to refresh
the baseline, and `bun run test:changed --all` for full unit and browser suites.
Install the repository dependencies and Playwright browsers first. This local
loop supplements the full CI gates.
The existing project tag filters still apply; theme and reduced-motion variants
are covered by `--all`. Existing test skips remain visible in the runner report.
