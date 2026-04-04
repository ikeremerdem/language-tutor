const KEY = 'filos_last_tutor'

export interface LastTutor {
  id: string
  language: string
}

export function saveLastTutor(tutor: LastTutor) {
  localStorage.setItem(KEY, JSON.stringify(tutor))
}

export function loadLastTutor(): LastTutor | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as LastTutor) : null
  } catch {
    return null
  }
}
