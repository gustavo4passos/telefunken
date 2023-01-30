import { useEffect, useState } from 'react'
import { MeldID } from '../game/gameState'
import { useAppSelector } from '../store/hooks'

const useIsPlayMeld = (meldId: MeldID) => {
  const { playMelds } = useAppSelector(state => state.gameData)
  const melds = useAppSelector(
    state => state.gameData.melds[state.gameData.playerId]
  )
  const [isPlayMeld, setIsPlayMeld] = useState(false)

  useEffect(() => {
    const playMeldStart = melds.length - playMelds.length
    if (meldId >= playMeldStart) setIsPlayMeld(true)
    else setIsPlayMeld(false)
  }, [melds, playMelds, meldId, setIsPlayMeld])

  return isPlayMeld
}

export default useIsPlayMeld
