import { useMemo, useState, useEffect } from 'react'
import OptionCard from './OptionCard'
import categoryData from './CategoryData'
import '../App/App.css'

export default function CategorySelectCard({ onChange, onCategorySelect, resetTrigger }) {
  const [cat1, setCat1] = useState('')
  const [cat2, setCat2] = useState('')

  // Reset when search input is used
  useEffect(() => {
    setCat1('')
    setCat2('')
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

  const matchingIds = useMemo(() => {
    if (!cat1) return []

    return categoryData
      .filter(row => row.cat1 === cat1)
      .map(row => row.id)
  }, [cat1])

  const selectedCategoryId = useMemo(() => {
    if (!cat1 || !cat2) return null

    const match = categoryData.find(
      row => row.cat1 === cat1 && row.cat2 === cat2
    )

    return match?.id ?? null
  }, [cat1, cat2])

  useEffect(() => {

    if (cat2 && selectedCategoryId) {
      onChange?.([selectedCategoryId])
    } else if (cat1) {
      onChange?.(matchingIds)
    } else {
      onChange?.([])
    }
  }, [cat1, cat2, matchingIds, selectedCategoryId, onChange, onCategorySelect])

  return (
    <OptionCard iconSrc="/icons/mag_glass.png">
      <select
        className="w3-select w3-border w3-padding option-select"
        value={cat1}
        onChange={e => {
          setCat1(e.target.value)
          setCat2('')
          onCategorySelect?.()
        }}
      >
        <option value="">Select category</option>
        {cat1Options.map(option => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      <select
        className="w3-select w3-border w3-padding option-select"
        value={cat2}
        disabled={!cat1}
        onChange={e => {
          setCat2(e.target.value)
          onCategorySelect?.()
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
