import {
  CardSuit,
  cardToSvg,
  getCardSuit,
  rankToString,
  suitToString,
} from '../game/deck'
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
  onBuy?: (selected: boolean, card: Card) => void
  onDragEnd?: (card: Card, e: MouseEvent | TouchEvent | PointerEvent) => void
}

const DiscardPileCardDisplay = ({
  card,
  onBuy,
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
        onTap={() => {
          onBuy && onBuy(false, card)
        }}
        dragSnapToOrigin
        transition={{ duration: 2 }}
        className={`flex select-none flex-col border-solid border border-black shadow-md \
        rounded-md lg:rounded-md bg-cardBack p-1 sm:p-1 md:p-1 w-[50px] h-[75px] lg:w-[100px] \
        lg:h-[150px] md:w-[70px] md:h-[105px] relative cursor-pointer ${
          pileSize > 1 && '-ml-[48px] md:-ml-[67px] lg:-ml-[96px] z-50'
        }`}
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
              <div className="select-none font-serif ml-[2px]">
                {rankString}
              </div>
              <div className="select-none relative w-[25px] h-[25px] ">
                <Image
                  alt="card-suit-image"
                  fill
                  src={cardToSvg(card)}
                  draggable={false}
                />
              </div>
            </div>
            <div className="flex-1 relative mb-[20px]">
              <Image
                alt="card-suit-image"
                fill
                src={cardToSvg(card)}
                draggable={false}
              />
            </div>
          </>
        ) : (
          <Image fill alt="Joker card" src="/joker.svg" draggable={false} />
        )}
      </motion.div>
    </AnimationLayoutWrapper>
  )
}

export default DiscardPileCardDisplay
