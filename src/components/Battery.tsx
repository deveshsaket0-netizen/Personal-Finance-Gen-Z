import React from 'react'

interface BatteryProps {
  daysLeft: number
  totalDays?: number
  percentage?: number
  className?: string
}

export function Battery({ daysLeft, totalDays = 30, percentage, className = '' }: BatteryProps) {
  // If percentage not supplied, calculate from remaining days or allowance
  const pct = Math.max(0, Math.min(100, percentage ?? Math.round((daysLeft / totalDays) * 100)))

  let fillClass = 'safe'
  if (pct < 20) fillClass = 'danger'
  else if (pct < 45) fillClass = 'watch'

  const color = fillClass === 'safe'
    ? 'var(--status-safe)'
    : fillClass === 'watch'
      ? 'var(--status-watch)'
      : 'var(--status-danger)'

  return (
    <div
      className={`battery-wrapper ${className}`}
      role="meter"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${pct}% month runway remaining, ${daysLeft} days to go`}
    >
      <div className="battery-shell" aria-hidden="true">
        <div
          className="battery-level"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="battery-text">
        <strong>{pct}% left</strong>, {daysLeft}d to go
      </span>
    </div>
  )
}
