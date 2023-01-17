interface CardBackProps {
  className?: string
  horizontal?: boolean
}
const CardBack = ({ className, horizontal }: CardBackProps) => {
  return (
    <div
      className={
        `flex flex-col aboslute shadow-md rounded-sm lg:rounded-md bg-gray-400 ${
          horizontal ? 'w-6 h-4 lg:w-10 lg:h-6' : 'w-4 h-6 lg:w-6 lg:h-10'
        } ` + className || ''
      }
    />
  )
}

export default CardBack
