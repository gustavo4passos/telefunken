export const PLAYER_ID_LOCAL_STORAGE_KEY = 'telefunken-player-id'
export const getLocalStoragePlayerId = (): number | null => {
  const playerIdString = localStorage.getItem(PLAYER_ID_LOCAL_STORAGE_KEY)

  console.log('This is the value of player id on local storage', playerIdString)
  if (playerIdString != undefined) return Number(playerIdString)
  return null
}

export const setLocalStoragePlayerId = (playerId: number) => {
  console.log('Trying to set player id')
  localStorage.setItem(PLAYER_ID_LOCAL_STORAGE_KEY, playerId.toString())
}

export const clearLocalStorage = () => {
  localStorage.removeItem(PLAYER_ID_LOCAL_STORAGE_KEY)
}
