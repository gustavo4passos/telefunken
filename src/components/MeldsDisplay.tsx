import { Meld } from '../game/gameState'
import MeldDisplay from './MeldDisplay'

interface MeldsDisplayProps {
  melds: Array<Meld>
  vertical?: boolean
  className?: ''
}

const MeldsDisplay = ({ vertical, melds, className }: MeldsDisplayProps) => {
  return (
    <div
      className={`flex p-5 items-center justify-center ${
        vertical ? 'flex-col' : ''
      } ${className ? className : ''}
      }`}
    >
      {melds.map((m, i) => (
        <div key={i} className={`${vertical ? 'mb-4' : 'mr-4'}`}>
          <MeldDisplay cards={m} />
        </div>
      ))}
    </div>
  )
}

export default MeldsDisplay
