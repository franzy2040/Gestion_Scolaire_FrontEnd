import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Column<T> {
  key: string
  label: string
  width?: string
  render?: (item: T) => React.ReactNode
}

interface Pagination {
  page: number
  perPage: number
  total: number
  onPageChange: (page: number) => void
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  keyExtractor: (item: T) => string | number
  pagination?: Pagination
  emptyMessage?: string
}

export default function DataTable<T>({
  data,
  columns,
  keyExtractor,
  pagination,
  emptyMessage = 'Aucune donnée disponible',
}: DataTableProps<T>) {
  const totalPages = pagination ? Math.ceil(pagination.total / pagination.perPage) : 1

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  style={{ width: col.width }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-gray-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={keyExtractor(item)} className="hover:bg-gray-50 transition-colors">
                  {columns.map((col) => (
                    <td
                      key={`${keyExtractor(item)}-${col.key}`}
                      className="px-4 py-3 text-sm text-gray-900"
                      style={{ width: col.width }}
                    >
                      {col.render
                        ? col.render(item)
                        : (item as any)[col.key] ?? '-'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Affichage de {(pagination.page - 1) * pagination.perPage + 1} à{' '}
            {Math.min(pagination.page * pagination.perPage, pagination.total)} sur{' '}
            {pagination.total} éléments
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-sm text-gray-600">
              Page {pagination.page} / {totalPages}
            </span>
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= totalPages}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}