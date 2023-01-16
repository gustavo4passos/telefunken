import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '..'
import { MPlayerJoined } from '../../api/messageTypes'
import {
  GameData,
  GameState,
  INVALID_PLAYER_ID,
  INVALID_GAME_ID,
  INVALID_ROUND,
  PlayerMove,
  PlayerID,
  Meld,
} from '../../game/gameState'

export type GameDataState = GameData

const initialState: GameDataState = {
  gameId: INVALID_PLAYER_ID,
  playerId: INVALID_GAME_ID,
  state: GameState.Invalid,
  playerCards: [],
  players: {},
  round: INVALID_ROUND,
  playerTurn: INVALID_PLAYER_ID,
  melds: {},
  playerOrder: [],
  discardPile: [],
  otherPlayerCards: {},
}

export const gameDataSlice = createSlice({
  name: 'gameState',
  initialState,
  reducers: {
    createGame: state => {
      state.state = GameState.WaitingForPlayers
    },
    gameStarted: (state, payload: PayloadAction<GameData>) => {
      return payload.payload
    },
    playerJoined: (state, payload: PayloadAction<MPlayerJoined>) => {
      state.players[payload.payload.player.id] = payload.payload.player
      state.melds[payload.payload.player.id] = []
      state.playerOrder = payload.payload.playerOrder
    },
    gameCreated: (state, payload: PayloadAction<GameData>) => {
      return payload.payload
    },
    gameJoined: (state, payload: PayloadAction<GameData>) => {
      return payload.payload
    },
    turnChanged: (state, payload: PayloadAction<GameData>) => {
      return payload.payload
    },
    play: (state, payload: PayloadAction<PlayerMove>) => {
      state.playerCards = state.playerCards.filter(
        p => p != payload.payload.discards
      )
      payload.payload.melds.forEach(m => {
        state.playerCards = state.playerCards.filter(
          c => m.find(mc => c == mc) == undefined
        )
      })
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
} = gameDataSlice.actions
export default gameDataSlice.reducer
