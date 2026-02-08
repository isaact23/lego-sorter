import { useMemo, useState, useEffect } from 'react'
import OptionCard from './OptionCard'
import categoryData from './CategoryData'
import '../App/App.css'

export default function CategorySelectCard ({ resetTrigger, onCategorySelect }) {
  const [cat1, setCat1] = useState('')
  const [cat2, setCat2] = useState('')

  // Reset only when explicitly triggered
  useEffect(() => {
    setCat1('')
    setCat2('')
    onCategorySelect?.([])
  }, [resetTrigger])

  const cat1Options = useMemo(
    () => [...new Set(categoryData.map(row => row.cat1))],
    []
  )

  const cat2Options = useMemo(() => {
    if (!cat1) return []

    return categoryData
      .filter(row => row.cat1 === cat1 && row.cat2 !== 'n/a')
      .map(row => row.cat2)
  }, [cat1])

  return (
    <OptionCard iconSrc="/icons/mag_glass.png">
      {/* Category */}
      <select
        className="w3-select w3-border w3-padding option-select"
        value={cat1}
        onChange={e => {
          const value = e.target.value
          setCat1(value)
          setCat2('')

          if (!value) {
            onCategorySelect?.([])
            return
          }

          const ids = categoryData
            .filter(row => row.cat1 === value)
            .map(row => row.id)

          onCategorySelect?.(ids)
        }}
      >
        <option value="">Select category</option>
        {cat1Options.map(option => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      {/* Subcategory */}
      <select
        className="w3-select w3-border w3-padding option-select"
        value={cat2}
        disabled={!cat1}
        onChange={e => {
          const value = e.target.value
          setCat2(value)

          if (!value) {
            const ids = categoryData
              .filter(row => row.cat1 === cat1)
              .map(row => row.id)

            onCategorySelect?.(ids)
            return
          }

          const match = categoryData.find(
            row => row.cat1 === cat1 && row.cat2 === value
          )

          onCategorySelect?.(match ? [match.id] : [])
        }}
      >
        <option value="">Select subcategory</option>
        {cat2Options.map(option => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </OptionCard>
  )
}