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
import {
  isValidCombination,
  isValidExtension,
} from '../../game/combinations_any'
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
  MeldCardReplacement,
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
  playerDrawAnimation: AnimationStatus
  dealStartAnimation: AnimationStatus
  playerBoughtAnimation: AnimationStatus
  playerDiscardAnimation: PlayerDiscardAnimation
  selectedMeldCard: SelectedMeldCard | undefined
  selectedCards: Array<Card>
  meldModifications: Array<MeldModification>
  cardDrawnThisTurn: Card | undefined
}

const initialState: GameDataState = {
  gameId: INVALID_GAME_ID,
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
  cardDrawnThisTurn: undefined,
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

      const cardDrawn = isPlayerTurn
        ? payload.payload.gameData.playerCards[
            payload.payload.gameData.playerCards.length - 1
          ]
        : undefined

      return {
        ...state,
        ...payload.payload.gameData,
        playerDrawAnimation: animationStatus,
        playerDiscardAnimation,
        cardDrawnThisTurn: cardDrawn,
      }
    },
    dealChanged: (state, payload: PayloadAction<MDealChanged>) => {
      return {
        ...state,
        dealStartAnimation: AnimationStatus.HideDestination,
        ...payload.payload.gameData,
      }
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
      state.meldModifications = []

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
            state.cardDrawnThisTurn = payload.payload.cardDrawn
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
    setDrawStartAnimation: (state, payload: PayloadAction<AnimationStatus>) => {
      state.playerDrawAnimation = payload.payload
    },
    setDealStartAnimation: (state, payload: PayloadAction<AnimationStatus>) => {
      state.dealStartAnimation = payload.payload
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
    // TODO: This action became quite complicated. Optimize and/or refactor it
    modifyMeld: (state, payload: PayloadAction<MeldModification>) => {
      const { meldId, meldPlayerId } = payload.payload

      switch (payload.payload.data.kind) {
        case 'replacement': {
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

          state.playerCards = [meldToHand, ...state.playerCards]
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

      // If not a play meld, a new modification is being added or a replacement cancelled
      if (meldPlayerId != state.playerId || !isPlayMeld(meldId, state)) {
        if (payload.payload.data.kind == 'replacement') {
          // Check if replacement undo a previous replacement
          // Note that the validity logic should be done outside
          const { handToMeld, meldToHand } = payload.payload.data
          const handToMeldReplacementIndex =
            getIndexIfHandCardCameFromReplacement(handToMeld, state)
          const meldToHandReplacementIndex =
            getIndexIfMeldCardCameFromReplacement(meldToHand, state)

          // TODO: Remove me after testing
          // Since validity should be checked outside, this should never happen
          if (handToMeldReplacementIndex != meldToHandReplacementIndex) {
            throw new Error(
              `Invalid replacement: ${JSON.stringify(payload.payload)}`
            )
          }

          // Undo replacement
          if (handToMeldReplacementIndex != -1)
            state.meldModifications.splice(handToMeldReplacementIndex, 1)
          // Or just add a new one
          else state.meldModifications.push(payload.payload)
        } else {
          // Add extension
          state.meldModifications.push(payload.payload)
        }
      } else {
        const playMeldId = getPlayMeldId(meldId, state)
        // TODO: Remove me after testing
        if (playMeldId <= 0 || playMeldId >= state.playMelds.length) {
          throw new Error('Invalid play meld ID')
        }
      }

      // Deselect meld card and hand card
      state.selectedCards = []
      state.selectedMeldCard = undefined
    },
    removeMeldModifications: (
      state,
      payload: PayloadAction<{ meldId: MeldID; playerId: PlayerID }>
    ) => {
      // Modifications must be undone backwards
      const extensionCards: Array<Card> = []
      const meldToHandCards: Array<Card> = []
      const handToMeldCards: Array<Card> = []
      for (const mod of state.meldModifications) {
        if (mod.meldId != payload.payload.meldId) continue
        if (mod.meldPlayerId != mod.meldPlayerId) continue

        const { playerId, meldId } = payload.payload

        // Only undo modifications if all of them can be undone
        switch (mod.data.kind) {
          case 'extension': {
            extensionCards.push(mod.data.card)
            break
          }
          case 'replacement': {
            const { meldToHand, handToMeld } = mod.data
            // If the card is no longer in the player hand, it is not possible to undo modification now
            if (state.playerCards.findIndex(c => c == meldToHand)) return

            meldToHandCards.push(meldToHand)
            handToMeldCards.push(handToMeld)
            break
          }
          default:
            break
        }

        // Modifications can be properly undone
        state.meldModifications = state.meldModifications.filter(
          m => m.meldId != meldId || m.meldPlayerId != playerId
        )

        state.melds[playerId][meldId] = state.melds[playerId][meldId].filter(
          c =>
            extensionCards.findIndex(ec => ec == c) == -1 &&
            handToMeldCards.findIndex(rc => rc == c) == -1
        )

        state.melds[playerId][meldId] = isValidCombination([
          ...state.melds[playerId][meldId],
        ])

        state.playerCards = state.playerCards.filter(
          c => meldToHandCards.findIndex(rc => rc == c) == -1
        )

        state.playerCards = [
          ...state.playerCards,
          ...handToMeldCards,
          ...extensionCards,
        ]
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

export const getCurrentReplacements = (state: GameDataState) => {
  const replacements: Record<MeldID, Array<MeldCardReplacement>> = {}
  state.meldModifications.forEach(m => {
    if (m.data.kind == 'replacement') {
      if (replacements[m.meldId] == undefined) replacements[m.meldId] = []
      replacements[m.meldId].push(m.data)
    }
  })
  return replacements
}

export const getMeldUnmeldedReplacements = (
  meldId: MeldID,
  replacements: Record<MeldID, Array<MeldCardReplacement>>,
  unmeldedReplacedCards: Array<Card>
) => {
  if (replacements[meldId] == undefined) return []

  const unmelded = []

  for (const r of replacements[meldId]) {
    if (unmeldedReplacedCards.findIndex(c => c == r.meldToHand) != -1)
      unmelded.push(r.meldToHand)
  }

  return unmelded
}

export const getReplacedCardsInHand = (state: GameDataState) => {
  if (state.state != GameState.InProgress) return []
  const cards: Array<Card> = []

  state.meldModifications.forEach(e => {
    if (e.data.kind != 'replacement') return
    cards.push(e.data.meldToHand)
  })

  return cards
}

export const getReplacedCardsInMeld = (
  meldId: MeldID,
  replacements: Record<MeldID, Array<MeldCardReplacement>>
) => {
  const cards: Array<Card> = []

  if (replacements[meldId] == undefined) return cards
  replacements[meldId].forEach(r => cards.push(r.handToMeld))

  return cards
}

export const getUnmeldedReplacedCards = (
  replacedCardsInHand: Array<Card>,
  state: GameDataState
) => {
  if (state.state != GameState.InProgress) return []

  const playMeldStart = getPlayMeldStart(state)
  return replacedCardsInHand.filter(
    c =>
      state.melds[state.playerId].findIndex(
        (m, i) => i >= playMeldStart && m.findIndex(mc => mc == c) != -1
      ) == -1
  )
}

export const meldHasExtension = (state: RootState, meldId: MeldID) => {
  return state.gameData.meldModifications.find(
    e => e.meldId == meldId && e.data.kind == 'extension'
  )
}

export const meldHasBeenModified = (
  state: RootState,
  playerId: PlayerID,
  meldId: MeldID
) => {
  return (
    state.gameData.meldModifications.findIndex(
      e => e.meldId == meldId && e.meldPlayerId == playerId
    ) != -1
  )
}

export const getMeldExtensions = (
  state: GameDataState,
  playerId: PlayerID,
  meldId: MeldID
) => {
  const extensions: Array<number> = []

  state.meldModifications.forEach(
    e =>
      e.data.kind == 'extension' &&
      e.meldId == meldId &&
      extensions.push(e.data.card)
  )

  return extensions
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
  buyCard,
  onBuyCardResponse,
  setDealStartAnimation,
  setDrawStartAnimation,
  setDiscardAnimation,
  playFailed,
  modifyMeld,
  setSelectedMeldCard,
  selectCard,
  unselectCard,
  removeMeldModifications,
} = gameDataSlice.actions
export default gameDataSlice.reducer
