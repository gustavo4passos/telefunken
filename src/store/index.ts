import { configureStore } from '@reduxjs/toolkit'
import appSettingsReducer from './slices/appSettingsSlice'
import gameDataReducer from './slices/gameDataSlice'

export const store = configureStore({
  reducer: {
    appSettings: appSettingsReducer,
    gameData: gameDataReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
