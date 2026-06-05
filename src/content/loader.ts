import { recipes as rawRecipes, projects as rawProjects, posts as rawPosts } from 'virtual:content';
import type { Recipe, Project, Post } from './schema';

// The content arrays are parsed, validated and sorted at build time by the
// `virtual:content` Vite plugin (see vite-plugin-content.ts), so this module
// ships only data to the browser — no gray-matter/YAML parser. We just freeze
// and re-export. All three arrays are already newest-first.

export const recipes: readonly Recipe[] = Object.freeze(rawRecipes);
export const projects: readonly Project[] = Object.freeze(rawProjects);
export const posts: readonly Post[] = Object.freeze(rawPosts);
