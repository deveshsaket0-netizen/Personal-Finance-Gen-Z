import type { State, Risk } from './types'
export const BUDGET = 10000, DAYS = 30, PRIOR_BURN = 100, PRIOR_WEIGHT = 3
const clamp = (n: number, a = 0, b = 1) => Math.min(b, Math.max(a, n))
const sum = (a: number[]) => a.reduce((x, y) => x + y, 0)
const FIXED = ['Bills', 'Shock', 'Habit']
export interface Summary { safe: number; allowance: number; burn: number; daysLeft: number; end: { best: number; exp: number; worst: number }; risk: Risk; health: number; parts: { label: string; weight: number; score: number }[]; goalMonths: Record<number, number> }
/** All derived numbers come from here. Pure: state in, numbers out. */
export function summary(s: State): Summary {
    const daysLeft = DAYS - s.day + 1
    const dues = sum(s.bills.filter(b => b.active && !b.paid).map(b => b.amount))
    const habitDay = sum(s.habits.map(h => h.perDay))
    const safe = s.balance - dues - habitDay * (DAYS - s.day)

    // Everyday discretionary spend, including one-offs (used for health scoring)
    const nonFixed = s.txs.filter(t => !FIXED.includes(t.cat))
    // Recurring spend only: one-off purchases/shocks must not inflate the daily burn rate
    const recurring = nonFixed.filter(t => !t.oneOff)

    // smoothed burn rate: real spend blended with a prior so day 1 isn't misleading
    const burn = (sum(recurring.map(t => t.amount)) + PRIOR_BURN * PRIOR_WEIGHT) / (s.day + PRIOR_WEIGHT)
    const f = (m: number) => safe - burn * m * daysLeft
    const end = { best: f(.8), exp: f(1), worst: f(1.3) }
    const runway = burn > 0 ? safe / (burn * daysLeft) : 1
    const risk: Risk = end.exp >= BUDGET * .1 ? 'Low' : end.exp >= 0 ? 'Watch' : runway < .6 ? 'Critical' : 'High'

    const needs = sum(nonFixed.filter(t => t.need).map(t => t.amount)), dTot = sum(nonFixed.map(t => t.amount))
    const daily = Array.from({ length: s.day }, (_, i) => sum(nonFixed.filter(t => t.day === i + 1).map(t => t.amount)))
    const mean = sum(daily) / daily.length || 1
    const sd = Math.sqrt(sum(daily.map(x => (x - mean) ** 2)) / daily.length)
    const tgt = sum(s.goals.map(g => g.target)) || 1
    const parts = [
        { label: 'Runway coverage', weight: .3, score: clamp(end.exp >= 0 ? 1 : runway) },
        { label: 'Needs vs wants', weight: .2, score: dTot ? clamp(needs / dTot / .5) : 1 },
        { label: 'Savings progress', weight: .2, score: clamp(sum(s.goals.map(g => g.saved)) / tgt / (s.day / DAYS + .3)) },
        { label: 'Commitment coverage', weight: .15, score: dues ? clamp(s.balance / dues) : 1 },
        { label: 'Spending consistency', weight: .15, score: clamp(1 - sd / mean / 2) }]
    const health = Math.round(100 * sum(parts.map(p => p.score * p.weight)))

    // Goal ETA: known simplification. Capacity = month-end surplus + money already saved,
    // so moving cash into a goal doesn't shrink the pool (and never reports "slows").
    const savedTot = sum(s.goals.map(g => g.saved))
    const pool = Math.max(0, end.exp + savedTot)
    const cap = pool / Math.max(1, s.goals.length)
    const goalMonths = Object.fromEntries(s.goals.map(g => {
        const rem = g.target - g.saved, c = Math.min(g.monthly, cap)
        return [g.id, rem <= 0 ? 0 : c <= 0 ? Infinity : Math.ceil(rem / c)]
    }))
    return { safe, allowance: Math.max(0, safe) / daysLeft, burn, daysLeft, end, risk, health, parts, goalMonths }
}
export const fmt = (n: number) => (n < 0 ? '-' : '') + '₹' + Math.abs(Math.round(n)).toLocaleString('en-IN')