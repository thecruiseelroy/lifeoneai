export type NavLinkItem = { label: string; to: string }

export type NavEntry =
  | { type: 'link'; label: string; to: string }
  | { type: 'group'; id: NavGroupId; label: string; items: NavLinkItem[] }

export type NavGroupId = 'training' | 'nutrition' | 'account'

export const NAV_CONFIG: NavEntry[] = [
  { type: 'link', label: 'Dashboard', to: '/' },
  {
    type: 'group',
    id: 'training',
    label: 'Training',
    items: [
      { label: 'Library', to: '/library' },
      { label: 'Programs', to: '/programs' },
    ],
  },
  {
    type: 'group',
    id: 'nutrition',
    label: 'Nutrition',
    items: [
      { label: 'Foods', to: '/foods' },
      { label: 'Diets', to: '/diets' },
      { label: 'Meals', to: '/meals' },
    ],
  },
  {
    type: 'group',
    id: 'account',
    label: 'Account',
    items: [
      { label: 'Profile', to: '/profile' },
      { label: 'Settings', to: '/settings' },
    ],
  },
]

function isPathActive(to: string, pathname: string): boolean {
  if (to === '/') return pathname === '/'
  if (to === '/library')
    return pathname === '/library' || pathname.startsWith('/exercise')
  if (to === '/programs') return pathname.startsWith('/programs')
  if (to === '/foods') return pathname === '/foods'
  if (to === '/diets') return pathname.startsWith('/diets')
  if (to === '/meals') return pathname === '/meals'
  if (to === '/profile') return pathname === '/profile'
  if (to === '/settings') return pathname === '/settings'
  return pathname === to
}

export function isNavLinkActive(to: string, pathname: string): boolean {
  return isPathActive(to, pathname)
}

export function isNavGroupActive(groupId: NavGroupId, pathname: string): boolean {
  switch (groupId) {
    case 'training':
      return (
        pathname === '/library' ||
        pathname.startsWith('/exercise') ||
        pathname.startsWith('/programs')
      )
    case 'nutrition':
      return (
        pathname === '/foods' ||
        pathname.startsWith('/diets') ||
        pathname === '/meals'
      )
    case 'account':
      return pathname === '/profile' || pathname === '/settings'
    default:
      return false
  }
}
