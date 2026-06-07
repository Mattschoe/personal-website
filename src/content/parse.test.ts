import { describe, it, expect } from 'vitest';
import { parseRecipes, parseProjects, parsePosts } from './parse';

// Build-time parse + validate + derive coverage. The seed Markdown files used to
// exercise this implicitly; with the suite decoupled from `content/`, this file
// restores it directly by running the parsers over small inline raw-markdown
// strings. The parsers take a `{ /path: rawFileContents }` map (the shape the
// `virtual:content` plugin and the Node reader both feed them).

const recipeMd = `---
title: Test Skewers
date: 2025-01-02
category: Grilling
time: 30 min
yield: Serves 4
effort: Easy
ingredients:
  - amount: 2
    item: chicken thighs
steps:
  - Grill.
---

The opening prose paragraph.

A second paragraph.
`;

const projectMd = `---
title: Test Project
date: 2025-02-01
summary: A small tool.
status: Live
year: 2025
role: Solo
stack:
  - React
---

Project body.
`;

const postMd = `---
title: Test Post
date: 2024-07-04
tags:
  - meta
---

# A Heading

**First** real _paragraph_.
`;

describe('parseRecipes', () => {
  it('derives slug from the path and excerpt from the first body paragraph', () => {
    const [recipe] = parseRecipes({ '/content/recipes/test-skewers.md': recipeMd });
    expect(recipe.slug).toBe('test-skewers');
    expect(recipe.excerpt).toBe('The opening prose paragraph.');
    expect(recipe.body).toContain('A second paragraph.');
    expect(recipe.ingredients[0].amount).toBe('2'); // YAML number → string
  });

  it('throws naming the file on invalid front-matter', () => {
    const bad = recipeMd.replace('category: Grilling\n', '');
    expect(() => parseRecipes({ '/content/recipes/broken.md': bad })).toThrow(
      /\/content\/recipes\/broken\.md/,
    );
  });

  it('rejects an unknown front-matter field (strict schema)', () => {
    const typo = recipeMd.replace('effort: Easy', 'effort: Easy\nbogus: nope');
    expect(() => parseRecipes({ '/content/recipes/typo.md': typo })).toThrow(/bogus/);
  });
});

describe('parseProjects', () => {
  it('derives slug and carries the body through', () => {
    const [project] = parseProjects({ '/content/projects/test-project.md': projectMd });
    expect(project.slug).toBe('test-project');
    expect(project.year).toBe('2025'); // YAML number → string
    expect(project.body).toBe('Project body.');
  });

  it('throws naming the file when a required field is missing', () => {
    const bad = projectMd.replace('summary: A small tool.\n', '');
    expect(() => parseProjects({ '/content/projects/broken.md': bad })).toThrow(
      /\/content\/projects\/broken\.md/,
    );
  });
});

describe('parsePosts', () => {
  it('derives slug, de-marked excerpt and reading time', () => {
    const [post] = parsePosts({ '/content/blog/test-post.md': postMd });
    expect(post.slug).toBe('test-post');
    expect(post.excerpt).toBe('First real paragraph.');
    expect(post.readingTime).toMatch(/^\d+ min read$/);
  });

  it('throws naming the file when tags are absent', () => {
    const bad = postMd.replace('tags:\n  - meta\n', '');
    expect(() => parsePosts({ '/content/blog/broken.md': bad })).toThrow(
      /\/content\/blog\/broken\.md/,
    );
  });
});
