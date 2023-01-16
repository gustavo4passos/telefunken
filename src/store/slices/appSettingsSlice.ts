import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '..'

export enum Language {
  English = 'en',
  Portuguese = 'pt',
  Spanish = 'es',
}

export enum Theme {
  Dark = 'dark',
  Light = 'light',
}

export interface AppSettingsState {
  theme: Theme
  language: Language
}

const initialState: AppSettingsState = {
  theme: Theme.Dark,
  language: Language.English,
}

export const appSettingsSlice = createSlice({
  name: 'appSettings',
  initialState,
  reducers: {
    changeLanguage: (state, action: PayloadAction<Language>) => {
      state.language = action.payload
    },

    changeTheme: (state, action: PayloadAction<Theme>) => {
      state.theme = action.payload
    },
  },
})

export const selectLanguage = (state: RootState) => state.appSettings.language
export const selectTheme = (state: RootState) => state.appSettings.theme

export const { changeLanguage, changeTheme } = appSettingsSlice.actions
export default appSettingsSlice.reducer
