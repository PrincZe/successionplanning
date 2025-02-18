'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { PositionWithRelations } from '@/lib/queries/positions'
import type { Officer } from '@/lib/types/supabase'

// Add helper function to generate position ID
function generatePositionId() {
  const randomDigits = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `POS${randomDigits}`;
}

interface MultiSelectProps {
  options: Officer[]
  value: string[]
  onChange: (value: string[]) => void
  maxSelections: number
  placeholder: string
}

function MultiSelect({ options, value, onChange, maxSelections, placeholder }: MultiSelectProps) {
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const selectedOfficers = options.filter(officer => value.includes(officer.officer_id))
  const filteredOptions = options.filter(officer => 
    officer.name.toLowerCase().includes(search.toLowerCase()) &&
    !value.includes(officer.officer_id)
  )

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (officerId: string) => {
    if (value.length >= maxSelections) {
      alert(`You can only select up to ${maxSelections} officers`)
      return
    }
    onChange([...value, officerId])
    setSearch('')
  }

  const handleRemove = (officerId: string) => {
    onChange(value.filter(id => id !== officerId))
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="min-h-[38px] p-1 border rounded-md bg-white flex flex-wrap gap-2 cursor-text"
           onClick={() => setIsOpen(true)}>
        {selectedOfficers.map(officer => (
          <span key={officer.officer_id} 
                className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-blue-100 text-blue-700">
            {officer.name}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleRemove(officer.officer_id)
              }}
              className="ml-1 hover:text-blue-900"
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={selectedOfficers.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] border-0 p-1 focus:ring-0 text-sm"
          onFocus={() => setIsOpen(true)}
        />
      </div>
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredOptions.length === 0 ? (
            <div className="p-2 text-sm text-gray-500">No officers found</div>
          ) : (
            filteredOptions.map(officer => (
              <div
                key={officer.officer_id}
                className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                onClick={() => handleSelect(officer.officer_id)}
              >
                {officer.name}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export interface PositionFormData {
  position_id: string
  position_title: string
  agency: string
  jr_grade: string
  incumbent_id: string | null
  immediate_successors: string[]
  successors_1_2_years: string[]
  successors_3_5_years: string[]
  more_than_5_years_successors: string[]
}

interface PositionFormProps {
  position?: PositionWithRelations
  officers: Officer[]
  onSubmit: (data: PositionFormData, id?: string) => Promise<{ success: boolean; error?: string }>
}

export default function PositionForm({ position, officers, onSubmit }: PositionFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>()
  const [generatedId] = useState(generatePositionId())

  const [formData, setFormData] = useState({
    position_id: position?.position_id ?? generatedId,
    position_title: position?.position_title ?? '',
    agency: position?.agency ?? '',
    jr_grade: position?.jr_grade ?? '',
    incumbent_id: position?.incumbent_id ?? null,
    immediate_successors: position?.immediate_successors?.map(s => s.officer_id) ?? [],
    successors_1_2_years: position?.successors_1_2_years?.map(s => s.officer_id) ?? [],
    successors_3_5_years: position?.successors_3_5_years?.map(s => s.officer_id) ?? [],
    more_than_5_years_successors: position?.more_than_5_years_successors?.map(s => s.officer_id) ?? []
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(undefined)

    try {
      const result = await onSubmit(formData, position?.position_id)
      if (result.success) {
        router.push('/positions')
      } else {
        setError(result.error)
      }
    } catch (error: any) {
      setError(error?.message || 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-6xl mx-auto">
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Position Details Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Position Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Position ID</label>
              <input
                type="text"
                value={formData.position_id}
                disabled
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm"
              />
              <p className="mt-1 text-sm text-gray-500">Auto-generated unique identifier</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                value={formData.position_title}
                onChange={(e) => setFormData({ ...formData, position_title: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Agency</label>
              <input
                type="text"
                value={formData.agency}
                onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Grade</label>
              <input
                type="text"
                value={formData.jr_grade}
                onChange={(e) => setFormData({ ...formData, jr_grade: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Incumbent</label>
              <select
                value={formData.incumbent_id ?? ''}
                onChange={(e) => setFormData({ ...formData, incumbent_id: e.target.value || null })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select Incumbent</option>
                {officers.map((officer) => (
                  <option key={officer.officer_id} value={officer.officer_id}>
                    {officer.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Succession Planning Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Succession Planning</h3>
          <div className="grid grid-cols-2 gap-6">
            {/* Immediate Successors */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Immediate Successors
              </label>
              <MultiSelect
                options={officers}
                value={formData.immediate_successors}
                onChange={(value) => setFormData(prev => ({ ...prev, immediate_successors: value }))}
                maxSelections={2}
                placeholder="Search immediate successors..."
              />
              <p className="mt-1 text-sm text-gray-500">Select up to 2 immediate successors</p>
            </div>

            {/* 1-2 Year Successors */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                1-2 Year Successors
              </label>
              <MultiSelect
                options={officers}
                value={formData.successors_1_2_years}
                onChange={(value) => setFormData(prev => ({ ...prev, successors_1_2_years: value }))}
                maxSelections={5}
                placeholder="Search 1-2 year successors..."
              />
              <p className="mt-1 text-sm text-gray-500">Select up to 5 successors</p>
            </div>

            {/* 3-5 Year Successors */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                3-5 Year Successors
              </label>
              <MultiSelect
                options={officers}
                value={formData.successors_3_5_years}
                onChange={(value) => setFormData(prev => ({ ...prev, successors_3_5_years: value }))}
                maxSelections={5}
                placeholder="Search 3-5 year successors..."
              />
              <p className="mt-1 text-sm text-gray-500">Select up to 5 successors</p>
            </div>

            {/* More Than 5 Years Successors */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                More Than 5 Years Successors
              </label>
              <MultiSelect
                options={officers}
                value={formData.more_than_5_years_successors}
                onChange={(value) => setFormData(prev => ({ ...prev, more_than_5_years_successors: value }))}
                maxSelections={10}
                placeholder="Search >5 year successors..."
              />
              <p className="mt-1 text-sm text-gray-500">Select up to 10 successors</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Position'}
          </button>
        </div>
      </div>
    </form>
  )
} 