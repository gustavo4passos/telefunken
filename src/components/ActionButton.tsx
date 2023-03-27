import { motion } from 'framer-motion'
import { isValidCombination } from '../game/combinations_any'
import { GameState } from '../game/gameState'
import { canPlayerMeld } from '../game/melds'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import {
  addPlayMeld,
  getCurrentReplacements,
  getMeldUnmeldedReplacements,
  getReplacedCardsInHand,
  getReplacedCardsInMeld,
  getUnmeldedReplacedCards,
  modifyMeld,
} from '../store/slices/gameDataSlice'

const ActionButton = () => {
  const gameData = useAppSelector(state => state.gameData)
  const { selectedCards, playerTurn, playerId, selectedMeldCard, melds } =
    gameData

  const dispatch = useAppDispatch()
  const replacements = getCurrentReplacements(gameData)
  const replacedCardsInHand = getReplacedCardsInHand(gameData)
  const unmeldedReplacedCards = getUnmeldedReplacedCards(
    replacedCardsInHand,
    gameData
  )

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
    // Can replace card in meld if
    // 1. Meld card isn't already a replacement, unless that undoes replace
    // 2. Meld doesn't  have a currently unmelded replaced card
    // 3. Replacement keeps the meld valid
    if (selectedMeldCard == undefined) return false
    if (selectedCards.length != 1) return false

    const { meldId } = selectedMeldCard

    if (replacements[meldId]) {
      // 1. Meld card isn't already a replacement, unless that undoes replace
      const replacedCardsInMeld = getReplacedCardsInMeld(meldId, replacements)
      // Meld Card is replacement
      if (
        replacedCardsInMeld.findIndex(c => c == selectedMeldCard.card) != -1
      ) {
        const replacement = replacements[meldId].find(
          r => r.handToMeld == selectedMeldCard.card
        )
        if (replacement == undefined) {
          throw new Error('Replacement should exist')
        }

        // Card to be switched doesn't undo replacement. Refuse it
        if (replacement.meldToHand != selectedCards[0]) return false
      } else {
        // 2. Meld doesn't have a currently unmelded replaced card
        const unmeldedReplacement = getMeldUnmeldedReplacements(
          meldId,
          replacements,
          unmeldedReplacedCards
        )

        if (unmeldedReplacement.length > 0) {
          return false
        }
      }
    }

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
     text-blue-900 w-16 py-1 z-50 border border-black/50 my-1"
    >
      Meld
    </motion.button>
  ) : (
    <motion.button
      layout
      className="font-bold tracking-tight roundex-xl w-16 bg-transparent border-2 border-info rounded-xl py-1 my-1 \
        select-none text-info"
      onClick={() => replaceMeldCard()}
    >
      {canReplaceMeldCard() ? 'Replace' : '...'}
    </motion.button>
  )
}

export default ActionButton
