import { useApp } from '../state/store'
import { fmt } from '../domain/selectors'
import { Stamp } from '../components/Stamp'
import { LineItem } from '../components/LineItem'

export default function Goals() {
  const { s, sum } = useApp()

  return (
    <section aria-labelledby="goals-title">
      <div style={{ marginBottom: '16px' }}>
        <h2 id="goals-title" style={{ margin: '0 0 4px' }}>Savings Goals</h2>
        <p className="text-mute" style={{ margin: 0, fontSize: '0.9rem' }}>
          Track progress toward your target milestones and projected completion timelines.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {s.goals.map(g => {
          const m = sum.goalMonths[g.id]
          const isReached = g.saved >= g.target
          const pct = Math.min(100, Math.round((g.saved / g.target) * 100))

          let paceChipText = `~${m} month${m > 1 ? 's' : ''}`
          let chipColor = 'var(--paper-card-subtle)'
          if (isReached) {
            paceChipText = 'Target Reached!'
            chipColor = 'var(--status-safe-bg)'
          } else if (m === Infinity) {
            paceChipText = 'Pacing delayed'
            chipColor = 'var(--status-danger-bg)'
          }

          return (
            <div key={g.id} className="card card-receipt" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{g.name}</h3>
                {isReached ? (
                  <Stamp level="REACHED" />
                ) : (
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: 'var(--r-sm)',
                      background: chipColor,
                      border: '1px solid var(--ink-rule)'
                    }}
                  >
                    {paceChipText}
                  </span>
                )}
              </div>

              {/* Thick Progress Bar */}
              <div
                className="progress-container"
                style={{ height: '18px', margin: '10px 0' }}
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${g.name} progress: ${pct}%`}
              >
                <div
                  className="progress-fill"
                  style={{
                    width: `${pct}%`,
                    background: isReached ? 'var(--status-safe)' : 'var(--marigold)'
                  }}
                />
              </div>

              {/* Progress Line Items */}
              <LineItem
                label="Amount saved"
                value={`${fmt(g.saved)} of ${fmt(g.target)} (${pct}%)`}
                valueClassName={isReached ? 'text-safe' : ''}
              />
              <LineItem
                label="Monthly allocation"
                value={`${fmt(g.monthly)}/mo`}
              />

              <div style={{ marginTop: '10px', fontSize: '0.85rem', color: 'var(--ink-mute)' }}>
                {isReached
                  ? '🎉 Congratulations! You have fully funded this goal.'
                  : m === Infinity
                    ? 'Current discretionary burn leaves zero month-end surplus to advance this goal.'
                    : `Estimated completion in ~${m} month${m > 1 ? 's' : ''} with current projected surplus.`}
              </div>
            </div>
          )
        })}
      </div>

      <div className="card" style={{ padding: '16px', background: 'var(--paper-card-subtle)', textAlign: 'center', marginTop: '16px' }}>
        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--ink)' }}>
          💡 <strong>Want to save more?</strong> Open the <strong>Simulate</strong> tab and choose <em>"Add to a goal"</em> to deposit cash safely.
        </p>
      </div>
    </section>
  )
}
