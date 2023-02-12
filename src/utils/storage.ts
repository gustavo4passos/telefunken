export const PLAYER_ID_LOCAL_STORAGE_KEY = 'telefunken-player-id'
export const getLocalStoragePlayerId = (): number | null => {
  const playerIdString = localStorage.getItem(PLAYER_ID_LOCAL_STORAGE_KEY)

  if (playerIdString != undefined) return Number(playerIdString)
  return null
}

export const setLocalStoragePlayerId = (playerId: number) => {
  localStorage.setItem(PLAYER_ID_LOCAL_STORAGE_KEY, playerId.toString())
}

export const clearLocalStorage = () => {
  localStorage.removeItem(PLAYER_ID_LOCAL_STORAGE_KEY)
}
