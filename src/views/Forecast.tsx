import { useApp } from '../state/store'
import { fmt, DAYS } from '../domain/selectors'
import { Ring } from '../components/Ring'
import { LineItem } from '../components/LineItem'

export default function Forecast() {
  const { s, sum } = useApp()

  const W = 360
  const H = 160
  const pad = { top: 20, right: 20, bottom: 30, left: 45 }

  const lines = [
    { name: 'Best case', val: sum.end.best, color: 'var(--status-safe)', dash: 'none' },
    { name: 'Expected', val: sum.end.exp, color: 'var(--marigold)', dash: 'none' },
    { name: 'Worst case', val: sum.end.worst, color: 'var(--status-danger)', dash: '3,3' }
  ] as const

  const allVals = [sum.safe, ...lines.map(l => l.val), 0]
  const maxVal = Math.max(...allVals, 500)
  const minVal = Math.min(...allVals, -500)
  const range = maxVal - minVal || 1

  const getY = (v: number) => pad.top + (1 - (v - minVal) / range) * (H - pad.top - pad.bottom)
  const zeroY = getY(0)

  // Prioritize action cards by lowest score
  const weakAreas = [...sum.parts].sort((a, b) => a.score - b.score)

  return (
    <section aria-labelledby="forecast-title">
      <div style={{ marginBottom: '16px' }}>
        <h2 id="forecast-title" style={{ margin: '0 0 4px' }}>Forecast & Financial Health</h2>
        <p className="text-mute" style={{ margin: 0, fontSize: '0.9rem' }}>
          Three-scenario projection to Day {DAYS} and health score breakdown.
        </p>
      </div>

      {/* Three-Scenario Chart Card */}
      <div className="card card-receipt perforated-top" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Month-End Projection Chart</h3>
          <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--ink-mute)' }}>
            Day {s.day} → {DAYS}
          </span>
        </div>

        {/* SVG Chart with Labelled Axes & Zero Line */}
        <div style={{ overflowX: 'auto', margin: '8px 0' }}>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            style={{ width: '100%', maxHeight: '200px', display: 'block' }}
            role="img"
            aria-label={`Month-end forecast chart: Best case ${fmt(sum.end.best)}, Expected ${fmt(sum.end.exp)}, Worst case ${fmt(sum.end.worst)}`}
          >
            {/* Zero threshold line */}
            <line
              x1={pad.left}
              y1={zeroY}
              x2={W - pad.right}
              y2={zeroY}
              stroke="var(--ink)"
              strokeDasharray="4,4"
              strokeWidth="1.5"
            />
            <text
              x={pad.left - 6}
              y={zeroY + 4}
              fontSize="10"
              fontFamily="var(--font-mono)"
              fill="var(--ink-mute)"
              textAnchor="end"
            >
              ₹0
            </text>

            {/* Y-axis ticks */}
            <text
              x={pad.left - 6}
              y={pad.top + 8}
              fontSize="9"
              fontFamily="var(--font-mono)"
              fill="var(--ink-mute)"
              textAnchor="end"
            >
              {fmt(Math.round(maxVal))}
            </text>
            <text
              x={pad.left - 6}
              y={H - pad.bottom}
              fontSize="9"
              fontFamily="var(--font-mono)"
              fill="var(--ink-mute)"
              textAnchor="end"
            >
              {fmt(Math.round(minVal))}
            </text>

            {/* X-axis base */}
            <line
              x1={pad.left}
              y1={H - pad.bottom}
              x2={W - pad.right}
              y2={H - pad.bottom}
              stroke="var(--ink-rule)"
              strokeWidth="1"
            />
            <text
              x={pad.left}
              y={H - pad.bottom + 14}
              fontSize="9"
              fontFamily="var(--font-mono)"
              fill="var(--ink-mute)"
              textAnchor="start"
            >
              Day {s.day}
            </text>
            <text
              x={W - pad.right}
              y={H - pad.bottom + 14}
              fontSize="9"
              fontFamily="var(--font-mono)"
              fill="var(--ink-mute)"
              textAnchor="end"
            >
              Day {DAYS}
            </text>

            {/* Scenario Projection Lines */}
            {lines.map(line => (
              <g key={line.name}>
                <line
                  x1={pad.left}
                  y1={getY(sum.safe)}
                  x2={W - pad.right}
                  y2={getY(line.val)}
                  stroke={line.color}
                  strokeWidth="3"
                  strokeDasharray={line.dash}
                />
                <circle
                  cx={W - pad.right}
                  cy={getY(line.val)}
                  r="4"
                  fill={line.color}
                  stroke="var(--ink)"
                  strokeWidth="1.5"
                />
              </g>
            ))}
          </svg>
        </div>

        {/* Legend / Scenarios List */}
        <hr className="dashed-rule" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
          {lines.map(line => (
            <div key={line.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
              <span style={{ display: 'inline-block', width: '12px', height: '4px', background: line.color, borderRadius: '2px' }} />
              <span style={{ fontWeight: 600 }}>{line.name}:</span>
              <span className="mono" style={{ fontWeight: 700 }}>{fmt(line.val)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Health Score Ring & Line Items */}
      <div className="card" style={{ padding: '20px' }}>
        <h3 style={{ margin: '0 0 16px' }}>Health Score Breakdown</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center' }}>
          <div style={{ flex: '0 0 auto', display: 'flex', justifyContent: 'center' }}>
            <Ring score={sum.health} size={120} label="Overall Health" />
          </div>

          <div style={{ flex: '1 1 260px' }}>
            {sum.parts.map(p => (
              <LineItem
                key={p.label}
                label={`${p.label} (${Math.round(p.weight * 100)}%)`}
                value={`${Math.round(p.score * 100)} / 100`}
                valueClassName={p.score >= 0.7 ? 'text-safe' : p.score >= 0.4 ? 'text-watch' : 'text-danger'}
              />
            ))}
          </div>
        </div>
      </div>

      {/* “Do This Next” Action Cards */}
      <div className="card" style={{ padding: '20px' }}>
        <h3 style={{ margin: '0 0 12px' }}>Do This Next (Action Plan)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
          {weakAreas.slice(0, 2).map((p, i) => {
            let advice = 'Keep daily spending close to your target allowance.'
            if (p.label === 'Runway coverage') {
              advice = 'Pause a non-essential subscription or curb non-essential shopping to rebuild cash cushion.'
            } else if (p.label === 'Discretionary buffer') {
              advice = 'Try a no-spend day this week to keep surplus positive through month-end.'
            } else if (p.label === 'Fixed commitments') {
              advice = 'Review active subscriptions in Plan to see which can be paused.'
            } else if (p.label === 'Savings velocity') {
              advice = 'Top up one of your goals from the Simulate tab when surplus allows.'
            }

            return (
              <div
                key={p.label}
                style={{
                  background: 'var(--paper-card-subtle)',
                  border: 'var(--border-ink)',
                  borderRadius: 'var(--r-sm)',
                  padding: '12px 14px',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '1rem' }}>{i === 0 ? '⚡' : '📌'}</span>
                  <strong style={{ fontSize: '0.92rem' }}>Focus: {p.label}</strong>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--ink-mute)' }}>
                  {advice}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
