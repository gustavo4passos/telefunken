import { Meld, MeldID } from '../game/gameState'
import { useAppDispatch } from '../store/hooks'
import MeldDisplay from './MeldDisplay'

export interface WantsToExtendMeldProps {
  meldId: MeldID
  isValid: boolean
}

interface MeldsDisplayProps {
  melds: Array<Meld>
  vertical?: boolean
  wantsToExtend?: WantsToExtendMeldProps
  addMeldRef?: (meldId: MeldID, ref: HTMLDivElement) => void
  removeMeldRef?: (meldId: MeldID) => void
}

const MeldsDisplay = ({
  vertical,
  melds,
  wantsToExtend,
  addMeldRef,
  removeMeldRef,
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
              wantsToExtend.meldId == i
            }
            cards={m}
            meldId={i}
            addMeldRef={addMeldRef}
            removeMeldRef={removeMeldRef}
          />
        </div>
      ))}
    </div>
  )
}

export default MeldsDisplay
