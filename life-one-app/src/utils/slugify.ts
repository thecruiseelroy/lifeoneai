/**
 * Convert exercise name to a URL-safe slug.
 * Lowercase, replace spaces/slashes with hyphens, collapse multiple hyphens.
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/\//g, '-')
    .replace(/[^\w-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Find exercise by slug from a list (slugify(ex.name) === slug).
 */
export function findExerciseBySlug<T extends { name: string }>(
  exercises: T[],
  slug: string
): T | undefined {
  const normalized = slug.toLowerCase().trim()
  return exercises.find((ex) => slugify(ex.name) === normalized)
}
