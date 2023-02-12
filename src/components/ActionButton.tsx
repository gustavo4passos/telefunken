import { AnimatePresence, motion } from 'framer-motion'
import { isValidCombination } from '../game/combinations'
import { Card, GameState, MeldID } from '../game/gameState'
import { canPlayerMeld } from '../game/melds'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { addPlayMeld, modifyMeld } from '../store/slices/gameDataSlice'

const ActionButton = () => {
  const gameData = useAppSelector(state => state.gameData)
  const { selectedCards, playerTurn, playerId, selectedMeldCard, melds } =
    gameData

  const dispatch = useAppDispatch()

  const dispatchAddPlayMeld = () => {
    dispatch(addPlayMeld())
  }

  const replaceMeldCard = () => {
    if (selectedMeldCard == undefined) return
    if (selectedCards.length != 1) return
    dispatch(
      modifyMeld({
        meldPlayerId: playerId,
        meldId: selectedMeldCard.meldId,
        data: {
          kind: 'replacement',
          handToMeld: selectedCards[0],
          meldToHand: selectedMeldCard.card,
        },
      })
    )
  }

  const canReplaceMeldCard = () => {
    if (selectedMeldCard == undefined) return false
    if (selectedCards.length != 1) return false
    const meld = melds[playerId][selectedMeldCard.meldId]
    const meldCard = selectedMeldCard.card
    return (
      isValidCombination([...meld.filter(c => c != meldCard), selectedCards[0]])
        .length > 0
    )
  }

  if (gameData.state != GameState.InProgress) return <></>
  return selectedCards.length > 0 &&
    playerTurn == playerId &&
    canPlayerMeld(selectedCards, gameData).length > 0 ? (
    <motion.button
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={dispatchAddPlayMeld}
      className="font-bold tracking-tight rounded-xl bg-green-500 hover:bg-green-400 \
                        text-blue-900 w-16 py-1 z-50 border border-black/50"
    >
      Meld
    </motion.button>
  ) : (
    <motion.button
      layout
      className="font-bold tracking-tight roundex-xl w-16 bg-gray-400/50 rounded-xl py-1"
      onClick={() => replaceMeldCard()}
    >
      {canReplaceMeldCard() ? 'Replace' : '...'}
    </motion.button>
  )
}

export default ActionButton
