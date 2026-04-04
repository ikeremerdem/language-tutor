import { TutorContext } from '../context/TutorContext'
import { loadLastTutor } from '../hooks/useLastTutor'
import Layout from './Layout'

export default function PersistentLayout() {
  const last = loadLastTutor()
  const value = last
    ? { tutorId: last.id, targetLanguage: last.language }
    : { tutorId: '', targetLanguage: '' }

  return (
    <TutorContext.Provider value={value}>
      <Layout />
    </TutorContext.Provider>
  )
}
