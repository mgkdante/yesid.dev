# [Concept Name]

> **Domain:** [project-setup | frontend | styling | motion | 3d-graphics | data-layer | testing | devops | patterns | debugging]
> **Difficulty:** [1-beginner | 2-intermediate | 3-advanced]
> **Prerequisites:** [list of other learn doc slugs, or "none"]
> **Estimated reading time:** [X min]

## The Analogy

[Explain this to someone who knows SQL and basic programming. Use a metaphor they'd instantly get. 2-3 sentences. Example: "A Svelte component is like a stored procedure that also controls what the user sees. It takes parameters (props), runs logic, and outputs a result (HTML). But unlike a stored proc, it re-runs automatically when its inputs change."]

## What It Is

[Technical explanation. Define every term on first use. Start simple, add layers. 1-3 paragraphs.]

## Why It Matters

[What job interview question does this answer? What client problem does this solve? What breaks if you don't understand this? 2-3 sentences connecting to career value.]

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/lib/components/X.svelte` | The `$state()` declarations | Shows reactive state in a real shipping component |

[2-5 rows. Only files that ACTUALLY EXIST in this repo.]

## The Mental Model

[Whiteboard-style explanation. ASCII diagram, numbered steps, or a "what happens when..." walkthrough. Make the invisible visible.]

## Worked Example

[Pick ONE real example from this codebase. Walk through it line by line with annotations.]

```typescript
// From: src/lib/components/RealFile.svelte
// This component does X. Here's how:

// Step 1: Declare reactive state (like declaring a variable that auto-updates its dependents)
let count = $state(0);

// Step 2: Derive a computed value (like a computed column in a SQL view)
let doubled = $derived(count * 2);
```

[After the code block, explain the flow in plain language.]

## Common Mistakes

1. **[Mistake name]:** [What a beginner would do]
   - **What happens:** [The error or broken behavior]
   - **Fix:** [The correct approach]
   - **Why:** [Root cause, so they learn the principle not just the fix]

2. **[Mistake name]:** [...]

## Break It to Learn It

### Exercise 1: [Name]
1. Open `src/lib/components/RealFile.svelte`
2. [Specific instruction: comment out line X, change Y to Z, delete W]
3. **Predict:** What will happen when you reload localhost?
4. **Verify:** Run `bun run dev`, open the page, observe
5. **What you learned:** [One sentence about the principle this demonstrates]
6. **Undo your change**

### Exercise 2: [Name]
[Same format, targeting a different aspect of the concept]

### Exercise 3: [Name]
[Same format, slightly harder]

## Connections

- **Depends on:** [concept-slug](../domain/slug.md) because [why]
- **Enables:** [concept-slug](../domain/slug.md) because [why]
- **Related:** [concept-slug](../domain/slug.md) because [how they interact]

## Knowledge Check

[3-5 self-test questions. Each one links to the section with the answer.]

1. [Question]? → See [The Mental Model](#the-mental-model)
2. [Question]? → See [Common Mistakes](#common-mistakes)

## Go Deeper

- [Official docs URL — always first]
- [One high-quality tutorial, Odin Project lesson, or MDN guide]
