import { motion } from 'framer-motion'
import { Card } from '../game/gameState'
import DiscardPileCardDisplay from './DiscardPileCardDisplay'

interface DiscardPileProps {
  pile: Array<Card>
  wantsToDiscard: boolean
}

const DiscardPile = ({ pile, wantsToDiscard }: DiscardPileProps) => {
  return (
    <motion.div
      className="flex items-center justify-center"
      animate={{ scale: wantsToDiscard ? 1.1 : 1 }}
    >
      {pile.length > 3 && (
        <div
          className="flex border-solid border-black border shadow-md rounded-sm lg:rounded-md bg-slate-300 \
            w-8 h-12 lg:w-32 lg:h-48 md:-ml-28"
        />
      )}
      {pile.length > 2 && (
        <div
          className="flex border-solid border-black border shadow-md rounded-sm lg:rounded-md bg-slate-200 \
          -ml-6 lg:-ml-28 w-8 h-12 lg:w-32 lg:h-48"
        />
      )}
      {pile.length > 1 && (
        <div
          className="flex border-solid border-black border shadow-md rounded-sm lg:rounded-md bg-slate-100 \
          -ml-6 lg:-ml-28 w-8 h-12 lg:w-32 lg:h-48"
        />
      )}
      <DiscardPileCardDisplay card={pile[pile.length - 1]} />
    </motion.div>
  )
}

export default DiscardPile
