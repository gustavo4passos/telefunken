import { CombinationConstraint } from './combinations'

export enum GameState {
  Invalid,
  WaitingForPlayers,
  InProgress,
  Finished,
}

export type PlayerID = number
export type MeldID = number
export type GameID = number
export type Card = number
export type Meld = Array<Card>

export const INVALID_GAME_ID: GameID = -1
export const INVALID_PLAYER_ID: GameID = -1
export const INVALID_DEAL = -1

export interface PlayerDealEndState {
  remainingCards: Array<Card>
  melds: Array<Meld>
  cardsBought: Array<Card>
}
export type DealEndState = Record<PlayerID, PlayerDealEndState>

export interface MeldCardReplacement {
  kind: 'replacement'
  handToMeld: Card
  meldToHand: Card
}

export interface MeldCardExtension {
  kind: 'extension'
  card: Card
}

export interface MeldModification {
  meldPlayerId: PlayerID
  meldId: MeldID
  data: MeldCardReplacement | MeldCardExtension
}

export interface MeldExtension {
  meldIndex: number
  cards: Array<Card>
}

export interface PlayerMove {
  melds: Array<Meld>
  discards: Card | null
  meldExtensions: Record<MeldID, Array<Card>>
}

export interface DealConstraint {
  combinationConstraint: CombinationConstraint
  size: number
}

export interface GameData {
  gameId: GameID
  playerId: PlayerID
  state: GameState
  players: Record<PlayerID, Player>
  deal: number
  playerTurn: PlayerID
  melds: Record<PlayerID, Array<Meld>>
  playerCards: Array<Card>
  otherPlayerCards: Record<PlayerID, number>
  discardPile: Array<Card>
  dealConstraintCompliance: Array<boolean>
  dealsEndState: Array<DealEndState>
  dealConstraints: Array<DealConstraint>
  playerOrder: Array<PlayerID>
  boughtThisRound: boolean
  isOwner: boolean
  currentDealTurn: number
  playerChips: Record<PlayerID, number>
}

export interface Player {
  id: PlayerID
  name: string
}

export const getOpponentLocalOrder = (
  order: number,
  localPlayerOrder: number,
  playerOrder: Array<PlayerID>
): PlayerID | never => {
  if (order > playerOrder.length)
    throw Error('Player order is invalid. There are not enough players for it.')

  return playerOrder[(localPlayerOrder + order) % playerOrder.length]
}

export const getPlayerOrderIndex = (
  playerOrder: Array<PlayerID>,
  playerId: PlayerID
) => {
  const index = playerOrder.findIndex(p => p == playerId)
  // TODO: Test me then remove me
  if (index == -1)
    throw Error(
      "Can't find player order index. Player is not in player order list"
    )

  return index
}

export const isFirstDealTurn = (gameData: GameData) => {
  return Math.floor(gameData.currentDealTurn / gameData.playerOrder.length) < 1
}
