import { Meld, MeldID } from '../game/gameState'
import MeldDisplay from './MeldDisplay'

export interface WantsToExtendMeldProps {
  meldId: MeldID
  isPlayMeld: boolean
}

interface MeldsDisplayProps {
  melds: Array<Meld>
  playMelds?: Array<Meld>
  vertical?: boolean
  className?: ''
  wantsToExtend?: WantsToExtendMeldProps
}

const MeldsDisplay = ({
  vertical,
  melds,
  playMelds,
  className,
  wantsToExtend,
}: MeldsDisplayProps) => {
  return (
    <div
      className={`flex items-center justify-center ${
        vertical ? 'flex-col' : ''
      } ${className ? className : ''}
      }`}
    >
      {melds.map((m, i) => (
        <div key={i} className={`${vertical ? 'mb-4' : 'mr-4'}`}>
          <MeldDisplay
            wantsToExtend={
              wantsToExtend != undefined &&
              !wantsToExtend.isPlayMeld &&
              wantsToExtend.meldId == i
            }
            cards={m}
            meldId={i}
            isPlayMeld={false}
          />
        </div>
      ))}
      {playMelds &&
        playMelds.map((m, i) => (
          <div key={`play-${i}`} className={`${vertical ? 'mb-4' : 'mr-4'}`}>
            <MeldDisplay
              wantsToExtend={
                wantsToExtend != undefined &&
                wantsToExtend.isPlayMeld &&
                wantsToExtend.meldId == i
              }
              isPlayMeld
              meldId={i}
              cards={m}
            />
          </div>
        ))}
    </div>
  )
}

export default MeldsDisplay
