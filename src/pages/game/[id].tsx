import Head from 'next/head'
import { useCallback, useEffect, useRef, useState } from 'react'
import MessageBuilder from '../../api/messageBuilder'
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
  MPlayFailed,
} from '../../api/messageTypes'
import MeldsDisplay, {
  WantsToExtendMeldProps,
} from '../../components/MeldsDisplay'
import {
  Card,
  GameState,
  INVALID_GAME_ID,
  MeldID,
  PlayerID,
  PlayerMove,
} from '../../game/gameState'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import * as GameDataSlice from '../../store/slices/gameDataSlice'
import { motion } from 'framer-motion'
import WaitingForPlayers from '../../components/WaitingForPlayer'
import {
  CanMeldStatus,
  isValidExtension,
  rankSortFn,
} from '../../game/combinations_any'
import { UserCircleIcon } from '@heroicons/react/20/solid'
import PlayerCardDisplay, {
  CardStatus,
} from '../../components/PlayerCardDisplay'
import DiscardPile from '../../components/DiscardPile'
import {
  doRectsCollide,
  getBoundingRect,
  getPlayerMeldCollision,
} from '../../game/helpers'
import DrawPile from '../../components/DrawPile'
import useCanMeldThisTurn from '../../hooks/useCanMeldThisTurn'
import EndGameOverlay from '../../components/EndGameOverlay'
import {
  getLocalStoragePlayerId,
  setLocalStoragePlayerId,
} from '../../utils/storage'
import { CardRank, getCardRank, getCardValue, isJoker } from '../../game/deck'
import { AnimationStatus } from '../../store/slices/gameDataSlice'
import RemotePlayerCardsDisplay from '../../components/RemotePlayerCardsDisplay'
import PlayerChips from '../../components/PlayerChips'
import ActionButton from '../../components/ActionButton'
import { useRouter } from 'next/router'
import * as Connection from '../../api/connection'

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

const meldsRefs: Record<PlayerID, Record<MeldID, HTMLDivElement>> = {}

const addMeldRef = (
  meldId: MeldID,
  playerId: PlayerID,
  ref: HTMLDivElement
) => {
  if (meldsRefs[playerId] == undefined) meldsRefs[playerId] = {}
  meldsRefs[playerId][meldId] = ref
}
const removeMeldRef = (playerId: PlayerID, meldId: MeldID) => {
  if (meldsRefs[playerId]) delete meldsRefs[playerId][meldId]
}

const Game = () => {
  const gameData = useAppSelector(state => state.gameData)
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
    boughtThisRound,
    isOwner,
    playerDrawAnimation,
    playerChips,
    selectedCards,
    cardDrawnThisTurn,
    meldModifications,
  } = gameData
  const router = useRouter()
  const gameState = state
  const dispatch = useAppDispatch()
  const playerCards = useAppSelector(state => state.gameData.playerCards)
  const localPlayerOrder = useAppSelector(GameDataSlice.getLocalPlayerOrder)
  const sortedCards = [...playerCards].sort(rankSortFn)
  const discardDivRef = useRef<HTMLDivElement>(null)
  const [wantsToDiscard, setWantsToDiscard] = useState(false)
  const [displayCardsValue, setDisplayCardsValue] = useState(false)
  const isPlayerTurn = (playerId: PlayerID | null) =>
    gameState == GameState.InProgress &&
    playerId != null &&
    playerId == playerTurn

  const replacedCardsInHand = GameDataSlice.getReplacedCardsInHand(gameData)
  const unmeldedReplacedCards = GameDataSlice.getUnmeldedReplacedCards(
    replacedCardsInHand,
    gameData
  )

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

  const canPlayerDiscard = (card: Card) => {
    if (canMeldThisTurn != CanMeldStatus.Success) return false

    // Only let player discard twos and jokers if they have no other type of cards in their hand
    if (isJoker(card) || getCardRank(card) == CardRank.Two) {
      for (const pc of playerCards) {
        if (!isJoker(pc) && getCardRank(pc) != CardRank.Two) return false
      }
    }

    return true
  }

  const playerMelds = useAppSelector(
    state => state.gameData.melds[state.gameData.playerId]
  )

  // Join a game
  useEffect(() => {
    if (!router.isReady) return
    const { id } = router.query
    if (gameId != INVALID_GAME_ID) return
    // Reaching this page without a game id is equal to joining a game
    // If there's a local player saved, just use it to join the game
    // otherwise, create a new one
    const localStoragePlayerId = getLocalStoragePlayerId()

    if (Connection.ws == undefined)
      Connection.setWs(
        new WebSocket(process.env.NEXT_PUBLIC_BACKBONE_ADDRESS || '')
      )

    if (Connection.ws == undefined) return

    Connection.ws.onopen = () => {
      Connection.ws?.send(
        JSON.stringify(
          MessageBuilder.joinGame(
            Number(id),
            localStoragePlayerId != null ? localStoragePlayerId : undefined
          )
        )
      )
    }

    Connection.ws.onmessage = conn => {
      console.log('message arrived')
      const message = JSON.parse(conn.data) as GameMessage
      if (message.type == GameMessageType.GameJoined) {
        const m = message as MGameJoined
        // Write player id back to storage anyway in case the value stored was not valid
        setLocalStoragePlayerId(m.gameData.playerId)
        dispatch(GameDataSlice.gameJoined(m.gameData))
      }
    }
  }, [gameId, dispatch, router.isReady])

  useEffect(() => {
    if (Connection.ws == undefined) return
    if (gameId == INVALID_GAME_ID) return

    if (Connection.ws == undefined)
      Connection.setWs(
        new WebSocket(process.env.NEXT_PUBLIC_BACKBONE_ADDRESS || '')
      )

    Connection.ws.onopen = () => console.log('Connection opened')
    Connection.ws.onmessage = conn => {
      const message = JSON.parse(conn.data) as GameMessage
      if (message.type == GameMessageType.GameCreated) {
        const m = message as MGameCreated
        // Write player id back to storage anyway in case the value stored was not valid
        setLocalStoragePlayerId(m.gameData.playerId)
        dispatch(GameDataSlice.gameCreated(m.gameData))
      }

      if (message.type == GameMessageType.PlayerJoined) {
        const playerJoinedMessage = message as MPlayerJoined
        dispatch(GameDataSlice.playerJoined(playerJoinedMessage))
      }
      if (message.type == GameMessageType.GameStarted) {
        const m = message as MGameStarted
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
      if (message.type == GameMessageType.PlayFailed) {
        const m = message as MPlayFailed
        dispatch(GameDataSlice.playFailed(m))
      }
    }

    Connection.ws.onclose = () => {
      console.log('Connection closed')
    }

    Connection.ws.onerror = () => {
      console.log('Connection error')
    }
  }, [dispatch, playerId, gameId])

  const startGame = () =>
    Connection.ws?.send(
      JSON.stringify(MessageBuilder.startGame(playerId, gameId))
    )

  const sendPlay = useCallback(
    (discard: number | null) => {
      if (playerTurn != playerId) return
      const playerMove: PlayerMove = {
        discards: discard,
        melds: playMelds,
        meldModifications,
      }

      dispatch(GameDataSlice.play(playerMove))
      Connection.ws?.send(
        JSON.stringify(MessageBuilder.play(gameId, playerId, playerMove))
      )
    },
    [dispatch, gameId, playerTurn, playerId, playMelds, meldModifications]
  )

  const onSelectCard = (selected: boolean, card: Card) => {
    if (selected) dispatch(GameDataSlice.selectCard(card))
    else dispatch(GameDataSlice.unselectCard(card))
  }

  useEffect(() => {
    // Player melded and have no more cards
    if (
      playerCards.length == 0 &&
      (playMelds.length > 0 || meldModifications.length > 0)
    ) {
      sendPlay(null)
    }
  }, [playerCards, playMelds])

  const dispatchBuyCard = () => {
    if (boughtThisRound) return
    if (playerChips[playerId] < 1) return
    Connection.ws?.send(
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

  const dispatchAddCardToMeld = (
    meldPlayerId: PlayerID,
    meldId: MeldID,
    card: Card
  ) => {
    dispatch(
      GameDataSlice.modifyMeld({
        meldPlayerId,
        meldId,
        data: {
          kind: 'extension',
          card,
        },
      })
    )
  }

  const playerDrawAnimationShouldHideCard = (card: Card) => {
    if (card != playerCards[playerCards.length - 1]) return false
    if (playerDrawAnimation != AnimationStatus.HideOrigin) return true
    return false
  }

  const getCardStatus = (card: Card): CardStatus => {
    if (unmeldedReplacedCards.findIndex(c => c == card) != -1)
      return CardStatus.ReplacedButUnmelded
    if (card == cardDrawnThisTurn) return CardStatus.DrawnThisTurn

    return CardStatus.Normal
  }

  const leftSlotPlayer = getPlayerIdAtSlot(PlayerPositionSlot.Left)
  const rightSlotPlayer = getPlayerIdAtSlot(PlayerPositionSlot.Right)
  const topSlotPlayer = getPlayerIdAtSlot(PlayerPositionSlot.Top)

  return (
    <>
      <Head>
        <title>Telefunken Game</title>
      </Head>
      <div className="flex flex-col min-h-screen w-full bg-gradient-to-b from-slate-800 to-slate-700">
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
                {gameState == GameState.InProgress && `DEAL ${deal + 1}`}
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
                  <MeldsDisplay
                    addMeldRef={addMeldRef}
                    melds={melds[topSlotPlayer]}
                    meldPlayerId={topSlotPlayer}
                    wantsToExtend={wantsToExtendMeld}
                  />
                  <PlayerChips count={playerChips[topSlotPlayer]} />
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
                  <div className="flex flex-col items-center">
                    <MeldsDisplay
                      vertical
                      addMeldRef={addMeldRef}
                      melds={melds[leftSlotPlayer]}
                      meldPlayerId={leftSlotPlayer}
                      wantsToExtend={wantsToExtendMeld}
                    />
                  </div>
                  <PlayerChips count={playerChips[leftSlotPlayer]} vertical />
                </div>
              </>
            )}
          </div>
          <div className="flex portrait:flex-1 flex-3 flex-col items-center justify-center bg-blue-10">
            <div className="flex flex-col">
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
                      canDiscard={canMeldThisTurn == CanMeldStatus.Success}
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
                  <PlayerChips count={playerChips[rightSlotPlayer]} vertical />
                  <MeldsDisplay
                    addMeldRef={addMeldRef}
                    melds={melds[localPlayerOrder[1]]}
                    meldPlayerId={rightSlotPlayer}
                    wantsToExtend={wantsToExtendMeld}
                    vertical
                  />
                  <div className="flex flex-col items-center">
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
            {gameState == GameState.InProgress && (
              <PlayerChips count={playerChips[playerId]} />
            )}
            <MeldsDisplay
              wantsToExtend={wantsToExtendMeld}
              melds={playerMelds || []}
              meldPlayerId={playerId}
              addMeldRef={addMeldRef}
              removeMeldRef={removeMeldRef}
            />
            <div className="flex items-center justify-center relative z-30 flex-col">
              <ActionButton />
              <div className="flex flex-wrap items-center justify-center mx-3">
                {[
                  sortedCards.map(
                    c =>
                      !playerDrawAnimationShouldHideCard(c) && (
                        <motion.div
                          layout="position"
                          layoutId={c.toString()}
                          key={c.toString()}
                          transition={{ duration: 3 }}
                          className="sm:py-5 -ml-[20px] first:-ml-0 sm:-ml-1 md:-ml-5 lg:-ml-[40px] my-1 select-none"
                        >
                          <PlayerCardDisplay
                            cardStatus={getCardStatus(c)}
                            displayValue={displayCardsValue}
                            card={c}
                            selected={
                              selectedCards.findIndex(card => card == c) != -1
                            }
                            setSelected={(selected: boolean) => {
                              onSelectCard(selected, c)
                            }}
                            isPlayerTurn={playerId == playerTurn}
                            onDrag={(s, r) => {
                              for (const pids in meldsRefs) {
                                const pid = Number(pids)
                                for (const mrid in meldsRefs[pid]) {
                                  const meldId = Number(mrid)
                                  const meldRef = meldsRefs[pid][meldId]
                                  const rect = getBoundingRect(meldRef)

                                  if (doRectsCollide(r, rect)) {
                                    if (
                                      wantsToExtendMeld &&
                                      wantsToExtendMeld.meldId == meldId &&
                                      wantsToExtendMeld.playerId == pid
                                    )
                                      return

                                    // Don't allow meld replacemenet cards to extend meld
                                    if (
                                      getCardStatus(c) !=
                                        CardStatus.ReplacedButUnmelded &&
                                      isValidExtension(melds[pid][meldId], [c])
                                        .length > 0
                                    ) {
                                      setWantsToExtendMeld({
                                        meldId,
                                        isValid: true,
                                        playerId: pid,
                                      })
                                    } else {
                                      setWantsToExtendMeld({
                                        meldId,
                                        isValid: false,
                                        playerId: pid,
                                      })
                                    }
                                  }
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
                                setWantsToDiscard(canPlayerDiscard(c))
                              else setWantsToDiscard(false)
                            }}
                            onDragEnd={(selected, card, r) => {
                              const [meldPlayerId, meldCollisionId] =
                                getPlayerMeldCollision(r, meldsRefs)
                              if (meldCollisionId != null) {
                                // TODO: onDrag already determines if extension is valid. It shouldn't be called again
                                if (
                                  getCardStatus(c) !=
                                    CardStatus.ReplacedButUnmelded &&
                                  isValidExtension(
                                    melds[meldPlayerId][meldCollisionId],
                                    [c]
                                  ).length > 0
                                )
                                  dispatchAddCardToMeld(
                                    meldPlayerId,
                                    meldCollisionId,
                                    card
                                  )
                              }

                              setWantsToDiscard(false)
                              if (!discardDivRef.current) return
                              setWantsToDiscard(canPlayerDiscard(card))
                              const discardDivRect = getBoundingRect(
                                discardDivRef.current
                              )

                              if (doRectsCollide(discardDivRect, r)) {
                                if (canPlayerDiscard(card)) {
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
