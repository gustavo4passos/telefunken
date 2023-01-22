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
  //TODO: These does not need to be sent everytime, just once. Maybe GameStarted or GameJoined
  dealConstraints: Array<DealConstraint>
  playerOrder: Array<PlayerID>
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
