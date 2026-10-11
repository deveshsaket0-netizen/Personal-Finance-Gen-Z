import { useState } from 'react'
import { useApp } from '../state/store'
import { fmt, DAYS } from '../domain/selectors'
import { SHOCKS } from '../domain/seed'
import { Stamp } from '../components/Stamp'
import { LineItem } from '../components/LineItem'
import { Battery } from '../components/Battery'
import { CountUp } from '../components/CountUp'
import { useToast } from '../components/Toast'

export default function Home() {
  const { s, sum, dispatch } = useApp()
  const { showToast } = useToast()
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  const isMonthComplete = s.day >= DAYS
  const nextDue = s.bills.filter(b => b.active && !b.paid).sort((a, b) => a.due - b.due)[0]
  const paidBillsTotal = s.bills.filter(b => b.paid).reduce((acc, b) => acc + b.amount, 0)
  const remainingDuesTotal = s.bills.filter(b => b.active && !b.paid).reduce((acc, b) => acc + b.amount, 0)
  const goalsSavedTotal = s.goals.reduce((acc, g) => acc + g.saved, 0)
  const discSpendTotal = s.txs.filter(t => !['Bills', 'Habit'].includes(t.cat)).reduce((acc, t) => acc + t.amount, 0)
  const shocksCount = s.txs.filter(t => t.cat === 'Shock').length

  const days = Array.from({ length: DAYS }, (_, i) => i + 1)
  const activeSelectedDues = selectedDay ? s.bills.filter(b => b.due === selectedDay) : []

  // Friendly microcopy
  let microcopy = `You're good till day ${DAYS}`
  if (sum.risk === 'Critical' || sum.end.exp < 0) {
    microcopy = `Tight runway: finishing in the red unless spend drops`
  } else if (sum.risk === 'Watch') {
    microcopy = `Watch the next few days: commitments due soon`
  }

  const handleNextDay = () => {
    dispatch({ t: 'next' })
    showToast(`Advanced to Day ${s.day + 1}.`, 'info')
  }

  const handleCurveball = () => {
    const k = SHOCKS[Math.floor(Math.random() * SHOCKS.length)]
    dispatch({ t: 'commit', d: { kind: 'shock', ...k } })
    showToast(`Curveball: ${k.label} (${fmt(k.amount)})`, 'warn')
  }

  const handleIncome = () => {
    dispatch({ t: 'income', amount: 1000 })
    showToast(`+₹1,000 income added. Balance now ${fmt(s.balance + 1000)}`, 'success')
  }

  const handleReset = () => {
    dispatch({ t: 'reset' })
    showToast(`Runway reset to Day 1.`, 'info')
  }

  return (
    <section aria-labelledby="receipt-header">
      {/* Till Slip Header */}
      <div className="card till-header-card" style={{ textAlign: 'center', marginBottom: '12px' }}>
        <div className="till-header-title">
          ★ RUNWAY · TILL #01 · DAY {s.day} OF {DAYS} ★
        </div>
        <div className="till-header-sub">
          {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} · Cash & Commitments Pacing
        </div>
      </div>

      {/* Month Complete Summary (shown when Day >= 30) */}
      {isMonthComplete ? (
        <div className="card card-receipt perforated-top perforated-bottom" aria-live="polite">
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '2.4rem', lineHeight: 1 }} aria-hidden="true">🎉</span>
            <h2 id="receipt-header" style={{ margin: '8px 0 4px', fontSize: '1.4rem' }}>Final Statement</h2>
            <p className="text-mute" style={{ margin: 0, fontSize: '0.9rem' }}>
              {s.balance >= 0
                ? 'Congratulations! You made your ₹10,000 budget last the full 30 days.'
                : `Month closed. You exceeded your ₹10,000 limit by ${fmt(Math.abs(s.balance))}.`}
            </p>
          </div>

          <hr className="dashed-rule" />

          <div style={{ padding: '4px 0' }}>
            <LineItem label="Ending cash balance" value={fmt(s.balance)} valueClassName={s.balance >= 0 ? 'text-safe' : 'text-danger'} />
            <LineItem label="Final health score" value={`${sum.health} / 100`} />
            <LineItem label="Total commitments cleared" value={fmt(paidBillsTotal)} />
            <LineItem label="Savings funded" value={fmt(goalsSavedTotal)} valueClassName="text-safe" />
            <LineItem label="Discretionary living spend" value={fmt(discSpendTotal)} />
            <LineItem label="Unexpected curveballs" value={`${shocksCount} shock${shocksCount === 1 ? '' : 's'}`} />
          </div>

          <hr className="dashed-rule" />

          <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--ink-mute)', padding: '8px 0' }}>
            *** THANK YOU · SEE YOU NEXT MONTH ***
          </div>

          <div className="row" style={{ marginTop: '16px', justifyContent: 'center' }}>
            <button type="button" onClick={handleReset}>Start a new month</button>
          </div>
        </div>
      ) : (
        /* Regular Hero Summary Receipt Card */
        <div className="card card-receipt perforated-top perforated-bottom" aria-live="polite">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <span className="text-mute" style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Safe to spend
              </span>
              <div style={{ fontSize: '2.8rem', fontWeight: 700, lineHeight: 1.1, fontFamily: 'var(--font-mono)', margin: '4px 0' }}>
                <CountUp value={sum.safe} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                <span className="mono" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ink)' }}>
                  {fmt(sum.allowance)}/day
                </span>
                <span className="text-mute" style={{ fontSize: '0.85rem' }}>
                  for {sum.daysLeft} days
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
              <Stamp level={sum.risk} />
              <Battery daysLeft={sum.daysLeft} totalDays={DAYS} />
            </div>
          </div>

          <div style={{ marginTop: '10px', fontSize: '0.9rem', color: 'var(--ink-mute)', fontStyle: 'italic' }}>
            "{microcopy}"
          </div>

          <hr className="dashed-rule" />

          {/* Dotted Line Item Breakdown */}
          <div style={{ padding: '2px 0' }}>
            <LineItem label="Bank balance" value={fmt(s.balance)} />
            <LineItem label="Upcoming dues reserved" value={fmt(remainingDuesTotal)} subtext={nextDue ? `Next: ${nextDue.name} on day ${nextDue.due}` : 'All dues clear'} />
            <LineItem label="Smoothed daily burn" value={`${fmt(sum.burn)}/day`} />
            <LineItem label="Financial health" value={`${sum.health}/100`} />
          </div>
        </div>
      )}

      {/* 30-Day Runway Punch-Card / Timeline */}
      <div className="card" style={{ padding: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
          <div>
            <strong style={{ fontSize: '0.95rem' }}>30-Day Runway Punch-Card</strong>
            <span className="text-mute" style={{ display: 'block', fontSize: '0.78rem' }}>
              {selectedDay
                ? `Day ${selectedDay}: ${activeSelectedDues.length ? activeSelectedDues.map(b => `${b.name} (${fmt(b.amount)})`).join(', ') : 'No commitments'}`
                : nextDue ? `Next commitment: ${nextDue.name} on Day ${nextDue.due}` : 'All commitments cleared!'}
            </span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--ink-mute)' }}>
            Day {s.day} of {DAYS}
          </div>
        </div>

        {/* Timeline Horizontal Strip */}
        <div
          tabIndex={0}
          role="region"
          aria-label="30-day timeline strip"
          style={{
            display: 'flex',
            gap: '5px',
            overflowX: 'auto',
            paddingBottom: '8px',
            scrollbarWidth: 'thin',
            maxWidth: '100%'
          }}
        >
          {days.map(d => {
            const dueBills = s.bills.filter(b => b.due === d)
            const hasDue = dueBills.length > 0
            const isPaid = hasDue && dueBills.every(b => b.paid)
            const isUpcoming = hasDue && dueBills.some(b => !b.paid && b.active)
            const isCurrent = d === s.day
            const isPast = d < s.day
            const isSelected = d === selectedDay

            const dueAria = hasDue
              ? `Day ${d}${isCurrent ? ', Today' : ''}: ` + dueBills.map(b => `${b.name}, ${fmt(b.amount)}, ${b.paid ? 'paid' : b.active ? 'upcoming' : 'paused'}`).join('; ')
              : `Day ${d}${isCurrent ? ', Today' : ''}, no commitments`

            return (
              <button
                key={d}
                type="button"
                style={{
                  flex: '0 0 34px',
                  height: '50px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 'var(--r-xs)',
                  background: isCurrent ? 'var(--marigold)' : 'var(--paper-card)',
                  color: 'var(--ink)',
                  border: isSelected ? '2px solid var(--ink)' : '1px solid var(--ink-rule)',
                  boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                  padding: '2px',
                  cursor: 'pointer',
                  opacity: isPast && !isCurrent ? 0.6 : 1,
                  minHeight: '44px'
                }}
                title={dueAria}
                onClick={() => setSelectedDay(selectedDay === d ? null : d)}
                aria-label={dueAria}
              >
                <span style={{ fontSize: '0.75rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{d}</span>
                {hasDue && (
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      lineHeight: 1,
                      marginTop: '2px',
                      color: isPaid ? 'var(--status-safe)' : isUpcoming ? 'var(--status-watch)' : 'var(--ink-mute)'
                    }}
                    aria-hidden="true"
                  >
                    {isPaid ? '✓' : isUpcoming ? '▲' : '⏸'}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', color: 'var(--ink-mute)', marginTop: '8px', flexWrap: 'wrap' }}>
          <span><strong style={{ color: 'var(--status-watch)' }}>▲</strong> Upcoming due</span>
          <span><strong style={{ color: 'var(--status-safe)' }}>✓</strong> Paid</span>
          <span><strong style={{ color: 'var(--ink-mute)' }}>⏸</strong> Paused</span>
          <span><span style={{ display: 'inline-block', width: '10px', height: '10px', background: 'var(--marigold)', border: '1px solid var(--ink)', verticalAlign: 'middle', marginRight: '4px' }} /> Today (Day {s.day})</span>
        </div>
      </div>

      {/* Sticky Quick-Action Bar */}
      <div className="card" style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-mute)', letterSpacing: '0.05em', marginBottom: '8px' }}>
          Quick Actions
        </div>
        <div className="quick-actions-grid">
          <button
            type="button"
            className="btn-primary"
            onClick={handleNextDay}
            disabled={s.day >= DAYS}
          >
            Next day →
          </button>
          <button
            type="button"
            className="ghost"
            onClick={handleCurveball}
            disabled={s.day >= DAYS}
          >
            🎲 Curveball
          </button>
          <button
            type="button"
            className="ghost"
            onClick={handleIncome}
          >
            +₹1,000 side gig
          </button>
          <button
            type="button"
            className="ghost"
            onClick={handleReset}
            title="Reset to Day 1"
          >
            Reset
          </button>
        </div>
      </div>
    </section>
  )
}
