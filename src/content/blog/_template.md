---
# REQUIRED
title: Your Post Title Here
excerpt: A one or two sentence summary that appears on the blog listing cards.
date: 2026-04-05
# lang: en | fr | es
lang: en
# category: professional | personal
category: professional
# tags: array of lowercase keywords — used for filtering on the listing page
tags: [sql, postgresql]

# OPTIONAL — SVG illustration
# animation: draw | morph | draw-fill (deterministic per-slug if omitted)
#   draw       — paths draw stroke-by-stroke (DrawSVGPlugin)
#   morph      — elements scale in from small (MorphSVGPlugin)
#   draw-fill  — paths draw on, then fill with subtle color wash
# animation: draw

# svg: illustration.svg (filename in same folder — fallback assigned if omitted)
#   If you provide a custom SVG, place it in the same folder as this index.md
#   Requirements: viewBox="0 0 48 48", stroke-only (no fills), brand colors
#   Professional: stroke="#E07800"  |  Personal: stroke="#FFB627"
# svg: illustration.svg

# OPTIONAL — External link (opens in new tab instead of detail page)
# external: true
# url: https://linkedin.com/posts/your-post
external: false
---

# Your Post Title Here

Write your post content in standard markdown. Everything below the `---` frontmatter delimiters is the post body.

## Supported Markdown Features

### Headings (h2, h3, h4)

Use `##` for main sections, `###` for subsections.

### Text Formatting

**Bold text** for emphasis. *Italic text* for softer emphasis. [Links](https://example.com) in brand orange.

### Lists

Unordered:
- First item
- Second item
- Third item

Ordered:
1. Step one
2. Step two
3. Step three

### Code Blocks

Inline code: `SELECT * FROM users`

Fenced code blocks with language hint:

```sql
SELECT
  u.name,
  COUNT(o.id) AS order_count
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
GROUP BY u.name
ORDER BY order_count DESC;
```

### Blockquotes

> Blockquotes render with an orange left border. Great for callouts, quotes, or key takeaways.

### Images

Place images in the same folder as index.md and reference them:

![Alt text](./my-image.png)

---

## File Structure

Place your post in the correct category folder:

```
src/content/blog/
├── professional/
│   └── your-post-slug/
│       ├── index.md          ← this file
│       ├── illustration.svg  ← optional custom SVG
│       └── screenshot.png    ← optional images
└── personal/
    └── your-post-slug/
        ├── index.md
        └── illustration.svg
```

The folder name becomes the URL slug: `/blog/your-post-slug`
