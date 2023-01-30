import {
  CardSuit,
  getCardSuit,
  getCardValue,
  rankToString,
  suitToString,
} from '../game/deck'
import { Card } from '../game/gameState'
import { AnimatePresence, motion } from 'framer-motion'
import { useRef, useState } from 'react'
import { BoundingRect, getBoundingRect } from '../game/helpers'
import Image from 'next/image'

interface CardProps {
  card: Card
  className?: string
  onTap?: (selected: boolean, card: Card) => void
  onDrag?: (selected: boolean, rect: BoundingRect) => void
  onDragEnd?: (selected: boolean, card: Card, rect: BoundingRect) => void
  displayValue?: boolean
}

const PlayerCardDisplay = ({
  card,
  displayValue,
  onTap,
  onDragEnd,
  onDrag,
}: CardProps) => {
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
      onDragStart={() => {
        setIsDragging(true)
      }}
      drag
      animate={selected ? { y: -15, order: -1 } : undefined}
      whileHover={!selected ? { y: -15 } : undefined}
      whileDrag={{ scale: 0.5 }}
      whileTap={{ scale: 0.95 }}
      dragSnapToOrigin
      onTap={() => {
        if (isDragging) return
        if (onTap != undefined) onTap(!selected, card)
        setSelected(s => !s)
      }}
      className={
        'relative flex flex-col border-solid border border-black shadow-md rounded-md sm:rounded-md bg-white \
        px-1 sm:p-1 md:px-1 md:py-0 w-[50px] h-[75px] sm:w-12 sm:h-18 md:w-[60px] md:h-[90px] lg:w-16 lg:h-20 xl:w-[100px] \
        xl:h-[150px] cursor-pointer'
      }
    >
      {suit != CardSuit.Joker ? (
        <>
          <div
            className={`flex-1 m-0 p-0 font-bold tracking-tight text-xl md:text-md lg:text-lg xl:text-3xl ${
              suit == CardSuit.Clubs || suit == CardSuit.Spade
                ? 'text-black'
                : 'text-red-500'
            }`}
          >
            <div className="select-none">{rankString}</div>
            <div className="-mt-3 select-none">{suitString}</div>
          </div>
          {displayValue && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-1 text-info font-medium select-none font-serif"
              >
                <div>{getCardValue(card)}</div>
              </motion.div>
            </AnimatePresence>
          )}
        </>
      ) : (
        <Image fill alt="Joker card" src="./joker.svg" draggable={false} />
      )}
    </motion.div>
  )
}

export default PlayerCardDisplay
