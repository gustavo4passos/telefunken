import { useEffect, useState } from 'react'

interface LocalStorageProps<T> {
  key: string
  defaultValue: T
}

const getStorageItem = <T>(key: string, defaultValue: T): T => {
  const localData = localStorage.getItem(key)

  if (localData == null) return defaultValue
  return JSON.parse(localData) as T
}

const useLocalStorage = <T>({ key, defaultValue }: LocalStorageProps<T>) => {
  const [data, setData] = useState(() => getStorageItem(key, defaultValue))

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(data))
  }, [data, key])

  return [data, setData]
}

export default useLocalStorage
