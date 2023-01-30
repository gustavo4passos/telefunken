import { motion } from 'framer-motion'
import { Card } from '../game/gameState'
import Image from 'next/image'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { useEffect } from 'react'
import {
  AnimationStatus,
  setDealStartAnimation,
} from '../store/slices/gameDataSlice'

interface DrawPileProps {
  pile: Array<Card>
}

const DrawPile = ({ pile }: DrawPileProps) => {
  const startAnimationStatus = useAppSelector(
    state => state.gameData.playerDrawAnimation
  )
  const playerCards = useAppSelector(state => state.gameData.playerCards)
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (startAnimationStatus == AnimationStatus.HideDestinationRequested) {
      dispatch(setDealStartAnimation(AnimationStatus.HideDestinationReady))
    } else if (startAnimationStatus == AnimationStatus.HideDestinationReady) {
      dispatch(setDealStartAnimation(AnimationStatus.HideOrigin))
    }
  }, [startAnimationStatus, dispatch])

  const getTopCardKey = () => {
    return startAnimationStatus != AnimationStatus.HideOrigin
      ? playerCards[playerCards.length - 1].toString()
      : 'draw-top'
  }
  const renderTopCard = () => {
    return (
      <motion.div
        className="flex border-solid border-black border shadow-md rounded-md lg:rounded-md bg-slate-200 \
        md:-ml-[67px] -ml-[48px] lg:-ml-[96px] w-[50px] h-[75px] md:w-[70px] md:h-[105px] lg:w-[100px] lg:h-[150px] relative"
        key={getTopCardKey()}
        layoutId={getTopCardKey()}
      >
        <Image
          fill
          src={'card-back-vertical.svg'}
          alt="Card back"
          draggable={false}
        />
      </motion.div>
    )
  }
  return (
    <motion.div
      className="flex items-center justify-center select-none"
      layout="position"
    >
      {pile.length > 2 && (
        <div
          className="flex border-solid border-black border shadow-md rounded-md lg:rounded-md bg-slate-200 \
          w-[50px] h-[75px] md:w-[70px] md:h-[105px] lg:w-[100px] lg:h-[150px] relative"
        >
          <Image
            fill
            src={'card-back-vertical.svg'}
            alt="Card back"
            draggable={false}
          />
        </div>
      )}
      {pile.length > 1 && (
        <div
          className="flex border-solid border-black border shadow-md rounded-md lg:rounded-md bg-slate-200 \
          -ml-[48px] md:-ml-[67px] lg:-ml-[96px] w-[50px] h-[75px] md:w-[70px] md:h-[105px] lg:w-[100px] lg:h-[150px] relative"
        >
          <Image
            fill
            src={'card-back-vertical.svg'}
            alt="Card back"
            draggable={false}
          />
        </div>
      )}
      {pile.length > 0 && renderTopCard()}
    </motion.div>
  )
}

export default DrawPile
