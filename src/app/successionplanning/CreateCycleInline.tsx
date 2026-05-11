'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { createCycleAction } from '@/app/actions/cycles'

export default function CreateCycleInline() {
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await createCycleAction({ title, description, deadline: new Date(deadline).toISOString() })
    if (!result.success) {
      setError(result.error ?? 'Failed to create cycle')
      setLoading(false)
    } else {
      window.location.reload()
    }
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
      >
        <Plus className="h-4 w-4" /> New Cycle
      </button>
    )
  }

  return (
    <form onSubmit={handleCreate} className="bg-white border rounded-xl p-5 space-y-3">
      <h3 className="font-semibold text-gray-900">Create Submission Cycle</h3>
      {error && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{error}</div>}
      <input
        type="text"
        placeholder="Title (e.g. FY2026 Succession Planning)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        className="w-full border rounded-md px-3 py-2 text-sm"
      />
      <input
        type="text"
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full border rounded-md px-3 py-2 text-sm"
      />
      <div>
        <label className="text-xs text-gray-600">Deadline</label>
        <input
          type="datetime-local"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          required
          className="w-full border rounded-md px-3 py-2 text-sm"
        />
      </div>
      <p className="text-xs text-gray-500">This will create draft submissions for all agencies automatically.</p>
      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium disabled:opacity-50">
          {loading ? 'Creating...' : 'Create Cycle'}
        </button>
        <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-md text-sm">Cancel</button>
      </div>
    </form>
  )
}
