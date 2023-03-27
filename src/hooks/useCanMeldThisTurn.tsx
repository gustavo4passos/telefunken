import { useEffect, useState } from 'react'
import {
  CanMeldStatus,
  doMeldsSatisfyDealConstraint,
} from '../game/combinations'
import { GameState } from '../game/gameState'
import { useAppSelector } from '../store/hooks'

const useCanMeldThisTurn = (): CanMeldStatus => {
  const [canMeldStatus, setCanMeldStatus] = useState(CanMeldStatus.Success)
  const { dealConstraints, playMelds, dealConstraintCompliance, deal, state } =
    useAppSelector(state => state.gameData)

  useEffect(() => {
    if (state != GameState.InProgress) setCanMeldStatus(CanMeldStatus.Invalid)
    else if (dealConstraintCompliance[deal])
      setCanMeldStatus(CanMeldStatus.Success)
    else if (playMelds.length == 0)
      setCanMeldStatus(CanMeldStatus.Success) // It's always valid not to meld
    else
      setCanMeldStatus(
        doMeldsSatisfyDealConstraint(playMelds, dealConstraints[deal])
      )
  }, [playMelds, dealConstraintCompliance, deal, dealConstraints, state])

  return canMeldStatus
}

export default useCanMeldThisTurn
