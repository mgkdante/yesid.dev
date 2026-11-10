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

Run `bun run test:changed` from the root on Windows or Linux after installing
repository dependencies and Playwright browsers. It uses the merge base with
`origin/main` plus staged, unstaged and untracked files; fetch main to refresh it.
Vitest follows affected module graphs. Data, assets and generators use full
owning suites; filesystem-based checks are retained explicitly. The tested browser map selects changed/related
specs at phone and desktop sizes; unknown/shared paths select all specs there.
Selection reasons, runner results and elapsed times are printed. Existing project
filters and skips apply. Use `--all` for full suites, including theme/motion
variants, or `--base HEAD` to benchmark a small edit against a candidate commit.
This local loop supplements the full CI gates; failures propagate.
