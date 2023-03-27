import { MeldID, PlayerID } from './gameState'

export interface HTMLDivElementForRect {
  getBoundingClientRect: () => DOMRect
}

export interface BoundingRect {
  x: number
  y: number
  left: number
  right: number
  bottom: number
  top: number
  width: number
  height: number
}

export const doRectsCollide = (a: BoundingRect, b: BoundingRect): boolean => {
  if (a.left > b.right) return false
  if (a.right < b.left) return false
  if (a.bottom < b.top) return false
  if (a.top > b.bottom) return false
  return true
}

export const getBoundingRect = (
  element: HTMLDivElementForRect | null
): BoundingRect => {
  if (element) {
    const domRect = element.getBoundingClientRect()
    return {
      x: domRect.x,
      y: domRect.y,
      left: domRect.left,
      right: domRect.right,
      bottom: domRect.bottom,
      top: domRect.top,
      width: domRect.width,
      height: domRect.height,
    }
  } else
    return {
      x: 0,
      y: 0,
      left: 0,
      right: 0,
      bottom: 0,
      top: 0,
      width: 0,
      height: 0,
    }
}

export const getPlayerMeldCollision = (
  rect: BoundingRect,
  playerMeldsRefs: Record<PlayerID, Record<MeldID, HTMLDivElementForRect>>
): [PlayerID, MeldID] | [undefined, undefined] => {
  for (const pids in playerMeldsRefs) {
    const pid = Number(pids)

    const meldCollision = getMeldCollision(rect, playerMeldsRefs[pid])
    if (meldCollision != null) return [pid, meldCollision]
  }
  return [undefined, undefined]
}

export const getMeldCollision = (
  rect: BoundingRect,
  meldRefs: Record<MeldID, HTMLDivElementForRect>
): MeldID | null => {
  for (const meldId in meldRefs) {
    const meldRef = meldRefs[meldId]
    const meldRect = getBoundingRect(meldRef)

    if (doRectsCollide(rect, meldRect)) return Number(meldId) as MeldID
  }

  return null
}
