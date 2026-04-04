import { useState } from 'react'

interface Props {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
}

export default function TagInput({ tags, onChange, placeholder = 'Add category…' }: Props) {
  const [input, setInput] = useState('')

  const commit = () => {
    const val = input.trim().toLowerCase()
    if (val && !tags.includes(val)) {
      onChange([...tags, val])
    }
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commit()
    } else if (e.key === 'Backspace' && input === '' && tags.length > 0) {
      onChange(tags.slice(0, -1))
    }
  }

  const remove = (tag: string) => onChange(tags.filter((t) => t !== tag))

  return (
    <div className="flex flex-wrap gap-1.5 items-center min-h-[42px] border border-gray-300 rounded-lg px-2 py-1.5 focus-within:ring-2 focus-within:ring-filos-primary/30 focus-within:border-filos-primary transition">
      {tags.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
          {tag}
          <button
            type="button"
            onClick={() => remove(tag)}
            className="text-teal-400 hover:text-teal-700 leading-none"
            aria-label={`Remove ${tag}`}
          >
            ×
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commit}
        className="flex-1 min-w-[100px] text-sm outline-none bg-transparent py-0.5"
        placeholder={tags.length === 0 ? placeholder : ''}
      />
    </div>
  )
}
