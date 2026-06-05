// Types for the build-time virtual module emitted by vite-plugin-content.ts.
declare module 'virtual:content' {
  import type { Recipe, Project, Post } from './schema';
  export const recipes: Recipe[];
  export const projects: Project[];
  export const posts: Post[];
}
