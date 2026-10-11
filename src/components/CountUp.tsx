import React, { useEffect, useState, useRef } from 'react'
import { fmt } from '../domain/selectors'

interface CountUpProps {
  value: number
  formatAsCurrency?: boolean
  duration?: number
  className?: string
}

export function CountUp({ value, formatAsCurrency = true, duration = 400, className = '' }: CountUpProps) {
  const [displayValue, setDisplayValue] = useState(value)
  const prevValueRef = useRef(value)
  const [highlight, setHighlight] = useState(false)

  useEffect(() => {
    // If reduced motion preferred, set value immediately
    const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      setDisplayValue(value)
      prevValueRef.current = value
      return
    }

    if (prevValueRef.current !== value) {
      setHighlight(true)
      const timer = setTimeout(() => setHighlight(false), 800)

      const start = prevValueRef.current
      const end = value
      const startTime = performance.now()

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime
        const progress = Math.min(1, elapsed / duration)
        // Ease out quadratic
        const eased = 1 - (1 - progress) * (1 - progress)
        const current = Math.round(start + (end - start) * eased)
        setDisplayValue(current)

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          prevValueRef.current = end
        }
      }

      requestAnimationFrame(animate)
      return () => clearTimeout(timer)
    }
  }, [value, duration])

  return (
    <span
      className={`${className} ${highlight ? 'value-highlighted' : ''}`}
      style={{
        display: 'inline-block',
        transition: 'background-color 0.4s ease',
        backgroundColor: highlight ? 'var(--marigold-faint)' : 'transparent',
        borderRadius: '3px',
        padding: '0 4px',
        margin: '0 -4px'
      }}
    >
      {formatAsCurrency ? fmt(displayValue) : displayValue}
    </span>
  )
}
