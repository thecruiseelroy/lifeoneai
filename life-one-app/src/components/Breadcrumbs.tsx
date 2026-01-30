import { Link } from 'react-router-dom'

export type BreadcrumbItem = { label: string; href?: string }

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (!items.length) return null

  return (
    <nav className="page-breadcrumb" aria-label="Breadcrumb">
      <ol className="page-breadcrumb-list">
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          return (
            <li key={i} className="page-breadcrumb-item">
              {i > 0 && <span className="page-breadcrumb-sep" aria-hidden> &gt; </span>}
              {isLast ? (
                <span aria-current="page">{item.label}</span>
              ) : item.href ? (
                <Link to={item.href}>{item.label}</Link>
              ) : (
                <span>{item.label}</span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
