'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { AppUser } from '@/lib/queries/users'
import { createUserAction, updateUserAction, deleteUserAction } from '@/app/actions/users'

export default function UserManagement({ users }: { users: AppUser[] }) {
  const [showForm, setShowForm] = useState(false)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<string>('agency_hr')
  const [agency, setAgency] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await createUserAction({ email, name, role, agency: role === 'agency_hr' ? agency : undefined })
    if (!result.success) setError(result.error ?? 'Failed')
    else {
      setShowForm(false)
      setEmail('')
      setName('')
      setAgency('')
    }
    setLoading(false)
  }

  async function handleToggleActive(user: AppUser) {
    await updateUserAction(user.user_id, { is_active: !user.is_active })
  }

  async function handleDelete(userId: string) {
    if (!confirm('Delete this user permanently?')) return
    await deleteUserAction(userId)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">{users.length} users</p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Add User
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border rounded-lg p-4 space-y-3">
          {error && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{error}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border rounded-md px-3 py-2 text-sm"
            />
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="border rounded-md px-3 py-2 text-sm"
            />
            <select value={role} onChange={(e) => setRole(e.target.value)} className="border rounded-md px-3 py-2 text-sm">
              <option value="agency_hr">Agency HR</option>
              <option value="psd">PSD Officer</option>
              <option value="admin">Admin</option>
            </select>
            {role === 'agency_hr' && (
              <input
                type="text"
                placeholder="Agency (e.g. PSD, MOE, MHA)"
                value={agency}
                onChange={(e) => setAgency(e.target.value)}
                required
                className="border rounded-md px-3 py-2 text-sm"
              />
            )}
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium disabled:opacity-50">
              {loading ? 'Creating...' : 'Create User'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-md text-sm">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Email</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Role</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Agency</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((u) => (
              <tr key={u.user_id} className={!u.is_active ? 'opacity-50' : ''}>
                <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    u.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                    u.role === 'psd' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{u.agency ?? '—'}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleToggleActive(u)}
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}
                  >
                    {u.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleDelete(u.user_id)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
