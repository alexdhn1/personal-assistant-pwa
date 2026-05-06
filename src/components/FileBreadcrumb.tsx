interface FileBreadcrumbProps {
  path: string
}

export default function FileBreadcrumb({ path }: FileBreadcrumbProps) {
  const segments = path.split('/')
  const last = segments[segments.length - 1]
  const parents = segments.slice(0, -1)

  return (
    <nav className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 min-w-0">
      {parents.map((seg) => (
        <span key={seg} className="flex items-center gap-1 shrink-0">
          <span data-testid="breadcrumb-segment">{seg}</span>
          <span className="text-gray-400">›</span>
        </span>
      ))}
      <span
        data-testid="breadcrumb-last"
        className="font-medium text-gray-700 dark:text-gray-200 truncate"
      >
        {last}
      </span>
    </nav>
  )
}
