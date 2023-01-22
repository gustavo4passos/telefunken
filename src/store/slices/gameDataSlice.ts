import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '..'
import {
  MPlayerJoined,
  MDealChanged,
  MTurnChanged,
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

export interface GameDataState extends GameData {
  playMelds: Array<Meld>
  playMeldExtensions: Record<MeldID, Array<Card>>
  meldsRects: Record<MeldID, DOMRect>
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
  meldsRects: {},
  playMeldExtensions: {},
}

export const gameDataSlice = createSlice({
  name: 'gameState',
  initialState,
  reducers: {
    createGame: state => {
      state.state = GameState.WaitingForPlayers
    },
    gameStarted: (state, payload: PayloadAction<GameData>) => {
      return { ...state, ...payload.payload }
    },
    playerJoined: (state, payload: PayloadAction<MPlayerJoined>) => {
      state.players[payload.payload.player.id] = payload.payload.player
      state.melds[payload.payload.player.id] = []
      state.playerOrder = payload.payload.playerOrder
    },
    gameCreated: (state, payload: PayloadAction<GameData>) => {
      return { ...state, ...payload.payload }
    },
    gameJoined: (state, payload: PayloadAction<GameData>) => {
      return { ...state, ...payload.payload }
    },
    turnChanged: (state, payload: PayloadAction<MTurnChanged>) => {
      return { ...state, ...payload.payload.gameData }
    },
    dealChanged: (state, payload: PayloadAction<MDealChanged>) => {
      return { ...state, ...payload.payload.gameData }
    },
    play: (state, payload: PayloadAction<PlayerMove>) => {
      if (payload.payload.discards != null) {
        state.playerCards = state.playerCards.filter(
          p => p != payload.payload.discards
        )
      }
      payload.payload.melds.forEach(m => {
        state.playerCards = state.playerCards.filter(
          c => m.find(mc => c == mc) == undefined
        )
      })

      state.melds = {
        ...state.melds,
        [state.playerId]: [
          ...state.melds[state.playerId],
          ...payload.payload.melds,
        ],
      }

      state.playMelds = []
      state.playMeldExtensions = {}
    },
    addPlayMeld: (state, payload: PayloadAction<Meld>) => {
      state.playMelds.push(payload.payload)
      state.playerCards = state.playerCards.filter(
        c => payload.payload.indexOf(c) == -1
      )
    },
    addCardToMeld: (
      state,
      payload: PayloadAction<{ meldId: MeldID; card: Card }>
    ) => {
      if (state.playMeldExtensions[payload.payload.meldId] == undefined)
        state.playMeldExtensions[payload.payload.meldId] = []

      state.playMeldExtensions[payload.payload.meldId].push(
        payload.payload.card
      )

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
        ...state.playMelds[payload.payload],
      ]
      state.playMelds.splice(payload.payload, 1)
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
    addMeldRect: (
      state,
      payload: PayloadAction<{ meldId: MeldID; rect: DOMRect }>
    ) => {
      state.meldsRects[payload.payload.meldId] = payload.payload.rect
    },
    removeMeldRect: (state, payload: PayloadAction<MeldID>) => {
      delete state.meldsRects[payload.payload]
    },
  },
})

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
  gameCreated,
  gameJoined,
  playerJoined,
  gameStarted,
  play,
  turnChanged,
  addMeld,
  dealChanged,
  addPlayMeld,
  undoMeld,
  addMeldRect,
  removeMeldRect,
  addCardToMeld,
} = gameDataSlice.actions
export default gameDataSlice.reducer
