import { createContext, useContext } from 'react'

export interface TutorContextValue {
  tutorId: string
  targetLanguage: string
}

export const TutorContext = createContext<TutorContextValue>({ tutorId: '', targetLanguage: '' })
export const useTutor = () => useContext(TutorContext)
