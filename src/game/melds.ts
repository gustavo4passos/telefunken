import { isValidCombination } from './combinations_any'
import { GameData, isFirstDealTurn, Meld } from './gameState'

export const canPlayerMeld = (meld: Meld, gameData: GameData) => {
  if (isFirstDealTurn(gameData)) return []
  return isValidCombination(meld)
}
