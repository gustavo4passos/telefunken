import { CardSuit, getCardSuit, rankToString, suitToString } from '../game/deck'
import { Card } from '../game/gameState'
import { motion } from 'framer-motion'
import { useRef, useState } from 'react'
import { getBoundingRect } from '../game/helpers'
import Image from 'next/image'

interface CardProps {
  card: Card
  className?: string
  onTap?: (selected: boolean, card: Card) => void
  onDrag?: (selected: boolean, rect: DOMRect) => void
  onDragEnd?: (selected: boolean, card: Card, rect: DOMRect) => void
}

const PlayerCardDisplay = ({ card, onTap, onDragEnd, onDrag }: CardProps) => {
  const suit = getCardSuit(card)
  const rankString = rankToString(card)
  const suitString = suitToString(card)
  const [selected, setSelected] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const ref = useRef<HTMLDivElement>(null)

  return (
    <motion.div
      ref={ref}
      onDragEnd={() => {
        setIsDragging(false)
        if (!onDragEnd || !ref || !ref.current) return
        onDragEnd(selected, card, getBoundingRect(ref.current))
      }}
      onDrag={(e, info) => {
        if (info.delta.x > 10 || info.delta.y > 10) setSelected(false)

        if (onDrag && ref && ref.current) {
          const rect = getBoundingRect(ref.current)
          {
            onDrag(false, rect)
          }
        }
      }}
      onDragStart={() => setIsDragging(true)}
      drag
      animate={selected ? { y: -20, order: -1 } : undefined}
      whileHover={!selected ? { y: -20 } : undefined}
      whileTap={{ scale: 0.9 }}
      dragSnapToOrigin
      onTap={() => {
        if (isDragging) return
        if (onTap != undefined) onTap(!selected, card)
        setSelected(s => !s)
      }}
      className={
        'relative flex flex-col border-solid border border-black -ml-2 sm:-ml-1 md:-ml-5 \
        shadow-md rounded-sm sm:rounded-md bg-white px-1 sm:p-1 md:px-1 md:py-0 \
        w-8 h-12 sm:w-12 sm:h-18 md:w-11 md:h-14 lg:w-16 lg:h-20 xl:w-[80px] xl:h-[120px]'
      }
    >
      {suit != CardSuit.Joker ? (
        <div
          className={`flex-1 m-0 p-0 font-bold tracking-tight text-sm md:text-md lg:text-lg xl:text-3xl ${
            suit == CardSuit.Clubs || suit == CardSuit.Spade
              ? 'text-black'
              : 'text-red-500'
          }`}
        >
          <div>{rankString}</div>
          <div className="-mt-3">{suitString}</div>
        </div>
      ) : (
        <div>
          <Image fill alt="Joker card" src="./joker.svg" draggable={false} />
        </div>
      )}
    </motion.div>
  )
}

export default PlayerCardDisplay
