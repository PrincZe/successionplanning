import { getUsers } from '@/lib/queries/users'
import UserManagement from './UserManagement'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const users = await getUsers()

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">User Management</h1>
        <UserManagement users={users} />
      </main>
    </div>
  )
}
