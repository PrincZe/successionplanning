'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Users, Search, X, User, Hash, Award, Calendar } from 'lucide-react'
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
      <div className="min-h-[42px] p-2 border-2 border-gray-200 rounded-lg bg-white flex flex-wrap gap-2 cursor-text hover:border-blue-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-colors"
           onClick={() => setIsOpen(true)}>
        {selectedOfficers.map(officer => (
          <span key={officer.officer_id} 
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700 font-medium">
            <User className="h-3 w-3 mr-1" />
            {officer.name}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleRemove(officer.officer_id)
              }}
              className="ml-2 hover:text-blue-900 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <div className="flex items-center flex-1 min-w-[120px]">
          <Search className="h-4 w-4 text-gray-400 mr-2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={selectedOfficers.length === 0 ? placeholder : ''}
            className="flex-1 border-0 p-0 focus:ring-0 text-sm bg-transparent"
            onFocus={() => setIsOpen(true)}
          />
        </div>
      </div>
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {filteredOptions.length === 0 ? (
            <div className="p-3 text-sm text-gray-500 text-center">No officers found</div>
          ) : (
            filteredOptions.map(officer => (
              <div
                key={officer.officer_id}
                className="px-4 py-3 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-100 last:border-0 flex items-center transition-colors"
                onClick={() => handleSelect(officer.officer_id)}
              >
                <User className="h-4 w-4 text-gray-400 mr-3" />
                <div>
                  <div className="font-medium text-gray-900">{officer.name}</div>
                  <div className="text-xs text-gray-500">{officer.grade || 'No grade'}</div>
                </div>
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
    <div className="p-8">
      <form onSubmit={handleSubmit} className="max-w-6xl mx-auto">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center">
            <X className="h-5 w-5 mr-2" />
            {error}
          </div>
        )}

        <div className="space-y-8">
          {/* Position Details Section */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
            <div className="flex items-center mb-6">
              <div className="p-2 bg-blue-200 rounded-lg mr-3">
                <Building2 className="h-6 w-6 text-blue-700" />
              </div>
              <h3 className="text-xl font-semibold text-blue-900">Position Details</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Hash className="h-4 w-4 mr-2" />
                  Position ID
                </label>
                <input
                  type="text"
                  value={formData.position_id}
                  disabled
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 bg-gray-50 text-gray-600 font-mono text-sm"
                />
                <p className="mt-2 text-sm text-gray-500">Auto-generated unique identifier</p>
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Award className="h-4 w-4 mr-2" />
                  Title
                </label>
                <input
                  type="text"
                  value={formData.position_title}
                  onChange={(e) => setFormData({ ...formData, position_title: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                  placeholder="Enter position title"
                  required
                />
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Building2 className="h-4 w-4 mr-2" />
                  Agency
                </label>
                <input
                  type="text"
                  value={formData.agency}
                  onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                  placeholder="Enter agency name"
                  required
                />
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Award className="h-4 w-4 mr-2" />
                  Grade
                </label>
                <input
                  type="text"
                  value={formData.jr_grade}
                  onChange={(e) => setFormData({ ...formData, jr_grade: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                  placeholder="Enter grade (e.g., JR9)"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <User className="h-4 w-4 mr-2" />
                  Incumbent
                </label>
                <select
                  value={formData.incumbent_id ?? ''}
                  onChange={(e) => setFormData({ ...formData, incumbent_id: e.target.value || null })}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                >
                  <option value="">Select Incumbent</option>
                  {officers.map((officer) => (
                    <option key={officer.officer_id} value={officer.officer_id}>
                      {officer.name} {officer.grade ? `(${officer.grade})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Succession Planning Section */}
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
            <div className="flex items-center mb-6">
              <div className="p-2 bg-green-200 rounded-lg mr-3">
                <Users className="h-6 w-6 text-green-700" />
              </div>
              <h3 className="text-xl font-semibold text-green-900">Succession Planning</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Immediate Successors */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
                  <Calendar className="h-4 w-4 mr-2" />
                  Immediate Successors
                </label>
                <MultiSelect
                  options={officers}
                  value={formData.immediate_successors}
                  onChange={(value) => setFormData(prev => ({ ...prev, immediate_successors: value }))}
                  maxSelections={2}
                  placeholder="Search immediate successors..."
                />
                <p className="mt-2 text-sm text-gray-500">Select up to 2 immediate successors</p>
              </div>

              {/* 1-2 Year Successors */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
                  <Calendar className="h-4 w-4 mr-2" />
                  1-2 Year Successors
                </label>
                <MultiSelect
                  options={officers}
                  value={formData.successors_1_2_years}
                  onChange={(value) => setFormData(prev => ({ ...prev, successors_1_2_years: value }))}
                  maxSelections={5}
                  placeholder="Search 1-2 year successors..."
                />
                <p className="mt-2 text-sm text-gray-500">Select up to 5 successors</p>
              </div>

              {/* 3-5 Year Successors */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
                  <Calendar className="h-4 w-4 mr-2" />
                  3-5 Year Successors
                </label>
                <MultiSelect
                  options={officers}
                  value={formData.successors_3_5_years}
                  onChange={(value) => setFormData(prev => ({ ...prev, successors_3_5_years: value }))}
                  maxSelections={5}
                  placeholder="Search 3-5 year successors..."
                />
                <p className="mt-2 text-sm text-gray-500">Select up to 5 successors</p>
              </div>

              {/* More Than 5 Years Successors */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
                  <Calendar className="h-4 w-4 mr-2" />
                  More Than 5 Years Successors
                </label>
                <MultiSelect
                  options={officers}
                  value={formData.more_than_5_years_successors}
                  onChange={(value) => setFormData(prev => ({ ...prev, more_than_5_years_successors: value }))}
                  maxSelections={10}
                  placeholder="Search >5 year successors..."
                />
                <p className="mt-2 text-sm text-gray-500">Select up to 10 successors</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {isSubmitting ? 'Saving...' : 'Save Position'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
} 