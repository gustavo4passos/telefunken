interface CardBackProps {
  className?: string
}
const CardBack = ({ className }: CardBackProps) => {
  return (
    <div
      className={
        'flex flex-col aboslute p-2 w-8 h-11 shadow-md rounded-md bg-gray-400 ' +
          className || ''
      }
    />
  )
}

export default CardBack
