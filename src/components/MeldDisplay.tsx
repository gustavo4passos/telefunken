import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useState } from 'react'
import { Card, MeldID, PlayerID } from '../game/gameState'
import useIsPlayMeld from '../hooks/useIsPlayMeld'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import {
  meldHasBeenModified,
  removeMeldModifications,
  setSelectedMeldCard,
  undoMeld,
} from '../store/slices/gameDataSlice'
import MeldCardDisplay from './MeldCardDisplay'

interface MeldProps {
  cards: Array<Card>
  meldId: number
  meldPlayerId: PlayerID
  wantsToExtend: boolean
  isPlayerMeld?: boolean
  addMeldRef?: (meldId: MeldID, playerID: PlayerID, ref: HTMLDivElement) => void
  removeMeldRef?: (playerID: PlayerID, meldId: MeldID) => void
}

// TODO: Verify is meld is player's! Otherwise, the undo button should not be shown, and they can't be extended
const MeldDisplay = ({
  cards,
  meldId,
  wantsToExtend,
  addMeldRef,
  removeMeldRef,
  meldPlayerId,
}: MeldProps) => {
  const dispatch = useAppDispatch()
  const [ref, setRef] = useState<HTMLDivElement | null>(null)
  const isPlayMeld = useIsPlayMeld(meldId, meldPlayerId)
  const hasBeenModified = useAppSelector(state =>
    meldHasBeenModified(state, meldPlayerId, meldId)
  )
  const { selectedMeldCard } = useAppSelector(state => state.gameData)

  useEffect(() => {
    if (ref && meldId != undefined) {
      if (addMeldRef) addMeldRef(meldId, meldPlayerId, ref)
      return () => {
        if (removeMeldRef) removeMeldRef(meldPlayerId, meldId)
      }
    }
  }, [ref, dispatch, meldId])

  const undo = useCallback(() => {
    if (isPlayMeld) {
      dispatch(undoMeld(meldId))
    } else if (hasBeenModified) {
      dispatch(removeMeldModifications({ meldId, playerId: meldPlayerId }))
    }
  }, [meldId, meldPlayerId, isPlayMeld, hasBeenModified, dispatch])

  const selectMeldCard = (selected: boolean, card: Card) => {
    if (selected) dispatch(setSelectedMeldCard({ card: card, meldId }))
    else dispatch(setSelectedMeldCard(undefined))
  }

  const isCardSelected = (card: Card): boolean =>
    selectedMeldCard != undefined &&
    selectedMeldCard.meldId == meldId &&
    selectedMeldCard.card == card

  return (
    <motion.div
      animate={{ scale: wantsToExtend ? 1.1 : 1 }}
      className="flex relative flex-wrap cursor-pointer mb-1"
      ref={ref => setRef(ref)}
    >
      {cards.map(c => (
        <MeldCardDisplay
          key={c}
          card={c}
          onTap={selectMeldCard}
          selected={isCardSelected(c)}
        />
      ))}
      {(isPlayMeld || hasBeenModified) && meldId != undefined && (
        <AnimatePresence>
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full absolute -bottom-3 right-0 text-white bg-red-500 py-[4px] sm:py-1 rounded-md hover:bg-red-700 z-10"
            onClick={() => undo()}
          >
            <div className="font-bold tracking-tight text-xs sm:text-sm">
              Undo
            </div>
          </motion.button>
        </AnimatePresence>
      )}
    </motion.div>
  )
}

export default MeldDisplay
