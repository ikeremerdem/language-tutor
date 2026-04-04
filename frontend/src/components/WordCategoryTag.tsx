interface Props {
  category: string
}

export default function WordCategoryTag({ category }: Props) {
  return (
    <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
      {category}
    </span>
  )
}
