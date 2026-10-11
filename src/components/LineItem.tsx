import React from 'react'

interface LineItemProps {
  label: string
  value: React.ReactNode
  subtext?: string
  valueClassName?: string
  className?: string
}

export function LineItem({ label, value, subtext, valueClassName = '', className = '' }: LineItemProps) {
  return (
    <div className={`line-item ${className}`}>
      <span className="line-item-label">
        {label}
        {subtext && <small className="text-faint" style={{ display: 'block', fontSize: '0.75rem' }}>{subtext}</small>}
      </span>
      <span className="line-item-leader" aria-hidden="true" />
      <span className={`line-item-value ${valueClassName}`}>
        {value}
      </span>
    </div>
  )
}
