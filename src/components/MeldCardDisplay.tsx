import { CardSuit, getCardSuit, rankToString, suitToString } from '../game/deck'
import { Card } from '../game/gameState'
import { motion } from 'framer-motion'
import { useRef, useState } from 'react'
import Image from 'next/image'

interface CardProps {
  card: Card
  selected: boolean
  onTap?: (selected: boolean, card: Card) => void
  onDragEnd?: (
    selected: boolean,
    card: Card,
    e: MouseEvent | TouchEvent | PointerEvent
  ) => void
}

const MeldCardDisplay = ({ card, selected, onTap }: CardProps) => {
  const suit = getCardSuit(card)
  const rankString = rankToString(card)
  const suitString = suitToString(card)

  return (
    <motion.div
      layout="position"
      layoutId={card.toString()}
      animate={selected ? { scale: 1.2 } : undefined}
      whileTap={{ scale: 1.1 }}
      onTap={() => {
        if (onTap != undefined) onTap(!selected, card)
      }}
      className={`flex flex-col border-black border-solid border-1 -ml-[12px] sm:-ml-1 md:-ml-[10px] first:-ml-0 \
      shadow-md rounded-[4px] sm:rounded-md bg-white pl-[2px] w-[30px] h-[45px] md:w-[50px] md:h-[75px] lg:w-[40px] \
      lg:h-[60px] border relative ${
        suit == CardSuit.Clubs || suit == CardSuit.Spade
          ? 'text-black'
          : 'text-red-500'
      }`}
    >
      {suit != CardSuit.Joker ? (
        <div
          className={
            'flex-1 font-bold tracking-tight text-md md:text-xl xl:text-xl select-none m-0 p-0'
          }
        >
          <div className="select-none">{rankString}</div>
          <div className="-mt-3 md:-mt-3 select-none">{suitString}</div>
        </div>
      ) : (
        <Image
          fill
          alt="Joker card"
          src="./joker.svg"
          draggable={false}
          className="select-none"
        />
      )}
    </motion.div>
  )
}

export default MeldCardDisplay
