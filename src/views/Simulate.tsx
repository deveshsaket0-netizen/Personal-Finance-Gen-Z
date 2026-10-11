import { useState, useEffect, useRef } from 'react'
import { useApp } from '../state/store'
import { simulate, simulateWait } from '../domain/simulate'
import type { SimResult } from '../domain/simulate'
import type { Decision } from '../domain/types'
import { fmt, DAYS } from '../domain/selectors'
import { DeltaRow } from '../components/DeltaRow'
import { Stamp } from '../components/Stamp'
import { useToast } from '../components/Toast'

type Kind = Decision['kind']

export default function Simulate() {
   const { s, dispatch } = useApp()
   const { showToast } = useToast()
   const [kind, setKind] = useState<Kind>('purchase')
   const [label, setLabel] = useState(() => {
      return typeof window !== 'undefined' ? (new URLSearchParams(window.location.search).get('label') || '') : ''
   })
   const [amt, setAmt] = useState(() => {
      return typeof window !== 'undefined' ? (new URLSearchParams(window.location.search).get('amt') || '') : ''
   })
   const [ref, setRef] = useState(0)
   const [res, setRes] = useState<{ d: Decision; r: SimResult } | null>(null)
   const [waitDay, setWaitDay] = useState<number>(Math.min(s.day + 5, DAYS))
   const resultSlipRef = useRef<HTMLDivElement>(null)

   const a = Number(amt)
   const l = label || 'Untitled'
   const subs = s.bills.filter(b => b.kind === 'subscription' && !b.paid)
   const subId = subs.some(b => b.id === ref) ? ref : subs[0]?.id
   const goalId = s.goals.some(g => g.id === ref) ? ref : s.goals[0]?.id

   const build = (): Decision | null => {
      switch (kind) {
         case 'purchase': return a > 0 ? { kind, label: l, amount: a, cat: 'Shopping', need: false } : null
         case 'subscription': return a > 0 ? { kind, label: l, amount: a } : null
         case 'habit': return a > 0 ? { kind, label: l, perDay: a } : null
         case 'shock': return a > 0 ? { kind, label: l, amount: a } : null
         case 'goal': return a > 0 && a <= s.balance && goalId !== undefined ? { kind, id: goalId, amount: a } : null
         case 'pauseSub': return subId !== undefined ? { kind, id: subId } : null
      }
   }

   const run = () => {
      const d = build()
      if (d) {
         const r = simulate(s, d)
         setRes({ d, r })
         setTimeout(() => {
            resultSlipRef.current?.focus()
         }, 50)
      } else {
         setRes(null)
      }
   }

   const changeKind = (k: Kind) => {
      setKind(k)
      setRef(0)
      setRes(null)
   }

   useEffect(() => {
      if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('run') === '1') {
         const d = build()
         if (d) setRes({ d, r: simulate(s, d) })
      }
   }, [])

   const handleCommit = () => {
      if (!res) return
      const decisionLabel = ('label' in res.d ? res.d.label : '') || (res.d.kind === 'goal' ? 'Goal contribution' : 'Subscription update')
      const newAllowance = fmt(res.r.after.allowance)
      dispatch({ t: 'commit', d: res.d })
      showToast(`${decisionLabel} printed. Allowance now ${newAllowance}/day`, 'success')
      setRes(null)
      setAmt('')
      setLabel('')
   }

   const needsName = kind === 'purchase' || kind === 'subscription' || kind === 'habit' || kind === 'shock'
   const safeWaitDay = Math.max(s.day + 1, Math.min(waitDay, DAYS))
   const isWaitApplicable = Boolean(res && (res.d.kind === 'purchase' || res.d.kind === 'subscription') && s.day < DAYS)
   const w = isWaitApplicable && res ? simulateWait(s, res.d, safeWaitDay) : null
   const gap = w ? Math.abs(w.endNow - w.endLater) < 1 : true
   const dues = w ? w.cleared.reduce((t, b) => t + b.amount, 0) : 0

   // Calculate delta descriptions
   const allowanceDiff = res ? res.r.after.allowance - res.r.before.allowance : 0
   const endDiff = res ? res.r.after.end.exp - res.r.before.end.exp : 0
   const healthDiff = res ? res.r.after.health - res.r.before.health : 0

   return (
      <section aria-labelledby="sim-title">
         <div style={{ marginBottom: '16px' }}>
            <h2 id="sim-title" style={{ margin: '0 0 4px' }}>Simulate Before You Spend</h2>
            <p className="text-mute" style={{ margin: 0, fontSize: '0.9rem' }}>
               Test a purchase, subscription, or curveball before committing money.
            </p>
         </div>

         <div className="simulate-layout">
            {/* Form Column */}
            <div className="card">
               <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
                  Input Parameters
               </div>

               <label>
                  Decision Type
                  <select value={kind} onChange={e => changeKind(e.target.value as Kind)}>
                     <option value="purchase">One-time purchase</option>
                     <option value="subscription">New subscription</option>
                     <option value="habit">Daily habit</option>
                     <option value="pauseSub">Pause a subscription</option>
                     <option value="goal">Add to a goal</option>
                     <option value="shock">Stress test: shock</option>
                  </select>
               </label>

               {needsName && (
                  <label>
                     Item / Description
                     <input
                        type="text"
                        placeholder="e.g. Sneakers, Books, Cloud backup"
                        value={label}
                        onChange={e => setLabel(e.target.value)}
                     />
                  </label>
               )}

               {kind === 'pauseSub' && (
                  subs.length ? (
                     <label>
                        Subscription to Pause
                        <select value={subId} onChange={e => setRef(+e.target.value)}>
                           {subs.map(b => (
                              <option key={b.id} value={b.id}>{b.name} ({fmt(b.amount)})</option>
                           ))}
                        </select>
                     </label>
                  ) : (
                     <p className="text-mute">All subscriptions are already paused or paid.</p>
                  )
               )}

               {kind === 'goal' && (
                  <label>
                     Goal
                     <select value={goalId} onChange={e => setRef(+e.target.value)}>
                        {s.goals.map(g => (
                           <option key={g.id} value={g.id}>{g.name} ({fmt(g.saved)} / {fmt(g.target)})</option>
                        ))}
                     </select>
                  </label>
               )}

               {kind !== 'pauseSub' && (
                  <label>
                     Amount (₹)
                     <input
                        type="number"
                        min="1"
                        inputMode="numeric"
                        placeholder="e.g. 500"
                        value={amt}
                        onChange={e => setAmt(e.target.value)}
                     />
                     {kind === 'goal' && a > s.balance && (
                        <span role="alert" className="text-danger" style={{ fontSize: '0.8rem', marginTop: '2px' }}>
                           Available cash is only {fmt(s.balance)}.
                        </span>
                     )}
                  </label>
               )}

               <div style={{ marginTop: '16px' }}>
                  <button type="button" className="btn-primary" onClick={run} style={{ width: '100%' }}>
                     Print Simulation Slip ⚡
                  </button>
               </div>
            </div>

            {/* Result Column (Printed Receipt Slip) */}
            <div aria-live="polite">
               {res ? (
                  <div
                     ref={resultSlipRef}
                     tabIndex={-1}
                     className="card card-receipt printed-slip perforated-top perforated-bottom"
                  >
                     <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--ink-mute)', letterSpacing: '0.1em' }}>
                           *** RUNWAY SIMULATION TILL SLIP ***
                        </div>
                        <h3 style={{ margin: '4px 0 2px', fontSize: '1.2rem' }}>
                           {('label' in res.d ? res.d.label : '') || (res.d.kind === 'goal' ? 'Goal Contribution' : res.d.kind)}
                        </h3>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--ink-faint)' }}>
                           Simulated on Day {s.day} · Status: PREVIEW
                        </div>
                     </div>

                     <hr className="dashed-rule" />

                     {/* Delta Comparison Table */}
                     <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '14px' }}>
                        <thead>
                           <tr style={{ borderBottom: '2px solid var(--ink)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--ink-mute)', textTransform: 'uppercase' }}>
                              <th style={{ textAlign: 'left', padding: '4px' }}>Metric</th>
                              <th style={{ textAlign: 'right', padding: '4px' }}>Now</th>
                              <th style={{ textAlign: 'right', padding: '4px' }}>After</th>
                              <th style={{ textAlign: 'right', padding: '4px' }}>Δ Change</th>
                           </tr>
                        </thead>
                        <tbody>
                           <DeltaRow
                              label="Daily allowance"
                              now={fmt(res.r.before.allowance)}
                              after={fmt(res.r.after.allowance)}
                              deltaText={allowanceDiff === 0 ? 'no change' : allowanceDiff > 0 ? `up ${fmt(allowanceDiff)}` : `down ${fmt(Math.abs(allowanceDiff))}`}
                              deltaType={allowanceDiff > 0 ? 'better' : allowanceDiff < 0 ? 'worse' : 'neutral'}
                           />
                           <DeltaRow
                              label="Month-end buffer"
                              now={fmt(res.r.before.end.exp)}
                              after={fmt(res.r.after.end.exp)}
                              deltaText={endDiff === 0 ? 'no change' : endDiff > 0 ? `+${fmt(endDiff)}` : `-${fmt(Math.abs(endDiff))}`}
                              deltaType={endDiff > 0 ? 'better' : endDiff < 0 ? 'worse' : 'neutral'}
                           />
                           <DeltaRow
                              label="Risk status"
                              now={res.r.before.risk}
                              after={res.r.after.risk}
                              deltaText={res.r.before.risk === res.r.after.risk ? 'same' : res.r.after.risk}
                              deltaType={res.r.after.risk === 'Low' ? 'better' : 'worse'}
                           />
                           <DeltaRow
                              label="Health score"
                              now={`${res.r.before.health}/100`}
                              after={`${res.r.after.health}/100`}
                              deltaText={healthDiff === 0 ? 'no change' : healthDiff > 0 ? `+${healthDiff} pts` : `${healthDiff} pts`}
                              deltaType={healthDiff > 0 ? 'better' : healthDiff < 0 ? 'worse' : 'neutral'}
                           />
                        </tbody>
                     </table>

                     {/* Verdict & Stamp */}
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Pacing Assessment:</span>
                        <Stamp level={res.r.after.risk} />
                     </div>

                     <div style={{ background: 'var(--paper-card-subtle)', border: '1px solid var(--ink-rule)', padding: '10px', borderRadius: 'var(--r-sm)', marginBottom: '14px', fontSize: '0.88rem' }}>
                        <p style={{ margin: '0 0 4px', fontWeight: 600 }}>{res.r.verdict}</p>
                        <p style={{ margin: 0, color: 'var(--ink-mute)' }}><strong>Tip:</strong> {res.r.tip}</p>
                     </div>

                     {/* Commit or Discard Actions */}
                     <div className="row" style={{ gap: '10px', marginBottom: '14px' }}>
                        <button type="button" className="btn-primary" onClick={handleCommit} style={{ flex: 1 }}>
                           Commit Line Item ✓
                        </button>
                        <button type="button" className="ghost" onClick={() => setRes(null)}>
                           Discard
                        </button>
                     </div>

                     {/* “Sleep on it” Collapsible Section */}
                     {isWaitApplicable && w && (
                        <details style={{ marginTop: '12px', borderTop: '1px dashed var(--ink-rule)', paddingTop: '10px' }}>
                           <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', color: 'var(--ink)' }}>
                              💡 Not sure? Sleep on it (Alternative)
                           </summary>
                           <div style={{ marginTop: '10px', padding: '10px', background: 'var(--paper-card-subtle)', borderRadius: 'var(--r-sm)', border: '1px solid var(--ink-rule)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                                 <strong style={{ fontSize: '0.85rem' }}>Consider waiting until:</strong>
                                 <select
                                    value={safeWaitDay}
                                    onChange={e => setWaitDay(+e.target.value)}
                                    style={{ padding: '4px 8px', fontSize: '0.82rem', width: 'auto', minHeight: '34px' }}
                                 >
                                    {Array.from({ length: DAYS - s.day }, (_, i) => s.day + i + 1).map(d => {
                                       const billOnDay = s.bills.find(b => b.due === d)
                                       const label = billOnDay ? `Day ${d} (after ${billOnDay.name})` : `Day ${d}`
                                       return <option key={d} value={d}>{label}</option>
                                    })}
                                 </select>
                              </div>
                              <p style={{ fontSize: '0.85rem', margin: '0 0 6px' }}>
                                 Waiting until day {w.day} won't change where you end the month: about <strong>{fmt(w.endLater)}</strong> either way{gap ? '' : ' (small difference from rounding)'}.
                                 {w.cleared.length > 0
                                    ? ` What it does give you: you'll see ${w.cleared.map(b => b.name).join(', ')} (${fmt(dues)}) go through before you spend.`
                                    : ' What it gives you is a few more days to be sure you still want it.'}
                              </p>
                              {w.endLater < 0 ? (
                                 <p style={{ fontSize: '0.85rem', margin: 0, color: 'var(--status-danger)' }}>
                                    <strong>You'd still finish {fmt(-w.endLater)} in the red. Shrink or skip this by about {fmt(Math.ceil(-w.endLater))} to break even.</strong>
                                 </p>
                              ) : (
                                 <p style={{ fontSize: '0.85rem', margin: 0, color: 'var(--ink-mute)' }}>
                                    If you want a different month-end, the lever is the amount, not the date.
                                 </p>
                              )}
                           </div>
                        </details>
                     )}
                  </div>
               ) : (
                  <div className="card" style={{ padding: '24px', textAlign: 'center', color: 'var(--ink-mute)', border: '2px dashed var(--ink-rule)' }}>
                     <div style={{ fontSize: '2rem', marginBottom: '8px' }} aria-hidden="true">🧾</div>
                     <strong style={{ display: 'block', fontSize: '1rem', color: 'var(--ink)', marginBottom: '4px' }}>
                        Awaiting Simulation
                     </strong>
                     <p style={{ margin: 0, fontSize: '0.85rem' }}>
                        Fill in a decision on the left and click "Print Simulation Slip" to preview the financial impact before committing.
                     </p>
                  </div>
               )}
            </div>
         </div>
      </section>
   )
}