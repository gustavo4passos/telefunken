import { useState, useCallback, useLayoutEffect, RefObject } from 'react'
import { getBoundingRect } from '../game/helpers'

const useBoundingRect = (ref: RefObject<HTMLDivElement>) => {
  const [rect, setRect] = useState(getBoundingRect(ref ? ref.current : null))

  const handleResize = useCallback(() => {
    if (!ref.current) return
    setRect(getBoundingRect(ref.current))
  }, [ref])

  useLayoutEffect(() => {
    handleResize()
  }, [ref, handleResize])

  return rect
}

export default useBoundingRect
