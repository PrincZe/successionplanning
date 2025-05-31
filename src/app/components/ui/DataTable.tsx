'use client'

import { useState, useMemo } from 'react'
import { Search, ChevronLeft, ChevronRight, Filter, Eye, MoreVertical, ArrowUpDown } from 'lucide-react'

interface Column<T> {
  header: string
  accessorKey: keyof T
  cell?: (row: T) => React.ReactNode
  sortable?: boolean
  filterable?: boolean
  width?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  onRowClick?: (row: T) => void
  searchableColumns?: (keyof T)[]
  customSearch?: (item: T, searchTerm: string) => boolean
  itemsPerPage?: number
  title?: string
}

export default function DataTable<T>({ 
  data, 
  columns, 
  onRowClick, 
  searchableColumns = [],
  customSearch,
  itemsPerPage = 10,
  title 
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return data

    return data.filter((item) => {
      // Use custom search function if provided
      if (customSearch) {
        return customSearch(item, searchTerm)
      }
      
      // Otherwise use default search behavior
      return searchableColumns.some((column) => {
        const value = item[column]
        return String(value || '').toLowerCase().includes(searchTerm.toLowerCase())
      })
    })
  }, [data, searchTerm, searchableColumns, customSearch])

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData

    return [...filteredData].sort((a, b) => {
      const aValue = String(a[sortColumn] || '')
      const bValue = String(b[sortColumn] || '')
      
      if (sortDirection === 'asc') {
        return aValue.localeCompare(bValue)
      } else {
        return bValue.localeCompare(aValue)
      }
    })
  }, [filteredData, sortColumn, sortDirection])

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return sortedData.slice(startIndex, startIndex + itemsPerPage)
  }, [sortedData, currentPage, itemsPerPage])

  const totalPages = Math.ceil(sortedData.length / itemsPerPage)

  const handleSort = (column: keyof T) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          {title && (
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          )}
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>Showing</span>
            <span className="font-medium text-gray-900">
              {Math.min((currentPage - 1) * itemsPerPage + 1, sortedData.length)}
            </span>
            <span>to</span>
            <span className="font-medium text-gray-900">
              {Math.min(currentPage * itemsPerPage, sortedData.length)}
            </span>
            <span>of</span>
            <span className="font-medium text-gray-900">{sortedData.length}</span>
            <span>results</span>
          </div>
        </div>

        {/* Search Bar */}
        {(searchableColumns.length > 0 || customSearch) && (
          <div className="relative max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search records..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1) // Reset to first page when searching
              }}
            />
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                {columns.map((column) => (
                  <th
                    key={String(column.accessorKey)}
                    scope="col"
                    className={`px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider ${
                      column.sortable !== false ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''
                    } ${column.width || ''}`}
                    onClick={() => column.sortable !== false && handleSort(column.accessorKey)}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{column.header}</span>
                      {column.sortable !== false && (
                        <ArrowUpDown className={`h-4 w-4 ${
                          sortColumn === column.accessorKey ? 'text-blue-500' : 'text-gray-400'
                        }`} />
                      )}
                    </div>
                  </th>
                ))}
                {onRowClick && (
                  <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.length > 0 ? (
                paginatedData.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className={`transition-colors hover:bg-gray-50 ${
                      onRowClick ? 'cursor-pointer' : ''
                    }`}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map((column) => (
                      <td
                        key={String(column.accessorKey)}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                      >
                        <div className="flex items-center">
                          {column.cell
                            ? column.cell(row)
                            : String(row[column.accessorKey] ?? '')}
                        </div>
                      </td>
                    ))}
                    {onRowClick && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                        <button
                          className="inline-flex items-center p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          onClick={(e) => {
                            e.stopPropagation()
                            onRowClick(row)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length + (onRowClick ? 1 : 0)} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <Filter className="h-12 w-12 text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                      <p className="text-gray-500 max-w-md">
                        {searchTerm 
                          ? `No records match your search for "${searchTerm}". Try adjusting your search terms.`
                          : 'No data available to display.'
                        }
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </button>
                
                {/* Page Numbers */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>
                
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 