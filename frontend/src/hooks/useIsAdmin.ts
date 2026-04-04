import { useEffect, useState } from 'react'
import { checkAdmin } from '../api/client'
import { useAuth } from '../context/AuthContext'

export function useIsAdmin() {
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (!user) { setIsAdmin(false); return }
    checkAdmin()
      .then(() => setIsAdmin(true))
      .catch(() => setIsAdmin(false))
  }, [user])

  return isAdmin
}
