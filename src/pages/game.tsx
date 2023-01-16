import Head from 'next/head'
import { useEffect, useRef, useState } from 'react'
import MessageBuilder from '../api/messageBuilder'
import {
  GameMessage,
  GameMessageType,
  MGameCreated,
  MGameJoined,
  MGameStarted,
  MPlayerJoined,
  MTurnChanged,
} from '../api/messageTypes'
import CardDisplay from '../components/CardDisplay'
import CardBack from '../components/CardBack'
import MeldsDisplay from '../components/MeldsDisplay'
import {
  Card,
  GameState,
  INVALID_GAME_ID,
  Meld,
  PlayerMove,
} from '../game/gameState'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import {
  addMeld,
  gameCreated,
  gameJoined,
  gameStarted,
  getLocalPlayerOrder,
  play,
  playerJoined,
  turnChanged,
} from '../store/slices/gameDataSlice'
import { AnimatePresence, motion } from 'framer-motion'
import WaitingForPlayers from '../components/WaitingForPlayer'
import { isValidCombination, rankSortFn } from '../game/sets'
import { Cog8ToothIcon } from '@heroicons/react/20/solid'

let ws: WebSocket | undefined = undefined

const Game = () => {
  const {
    state,
    players,
    playerId,
    gameId,
    playerTurn,
    discardPile,
    otherPlayerCards,
    playerOrder,
    melds,
  } = useAppSelector(state => state.gameData)
  const gameState = state
  const playerCards = useAppSelector(state => state.gameData.playerCards)
  const dispatch = useAppDispatch()
  const inputRef = useRef<HTMLInputElement>(null)
  const localPlayerOrder = useAppSelector(getLocalPlayerOrder)
  const playMelds = useRef<Array<Meld>>([])
  const [selectedMeld, setSelectedMeld] = useState<Array<Card>>([])
  const sortedCards = [...playerCards].sort(rankSortFn)

  useEffect(() => {
    if (ws == undefined)
      ws = new WebSocket('wss://telefunken-backend.onrender.com')
    ws.onmessage = conn => {
      const message = JSON.parse(conn.data) as GameMessage
      if (message.type == GameMessageType.GameCreated) {
        const gameCreatedMessage = message as MGameCreated
        dispatch(gameCreated(gameCreatedMessage.gameData))
      }
      if (message.type == GameMessageType.GameJoined) {
        const m = message as MGameJoined
        dispatch(gameJoined(m.gameData))
      }
      if (message.type == GameMessageType.PlayerJoined) {
        const playerJoinedMessage = message as MPlayerJoined
        dispatch(playerJoined(playerJoinedMessage))
      }
      if (message.type == GameMessageType.GameStarted) {
        const m = message as MGameStarted
        dispatch(gameStarted(m.gameData))
      }
      if (message.type == GameMessageType.TurnChanged) {
        const m = message as MTurnChanged
        dispatch(turnChanged(m.gameData))
      }
    }
  }, [dispatch])

  const createGame = () => ws?.send(JSON.stringify(MessageBuilder.createGame()))
  const joinGame = (gameId: number) =>
    ws?.send(JSON.stringify(MessageBuilder.joinGame(gameId)))
  const startGame = () =>
    ws?.send(JSON.stringify(MessageBuilder.startGame(playerId, gameId)))

  const sendPlay = (discard: number) => {
    if (playerTurn != playerId) return
    const playerMove: PlayerMove = {
      discards: discard,
      melds: playMelds.current,
    }
    dispatch(play(playerMove))
    ws?.send(JSON.stringify(MessageBuilder.play(gameId, playerId, playerMove)))
    playMelds.current = []
  }

  const dispatchAddMeld = () => {
    dispatch(addMeld(selectedMeld))
    playMelds.current.push(selectedMeld)
    setSelectedMeld([])
  }

  const onCardTap = (selected: boolean, card: Card) => {
    if (selected) setSelectedMeld(m => [...m, card])
    else setSelectedMeld(m => m.filter(m => m != card))
  }

  return (
    <>
      <Head>
        <title>Telefunken Game</title>
      </Head>
      <div className="flex flex-col min-h-screen w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
        <div className="flex flex-1 flex-col ">
          <div className="flex justify-center px-10 py-2 bg-gradient-to-t from-indigo-700 to-indigo-900">
            <div className="flex-1"></div>
            <div className="flex-1 font-bold tracking-tight text-md text-indigo-200 text-center">
              {gameId != INVALID_GAME_ID && `GAME ${gameId}`}
            </div>
            <button className="flex flex-1 items-center justify-end">
              <Cog8ToothIcon className="w-6 text-indigo-200" />
            </button>
          </div>
          <div className="flex flex-1 flex-col justify-center items-center shadow-inner">
            {Object.keys(players).length > 2 && (
              <>
                <div className="flex font-bold text-xl self-center">
                  {'Player 3'}
                </div>
                <div className="flex flex-1 justify-center items-center ">
                  <div className="flex flex-row">
                    {Object.keys(players).length > 2 &&
                      [...Array(otherPlayerCards[localPlayerOrder[2]])].map(
                        i => <CardBack className="ml-2" key={i} />
                      )}
                  </div>
                </div>
                <MeldsDisplay melds={melds[localPlayerOrder[2]]} />
              </>
            )}
          </div>
        </div>
        <div className="flex flex-2">
          <div className="flex flex-1 justify-center items-center flex-col">
            {Object.keys(players).length > 3 && (
              <>
                <div className="flex font-bold tracking-tight text-xl py-2">
                  {'Player 4'}
                </div>
                <div className="flex flex-1 items-center justify-center">
                  <div className="flex flex-col mr-10">
                    {Object.keys(players).length > 3 &&
                      [...Array(otherPlayerCards[localPlayerOrder[3]])].map(
                        i => <CardBack className="mb-2 h-8 w-11" key={i} />
                      )}
                  </div>
                  <MeldsDisplay melds={melds[localPlayerOrder[3]]} vertical />
                </div>
              </>
            )}
          </div>
          <div
            className="flex flex-3 flex-col items-center justify-center"
            id="papapa"
          >
            {gameState == GameState.Invalid && (
              <input
                ref={inputRef}
                className="shadow border appearance-none rounded w-36 py-2 px-3 mt-2 focus:outline-none focus:shadow-outline"
                placeholder="Room ID"
              />
            )}
            <div className="flex flex-col">
              {gameState == GameState.Invalid &&
                [
                  [
                    createGame,
                    'Create Game',
                    () => gameState == GameState.Invalid,
                  ],
                  [
                    () =>
                      inputRef.current != null &&
                      joinGame(Number(inputRef.current.value)),
                    'Join Game',
                    () => gameState == GameState.Invalid,
                  ],
                ].map(([fn, t, cond], i: number) =>
                  (cond as () => boolean)() ? (
                    <button
                      key={i as number}
                      onClick={fn as () => void}
                      className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded mt-2"
                    >
                      {t as string}
                    </button>
                  ) : (
                    <></>
                  )
                )}
              {gameState == GameState.WaitingForPlayers && (
                <div className="flex flex-col flex-1 items-center justify-center">
                  <div className="flex flex-1 mb-10">
                    <WaitingForPlayers />
                  </div>
                  <button
                    onClick={startGame}
                    className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded mt-2 w-32"
                  >
                    Start Game
                  </button>
                </div>
              )}
              {gameState == GameState.InProgress && discardPile.length > 0 && (
                <CardDisplay
                  card={discardPile[discardPile.length - 1]}
                  className="w-36 h-48"
                />
              )}
              <div className="flex flex-col items-baseline m-10"></div>
            </div>
          </div>
          <div className="flex flex-1 items-center justify-center flex-col">
            {playerOrder.length > 1 && (
              <>
                <div
                  className={`font-bold tracking-tight text-xl py-2 ${
                    localPlayerOrder[1] == playerTurn && 'text-white'
                  }`}
                >
                  {'Player 2'}
                </div>
                <div className="flex flex-grow items-center justify-center px-3">
                  <MeldsDisplay melds={melds[localPlayerOrder[1]]} vertical />
                  <div className="flex flex-col items-center ml-10">
                    <div className="flex flex-col">
                      {Object.keys(players).length > 1 &&
                        [...Array(otherPlayerCards[localPlayerOrder[1]])].map(
                          i => <CardBack className="mb-2 h-8 w-11" key={i} />
                        )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-1 relative">
          {gameState == GameState.InProgress && playerTurn == playerId && (
            <motion.div
              className="bg-green-300 absolute inset-0 blur-lg -top-5"
              animate={{
                translateY: [0, -15, 0],
                opacity: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 2,
                ease: 'easeInOut',
                repeat: Infinity,
                repeatDelay: 0,
              }}
            />
          )}
          <div className="flex flex-1 flex-col bg-gradient-to-b from-purple-500 to-pink-900 items-center relative">
            <MeldsDisplay melds={melds[playerId] || []} />
            <div className="flex flex-2 items-center justify-center relative">
              {selectedMeld.length > 0 &&
                playerTurn == playerId &&
                isValidCombination(selectedMeld) && (
                  <AnimatePresence>
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={dispatchAddMeld}
                      className="font-bold tracking-tight rounded-xl bg-green-500 hover:bg-green-400 text-blue-900 w-16 py-1 absolute top-0"
                    >
                      Meld
                    </motion.button>
                  </AnimatePresence>
                )}
              {[
                sortedCards.map(c => (
                  <motion.div
                    key={c}
                    initial={{ translateY: '-50%' }}
                    animate={{ translateY: 0 }}
                    transition={{ duration: 2 }}
                  >
                    <CardDisplay
                      className="mr-2 w-20 h-28"
                      card={c}
                      onTap={onCardTap}
                      onDragEnd={(selected, card) => {
                        if (!selected) sendPlay(card)
                      }}
                    />
                  </motion.div>
                )),
              ]}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Game
