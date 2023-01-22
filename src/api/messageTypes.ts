import { GameData, Player, PlayerMove } from '../game/gameState'

export type PlayerID = number
export type GameID = number

export enum GameMessageType {
  // Client messages
  Invalid,
  CreateGame,
  StartGame,
  JoinGame,
  Play,

  // Server messages
  GameCreated,
  GameJoined,
  GameStarted,
  PlayerJoined,
  TurnChanged,
  DealChanged,
}

export interface GameMessage {
  type: GameMessageType
}

export type MCreateGame = GameMessage

export interface MStartGame extends GameMessage {
  playerId: PlayerID
  gameId: GameID
}

export interface MGameStarted extends GameMessage {
  gameData: GameData
}

export interface MJoinGame extends GameMessage {
  gameId: GameID
}

export interface MGameCreated extends GameMessage {
  gameData: GameData
}

export interface MGameJoined extends GameMessage {
  gameData: GameData
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
