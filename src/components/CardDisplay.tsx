import { CardSuit, getCardSuit, rankToString, suitToString } from '../game/deck'
import { Card } from '../game/gameState'
import { motion } from 'framer-motion'
import { useRef, useState } from 'react'

interface CardProps {
  card: Card
  className?: string
  onTap?: (selected: boolean, card: Card) => void
  onDragEnd?: (selected: boolean, card: Card) => void
}

const getCardColor = (c: Card): string => {
  const suit = getCardSuit(c)
  if (suit == CardSuit.Clubs) return 'black'
  if (suit == CardSuit.Diamond) return 'yellow-500'
  if (suit == CardSuit.Hearts) return 'red-500'
  if (suit == CardSuit.Spade) return 'gray-600'
  else return 'blue-600'
}

const CardDisplay = ({ card, className, onTap, onDragEnd }: CardProps) => {
  const rankString = rankToString(card)
  const suitString = suitToString(card)
  const [selected, setSelected] = useState(false)
  const isDragging = useRef<boolean>(false)
  const suitColor = `text-${getCardColor(card)}`
  return (
    <motion.div
      onDragEnd={onDragEnd ? () => onDragEnd(selected, card) : undefined}
      onDragStart={() => (isDragging.current = true)}
      onDragTransitionEnd={() => (isDragging.current = false)}
      drag
      animate={selected ? { scale: 1.5 } : undefined}
      whileHover={!selected ? { scale: 1.5 } : undefined}
      whileTap={{ scale: 1.4 }}
      dragSnapToOrigin
      onTap={() => {
        if (isDragging.current) return
        if (onTap != undefined) onTap(!selected, card)
        setSelected(s => !s)
      }}
      className={
        'flex flex-col aboslute w-20 h-28 shadow-md rounded-md bg-white p-1 sm:p-1 md:p-1 ' +
          className || ''
      }
    >
      <div
        className={
          'flex-1 font-bold tracking-tight text-xs sm:text-sm md:text-md lg:text-lg xl:text-3xl ' +
          suitColor
        }
      >
        {rankString}
        {suitString}
      </div>
      <div className="flex-1 flex self-end rotate-180">
        <div
          className={
            'font-bold tracking-tight text-xs sm:text-sm md:text-md lg:text-lg xl:text-3xl ' +
            suitColor
          }
        >
          {rankString}
          {suitString}
        </div>
      </div>
    </motion.div>
  )
}

export default CardDisplay
