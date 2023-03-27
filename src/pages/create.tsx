import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import * as Connection from '../api/connection'
import MessageBuilder from '../api/messageBuilder'
import { GameMessage, GameMessageType, MGameCreated } from '../api/messageTypes'
import { INVALID_GAME_ID, INVALID_PLAYER_ID } from '../game/gameState'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { gameCreated } from '../store/slices/gameDataSlice'
import {
  getLocalStoragePlayerId,
  setLocalStoragePlayerId,
} from '../utils/storage'

const CreateGame = () => {
  const gameId = useAppSelector(state => state.gameData.gameId)
  const router = useRouter()
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (gameId == INVALID_GAME_ID) {
      const playerId = getLocalStoragePlayerId()

      if (Connection.ws == undefined)
        Connection.setWs(
          new WebSocket(process.env.NEXT_PUBLIC_BACKBONE_ADDRESS || '')
        )

      if (Connection.ws != undefined) {
        Connection.ws.onopen = () => {
          Connection.ws?.send(
            JSON.stringify(
              MessageBuilder.createGame(playerId == null ? undefined : playerId)
            )
          )
        }
        Connection.ws.onmessage = conn => {
          const message = JSON.parse(conn.data) as GameMessage
          if (message.type == GameMessageType.GameCreated) {
            const m = message as MGameCreated
            setLocalStoragePlayerId(m.gameData.playerId)
            dispatch(gameCreated(m.gameData))
          }
        }
      }
    } else router.push(`/game/${gameId}`)
  }, [gameId, router, dispatch])

  return (
    <>
      <Head>
        <title>Telefunken - Creating Game</title>
      </Head>
      <div className="flex min-h-screen w-full justify-center items-center bg-gradient-to-b from-primary to-secondary">
        <h1 className="text-xl text-info font-light">Creating game...</h1>
      </div>
    </>
  )
}

export default CreateGame
