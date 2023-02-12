import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { PlayerID } from '../game/gameState'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import {
  AnimationStatus,
  setDiscardAnimation,
} from '../store/slices/gameDataSlice'
import Image from 'next/image'
import AnimationLayoutWrapper from './AnimationLayoutWrapper'

interface RemotePlayerCardsDisplayProps {
  playerId: PlayerID
  nCards: number
  horizontal?: boolean
}

const RemotePlayerCardsDisplay = ({
  playerId,
  nCards,
  horizontal,
}: RemotePlayerCardsDisplayProps) => {
  const discardAnimationStatus = useAppSelector(
    state => state.gameData.playerDiscardAnimation
  )

  const dealStartAnimationStatus = useAppSelector(
    state => state.gameData.dealStartAnimation
  )

  const dispatch = useAppDispatch()

  const getThisPlayersAnimationStatus = () => {
    if (discardAnimationStatus.playerId != playerId)
      return AnimationStatus.HideOrigin
    else return discardAnimationStatus.animationStatus
  }

  useEffect(() => {
    if (discardAnimationStatus.playerId == playerId) {
      if (
        discardAnimationStatus.animationStatus ==
        AnimationStatus.HideDestination
      ) {
        dispatch(
          setDiscardAnimation({
            ...discardAnimationStatus,
            animationStatus: AnimationStatus.HideOrigin,
          })
        )
      }
    }
  }, [discardAnimationStatus, playerId, dispatch])

  return (
    <motion.div
      className={`flex ${horizontal ? 'flex-row' : 'flex-col'}`}
      layout
    >
      {[...Array(nCards)].map((k, i) => (
        <AnimationLayoutWrapper
          key={`player-${playerId}-${i}`}
          type="destination"
          status={dealStartAnimationStatus}
        >
          <motion.div
            key={`player-${playerId}-${i}`}
            layoutId={`player-${playerId}-${i}`}
            className={`flex relative border-solid border-black border shadow-md rounded-sm lg:rounded-md \
           select-none bg-gray-400 ${
             !horizontal
               ? '-mt-2 md:-mt-2 lg:-mt-4 w-6 h-4 lg:w-12 lg:h-8 first:mt-0'
               : '-ml-2 md:-ml-2 lg:-ml-4 w-4 h-6 lg:w-8 lg:h-12 first:ml-0'
           } `}
          >
            <Image
              fill
              src={
                !horizontal
                  ? 'card-back-horizontal.svg'
                  : 'card-back-vertical.svg'
              }
              alt="Card back"
              draggable={false}
            />
          </motion.div>
        </AnimationLayoutWrapper>
      ))}

      <AnimationLayoutWrapper
        status={getThisPlayersAnimationStatus()}
        type="origin"
      >
        <motion.div
          key={discardAnimationStatus.card.toString()}
          layoutId={discardAnimationStatus.card.toString()}
          className={`flex relative border-solid border-black border shadow-md rounded-sm lg:rounded-md \
           select-none bg-gray-400 ${
             !horizontal
               ? '-mt-2 md:-mt-2 lg:-mt-4 w-6 h-4 lg:w-12 lg:h-8 first:mt-0'
               : '-ml-2 md:-ml-2 lg:-ml-4 w-4 h-6 lg:w-8 lg:h-12 first:ml-0'
           } `}
        >
          <Image
            fill
            src={
              !horizontal
                ? 'card-back-horizontal.svg'
                : 'card-back-vertical.svg'
            }
            alt="Card back"
            draggable={false}
          />
        </motion.div>
      </AnimationLayoutWrapper>
    </motion.div>
  )
}

export default RemotePlayerCardsDisplay
