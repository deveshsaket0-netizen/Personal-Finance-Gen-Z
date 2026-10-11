import React from 'react'

export type StampVariant = 'Low' | 'Watch' | 'High' | 'Critical' | 'SAFE' | 'WATCH' | 'DANGER' | 'REACHED'

interface StampProps {
  level: StampVariant
  className?: string
}

export function Stamp({ level, className = '' }: StampProps) {
  let text = 'SAFE'
  let icon = '●'
  let variantClass = 'stamp-safe'

  if (level === 'Low' || level === 'SAFE') {
    text = 'SAFE'
    icon = '●'
    variantClass = 'stamp-safe'
  } else if (level === 'Watch' || level === 'WATCH') {
    text = 'WATCH'
    icon = '▲'
    variantClass = 'stamp-watch'
  } else if (level === 'High' || level === 'Critical' || level === 'DANGER') {
    text = level === 'Critical' ? 'CRITICAL' : 'DANGER'
    icon = '⚠'
    variantClass = 'stamp-danger'
  } else if (level === 'REACHED') {
    text = 'REACHED'
    icon = '★'
    variantClass = 'stamp-reached'
  }

  return (
    <span className={`stamp ${variantClass} ${className}`} role="status">
      <span aria-hidden="true">{icon}</span>
      <span>{text}</span>
    </span>
  )
}
