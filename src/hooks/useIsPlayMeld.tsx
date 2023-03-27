import { MeldID, PlayerID } from '../game/gameState'
import { useAppSelector } from '../store/hooks'

const useIsPlayMeld = (meldId: MeldID, meldPlayerId: PlayerID) => {
  const { playMelds, melds, playerId } = useAppSelector(state => state.gameData)
  const playMeldStart = melds[playerId].length - playMelds.length

  return meldId >= playMeldStart && playerId == meldPlayerId
}

export default useIsPlayMeld
