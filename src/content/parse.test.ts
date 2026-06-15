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
stack:
  - React
---

Project body.
`;

const postMd = `---
title: Test Post
date: 2024-07-04
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

  it('keeps a flat ingredient list as one unheaded group', () => {
    const [recipe] = parseRecipes({ '/content/recipes/test-skewers.md': recipeMd });
    expect(recipe.ingredientGroups).toEqual([
      { items: [{ amount: '2', item: 'chicken thighs' }] },
    ]);
    // Flattened list mirrors the single group.
    expect(recipe.ingredients).toEqual([{ amount: '2', item: 'chicken thighs' }]);
  });

  it('normalises grouped ingredients into groups + a flattened list', () => {
    const groupedMd = `---
title: Grouped
date: 2025-01-03
category: Grilling
time: 30 min
yield: Serves 4
ingredients:
  - heading: Marinade
    items:
      - amount: 2 tbsp
        item: soy
  - heading: Skewers
    items:
      - amount: 600 g
        item: chicken
steps:
  - Grill.
---

Body.
`;
    const [recipe] = parseRecipes({ '/content/recipes/grouped.md': groupedMd });
    expect(recipe.ingredientGroups).toEqual([
      { heading: 'Marinade', items: [{ amount: '2 tbsp', item: 'soy' }] },
      { heading: 'Skewers', items: [{ amount: '600 g', item: 'chicken' }] },
    ]);
    expect(recipe.ingredients).toEqual([
      { amount: '2 tbsp', item: 'soy' },
      { amount: '600 g', item: 'chicken' },
    ]);
  });

  it('throws naming the file on invalid front-matter', () => {
    const bad = recipeMd.replace('category: Grilling\n', '');
    expect(() => parseRecipes({ '/content/recipes/broken.md': bad })).toThrow(
      /\/content\/recipes\/broken\.md/,
    );
  });

  it('rejects an unknown front-matter field (strict schema)', () => {
    const typo = recipeMd.replace('yield: Serves 4', 'yield: Serves 4\nbogus: nope');
    expect(() => parseRecipes({ '/content/recipes/typo.md': typo })).toThrow(/bogus/);
  });

  it('throws naming the file on malformed YAML (not just invalid fields)', () => {
    // An unterminated quote makes gray-matter/js-yaml throw before zod runs.
    const badYaml = recipeMd.replace('title: Test Skewers', 'title: "Unterminated');
    expect(() => parseRecipes({ '/content/recipes/bad-yaml.md': badYaml })).toThrow(
      /\/content\/recipes\/bad-yaml\.md/,
    );
  });

  it('hints about tabs when YAML indentation is bad', () => {
    // A tab before a nested key is the canonical "bad indentation" mistake.
    const tabbed = recipeMd.replace('  - amount: 2\n', '\t- amount: 2\n');
    expect(() => parseRecipes({ '/content/recipes/tabs.md': tabbed })).toThrow(
      /indent with spaces, not tabs/,
    );
  });

  it('labels a missing required field as missing, not a cryptic type error', () => {
    const bad = recipeMd.replace('category: Grilling\n', '');
    expect(() => parseRecipes({ '/content/recipes/no-cat.md': bad })).toThrow(
      /category: required, but missing/,
    );
  });

  it('names the actual type when a field is the wrong type', () => {
    const bad = recipeMd.replace('steps:\n  - Grill.\n', 'steps: nope\n');
    expect(() => parseRecipes({ '/content/recipes/wrong-type.md': bad })).toThrow(
      /steps: should be a list, but got text/,
    );
  });

  it('leads with a structural cause when no fields parse at all', () => {
    // Empty front-matter block → gray-matter yields {} → every field "missing".
    const empty = `---\n\n---\n\nBody.\n`;
    expect(() => parseRecipes({ '/content/recipes/empty.md': empty })).toThrow(
      /no fields were found/,
    );
    expect(() => parseRecipes({ '/content/recipes/empty.md': empty })).toThrow(/tabs/);
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

  it('throws naming the file when a required field is absent', () => {
    const bad = postMd.replace('title: Test Post\n', '');
    expect(() => parsePosts({ '/content/blog/broken.md': bad })).toThrow(
      /\/content\/blog\/broken\.md/,
    );
  });
});
