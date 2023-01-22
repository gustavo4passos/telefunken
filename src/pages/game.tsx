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
  MDealChanged,
  MTurnChanged,
} from '../api/messageTypes'
import CardBack from '../components/CardBack'
import MeldsDisplay, {
  WantsToExtendMeldProps,
} from '../components/MeldsDisplay'
import {
  Card,
  GameState,
  INVALID_GAME_ID,
  Meld,
  MeldID,
  PlayerMove,
} from '../game/gameState'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import {
  gameCreated,
  gameJoined,
  gameStarted,
  getLocalPlayerOrder,
  play,
  playerJoined,
  dealChanged,
  turnChanged,
  addPlayMeld,
  addCardToMeld,
} from '../store/slices/gameDataSlice'
import { AnimatePresence, motion } from 'framer-motion'
import WaitingForPlayers from '../components/WaitingForPlayer'
import { isValidCombination, rankSortFn } from '../game/combinations'
import { UserCircleIcon } from '@heroicons/react/20/solid'
import PlayerCardDisplay from '../components/PlayerCardDisplay'
import DiscardPile from '../components/DiscardPile'
import { doRectsCollide, getBoundingRect } from '../game/helpers'

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
    deal,
    dealConstraints,
    playMelds,
    meldsRects,
    playMeldExtensions,
  } = useAppSelector(state => state.gameData)
  const gameState = state
  const dispatch = useAppDispatch()
  const playerCards = useAppSelector(state => state.gameData.playerCards)
  const inputRef = useRef<HTMLInputElement>(null)
  const localPlayerOrder = useAppSelector(getLocalPlayerOrder)
  const [selectedMeld, setSelectedMeld] = useState<Meld>([])
  const sortedCards = [...playerCards].sort(rankSortFn)
  const discardDivRef = useRef<HTMLDivElement>(null)
  const [wantsToDiscard, setWantsToDiscard] = useState(false)
  const isPlayerTurn = (player: number) =>
    gameState == GameState.InProgress && localPlayerOrder[player] == playerTurn
  const [wantsToExtendMeld, setWantsToExtendMeld] = useState<
    WantsToExtendMeldProps | undefined
  >(undefined)

  useEffect(() => {
    if (ws == undefined)
      ws = new WebSocket(process.env.NEXT_PUBLIC_BACKBONE_ADDRESS || '')
    ws.onopen = () => console.log('Connection opened')
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
        dispatch(turnChanged(m))
      }
      if (message.type == GameMessageType.DealChanged) {
        const m = message as MDealChanged
        dispatch(dealChanged(m))
      }
    }

    ws.onclose = () => {
      console.log('Connection closed')
    }

    ws.onerror = () => {
      console.log('Connection error')
    }
  }, [dispatch])

  const createGame = () => ws?.send(JSON.stringify(MessageBuilder.createGame()))
  const joinGame = (gameId: number) =>
    ws?.send(JSON.stringify(MessageBuilder.joinGame(gameId)))
  const startGame = () =>
    ws?.send(JSON.stringify(MessageBuilder.startGame(playerId, gameId)))

  const sendPlay = (discard: number | null) => {
    if (playerTurn != playerId) return
    const playerMove: PlayerMove = {
      discards: discard,
      melds: playMelds,
      meldExtensions: playMeldExtensions,
    }

    dispatch(play(playerMove))
    console.log('playerMove', playerMove)
    ws?.send(JSON.stringify(MessageBuilder.play(gameId, playerId, playerMove)))
  }

  const dispatchAddPlayMeld = () => {
    console.log('selected meld', selectedMeld)
    console.log('playerCards', playerCards)
    dispatch(addPlayMeld(selectedMeld))
    setSelectedMeld([])
  }

  const onCardTap = (selected: boolean, card: Card) => {
    console.log('selected: ', selected, 'card: ', card)
    console.log('selected: ', selected)
    if (selected) setSelectedMeld(m => [...m, card])
    else setSelectedMeld(m => m.filter(m => m != card))
  }

  const dispatchAddCardToMeld = (meldId: MeldID, card: Card) => {
    dispatch(addCardToMeld({ meldId, card }))
  }

  useEffect(() => {
    if (gameState == GameState.InProgress && playerTurn == playerId) {
      if (playerCards.length == 0) sendPlay(null)
    }
  }, [playerCards])

  return (
    <>
      <Head>
        <title>Telefunken Game</title>
      </Head>
      <div className="flex flex-col min-h-screen w-full bg-gradient-to-b from-primary to-secondary">
        <div className="flex flex-1 flex-col">
          <div className="flex justify-center px-10 py-3">
            <div
              className="flex flex-1 font-bold tracking-tight text-md text-indigo-100 justify-center items-center\ 
            divide-x divide-secondary"
            >
              <div className="px-5 text-info">
                {gameId != INVALID_GAME_ID && `GAME ${gameId}`}
              </div>
              <div className="px-5 text-info">
                {gameState == GameState.InProgress && `DEAL ${deal}`}
              </div>
              <div className="px-5 text-info">
                {gameState == GameState.InProgress &&
                  `${dealConstraints[deal].size} Set${
                    dealConstraints[deal].size > 1 ? 's' : ''
                  } of ${
                    dealConstraints[deal].combinationConstraint.sizeConstraint
                  }`}
              </div>
            </div>
          </div>
          <div
            className={`flex flex-1 flex-col justify-center items-center shadow-inner pt-5 ${
              !isPlayerTurn(2) && 'filter brightness-50'
            }`}
          >
            {Object.keys(players).length > 2 && (
              <>
                <div className="flex items-center justify-center portrait:flex-col text-xl self-center text-info">
                  <div>{'Player 3'}</div>
                  <div>
                    <UserCircleIcon className="w-6 sm:w-8 landscape:ml-2" />
                  </div>
                </div>
                <div className="flex flex-1 justify-center items-center flex-col">
                  <div className="flex flex-row mb-5">
                    {Object.keys(players).length > 2 &&
                      [...Array(otherPlayerCards[localPlayerOrder[2]])].map(
                        i => <CardBack key={i} />
                      )}
                  </div>
                  <MeldsDisplay melds={melds[localPlayerOrder[2]]} />
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-2">
          <div
            className={`flex flex-1 justify-center items-center pr-5 flex-col ${
              !isPlayerTurn(3) && 'filter brightness-50'
            }`}
          >
            {Object.keys(players).length > 3 && (
              <>
                <div className="flex justify-center items-center tracking-tight text-xl py-2 text-info portrait:flex-col">
                  <div>{'Player 4'}</div>
                  <UserCircleIcon className="landscape:ml-2 w-6 sm:w-8" />
                </div>
                <div className="flex flex-1 items-center justify-center">
                  <div className="flex flex-col mr-10">
                    {Object.keys(players).length > 3 &&
                      [...Array(otherPlayerCards[localPlayerOrder[3]])].map(
                        i => <CardBack horizontal key={i} />
                      )}
                  </div>
                  <MeldsDisplay melds={melds[localPlayerOrder[3]]} vertical />
                </div>
              </>
            )}
          </div>
          <div className="flex portrait:flex-1 flex-3 flex-col items-center justify-center">
            {gameState == GameState.Invalid && (
              <input
                ref={inputRef}
                className="shadow border appearance-none rounded w-36 py-2 px-3 mt-2 focus:outline-none\
                 focus:shadow-outline"
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
                      className="bg-accent hover:bg-primary hover:rounded-xl hover:text-white text-secondary py-2 \
                      px-4 rounded-md mt-2 transition-all"
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
                    className="bg-accent hover:bg-primary text-secondary py-2 px-4 rounded mt-2 w-32"
                  >
                    Start Game
                  </button>
                </div>
              )}
              {gameState == GameState.InProgress && discardPile.length > 0 && (
                <div ref={discardDivRef}>
                  <DiscardPile
                    pile={discardPile}
                    wantsToDiscard={wantsToDiscard}
                  />
                </div>
              )}
              <div className="flex flex-col items-baseline m-10"></div>
            </div>
          </div>
          <div
            className={`flex flex-1 items-center justify-center flex-col ${
              !isPlayerTurn(1) && 'filter brightness-50'
            }`}
          >
            {playerOrder.length > 1 && (
              <>
                <div className="flex w-full  items-center justify-center portrait:flex-col text-xl py-2 select-none text-info">
                  <div>{'Player 2'}</div>
                  <UserCircleIcon className="w-6 sm:w-8 landscape:ml-2" />
                </div>
                <div className="flex flex-grow items-center justify-center">
                  <MeldsDisplay melds={melds[localPlayerOrder[1]]} vertical />
                  <div className="flex flex-col items-center ml-3 sm:ml-10">
                    <div className="flex flex-col">
                      {Object.keys(players).length > 1 &&
                        [...Array(otherPlayerCards[localPlayerOrder[1]])].map(
                          i => <CardBack horizontal key={i} />
                        )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        <div
          className={`flex flex-1 flex-col items-center justify-center py-5${
            !isPlayerTurn(0) && 'filter brightness-50'
          }`}
        >
          <AnimatePresence>
            <>
              <MeldsDisplay
                wantsToExtend={wantsToExtendMeld}
                melds={melds[playerId] || []}
                playMelds={playMelds}
              />
              <div className="flex items-center justify-center relative z-30">
                {selectedMeld.length > 0 &&
                  playerTurn == playerId &&
                  isValidCombination(selectedMeld) && (
                    <AnimatePresence>
                      <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={dispatchAddPlayMeld}
                        className="font-bold tracking-tight rounded-xl bg-green-500 hover:bg-green-400 \
                        text-blue-900 w-16 py-1 absolute -top-2 z-50"
                      >
                        Meld
                      </motion.button>
                    </AnimatePresence>
                  )}
                <div className="flex flex-1 flex-wrap items-center justify-center px-3">
                  {[
                    sortedCards.map(c => (
                      <motion.div
                        key={c}
                        initial={{ y: -200 }}
                        animate={{ x: 0, y: 0 }}
                        transition={{ duration: 2 }}
                        className={'py-5 mt-5'}
                      >
                        <PlayerCardDisplay
                          card={c}
                          onTap={onCardTap}
                          onDrag={(s, r) => {
                            for (const mrid of Object.keys(meldsRects)) {
                              const meldId = Number(mrid)
                              const rect = meldsRects[meldId]
                              if (doRectsCollide(r, rect)) {
                                console.log('collides with meld', meldId)
                                if (
                                  wantsToExtendMeld &&
                                  wantsToExtendMeld.meldId == meldId
                                )
                                  return
                                setWantsToExtendMeld({
                                  meldId,
                                  isPlayMeld: false,
                                })
                                return
                              }
                            }

                            if (wantsToExtendMeld != undefined)
                              setWantsToExtendMeld(undefined)

                            if (!discardDivRef || !discardDivRef.current) return

                            const discardDivRect = getBoundingRect(
                              discardDivRef.current
                            )

                            if (doRectsCollide(discardDivRect, r))
                              setWantsToDiscard(true)
                            else setWantsToDiscard(false)
                          }}
                          onDragEnd={(selected, card, r) => {
                            for (const mrid of Object.keys(meldsRects)) {
                              const meldId = Number(mrid)
                              const rect = meldsRects[meldId]
                              if (doRectsCollide(r, rect)) {
                                dispatchAddCardToMeld(meldId, card)
                                return
                              }
                            }

                            if (!discardDivRef.current) return
                            setWantsToDiscard(false)
                            const discardDivRect = getBoundingRect(
                              discardDivRef.current
                            )

                            if (doRectsCollide(discardDivRect, r))
                              sendPlay(card)
                          }}
                        />
                      </motion.div>
                    )),
                  ]}
                </div>
              </div>
            </>
          </AnimatePresence>
        </div>
      </div>
    </>
  )
}

export default Game
