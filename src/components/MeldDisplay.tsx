import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Card } from '../game/gameState'
import { getBoundingRect } from '../game/helpers'
import { useAppDispatch } from '../store/hooks'
import {
  addMeldRect,
  removeMeldRect,
  undoMeld,
} from '../store/slices/gameDataSlice'
import MeldCardDisplay from './MeldCardDisplay'

interface MeldProps {
  cards: Array<Card>
  isPlayMeld?: boolean
  meldId?: number
  wantsToExtend: boolean
}
const MeldDisplay = ({
  cards,
  isPlayMeld,
  meldId,
  wantsToExtend,
}: MeldProps) => {
  const [showUndo, setShowUndo] = useState(true)
  const dispatch = useAppDispatch()
  const [ref, setRef] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    if (ref && meldId != undefined && !isPlayMeld) {
      dispatch(addMeldRect({ meldId, rect: getBoundingRect(ref) }))
      return () => {
        dispatch(removeMeldRect(meldId))
      }
    }
  }, [ref, dispatch, meldId, isPlayMeld])

  return (
    <motion.div
      animate={{ scale: wantsToExtend ? 1.1 : 1 }}
      whileHover={{ scale: 1.1 }}
      className="flex relative p-2"
      onHoverStart={() => setShowUndo(true)}
      onHoverEnd={() => setShowUndo(false)}
      ref={ref => setRef(ref)}
    >
      {isPlayMeld && meldId != undefined && showUndo && (
        <AnimatePresence>
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute left-0 right-0 -top-4 text-white bg-red-500 px-2 py-1 rounded-md hover:bg-red-700 "
            onClick={() => dispatch(undoMeld(meldId))}
          >
            <div className="font-bold tracking-tight">Undo</div>
          </motion.button>
        </AnimatePresence>
      )}
      {cards.map((c, i) => (
        <MeldCardDisplay key={i} card={c} />
      ))}
    </motion.div>
  )
}

export default MeldDisplay
