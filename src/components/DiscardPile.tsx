import { motion } from 'framer-motion'
import { Card } from '../game/gameState'
import DiscardPileCardDisplay from './DiscardPileCardDisplay'

interface DiscardPileProps {
  pile: Array<Card>
  wantsToDiscard: boolean
  canDiscard: boolean
  onBuyCard: () => void
}

const DiscardPile = ({
  pile,
  wantsToDiscard,
  onBuyCard,
  canDiscard,
}: DiscardPileProps) => {
  return (
    <motion.div
      className="flex items-center justify-center"
      animate={{
        scale: wantsToDiscard && canDiscard ? 1.1 : 1,
      }}
    >
      {pile.length == 0 && (
        <div
          className={`flex shadow-inner blur-sm rounded-md lg:rounded-md bg-secondary  \
          md:w-[70px] md:h-[105px] w-[50px] h-[75px] lg:w-[100px] lg:h-[150px]`}
        />
      )}
      {pile.length > 3 && (
        <div
          className={`flex border-solid border-black border shadow-lg rounded-md lg:rounded-md bg-slate-400 \
          md:w-[70px] md:h-[105px] w-[50px] h-[75px] lg:w-[100px] lg:h-[150px]`}
        />
      )}
      {pile.length > 2 && (
        <div
          className={`flex border-solid border-black border shadow-md rounded-md lg:rounded-md bg-slate-300 \
          ${
            pile.length > 3 && '-ml-[48px] md:-ml-[67px] lg:-ml-[96px]'
          } md:w-[70px] md:h-[105px] w-[50px] h-[75px] lg:w-[100px] lg:h-[150px]`}
        />
      )}
      {pile.length > 1 && (
        <DiscardPileCardDisplay
          onTap={onBuyCard}
          card={pile[pile.length - 2]}
          pileSize={pile.length - 1}
        />
      )}

      {pile.length > 0 && (
        <DiscardPileCardDisplay
          onTap={onBuyCard}
          card={pile[pile.length - 1]}
          pileSize={pile.length}
        />
      )}
    </motion.div>
  )
}

export default DiscardPile
