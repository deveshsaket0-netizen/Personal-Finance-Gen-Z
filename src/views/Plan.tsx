import { useState } from 'react'
import { useApp } from '../state/store'
import { fmt, DAYS } from '../domain/selectors'
import { useToast } from '../components/Toast'

export default function Plan() {
  const { s, dispatch } = useApp()
  const { showToast } = useToast()
  const [highlightDay, setHighlightDay] = useState<number | null>(null)

  const list = [...s.bills].sort((a, b) => a.due - b.due)
  const days = Array.from({ length: DAYS }, (_, i) => i + 1)
  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  const handleToggleBill = (id: number, name: string, active: boolean) => {
    dispatch({ t: 'commit', d: { kind: 'pauseSub', id } })
    showToast(active ? `Paused ${name}. Dues reduced.` : `Resumed ${name}. Added back to commitments.`, 'info')
  }

  return (
    <section aria-labelledby="plan-title">
      <div style={{ marginBottom: '16px' }}>
        <h2 id="plan-title" style={{ margin: '0 0 4px' }}>Commitments & Subscriptions Plan</h2>
        <p className="text-mute" style={{ margin: 0, fontSize: '0.9rem' }}>
          Fixed monthly expenses, due dates calendar, and subscription controls.
        </p>
      </div>

      {/* 30-Day Upcoming Dues Calendar */}
      <div className="card card-receipt" style={{ padding: '16px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Upcoming Dues Calendar</h3>
          <span className="mono" style={{ fontSize: '0.82rem', color: 'var(--ink-mute)' }}>
            {s.bills.filter(b => b.active && !b.paid).length} active commitment{s.bills.filter(b => b.active && !b.paid).length === 1 ? '' : 's'} remaining
          </span>
        </div>

        {/* Weekday column headers */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
            textAlign: 'center',
            fontSize: '0.75rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            color: 'var(--ink-mute)',
            marginBottom: '6px',
            gap: '4px'
          }}
          aria-hidden="true"
        >
          {weekdays.map(w => <span key={w}>{w}</span>)}
        </div>

        {/* 30-Day Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
            gap: '4px'
          }}
          role="grid"
          aria-label="30-day commitments calendar"
        >
          {days.map(d => {
            const dayBills = s.bills.filter(b => b.due === d)
            const isToday = d === s.day
            const isPast = d < s.day
            const isHighlighted = highlightDay === d

            const cellAria = `Day ${d}${isToday ? ', Today' : ''}: ` +
              (dayBills.length > 0
                ? dayBills.map(b => `${b.name}, ${fmt(b.amount)}, ${b.paid ? 'paid' : b.active ? 'upcoming' : 'paused'}`).join('; ')
                : 'no commitments')

            return (
              <button
                key={d}
                type="button"
                style={{
                  background: isToday ? 'var(--marigold-faint)' : 'var(--paper-card)',
                  border: isHighlighted
                    ? '2px solid var(--marigold)'
                    : isToday
                      ? '2px solid var(--ink)'
                      : '1px solid var(--ink-rule)',
                  borderRadius: 'var(--r-xs)',
                  minHeight: '48px',
                  padding: '4px',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  minWidth: 0,
                  overflow: 'hidden',
                  opacity: isPast && !isToday ? 0.6 : 1,
                  boxShadow: isHighlighted ? 'var(--shadow-sm)' : 'none'
                }}
                onClick={() => setHighlightDay(highlightDay === d ? null : d)}
                aria-label={cellAria}
                title={cellAria}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--ink)' }}>
                    {d}
                  </span>
                  {isToday && (
                    <span style={{ fontSize: '0.58rem', background: 'var(--ink)', color: 'var(--paper-card)', borderRadius: '2px', padding: '1px 3px', fontWeight: 700 }}>
                      Now
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                  {dayBills.map(b => (
                    <div
                      key={b.id}
                      style={{
                        fontSize: '0.62rem',
                        fontFamily: 'var(--font-mono)',
                        borderRadius: '2px',
                        padding: '1px 3px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '2px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        background: b.paid
                          ? 'var(--status-safe-bg)'
                          : b.active
                            ? 'var(--status-watch-bg)'
                            : 'var(--paper-card-subtle)',
                        color: b.paid
                          ? 'var(--status-safe)'
                          : b.active
                            ? 'var(--status-watch)'
                            : 'var(--ink-mute)',
                        textDecoration: b.paid ? 'line-through' : 'none'
                      }}
                      title={`${b.name} (${fmt(b.amount)})`}
                    >
                      <span aria-hidden="true">{b.paid ? '✓' : b.active ? '▲' : '⏸'}</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{fmt(b.amount)}</span>
                    </div>
                  ))}
                </div>
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', color: 'var(--ink-mute)', marginTop: '10px', flexWrap: 'wrap' }}>
          <span><strong style={{ color: 'var(--status-watch)' }}>▲</strong> Active due</span>
          <span><strong style={{ color: 'var(--status-safe)' }}>✓</strong> Paid & cleared</span>
          <span><strong style={{ color: 'var(--ink-mute)' }}>⏸</strong> Paused subscription</span>
        </div>
      </div>

      {/* Subscription & Commitment Toggle Cards */}
      <div style={{ marginTop: '20px' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: '1.1rem' }}>Commitments & Subscriptions</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {list.map(b => {
            const isPastDue = b.due <= s.day
            const canToggle = !b.paid && !isPastDue
            const isHighlighted = highlightDay === b.due

            return (
              <div
                key={b.id}
                className="card"
                style={{
                  padding: '14px 16px',
                  margin: 0,
                  border: isHighlighted ? '2px solid var(--marigold)' : 'var(--border-ink)',
                  background: 'var(--paper-card)',
                  boxShadow: isHighlighted ? 'var(--shadow-md)' : 'var(--shadow-sm)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '1rem' }}>{b.name}</strong>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontFamily: 'var(--font-mono)',
                          padding: '2px 6px',
                          borderRadius: 'var(--r-xs)',
                          border: '1px solid var(--ink-rule)',
                          background: b.paid
                            ? 'var(--status-safe-bg)'
                            : b.active
                              ? 'var(--status-watch-bg)'
                              : 'var(--paper-card-subtle)',
                          color: b.paid
                            ? 'var(--status-safe)'
                            : b.active
                              ? 'var(--status-watch)'
                              : 'var(--ink-mute)'
                        }}
                      >
                        {b.paid ? '✓ Paid' : b.active ? '▲ Due Day ' + b.due : '⏸ Paused'}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: 'var(--ink-mute)', marginTop: '4px' }}>
                      {b.paid ? (
                        <span>Charged {fmt(b.amount)}, renews next month.</span>
                      ) : b.active ? (
                        <span><strong>{fmt(b.amount)}</strong> · saves {fmt(b.amount)} if paused before day {b.due}.</span>
                      ) : (
                        <span>Paused · ₹0 charged this cycle (saves {fmt(b.amount)}).</span>
                      )}
                    </div>
                  </div>

                  <div>
                    {canToggle ? (
                      <button
                        type="button"
                        className={b.active ? 'ghost' : 'btn-primary'}
                        style={{ minHeight: '38px', padding: '6px 14px', fontSize: '0.85rem' }}
                        onClick={() => handleToggleBill(b.id, b.name, b.active)}
                      >
                        {b.active ? 'Pause' : 'Resume'}
                      </button>
                    ) : (
                      <span className="mono text-mute" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                        {fmt(b.amount)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
