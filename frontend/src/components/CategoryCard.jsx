import { useMemo, useState, useEffect } from 'react'
import OptionCard from './OptionCard'
import '../app/App.css'

export default function CategoryCard ({ resetTrigger, onCategorySelect }) {
  const [cat1, setCat1] = useState('')
  const [cat2, setCat2] = useState('')

  const categoryData = [
    { id: 28, cat1: 'Animals..', cat2: 'Animals' },
    { id: 74, cat1: 'Animals..', cat2: 'Accessories' },
    { id: 75, cat1: 'Animals..', cat2: 'Body Parts' },
    { id: 32, cat1: 'Bars, Ladders, Fences', cat2: 'n/a' },
    { id: 1, cat1: 'Baseplates', cat2: 'n/a' },
    { id: 11, cat1: 'Brick..', cat2: 'Bricks' },
    { id: 37, cat1: 'Brick..', cat2: 'Curved' },
    { id: 20, cat1: 'Brick..', cat2: 'Round and Cones' },
    { id: 3, cat1: 'Brick..', cat2: 'Sloped' },
    { id: 5, cat1: 'Brick..', cat2: 'Special' },
    { id: 6, cat1: 'Brick..', cat2: 'Wedged' },
    { id: 7, cat1: 'Containers', cat2: 'n/a' },
    { id: 69, cat1: 'Energy Effects', cat2: 'n/a' },
    { id: 38, cat1: 'Flags', cat2: 'Banners and Signs' },
    { id: 18, cat1: 'Hinges, Arms, Turntables', cat2: 'n/a' },
    { id: 44, cat1: 'Mechanical', cat2: 'n/a' },
    { id: 62, cat1: 'Minidolls..', cat2: 'Heads' },
    { id: 64, cat1: 'Minidolls..', cat2: 'Lower Body' },
    { id: 63, cat1: 'Minidolls..', cat2: 'Upper Body' },
    { id: 13, cat1: 'Minifigs..', cat2: 'Minifigs' },
    { id: 27, cat1: 'Minifigs..', cat2: 'Accessories' },
    { id: 59, cat1: 'Minifigs..', cat2: 'Heads' },
    { id: 65, cat1: 'Minifigs..', cat2: 'Headwear' },
    { id: 72, cat1: 'Minifigs..', cat2: 'Headwear Accessories' },
    { id: 70, cat1: 'Minifigs..', cat2: 'Hipwear' },
    { id: 61, cat1: 'Minifigs..', cat2: 'Lower Body' },
    { id: 71, cat1: 'Minifigs..', cat2: 'Neckwear' },
    { id: 73, cat1: 'Minifigs..', cat2: 'Shields, Weapons, Tools' },
    { id: 60, cat1: 'Minifigs..', cat2: 'Upper Body' },
    { id: 23, cat1: 'Panels', cat2: 'n/a' },
    { id: 76, cat1: 'Plants & Trees', cat2: 'n/a' },
    { id: 14, cat1: 'Plates..', cat2: 'Plates' },
    { id: 49, cat1: 'Plates..', cat2: 'Angled' },
    { id: 21, cat1: 'Plates..', cat2: 'Round Curved & Dishes' },
    { id: 9, cat1: 'Plates..', cat2: 'Special' },
    { id: 68, cat1: 'Projectiles / Launchers', cat2: 'n/a' },
    { id: 33, cat1: 'Rock', cat2: 'n/a' },
    { id: 31, cat1: 'String, Bands, Reels', cat2: 'n/a' },
    { id: 34, cat1: 'Supports, Girders, Cranes', cat2: 'n/a' },
    { id: 46, cat1: 'Technic..', cat2: 'Axles' },
    { id: 51, cat1: 'Technic..', cat2: 'Beams' },
    { id: 55, cat1: 'Technic..', cat2: 'Beams Special' },
    { id: 8, cat1: 'Technic..', cat2: 'Bricks' },
    { id: 54, cat1: 'Technic..', cat2: 'Bushes' },
    { id: 12, cat1: 'Technic..', cat2: 'Connectors' },
    { id: 52, cat1: 'Technic..', cat2: 'Gears' },
    { id: 40, cat1: 'Technic..', cat2: 'Panels' },
    { id: 53, cat1: 'Technic..', cat2: 'Pins' },
    { id: 26, cat1: 'Technic..', cat2: 'Special' },
    { id: 25, cat1: 'Technic..', cat2: 'Steering, Suspension, Engine' },
    { id: 19, cat1: 'Tiles..', cat2: 'Tiles' },
    { id: 67, cat1: 'Tiles..', cat2: 'Round and Curved' },
    { id: 15, cat1: 'Tiles..', cat2: 'Special' },
    { id: 36, cat1: 'Transportation..', cat2: 'Land' },
    { id: 35, cat1: 'Transportation..', cat2: 'Sea and Air' },
    { id: 30, cat1: 'Tubes and Hoses', cat2: 'n/a' },
    { id: 29, cat1: 'Wheels and Tires', cat2: 'n/a' },
    { id: 16, cat1: 'Windows and Doors', cat2: 'n/a' },
    { id: 47, cat1: 'Windscreens and Fuselage', cat2: 'n/a' }
  ]

  // Reset only when explicitly triggered
  useEffect(() => {
    setCat1('')
    setCat2('')
    onCategorySelect?.({ ids: [], labels: [] })
  }, [resetTrigger, onCategorySelect])

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
          setCat2('')   // reset subcategory

          if (!value) {
            onCategorySelect?.({ ids: [], labels: [] })
            return
          }

          const ids = categoryData
            .filter(row => row.cat1 === value)
            .map(row => row.id)

          const cleanCat1 = value.replace('..', '')

          onCategorySelect?.({
            ids,
            labels: [cleanCat1]
          })
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

            const cleanLabel = cat1.replace('..', '')

            onCategorySelect?.({
              ids,
              labels: [cleanLabel]
            })
            return
          }

          const match = categoryData.find(
            row => row.cat1 === cat1 && row.cat2 === value
          )

          const cleanCat1 = cat1.replace('..', '')

          onCategorySelect?.({
            ids: match ? [match.id] : [],
            labels: match ? [cleanCat1, value] : []
          })
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