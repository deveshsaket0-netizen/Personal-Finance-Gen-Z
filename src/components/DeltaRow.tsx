import React from 'react'

interface DeltaRowProps {
  label: string
  now: string | number
  after: string | number
  deltaText?: string
  deltaType?: 'better' | 'worse' | 'neutral'
}

export function DeltaRow({ label, now, after, deltaText, deltaType = 'neutral' }: DeltaRowProps) {
  let deltaColor = 'var(--ink-mute)'
  let arrow = ''

  if (deltaType === 'better') {
    deltaColor = 'var(--status-safe)'
    arrow = '▲'
  } else if (deltaType === 'worse') {
    deltaColor = 'var(--status-danger)'
    arrow = '▼'
  }

  return (
    <tr style={{ borderBottom: '1px dotted var(--ink-rule)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
      <td style={{ padding: '6px 3px', fontWeight: 600, color: 'var(--ink)' }}>{label}</td>
      <td style={{ padding: '6px 3px', textAlign: 'right', color: 'var(--ink-mute)', fontVariantNumeric: 'tabular-nums' }}>{now}</td>
      <td style={{ padding: '6px 3px', textAlign: 'right', fontWeight: 700, color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>{after}</td>
      <td style={{ padding: '6px 3px', textAlign: 'right', color: deltaColor, fontWeight: 600 }}>
        {arrow && <span aria-hidden="true" style={{ marginRight: '2px' }}>{arrow}</span>}
        <span>{deltaText || '—'}</span>
      </td>
    </tr>
  )
}
