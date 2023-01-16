import { SunIcon, MoonIcon } from '@heroicons/react/20/solid'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import {
  changeTheme,
  selectTheme,
  Theme,
} from '../store/slices/appSettingsSlice'

const ThemeToggleButton = () => {
  const dispatch = useAppDispatch()
  const currentTheme = useAppSelector(selectTheme)

  const toggleTheme = () =>
    dispatch(changeTheme(currentTheme == Theme.Dark ? Theme.Light : Theme.Dark))

  return (
    <button className="flex items-center" onClick={toggleTheme}>
      {currentTheme == Theme.Light ? (
        <MoonIcon className="text-gray-500 w-14 rounded-full p-2 hover:bg-gray-200 hover:text-gray-600" />
      ) : (
        <SunIcon className="w-14 text-slate-300 rounded-full p-2 hover:bg-slate-500 hover:text-slate-100" />
      )}
    </button>
  )
}

export default ThemeToggleButton
