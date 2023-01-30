import Head from 'next/head'
import { useCallback, useEffect, useRef, useState } from 'react'
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
  MCardBought,
  MGameEnded,
} from '../api/messageTypes'
import MeldsDisplay, {
  WantsToExtendMeldProps,
} from '../components/MeldsDisplay'
import {
  Card,
  GameState,
  INVALID_GAME_ID,
  INVALID_PLAYER_ID,
  Meld,
  MeldID,
  PlayerID,
  PlayerMove,
} from '../game/gameState'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import * as GameDataSlice from '../store/slices/gameDataSlice'
import { AnimatePresence, motion } from 'framer-motion'
import WaitingForPlayers from '../components/WaitingForPlayer'
import {
  CanMeldStatus,
  isValidCombination,
  rankSortFn,
} from '../game/combinations'
import { UserCircleIcon } from '@heroicons/react/20/solid'
import PlayerCardDisplay from '../components/PlayerCardDisplay'
import DiscardPile from '../components/DiscardPile'
import {
  doRectsCollide,
  getBoundingRect,
  getMeldCollision,
} from '../game/helpers'
import DrawPile from '../components/DrawPile'
import useCanMeldThisTurn from '../hooks/useCanMeldThisTurn'
import EndGameOverlay from '../components/EndGameOverlay'
import {
  getLocalStoragePlayerId,
  setLocalStoragePlayerId,
} from '../utils/storage'
import { getCardValue } from '../game/deck'
import { AnimationStatus } from '../store/slices/gameDataSlice'
import RemotePlayerCardsDisplay from '../components/RemotePlayerCardsDisplay'

let ws: WebSocket | undefined = undefined

enum PlayerPositionSlot {
  Right = 1,
  Top = 2,
  Left = 3,
}

const getPlayerIdAtSlotFromPlayerOrder = (
  slot: PlayerPositionSlot,
  localPlayerOrder: Array<PlayerID>
): PlayerID | null => {
  switch (slot) {
    case PlayerPositionSlot.Right: {
      if (localPlayerOrder.length <= 2) return null
      return localPlayerOrder[1]
    }
    case PlayerPositionSlot.Top: {
      if (localPlayerOrder.length < 2) return null
      if (localPlayerOrder.length == 2) return localPlayerOrder[1]
      return localPlayerOrder[2]
    }
    case PlayerPositionSlot.Left: {
      if (localPlayerOrder.length < 4) return null
      return localPlayerOrder[3]
    }

    default:
      return null
  }
}

const getHandScore = (hand: Array<Card>) =>
  hand.reduce((p, c) => p + getCardValue(c), 0)

const meldsRefs: Record<MeldID, HTMLDivElement> = {}

const addMeldRef = (meldId: MeldID, ref: HTMLDivElement) => {
  meldsRefs[meldId] = ref
}
const removeMeldRef = (meldId: MeldID) => {
  delete meldsRefs[meldId]
}

const Game = () => {
  const {
    state,
    playerId,
    gameId,
    playerTurn,
    discardPile,
    otherPlayerCards,
    melds,
    deal,
    dealConstraints,
    playMelds,
    meldsRefs,
    playMeldExtensions,
    boughtThisRound,
    isOwner,
    playerDrawAnimation,
  } = useAppSelector(state => state.gameData)
  const gameState = state
  const dispatch = useAppDispatch()
  const playerCards = useAppSelector(state => state.gameData.playerCards)
  const inputRef = useRef<HTMLInputElement>(null)
  const localPlayerOrder = useAppSelector(GameDataSlice.getLocalPlayerOrder)
  const [selectedMeld, setSelectedMeld] = useState<Meld>([])
  const sortedCards = [...playerCards].sort(rankSortFn)
  const discardDivRef = useRef<HTMLDivElement>(null)
  const [wantsToDiscard, setWantsToDiscard] = useState(false)
  const [displayCardsValue, setDisplayCardsValue] = useState(false)
  const isPlayerTurn = (playerId: PlayerID | null) =>
    gameState == GameState.InProgress &&
    playerId != null &&
    playerId == playerTurn

  const isPlayerTurnAtSlot = (slot: PlayerPositionSlot) => {
    const playerIdAtSlot = getPlayerIdAtSlotFromPlayerOrder(
      slot,
      localPlayerOrder
    )

    if (playerIdAtSlot == null) return false
    return playerIdAtSlot == playerTurn
  }

  const getPlayerIdAtSlot = (slot: PlayerPositionSlot) =>
    getPlayerIdAtSlotFromPlayerOrder(slot, localPlayerOrder)

  const [wantsToExtendMeld, setWantsToExtendMeld] = useState<
    WantsToExtendMeldProps | undefined
  >(undefined)
  const canMeldThisTurn = useCanMeldThisTurn()
  const playerMelds = useAppSelector(
    state => state.gameData.melds[state.gameData.playerId]
  )

  useEffect(() => {
    if (playerId == INVALID_PLAYER_ID) {
      const localStoragePlayerId = getLocalStoragePlayerId()
      if (localStoragePlayerId != null)
        dispatch(GameDataSlice.setPlayerId(localStoragePlayerId))
    }
    if (ws == undefined)
      ws = new WebSocket(process.env.NEXT_PUBLIC_BACKBONE_ADDRESS || '')

    ws.onopen = () => console.log('Connection opened')
    ws.onmessage = conn => {
      const message = JSON.parse(conn.data) as GameMessage
      if (message.type == GameMessageType.GameCreated) {
        const m = message as MGameCreated
        // Write player id back to storage anyway in case the value stored was not valid
        setLocalStoragePlayerId(m.gameData.playerId)
        dispatch(GameDataSlice.gameCreated(m.gameData))
      }
      if (message.type == GameMessageType.GameJoined) {
        const m = message as MGameJoined
        // Write player id back to storage anyway in case the value stored was not valid
        setLocalStoragePlayerId(m.gameData.playerId)
        dispatch(GameDataSlice.gameJoined(m.gameData))
      }
      if (message.type == GameMessageType.PlayerJoined) {
        const playerJoinedMessage = message as MPlayerJoined
        dispatch(GameDataSlice.playerJoined(playerJoinedMessage))
      }
      if (message.type == GameMessageType.GameStarted) {
        const m = message as MGameStarted
        console.log('GOt a game started message', m)
        dispatch(GameDataSlice.gameStarted(m.gameData))
      }
      if (message.type == GameMessageType.TurnChanged) {
        const m = message as MTurnChanged
        dispatch(GameDataSlice.turnChanged(m))
      }
      if (message.type == GameMessageType.DealChanged) {
        const m = message as MDealChanged
        dispatch(GameDataSlice.dealChanged(m))
      }
      if (message.type == GameMessageType.CardBought) {
        dispatch(GameDataSlice.onBuyCardResponse(message as MCardBought))
      }
      if (message.type == GameMessageType.GameEnded) {
        const m = message as MGameEnded
        dispatch(GameDataSlice.gameEnded(m))
      }
    }

    ws.onclose = () => {
      console.log('Connection closed')
    }

    ws.onerror = () => {
      console.log('Connection error')
    }
  }, [dispatch, playerId])

  const createGame = () =>
    ws?.send(
      JSON.stringify(
        MessageBuilder.createGame(
          playerId != INVALID_PLAYER_ID ? playerId : undefined
        )
      )
    )

  const joinGame = (gameId: number) =>
    ws?.send(
      JSON.stringify(
        MessageBuilder.joinGame(
          gameId,
          playerId != INVALID_GAME_ID ? playerId : undefined
        )
      )
    )

  const startGame = () =>
    ws?.send(JSON.stringify(MessageBuilder.startGame(playerId, gameId)))

  const sendPlay = useCallback(
    (discard: number | null) => {
      if (playerTurn != playerId) return
      const playerMove: PlayerMove = {
        discards: discard,
        melds: playMelds,
        meldExtensions: playMeldExtensions,
      }

      dispatch(GameDataSlice.play(playerMove))
      console.log('playerMove', playerMove)
      ws?.send(
        JSON.stringify(MessageBuilder.play(gameId, playerId, playerMove))
      )
    },
    [dispatch, gameId, playerTurn, playerId, playMeldExtensions, playMelds]
  )

  const dispatchAddPlayMeld = () => {
    console.log('selected meld', selectedMeld)
    console.log('playerCards', playerCards)
    dispatch(GameDataSlice.addPlayMeld(selectedMeld))
    setSelectedMeld([])

    // Adding meld leaves player with no cards, so sendpl ay
    if (playerCards.length == selectedMeld.length) sendPlay(null)
  }

  const onCardTap = (selected: boolean, card: Card) => {
    console.log('selected: ', selected, 'card: ', card)
    console.log('selected: ', selected)
    if (selected) setSelectedMeld(m => [...m, card])
    else setSelectedMeld(m => m.filter(m => m != card))
  }

  const dispatchBuyCard = () => {
    if (boughtThisRound) return
    ws?.send(
      JSON.stringify(
        MessageBuilder.buyCard(
          playerId,
          discardPile[discardPile.length - 1],
          gameId
        )
      )
    )
    dispatch(GameDataSlice.buyCard())
  }

  const dispatchAddCardToMeld = (meldId: MeldID, card: Card) => {
    dispatch(GameDataSlice.addCardToMeld({ meldId, card }))
  }

  const playerDrawAnimationShouldHideCard = (card: Card) => {
    if (card != playerCards[playerCards.length - 1]) return false
    if (playerDrawAnimation != AnimationStatus.HideOrigin) return true
    return false
  }

  const leftSlotPlayer = getPlayerIdAtSlot(PlayerPositionSlot.Left)
  const rightSlotPlayer = getPlayerIdAtSlot(PlayerPositionSlot.Right)
  const topSlotPlayer = getPlayerIdAtSlot(PlayerPositionSlot.Top)

  return (
    <>
      <Head>
        <title>Telefunken Game</title>
      </Head>
      <div className="flex flex-col min-h-screen w-full bg-gradient-to-b from-primary to-secondary">
        <EndGameOverlay />
        <div className="flex flex-1 flex-col">
          <div className="flex justify-center py-3">
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
            key="player-top"
            className={`flex flex-1 flex-col justify-center items-center shadow-inner pt-5 ${
              !isPlayerTurnAtSlot(PlayerPositionSlot.Top) &&
              'filter brightness-50'
            }`}
          >
            {topSlotPlayer != null && (
              <>
                <motion.div
                  animate={
                    isPlayerTurnAtSlot(PlayerPositionSlot.Top)
                      ? {
                          opacity: [1, 0.5, 1],
                        }
                      : { opacity: 1 }
                  }
                  transition={{ repeat: Infinity }}
                  className="flex items-center justify-center portrait:flex-col md:text-md xl:text-xl self-center text-info mb-1"
                >
                  <div className="select-none">{`Player ${getPlayerIdAtSlot(
                    PlayerPositionSlot.Top
                  )}`}</div>
                  <div>
                    <UserCircleIcon className="w-6 sm:w-6 landscape:ml-2" />
                  </div>
                </motion.div>
                <div className="flex flex-1 justify-center items-center flex-col">
                  <RemotePlayerCardsDisplay
                    horizontal
                    playerId={topSlotPlayer}
                    nCards={otherPlayerCards[topSlotPlayer]}
                  />
                  <MeldsDisplay melds={melds[topSlotPlayer]} />
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-2">
          <div
            key="player-left"
            className={`flex flex-1 justify-center items-center pr-5 flex-col ${
              !isPlayerTurnAtSlot(PlayerPositionSlot.Left) &&
              'filter brightness-50'
            }`}
          >
            {leftSlotPlayer != null && (
              <>
                <motion.div
                  animate={
                    isPlayerTurnAtSlot(PlayerPositionSlot.Left)
                      ? {
                          opacity: [1, 0.5, 1],
                        }
                      : { opacity: 1 }
                  }
                  transition={{ repeat: Infinity }}
                  className="flex justify-center items-center tracking-tight md:text-md xl:text-xl py-2 text-info portrait:flex-col"
                >
                  <div className="select-none">{`Player ${leftSlotPlayer}`}</div>
                  <UserCircleIcon className="w-6 sm:w-6 landscape:ml-2" />
                </motion.div>
                <div className="flex flex-1 items-center justify-center">
                  <RemotePlayerCardsDisplay
                    playerId={leftSlotPlayer}
                    nCards={otherPlayerCards[leftSlotPlayer]}
                  />
                  <div className="flex flex-col items-center ml-3 sm:ml-10">
                    <MeldsDisplay vertical melds={melds[leftSlotPlayer]} />
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="flex portrait:flex-1 flex-3 flex-col items-center justify-center bg-blue-10">
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
                  {isOwner && (
                    <button
                      onClick={startGame}
                      className="bg-accent hover:bg-primary text-secondary py-2 px-4 rounded mt-2 w-32"
                    >
                      Start Game
                    </button>
                  )}
                </div>
              )}
              {gameState == GameState.InProgress && (
                <div className="flex portrait:flex-col">
                  <DrawPile pile={[0, 1, 2]} />
                  <div
                    ref={discardDivRef}
                    className="landscape: landscape:ml-2 portrait:mt-2 landscape:md:ml-5 portrait:md:mt-5"
                  >
                    <DiscardPile
                      onBuyCard={dispatchBuyCard}
                      pile={discardPile}
                      wantsToDiscard={wantsToDiscard}
                      canDiscard={
                        canMeldThisTurn == CanMeldStatus.Success ||
                        playMelds.length == 0
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          <div
            key="player-right"
            className={`flex flex-1 items-center justify-center flex-col ${
              !isPlayerTurnAtSlot(PlayerPositionSlot.Right) &&
              'filter brightness-50'
            }`}
          >
            {rightSlotPlayer && (
              <>
                <motion.div
                  animate={
                    isPlayerTurnAtSlot(PlayerPositionSlot.Right)
                      ? {
                          opacity: [1, 0.5, 1],
                        }
                      : { opacity: 1 }
                  }
                  transition={{ repeat: Infinity }}
                  className="flex w-full items-center justify-center portrait:flex-col py-2 select-none md:text-md xl:text-xl text-info"
                >
                  <div className="select-none">{`Player ${rightSlotPlayer}`}</div>
                  <UserCircleIcon className="w-6 sm:w-6 landscape:ml-2" />
                </motion.div>
                <div className="flex flex-grow items-center justify-center">
                  <MeldsDisplay melds={melds[localPlayerOrder[1]]} vertical />
                  <div className="flex flex-col items-center ml-3 sm:ml-10">
                    <RemotePlayerCardsDisplay
                      playerId={rightSlotPlayer}
                      nCards={otherPlayerCards[rightSlotPlayer]}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        <div
          key="main-player"
          className={`flex flex-1 flex-col items-center justify-center${
            !isPlayerTurn(playerId) && 'filter brightness-50'
          }`}
        >
          <>
            <MeldsDisplay
              wantsToExtend={wantsToExtendMeld}
              melds={playerMelds || []}
              addMeldRef={addMeldRef}
              removeMeldRef={removeMeldRef}
            />
            <div className="flex items-center justify-center relative z-30 flex-col">
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
              <div className="flex flex-wrap items-center justify-center mx-3">
                {[
                  sortedCards.map(
                    c =>
                      !playerDrawAnimationShouldHideCard(c) && (
                        <motion.div
                          layout="position"
                          layoutId={c.toString()}
                          key={c.toString()}
                          transition={{ duration: 2 }}
                          className="sm:py-5 -ml-[20px] first:-ml-0 sm:-ml-1 md:-ml-5 lg:-ml-[40px] my-1"
                        >
                          <PlayerCardDisplay
                            displayValue={displayCardsValue}
                            card={c}
                            onTap={onCardTap}
                            onDrag={(s, r) => {
                              for (const mrid of Object.keys(meldsRefs)) {
                                const meldId = Number(mrid)
                                const meldRef = meldsRefs[meldId]
                                const rect = getBoundingRect(meldRef)

                                if (doRectsCollide(r, rect)) {
                                  if (
                                    wantsToExtendMeld &&
                                    wantsToExtendMeld.meldId == meldId
                                  )
                                    return
                                  setWantsToExtendMeld({
                                    meldId,
                                  })
                                  return
                                }
                              }

                              if (wantsToExtendMeld != undefined)
                                setWantsToExtendMeld(undefined)

                              if (!discardDivRef || !discardDivRef.current)
                                return

                              const discardDivRect = getBoundingRect(
                                discardDivRef.current
                              )

                              if (doRectsCollide(discardDivRect, r))
                                setWantsToDiscard(true)
                              else setWantsToDiscard(false)
                            }}
                            onDragEnd={(selected, card, r) => {
                              const meldCollisionId = getMeldCollision(
                                r,
                                meldsRefs
                              )
                              if (meldCollisionId != null) {
                                dispatchAddCardToMeld(meldCollisionId, card)
                              }

                              if (!discardDivRef.current) return
                              setWantsToDiscard(false)
                              const discardDivRect = getBoundingRect(
                                discardDivRef.current
                              )

                              if (doRectsCollide(discardDivRect, r)) {
                                if (playMelds.length == 0 || canMeldThisTurn) {
                                  setSelectedMeld([])
                                  sendPlay(card)
                                }
                              }
                            }}
                          />
                        </motion.div>
                      )
                  ),
                ]}
              </div>
              {gameState == GameState.InProgress && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setDisplayCardsValue(s => !s)}
                  className={`font-medium font-serif text-info border rounded-md px-2 select-none mt-2 tracking-tight \
                  hover:bg-info hover:text-primary transition-all ${
                    displayCardsValue
                      ? ' bg-info text-primary '
                      : ' border-info '
                  }`}
                >
                  {getHandScore(playerCards)} points
                </motion.button>
              )}
            </div>
          </>
        </div>
      </div>
    </>
  )
}

export default Game
