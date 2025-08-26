'use client'

import { useAuth } from '@/hooks/use-auth'

export default function DebugPage() {
  const { user, login, logout, loading } = useAuth()

  const handleTestLogin = () => {
    login({
      id: 'test-id',
      email: 'test@test.com',
      name: 'Test User',
      role: 'INITIATOR'
    })
  }

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Debug Auth</h1>
      
      <div className="space-y-2">
        <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
        <p><strong>User:</strong> {user ? JSON.stringify(user) : 'Null'}</p>
      </div>

      <div className="space-x-2">
        <button onClick={handleTestLogin} className="px-4 py-2 bg-blue-500 text-white rounded">
          Test Login
        </button>
        <button onClick={logout} className="px-4 py-2 bg-red-500 text-white rounded">
          Logout
        </button>
      </div>

      <div>
        <h2 className="text-xl font-semibold">LocalStorage:</h2>
        <pre>{localStorage.getItem('user') || 'No user in localStorage'}</pre>
      </div>
    </div>
  )
}