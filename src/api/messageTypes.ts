import { Card, GameData, Player, PlayerMove } from '../game/gameState'

export type PlayerID = number
export type GameID = number

export enum GameMessageType {
  // Client messages
  Invalid,
  CreateGame,
  StartGame,
  JoinGame,
  Play,
  BuyCard,

  // Server messages
  GameCreated,
  GameJoined,
  GameStarted,
  PlayerJoined,
  TurnChanged,
  DealChanged,
  GameEnded,
  CardBought,
}

export enum MessageStatusType {
  Success,
  // Errors
  GameFull,
  GameNotExist,
  GameAlreadyStarted,
}

export interface MessageStatus {
  type: MessageStatusType
  description?: string
}

export interface GameMessage {
  type: GameMessageType
}

export interface MCreateGame extends GameMessage {
  playerId?: PlayerID
}

export interface MStartGame extends GameMessage {
  playerId: PlayerID
  gameId: GameID
}

export interface MGameStarted extends GameMessage {
  gameData: GameData
}

export interface MJoinGame extends GameMessage {
  gameId: GameID
  playerId?: PlayerID
}

export interface MGameCreated extends GameMessage {
  gameData: GameData
}

export interface MGameJoined extends GameMessage {
  gameData: GameData
  status: MessageStatus
}

export interface MPlayerJoined extends GameMessage {
  player: Player
  playerOrder: Array<PlayerID>
}

export interface MPlay extends GameMessage {
  gameId: GameID
  playerId: PlayerID
  playerMove: PlayerMove
}

export interface MTurnChanged extends GameMessage {
  gameData: GameData
}

export interface MDealChanged extends GameMessage {
  gameData: GameData
}

export interface MGameEnded extends GameMessage {
  gameData: GameData
}

export interface MBuyCard extends GameMessage {
  card: Card
  playerId: PlayerID
  gameId: GameID
}

export interface MCardBought extends GameMessage {
  playerId: PlayerID
  card: Card | null
  success: boolean | null
  cardDrawn: Card | null
  gameData: GameData
}
