import type { State, Decision, Cat } from './types'
import { summary, fmt, DAYS } from './selectors'
import type { Summary } from './selectors'

export function charge(s: State, amount: number, cat: Cat, label: string, need: boolean, oneOff?: boolean): State {
   return { ...s, balance: s.balance - amount, nextId: s.nextId + 1, txs: [...s.txs, { id: s.nextId, day: s.day, amount, cat, label, need, oneOff }] }
}

/** Single place where a decision changes state. Used for both preview and commit, so they can never disagree. */
export function apply(s: State, d: Decision): State {
   switch (d.kind) {
      case 'purchase': return charge(s, d.amount, d.cat, d.label, d.need, true)
      case 'shock': return charge(s, d.amount, 'Shock', d.label, true, true)
      case 'subscription': {
         const c = charge(s, d.amount, 'Bills', d.label, false)
         return { ...c, nextId: c.nextId + 1, bills: [...c.bills, { id: c.nextId, name: d.label, amount: d.amount, due: s.day, paid: true, active: true, kind: 'subscription' }] }
      }
      case 'habit': return { ...s, nextId: s.nextId + 1, habits: [...s.habits, { id: s.nextId, label: d.label, perDay: d.perDay }] }
      case 'pauseSub': return { ...s, bills: s.bills.map(b => b.id === d.id ? { ...b, active: !b.active } : b) }
      case 'goal': {
         if (!s.goals.some(g => g.id === d.id)) return s
         return { ...s, balance: s.balance - d.amount, goals: s.goals.map(g => g.id === d.id ? { ...g, saved: g.saved + d.amount } : g) }
      }
   }
}

export function nextDay(s: State): State {
   if (s.day >= DAYS) return s
   let st = { ...s, day: s.day + 1 }
   st.habits.forEach(h => { st = charge(st, h.perDay, 'Habit', h.label, false) })
   st.bills.filter(b => b.active && !b.paid && b.due <= st.day).forEach(b => {
      st = charge(st, b.amount, 'Bills', b.name, true)
      st = { ...st, bills: st.bills.map(x => x.id === b.id ? { ...x, paid: true } : x) }
   })
   return st
}

export interface SimResult { before: Summary; after: Summary; verdict: string; tip: string }

export function simulate(s: State, d: Decision): SimResult {
   const before = summary(s), after = summary(apply(s, d))
   const slip = s.goals.filter(g => after.goalMonths[g.id] > before.goalMonths[g.id]).map(g => g.name)
   let verdict = `Daily allowance ${fmt(before.allowance)} → ${fmt(after.allowance)}. Month-end ${fmt(before.end.exp)} → ${fmt(after.end.exp)}. Risk: ${before.risk} → ${after.risk}.`
   if (slip.length) verdict += ` Slows: ${slip.join(', ')}.`
   const worse = after.risk !== before.risk && after.end.exp < before.end.exp
   // room = how much you can spend before your current risk level changes
   const room = before.end.exp >= 1000 ? before.end.exp - 1000 : before.end.exp
   const tip = worse
      ? (['purchase', 'shock', 'subscription'].includes(d.kind)
         ? (room > 0 ? `Keep it under ${fmt(room)} to hold your current risk level.` : 'Any extra spend pushes you into the red. Skip or shrink this.')
         : 'Try a smaller amount or pause a subscription first.')
      : after.end.exp < 0 ? 'This puts you below zero by month-end. Rethink it.'
         : 'Looks safe for your plan. Go for it.'
   return { before, after, verdict, tip }
}

/** Move time forward to `target`, assuming everyday spending continues at the current burn rate. */
export function advanceTo(s: State, target: number): State {
   let st = s
   while (st.day < Math.min(target, DAYS)) {
      const burn = summary(st).burn
      st = nextDay(st)
      st = charge(st, burn, 'Other', 'Projected everyday spend', false)  // oneOff unset, so it counts as recurring
   }
   return st
}

export interface WaitResult {
   day: number
   endNow: number
   endLater: number
   cleared: { name: string; amount: number }[]
}

export function simulateWait(s: State, d: Decision, target: number): WaitResult {
   const buyNow = advanceTo(apply(s, d), target)     // buy today, then time passes
   const buyLater = apply(advanceTo(s, target), d)   // time passes, then buy
   const cleared = s.bills.filter(b => b.active && !b.paid && b.due > s.day && b.due <= target).map(b => ({ name: b.name, amount: b.amount }))
   return { day: target, endNow: summary(buyNow).end.exp, endLater: summary(buyLater).end.exp, cleared }
}