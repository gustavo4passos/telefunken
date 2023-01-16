import { motion } from 'framer-motion'

const WaitingForPlayers = () => {
  return (
    <>
      <motion.div
        animate={{
          color: [
            '#ffffff',
            '#ffffff',
            'rgb(134 239 172)',
            'rgb(134 239 172)',
            '#ffffff',
          ],
        }}
        transition={{
          duration: 2,
          ease: 'easeInOut',
          times: [0, 0.2, 0.5, 0.8, 1],
          repeat: Infinity,
          repeatDelay: 1,
        }}
        className="font-bold text-white text-xl mr-5"
      >
        Waiting for Players
      </motion.div>
      <motion.div
        animate={{
          scale: [2, 2, 3, 5, 2],
          rotate: [0, 0, 180, 360, 360],
          color: [
            '#ffffff',
            '#ffffff',
            'rgb(134 239 172)',
            'rgb(134 239 172)',
            '#ffffff',
          ],
        }}
        transition={{
          duration: 2,
          ease: 'easeInOut',
          times: [0, 0.2, 0.5, 0.8, 1],
          repeat: Infinity,
          repeatDelay: 1,
        }}
        className="flex text-center items-center"
      >
        ♦
      </motion.div>
    </>
  )
}

export default WaitingForPlayers
