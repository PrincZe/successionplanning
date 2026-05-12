'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Crown, User, Clock, CalendarDays, Sparkles,
  ArrowLeft, Edit, Hash, Building2, Award, FileText, Plus, Trash2, Search
} from 'lucide-react'
import type { PositionWithRelations } from '@/lib/queries/positions'
import { addSuccessorWithAudit, removeSuccessorWithAudit } from '@/app/actions/submissions'
import RecommendationPanel from './RecommendationPanel'

type OfficerOption = { officer_id: string; name: string; grade: string | null }

interface SuccessionNodeProps {
  title: string
  name?: string
  officerId?: string
  className?: string
  variant?: 'position' | 'incumbent' | '0-4years' | '4-10years'
  icon?: React.ReactNode
}

function SuccessionNode({ title, name, officerId, className = '', variant = '0-4years', icon }: SuccessionNodeProps) {
  const variantStyles = {
    position: 'bg-gradient-to-br from-slate-500 to-slate-600 text-white border-slate-300 shadow-lg',
    incumbent: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-emerald-300 shadow-lg',
    '0-4years': 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-900 border-blue-200 shadow-md hover:shadow-lg transition-all duration-200',
    '4-10years': 'bg-gradient-to-br from-purple-50 to-violet-100 text-purple-900 border-purple-200 shadow-md hover:shadow-lg transition-all duration-200',
  }

  return (
    <div className={`${variantStyles[variant]} border-2 rounded-xl p-4 w-72 text-center transform hover:scale-105 transition-all duration-200 ${className}`}>
      <div className="flex items-center justify-center mb-2">
        {icon && <span className="mr-2">{icon}</span>}
        <div className="text-sm font-semibold">{title}</div>
      </div>
      {name ? (
        <Link href={`/officers/${officerId}`} className="font-bold text-lg hover:underline block">
          {name}
        </Link>
      ) : (
        <span className="text-gray-400 italic">Vacant</span>
      )}
    </div>
  )
}

function SuccessionTree({ position, canEdit, submissionId, allOfficers }: { position: PositionWithRelations; canEdit: boolean; submissionId: string | null; allOfficers: OfficerOption[] }) {
  const shortTermSuccessors = position.successors_0_4_years || []
  const longTermSuccessors = position.successors_4_10_years || []

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-xl p-8 border border-gray-200">
      <div className="flex items-center justify-center mb-8">
        <Crown className="h-6 w-6 text-purple-600 mr-3" />
        <h3 className="text-2xl font-bold text-gray-800">Succession Hierarchy</h3>
      </div>

      <div className="flex flex-col items-center space-y-16 relative">
        <div className="relative">
          <SuccessionNode
            title="Position"
            name={`${position.position_title} • ${position.agency}`}
            variant="position"
            icon={<Crown className="h-5 w-5" />}
          />
        </div>

        <div className="w-1 h-12 bg-gradient-to-b from-slate-400 to-emerald-400 rounded-full"></div>

        <div className="relative">
          <SuccessionNode
            title="Current Incumbent"
            name={position.incumbent?.name}
            officerId={position.incumbent?.officer_id}
            variant="incumbent"
            icon={<User className="h-5 w-5" />}
          />
        </div>

        {/* 0-4yr band */}
        <div className="w-1 h-12 bg-gradient-to-b from-emerald-400 to-blue-400 rounded-full"></div>
        <div className="relative w-full flex flex-col items-center">
          <div className="text-center mb-6">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
              <Clock className="h-4 w-4 mr-2" />
              0–4 Year Successors ({shortTermSuccessors.length})
            </div>
          </div>

          {shortTermSuccessors.length > 0 && (
            <div className="relative flex items-center w-full max-w-4xl">
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-blue-300 via-blue-400 to-blue-300 rounded-full transform -translate-y-1/2"></div>
              <div className="flex justify-between w-full relative z-10">
                {shortTermSuccessors.map((successor, index) => (
                  <div key={successor.officer_id} className="relative">
                    <div className="absolute top-1/2 left-1/2 w-1 h-8 bg-blue-400 rounded-full transform -translate-x-1/2 -translate-y-full"></div>
                    <SuccessionNode
                      title={`0-4yr Successor ${index + 1}`}
                      name={successor.name}
                      officerId={successor.officer_id}
                      variant="0-4years"
                      icon={<Clock className="h-4 w-4" />}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          {shortTermSuccessors.length === 0 && (
            <div className="text-sm text-gray-400 italic">No successors assigned</div>
          )}
          {canEdit && submissionId && (
            <InlineSuccessorEditor
              positionId={position.position_id}
              submissionId={submissionId}
              successionType="0-4_years"
              existingOfficerIds={shortTermSuccessors.map((s) => s.officer_id)}
              allOfficers={allOfficers}
            />
          )}
        </div>

        {/* 4-10yr band */}
        <div className="w-1 h-12 bg-gradient-to-b from-blue-400 to-purple-400 rounded-full"></div>
        <div className="relative w-full flex flex-col items-center">
          <div className="text-center mb-6">
            <div className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
              <CalendarDays className="h-4 w-4 mr-2" />
              4–10 Year Successors ({longTermSuccessors.length})
            </div>
          </div>

          {longTermSuccessors.length > 0 && (
            <div className="flex flex-wrap justify-center gap-8 w-full max-w-5xl">
              {longTermSuccessors.map((successor, index) => (
                <div key={successor.officer_id} className="relative">
                  <SuccessionNode
                    title={`4-10yr Successor ${index + 1}`}
                    name={successor.name}
                    officerId={successor.officer_id}
                    variant="4-10years"
                    icon={<CalendarDays className="h-4 w-4" />}
                  />
                </div>
              ))}
            </div>
          )}
          {longTermSuccessors.length === 0 && (
            <div className="text-sm text-gray-400 italic">No successors assigned</div>
          )}
          {canEdit && submissionId && (
            <InlineSuccessorEditor
              positionId={position.position_id}
              submissionId={submissionId}
              successionType="4-10_years"
              existingOfficerIds={longTermSuccessors.map((s) => s.officer_id)}
              allOfficers={allOfficers}
            />
          )}
        </div>
      </div>
    </div>
  )
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  draft: { label: 'Pending Submission', className: 'bg-gray-100 text-gray-700' },
  submitted: { label: 'Submitted', className: 'bg-blue-100 text-blue-700' },
  in_review: { label: 'In Review', className: 'bg-amber-100 text-amber-700' },
  endorsed: { label: 'Endorsed', className: 'bg-green-100 text-green-700' },
  returned: { label: 'Returned', className: 'bg-red-100 text-red-700' },
}

interface PositionDetailProps {
  position: PositionWithRelations
  submissionStatus?: string | null
  submissionId?: string | null
  userRole?: string | null
  allOfficers?: OfficerOption[]
}

export default function PositionDetail({ position, submissionStatus, submissionId, userRole, allOfficers = [] }: PositionDetailProps) {
  const canPsdEdit = (userRole === 'psd' || userRole === 'admin') && (submissionStatus === 'submitted' || submissionStatus === 'in_review')
  const router = useRouter()
  const [showRecs, setShowRecs] = useState(false)

  return (
    <div className={`flex gap-6 ${showRecs ? '' : ''}`}>
    <div className={`space-y-8 ${showRecs ? 'flex-1 min-w-0' : 'w-full'} transition-all`}>
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <Link
              href="/positions"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to List
            </Link>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowRecs(!showRecs)}
                className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors shadow-sm ${showRecs ? 'bg-violet-600 text-white hover:bg-violet-700' : 'bg-white border border-violet-300 text-violet-700 hover:bg-violet-50'}`}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                AI Recommendations
              </button>
              <Link
                href={`/plans/position/${position.position_id}`}
                className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
              >
                <FileText className="h-4 w-4 mr-2" />
                Generate Plan
              </Link>
              <button
                onClick={() => router.push(`/positions/${position.position_id}/edit`)}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-colors shadow-md"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Position
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="p-4 bg-blue-100 rounded-xl">
              <Crown className="h-10 w-10 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900">{position.position_title}</h1>
                {submissionStatus && STATUS_BADGE[submissionStatus] && (
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[submissionStatus].className}`}>
                    {STATUS_BADGE[submissionStatus].label}
                  </span>
                )}
              </div>
              <p className="text-gray-600 mt-1">{position.agency} · Position Details &amp; Succession</p>
            </div>
          </div>
        </div>
      </div>

      {/* Position Details & Incumbent - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Position Details */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-200 rounded-lg mr-3">
                <Hash className="h-5 w-5 text-blue-700" />
              </div>
              <h2 className="text-xl font-semibold text-blue-900">Position Details</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              <div>
                <dt className="flex items-center text-sm font-medium text-gray-500 mb-2">
                  <Hash className="h-4 w-4 mr-2" />
                  Position ID
                </dt>
                <dd className="text-lg font-semibold text-gray-900 font-mono">{position.position_id}</dd>
              </div>
              <div>
                <dt className="flex items-center text-sm font-medium text-gray-500 mb-2">
                  <Award className="h-4 w-4 mr-2" />
                  JR Grade
                </dt>
                <dd className="text-lg font-semibold text-gray-900">{position.jr_grade ?? 'Not specified'}</dd>
              </div>
              <div>
                <dt className="flex items-center text-sm font-medium text-gray-500 mb-2">
                  <Building2 className="h-4 w-4 mr-2" />
                  Agency
                </dt>
                <dd className="text-lg font-semibold text-gray-900">{position.agency}</dd>
              </div>
            </div>
          </div>
        </div>

        {/* Incumbent */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 px-6 py-4 border-b border-emerald-200">
            <div className="flex items-center">
              <div className="p-2 bg-emerald-200 rounded-lg mr-3">
                <User className="h-5 w-5 text-emerald-700" />
              </div>
              <h2 className="text-xl font-semibold text-emerald-900">Current Incumbent</h2>
            </div>
          </div>
          <div className="p-6">
            {position.incumbent ? (
              <Link
                href={`/officers/${position.incumbent.officer_id}`}
                className="block p-4 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
              >
                <div className="flex items-center">
                  <div className="h-12 w-12 bg-emerald-200 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-emerald-800 font-bold text-sm">
                      {position.incumbent.name
                        .split(' ')
                        .slice(0, 2)
                        .map((n: string) => n[0])
                        .join('')
                        .toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-emerald-900 text-lg">{position.incumbent.name}</div>
                    <div className="text-sm text-emerald-600 mt-0.5">View officer profile →</div>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="text-center py-8">
                <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Position Vacant</p>
                <p className="text-gray-400 text-sm mt-1">No incumbent currently assigned</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Succession Tree */}
      <SuccessionTree
        position={position}
        canEdit={canPsdEdit}
        submissionId={submissionId ?? null}
        allOfficers={allOfficers}
      />
    </div>

    {/* AI Recommendation side panel */}
    {showRecs && (
      <div className="w-[380px] flex-shrink-0 sticky top-20 h-[calc(100vh-6rem)] overflow-hidden rounded-xl border border-gray-200 shadow-lg">
        <RecommendationPanel positionId={position.position_id} onClose={() => setShowRecs(false)} />
      </div>
    )}
    </div>
  )
}

function InlineSuccessorEditor({
  positionId,
  submissionId,
  successionType,
  existingOfficerIds,
  allOfficers,
}: {
  positionId: string
  submissionId: string
  successionType: '0-4_years' | '4-10_years'
  existingOfficerIds: string[]
  allOfficers: OfficerOption[]
}) {
  const [showAdd, setShowAdd] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedOfficer, setSelectedOfficer] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const existingSet = new Set(existingOfficerIds)
  const available = allOfficers.filter((o) => !existingSet.has(o.officer_id))

  const filtered = useMemo(() => {
    if (!query.trim()) return available.slice(0, 8)
    const q = query.toLowerCase()
    return available.filter((o) => o.name.toLowerCase().includes(q) || o.officer_id.toLowerCase().includes(q)).slice(0, 8)
  }, [available, query])

  const selectedName = allOfficers.find((o) => o.officer_id === selectedOfficer)?.name

  async function handleAdd() {
    if (!selectedOfficer) return
    setLoading(true)
    await addSuccessorWithAudit({
      submission_id: submissionId,
      position_id: positionId,
      officer_id: selectedOfficer,
      succession_type: successionType,
      reason: reason || undefined,
    })
    setLoading(false)
    window.location.reload()
  }

  return (
    <div className="mt-4 w-full max-w-md">
      {!showAdd ? (
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          <Plus className="h-3 w-3" /> Add Successor
        </button>
      ) : (
        <div className="bg-white border rounded-lg p-3 space-y-2 shadow-sm">
          <div className="relative">
            <div className="flex items-center border rounded-md px-3 py-1.5 bg-white">
              <Search className="h-3.5 w-3.5 text-gray-400 mr-2" />
              <input
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setDropdownOpen(true) }}
                onFocus={() => setDropdownOpen(true)}
                placeholder="Search officer..."
                className="w-full text-sm outline-none"
              />
            </div>
            {dropdownOpen && filtered.length > 0 && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                <div className="absolute z-20 mt-1 w-full bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto">
                  {filtered.map((o) => (
                    <button
                      key={o.officer_id}
                      type="button"
                      onClick={() => { setSelectedOfficer(o.officer_id); setQuery(''); setDropdownOpen(false) }}
                      className="w-full text-left px-3 py-1.5 text-sm hover:bg-blue-50 flex justify-between"
                    >
                      <span>{o.name}</span>
                      <span className="text-gray-400 text-xs">{o.grade ?? ''}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          {selectedName && (
            <div className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded">Selected: {selectedName}</div>
          )}
          <input
            type="text"
            placeholder="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full border rounded-md px-3 py-1.5 text-sm"
          />
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={!selectedOfficer || loading} className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium disabled:opacity-50">
              {loading ? 'Adding...' : 'Add'}
            </button>
            <button onClick={() => { setShowAdd(false); setSelectedOfficer(null); setQuery(''); setReason('') }} className="px-3 py-1 border rounded text-xs">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
