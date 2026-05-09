'use client'

import { useState } from 'react'
import { Plus, XCircle } from 'lucide-react'
import type { SubmissionCycle } from '@/lib/queries/submissions'
import { createCycleAction, closeCycleAction } from '@/app/actions/cycles'

export default function CycleManagement({ cycles }: { cycles: SubmissionCycle[] }) {
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await createCycleAction({ title, description, deadline: new Date(deadline).toISOString() })
    if (!result.success) setError(result.error ?? 'Failed')
    else {
      setShowForm(false)
      setTitle('')
      setDescription('')
      setDeadline('')
    }
    setLoading(false)
  }

  async function handleClose(cycleId: string) {
    if (!confirm('Close this cycle? No more submissions will be accepted.')) return
    await closeCycleAction(cycleId)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">{cycles.length} cycles</p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> New Cycle
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border rounded-lg p-4 space-y-3">
          {error && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{error}</div>}
          <input
            type="text"
            placeholder="Title (e.g. FY2026 Succession Planning)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm"
            rows={2}
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
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium disabled:opacity-50">
              {loading ? 'Creating...' : 'Create Cycle'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-md text-sm">Cancel</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {cycles.map((c) => (
          <div key={c.cycle_id} className="bg-white border rounded-lg p-4 flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">{c.title}</div>
              {c.description && <div className="text-sm text-gray-600 mt-0.5">{c.description}</div>}
              <div className="text-xs text-gray-500 mt-1">
                Deadline: {new Date(c.deadline).toLocaleDateString()} &middot; Created: {new Date(c.created_at).toLocaleDateString()}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                {c.status}
              </span>
              {c.status === 'open' && (
                <button onClick={() => handleClose(c.cycle_id)} className="text-red-500 hover:text-red-700" title="Close cycle">
                  <XCircle className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
        {cycles.length === 0 && (
          <div className="text-center text-gray-500 py-8">No submission cycles yet. Create one to get started.</div>
        )}
      </div>
    </div>
  )
}
