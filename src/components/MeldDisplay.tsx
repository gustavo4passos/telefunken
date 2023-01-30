import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Card, MeldID } from '../game/gameState'
import useIsPlayMeld from '../hooks/useIsPlayMeld'
import { useAppDispatch } from '../store/hooks'
import { undoMeld } from '../store/slices/gameDataSlice'
import MeldCardDisplay from './MeldCardDisplay'

interface MeldProps {
  cards: Array<Card>
  meldId: number
  wantsToExtend: boolean
  isPlayerMeld?: boolean
  addMeldRef?: (meldId: MeldID, ref: HTMLDivElement) => void
  removeMeldRef?: (meldId: MeldID) => void
}

// TODO: Verify is meld is player's! Otherwise, the undo button should not be shown, and they can't be extended
const MeldDisplay = ({
  cards,
  meldId,
  wantsToExtend,
  addMeldRef,
  removeMeldRef,
}: MeldProps) => {
  const [showUndo, setShowUndo] = useState(false)
  const dispatch = useAppDispatch()
  const [ref, setRef] = useState<HTMLDivElement | null>(null)
  const isPlayMeld = useIsPlayMeld(meldId)

  useEffect(() => {
    if (ref && meldId != undefined) {
      if (addMeldRef) addMeldRef(meldId, ref)
      return () => {
        if (removeMeldRef) removeMeldRef(meldId)
      }
    }
  }, [ref, dispatch, meldId])

  return (
    <motion.div
      animate={{ scale: wantsToExtend ? 1.1 : 1 }}
      whileHover={{ scale: 1.1 }}
      className="flex relative cursor-pointer"
      onHoverStart={() => setShowUndo(true)}
      onHoverEnd={() => setShowUndo(false)}
      ref={ref => setRef(ref)}
    >
      {isPlayMeld && meldId != undefined && showUndo && (
        <AnimatePresence>
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute left-0 right-0 -top-4 text-white bg-red-500 px-1 py-1 rounded-md hover:bg-red-700 z-10"
            onClick={() => dispatch(undoMeld(meldId))}
          >
            <div className="font-bold tracking-tight">Undo</div>
          </motion.button>
        </AnimatePresence>
      )}
      {cards.map(c => (
        <MeldCardDisplay key={c} card={c} />
      ))}
    </motion.div>
  )
}

export default MeldDisplay
