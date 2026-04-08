---
title: "Markdown Content Pipeline"
domain: data-layer
difficulty: 2
difficulty_label: intermediate
reading_time: 15
tags:
  - learn
  - data-layer
  - intermediate
prerequisites:
  - "[[import-meta-glob]]"
  - "[[typescript-interfaces]]"
date: 2026-04-08
---

# Markdown Content Pipeline


## The Analogy

This pipeline is an ETL process -- Extract, Transform, Load. In SQL/data engineering, ETL means: (1) Extract raw data from source systems (CSV files, APIs, databases), (2) Transform it (clean, validate, compute derived columns), (3) Load it into the target warehouse as typed, queryable rows. The blog pipeline does exactly the same thing: (1) Extract raw `.md` files from the filesystem via `import.meta.glob`, (2) Transform them by parsing YAML frontmatter, rendering markdown to HTML, resolving SVG illustrations, and computing deterministic hashes, (3) Load the results into typed `BlogPost[]` arrays that components can query. The input is messy text files. The output is clean, typed, ready-to-render data.

## What It Is

The **markdown content pipeline** is the code in `src/lib/data/blog.ts` that turns raw markdown files into structured blog post data. It runs entirely at build time (when you run `bun run dev` or `bun run build`), so there is no runtime file parsing cost.

The pipeline has four stages:

1. **Discovery** -- `import.meta.glob` finds all `.md` files matching `/src/content/blog/**/index.md`. This is the "Extract" step.

2. **Frontmatter parsing** -- Each markdown file starts with a YAML header (called "frontmatter") delimited by `---`. The `parseFrontmatter()` function splits the file into metadata (title, date, tags) and content (the actual article text). This is like parsing a CSV with a header row.

3. **HTML rendering** -- The markdown content is converted to HTML using the `marked` library. This is the "Transform" step -- raw markdown becomes renderable HTML.

4. **Typed object construction** -- The parsed metadata and rendered HTML are assembled into `BlogPost` objects that conform to the `BlogPost` interface in `types.ts`. This is the "Load" step -- raw data becomes typed, queryable rows.

Additionally, the pipeline resolves SVG illustrations for each post -- either a custom `illustration.svg` co-located with the post, or a deterministic fallback selected by hashing the slug.

## Why It Matters

**Interview value:** "How do you handle content in a static site?" is a core architecture question. Understanding this pipeline shows you know the difference between build-time and runtime processing, how ETL principles apply outside databases, and how to design a content system that scales (adding a post requires zero code changes).

**Performance:** Because the pipeline runs at build time, blog pages are pure HTML with no runtime markdown parsing. The browser receives pre-rendered HTML -- fast, cacheable, SEO-friendly. This is the static-site equivalent of a materialized view vs. a live query.

**Content author experience:** Blog authors write markdown files and drop them in a directory. They do not edit TypeScript files, component code, or route configurations. The pipeline discovers and processes their content automatically.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/lib/data/blog.ts` | `parseFrontmatter()` function (line 6) | The Extract stage -- parses YAML metadata from raw markdown strings |
| `src/lib/data/blog.ts` | Lines 61-79: three `import.meta.glob` calls | The Discovery stage -- finds all .md files, custom SVGs, and fallback SVGs |
| `src/lib/data/blog.ts` | Lines 91-129: the processing loop | The Transform + Load stage -- builds typed BlogPost objects from raw data |
| `src/lib/data/blog.ts` | `slugHash()` and `resolveSvgFallbackName()` (lines 38-49) | Deterministic fallback resolution -- every post always gets the same fallback SVG |
| `src/lib/data/types.ts` | `interface BlogPost` (line 131) | The target schema -- every pipeline output must match this interface |

## The Mental Model

```
ETL Pipeline:

  EXTRACT                    TRANSFORM                          LOAD
  ───────                    ─────────                          ────

  Filesystem                 parseFrontmatter()                 BlogPost[]
  ┌──────────────┐           ┌──────────────────┐               ┌──────────────┐
  │ index.md     │           │ Split at '---'   │               │ {            │
  │              │  glob     │ YAML → metadata  │  construct    │   slug,      │
  │ ---          │──────────►│ Body → content   │──────────────►│   title,     │
  │ title: ...   │           │                  │               │   date,      │
  │ date: ...    │           │ marked.parse()   │               │   html,      │
  │ tags: [...]  │           │ Content → HTML   │               │   svg,       │
  │ ---          │           │                  │               │   tags,      │
  │              │           │ resolveSvg()     │               │   animation  │
  │ # Heading    │           │ Slug → SVG path  │               │ }            │
  │ Content...   │           └──────────────────┘               └──────────────┘
  └──────────────┘

  SQL equivalent:

  -- EXTRACT
  SELECT raw_content FROM filesystem
  WHERE path LIKE '/blog/%/index.md';

  -- TRANSFORM
  INSERT INTO blog_posts (slug, title, date, html, svg, tags, animation)
  SELECT
    PARSE_SLUG(file_path)                        AS slug,
    PARSE_YAML(raw_content, 'title')             AS title,
    PARSE_YAML(raw_content, 'date')              AS date,
    MARKDOWN_TO_HTML(SPLIT_BODY(raw_content))    AS html,
    COALESCE(custom_svg, fallback_svg(slug))     AS svg,
    PARSE_YAML_ARRAY(raw_content, 'tags')        AS tags,
    COALESCE(explicit_anim, hash_anim(slug))     AS animation
  FROM raw_files;
```

## Worked Example

Let's trace a single blog post through the entire pipeline.

### Stage 1: The raw file (on disk)

```markdown
<!-- File: src/content/blog/professional/building-a-transit-pipeline/index.md -->
---
title: Building a Transit Pipeline
date: 2024-03-15
excerpt: How I built an ELT pipeline for real-time transit data
tags: [python, postgresql, etl]
lang: en
category: professional
---

# Building a Transit Pipeline

Raw data from transit APIs needs cleaning, deduplication, and scheduling...
```

### Stage 2: Discovery (import.meta.glob)

```typescript
// From: src/lib/data/blog.ts (line 61)
// Vite finds this file and includes it in rawPosts:
const rawPosts = import.meta.glob('/src/content/blog/**/index.md', {
  query: '?raw', import: 'default', eager: true
}) as Record<string, string>;

// Result:
// rawPosts['/src/content/blog/professional/building-a-transit-pipeline/index.md']
//   = '---\ntitle: Building a Transit Pipeline\ndate: 2024-03-15\n...'
```

### Stage 3: Frontmatter parsing (parseFrontmatter)

```typescript
// From: src/lib/data/blog.ts (line 6)
function parseFrontmatter(raw: string): { data: Record<string, unknown>; content: string } {
  // Step 1: Match the --- delimiters using a regex.
  // The frontmatter is between the first --- and the second ---.
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { data: {}, content: raw };

  const frontmatter = match[1];   // 'title: Building a Transit Pipeline\ndate: 2024-03-15\n...'
  const content = match[2];       // '\n# Building a Transit Pipeline\n\nRaw data...'

  // Step 2: Parse each line of the YAML as key: value pairs.
  // This is a simplified YAML parser -- handles strings, booleans, and arrays.
  const data: Record<string, unknown> = {};
  for (const line of frontmatter.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();      // 'title'
    let value: unknown = line.slice(colonIdx + 1).trim();  // 'Building a Transit Pipeline'

    // Handle inline arrays: [python, postgresql, etl] → ['python', 'postgresql', 'etl']
    if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
      value = value.slice(1, -1).split(',').map((s) => s.trim());
    }
    // Handle booleans: 'true' → true, 'false' → false
    if (value === 'true') value = true;
    if (value === 'false') value = false;

    data[key] = value;
  }
  // Result:
  // data = { title: 'Building a Transit Pipeline', date: '2024-03-15',
  //          excerpt: 'How I built...', tags: ['python', 'postgresql', 'etl'],
  //          lang: 'en', category: 'professional' }
  // content = '\n# Building a Transit Pipeline\n\nRaw data...'
  return { data, content };
}
```

**SQL parallel:** This is like a staging table load. The raw CSV row is split into structured columns (`title`, `date`, `tags`) with type coercion (`'true'` becomes boolean `true`).

### Stage 4: SVG resolution + hash-based fallbacks

```typescript
// From: src/lib/data/blog.ts (lines 38-56)

// Deterministic hash: same slug always produces the same number.
// This is like a hash partition -- the slug determines which bucket the post falls into.
function slugHash(slug: string): number {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = ((hash << 5) - hash + slug.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// If the post has no custom illustration.svg, pick a fallback deterministically.
// Professional posts choose from PRO_FALLBACKS, personal from PERSONAL_FALLBACKS.
// The modulo (%) ensures the index wraps around the array length.
// slugHash('building-a-transit-pipeline') % 4 = always the same index.
export function resolveSvgFallbackName(slug: string, category: BlogCategory): string {
  const fallbacks = category === 'professional' ? PRO_FALLBACKS : PERSONAL_FALLBACKS;
  return fallbacks[slugHash(slug) % fallbacks.length];
}

// Same approach for animation type:
export function resolveAnimation(slug: string, explicit: string | undefined): BlogAnimation {
  if (explicit && ALL_ANIMATIONS.includes(explicit as BlogAnimation)) {
    return explicit as BlogAnimation;
  }
  return ALL_ANIMATIONS[slugHash(slug) % ALL_ANIMATIONS.length];
}
```

**Why deterministic?** If the fallback were random, every build would assign different SVGs to posts -- the site would look different each time you deploy. The hash-based approach guarantees stability: `building-a-transit-pipeline` always gets `pro-pipeline.svg` (or whichever fallback the hash selects). In SQL terms, this is like a deterministic function -- `SELECT hash_partition(slug)` returns the same value for the same input, every time.

### Stage 5: Typed object construction (the Load)

```typescript
// From: src/lib/data/blog.ts (lines 112-128)
(blogPosts as BlogPost[]).push({
  slug,                                              // 'building-a-transit-pipeline'
  title: { en: titleStr, [lang]: titleStr },         // LocalizedString
  excerpt: { en: excerptStr, [lang]: excerptStr },   // LocalizedString
  date: String(data.date ?? ''),                     // '2024-03-15'
  lang,                                              // 'en'
  category,                                          // 'professional'
  tags: Array.isArray(data.tags) ? data.tags : [],   // ['python', 'postgresql', 'etl']
  animation,                                         // 'draw' (resolved)
  svg,                                               // 'pro-pipeline.svg' (fallback)
  url: `/blog/${slug}`,                              // '/blog/building-a-transit-pipeline'
  external: data.external === true                   // false
});

// Pre-render markdown to HTML at build time:
htmlBySlug.set(slug, marked.parse(content, { async: false }) as string);
```

This is the final INSERT -- raw data has been cleaned, validated, enriched with derived values (SVG, animation), and loaded into the typed `BlogPost[]` array. Components query this array (via helper functions like `getLatestPosts()`) and render the results.

## Common Mistakes

1. **Trying to load files at runtime instead of build time:**
   - **What happens:** You use `fetch('/src/content/blog/...')` or `fs.readFileSync()` in a component. In a static build (no server), the file does not exist at that path in production -- it was compiled away by Vite.
   - **Fix:** Use `import.meta.glob` to load files at build time. The glob is resolved during compilation, and the file contents are baked into the JavaScript bundle.
   - **Why:** Build-time loading is like a materialized view. The data is computed once and served as static HTML. Runtime loading is like a live query -- it requires a server or filesystem access that may not exist in a static deployment.

2. **Not handling missing frontmatter fields:**
   - **What happens:** A blog post omits the `date` field in its frontmatter. The pipeline does not validate frontmatter at the schema level (it is a loose `Record<string, unknown>`), so `data.date` is `undefined`. The resulting `BlogPost` object has `date: 'undefined'` (a string), which breaks date sorting.
   - **Fix:** The pipeline uses `String(data.date ?? '')` to coalesce to an empty string. But the deeper fix is awareness: frontmatter is untyped input, so every field access needs a fallback. This is like `COALESCE(date_column, '')` in a staging-to-target ETL.
   - **Why:** Frontmatter is user-authored text -- it is external input that cannot be trusted. Unlike typed data files (which TypeScript validates), markdown frontmatter has no compile-time checks. Defensive parsing is mandatory.

3. **Assuming the slug is unique without verification:**
   - **What happens:** Two blog posts have the same directory name in different categories (e.g., `professional/hello/` and `personal/hello/`). Both get `slug: 'hello'`, and the second overwrites the first in `htmlBySlug`.
   - **Fix:** The slug is extracted from the directory path, which is unique per file. But if you changed the slug extraction logic, you could create collisions. The safest approach is to verify uniqueness after the loop (like a `UNIQUE` constraint check).
   - **Why:** In SQL, you would add `UNIQUE(slug)` to the table. In this pipeline, uniqueness is guaranteed by the filesystem (directory paths are unique), but the code does not explicitly validate it.

## Break It to Learn It

### Exercise 1: Trace the frontmatter parser

1. Open `src/lib/data/blog.ts`
2. Find the `parseFrontmatter()` function (line 6).
3. Mentally trace what happens with this input:
   ```
   ---
   title: Test Post
   tags: [sql, python]
   draft: true
   ---
   Hello world
   ```
4. **Predict:** What will `data` contain? What will `content` contain? Will `draft` be the string `'true'` or the boolean `true`?
5. **Verify:** Read lines 23-24 of the function: `if (value === 'true') value = true;`. So `draft` becomes boolean `true`.
6. **What you learned:** The parser does basic type coercion (strings to booleans, bracket notation to arrays). This is like implicit type casting in a staging ETL -- raw CSV values are strings, and the pipeline converts them to the target column types.

### Exercise 2: Test the deterministic hash

1. Open `src/lib/data/blog.ts`
2. After the `slugHash` function (line 44), add: `console.log('hash test:', slugHash('test-post'), slugHash('test-post'), slugHash('other-post'));`
3. **Predict:** Will the two `slugHash('test-post')` calls return the same value? Will `slugHash('other-post')` return a different value?
4. **Verify:** Run `bun run dev` and check the terminal. The two `test-post` hashes will be identical. The `other-post` hash will be different (with high probability).
5. **What you learned:** The hash is deterministic -- same input, same output, every time. This is why fallback SVGs are stable across builds.
6. **Undo your change.**

### Exercise 3: See the HTML rendering

1. Open `src/lib/data/blog.ts`
2. After line 128 (`htmlBySlug.set(...)`), add: `if (slug === blogPosts[0]?.slug) console.log('First post HTML:', htmlBySlug.get(slug)?.slice(0, 200));`
3. **Predict:** Will the output be raw markdown or rendered HTML (with `<h1>`, `<p>` tags)?
4. **Verify:** Run `bun run dev` and check the terminal. You should see HTML tags (`<p>`, `<h2>`, `<code>`) -- the markdown has been rendered by `marked.parse()`.
5. **What you learned:** `marked.parse()` is the Transform step -- it converts markdown syntax to HTML. This happens once at build time, not on every page view.
6. **Undo your change.**

## Connections

- **Depends on:** [[import-meta-glob]] because the pipeline's Extract stage uses `import.meta.glob` to discover files
- **Depends on:** [[typescript-interfaces]] because the pipeline's output conforms to the `BlogPost` interface
- **Related:** [[typed-data-files]] because the pipeline produces the same kind of typed array, just from file sources instead of inline definitions
- **Related:** [[data-driven-architecture]] because the pipeline is what makes blog content data-driven -- add a file, get a post
- **Related:** [[barrel-exports]] because the pipeline's output is re-exported through the barrel for component access

## Knowledge Check

1. What are the three stages of the blog content pipeline, and what ETL steps do they correspond to? --> See [The Analogy](#the-analogy)
2. Why does the pipeline use `marked.parse()` at build time instead of runtime? --> See [What It Is](#what-it-is)
3. How does `slugHash()` ensure fallback SVGs are stable across builds? --> See [Worked Example](#worked-example)
4. Why is frontmatter parsed as `Record<string, unknown>` instead of a typed interface? --> See [Common Mistakes](#common-mistakes)
5. What happens if you add a new markdown file to `src/content/blog/` without editing any TypeScript? --> See [The Mental Model](#the-mental-model)

## Go Deeper

- [marked library -- official docs](https://marked.js.org/)
- [Vite: Glob Import (the discovery mechanism)](https://vite.dev/guide/features.html#glob-import)
- [YAML frontmatter convention (explained by Jekyll, the originator)](https://jekyllrb.com/docs/front-matter/)
