import Image from 'next/image'

interface CardBackProps {
  className?: string
  horizontal?: boolean
}
const CardBack = ({ className, horizontal }: CardBackProps) => {
  return (
    <div
      className={
        `flex relative border-solid border-black border shadow-md rounded-sm lg:rounded-md bg-gray-400 ${
          horizontal
            ? '-mt-2 md:-mt-2 lg:-mt-4 w-6 h-4 lg:w-12 lg:h-8 '
            : '-mr-2 md:-mr-2 lg:-mr-4 w-4 h-6 lg:w-8 lg:h-12 '
        } ` + className || ''
      }
    >
      <Image
        fill
        src={horizontal ? 'card-back-horizontal.svg' : 'card-back-vertical.svg'}
        alt="Card back"
        className={`${horizontal ? 'rotate-90 ' : ''}`}
      />
    </div>
  )
}

export default CardBack
