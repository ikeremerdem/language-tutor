import { useEffect, useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { TutorContext } from '../context/TutorContext'
import type { LanguageTutor } from '../types'
import { getTutors } from '../api/client'
import Layout from './Layout'

export default function TutorLayout() {
  const { tutorId } = useParams<{ tutorId: string }>()
  const [tutor, setTutor] = useState<LanguageTutor | null | undefined>(undefined)

  useEffect(() => {
    if (!tutorId) return
    getTutors().then((tutors) => {
      setTutor(tutors.find((t) => t.id === tutorId) ?? null)
    }).catch(() => setTutor(null))
  }, [tutorId])

  if (tutor === undefined) {
    return <div className="min-h-screen bg-filos-marble flex items-center justify-center text-gray-400">Loading…</div>
  }

  if (tutor === null) {
    return <Navigate to="/tutors" replace />
  }

  return (
    <TutorContext.Provider value={{ tutorId: tutor.id, targetLanguage: tutor.language }}>
      <Layout />
    </TutorContext.Provider>
  )
}
