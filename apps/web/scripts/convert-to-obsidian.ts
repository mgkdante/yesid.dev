/**
 * Convert docs/learn/ markdown files to Obsidian-compatible format.
 *
 * Changes:
 * 1. Blockquote metadata → YAML frontmatter with tags
 * 2. Relative markdown links → Obsidian wikilinks [[slug]]
 * 3. Adds consistent tags for domain, difficulty, project
 *
 * Run: bun scripts/convert-to-obsidian.ts
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, basename, dirname } from 'node:path';

const LEARN_DIR = 'docs/learn';

const DOMAIN_DIRS = [
  'project-setup', 'frontend', 'styling', 'data-layer', 'motion',
  '3d-graphics', 'testing', 'devops', 'patterns', 'debugging'
];

// Map slug → human-readable name for wikilink display text
const SLUG_TO_NAME: Record<string, string> = {};

// Build slug→name map by reading the # heading from each doc
async function buildSlugMap(): Promise<void> {
  for (const domain of DOMAIN_DIRS) {
    const dirPath = join(LEARN_DIR, domain);
    let files: string[];
    try { files = await readdir(dirPath); } catch { continue; }

    for (const file of files) {
      if (!file.endsWith('.md')) continue;
      const slug = file.replace('.md', '');
      const content = await readFile(join(dirPath, file), 'utf-8');
      const heading = content.match(/^# (.+)$/m);
      if (heading) {
        SLUG_TO_NAME[slug] = heading[1];
      }
    }
  }
}

function parseDifficulty(diffStr: string): { level: number; label: string } {
  const match = diffStr.match(/(\d)-(\w+)/);
  if (match) return { level: parseInt(match[1]), label: match[2] };
  return { level: 1, label: 'beginner' };
}

function extractPrereqSlugs(prereqLine: string): string[] {
  // Matches [text](file.md) or [text](../dir/file.md)
  const matches = [...prereqLine.matchAll(/\[([^\]]+)\]\((?:\.\.\/[^/]+\/)?([^)]+)\.md\)/g)];
  return matches.map(m => m[2]); // slug from filename
}

function convertInternalLinks(content: string): string {
  // Convert [display text](../domain/slug.md) → [[slug|display text]]
  // Convert [display text](slug.md) → [[slug|display text]]
  return content.replace(
    /\[([^\]]+)\]\((?:\.\.\/[^/]+\/)?([a-z0-9-]+)\.md\)/g,
    (_, displayText, slug) => {
      // If display text matches the slug (with hyphens), just use [[slug]]
      const slugAsText = slug.replace(/-/g, ' ');
      if (displayText.toLowerCase().replace(/-/g, ' ') === slugAsText) {
        return `[[${slug}]]`;
      }
      return `[[${slug}|${displayText}]]`;
    }
  );
}

async function convertFile(filePath: string, domain: string): Promise<void> {
  let content = await readFile(filePath, 'utf-8');

  // Extract metadata from blockquote header
  const domainMatch = content.match(/>\s*\*\*Domain:\*\*\s*(.+)/);
  const difficultyMatch = content.match(/>\s*\*\*Difficulty:\*\*\s*(.+)/);
  const prereqMatch = content.match(/>\s*\*\*Prerequisites:\*\*\s*(.+)/);
  const timeMatch = content.match(/>\s*\*\*Estimated reading time:\*\*\s*(.+)/);
  const headingMatch = content.match(/^# (.+)$/m);

  const title = headingMatch?.[1] ?? basename(filePath, '.md');
  const domainVal = domainMatch?.[1]?.trim() ?? domain;
  const diffStr = difficultyMatch?.[1]?.trim() ?? '1-beginner';
  const { level: diffLevel, label: diffLabel } = parseDifficulty(diffStr);
  const prereqLine = prereqMatch?.[1]?.trim() ?? 'none';
  const readingTime = timeMatch?.[1]?.trim().replace(' min', '') ?? '10';

  const prereqSlugs = prereqLine === 'none' ? [] : extractPrereqSlugs(prereqLine);

  // Build tags
  const tags = ['learn', domain];
  tags.push(diffLabel);

  // Build YAML frontmatter
  const frontmatter = [
    '---',
    `title: "${title}"`,
    `domain: ${domainVal}`,
    `difficulty: ${diffLevel}`,
    `difficulty_label: ${diffLabel}`,
    `reading_time: ${readingTime}`,
    `tags:`,
    ...tags.map(t => `  - ${t}`),
  ];

  if (prereqSlugs.length > 0) {
    frontmatter.push(`prerequisites:`);
    for (const slug of prereqSlugs) {
      frontmatter.push(`  - "[[${slug}]]"`);
    }
  }

  frontmatter.push(`date: 2026-04-08`);
  frontmatter.push('---');

  // Remove the old blockquote metadata block (the > lines after the heading)
  // Pattern: # Heading\n\n> **Domain:** ...\n> **Difficulty:** ...\n> **Prerequisites:** ...\n> **Estimated reading time:** ...
  content = content.replace(
    /^(# .+\n)\n(?:>\s*\*\*(?:Domain|Difficulty|Prerequisites|Estimated reading time):\*\*.+\n)+/m,
    `${frontmatter.join('\n')}\n\n$1\n`
  );

  // Convert internal links to wikilinks
  content = convertInternalLinks(content);

  await writeFile(filePath, content, 'utf-8');
}

async function convertReadme(): Promise<void> {
  const readmePath = join(LEARN_DIR, 'README.md');
  let content = await readFile(readmePath, 'utf-8');

  // Add frontmatter to README (becomes the MOC - Map of Content)
  const frontmatter = [
    '---',
    'title: "yesid.dev Knowledge Base"',
    'tags:',
    '  - learn',
    '  - MOC',
    'date: 2026-04-08',
    '---',
    ''
  ].join('\n');

  // Only add frontmatter if not already present
  if (!content.startsWith('---')) {
    content = frontmatter + content;
  }

  // Convert internal links to wikilinks
  content = convertInternalLinks(content);

  await writeFile(readmePath, content, 'utf-8');
}

async function main(): Promise<void> {
  console.log('Building slug map...');
  await buildSlugMap();
  console.log(`Found ${Object.keys(SLUG_TO_NAME).length} docs`);

  let converted = 0;
  for (const domain of DOMAIN_DIRS) {
    const dirPath = join(LEARN_DIR, domain);
    let files: string[];
    try { files = await readdir(dirPath); } catch { continue; }

    for (const file of files) {
      if (!file.endsWith('.md')) continue;
      await convertFile(join(dirPath, file), domain);
      converted++;
    }
  }

  console.log(`Converted ${converted} learn docs`);

  await convertReadme();
  console.log('Converted README.md');

  console.log('Done! Open docs/learn/ as an Obsidian vault.');
}

main().catch(console.error);
