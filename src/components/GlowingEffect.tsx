"use client"

import { memo, useCallback, useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import { animate } from 'motion/react'

interface GlowingEffectProps {
  blur?: number
  inactiveZone?: number
  proximity?: number
  spread?: number
  variant?: 'default' | 'white'
  glow?: boolean
  className?: string
  disabled?: boolean
  movementDuration?: number
  borderWidth?: number
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

const GlowingEffect = memo(
  ({
    blur = 0,
    inactiveZone = 0.7,
    proximity = 0,
    spread = 20,
    variant = 'default',
    glow = false,
    className,
    movementDuration = 2,
    borderWidth = 1,
    disabled = false,
  }: GlowingEffectProps) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const lastPosition = useRef({ x: 0, y: 0 })
    const animationFrameRef = useRef<number>(0)
    const angleAnimationRef = useRef<ReturnType<typeof animate> | null>(null)

    const handleMove = useCallback(
      (e?: MouseEvent | PointerEvent | { x: number; y: number }) => {
        if (!containerRef.current) return

        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }

        animationFrameRef.current = requestAnimationFrame(() => {
          const element = containerRef.current
          if (!element) return

          const { left, top, width, height } = element.getBoundingClientRect()
          const mouseX = e?.x ?? lastPosition.current.x
          const mouseY = e?.y ?? lastPosition.current.y

          if (e) {
            lastPosition.current = { x: mouseX, y: mouseY }
          }

          const centerX = left + width * 0.5
          const centerY = top + height * 0.5
          const distanceFromCenter = Math.hypot(mouseX - centerX, mouseY - centerY)
          const inactiveRadius = 0.5 * Math.min(width, height) * inactiveZone

          if (distanceFromCenter < inactiveRadius) {
            element.style.setProperty('--active', '0')
            return
          }

          const isActive =
            mouseX > left - proximity &&
            mouseX < left + width + proximity &&
            mouseY > top - proximity &&
            mouseY < top + height + proximity

          element.style.setProperty('--active', isActive ? '1' : '0')

          if (!isActive) return

          const currentAngle = parseFloat(element.style.getPropertyValue('--start')) || 0
          const targetAngle = (180 * Math.atan2(mouseY - centerY, mouseX - centerX)) / Math.PI + 90
          const angleDiff = ((targetAngle - currentAngle + 180) % 360) - 180

          angleAnimationRef.current?.stop()
          angleAnimationRef.current = animate(currentAngle, currentAngle + angleDiff, {
            duration: movementDuration,
            ease: [0.16, 1, 0.3, 1],
            onUpdate: value => {
              element.style.setProperty('--start', `${value}deg`)
            },
          })
        })
      },
      [inactiveZone, movementDuration, proximity]
    )

    useEffect(() => {
      if (disabled) return

      const handleScroll = () => handleMove()
      const handlePointerMove = (e: PointerEvent) => handleMove(e)
      const handleMouseMove = (e: MouseEvent) => handleMove(e)

      window.addEventListener('scroll', handleScroll, { passive: true })
      window.addEventListener('pointermove', handlePointerMove, {
        passive: true,
      })
      window.addEventListener('mousemove', handleMouseMove, {
        passive: true,
      })

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
        angleAnimationRef.current?.stop()
        window.removeEventListener('scroll', handleScroll)
        window.removeEventListener('pointermove', handlePointerMove)
        window.removeEventListener('mousemove', handleMouseMove)
      }
    }, [handleMove, disabled])

    return (
      <>
        <div
          className={cn(
            'pointer-events-none absolute -inset-px hidden rounded-[inherit] border opacity-0 transition-opacity',
            glow && 'opacity-100',
            variant === 'white' && 'border-white',
            disabled && '!block'
          )}
        />
        <div
          ref={containerRef}
          style={
            {
              '--blur': `${blur}px`,
              '--start': '0deg',
              '--active': '0',
              '--glowingeffect-border-width': `${borderWidth}px`,
              '--glow-conic-gradient':
                variant === 'white'
                  ? `conic-gradient(
                      from var(--start),
                      #0000 0deg,
                      #ffffff ${spread}deg,
                      #0000 ${spread * 2}deg,
                      #0000 360deg
                    )`
                  : `conic-gradient(
                      from var(--start),
                      #0000 0deg,
                      #dd7bbb ${spread * 0.35}deg,
                      #d79f1e ${spread * 0.75}deg,
                      #5a922c ${spread * 1.15}deg,
                      #4c7894 ${spread * 1.55}deg,
                      #0000 ${spread * 2}deg,
                      #0000 360deg
                    )`,
            } as CSSProperties
          }
          className={cn(
            'pointer-events-none absolute inset-0 rounded-[inherit] opacity-100 transition-opacity',
            blur > 0 && 'blur-[var(--blur)]',
            className,
            disabled && '!hidden'
          )}
        >
          <div className="glowing-effect-border rounded-[inherit]" />
        </div>
      </>
    )
  }
)

GlowingEffect.displayName = 'GlowingEffect'

export { GlowingEffect }
