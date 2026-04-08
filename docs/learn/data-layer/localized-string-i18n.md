---
title: "LocalizedString & i18n"
domain: data-layer
difficulty: 2
difficulty_label: intermediate
reading_time: 12
tags:
  - learn
  - data-layer
  - intermediate
prerequisites:
  - "[[typescript-interfaces]]"
date: 2026-04-08
---

# LocalizedString & i18n


## The Analogy

LocalizedString works like SQL's `COALESCE` function. When you write `SELECT COALESCE(fr_text, en_text) AS display_text FROM content`, the database returns the French text if it exists, otherwise falls back to English. LocalizedString is an object with `{ en: string; fr?: string; es?: string; }`, and the `resolveLocale()` function performs exactly that fallback: check if the requested language exists, if not, return English. Simple, predictable, no surprises -- just like `COALESCE`.

## What It Is

**Internationalization (i18n)** is the practice of designing software so it can adapt to different languages without changing the code. The "i18n" abbreviation comes from the 18 letters between the "i" and "n" in "internationalization."

In this project, i18n is implemented at the data layer through two constructs:

1. **`LocalizedString` interface** -- an object that holds the same text in multiple languages. English (`en`) is always required. French (`fr`) and Spanish (`es`) are optional. This is defined in `src/lib/data/types.ts`:

```typescript
export interface LocalizedString {
  en: string;    // Always present (NOT NULL)
  fr?: string;   // Optional (NULL allowed)
  es?: string;   // Optional (NULL allowed)
}
```

2. **`resolveLocale()` function** -- the COALESCE equivalent. It takes a `LocalizedString` and a target `Locale`, and returns the best available string. If the target language is missing or empty, it falls back to English. This lives in `src/lib/data/locale.ts`.

The `Locale` type (`'en' | 'fr' | 'es'`) acts as a CHECK constraint -- only those three values are legal locale codes.

Components never access `localizedString.en` directly. They always call `resolveLocale(str, locale)` so that fallback logic is centralized in one function, not scattered across dozens of components.

## Why It Matters

**Interview value:** "How would you implement i18n in a TypeScript project?" is a common question. This project demonstrates a lightweight approach: no heavy framework, no runtime lookup tables -- just typed objects and a single resolver function. Understanding why this works (and where it falls short for larger apps) shows architectural judgment.

**Client value:** Freelance projects often need multi-language support eventually. Building with `LocalizedString` from day one means adding French later is a data task (fill in `fr` fields), not a code rewrite. The architecture is "cloud-ready" -- when a CMS or translation API arrives, it slots into the same interface.

**Correctness guarantee:** Without a centralized resolver, developers write ad-hoc fallback logic in every component: `title.fr || title.en`. Some forget the fallback. Some check for `null` but not empty strings. The centralized `resolveLocale()` handles all edge cases once, and every component inherits that correctness.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/lib/data/types.ts` | `interface LocalizedString` (line 12) | The schema definition -- defines the shape of all translatable text |
| `src/lib/data/types.ts` | `type Locale = 'en' \| 'fr' \| 'es'` (line 7) | The CHECK constraint on allowed locale codes |
| `src/lib/data/locale.ts` | `resolveLocale()` function (line 25) | The COALESCE implementation -- the only function that resolves translations |
| `src/lib/data/locale.ts` | `DEFAULT_LOCALE` and `SUPPORTED_LOCALES` constants | Configuration that controls fallback behavior |
| `src/lib/data/services.ts` | Every `title: { en: '...' }` and `description: { en: '...' }` | Real usage -- every piece of user-facing text is a LocalizedString |

## The Mental Model

```
SQL approach to translations:

  CREATE TABLE content (
    id INT PRIMARY KEY,
    en_text VARCHAR(500) NOT NULL,   -- always present
    fr_text VARCHAR(500) NULL,       -- might be missing
    es_text VARCHAR(500) NULL        -- might be missing
  );

  -- To get the best available text:
  SELECT COALESCE(fr_text, en_text) AS display_text
  FROM content WHERE id = 42;

  -- If fr_text is NULL, you get en_text.
  -- If fr_text is 'Bonjour', you get 'Bonjour'.
  -- en_text is NOT NULL, so you ALWAYS get something.


TypeScript approach (same logic, different syntax):

  interface LocalizedString {
    en: string;        // always present (NOT NULL)
    fr?: string;       // might be missing (NULL)
    es?: string;       // might be missing (NULL)
  }

  function resolveLocale(str: LocalizedString, locale: Locale): string {
    const value = str[locale];            // Try requested locale
    if (value && value.trim() !== '') {    // Non-empty?
      return value;                       // Use it
    }
    return str.en;                        // Else fallback to English
  }

  // Same guarantee: you ALWAYS get a non-empty string.
```

The fallback chain is intentionally flat: `requested locale --> English`. There is no intermediate step (no `es --> fr --> en`). This mirrors a simple `COALESCE(target, fallback)` -- two arguments, predictable behavior.

## Worked Example

Let's walk through the `resolveLocale()` function from `src/lib/data/locale.ts`:

```typescript
// From: src/lib/data/locale.ts

import type { Locale, LocalizedString } from './types.js';

// Step 1: Define the default fallback locale.
// English is the guaranteed column -- always NOT NULL.
export const DEFAULT_LOCALE: Locale = 'en';

// Step 2: List all supported locales.
// This is metadata -- used for building language selectors, not for fallback logic.
export const SUPPORTED_LOCALES: readonly Locale[] = ['en', 'fr', 'es'];

// Step 3: The resolver function.
// Contract: receives a LocalizedString and a Locale, returns a string.
// NEVER returns undefined, NEVER returns an empty string.
export function resolveLocale(localizedString: LocalizedString, locale: Locale): string {
  // Step 3a: Look up the requested locale.
  // localizedString[locale] could be undefined (if fr/es is missing)
  // or an empty string (if someone set fr: '' as a placeholder).
  const value = localizedString[locale];

  // Step 3b: Check for a real, non-empty value.
  // The trim() handles strings that are only whitespace -- treat them as missing.
  // This is like: WHERE fr_text IS NOT NULL AND LTRIM(RTRIM(fr_text)) != ''
  if (value && value.trim() !== '') {
    return value;
  }

  // Step 3c: Fallback to English.
  // Because en: string (no ?) in the interface, this is guaranteed to exist.
  // This is the COALESCE fallback -- always returns something.
  return localizedString.en;
}
```

**Walk through three scenarios:**

| Input | Locale | Result | Why |
|-------|--------|--------|-----|
| `{ en: 'Hello', fr: 'Bonjour' }` | `'fr'` | `'Bonjour'` | French exists and is non-empty |
| `{ en: 'Hello' }` | `'fr'` | `'Hello'` | French is undefined, falls back to English |
| `{ en: 'Hello', fr: '  ' }` | `'fr'` | `'Hello'` | French is whitespace-only, treated as missing |

In SQL: `SELECT COALESCE(NULLIF(LTRIM(RTRIM(fr_text)), ''), en_text)` -- that is what `resolveLocale` does in one function.

## Common Mistakes

1. **Accessing `.en` directly instead of using `resolveLocale()`:**
   - **What happens:** A component does `service.title.en` instead of `resolveLocale(service.title, currentLocale)`. The component always shows English, even when French translations exist and the user has selected French.
   - **Fix:** Always use `resolveLocale()`. Never read a specific locale key directly in component code.
   - **Why:** Direct access bypasses fallback logic and hardcodes the language. When the site adds a language switcher, components using direct access will not respond to locale changes.

2. **Using empty strings as "not translated yet" placeholders:**
   - **What happens:** Someone sets `{ en: 'Hello', fr: '' }` thinking the empty French string will be ignored. But without the `trim()` check, an empty string is truthy in some languages and falsy in JavaScript -- behavior is unpredictable.
   - **Fix:** This project's `resolveLocale()` already handles empty strings correctly (treating them as missing). But the best practice is to omit the property entirely: `{ en: 'Hello' }` -- no `fr` key at all.
   - **Why:** `undefined` clearly means "not present." An empty string is ambiguous -- does it mean "not translated" or "intentionally empty"?

3. **Building a complex fallback chain (es -> fr -> en):**
   - **What happens:** You modify `resolveLocale()` to try Spanish, then French, then English. Now a Spanish user seeing French content is confused -- they expected English as the fallback, not a random third language.
   - **Fix:** Keep the fallback simple: requested locale, then English. Two levels. The comment in `locale.ts` explicitly says "There is no intermediate chain."
   - **Why:** Complex fallback chains are surprising and hard to debug. `COALESCE(target, en)` is predictable. `COALESCE(target, secondary, tertiary, en)` creates confusing behavior when different fields fall back to different languages.

## Break It to Learn It

### Exercise 1: See the fallback in action

1. Open `src/lib/data/services.ts`
2. Find the first service. Add a French title: change `title: { en: 'SQL Development & Optimization' }` to `title: { en: 'SQL Development & Optimization', fr: 'Developpement SQL' }`.
3. Open `src/lib/data/metro.ts` and find the `formatStopLabel` function (line 79). It calls `resolveLocale(stop.label, locale)`.
4. **Predict:** If you call `formatStopLabel(someStop, 'fr')` for this service's metro stop, what will it return?
5. **Verify:** Add a temporary `console.log(formatStopLabel(metroStops[1], 'fr'))` at the bottom of `metro.ts`, run `bun run dev`, and check the terminal.
6. **What you learned:** `resolveLocale()` automatically uses the French translation when available. No component changes needed -- the data layer drives the language.
7. **Undo all changes.**

### Exercise 2: Break the fallback guarantee

1. Open `src/lib/data/types.ts`
2. Find the `LocalizedString` interface. Change `en: string;` to `en?: string;` (make English optional).
3. **Predict:** What will happen to `resolveLocale()`'s guarantee of always returning a non-empty string?
4. **Verify:** Run `bun run check`. You should see errors in `locale.ts` -- the function's `return localizedString.en` line now returns `string | undefined`, which does not match the return type `string`.
5. **What you learned:** The entire i18n system depends on `en` being required. Making it optional breaks the COALESCE guarantee -- there is no final fallback. This is why `en` is NOT NULL.
6. **Undo your change** -- restore `en: string;`.

### Exercise 3: Test edge case handling

1. Open `src/lib/data/locale.ts`
2. Remove the `trim()` check: change `if (value && value.trim() !== '')` to `if (value)`.
3. **Predict:** What happens when a LocalizedString has `fr: '   '` (whitespace-only French)?
4. **Verify:** The whitespace-only string is truthy, so `resolveLocale` returns `'   '` instead of falling back to English. Components would render blank space.
5. **What you learned:** The `trim()` check is defensive programming. It treats whitespace-only strings as missing, the same way `NULLIF(LTRIM(RTRIM(fr_text)), '')` converts blank strings to NULL in SQL.
6. **Undo your change** -- restore the `trim()` check.

## Connections

- **Depends on:** [[typescript-interfaces]] because `LocalizedString` is itself an interface, and understanding interfaces is required to understand how the type enforces the `en` requirement
- **Related:** [[typed-data-files]] because every text field in every typed data file uses `LocalizedString`
- **Enables:** [[data-driven-architecture]] because data-driven design requires all content to be localizable -- hardcoded strings cannot be translated

## Knowledge Check

1. What SQL function does `resolveLocale()` mirror? --> See [The Analogy](#the-analogy)
2. Why is `en: string` required (no `?`) while `fr` and `es` are optional? --> See [The Mental Model](#the-mental-model)
3. Why should components never access `localizedString.en` directly? --> See [Common Mistakes](#common-mistakes)
4. What happens to whitespace-only translations like `fr: '  '`? --> See [Worked Example](#worked-example)
5. How would you add a new locale (e.g., German) to this system? --> See [What It Is](#what-it-is)

## Go Deeper

- [TypeScript Handbook: Index Signatures and Mapped Types](https://www.typescriptlang.org/docs/handbook/2/objects.html#index-signatures)
- [MDN: Internationalization (i18n) concepts](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Internationalization)
