export enum GameState {
  Invalid,
  WaitingForPlayers,
  InProgress,
  Finished,
}

export type PlayerID = number
export type GameID = number
export type Card = number
export type Meld = Array<Card>

export const INVALID_GAME_ID: GameID = -1
export const INVALID_PLAYER_ID: GameID = -1
export const INVALID_ROUND = -1

export interface PlayerMove {
  melds: Array<Meld>
  discards: Card
}

export interface GameData {
  gameId: GameID
  playerId: PlayerID
  state: GameState
  players: Record<PlayerID, Player>
  round: number
  playerTurn: PlayerID
  melds: Record<PlayerID, Array<Meld>>
  playerCards: Array<Card>
  otherPlayerCards: Record<PlayerID, number>
  discardPile: Array<Card>
  playerOrder: Array<PlayerID> //TODO: This does not need to be sent everytime, just once. Maybe GameStarted or GameJoined
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
