// Shared test fixtures: a fixed, typed content dataset in the *final loaded
// shape* (post parse/derive — `slug`, `excerpt`, `body` present; posts also
// `readingTime`). vite.config.ts aliases `virtual:content` to this module for
// tests only, so the whole suite runs against this dataset instead of the real
// `content/` folder. This keeps the tests stable as author content comes and
// goes — never recouple the suite to files under `content/` (see CLAUDE.md).
//
// The data is deliberately shaped to exercise every content-coupled assertion:
// recipes span ≥2 categories with a with-/without-note and with-/without-hero
// mix; projects cover the full-links+metrics and the bare cases; posts carry
// tags + a real opening paragraph for the drop-cap. All three arrays are
// newest-first, matching the loader's contract.

import type { Recipe, Project, Post, IngredientGroup } from '../content/schema';

// One recipe carries headed ingredient groups; its flat `ingredients` is
// derived from them so the two stay in lock-step (mirrors the parser).
const soupGroups: IngredientGroup[] = [
  { heading: 'Base', items: [{ amount: '1', item: 'onion' }] },
  {
    heading: 'Simmer',
    items: [
      { amount: '2 tins', item: 'plum tomatoes' },
      { amount: '500 ml', item: 'stock' },
    ],
  },
];

export const recipes: Recipe[] = [
  {
    title: 'Grilled Teriyaki Skewers',
    date: '2025-05-01',
    slug: 'grilled-teriyaki-skewers',
    excerpt: 'Sticky, charred chicken thigh skewers off the grill.',
    body: 'Weeknight-friendly skewers with a quick teriyaki glaze.',
    hero: '/images/recipes/grilled_teriyaki_skewers.jpg',
    heroAlt: 'Charred chicken skewers on a platter',
    category: 'Grilling',
    time: '40 min',
    yield: 'Serves 3',
    effort: 'Easy',
    ingredients: [
      { amount: '600 g', item: 'chicken thigh' },
      { amount: '100 g', item: 'soy sauce' },
      { amount: '1', item: 'bell pepper' },
    ],
    steps: [
      'Cut the chicken and vegetables into bite-size pieces.',
      'Whisk the glaze and marinate the chicken.',
      'Skewer and grill, turning to char on all sides.',
    ],
    note: 'Thigh is forgiving on the grill — don’t fear a little char.',
    pairsWith: ['charred-corn-salad', 'weeknight-tomato-soup'],
  },
  {
    title: 'Charred Corn Salad',
    date: '2025-03-01',
    slug: 'charred-corn-salad',
    excerpt: 'Blistered sweetcorn, lime and herbs.',
    body: 'A bright summer salad built on charred corn.',
    category: 'Salads',
    time: '25 min',
    yield: 'Serves 4',
    effort: 'Relaxed',
    ingredients: [
      { amount: '4 ears', item: 'sweetcorn' },
      { amount: '1', item: 'lime' },
    ],
    steps: ['Char the corn.', 'Toss with lime and herbs.'],
  },
  {
    title: 'Weeknight Tomato Soup',
    date: '2025-01-01',
    slug: 'weeknight-tomato-soup',
    excerpt: 'A fast, comforting tomato soup.',
    body: 'Pantry-friendly tomato soup ready in half an hour.',
    category: 'Soups',
    time: '30 min',
    yield: 'Serves 2',
    effort: 'Simple',
    ingredients: soupGroups.flatMap((g) => g.items),
    ingredientGroups: soupGroups,
    steps: ['Soften the onion.', 'Add tomatoes and simmer.', 'Blend smooth.'],
  },
];

export const projects: Project[] = [
  {
    title: 'Static Feed Builder',
    date: '2025-06-01',
    slug: 'static-feed-builder',
    summary: 'A tiny generator that merges content streams into one feed.',
    body: 'Static Feed Builder turns a folder of Markdown into a combined feed.\n\nIt powers the Home "Latest" list on this very site.',
    status: 'Active · v1.2 · MIT',
    year: '2025',
    stack: ['TypeScript', 'Node'],
    role: 'Design, code, docs — solo',
    metrics: '2.1k stars · 40k installs',
    links: {
      repo: 'https://github.com/example/static-feed-builder',
      demo: 'https://feeds.example.test',
      docs: 'https://docs.example.test/static-feed-builder',
    },
  },
  {
    title: 'Token Palette',
    date: '2025-02-01',
    slug: 'token-palette',
    summary: 'A design-token palette explorer.',
    body: 'Token Palette is a small tool for browsing design-token sets.',
    status: 'Archived',
    year: '2024',
    stack: ['React', 'CSS'],
    role: 'Solo',
  },
];

export const posts: Post[] = [
  {
    title: 'Why Plain Text',
    date: '2025-04-01',
    slug: 'why-plain-text',
    excerpt: 'Plain text outlives every app I have ever loved.',
    readingTime: '3 min read',
    body: 'Plain text outlives every app I have ever loved, and that durability is the whole point.\n\nIt diffs cleanly, greps instantly, and survives format churn.',
    tags: ['writing', 'tools'],
  },
  {
    title: 'Designing in the Open',
    date: '2025-01-15',
    slug: 'designing-in-the-open',
    excerpt: 'Notes on building a personal site in public.',
    readingTime: '2 min read',
    body: 'Building in the open keeps me honest about the work.\n\nThe commits are the changelog.',
    tags: ['design', 'meta'],
  },
];
