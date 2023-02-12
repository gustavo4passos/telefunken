import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '..'
import {
  MPlayerJoined,
  MDealChanged,
  MTurnChanged,
  MCardBought,
  MGameEnded,
  MPlayFailed,
} from '../../api/messageTypes'
import { isValidCombination, isValidExtension } from '../../game/combinations'
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
  getPlayerOrderIndex,
  MeldModification,
} from '../../game/gameState'
import { HTMLDivElementForRect } from '../../game/helpers'

export enum AnimationStatus {
  HideDestination,
  HideOrigin,
}

export interface PlayerDiscardAnimation {
  playerId: PlayerID
  animationStatus: AnimationStatus
  card: Card
}

export interface SelectedMeldCard {
  meldId: MeldID
  card: Card
}

// TODO: Instead of extending GameData it would be more clear if the state
// actually has a field gameData where all the client game data goes
// TODO: Separate animations into another slice?
export interface GameDataState extends GameData {
  playMelds: Array<Meld>
  playMeldExtensions: Record<MeldID, Array<Card>>
  meldsRefs: Record<MeldID, HTMLDivElementForRect>
  playerDrawAnimation: AnimationStatus
  dealStartAnimation: AnimationStatus
  playerBoughtAnimation: AnimationStatus
  playerDiscardAnimation: PlayerDiscardAnimation
  selectedMeldCard: SelectedMeldCard | undefined
  selectedCards: Array<Card>
  meldModifications: Array<MeldModification>
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
  playerDrawAnimation: AnimationStatus.HideOrigin,
  dealStartAnimation: AnimationStatus.HideOrigin,
  playerBoughtAnimation: AnimationStatus.HideOrigin,
  playerDiscardAnimation: {
    playerId: INVALID_PLAYER_ID,
    animationStatus: AnimationStatus.HideOrigin,
    card: 0,
  },
  currentDealTurn: 0,
  playerChips: {},
  meldModifications: [],
  selectedMeldCard: undefined,
  selectedCards: [],
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
          : AnimationStatus.HideDestination
      const playerDiscardAnimation = {
        playerId: state.playerTurn,
        animationStatus: discardAnimationStatus,
        card: payload.payload.gameData.discardPile[topDiscardIndex],
      }

      const isPlayerTurn = payload.payload.gameData.playerTurn == state.playerId
      // If it's local player turn, request the draw animation
      const animationStatus = isPlayerTurn
        ? AnimationStatus.HideDestination
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

        state.discardPile = [...state.discardPile, payload.payload.discards]
      }

      state.playMelds = []
      state.playMeldExtensions = {}

      // Optimistically advance to next player turn
      const playerIndex = getPlayerOrderIndex(state.playerOrder, state.playerId)
      const nextPlayerIdnex = (playerIndex + 1) % state.playerOrder.length
      state.playerTurn = state.playerOrder[nextPlayerIdnex]

      // Clear selected cards
      state.selectedCards = []
    },
    addPlayMeld: state => {
      state.playMelds.push(isValidCombination(state.selectedCards))

      state.playerCards = state.playerCards.filter(
        c => state.selectedCards.indexOf(c) == -1
      )

      // Copy play meld to melds (optimistic updating)
      state.melds[state.playerId] = [
        ...state.melds[state.playerId],
        [...state.playMelds[state.playMelds.length - 1]],
      ]

      state.selectedCards = []
    },
    addCardToMeld: (
      state,
      payload: PayloadAction<{ meldId: MeldID; card: Card }>
    ) => {
      state.melds[state.playerId][payload.payload.meldId] = isValidExtension(
        state.melds[state.playerId][payload.payload.meldId],
        [payload.payload.card]
      )

      state.playerCards = state.playerCards.filter(
        c => c != payload.payload.card
      )

      // If meld is actually a play meld, just add card to the meld
      if (isPlayMeld(payload.payload.meldId, state)) {
        const playMeldId = getPlayMeldId(payload.payload.meldId, state)
        // TODO: Calling isValidExtension to organize the cards shouldn't be necessary. It should already have
        // been checked before this action has been called
        state.playMelds[playMeldId] = isValidExtension(
          state.playMelds[playMeldId],
          [payload.payload.card]
        )
      }
      // Otherwise, add playMeldExtension
      else {
        if (state.playMeldExtensions[payload.payload.meldId] == undefined)
          state.playMeldExtensions[payload.payload.meldId] = []

        state.playMeldExtensions[payload.payload.meldId].push(
          payload.payload.card
        )
      }
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
      state.playerChips[state.playerId]--
    },
    gameEnded: (state, payload: PayloadAction<MGameEnded>) => {
      return { ...state, ...payload.payload.gameData }
    },
    playFailed: (state, payload: PayloadAction<MPlayFailed>) => {
      return { ...state, ...payload.payload.gameData }
    },
    onBuyCardResponse: (state, payload: PayloadAction<MCardBought>) => {
      // Update players chips, just in case
      state.playerChips = payload.payload.gameData.playerChips
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
            state.playerDrawAnimation = AnimationStatus.HideDestination
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
    setSelectedMeldCard: (
      state,
      payload: PayloadAction<SelectedMeldCard | undefined>
    ) => {
      state.selectedMeldCard = payload.payload
    },
    selectCard: (state, payload: PayloadAction<Card>) => {
      state.selectedCards.push(payload.payload)
    },
    unselectCard: (state, payload: PayloadAction<Card>) => {
      state.selectedCards = state.selectedCards.filter(
        c => c != payload.payload
      )
    },
    modifyMeld: (state, payload: PayloadAction<MeldModification>) => {
      const { meldId, meldPlayerId } = payload.payload

      switch (payload.payload.data.kind) {
        case 'replacement': {
          // Is any of the cards that I'm trying to replace already used as replacement this turn?
          // ...
          // In that case, only allow the replacement if it's the same pair of cards = undo replacement
          const { handToMeld, meldToHand } = payload.payload.data
          // TODO: Remove me after testing
          if (meldPlayerId != state.playerId)
            throw new Error("Can't replace cards in other player melds")

          state.melds[state.playerId][meldId].push(handToMeld)
          state.melds[state.playerId][meldId] = state.melds[state.playerId][
            meldId
          ].filter(c => c != meldToHand)
          // Place cards in their place
          state.melds[state.playerId][meldId] = isValidCombination(
            state.melds[state.playerId][meldId]
          )

          state.playerCards.push(meldToHand)
          state.playerCards = state.playerCards.filter(c => c != handToMeld)

          break
        }
        case 'extension': {
          const { card } = payload.payload.data
          const meld = state.melds[meldPlayerId][meldId]
          state.melds[meldPlayerId][meldId] = isValidExtension(meld, [card])

          state.playerCards = state.playerCards.filter(c => c != card)

          break
        }
        default:
          break
      }

      if (meldPlayerId != state.playerId || !isPlayMeld(meldId, state)) {
        state.meldModifications.push(payload.payload)
      } else {
        const playMeldId = getPlayMeldId(meldId, state)
        // TODO: Remove me after testing
        if (playMeldId <= 0 || playMeldId >= state.playMelds.length) {
          throw new Error('Invalid play meld ID')
        }

        state.playMelds[playMeldId] = [...state.melds[state.playerId][meldId]]
      }

      // Deselect meld card and hand card
      state.selectedCards = []
      state.selectedMeldCard = undefined
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

export const isPlayMeld = (meldId: MeldID, state: GameDataState) => {
  const playMeldStart = getPlayMeldStart(state)
  return meldId >= playMeldStart
}

export const getPlayMeldId = (meldId: MeldID, state: GameDataState) => {
  const playMeldStart = getPlayMeldStart(state)
  return meldId - playMeldStart
}

// -1 if card hasn't come from replacement
export const getIndexIfHandCardCameFromReplacement = (
  card: Card,
  state: GameDataState
): number => {
  return state.meldModifications.findIndex(
    e => e.data.kind == 'replacement' && e.data.meldToHand == card
  )
}

export const getIndexIfMeldCardCameFromReplacement = (
  card: Card,
  state: GameDataState
): number => {
  return state.meldModifications.findIndex(
    e => e.data.kind == 'replacement' && e.data.handToMeld == card
  )
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
  playFailed,
  modifyMeld,
  setSelectedMeldCard,
  selectCard,
  unselectCard,
} = gameDataSlice.actions
export default gameDataSlice.reducer
