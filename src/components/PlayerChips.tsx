import { motion } from 'framer-motion'

interface PlayerChipsProps {
  count: number
  vertical?: boolean
}

const PlayerChips = ({ count, vertical }: PlayerChipsProps) => {
  return (
    <motion.div
      layout
      className={`flex items-center ${vertical ? 'flex-col mx-2' : 'my-2'}`}
    >
      {[...Array(count)].map((e, i) => (
        <motion.div
          key={i.toString()}
          className={`bg-red-400 w-[10px] h-[10px] rounded-full shadow-md border border-info/20 ${
            vertical ? 'mt-2 first:mt-0' : 'ml-2 first:ml-0 '
          }`}
        />
      ))}
    </motion.div>
  )
}

export default PlayerChips
