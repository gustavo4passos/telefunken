import { motion } from 'framer-motion'
import { Card } from '../game/gameState'
import Image from 'next/image'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { useEffect } from 'react'
import {
  AnimationStatus,
  setDealStartAnimation,
  setDrawStartAnimation,
} from '../store/slices/gameDataSlice'
import AnimationLayoutWrapper from './AnimationLayoutWrapper'

interface DrawPileProps {
  pile: Array<Card>
}

const DrawPile = ({ pile }: DrawPileProps) => {
  const startAnimationStatus = useAppSelector(
    state => state.gameData.playerDrawAnimation
  )

  const dealStartAnimationStatus = useAppSelector(
    state => state.gameData.dealStartAnimation
  )
  const players = useAppSelector(state => state.gameData.playerOrder)
  const playerId = useAppSelector(state => state.gameData.playerId)

  const playerCards = useAppSelector(state => state.gameData.playerCards)
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (startAnimationStatus == AnimationStatus.HideDestination) {
      dispatch(setDrawStartAnimation(AnimationStatus.HideOrigin))
    }
  }, [startAnimationStatus, dispatch])

  useEffect(() => {
    if (dealStartAnimationStatus == AnimationStatus.HideDestination) {
      dispatch(setDealStartAnimation(AnimationStatus.HideOrigin))
    }
  })

  const getTopCardKey = () => {
    return startAnimationStatus != AnimationStatus.HideOrigin
      ? playerCards[playerCards.length - 1].toString()
      : 'draw-top'
  }

  const renderTopCard = () => {
    return (
      <motion.div
        className="flex border-solid border-black border shadow-md rounded-md lg:rounded-md bg-cardBack \
        md:-ml-[67px] -ml-[48px] lg:-ml-[96px] w-[50px] h-[75px] md:w-[70px] md:h-[105px] lg:w-[100px] lg:h-[150px] relative"
        key={getTopCardKey()}
        layoutId={getTopCardKey()}
      >
        <Image
          fill
          src={'/card-back-vertical.svg'}
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
          className="flex border-solid border-black border shadow-md rounded-md lg:rounded-md bg-cardBack \
          w-[50px] h-[75px] md:w-[70px] md:h-[105px] lg:w-[100px] lg:h-[150px] relative"
        >
          <Image
            fill
            src={'/card-back-vertical.svg'}
            alt="Card back"
            draggable={false}
          />
        </div>
      )}
      {pile.length > 1 && (
        <div
          className="flex border-solid border-black border shadow-md rounded-md lg:rounded-md bg-cardBack \
          -ml-[48px] md:-ml-[67px] lg:-ml-[96px] w-[50px] h-[75px] md:w-[70px] md:h-[105px] lg:w-[100px] \
            lg:h-[150px] relative"
        >
          <Image
            fill
            src={'/card-back-vertical.svg'}
            alt="Card back"
            draggable={false}
          />
        </div>
      )}
      {pile.length > 0 && renderTopCard()}
      {players
        .filter(p => p != playerId)
        .map((p, i) => (
          <AnimationLayoutWrapper
            type="origin"
            status={dealStartAnimationStatus}
            key={`player-${p}-${i}`}
          >
            <motion.div
              className="flex border-solid border-black border shadow-md rounded-md lg:rounded-md bg-cardBack \
              md:-ml-[67px] -ml-[48px] lg:-ml-[96px] w-[50px] h-[75px] md:w-[70px] md:h-[105px] lg:w-[100px] lg:h-[150px] relative"
              key={`player-${p}-${i}`}
              layoutId={`player-${p}-${i}`}
            >
              <Image
                fill
                src={'/card-back-vertical.svg'}
                alt="Card back"
                draggable={false}
              />
            </motion.div>
          </AnimationLayoutWrapper>
        ))}
    </motion.div>
  )
}

export default DrawPile
