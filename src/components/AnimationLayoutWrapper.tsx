import { PropsWithChildren } from 'react'
import { AnimationStatus } from '../store/slices/gameDataSlice'

interface AnimationLayoutWrapperProps {
  type: 'origin' | 'destination'
  status: AnimationStatus
}

const AnimationLayoutWrapper = ({
  type,
  status,
  children,
}: PropsWithChildren<AnimationLayoutWrapperProps>): JSX.Element => {
  const hide = () => {
    if (type == 'origin') return status == AnimationStatus.HideOrigin
    if (type == 'destination') return status != AnimationStatus.HideOrigin
  }

  return <>{!hide() && children}</>
}

export default AnimationLayoutWrapper
