import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '..'
import {
  MPlayerJoined,
  MDealChanged,
  MTurnChanged,
  MCardBought,
  MGameEnded,
} from '../../api/messageTypes'
import {
  GameData,
  GameState,
  INVALID_PLAYER_ID,
  INVALID_GAME_ID,
  INVALID_DEAL,
  PlayerMove,
  PlayerID,
  Meld,
  MeldID,
  Card,
} from '../../game/gameState'
import { HTMLDivElementForRect } from '../../game/helpers'

export enum AnimationStatus {
  HideDestinationRequested,
  HideDestinationReady,
  HideOrigin,
}

export interface PlayerDiscardAnimation {
  playerId: PlayerID
  animationStatus: AnimationStatus
  card: Card
}

// TODO: Instead of extending GameData it would be more clear if the state
// actually has a field gameData where all the client game data goes
export interface GameDataState extends GameData {
  playMelds: Array<Meld>
  playMeldExtensions: Record<MeldID, Array<Card>>
  meldsRefs: Record<MeldID, HTMLDivElementForRect>
  playerDrawAnimation: AnimationStatus
  dealStartAnimation: AnimationStatus
  playerBoughAnimation: AnimationStatus
  playerDiscardAnimation: PlayerDiscardAnimation
}

const initialState: GameDataState = {
  gameId: INVALID_PLAYER_ID,
  playerId: INVALID_GAME_ID,
  state: GameState.Invalid,
  playerCards: [],
  players: {},
  deal: INVALID_DEAL,
  playerTurn: INVALID_PLAYER_ID,
  melds: {},
  playerOrder: [],
  discardPile: [],
  otherPlayerCards: {},
  dealConstraintCompliance: [],
  dealConstraints: [],
  playMelds: [],
  meldsRefs: {},
  playMeldExtensions: {},
  boughtThisRound: false,
  dealsEndState: [],
  isOwner: false,
  playerDrawAnimation: AnimationStatus.HideDestinationRequested,
  dealStartAnimation: AnimationStatus.HideDestinationRequested,
  playerBoughAnimation: AnimationStatus.HideDestinationRequested,
  playerDiscardAnimation: {
    playerId: INVALID_PLAYER_ID,
    animationStatus: AnimationStatus.HideOrigin,
    card: 0,
  },
}

export const gameDataSlice = createSlice({
  name: 'gameState',
  initialState,
  reducers: {
    createGame: state => {
      state.state = GameState.WaitingForPlayers
    },
    gameStarted: (state, payload: PayloadAction<GameData>) => {
      return {
        ...state,
        ...payload.payload,
      }
    },
    playerJoined: (state, payload: PayloadAction<MPlayerJoined>) => {
      state.players[payload.payload.player.id] = payload.payload.player
      state.melds[payload.payload.player.id] = []
      state.playerOrder = payload.payload.playerOrder
    },
    gameCreated: (state, payload: PayloadAction<GameData>) => {
      return { ...state, ...payload.payload }
    },
    gameJoined: (state, payload: PayloadAction<GameData | undefined>) => {
      if (!payload.payload) return state
      return { ...state, ...payload.payload }
    },
    turnChanged: (state, payload: PayloadAction<MTurnChanged>) => {
      // Current player will be the one who discard the card which, in the next state,
      // will be on top of the discard pile
      const topDiscardIndex = payload.payload.gameData.discardPile.length - 1
      const discardAnimationStatus =
        state.playerId == state.playerTurn
          ? AnimationStatus.HideOrigin
          : AnimationStatus.HideDestinationRequested
      const playerDiscardAnimation = {
        playerId: state.playerTurn,
        animationStatus: discardAnimationStatus,
        card: payload.payload.gameData.discardPile[topDiscardIndex],
      }

      const isPlayerTurn = payload.payload.gameData.playerTurn == state.playerId
      // If it's local player turn, request the draw animation
      const animationStatus = isPlayerTurn
        ? AnimationStatus.HideDestinationRequested
        : state.playerDrawAnimation
      return {
        ...state,
        ...payload.payload.gameData,
        playerDrawAnimation: animationStatus,
        playerDiscardAnimation,
      }
    },
    dealChanged: (state, payload: PayloadAction<MDealChanged>) => {
      return { ...state, ...payload.payload.gameData }
    },
    setPlayerId: (state, payload: PayloadAction<PlayerID>) => {
      state.playerId = payload.payload
    },
    play: (state, payload: PayloadAction<PlayerMove>) => {
      if (payload.payload.discards != null) {
        state.playerCards = state.playerCards.filter(
          p => p != payload.payload.discards
        )
      }

      state.playMelds = []
      state.playMeldExtensions = {}
    },
    addPlayMeld: (state, payload: PayloadAction<Meld>) => {
      state.playMelds.push(payload.payload)

      state.playerCards = state.playerCards.filter(
        c => payload.payload.indexOf(c) == -1
      )

      state.melds[state.playerId] = [
        ...state.melds[state.playerId],
        payload.payload,
      ]
    },
    addCardToMeld: (
      state,
      payload: PayloadAction<{ meldId: MeldID; card: Card }>
    ) => {
      const playMeldStart = getPlayMeldStart(state)
      // If meld is actually a play meld, just add card to the meld
      if (payload.payload.meldId >= playMeldStart) {
        const playMeldId = payload.payload.meldId - playMeldStart
        state.playMelds[playMeldId].push(payload.payload.card)
      }
      // Otherwise, add playMeldExtension
      else {
        if (state.playMeldExtensions[payload.payload.meldId] == undefined)
          state.playMeldExtensions[payload.payload.meldId] = []

        state.playMeldExtensions[payload.payload.meldId].push(
          payload.payload.card
        )
      }

      state.melds[state.playerId][payload.payload.meldId].push(
        payload.payload.card
      )

      state.playerCards = state.playerCards.filter(
        c => c != payload.payload.card
      )
    },
    undoMeld: (state, payload: PayloadAction<MeldID>) => {
      state.playerCards = [
        ...state.playerCards,
        ...state.melds[state.playerId][payload.payload],
      ]

      // Remove play meld that will be sent to the server
      const playMeldStart = getPlayMeldStart(state)
      // sanity check
      // TODO: Remove me after testing
      if (playMeldStart >= state.melds[state.playerId].length) {
        throw new Error('Fatal Error: Removing meld is not valid.')
      }
      // Remove meld from optimistically added meld
      state.melds[state.playerId] = state.melds[state.playerId].filter(
        (m, i) => i != payload.payload
      )

      state.playMelds.splice(payload.payload - playMeldStart, 1)
    },
    addMeld: (state, payload: PayloadAction<Meld>) => {
      state.melds[state.playerId] = [
        ...state.melds[state.playerId],
        payload.payload,
      ]

      state.playerCards = state.playerCards.filter(
        c => payload.payload.find(mc => mc == c) == undefined
      )
    },
    buyCard: state => {
      state.playerCards.push(state.discardPile.splice(-1)[0])
    },
    gameEnded: (state, payload: PayloadAction<MGameEnded>) => {
      return { ...state, ...payload.payload.gameData }
    },
    onBuyCardResponse: (state, payload: PayloadAction<MCardBought>) => {
      // TODO: Is it assured that, when card is bought successfully, discard pile is the same as it was
      // when the request was sent?
      // Local player bought the card
      if (payload.payload.playerId == state.playerId) {
        state.boughtThisRound = payload.payload.gameData.boughtThisRound
        if (!payload.payload.success) {
          state.playerCards = state.playerCards.filter(
            c => c != payload.payload.card
          )
          state.discardPile = payload.payload.gameData.discardPile
        } else {
          // This will never be null when local player bought the card, but typescript does not know that
          if (payload.payload.cardDrawn != null) {
            state.playerCards.push(payload.payload.cardDrawn)
            state.playerDrawAnimation = AnimationStatus.HideDestinationRequested
          }
        }
      }
      // Somebody else bought a card, so their hand and the discard pile changed
      else {
        state.playerCards = payload.payload.gameData.playerCards
        state.discardPile = payload.payload.gameData.discardPile
      }
    },
    setDealStartAnimation: (state, payload: PayloadAction<AnimationStatus>) => {
      state.playerDrawAnimation = payload.payload
    },
    setDiscardAnimation: (
      state,
      payload: PayloadAction<PlayerDiscardAnimation>
    ) => {
      // Only set it if the player id being requested is the same as the current one
      if (state.playerDiscardAnimation.playerId == payload.payload.playerId) {
        state.playerDiscardAnimation = payload.payload
      }
    },
  },
})

export const getPlayMeldStart = (state: GameDataState) => {
  const playerId = state.playerId
  return state.melds[playerId].length - state.playMelds.length
}

export const getPlayerOrder = (state: RootState) =>
  state.gameData.playerOrder.findIndex(p => p == state.gameData.playerId)

export const getLocalPlayerOrder = (state: RootState): Array<PlayerID> => {
  if (state.gameData.playerOrder.length == 0) return []

  const nPlayers = state.gameData.playerOrder.length
  const playerOrder = getPlayerOrder(state)
  const localPlayerOrder = [state.gameData.playerId]
  for (let i = 1; i < nPlayers; i++)
    localPlayerOrder.push(
      state.gameData.playerOrder[(playerOrder + i) % nPlayers]
    )

  return localPlayerOrder
}

export const {
  createGame,
  setPlayerId,
  gameCreated,
  gameJoined,
  playerJoined,
  gameStarted,
  play,
  turnChanged,
  gameEnded,
  addMeld,
  dealChanged,
  addPlayMeld,
  undoMeld,
  addCardToMeld,
  buyCard,
  onBuyCardResponse,
  setDealStartAnimation,
  setDiscardAnimation,
} = gameDataSlice.actions
export default gameDataSlice.reducer
