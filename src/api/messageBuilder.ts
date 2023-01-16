import { GameID, PlayerMove } from '../game/gameState'
import {
  GameMessageType,
  MCreateGame,
  MJoinGame,
  MPlay,
  MStartGame,
  PlayerID,
} from './messageTypes'

const createGame = (): MCreateGame => {
  return { type: GameMessageType.CreateGame }
}

const joinGame = (gameId: GameID): MJoinGame => {
  return { type: GameMessageType.JoinGame, gameId }
}

const startGame = (playerId: PlayerID, gameId: GameID): MStartGame => {
  return { type: GameMessageType.StartGame, playerId, gameId }
}

const play = (
  gameId: GameID,
  playerId: PlayerID,
  playerMove: PlayerMove
): MPlay => ({
  type: GameMessageType.Play,
  gameId,
  playerId,
  playerMove,
})

const MessageBuilder = { createGame, joinGame, startGame, play }
export default MessageBuilder
