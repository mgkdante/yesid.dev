---
title: "import.meta.glob"
domain: data-layer
difficulty: 2
difficulty_label: intermediate
reading_time: 12
tags:
  - learn
  - data-layer
  - intermediate
prerequisites:
  - "[[sveltekit-project-structure]]"
date: 2026-04-08
---

# import.meta.glob


## The Analogy

`import.meta.glob` is a wildcard query against the filesystem. In SQL, you write `SELECT * FROM files WHERE path LIKE '/blog/**/*.md'` to get all markdown files under a directory. In Vite (the build tool SvelteKit uses), you write `import.meta.glob('/src/content/blog/**/index.md')` to do the same thing -- it finds every file matching the glob pattern and returns them as a collection. Like a SQL query, you can control what comes back: eager (load everything upfront, like a materialized view) or lazy (load on demand, like a deferred query).

## What It Is

**`import.meta.glob`** is a Vite feature (not a TypeScript or JavaScript standard) that lets you import multiple files at once using glob patterns. At build time, Vite scans the filesystem, finds every file matching the pattern, and transforms the glob call into a set of actual imports.

The syntax:

```typescript
const modules = import.meta.glob('/src/content/blog/**/index.md');
```

This returns an object where:
- **Keys** are the file paths (e.g., `'/src/content/blog/professional/my-post/index.md'`)
- **Values** are either the file contents (if eager) or functions that lazily load the file (if not)

Three important options control behavior:

1. **`eager: true`** -- Load all files immediately at build time. Like a materialized view: all data is available instantly, but it all goes into the initial bundle. Used when you need every file at startup.

2. **`query: '?raw'`** -- Return the file as a raw string instead of processing it. Without `?raw`, Vite would try to compile `.md` files or parse `.svg` files. With `?raw`, you get the raw text content -- like `SELECT raw_content FROM files` instead of `SELECT processed_content`.

3. **`import: 'default'`** -- Extract only the default export from each module. Simplifies the result from `{ default: content }` to just `content`.

`import.meta.glob` only works at build time. It is evaluated by Vite's compiler, not by the JavaScript runtime. You cannot construct glob patterns dynamically -- the pattern must be a string literal.

## Why It Matters

**Interview value:** "How do you load content from the filesystem in a static site?" is a question that tests whether you understand build-time vs. runtime operations. Explaining `import.meta.glob` shows you know how modern bundlers bridge the gap between files on disk and data in the application.

**Zero-config content loading:** Without `import.meta.glob`, adding a blog post would require manually importing each markdown file in a data file. With it, every `.md` file in the content directory is automatically discovered -- true filesystem-driven content.

**Performance trade-off understanding:** Knowing the difference between eager and lazy loading demonstrates that you think about bundle size and initial load time -- critical for production applications.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/lib/data/blog.ts` | Lines 61-65: `rawPosts` glob | Loads all blog post markdown files as raw strings at build time |
| `src/lib/data/blog.ts` | Lines 68-72: `customSvgs` glob | Loads custom illustration SVGs for blog posts that have them |
| `src/lib/data/blog.ts` | Lines 75-79: `fallbackSvgs` glob | Loads fallback SVG illustrations from the assets directory |
| `src/lib/data/blog.ts` | Lines 91-129: processing loop | Iterates over glob results to build typed BlogPost objects |

## The Mental Model

```
Filesystem:
  src/content/blog/
  ├── professional/
  │   ├── building-a-transit-pipeline/
  │   │   └── index.md          ← matched
  │   └── sql-optimization-tips/
  │       └── index.md          ← matched
  └── personal/
      └── weekend-projects/
          └── index.md          ← matched


import.meta.glob call:
  const rawPosts = import.meta.glob(
    '/src/content/blog/**/index.md',
    { query: '?raw', import: 'default', eager: true }
  );


Result (at build time, Vite resolves this to):
  {
    '/src/content/blog/professional/building-a-transit-pipeline/index.md':
      '---\ntitle: Building a Transit Pipeline\ndate: 2024-03-15\n...',

    '/src/content/blog/professional/sql-optimization-tips/index.md':
      '---\ntitle: SQL Optimization Tips\ndate: 2024-02-01\n...',

    '/src/content/blog/personal/weekend-projects/index.md':
      '---\ntitle: Weekend Projects\ndate: 2024-01-20\n...',
  }


SQL equivalent:
  SELECT
    file_path AS key,
    raw_content AS value
  FROM filesystem
  WHERE file_path LIKE '/src/content/blog/%/index.md'
  ORDER BY file_path;

  -- eager: true  = SELECT ... (immediate, all rows)
  -- eager: false = DECLARE CURSOR ... FETCH NEXT (lazy, one at a time)
  -- ?raw         = raw_content column (no processing)
  -- import: 'default' = SELECT value (not SELECT * which includes metadata)
```

## Worked Example

Let's walk through the three `import.meta.glob` calls at the top of `src/lib/data/blog.ts`:

```typescript
// From: src/lib/data/blog.ts (lines 61-79)

// --- Glob 1: Blog post markdown files ---
// Pattern: '/src/content/blog/**/index.md'
//   ** matches any subdirectory depth
//   Matches: professional/my-post/index.md, personal/other/index.md
//
// Options:
//   query: '?raw' -- return the file as a raw string (the markdown source)
//   import: 'default' -- extract just the string, not a module wrapper
//   eager: true -- load ALL files immediately at build time
//
// SQL equivalent:
//   SELECT file_path, raw_text FROM blog_files
//   WHERE file_path LIKE '%/index.md'
const rawPosts = import.meta.glob('/src/content/blog/**/index.md', {
  query: '?raw',
  import: 'default',
  eager: true
}) as Record<string, string>;
// Type assertion: Record<string, string>
// means: an object with string keys (file paths) and string values (file contents)

// --- Glob 2: Custom illustration SVGs ---
// Same pattern but for illustration.svg files alongside the markdown.
// Not every post has one -- this only matches posts with custom art.
//
// SQL equivalent:
//   SELECT file_path, svg_content FROM blog_files
//   WHERE file_path LIKE '%/illustration.svg'
const customSvgs = import.meta.glob('/src/content/blog/**/illustration.svg', {
  query: '?raw',
  import: 'default',
  eager: true
}) as Record<string, string>;

// --- Glob 3: Fallback SVGs from the assets directory ---
// These are shared fallback illustrations for posts without custom SVGs.
// Different directory: src/lib/assets/ instead of src/content/
//
// SQL equivalent:
//   SELECT file_name, svg_content FROM fallback_svgs
const fallbackSvgs = import.meta.glob('/src/lib/assets/blog-fallbacks/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true
}) as Record<string, string>;
```

**After the globs, the processing loop:**

```typescript
// From: src/lib/data/blog.ts (lines 91-129)

// Iterate over every matched markdown file:
for (const [filepath, raw] of Object.entries(rawPosts)) {
  // filepath = '/src/content/blog/professional/my-post/index.md'
  // raw = '---\ntitle: My Post\ndate: 2024-03-15\n---\n\nContent here...'

  // Step 1: Parse frontmatter (YAML header) from the raw string
  const { data, content } = parseFrontmatter(raw);

  // Step 2: Extract the slug from the file path
  // '/src/content/blog/professional/my-post/index.md'
  //  parts = ['', 'src', 'content', 'blog', 'professional', 'my-post', 'index.md']
  //  slug = parts[parts.length - 2] = 'my-post'
  const parts = filepath.split('/');
  const slug = parts[parts.length - 2];

  // Step 3: Check if this post has a custom SVG illustration
  const svgPath = filepath.replace('index.md', 'illustration.svg');
  const hasCustomSvg = svgPath in customSvgs;

  // Step 4: Build a typed BlogPost object
  // This is where the raw file data becomes a validated, typed object
  (blogPosts as BlogPost[]).push({
    slug,
    title: { en: titleStr },
    excerpt: { en: excerptStr },
    date: String(data.date ?? ''),
    // ... more fields
  });
}
```

**The flow:** Glob discovers files --> parseFrontmatter extracts metadata --> slug comes from directory name --> typed BlogPost objects are created. Adding a new blog post means creating a new directory with an `index.md` file -- the glob automatically discovers it on the next build.

## Common Mistakes

1. **Using dynamic patterns (variables in the glob string):**
   - **What happens:** You write `import.meta.glob(\`/src/content/${category}/*.md\`)` hoping to load files from a dynamic directory. Vite throws an error or silently returns nothing.
   - **Fix:** Glob patterns must be string literals. Vite resolves them at compile time, not at runtime. If you need dynamic filtering, load all files with a broad glob and filter the results in JavaScript.
   - **Why:** `import.meta.glob` is a build-time directive. The compiler reads the literal string and generates imports. It cannot evaluate variables because variables only have values at runtime.

2. **Forgetting `eager: true` and treating results as strings:**
   - **What happens:** Without `eager: true`, the values in the result object are functions (`() => Promise<string>`), not strings. Your code tries to use them as strings and gets `[Function]` or `[object Promise]` instead of file contents.
   - **Fix:** Add `eager: true` if you need all data at build time (which you usually do for content files). If using lazy loading, `await` each value.
   - **Why:** Eager is like a materialized view (data ready immediately). Non-eager is like a cursor (data fetched on demand). Choose based on whether you need everything upfront or want to defer loading.

3. **Not using `?raw` for text files:**
   - **What happens:** Without `?raw`, Vite tries to process the file through its plugin pipeline. For `.md` files, it might try to compile them as JavaScript modules, producing errors or unexpected output.
   - **Fix:** Add `query: '?raw'` when you want the raw file contents as a string. This skips Vite's processing pipeline.
   - **Why:** `?raw` tells Vite "I will handle parsing myself." The `parseFrontmatter()` function in `blog.ts` handles the markdown parsing -- it needs the raw text, not a pre-processed module.

## Break It to Learn It

### Exercise 1: See what glob returns

1. Open `src/lib/data/blog.ts`
2. After the `rawPosts` glob (line 65), add: `console.log('Glob keys:', Object.keys(rawPosts));`
3. **Predict:** What will the keys look like? How many will there be?
4. **Verify:** Run `bun run dev` and check the terminal. You should see an array of file paths like `['/src/content/blog/professional/post-name/index.md', ...]`.
5. **What you learned:** The glob returns a Record (object) where keys are full file paths. The code parses these paths to extract slugs and categories.
6. **Undo your change.**

### Exercise 2: Remove the ?raw query

1. Open `src/lib/data/blog.ts`
2. In the `rawPosts` glob, remove `query: '?raw'` from the options object.
3. **Predict:** What will the values in `rawPosts` contain now -- raw markdown strings or something else?
4. **Verify:** Run `bun run dev`. You will likely see errors because Vite tries to process the `.md` files as modules instead of returning raw text. The `parseFrontmatter()` function receives the wrong input.
5. **What you learned:** `?raw` is critical for getting raw file contents. Without it, Vite applies its build pipeline, which transforms the file into something `parseFrontmatter()` cannot parse.
6. **Undo your change** -- restore `query: '?raw'`.

### Exercise 3: Add a test file and watch it get discovered

1. Create a new directory: `src/content/blog/professional/test-glob-exercise/`
2. Create `src/content/blog/professional/test-glob-exercise/index.md` with:
   ```
   ---
   title: Glob Test
   date: 2024-01-01
   excerpt: Testing glob discovery
   tags: [test]
   ---

   This is a test post.
   ```
3. **Predict:** Will this post appear in the blog listing without any code changes to `blog.ts`?
4. **Verify:** Run `bun run dev` and check the blog page. The new post should appear automatically because the glob pattern `**/index.md` matches it.
5. **What you learned:** `import.meta.glob` is filesystem-driven. New files matching the pattern are automatically discovered on the next build. No manual import needed.
6. **Undo your change** -- delete the `test-glob-exercise/` directory.

## Connections

- **Depends on:** [[sveltekit-project-structure]] because understanding where content files live is required before glob patterns make sense
- **Enables:** [[markdown-content-pipeline]] because `import.meta.glob` is the first step in the pipeline -- it discovers the files that the pipeline then processes
- **Related:** [[typed-data-files]] because glob results are transformed into typed arrays (BlogPost[]) validated against interfaces
- **Related:** [[barrel-exports]] because the blog data loaded by globs is re-exported through the barrel file

## Knowledge Check

1. What is the SQL equivalent of `import.meta.glob('/src/content/blog/**/index.md')`? --> See [The Analogy](#the-analogy)
2. What is the difference between `eager: true` and the default lazy loading? --> See [What It Is](#what-it-is)
3. Why must glob patterns be string literals and not variables? --> See [Common Mistakes](#common-mistakes)
4. What does `query: '?raw'` do, and what breaks without it? --> See [Common Mistakes](#common-mistakes)
5. How does adding a new `.md` file automatically extend the blog without code changes? --> See [Break It to Learn It](#exercise-3-add-a-test-file-and-watch-it-get-discovered)

## Go Deeper

- [Vite: Glob Import -- official docs](https://vite.dev/guide/features.html#glob-import)
- [Vite: Static Asset Handling (?raw, ?url, ?inline)](https://vite.dev/guide/assets.html#importing-asset-as-string)
