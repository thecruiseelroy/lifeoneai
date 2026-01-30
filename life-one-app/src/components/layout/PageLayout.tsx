import type { BreadcrumbItem } from '../Breadcrumbs'
import { PageHeader } from './PageHeader'

interface PageLayoutProps {
  children: React.ReactNode
  title: React.ReactNode
  breadcrumbs?: BreadcrumbItem[]
  backLink?: { to: string; label: string }
  actions?: React.ReactNode
}

export function PageLayout({
  children,
  title,
  breadcrumbs,
  backLink,
  actions,
}: PageLayoutProps) {
  return (
    <div className="page-layout">
      <PageHeader
        title={title}
        breadcrumbs={breadcrumbs}
        backLink={backLink}
        actions={actions}
      />
      <div className="page-layout-inner">
        <main className="page-layout-main">{children}</main>
      </div>
    </div>
  )
}
