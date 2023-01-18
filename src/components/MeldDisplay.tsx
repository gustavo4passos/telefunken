import { Card } from '../game/gameState'
import CardDisplay from './CardDisplay'

interface MeldProps {
  cards: Array<Card>
}
const MeldDisplay = ({ cards }: MeldProps) => {
  return (
    <div className="flex">
      {cards.map((c, i) => (
        <CardDisplay key={i} card={c} className=" w-12 h-14 lg:w-10 lg:h-16" />
      ))}
    </div>
  )
}

export default MeldDisplay
