import { Dialog, Transition } from '@headlessui/react'
import { Fragment, useEffect, useState } from 'react'
import { getCardValue } from '../game/deck'
import { DealEndState, PlayerID, GameState } from '../game/gameState'
import { useAppSelector } from '../store/hooks'

interface PlayerScore {
  playerId: PlayerID
  score: number
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

  useEffect(() => {
    if (state == GameState.Finished && playerScores.length == 0)
      setPlayerScores(calculatePlayersScores(playerOrder, dealsEndState))
  }, [state, playerScores, dealsEndState, playerOrder])

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
              <Dialog.Panel className="bg-primary px-10 py-10 rounded-md w-80 border-2 border-solid border-secondary/50">
                <Dialog.Title
                  as="h3"
                  className="text-xl font-medium leading-9 text-gray-900 text-center select-none"
                >
                  Game Results
                </Dialog.Title>
                <div className="flex flex-1 font-bold justify-center items-center select-none text-2xl py-3">
                  {`PLAYER ${playerScores[0].playerId} WON 🎉`}
                </div>
                <div className="flex flex-col">
                  <div className="flex-1 font-medium text-center text-2xl pb-3 select-none">
                    Scores
                  </div>
                  {playerScores.map(ps => (
                    <div key={ps.playerId} className="flex justify-center">
                      <div className="font-medium text-lg flex-1 items-end select-none">
                        Player {ps.playerId}
                      </div>
                      <div className="text-lg flex-1 text-end select-none">
                        {ps.score}
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
