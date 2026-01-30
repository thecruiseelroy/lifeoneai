import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import type { BreadcrumbItem } from '../Breadcrumbs'
import { Breadcrumbs } from '../Breadcrumbs'

interface PageHeaderProps {
  title: React.ReactNode
  breadcrumbs?: BreadcrumbItem[]
  backLink?: { to: string; label: string }
  actions?: React.ReactNode
}

export function PageHeader({ title, breadcrumbs, backLink, actions }: PageHeaderProps) {
  const showBackLink = backLink && (!breadcrumbs || breadcrumbs.length === 0)
  return (
    <header className="page-header">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="page-header-breadcrumb-wrap">
          <Breadcrumbs items={breadcrumbs} />
        </div>
      )}
      <div className="page-header-row">
        {showBackLink && backLink && (
          <Link
            to={backLink.to}
            className="page-header-back"
            aria-label={backLink.label}
          >
            <ArrowLeft size={20} />
            {backLink.label}
          </Link>
        )}
        <h1 className="page-header-title">{title}</h1>
        {actions && <div className="page-header-actions">{actions}</div>}
      </div>
    </header>
  )
}
