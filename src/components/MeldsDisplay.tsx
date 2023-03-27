import { Meld, MeldID, PlayerID } from '../game/gameState'
import { useAppDispatch } from '../store/hooks'
import MeldDisplay from './MeldDisplay'

export interface WantsToExtendMeldProps {
  playerId: PlayerID
  meldId: MeldID
  isValid: boolean
}

interface MeldsDisplayProps {
  melds: Array<Meld>
  vertical?: boolean
  wantsToExtend?: WantsToExtendMeldProps
  addMeldRef?: (meldId: MeldID, playerId: PlayerID, ref: HTMLDivElement) => void
  removeMeldRef?: (playerId: PlayerID, meldId: MeldID) => void
  meldPlayerId: PlayerID
}

const MeldsDisplay = ({
  vertical,
  melds,
  wantsToExtend,
  addMeldRef,
  removeMeldRef,
  meldPlayerId,
}: MeldsDisplayProps) => {
  return (
    <div
      className={`flex items-center justify-center ${
        vertical ? 'flex-col mx-3 sm:mx-3' : 'mt-2 mb-2 '
      }`}
    >
      {melds.map((m, i) => (
        <div
          key={i}
          className={`${
            vertical
              ? 'mt-[8px] sm:mt-4 first:mt-0'
              : 'ml-[15px] sm:ml-4 first:ml-0'
          }`}
        >
          <MeldDisplay
            wantsToExtend={
              wantsToExtend != undefined &&
              wantsToExtend.isValid &&
              wantsToExtend.meldId == i &&
              wantsToExtend.playerId == meldPlayerId
            }
            cards={m}
            meldId={i}
            addMeldRef={addMeldRef}
            removeMeldRef={removeMeldRef}
            meldPlayerId={meldPlayerId}
          />
        </div>
      ))}
    </div>
  )
}

export default MeldsDisplay
