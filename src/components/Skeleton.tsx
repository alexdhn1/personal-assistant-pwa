interface SkeletonProps {
  className?: string
  lines?: number
}

export function SkeletonLine({ className = '' }: { className?: string }) {
  return (
    <div
      className={`h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${className}`}
    />
  )
}

export default function Skeleton({ lines = 3 }: SkeletonProps) {
  return (
    <div className="space-y-3 p-4" role="status" aria-label="Loading">
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine
          key={i}
          className={i === lines - 1 ? 'w-3/4' : 'w-full'}
        />
      ))}
    </div>
  )
}
