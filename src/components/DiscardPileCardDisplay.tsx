import { CardSuit, getCardSuit, rankToString, suitToString } from '../game/deck'
import { Card } from '../game/gameState'
import { motion } from 'framer-motion'
import { useRef } from 'react'
import Image from 'next/image'
import { useAppSelector } from '../store/hooks'
import AnimationLayoutWrapper from './AnimationLayoutWrapper'

interface DiscardPileCardDisplayProps {
  card: Card
  className?: string
  pileSize: number
  onTap: (selected: boolean, card: Card) => void
  onDragEnd?: (card: Card, e: MouseEvent | TouchEvent | PointerEvent) => void
}

const DiscardPileCardDisplay = ({
  card,
  onTap,
  pileSize,
}: DiscardPileCardDisplayProps) => {
  const suit = getCardSuit(card)
  const rankString = rankToString(card)
  const suitString = suitToString(card)
  const isDragging = useRef<boolean>(false)

  const discardAnimationStatus = useAppSelector(
    state => state.gameData.playerDiscardAnimation.animationStatus
  )

  return (
    <AnimationLayoutWrapper type="destination" status={discardAnimationStatus}>
      <motion.div
        layout="position"
        layoutId={card.toString()}
        key={card.toString()}
        onDragTransitionEnd={() => (isDragging.current = false)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 1.025 }}
        onTap={() => onTap(false, card)}
        dragSnapToOrigin
        transition={{ duration: 1 }}
        className={`flex select-none flex-col border-solid border border-black shadow-md \
        rounded-md lg:rounded-md bg-white p-1 sm:p-1 md:p-1 w-[50px] h-[75px] lg:w-[100px] \
        lg:h-[150px] md:w-[70px] md:h-[105px] relative cursor-pointer ${
          pileSize > 1 && '-ml-[48px] md:-ml-[67px] lg:-ml-[96px]'
        }`}
        onLayoutAnimationComplete={() => console.log('flkjdsjklfds')}
      >
        {suit != CardSuit.Joker ? (
          <>
            <div
              className={`flex-1 font-bold tracking-tight text-md md:text-xl lg:text-3xl xl:text-4xl ${
                suit == CardSuit.Clubs || suit == CardSuit.Spade
                  ? 'text-black'
                  : 'text-red-500'
              }`}
            >
              <div className="select-none">{rankString}</div>
              <div className="-mt-3 select-none">{suitString}</div>
            </div>
            <div className="flex-1 flex self-end rotate-180">
              <div
                className={`font-bold tracking-tight text-md md:text-xl lg:text-3xl xl:text-3xl ${
                  suit == CardSuit.Clubs || suit == CardSuit.Spade
                    ? 'text-black'
                    : 'text-red-500'
                }`}
              >
                <div className="select-none">{rankString}</div>
                <div className="-mt-3 select-none">{suitString}</div>
              </div>
            </div>
          </>
        ) : (
          <Image fill alt="Joker card" src="./joker.svg" draggable={false} />
        )}
      </motion.div>
    </AnimationLayoutWrapper>
  )
}

export default DiscardPileCardDisplay
