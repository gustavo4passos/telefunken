import { Meld, MeldID } from '../game/gameState'
import MeldDisplay from './MeldDisplay'

export interface WantsToExtendMeldProps {
  meldId: MeldID
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
        vertical ? 'flex-col' : ''
      }`}
    >
      {melds.map((m, i) => (
        <div
          key={i}
          className={`${vertical ? 'mb-[8px] sm:mb-4' : 'mr-[8px] sm:mr-4'}`}
        >
          <MeldDisplay
            wantsToExtend={
              wantsToExtend != undefined && wantsToExtend.meldId == i
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
