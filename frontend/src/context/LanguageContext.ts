import { createContext, useContext } from 'react'

export interface AppConfig {
  target_language: string
}

export const LanguageContext = createContext<AppConfig>({ target_language: 'Greek' })
export const useLanguage = () => useContext(LanguageContext)
