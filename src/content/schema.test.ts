import { describe, it, expect } from 'vitest';
import { recipeFrontmatter, projectFrontmatter, postFrontmatter } from './schema';

const validRecipe = {
  title: 'Test Recipe',
  date: '2024-01-01',
  category: 'Soups',
  time: '35 min',
  yield: 'Serves 4',
  effort: 'Easy',
  ingredients: [{ amount: '2 tins', item: 'tomatoes' }],
  steps: ['Roast.', 'Blend.'],
};

const validProject = {
  title: 'Test Project',
  date: '2024-01-01',
  summary: 'A thing.',
  status: 'Active',
  year: '2024',
  role: 'Solo',
  stack: ['Rust'],
};

const validPost = {
  title: 'Test Post',
  date: '2024-01-01',
  tags: ['workflow'],
};

describe('content schemas', () => {
  it('parses valid front-matter for every stream', () => {
    expect(recipeFrontmatter.safeParse(validRecipe).success).toBe(true);
    expect(projectFrontmatter.safeParse(validProject).success).toBe(true);
    expect(postFrontmatter.safeParse(validPost).success).toBe(true);
  });

  it('fails when a required field is missing', () => {
    const noCategory: Record<string, unknown> = { ...validRecipe };
    delete noCategory.category;
    const result = recipeFrontmatter.safeParse(noCategory);
    expect(result.success).toBe(false);
  });

  it('fails on a wrong field type', () => {
    const result = recipeFrontmatter.safeParse({ ...validRecipe, ingredients: 'nope' });
    expect(result.success).toBe(false);
  });

  it('rejects unknown keys (strict)', () => {
    const result = postFrontmatter.safeParse({ ...validPost, titel: 'typo' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(JSON.stringify(result.error.issues)).toContain('titel');
    }
  });

  it('normalises a YAML Date back to a YYYY-MM-DD string', () => {
    const result = postFrontmatter.safeParse({
      ...validPost,
      date: new Date('2024-07-04T00:00:00Z'),
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.date).toBe('2024-07-04');
  });

  it('rejects a malformed date string', () => {
    const result = postFrontmatter.safeParse({ ...validPost, date: '04-07-2024' });
    expect(result.success).toBe(false);
  });

  it('coerces numeric year and ingredient amounts to strings', () => {
    const project = projectFrontmatter.safeParse({ ...validProject, year: 2025 });
    expect(project.success).toBe(true);
    if (project.success) expect(project.data.year).toBe('2025');

    const recipe = recipeFrontmatter.safeParse({
      ...validRecipe,
      ingredients: [{ amount: 1, item: 'lime' }],
    });
    expect(recipe.success).toBe(true);
    if (recipe.success) expect(recipe.data.ingredients[0].amount).toBe('1');
  });
});
