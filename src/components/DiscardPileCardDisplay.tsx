import { CardSuit, getCardSuit, rankToString, suitToString } from '../game/deck'
import { Card } from '../game/gameState'
import { motion } from 'framer-motion'
import { useRef } from 'react'
import Image from 'next/image'

interface DiscardPileCardDisplayProps {
  card: Card
  className?: string
  onTap?: (selected: boolean, card: Card) => void
  onDragEnd?: (card: Card, e: MouseEvent | TouchEvent | PointerEvent) => void
}

const DiscardPileCardDisplay = ({ card }: DiscardPileCardDisplayProps) => {
  const suit = getCardSuit(card)
  const rankString = rankToString(card)
  const suitString = suitToString(card)
  const isDragging = useRef<boolean>(false)

  return (
    <motion.div
      onDragTransitionEnd={() => (isDragging.current = false)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 1.025 }}
      dragSnapToOrigin
      className={
        'flex select-none flex-col border-solid border border-black shadow-md rounded-sm lg:rounded-md bg-white \
          -ml-6 lg:-ml-28 p-1 sm:p-1 md:p-1 w-8 h-12 lg:w-32 lg:h-48 relative'
      }
    >
      {suit != CardSuit.Joker ? (
        <>
          <div
            className={`flex-1 font-bold tracking-tight text-sm md:text-md lg:text-3xl xl:text-4xl  ${
              suit == CardSuit.Clubs || suit == CardSuit.Spade
                ? 'text-black'
                : 'text-red-500'
            }`}
          >
            {rankString}
            {suitString}
          </div>
          <div className="flex-1 flex self-end rotate-180">
            <div
              className={`font-bold tracking-tight text-xs sm:text-sm md:text-md lg:text-3xl xl:text-3xl  ${
                suit == CardSuit.Clubs || suit == CardSuit.Spade
                  ? 'text-black'
                  : 'text-red-500'
              }`}
            >
              {rankString}
              {suitString}
            </div>
          </div>
        </>
      ) : (
        <div>
          <Image fill alt="Joker card" src="./joker.svg" draggable={false} />
        </div>
      )}
    </motion.div>
  )
}

export default DiscardPileCardDisplay
