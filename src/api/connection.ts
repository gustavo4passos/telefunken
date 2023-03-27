export let ws: WebSocket | undefined = undefined

export function setWs(websocket: WebSocket) {
  ws = websocket
}
