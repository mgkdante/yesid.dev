// One-shot: spawn `bunx payload migrate:create --name initial-content --force-accept-warning`,
// stream its stdout to our stdout, and whenever we see drizzle-kit's rename-prompt pattern,
// send '\r' (Enter) to accept the default (first option = "create column").
//
// Rationale: 18b-7 consolidated migration generates ~50+ column-rename questions (every new
// column across 5 collections + 10 globals). The prompts library reads raw-mode stdin and
// requires actual ENTER (CR) keystrokes, not buffered \n on a pipe. Spawning the child with
// a controlled stdin we write to programmatically is the reliable non-TTY path.
//
// Usage: `bun run scripts/auto-migrate-create.mjs`
// Run from the yesid-dev-cms repo root.

import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')

const isWin = process.platform === 'win32'
const bunxCmd = isWin ? 'bunx.exe' : 'bunx'

const child = spawn(
  bunxCmd,
  ['payload', 'migrate:create', '--name', 'initial-content', '--force-accept-warning'],
  {
    cwd: repoRoot,
    env: process.env,
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: false,
  },
)

let buffer = ''
let promptCount = 0

child.stdout.on('data', (chunk) => {
  const text = chunk.toString()
  process.stdout.write(text)
  buffer += text

  // Match drizzle-kit's prompt format, e.g.:
  // "Is credit column in media table created or renamed from another column?"
  // "Is services table created or renamed?"
  // After each such question, drizzle presents options with a cursor (❯) on the first.
  // Default (first option) is always "+ <thing>    create ..." — which is what we want.
  // Detect the prompt settling (a line ending in the options marker or idle for 500ms) and send \r.
})

child.stderr.on('data', (chunk) => {
  process.stderr.write(chunk)
})

// Poll buffer every 300ms; if stable AND looks like a prompt, press Enter.
// Secondary safety: every 800ms, if we detect '❯' anywhere in recent buffer, fire Enter.
// Tertiary safety: hard-send Enter every 5s as a spam loop — harmless if child isn't waiting.
let lastBufferLen = 0
let stableTicks = 0
let lastEnterAt = 0

const fireEnter = (reason) => {
  const now = Date.now()
  if (now - lastEnterAt < 250) return // debounce: don't fire within 250ms of last send
  promptCount += 1
  process.stdout.write(`\n[auto-migrate-create] sending Enter #${promptCount} (${reason})\n`)
  child.stdin.write('\r')
  lastEnterAt = now
  buffer = '' // reset to avoid re-triggering on same tail
  stableTicks = 0
}

const pollInterval = setInterval(() => {
  if (child.exitCode !== null) {
    clearInterval(pollInterval)
    return
  }
  if (buffer.length === lastBufferLen) {
    stableTicks += 1
  } else {
    stableTicks = 0
    lastBufferLen = buffer.length
  }
  // Primary: buffer stable for 2 ticks + contains cursor or 'create column'.
  if (stableTicks >= 2) {
    const tail = buffer.slice(-600) // wider window to survive many-option prompts
    if (tail.includes('❯') || tail.includes('create column')) {
      fireEnter('stable+cursor')
    }
  }
}, 300)

// Spam fallback: blind Enter every 4s. Child ignores if not at a prompt.
const spamInterval = setInterval(() => {
  if (child.exitCode !== null) {
    clearInterval(spamInterval)
    return
  }
  fireEnter('spam-safety')
}, 4000)

child.on('exit', (code) => {
  clearInterval(pollInterval)
  clearInterval(spamInterval)
  process.stdout.write(`\n[auto-migrate-create] exit code ${code}, total prompts answered: ${promptCount}\n`)
  process.exit(code ?? 0)
})
