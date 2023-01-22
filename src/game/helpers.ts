export const doRectsCollide = (a: DOMRect, b: DOMRect): boolean => {
  if (a.left > b.right) return false
  if (a.right < b.left) return false
  if (a.bottom < b.top) return false
  if (a.top > b.bottom) return false
  return true
}

export const getBoundingRect = (element: HTMLDivElement | null): DOMRect => {
  if (element) return element.getBoundingClientRect()
  else
    return {
      x: 0,
      y: 0,
      left: 0,
      right: 0,
      bottom: 0,
      top: 0,
      width: 0,
      height: 0,
      toJSON: () => {
        throw new Error('This function should never be called')
      },
    }
}
