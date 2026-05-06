import { useState } from 'react'
import type { FileTreeNode } from '../hooks/useFile'

interface FileTreeProps {
  tree: FileTreeNode[]
  currentPath: string
  onSelect: (path: string) => void
}

export default function FileTree({ tree, currentPath, onSelect }: FileTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  function toggleDir(path: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }

  if (tree.length === 0) {
    return (
      <p className="text-xs text-gray-400 px-2 py-1">Aucun fichier .md trouvé</p>
    )
  }

  return (
    <div className="flex flex-col gap-0.5">
      {tree.map((node) => {
        if (node.type === 'file') {
          return (
            <button
              key={node.path}
              onClick={() => onSelect(node.path)}
              className={[
                'w-full text-left px-2 py-1.5 text-sm rounded truncate',
                currentPath === node.path
                  ? 'bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300 font-medium'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
              ].join(' ')}
            >
              {node.name}
            </button>
          )
        }

        // Directory node
        const isExpanded = expanded.has(node.path)
        return (
          <div key={node.path}>
            <button
              onClick={() => toggleDir(node.path)}
              className="w-full text-left px-2 py-1.5 text-sm rounded flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <span className="text-xs">{isExpanded ? '▾' : '▸'}</span>
              <span>{node.name}</span>
            </button>
            {isExpanded && (
              <div className="ml-4 flex flex-col gap-0.5">
                {node.children.map((child) => (
                  <button
                    key={child.path}
                    onClick={() => onSelect(child.path)}
                    className={[
                      'w-full text-left px-2 py-1.5 text-sm rounded truncate',
                      currentPath === child.path
                        ? 'bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300 font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
                    ].join(' ')}
                  >
                    {child.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
