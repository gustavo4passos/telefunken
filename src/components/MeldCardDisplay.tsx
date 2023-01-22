import { CardSuit, getCardSuit, rankToString, suitToString } from '../game/deck'
import { Card } from '../game/gameState'
import { motion } from 'framer-motion'
import { useRef, useState } from 'react'

interface CardProps {
  card: Card
  className?: string
  onTap?: (selected: boolean, card: Card) => void
  onDragEnd?: (
    selected: boolean,
    card: Card,
    e: MouseEvent | TouchEvent | PointerEvent
  ) => void
}

const getCardColor = (c: Card): string => {
  const suit = getCardSuit(c)
  if (suit == CardSuit.Clubs) return 'black'
  if (suit == CardSuit.Diamond) return 'yellow-500'
  if (suit == CardSuit.Hearts) return 'red-500'
  if (suit == CardSuit.Spade) return 'gray-600'
  else return 'blue-600'
}

const MeldCardDisplay = ({ card, className, onTap, onDragEnd }: CardProps) => {
  const rankString = rankToString(card)
  const suitString = suitToString(card)
  const [selected, setSelected] = useState(false)
  const isDragging = useRef<boolean>(false)
  const suitColor = `text-${getCardColor(card)}`

  return (
    <motion.div
      onDragEnd={
        onDragEnd
          ? e => {
              onDragEnd(selected, card, e)
            }
          : undefined
      }
      animate={selected ? { scale: 1.2 } : undefined}
      whileTap={{ scale: 1.1 }}
      dragSnapToOrigin
      onTap={() => {
        if (isDragging.current) return
        if (onTap != undefined) onTap(!selected, card)
        setSelected(s => !s)
      }}
      className={
        'flex flex-col border-black border-solid border-1 -m-1 sm:-m-1 md:-m-1 shadow-md rounded-sm sm:rounded-md\
         bg-white p-0 md:p-1 w-6 h-8 md:w-10 md:h-14 lg:w-10 lg:h-16 border ' +
          className || ''
      }
    >
      <div
        className={
          'flex-1 font-bold tracking-tight text-xs sm:text-sm md:text-md lg:text-lg xl:text-xl ' +
          suitColor
        }
      >
        <div>{rankString}</div>
        <div>{suitString}</div>
      </div>
      <div className="flex-1 flex self-end rotate-180">
        {/* <div
          className={
            'font-bold tracking-tight text-xs sm:text-sm md:text-md lg:text-lg xl:text-xl ' +
            suitColor
          }
        >
          {rankString}
          {suitString}
        </div> */}
      </div>
    </motion.div>
  )
}

export default MeldCardDisplay
