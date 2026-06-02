import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from './Button'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  totalItems: number
  perPage: number
}

export function Pagination({ currentPage, totalPages, onPageChange, totalItems, perPage }: PaginationProps) {
  const start = (currentPage - 1) * perPage + 1
  const end = Math.min(currentPage * perPage, totalItems)

  const getPageNumbers = () => {
    const pages: (number | string)[] = []

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push('...')

      const startPage = Math.max(2, currentPage - 1)
      const endPage = Math.min(totalPages - 1, currentPage + 1)

      for (let i = startPage; i <= endPage; i++) pages.push(i)

      if (currentPage < totalPages - 2) pages.push('...')
      pages.push(totalPages)
    }

    return pages
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
      <div className="text-sm text-gray-700">
        Affichage de <span className="font-medium">{start}</span> à <span className="font-medium">{end}</span> sur{' '}
        <span className="font-medium">{totalItems}</span> résultats
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          leftIcon={<ChevronLeft className="w-4 h-4" />}
        >
          Précédent
        </Button>

        {getPageNumbers().map((page, i) => (
          <React.Fragment key={i}>
            {page === '...' ? (
              <span className="px-3 py-1 text-gray-500">...</span>
            ) : (
              <button
                onClick={() => onPageChange(page as number)}
                className={cn(
                  'px-3 py-1 rounded-md text-sm font-medium transition-colors',
                  currentPage === page
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                {page}
              </button>
            )}
          </React.Fragment>
        ))}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          rightIcon={<ChevronRight className="w-4 h-4" />}
        >
          Suivant
        </Button>
      </div>
    </div>
  )
}
