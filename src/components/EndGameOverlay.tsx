import { Dialog, Transition } from '@headlessui/react'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/20/solid'
import { AnimatePresence, motion } from 'framer-motion'
import { Fragment, useEffect, useState } from 'react'
import { getCardValue } from '../game/deck'
import {
  DealEndState,
  PlayerID,
  GameState,
  PlayerDealEndState,
} from '../game/gameState'
import { useAppSelector } from '../store/hooks'

interface PlayerScore {
  playerId: PlayerID
  score: number
}

const calculateDealScore = (playerDealEndState: PlayerDealEndState) => {
  let score = 0
  for (const card of playerDealEndState.remainingCards)
    score += getCardValue(card)

  score += playerDealEndState.cardsBought.length * 20

  return score
}

const calculatePlayersScores = (
  playerIds: Array<PlayerID>,
  dealsEndState: Array<DealEndState>
) => {
  const playerScores: Array<PlayerScore> = []

  for (const playerId of playerIds) {
    let score = 0
    for (const des of dealsEndState) {
      for (const c of des[playerId].remainingCards) {
        score += getCardValue(c)
      }
      score += des[playerId].cardsBought.length * 20
    }
    playerScores.push({ playerId, score })
  }

  playerScores.sort((a, b) => {
    if (a.score < b.score) return -1
    if (a.score > b.score) return 1
    else return 0
  })

  return playerScores
}

const EndGameOverlay = () => {
  const { dealsEndState, state, playerOrder } = useAppSelector(
    state => state.gameData
  )
  const [playerScores, setPlayerScores] = useState<Array<PlayerScore>>([])

  const [showScoreDetails, setShowScoreDetails] = useState<
    Record<PlayerID, boolean>
  >({})

  useEffect(() => {
    const showDetails: Record<PlayerID, boolean> = {}
    playerOrder.forEach(p => {
      if (showScoreDetails[p] != undefined) showDetails[p] = showScoreDetails[p]
      else showDetails[p] = false
    })
  }, [playerOrder])

  useEffect(() => {
    if (state == GameState.Finished && playerScores.length == 0)
      setPlayerScores(calculatePlayersScores(playerOrder, dealsEndState))
  }, [state, playerScores, dealsEndState, playerOrder])

  const toggleShowPlayerScore = (player: PlayerID) => {
    setShowScoreDetails(previous => ({
      ...previous,
      [player]: !previous[player],
    }))
  }

  return (
    <Transition appear show={state == GameState.Finished} as={Fragment}>
      <Dialog as="div" open={state == GameState.Finished} onClose={() => false}>
        <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        {state == GameState.Finished && playerScores.length > 0 && (
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div className="fixed inset-0 flex items-center justify-center">
              <Dialog.Panel className="bg-primary px-5 py-5 rounded-md w-[350px] md:w-[600px] border-2 border-solid border-secondary/50">
                <Dialog.Title
                  as="h3"
                  className="text-xl font-medium leading-9 text-gray-900 text-center select-none"
                >
                  Game Results
                </Dialog.Title>
                <div className="flex flex-1 font-bold justify-center items-center select-none text-2xl py-3">
                  <div>{`PLAYER ${playerScores[0].playerId} WON`}</div>
                  <motion.div
                    className="ml-1"
                    animate={{ scale: [1, 1.15, 1], rotate: [0, 5, 0] }}
                    transition={{ repeat: Infinity }}
                  >
                    🎉
                  </motion.div>
                </div>
                <div className="flex flex-col">
                  <div className="flex-1 font-medium text-center text-2xl pb-3 select-none">
                    Scores
                  </div>
                  {playerScores.map(ps => (
                    <div
                      key={ps.playerId}
                      className="flex justify-center flex-col"
                    >
                      <div className="font-bold text-lg flex-1 items-end select-none text-center">
                        Player {ps.playerId}
                      </div>
                      <div className="font-medium text-md flex-1 items-end select-none text-center">
                        {ps.score} Points
                      </div>
                      <motion.button
                        onClick={() => toggleShowPlayerScore(ps.playerId)}
                        className="flex justify-center"
                        animate={{
                          rotate: showScoreDetails[ps.playerId] ? 180 : 0,
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDownIcon className="w-7 h-7" />
                      </motion.button>
                      <div>
                        {showScoreDetails[ps.playerId] && (
                          <AnimatePresence>
                            <motion.div
                              className="flex-1 grid grid-cols-4 text-xs md:text-md gap-y-2 gap-x-2 mt-1 mb-3 select-none \
                          text-center"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                            >
                              <div></div>
                              <div className="font-medium">Cards Left</div>
                              <div className="font-medium">Cards Bought</div>
                              <div className="font-medium">Total</div>
                              {Object.keys(dealsEndState).map(deal => (
                                <>
                                  <div className="font-medium">
                                    Deal {Number(deal) + 1}
                                  </div>
                                  <div>
                                    {
                                      dealsEndState[Number(deal)][ps.playerId]
                                        .remainingCards.length
                                    }
                                  </div>
                                  <div>
                                    {
                                      dealsEndState[Number(deal)][ps.playerId]
                                        .cardsBought.length
                                    }
                                  </div>
                                  <div>
                                    {calculateDealScore(
                                      dealsEndState[Number(deal)][ps.playerId]
                                    )}
                                  </div>
                                </>
                              ))}
                              <div className="font-bold">Final</div>
                              <div></div>
                              <div></div>
                              <div className="select-none">{ps.score}</div>
                            </motion.div>
                          </AnimatePresence>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Dialog.Panel>
            </div>
          </Transition.Child>
        )}
      </Dialog>
    </Transition>
  )
}

export default EndGameOverlay
