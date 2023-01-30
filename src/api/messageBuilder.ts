import { Card, GameID, PlayerMove } from '../game/gameState'
import {
  GameMessageType,
  MBuyCard,
  MCreateGame,
  MJoinGame,
  MPlay,
  MStartGame,
  PlayerID,
} from './messageTypes'

const createGame = (playerId?: PlayerID): MCreateGame => ({
  type: GameMessageType.CreateGame,
  playerId,
})

const joinGame = (gameId: GameID, playerId?: PlayerID): MJoinGame => ({
  type: GameMessageType.JoinGame,
  gameId,
  playerId,
})

const startGame = (playerId: PlayerID, gameId: GameID): MStartGame => ({
  type: GameMessageType.StartGame,
  playerId,
  gameId,
})

const buyCard = (playerId: PlayerID, card: Card, gameId: GameID): MBuyCard => ({
  type: GameMessageType.BuyCard,
  gameId,
  playerId,
  card,
})

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

const MessageBuilder = { createGame, joinGame, startGame, play, buyCard }
export default MessageBuilder
