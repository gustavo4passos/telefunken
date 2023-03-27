import Image from 'next/image'

interface CardBackProps {
  horizontal?: boolean
}
const CardBack = ({ horizontal }: CardBackProps) => {
  return (
    <div
      className={`flex relative border-solid border-black border shadow-md rounded-sm lg:rounded-md \
        select-none bg-cardBack ${
          horizontal
            ? '-mt-2 md:-mt-2 lg:-mt-4 w-6 h-4 lg:w-12 lg:h-8 first:mt-0'
            : '-ml-2 md:-ml-2 lg:-ml-4 w-4 h-6 lg:w-8 lg:h-12 first:ml-0'
        } `}
    >
      <Image
        fill
        src={
          horizontal ? '/card-back-horizontal.svg' : '/card-back-vertical.svg'
        }
        alt="Card back"
        draggable={false}
      />
    </div>
  )
}

export default CardBack
