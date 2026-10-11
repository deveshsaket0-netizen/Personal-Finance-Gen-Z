import React from 'react'

interface RingProps {
  score: number // 0 to 100
  size?: number
  strokeWidth?: number
  label?: string
}

export function Ring({ score, size = 110, strokeWidth = 10, label = 'Health Score' }: RingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(100, score))
  const offset = circumference - (clamped / 100) * circumference

  let color = 'var(--status-safe)'
  if (clamped < 40) color = 'var(--status-danger)'
  else if (clamped < 70) color = 'var(--status-watch)'

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${label}: ${clamped} out of 100`}
    >
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--paper-card-subtle)"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: 'stroke-dashoffset 0.4s ease' }}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-mono)'
          }}
        >
          <span style={{ fontSize: '1.4rem', fontWeight: 700, lineHeight: 1 }}>{clamped}</span>
          <span style={{ fontSize: '0.65rem', color: 'var(--ink-mute)', textTransform: 'uppercase' }}>/ 100</span>
        </div>
      </div>
      <span style={{ marginTop: '6px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--ink-mute)' }}>
        {label}
      </span>
    </div>
  )
}
