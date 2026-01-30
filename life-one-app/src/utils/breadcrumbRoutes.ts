import type { BreadcrumbItem } from '../components/Breadcrumbs'

export interface BreadcrumbOverrides {
  programName?: string
  dietName?: string
  sectionName?: string
  exerciseName?: string
}

const DASHBOARD_ROOT: BreadcrumbItem = { label: 'Dashboard', href: '/' }
const FOODS_PARENT: BreadcrumbItem = { label: 'Foods', href: '/foods' }

/**
 * Build breadcrumb items for a given pathname and params.
 * Dashboard is the origin for all non-dashboard routes.
 * Pass optional overrides for dynamic segment labels (program/diet/section/exercise names).
 */
export function getBreadcrumbItems(
  pathname: string,
  params: Record<string, string | undefined>,
  overrides: BreadcrumbOverrides = {}
): BreadcrumbItem[] {
  const { programName, dietName, sectionName, exerciseName } = overrides
  const { programId, dietId, sectionId, exerciseSlug } = params

  if (pathname === '/') return []

  if (pathname === '/library') {
    return [DASHBOARD_ROOT, { label: 'Library' }]
  }
  if (pathname.startsWith('/exercise/')) {
    const name = exerciseName ?? exerciseSlug ?? 'Exercise'
    return [
      DASHBOARD_ROOT,
      { label: 'Library', href: '/library' },
      { label: name },
    ]
  }
  if (pathname === '/programs') {
    return [DASHBOARD_ROOT, { label: 'Programs' }]
  }
  if (pathname.match(/^\/programs\/[^/]+$/) && programId) {
    const name = programName ?? programId
    return [
      DASHBOARD_ROOT,
      { label: 'Programs', href: '/programs' },
      { label: name },
    ]
  }
  if (pathname.match(/^\/programs\/[^/]+\/sections\/[^/]+$/) && programId && sectionId) {
    const pName = programName ?? programId
    const sName = sectionName ?? sectionId
    return [
      DASHBOARD_ROOT,
      { label: 'Programs', href: '/programs' },
      { label: pName, href: `/programs/${programId}` },
      { label: sName },
    ]
  }
  if (pathname === '/foods') {
    return [DASHBOARD_ROOT, { label: 'Foods' }]
  }
  if (pathname === '/diets') {
    return [DASHBOARD_ROOT, FOODS_PARENT, { label: 'Diets' }]
  }
  if (pathname.match(/^\/diets\/[^/]+$/) && dietId) {
    const name = dietName ?? dietId
    return [
      DASHBOARD_ROOT,
      FOODS_PARENT,
      { label: 'Diets', href: '/diets' },
      { label: name },
    ]
  }
  if (pathname.match(/^\/diets\/[^/]+\/sections\/[^/]+$/) && dietId && sectionId) {
    const dName = dietName ?? dietId
    const sName = sectionName ?? sectionId
    return [
      DASHBOARD_ROOT,
      FOODS_PARENT,
      { label: 'Diets', href: '/diets' },
      { label: dName, href: `/diets/${dietId}` },
      { label: sName },
    ]
  }
  if (pathname === '/meals') {
    return [DASHBOARD_ROOT, FOODS_PARENT, { label: 'Meals' }]
  }
  if (pathname === '/profile') {
    return [DASHBOARD_ROOT, { label: 'Profile' }]
  }
  if (pathname === '/settings') {
    return [DASHBOARD_ROOT, { label: 'Settings' }]
  }

  return []
}
