import { useState } from 'react'
import { useApp } from '../state/store'
import { fmt } from '../domain/selectors'
import type { Cat } from '../domain/types'
import { LineItem } from '../components/LineItem'
import { useToast } from '../components/Toast'

const CATS: Cat[] = ['Food', 'Transport', 'Fun', 'Shopping', 'Other']

export default function Spend() {
  const { s, dispatch } = useApp()
  const { showToast } = useToast()
  const [label, setLabel] = useState('')
  const [amt, setAmt] = useState('')
  const [cat, setCat] = useState<Cat>('Food')
  const [need, setNeed] = useState(false)

  // Totals by category
  const totals = Object.entries(
    s.txs.reduce<Record<string, number>>((m, t) => ({ ...m, [t.cat]: (m[t.cat] || 0) + t.amount }), {})
  )
  const maxCategory = Math.max(1, ...totals.map(t => t[1]))

  // Needs vs Wants split
  const needsTotal = s.txs.filter(t => t.need).reduce((sum, t) => sum + t.amount, 0)
  const wantsTotal = s.txs.filter(t => !t.need).reduce((sum, t) => sum + t.amount, 0)
  const totalSpend = needsTotal + wantsTotal
  const needPct = totalSpend > 0 ? Math.round((needsTotal / totalSpend) * 100) : 0
  const wantPct = totalSpend > 0 ? 100 - needPct : 0

  const submit = () => {
    const a = Number(amt)
    if (a > 0) {
      const expLabel = label.trim() || cat
      dispatch({ t: 'log', label: expLabel, amount: a, cat, need })
      showToast(`${expLabel} (${fmt(a)}) logged to ${cat}`, 'info')
      setAmt('')
      setLabel('')
      setNeed(false)
    }
  }

  return (
    <section aria-labelledby="spend-title">
      <div style={{ marginBottom: '16px' }}>
        <h2 id="spend-title" style={{ margin: '0 0 4px' }}>Spend Log & Categorization</h2>
        <p className="text-mute" style={{ margin: 0, fontSize: '0.9rem' }}>
          Record everyday expenses to keep the burn rate and daily allowance synchronized.
        </p>
      </div>

      {/* Pinned Add Expense Form Card */}
      <div className="card card-receipt" style={{ padding: '20px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
          Log Line Item (Day {s.day})
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <label>
            Description
            <input
              type="text"
              placeholder="e.g. Chai, Groceries, Auto fare"
              value={label}
              onChange={e => setLabel(e.target.value)}
            />
          </label>

          <label>
            Amount (₹)
            <input
              type="number"
              min="1"
              inputMode="numeric"
              placeholder="e.g. 150"
              value={amt}
              onChange={e => setAmt(e.target.value)}
            />
          </label>

          <label>
            Category
            <select value={cat} onChange={e => setCat(e.target.value as Cat)}>
              {CATS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <label className="inline" style={{ marginTop: '16px', cursor: 'pointer' }}>
              <input type="checkbox" checked={need} onChange={e => setNeed(e.target.checked)} />
              <span>Essential Need (vs discretionary Want)</span>
            </label>
          </div>
        </div>

        <div style={{ marginTop: '16px' }}>
          <button type="button" className="btn-primary" onClick={submit} style={{ width: '100%' }}>
            Add Line Item to Receipt 💸
          </button>
        </div>
      </div>

      {/* Need vs Want Split Bar */}
      <div className="card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Need vs Want Split</h3>
          <span className="mono" style={{ fontSize: '0.85rem' }}>
            {fmt(needsTotal)} need / {fmt(wantsTotal)} want
          </span>
        </div>

        <div
          style={{
            height: '18px',
            display: 'flex',
            borderRadius: 'var(--r-xs)',
            overflow: 'hidden',
            border: 'var(--border-ink)'
          }}
          role="progressbar"
          aria-valuenow={needPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Needs: ${needPct}%, Wants: ${wantPct}%`}
        >
          <div
            style={{
              width: `${needPct}%`,
              background: 'var(--status-safe)',
              transition: 'width 0.3s ease'
            }}
            title={`Needs: ${fmt(needsTotal)} (${needPct}%)`}
          />
          <div
            style={{
              width: `${wantPct}%`,
              background: 'var(--marigold)',
              transition: 'width 0.3s ease'
            }}
            title={`Wants: ${fmt(wantsTotal)} (${wantPct}%)`}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--ink-mute)', marginTop: '6px' }}>
          <span><strong style={{ color: 'var(--status-safe)' }}>■</strong> Needs: {needPct}%</span>
          <span><strong style={{ color: 'var(--marigold)' }}>■</strong> Wants: {wantPct}%</span>
        </div>
      </div>

      {/* Category Breakdown with Proportional Line Bars */}
      <div className="card" style={{ padding: '20px' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: '1.05rem' }}>Spending by Category</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {totals.map(([c, v]) => {
            const pct = Math.round((v / maxCategory) * 100)
            return (
              <div key={c} style={{ padding: '2px 0' }}>
                <LineItem label={c} value={fmt(v)} />
                <div
                  style={{
                    height: '6px',
                    background: 'var(--paper-card-subtle)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                    border: '1px solid var(--ink-rule)'
                  }}
                >
                  <div style={{ height: '100%', width: `${pct}%`, background: 'var(--ink)' }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent Till Transactions Slip */}
      <div className="card card-receipt perforated-bottom" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Recent Line Items</h3>
          <span className="text-mute" style={{ fontSize: '0.8rem' }}>Last 12 entries</span>
        </div>
        <hr className="dashed-rule" />

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {[...s.txs].reverse().slice(0, 12).map(t => (
            <LineItem
              key={t.id}
              label={`Day ${t.day} · ${t.label}`}
              subtext={`${t.cat} · ${t.need ? 'essential need' : 'want'}`}
              value={fmt(t.amount)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
